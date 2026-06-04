import uuid

from django.conf import settings
from django.db import models

from apps.academics.models import ClassEnrollment, Classroom


class AttendanceRecord(models.Model):
    """Daily attendance record for a student in a classroom."""

    STATUS_CHOICES = [
        ("P", "Present"),
        ("A", "Absent"),
        ("L", "Late"),
        ("E", "Excused"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_enrollment = models.ForeignKey(
        ClassEnrollment, on_delete=models.CASCADE, related_name="attendance_records"
    )
    date = models.DateField()
    status = models.CharField(max_length=1, choices=STATUS_CHOICES, default="P")
    notes = models.TextField(blank=True, help_text="Optional notes (reason for absence, etc.)")
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="recorded_attendance",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date"]
        unique_together = [["class_enrollment", "date"]]
        indexes = [
            models.Index(fields=["date", "status"]),
        ]

    def __str__(self):
        student_name = self.class_enrollment.student.display_name
        return f"{student_name} - {self.date} - {self.get_status_display()}"
