import secrets
import string
import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


def generate_join_code():
    """Generate a unique 6-character alphanumeric join code."""
    max_attempts = 10
    for _ in range(max_attempts):
        code = "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
        if not Classroom.objects.filter(join_code=code).exists():
            return code
    return "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))


class AcademicYear(models.Model):
    """School year (e.g., SY 2024-2025)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    label = models.CharField(max_length=50, help_text="e.g., SY 2024-2025")
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False, help_text="Only one active at a time")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_date__gt=models.F("start_date")),
                name="academic_year_end_after_start",
            )
        ]

    def __str__(self):
        return self.label

    def save(self, *args, **kwargs):
        # Ensure only one academic year is current
        if self.is_current:
            AcademicYear.objects.filter(is_current=True).exclude(id=self.id).update(is_current=False)
        super().save(*args, **kwargs)


class Quarter(models.Model):
    """Grading quarter within an academic year."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name="quarters")
    number = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(4)])
    name = models.CharField(max_length=50, help_text="e.g., First Quarter, Q1")
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["academic_year", "number"]
        unique_together = [["academic_year", "number"]]
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_date__gt=models.F("start_date")),
                name="quarter_end_after_start",
            )
        ]

    def __str__(self):
        return f"{self.academic_year.label} - {self.name}"

    @property
    def is_active(self):
        """Check if current date is within quarter dates."""
        today = timezone.now().date()
        return self.start_date <= today <= self.end_date


class Subject(models.Model):
    """Master subject catalog."""

    STRAND_CHOICES = [
        ("", "None (JHS)"),
        ("STEM", "Science, Technology, Engineering, and Mathematics"),
        ("ABM", "Accountancy, Business, and Management"),
        ("HUMSS", "Humanities and Social Sciences"),
        ("GAS", "General Academic Strand"),
        ("TVL", "Technical-Vocational-Livelihood"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True, help_text="e.g., ENG7, MATH10, GEN_MATH")
    description = models.TextField(blank=True)
    grade_level = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(7), MaxValueValidator(12)],
        help_text="7-10 for JHS, 11-12 for SHS",
    )
    strand = models.CharField(
        max_length=10,
        choices=STRAND_CHOICES,
        blank=True,
        help_text="Required for SHS specialized subjects",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["grade_level", "name"]

    def __str__(self):
        strand_display = f" ({self.strand})" if self.strand else ""
        return f"{self.name} - Grade {self.grade_level}{strand_display}"


class Classroom(models.Model):
    """Homeroom/advisory class (e.g., Grade 7 - Einstein, Grade 11 STEM - A)."""

    STRAND_CHOICES = Subject.STRAND_CHOICES

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, help_text="e.g., Einstein, Section A")
    grade_level = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(7), MaxValueValidator(12)]
    )
    section = models.CharField(max_length=50, blank=True, help_text="Optional section identifier")
    strand = models.CharField(
        max_length=10,
        choices=STRAND_CHOICES,
        blank=True,
        help_text="Required for Grade 11-12",
    )
    adviser = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="advised_classes",
        limit_choices_to={"role": "teacher"},
    )
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name="classrooms")
    join_code = models.CharField(max_length=8, unique=True, default=generate_join_code)
    capacity = models.PositiveIntegerField(default=45, help_text="Maximum students")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["grade_level", "name"]
        unique_together = [["academic_year", "grade_level", "section", "strand"]]

    def __str__(self):
        strand_display = f" {self.strand}" if self.strand else ""
        return f"Grade {self.grade_level}{strand_display} - {self.name}"

    @property
    def full_name(self):
        """Display name with academic year."""
        return f"{self} ({self.academic_year.label})"

    @property
    def enrollment_count(self):
        """Current number of enrolled students."""
        return self.enrollments.filter(status="active").count()

    @property
    def is_full(self):
        """Check if classroom is at capacity."""
        return self.enrollment_count >= self.capacity

    def regenerate_join_code(self):
        """Generate a new join code with collision check."""
        max_attempts = 5
        for _ in range(max_attempts):
            new_code = generate_join_code()
            if not Classroom.objects.filter(join_code=new_code).exists():
                self.join_code = new_code
                self.save(update_fields=["join_code", "updated_at"])
                return
        # Fallback: force regenerate with unique suffix
        self.join_code = generate_join_code() + str(uuid.uuid4())[:2]
        self.save(update_fields=["join_code", "updated_at"])


class ClassSubject(models.Model):
    """Subject taught in a specific classroom (class-subject-teacher assignment)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name="class_subjects")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="class_subjects")
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="teaching_subjects",
        limit_choices_to={"role": "teacher"},
    )
    # DepEd grade component weights
    ww_weight = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=30.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Written Work weight (%)",
    )
    pt_weight = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=50.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Performance Task weight (%)",
    )
    qa_weight = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=20.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Quarterly Assessment weight (%)",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["classroom", "subject"]
        unique_together = [["classroom", "subject"]]

    def __str__(self):
        teacher_name = self.teacher.display_name if self.teacher else "No teacher"
        return f"{self.subject.name} in {self.classroom.name} ({teacher_name})"

    def clean(self):
        """Validate that weights sum to 100%."""
        from django.core.exceptions import ValidationError

        total = self.ww_weight + self.pt_weight + self.qa_weight
        if total != 100:
            raise ValidationError(f"Component weights must sum to 100% (currently {total}%)")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class ClassEnrollment(models.Model):
    """Student enrollment in a classroom."""

    STATUS_CHOICES = [
        ("active", "Active"),
        ("transferred", "Transferred"),
        ("dropped", "Dropped"),
        ("completed", "Completed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name="enrollments")
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="class_enrollments",
        limit_choices_to={"role": "student"},
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    enrolled_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, help_text="Transfer notes, special accommodations, etc.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["classroom", "student__profile__last_name"]
        unique_together = [["classroom", "student"]]

    def __str__(self):
        return f"{self.student.display_name} in {self.classroom}"



class SchoolEvent(models.Model):
    """School calendar events (holidays, activities, deadlines)."""
    
    EVENT_TYPE_CHOICES = [
        ('holiday', 'Holiday'),
        ('activity', 'School Activity'),
        ('deadline', 'Deadline'),
        ('exam', 'Examination'),
        ('meeting', 'Meeting'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES, default='other')
    start_date = models.DateField()
    end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Optional for multi-day events"
    )
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name='events',
        null=True,
        blank=True,
        help_text="Optional: Link to specific academic year"
    )
    is_school_wide = models.BooleanField(
        default=True,
        help_text="Visible to all users vs specific groups"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_events'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['start_date', 'title']
        indexes = [
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['event_type']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.start_date})"
    
    @property
    def is_multi_day(self):
        """Check if event spans multiple days."""
        return self.end_date and self.end_date > self.start_date
    
    @property
    def duration_days(self):
        """Calculate event duration in days."""
        if not self.end_date:
            return 1
        return (self.end_date - self.start_date).days + 1
