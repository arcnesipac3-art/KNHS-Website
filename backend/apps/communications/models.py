import uuid

from django.conf import settings
from django.db import models

from apps.academics.models import Classroom


class Announcement(models.Model):
    """School or class announcements."""

    AUDIENCE_TYPE_CHOICES = [
        ("school", "School-wide"),
        ("grade", "Grade Level"),
        ("strand", "Strand"),
        ("classroom", "Specific Classroom"),
        ("role", "Role-based"),
    ]

    PRIORITY_CHOICES = [
        ("normal", "Normal"),
        ("important", "Important"),
        ("urgent", "Urgent"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="announcements",
    )
    title = models.CharField(max_length=200)
    body = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="normal")

    # Audience targeting
    audience_type = models.CharField(max_length=20, choices=AUDIENCE_TYPE_CHOICES)
    audience_ref_id = models.UUIDField(
        null=True,
        blank=True,
        help_text="ID of grade_level, strand, classroom, or role if applicable",
    )
    audience_metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional targeting info (e.g., {'grade_level': 7, 'role': 'student'})",
    )

    # Scheduling
    published_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(
        null=True, blank=True, help_text="Optional expiration date"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]
        indexes = [
            models.Index(fields=["audience_type", "published_at"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_audience_type_display()})"

    @property
    def is_published(self):
        """Check if announcement is published."""
        return self.published_at is not None

    @property
    def is_expired(self):
        """Check if announcement is expired."""
        if not self.expires_at:
            return False
        from django.utils import timezone
        return timezone.now() > self.expires_at


class AnnouncementAttachment(models.Model):
    """File attachments for announcements."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    announcement = models.ForeignKey(
        Announcement, on_delete=models.CASCADE, related_name="attachments"
    )
    file_url = models.URLField()
    filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField(null=True, blank=True, help_text="Size in bytes")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.filename} - {self.announcement.title}"


class AnnouncementRead(models.Model):
    """Track which users have read announcements."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    announcement = models.ForeignKey(
        Announcement, on_delete=models.CASCADE, related_name="reads"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="announcement_reads"
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["announcement", "user"]]
        indexes = [
            models.Index(fields=["user", "read_at"]),
        ]

    def __str__(self):
        return f"{self.user.display_name} read {self.announcement.title}"


class Notification(models.Model):
    """In-app notifications for users."""

    TYPE_CHOICES = [
        ("assignment", "New Assignment"),
        ("grade", "Grade Published"),
        ("announcement", "New Announcement"),
        ("submission", "Submission Received"),
        ("material", "New Material"),
        ("general", "General"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="general")
    title = models.CharField(max_length=200)
    body = models.TextField()
    link = models.CharField(max_length=500, blank=True, help_text="Internal app link")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.title} for {self.user.display_name}"


class NotificationPreferences(models.Model):
    """User notification preferences for email and in-app notifications."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )

    # Email notification preferences
    email_assignments = models.BooleanField(default=True)
    email_grades = models.BooleanField(default=True)
    email_announcements = models.BooleanField(default=True)
    email_attendance = models.BooleanField(default=False)
    email_materials = models.BooleanField(default=False)

    # In-app notification preferences
    inapp_assignments = models.BooleanField(default=True)
    inapp_grades = models.BooleanField(default=True)
    inapp_announcements = models.BooleanField(default=True)
    inapp_attendance = models.BooleanField(default=True)
    inapp_materials = models.BooleanField(default=True)
    inapp_submissions = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Notification Preferences'
        verbose_name_plural = 'Notification Preferences'

    def __str__(self):
        return f'Preferences for {self.user.email}'