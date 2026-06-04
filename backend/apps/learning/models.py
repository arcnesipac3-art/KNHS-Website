import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from apps.academics.models import ClassSubject, ClassEnrollment


class Assignment(models.Model):
    """Teacher-created assignment for a class-subject."""

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("closed", "Closed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_subject = models.ForeignKey(
        ClassSubject, on_delete=models.CASCADE, related_name="assignments"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(help_text="Assignment instructions and details")
    due_date = models.DateTimeField()
    max_score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=100.00,
        validators=[MinValueValidator(0)],
        help_text="Maximum possible score",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    allow_late_submission = models.BooleanField(default=True)
    attachment_url = models.URLField(blank=True, help_text="Optional attachment (template, rubric, etc.)")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_assignments",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-due_date", "-created_at"]

    def __str__(self):
        return f"{self.title} - {self.class_subject}"

    @property
    def is_overdue(self):
        """Check if assignment is past due date."""
        return timezone.now() > self.due_date

    @property
    def submission_count(self):
        """Count of submitted assignments."""
        return self.submissions.filter(status__in=["submitted", "late", "graded"]).count()


class Submission(models.Model):
    """Student submission for an assignment."""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("submitted", "Submitted"),
        ("late", "Late"),
        ("graded", "Graded"),
        ("returned", "Returned"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="submissions")
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="submissions",
        limit_choices_to={"role": "student"},
    )
    file_urls = models.JSONField(
        default=list, blank=True, help_text="List of submitted file URLs"
    )
    text_response = models.TextField(blank=True, help_text="Optional text answer")
    submitted_at = models.DateTimeField(null=True, blank=True)
    score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    feedback = models.TextField(blank=True, help_text="Teacher feedback")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    graded_at = models.DateTimeField(null=True, blank=True)
    graded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="graded_submissions",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-submitted_at", "-created_at"]
        unique_together = [["assignment", "student"]]

    def __str__(self):
        return f"{self.student.display_name} - {self.assignment.title}"

    @property
    def is_late(self):
        """Check if submission was late."""
        if not self.submitted_at:
            return False
        return self.submitted_at > self.assignment.due_date

    def submit(self):
        """Mark submission as submitted and check if late."""
        self.submitted_at = timezone.now()
        if self.is_late:
            self.status = "late"
        else:
            self.status = "submitted"
        self.save()


class LearningMaterial(models.Model):
    """Learning materials uploaded by teachers (modules, DLL, worksheets)."""

    TYPE_CHOICES = [
        ("module", "Module"),
        ("dll", "Daily Lesson Log"),
        ("worksheet", "Worksheet"),
        ("reference", "Reference Material"),
        ("video", "Video Link"),
        ("other", "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_subject = models.ForeignKey(
        ClassSubject, on_delete=models.CASCADE, related_name="learning_materials"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    material_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="other")
    file_url = models.URLField(help_text="File storage URL or external link")
    file_size = models.BigIntegerField(null=True, blank=True, help_text="Size in bytes")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_materials",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.class_subject}"
