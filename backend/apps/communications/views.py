from django.core.cache import cache
from django.db.models import Count, OuterRef, Q, Subquery
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.academics.permissions import IsAdminUser
from .models import Announcement, AnnouncementAttachment, AnnouncementRead, Notification, NotificationPreferences, Message, MessageThread, CounselingCase, CounselingNote, AnnouncementLike, AnnouncementComment, Friendship
from .serializers import (
    AnnouncementSerializer,
    AnnouncementAttachmentSerializer,
    AnnouncementReadSerializer,
    NotificationSerializer,
    PublishAnnouncementSerializer,
    NotificationPreferencesSerializer,
    MessageSerializer,
    MessageThreadSerializer,
    CreateMessageThreadSerializer,
    CreateMessageSerializer,
    CounselingCaseSerializer,
    CreateCounselingCaseSerializer,
    CounselingNoteSerializer,
    AnnouncementCommentSerializer,
    FriendshipSerializer,
    FriendshipCreateSerializer,
)
from .services import (
    broadcast_message_created,
    broadcast_thread_updated,
    create_message_for_thread,
    get_or_create_thread_for_participants,
)


class AnnouncementViewSet(viewsets.ModelViewSet):
    """Announcement management."""

    queryset = Announcement.objects.select_related("author", "author__profile").prefetch_related("attachments", "likes", "comments", "comments__user", "comments__user__profile").all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Show only published announcements to students
        if user.role == "student":
            queryset = queryset.filter(published_at__isnull=False, published_at__lte=timezone.now())

        # Cache published announcements for 5 minutes
        if user.role == "student" and self.action == "list":
            cache_key = f"announcements_list_{user.role}_{user.profile.grade_level}"
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return cached_data
            queryset = list(queryset)
            cache.set(cache_key, queryset, timeout=300)

        # Filter by audience type
        if user.role in ["student", "teacher"]:
            # Filter to relevant announcements based on user profile
            queryset = queryset.filter(
                Q(audience_type="school")
                | Q(
                    audience_type="grade",
                    audience_metadata__grade_level=user.profile.grade_level,
                )
                | Q(audience_type="role", audience_metadata__role=user.role)
            )

            # Add classroom-specific announcements for students
            if user.role == "student":
                enrolled_classrooms = user.class_enrollments.filter(status="active").values_list(
                    "classroom_id", flat=True
                )
                queryset = queryset | Announcement.objects.filter(
                    audience_type="classroom", audience_ref_id__in=enrolled_classrooms
                )

        # Filter expired
        if self.request.query_params.get("exclude_expired") == "true":
            queryset = queryset.filter(
                Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
            )

        return queryset.distinct()

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            # Teachers can create class announcements, admins all types
            if self.request.user.role == "teacher":
                return [IsAuthenticated()]
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        # Teachers limited to classroom scope
        if self.request.user.role == "teacher":
            serializer.save(author=self.request.user, audience_type="classroom")
        else:
            serializer.save(author=self.request.user)
        # Invalidate cache
        cache.delete_pattern("announcements_list_*")

    def perform_update(self, serializer):
        """Invalidate cache on update."""
        serializer.save()
        cache.delete_pattern("announcements_list_*")

    def perform_destroy(self, instance):
        """Invalidate cache on delete."""
        instance.delete()
        cache.delete_pattern("announcements_list_*")

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        """Publish an announcement."""
        announcement = self.get_object()

        if announcement.is_published:
            return Response(
                {"error": "Announcement is already published"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PublishAnnouncementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data.get("publish_now", True):
            announcement.published_at = timezone.now()
        else:
            announcement.published_at = serializer.validated_data["scheduled_time"]

        announcement.save()

        # Create notifications for target audience
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Determine target users based on audience type
        target_users = []
        if announcement.audience_type == "school":
            target_users = User.objects.filter(is_active=True)
        elif announcement.audience_type == "role":
            role = announcement.audience_metadata.get("role")
            if role:
                target_users = User.objects.filter(is_active=True, role=role)
        elif announcement.audience_type == "grade":
            grade_level = announcement.audience_metadata.get("grade_level")
            if grade_level:
                # Get students in this grade level
                from apps.academics.models import ClassEnrollment
                enrollments = ClassEnrollment.objects.filter(
                    classroom__grade_level=grade_level,
                    status="active"
                ).select_related("student")
                target_users = [e.student for e in enrollments]
        elif announcement.audience_type == "classroom":
            # Get students in specific classroom
            from apps.academics.models import ClassEnrollment
            enrollments = ClassEnrollment.objects.filter(
                classroom_id=announcement.audience_ref_id,
                status="active"
            ).select_related("student")
            target_users = [e.student for e in enrollments]
        
        # Create notifications
        from apps.communications.models import Notification
        notifications = []
        for user in target_users[:500]:  # Limit to 500 to avoid overwhelming database
            notifications.append(
                Notification(
                    user=user,
                    notification_type="announcement",
                    title=f"New Announcement: {announcement.title}",
                    body=announcement.body[:150] + ("..." if len(announcement.body) > 150 else ""),
                    link=f"/announcements",
                )
            )
        if notifications:
            Notification.objects.bulk_create(notifications)

        return Response({"message": "Announcement published successfully"})

    @action(detail=True, methods=["post"])
    def like(self, request, pk=None):
        """Like an announcement."""
        announcement = self.get_object()
        like, created = AnnouncementLike.objects.get_or_create(
            announcement=announcement, user=request.user
        )
        return Response({"message": "Liked", "created": created})

    @action(detail=True, methods=["post"])
    def unlike(self, request, pk=None):
        """Unlike an announcement."""
        announcement = self.get_object()
        AnnouncementLike.objects.filter(
            announcement=announcement, user=request.user
        ).delete()
        return Response({"message": "Unliked"})

    @action(detail=True, methods=["post"])
    def comment(self, request, pk=None):
        """Add a comment to an announcement."""
        announcement = self.get_object()
        content = request.data.get("content")
        if not content:
            return Response({"error": "Content is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        comment = AnnouncementComment.objects.create(
            announcement=announcement,
            user=request.user,
            content=content
        )
        return Response(AnnouncementCommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        """Mark announcement as read by current user."""
        announcement = self.get_object()

        # Create read record
        read_record, created = AnnouncementRead.objects.get_or_create(
            announcement=announcement, user=request.user
        )

        return Response(
            {"message": "Announcement marked as read", "already_read": not created}
        )

    @action(detail=False, methods=["get"])
    def unread(self, request):
        """Get unread announcements for current user."""
        queryset = self.get_queryset()

        # Exclude already read
        read_announcement_ids = AnnouncementRead.objects.filter(user=request.user).values_list(
            "announcement_id", flat=True
        )
        queryset = queryset.exclude(id__in=read_announcement_ids)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class NotificationViewSet(viewsets.ModelViewSet):
    """In-app notification management."""

    queryset = Notification.objects.select_related('user').all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users see only their own notifications
        queryset = self.queryset.filter(user=self.request.user)

        # Filter by read status
        is_read = self.request.query_params.get("is_read")
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == "true")

        return queryset

    def get_permissions(self):
        # Users can only update their own notifications (mark as read)
        if self.action in ["create", "destroy"]:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        """Mark all notifications as read for current user."""
        updated_count = Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True
        )

        return Response(
            {"message": f"Marked {updated_count} notifications as read", "count": updated_count}
        )

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        """Mark a single notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.save()

        return Response({"message": "Notification marked as read"})

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        """Get count of unread notifications."""
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"unread_count": count})


class NotificationPreferencesViewSet(viewsets.ModelViewSet):
    """User notification preferences management."""

    serializer_class = NotificationPreferencesSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only access their own preferences
        return NotificationPreferences.objects.filter(user=self.request.user)

    def get_object(self):
        # Get or create preferences for current user
        obj, created = NotificationPreferences.objects.get_or_create(
            user=self.request.user
        )
        return obj

    def perform_create(self, serializer):
        # Associate with current user
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        # Return single user's preferences instead of list
        obj = self.get_object()
        serializer = self.get_serializer(obj)
        return Response(serializer.data)


class MessageThreadViewSet(viewsets.ModelViewSet):
    """Direct messaging thread management."""

    serializer_class = MessageThreadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only access threads they participate in.
        # Annotate last-message fields so the thread list does not trigger
        # one query per conversation in the serializer.
        user = self.request.user
        latest_message = Message.objects.filter(thread=OuterRef("pk")).order_by("-created_at")
        return (
            MessageThread.objects.filter(participants=user)
            .prefetch_related("participants", "participants__profile")
            .annotate(
                unread_count_value=Count(
                    "messages",
                    filter=Q(messages__is_read=False) & ~Q(messages__sender=user),
                ),
                last_message_id=Subquery(latest_message.values("id")[:1]),
                last_message_content=Subquery(latest_message.values("content")[:1]),
                last_message_created_at=Subquery(latest_message.values("created_at")[:1]),
                last_message_sender_id=Subquery(latest_message.values("sender_id")[:1]),
                last_message_sender_name=Subquery(latest_message.values("sender__display_name")[:1]),
                last_message_sender_email=Subquery(latest_message.values("sender__email")[:1]),
            )
        )

    def perform_create(self, serializer):
        # Add current user as a participant when creating a thread
        thread = serializer.save()
        thread.participants.add(self.request.user)

    @action(detail=False, methods=["post"])
    def start_conversation(self, request):
        """Start a new conversation with participants."""
        serializer = CreateMessageThreadSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        from apps.accounts.models import User
        participants = User.objects.filter(id__in=serializer.validated_data["participant_ids"])
        thread, created = get_or_create_thread_for_participants(
            current_user=request.user,
            participant_ids=[participant.id for participant in participants],
            subject=serializer.validated_data.get("subject", ""),
        )
        message = create_message_for_thread(
            thread=thread,
            sender=request.user,
            content=serializer.validated_data["initial_message"],
        )
        broadcast_message_created(thread, message)

        return Response(
            {
                **MessageThreadSerializer(thread, context={"request": request}).data,
                "created": created,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        """Mark all messages in thread as read for current user."""
        thread = self.get_object()
        thread.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
        broadcast_thread_updated(thread)
        return Response({"message": "Messages marked as read"})

    @action(detail=True, methods=["delete"])
    def delete_conversation(self, request, pk=None):
        """Delete a conversation thread and all its messages."""
        thread = self.get_object()
        # Check if user is a participant
        if not thread.participants.filter(id=request.user.id).exists():
            return Response(
                {"error": "You can only delete conversations you participate in"},
                status=status.HTTP_403_FORBIDDEN
            )
        thread_id = thread.id
        thread.delete()
        return Response({"message": "Conversation deleted", "thread_id": thread_id})


class MessageViewSet(viewsets.ModelViewSet):
    """Individual message management."""

    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only access messages from threads they participate in
        queryset = Message.objects.filter(thread__participants=self.request.user).select_related(
            "sender", "thread"
        )
        thread_id = self.request.query_params.get("thread")
        if thread_id:
            queryset = queryset.filter(thread_id=thread_id)
        return queryset.distinct()

    def create(self, request, *args, **kwargs):
        thread_id = request.data.get("thread")
        content = (request.data.get("content") or "").strip()

        if not thread_id or not content:
            return Response(
                {"error": "thread and content are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            thread = MessageThread.objects.prefetch_related("participants").get(
                id=thread_id,
                participants=request.user,
            )
        except MessageThread.DoesNotExist:
            return Response(
                {"error": "Conversation not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        message = create_message_for_thread(
            thread=thread,
            sender=request.user,
            content=content,
        )
        broadcast_message_created(thread, message)
        return Response(
            MessageSerializer(message, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        """Mark a single message as read."""
        message = self.get_object()
        if message.sender != request.user:
            message.is_read = True
            message.save()
        return Response({"message": "Message marked as read"})


class CounselingCaseViewSet(viewsets.ModelViewSet):
    """Counseling case management."""

    serializer_class = CounselingCaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter queryset based on user role."""
        user = self.request.user
        
        if user.role == "guidance":
            # Guidance staff can see all cases
            return CounselingCase.objects.select_related('student', 'student__profile', 'counselor').all()
        elif user.role in ["admin", "principal"]:
            # Admin and principal can see all cases
            return CounselingCase.objects.select_related('student', 'student__profile', 'counselor').all()
        elif user.role == "student":
            # Students can only see their own cases
            return CounselingCase.objects.filter(student=user).select_related('student', 'student__profile', 'counselor')
        else:
            # Other roles cannot see counseling cases
            return CounselingCase.objects.none()

    def perform_create(self, serializer):
        """Create case with current user as counselor if they are guidance staff."""
        if self.request.user.role == "guidance":
            serializer.save(counselor=self.request.user)
        else:
            serializer.save()

    @action(detail=False, methods=['post'])
    def create_case(self, request):
        """Create a new counseling case."""
        serializer = CreateCounselingCaseSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        # Create the case
        case = CounselingCase.objects.create(
            student_id=serializer.validated_data['student_id'],
            case_type=serializer.validated_data['case_type'],
            case_type_other=serializer.validated_data.get('case_type_other', ''),
            title=serializer.validated_data['title'],
            description=serializer.validated_data['description'],
            severity=serializer.validated_data['severity'],
            referral_source=serializer.validated_data.get('referral_source', ''),
            referral_date=serializer.validated_data.get('referral_date'),
            counselor=request.user if request.user.role == "guidance" else None,
        )

        return Response(
            CounselingCaseSerializer(case, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def assign_counselor(self, request, pk=None):
        """Assign a counselor to the case (guidance only)."""
        if request.user.role != "guidance":
            return Response(
                {"error": "Only guidance staff can assign counselors"},
                status=status.HTTP_403_FORBIDDEN
            )

        case = self.get_object()
        counselor_id = request.data.get('counselor_id')
        
        if not counselor_id:
            return Response(
                {"error": "counselor_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        from apps.accounts.models import User
        try:
            counselor = User.objects.get(id=counselor_id, role="guidance")
        except User.DoesNotExist:
            return Response(
                {"error": "Counselor not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        case.counselor = counselor
        case.save()

        return Response(
            CounselingCaseSerializer(case, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update case status."""
        case = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {"error": "status is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_status not in [choice[0] for choice in CounselingCase.STATUS_CHOICES]:
            return Response(
                {"error": "Invalid status"},
                status=status.HTTP_400_BAD_REQUEST
            )

        case.status = new_status
        if new_status in ["resolved", "closed"]:
            case.resolved_at = timezone.now()
            case.resolution_notes = request.data.get('resolution_notes', '')
        
        case.save()

        return Response(
            CounselingCaseSerializer(case, context={'request': request}).data
        )

    @action(detail=True, methods=['get'])
    def notes(self, request, pk=None):
        """Get notes for this case."""
        case = self.get_object()
        
        # Filter private notes based on user role
        if request.user.role not in ["guidance", "admin", "principal"]:
            notes = case.notes.filter(is_private=False)
        else:
            notes = case.notes.all()
        
        serializer = CounselingNoteSerializer(notes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """Add a note to the case."""
        case = self.get_object()
        
        # Only guidance staff can add private notes
        is_private = request.data.get('is_private', False)
        if is_private and request.user.role not in ["guidance", "admin", "principal"]:
            is_private = False
        
        note = CounselingNote.objects.create(
            case=case,
            author=request.user,
            note=request.data.get('note'),
            is_private=is_private
        )
        
        return Response(
            CounselingNoteSerializer(note, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class FriendshipViewSet(viewsets.ModelViewSet):
    """Friend management - send, accept, reject, and list friends."""

    serializer_class = FriendshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get friendships for the current user."""
        user = self.request.user
        # Get friendships where user is either requester or recipient
        return Friendship.objects.filter(
            Q(requester=user) | Q(recipient=user)
        ).select_related("requester", "recipient").distinct()

    def get_serializer_class(self):
        """Use different serializer for creation."""
        if self.action == "create":
            return FriendshipCreateSerializer
        return FriendshipSerializer

    def perform_create(self, serializer):
        """Set requester to current user."""
        serializer.save(requester=self.request.user)

    @action(detail=False, methods=["get"])
    def my_friends(self, request):
        """Get list of accepted friends."""
        user = request.user
        friendships = Friendship.objects.filter(
            Q(requester=user) | Q(recipient=user),
            status="accepted"
        ).select_related("requester", "recipient")
        
        friends = []
        for friendship in friendships:
            friend = friendship.recipient if friendship.requester == user else friendship.requester
            friends.append({
                "id": friend.id,
                "display_name": friend.display_name,
                "email": friend.email,
                "role": friend.role,
                "friendship_id": friendship.id,
                "status": friendship.status,
            })
        
        return Response(friends)

    @action(detail=False, methods=["get"])
    def pending_requests(self, request):
        """Get pending friend requests for current user."""
        user = request.user
        pending = Friendship.objects.filter(
            recipient=user,
            status="pending"
        ).select_related("requester")
        
        serializer = FriendshipSerializer(pending, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        """Accept a friend request."""
        friendship = self.get_object()
        
        if friendship.recipient != request.user:
            return Response(
                {"error": "You can only accept requests sent to you"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if friendship.status != "pending":
            return Response(
                {"error": "This request is not pending"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        friendship.status = "accepted"
        friendship.save()
        
        serializer = FriendshipSerializer(friendship, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """Reject a friend request."""
        friendship = self.get_object()
        
        if friendship.recipient != request.user:
            return Response(
                {"error": "You can only reject requests sent to you"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if friendship.status != "pending":
            return Response(
                {"error": "This request is not pending"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        friendship.status = "rejected"
        friendship.save()
        
        serializer = FriendshipSerializer(friendship, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def unfriend(self, request, pk=None):
        """Remove a friend (delete the friendship)."""
        friendship = self.get_object()
        
        if friendship.requester != request.user and friendship.recipient != request.user:
            return Response(
                {"error": "You can only unfriend yourself"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        friendship.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
