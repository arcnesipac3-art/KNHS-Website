from rest_framework import serializers
from django.utils import timezone

from .models import Announcement, AnnouncementAttachment, AnnouncementRead, Notification


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
