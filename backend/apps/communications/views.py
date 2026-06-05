from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.academics.permissions import IsAdminUser
from .models import Announcement, AnnouncementAttachment, AnnouncementRead, Notification, NotificationPreferences
from .serializers import (
    AnnouncementSerializer,
    AnnouncementAttachmentSerializer,
    AnnouncementReadSerializer,
    NotificationSerializer,
    PublishAnnouncementSerializer,
    NotificationPreferencesSerializer,
)


class AnnouncementViewSet(viewsets.ModelViewSet):
    """Announcement management."""

    queryset = Announcement.objects.select_related("author").prefetch_related("attachments").all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Show only published announcements to students
        if user.role == "student":
            queryset = queryset.filter(published_at__isnull=False, published_at__lte=timezone.now())

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