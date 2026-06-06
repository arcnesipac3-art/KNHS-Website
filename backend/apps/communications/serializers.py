from rest_framework import serializers
from django.utils import timezone

from .models import Announcement, AnnouncementAttachment, AnnouncementRead, Notification, NotificationPreferences, Message, MessageThread, CounselingCase, CounselingNote


class AnnouncementAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnnouncementAttachment
        fields = ["id", "file_url", "filename", "file_size", "created_at"]
        read_only_fields = ["id", "created_at"]


class AnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.display_name", read_only=True)
    audience_type_display = serializers.CharField(source="get_audience_type_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    attachments = AnnouncementAttachmentSerializer(many=True, read_only=True)
    is_published = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    is_read = serializers.SerializerMethodField()
    audience_ref_name = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            "id",
            "author",
            "author_name",
            "title",
            "body",
            "priority",
            "priority_display",
            "audience_type",
            "audience_type_display",
            "audience_ref_id",
            "audience_ref_name",
            "audience_metadata",
            "published_at",
            "expires_at",
            "is_published",
            "is_expired",
            "is_read",
            "attachments",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "author", "created_at", "updated_at"]

    def get_is_read(self, obj):
        """Check if current user has read this announcement."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return AnnouncementRead.objects.filter(
                announcement=obj, user=request.user
            ).exists()
        return False

    def get_audience_ref_name(self, obj):
        """Get the name of the audience reference object."""
        if obj.audience_type == "classroom" and obj.audience_ref_id:
            try:
                from apps.academics.models import Classroom
                classroom = Classroom.objects.get(id=obj.audience_ref_id)
                return f"{classroom.name} - Grade {classroom.grade_level} {classroom.section}"
            except Classroom.DoesNotExist:
                return None
        elif obj.audience_type == "grade":
            return obj.audience_metadata.get("grade_level", "")
        elif obj.audience_type == "strand":
            return obj.audience_metadata.get("strand_name", "")
        elif obj.audience_type == "role":
            return obj.audience_metadata.get("role", "").title()
        return None


class AnnouncementReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnnouncementRead
        fields = ["id", "announcement", "user", "read_at"]
        read_only_fields = ["id", "user", "read_at"]


class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(source="get_notification_type_display", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "notification_type",
            "notification_type_display",
            "title",
            "body",
            "link",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]


class PublishAnnouncementSerializer(serializers.Serializer):
    """Serializer for publishing an announcement."""
    publish_now = serializers.BooleanField(default=True)
    scheduled_time = serializers.DateTimeField(required=False)

    def validate(self, data):
        """If not publishing now, scheduled_time is required."""
        if not data.get("publish_now") and not data.get("scheduled_time"):
            raise serializers.ValidationError("scheduled_time is required if not publishing now")
        
        if data.get("scheduled_time") and data["scheduled_time"] < timezone.now():
            raise serializers.ValidationError("scheduled_time must be in the future")
        
        return data


class NotificationPreferencesSerializer(serializers.ModelSerializer):
    """Serializer for user notification preferences."""

    class Meta:
        model = NotificationPreferences
        fields = [
            'email_assignments',
            'email_grades',
            'email_announcements',
            'email_attendance',
            'email_materials',
            'inapp_assignments',
            'inapp_grades',
            'inapp_announcements',
            'inapp_attendance',
            'inapp_materials',
            'inapp_submissions',
        ]


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for individual messages."""

    sender_name = serializers.CharField(source="sender.display_name", read_only=True)
    sender_email = serializers.EmailField(source="sender.email", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "thread",
            "sender",
            "sender_name",
            "sender_email",
            "content",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["id", "sender", "created_at"]


class MessageThreadSerializer(serializers.ModelSerializer):
    """Serializer for message threads."""

    participants_detail = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = MessageThread
        fields = [
            "id",
            "participants",
            "participants_detail",
            "subject",
            "last_message",
            "unread_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_participants_detail(self, obj):
        """Get detailed participant information."""
        request = self.context.get("request")
        participants = []
        for user in obj.participants.all():
            participants.append({
                "id": str(user.id),
                "name": user.display_name,
                "email": user.email,
                "role": user.role,
                "is_current_user": request and request.user == user,
            })
        return participants

    def get_last_message(self, obj):
        """Get the last message in the thread."""
        last_message = obj.last_message
        if last_message:
            return MessageSerializer(last_message, context=self.context).data
        return None

    def get_unread_count(self, obj):
        """Get unread message count for current user."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0


class CreateMessageThreadSerializer(serializers.Serializer):
    """Serializer for creating a new message thread."""

    participant_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        help_text="List of user IDs to include in the thread"
    )
    subject = serializers.CharField(max_length=200, required=False, allow_blank=True)
    initial_message = serializers.CharField(required=True)

    def validate_participant_ids(self, value):
        """Validate that all participant IDs exist and are not the current user."""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required")

        from apps.accounts.models import User
        users = User.objects.filter(id__in=value)
        
        if users.count() != len(value):
            raise serializers.ValidationError("One or more users not found")
        
        if request.user.id in value:
            raise serializers.ValidationError("Cannot include yourself as a participant")
        
        return value


class CreateMessageSerializer(serializers.Serializer):
    """Serializer for creating a new message in a thread."""

    content = serializers.CharField(required=True)


class CounselingNoteSerializer(serializers.ModelSerializer):
    """Serializer for counseling case notes."""

    author_name = serializers.CharField(source="author.display_name", read_only=True)

    class Meta:
        model = CounselingNote
        fields = [
            "id",
            "case",
            "author",
            "author_name",
            "note",
            "is_private",
            "created_at",
        ]
        read_only_fields = ["id", "author", "created_at"]


class CounselingCaseSerializer(serializers.ModelSerializer):
    """Serializer for counseling cases."""

    student_name = serializers.CharField(source="student.display_name", read_only=True)
    student_email = serializers.EmailField(source="student.email", read_only=True)
    student_lrn = serializers.CharField(source="student.profile.lrn", read_only=True)
    student_grade_level = serializers.IntegerField(source="student.profile.grade_level", read_only=True)
    counselor_name = serializers.CharField(source="counselor.display_name", read_only=True)
    case_type_display = serializers.CharField(source="get_case_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    severity_display = serializers.CharField(source="get_severity_display", read_only=True)
    notes_count = serializers.SerializerMethodField()

    class Meta:
        model = CounselingCase
        fields = [
            "id",
            "student",
            "student_name",
            "student_email",
            "student_lrn",
            "student_grade_level",
            "counselor",
            "counselor_name",
            "case_type",
            "case_type_display",
            "case_type_other",
            "title",
            "description",
            "severity",
            "severity_display",
            "status",
            "status_display",
            "referral_source",
            "referral_date",
            "resolution_notes",
            "resolved_at",
            "created_at",
            "updated_at",
            "notes_count",
        ]
        read_only_fields = [
            "id",
            "resolved_at",
            "created_at",
            "updated_at",
        ]

    def get_notes_count(self, obj):
        """Get count of notes for this case."""
        return obj.notes.count()


class CreateCounselingCaseSerializer(serializers.Serializer):
    """Serializer for creating a new counseling case."""

    student_id = serializers.UUIDField()
    case_type = serializers.ChoiceField(choices=CounselingCase.CASE_TYPE_CHOICES)
    case_type_other = serializers.CharField(max_length=100, required=False, allow_blank=True)
    title = serializers.CharField(max_length=200)
    description = serializers.CharField()
    severity = serializers.ChoiceField(choices=CounselingCase.SEVERITY_CHOICES, default="medium")
    referral_source = serializers.CharField(max_length=100, required=False, allow_blank=True)
    referral_date = serializers.DateField(required=False, allow_null=True)

    def validate_student_id(self, value):
        """Validate that the student exists."""
        from apps.accounts.models import User
        try:
            student = User.objects.get(id=value, role="student")
        except User.DoesNotExist:
            raise serializers.ValidationError("Student not found")
        return value

    def validate(self, data):
        """Validate the case_type_other field."""
        if data.get("case_type") == "other" and not data.get("case_type_other"):
            raise serializers.ValidationError("case_type_other is required when case_type is 'other'")
        return data