import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from apps.academics.models import ClassEnrollment, ClassSubject, Quarter


# DepEd Transmutation Table (Initial Grade → Transmuted Grade)
DEPED_TRANSMUTATION = {
    100.00: 100, 99.99: 99, 98.39: 98, 96.79: 97, 95.19: 96,
    93.59: 95, 91.99: 94, 90.39: 93, 88.79: 92, 87.19: 91,
    85.59: 90, 83.99: 89, 82.39: 88, 80.79: 87, 79.19: 86,
    77.59: 85, 75.99: 84, 74.39: 83, 72.79: 82, 71.19: 81,
    69.59: 80, 67.99: 79, 66.39: 78, 64.79: 77, 63.19: 76,
    61.59: 75, 59.99: 74, 58.39: 73, 56.79: 72, 55.19: 71,
    53.59: 70, 51.99: 69, 50.39: 68, 48.79: 67, 47.19: 66,
    45.59: 65, 43.99: 64, 42.39: 63, 40.79: 62, 39.19: 61,
    0.00: 60,
}


def transmute_grade(initial_grade):
    """
    Apply DepEd transmutation table to initial grade.
    Returns transmuted grade (60-100).
    """
    if initial_grade is None:
        return None
    
    initial_grade = float(initial_grade)
    
    # Find the appropriate transmuted grade
    for threshold in sorted(DEPED_TRANSMUTATION.keys(), reverse=True):
        if initial_grade >= threshold:
            return DEPED_TRANSMUTATION[threshold]
    
    return 60  # Minimum grade


class Grade(models.Model):
    """Student grade for a class-subject per quarter."""

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("computed", "Computed"),
        ("pending_approval", "Pending Approval"),
        ("published", "Published"),
        ("locked", "Locked"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_enrollment = models.ForeignKey(
        ClassEnrollment, on_delete=models.CASCADE, related_name="grades"
    )
    class_subject = models.ForeignKey(
        ClassSubject, on_delete=models.CASCADE, related_name="grades"
    )
    quarter = models.ForeignKey(Quarter, on_delete=models.CASCADE, related_name="grades")

    # DepEd Component Scores (raw scores, not weighted)
    ww_score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Written Work score (0-100)",
    )
    pt_score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Performance Task score (0-100)",
    )
    qa_score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Quarterly Assessment score (0-100)",
    )

    # Computed grades
    initial_grade = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Weighted average before transmutation",
    )
    transmuted_grade = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(60), MaxValueValidator(100)],
        help_text="Final grade after DepEd transmutation (60-100)",
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    remarks = models.TextField(blank=True, help_text="Teacher remarks")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["quarter", "class_enrollment"]
        unique_together = [["class_enrollment", "class_subject", "quarter"]]

    def __str__(self):
        student_name = self.class_enrollment.student.display_name
        subject_name = self.class_subject.subject.name
        return f"{student_name} - {subject_name} Q{self.quarter.number}"

    def compute_grade(self):
        """
        Compute initial grade and transmuted grade based on component scores.
        Uses weights from class_subject: ww_weight, pt_weight, qa_weight.
        """
        # Check if all component scores are present
        if self.ww_score is None or self.pt_score is None or self.qa_score is None:
            self.initial_grade = None
            self.transmuted_grade = None
            self.status = "draft"
            return

        # Get weights from class_subject
        ww_weight = float(self.class_subject.ww_weight) / 100
        pt_weight = float(self.class_subject.pt_weight) / 100
        qa_weight = float(self.class_subject.qa_weight) / 100

        # Compute weighted average (initial grade)
        self.initial_grade = (
            float(self.ww_score) * ww_weight
            + float(self.pt_score) * pt_weight
            + float(self.qa_score) * qa_weight
        )

        # Apply DepEd transmutation
        self.transmuted_grade = transmute_grade(self.initial_grade)
        
        # Update status
        if self.status == "draft":
            self.status = "computed"

    def save(self, *args, **kwargs):
        # Auto-compute grades on save
        self.compute_grade()
        super().save(*args, **kwargs)

    @property
    def is_passing(self):
        """Check if transmuted grade is passing (≥75)."""
        if self.transmuted_grade is None:
            return None
        return self.transmuted_grade >= 75


