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


class MessageThread(models.Model):
    """Conversation thread between users for direct messaging."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='message_threads'
    )
    subject = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['-updated_at']),
        ]

    def __str__(self):
        return f'Thread {self.id} ({self.participants.count()} participants)'

    @property
    def last_message(self):
        """Get the most recent message in this thread."""
        return self.messages.order_by('-created_at').first()


class Message(models.Model):
    """Individual message in a conversation thread."""

    thread = models.ForeignKey(
        MessageThread,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['thread', '-created_at']),
            models.Index(fields=['sender', '-created_at']),
        ]

    def __str__(self):
        return f'Message from {self.sender.display_name} at {self.created_at}'


class CounselingCase(models.Model):
    """Counseling case management for guidance office."""

    CASE_TYPE_CHOICES = [
        ("academic", "Academic Concern"),
        ("behavioral", "Behavioral Issue"),
        ("personal", "Personal Problem"),
        ("social", "Social Issue"),
        ("family", "Family Problem"),
        ("health", "Health/Mental Health"),
        ("attendance", "Attendance Issue"),
        ("disciplinary", "Disciplinary Action"),
        ("referral", "Referral"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("open", "Open"),
        ("in_progress", "In Progress"),
        ("resolved", "Resolved"),
        ("closed", "Closed"),
        ("referred", "Referred"),
    ]

    SEVERITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("urgent", "Urgent"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="counseling_cases",
        limit_choices_to={"role": "student"}
    )
    counselor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_cases",
        limit_choices_to={"role": "guidance"}
    )
    case_type = models.CharField(max_length=20, choices=CASE_TYPE_CHOICES)
    case_type_other = models.CharField(max_length=100, blank=True, help_text="Required if case_type is 'other'")
    title = models.CharField(max_length=200)
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="medium")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    referral_source = models.CharField(max_length=100, blank=True, help_text="Who referred this case")
    referral_date = models.DateField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True, help_text="Notes on how the case was resolved")
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["student", "status"]),
            models.Index(fields=["counselor", "status"]),
            models.Index(fields=["case_type", "status"]),
            models.Index(fields=["severity", "status"]),
        ]

    def __str__(self):
        return f"{self.title} - {self.student.display_name} ({self.get_status_display()})"


class CounselingNote(models.Model):
    """Notes and updates for counseling cases."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        CounselingCase,
        on_delete=models.CASCADE,
        related_name="notes"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="counseling_notes"
    )
    note = models.TextField()
    is_private = models.BooleanField(
        default=False,
        help_text="Private notes are only visible to guidance staff"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["case", "-created_at"]),
        ]

    def __str__(self):
        return f"Note for {self.case.title} by {self.author.display_name if self.author else 'Unknown'}"