class GradePublishEvent(models.Model):
    """Audit trail for grade changes and publication."""

    ACTION_CHOICES = [
        ("computed", "Computed"),
        ("submitted", "Submitted for Approval"),
        ("approved", "Approved"),
        ("published", "Published"),
        ("unlocked", "Unlocked"),
        ("edited", "Edited"),
        ("reviewed", "Reviewed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name="publish_events")
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="grade_actions",
    )
    reason = models.TextField(blank=True, help_text="Reason for action (especially for unlock)")
    metadata = models.JSONField(default=dict, blank=True, help_text="Additional context")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=['grade', '-created_at']),
            models.Index(fields=['action', '-created_at']),
        ]

    def __str__(self):
        return f"{self.action} - {self.grade} by {self.actor}"


class GradeReviewComment(models.Model):
    """Review comments for grade approval workflow."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_subject = models.ForeignKey(
        ClassSubject, 
        on_delete=models.CASCADE, 
        related_name="grade_review_comments"
    )
    quarter = models.ForeignKey(
        Quarter, 
        on_delete=models.CASCADE, 
        related_name="grade_review_comments"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="grade_review_comments",
    )
    comment = models.TextField(help_text="Review comment or feedback")
    is_internal = models.BooleanField(
        default=False,
        help_text="Internal notes visible only to principals/admins"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=['class_subject', 'quarter', '-created_at']),
        ]

    def __str__(self):
        return f"Review comment on {self.class_subject} Q{self.quarter.number} by {self.author}"


class ConductRating(models.Model):
    """Student conduct/core values rating per quarter."""

    CORE_VALUE_CHOICES = [
        ("maka_diyos", "Maka-Diyos"),
        ("makatao", "Makatao"),
        ("makakalikasan", "Makakalikasan"),
        ("makabansa", "Makabansa"),
    ]

    RATING_CHOICES = [
        ("AO", "Always Observed"),
        ("SO", "Sometimes Observed"),
        ("RO", "Rarely Observed"),
        ("NO", "Not Observed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_enrollment = models.ForeignKey(
        ClassEnrollment, on_delete=models.CASCADE, related_name="conduct_ratings"
    )
    quarter = models.ForeignKey(
        Quarter, on_delete=models.CASCADE, related_name="conduct_ratings"
    )
    core_value = models.CharField(max_length=20, choices=CORE_VALUE_CHOICES)
    behavior = models.CharField(
        max_length=255, 
        help_text="Specific behavior statement (e.g., 'Expresses one's spiritual beliefs')"
    )
    rating = models.CharField(max_length=2, choices=RATING_CHOICES)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["class_enrollment", "quarter", "core_value"]
        unique_together = [["class_enrollment", "quarter", "core_value", "behavior"]]

    def __str__(self):
        return f"{self.class_enrollment.student.display_name} - {self.get_core_value_display()} Q{self.quarter.number}"


class ReportCard(models.Model):
    """Generated SF5 (Report Card) and SF10 (Form 137) records."""

    REPORT_TYPE_CHOICES = [
        ("sf5", "SF5 - Report Card"),
        ("sf10", "SF10 - Form 137"),
    ]

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("generated", "Generated"),
        ("signed", "Signed"),
        ("printed", "Printed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="report_cards",
        limit_choices_to={"role": "student"}
    )
    report_type = models.CharField(max_length=10, choices=REPORT_TYPE_CHOICES)
    school_year = models.CharField(max_length=20, help_text="e.g., 2024-2025")
    quarter = models.ForeignKey(
        Quarter,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="report_cards",
        help_text="Required for SF5, null for SF10"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="generated_report_cards"
    )
    generated_at = models.DateTimeField(null=True, blank=True)
    signed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="signed_report_cards"
    )
    signed_at = models.DateTimeField(null=True, blank=True)
    remarks = models.TextField(blank=True, help_text="Additional remarks or notes")
    metadata = models.JSONField(default=dict, blank=True, help_text="Additional report data")

    class Meta:
        ordering = ["-generated_at"]
        indexes = [
            models.Index(fields=["student", "report_type", "-generated_at"]),
            models.Index(fields=["school_year", "quarter"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.get_report_type_display()} - {self.student.display_name} ({self.school_year})"
