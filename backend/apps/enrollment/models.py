import uuid
import random
import string
from django.db import models
from django.utils import timezone
from apps.accounts.models import User


def generate_tracking_number():
    """Generate unique tracking number in format ENR-{YEAR}-{RANDOM8}"""
    year = timezone.now().year
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f'ENR-{year}-{random_part}'


class EnrollmentApplication(models.Model):
    """
    Enrollment application model for new student applications.
    Stores applicant data as JSON for flexibility.
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Needs Revision'),
    ]
    
    GRADE_LEVEL_CHOICES = [
        ('7', 'Grade 7'),
        ('8', 'Grade 8'),
        ('9', 'Grade 9'),
        ('10', 'Grade 10'),
        ('11', 'Grade 11'),
        ('12', 'Grade 12'),
    ]
    
    STRAND_CHOICES = [
        ('STEM', 'STEM - Science, Technology, Engineering, Mathematics'),
        ('ABM', 'ABM - Accountancy, Business, Management'),
        ('HUMSS', 'HUMSS - Humanities and Social Sciences'),
        ('GAS', 'GAS - General Academic Strand'),
        ('TVL', 'TVL - Technical-Vocational-Livelihood'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tracking_number = models.CharField(
        max_length=20,
        unique=True,
        default=generate_tracking_number,
        editable=False,
        db_index=True
    )
    
    # Application data stored as JSON
    applicant_data = models.JSONField(
        help_text='JSON data containing personal, contact, academic, guardian, and document info'
    )
    
    # Academic info
    grade_level = models.CharField(max_length=2, choices=GRADE_LEVEL_CHOICES)
    strand = models.CharField(
        max_length=10,
        choices=STRAND_CHOICES,
        null=True,
        blank=True,
        help_text='Required for Grade 11 and 12'
    )
    
    # Status and review
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True
    )
    reviewer_notes = models.TextField(
        blank=True,
        help_text='Notes from registrar/admin for the applicant'
    )
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_applications'
    )
    
    # Optional notes from applicant
    notes = models.TextField(blank=True)
    
    # Timestamps
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-submitted_at']
        verbose_name = 'Enrollment Application'
        verbose_name_plural = 'Enrollment Applications'
        indexes = [
            models.Index(fields=['status', '-submitted_at']),
            models.Index(fields=['grade_level', 'status']),
        ]
    
    def __str__(self):
        personal = self.applicant_data.get('personal', {})
        name = f"{personal.get('first_name', '')} {personal.get('last_name', '')}".strip()
        return f"{self.tracking_number} - {name or 'Unknown'}"
    
    def save(self, *args, **kwargs):
        # Ensure tracking number is generated
        if not self.tracking_number:
            self.tracking_number = generate_tracking_number()
        
        # Validate strand requirement for SHS
        if self.grade_level in ['11', '12'] and not self.strand:
            from django.core.exceptions import ValidationError
            raise ValidationError('Strand is required for Grade 11 and 12')
        
        super().save(*args, **kwargs)
    
    @property
    def applicant_name(self):
        """Get full name of applicant"""
        personal = self.applicant_data.get('personal', {})
        first = personal.get('first_name', '')
        middle = personal.get('middle_name', '')
        last = personal.get('last_name', '')
        suffix = personal.get('suffix', '')
        
        name_parts = [first, middle, last, suffix]
        return ' '.join(filter(None, name_parts))
    
    @property
    def applicant_email(self):
        """Get email of applicant"""
        return self.applicant_data.get('contact', {}).get('email', '')
    
    @property
    def applicant_phone(self):
        """Get phone of applicant"""
        return self.applicant_data.get('contact', {}).get('phone', '')
    
    @property
    def applicant_lrn(self):
        """Get LRN of applicant"""
        return self.applicant_data.get('personal', {}).get('lrn', '')


class EnrollmentStatusHistory(models.Model):
    """
    Track status changes for audit trail
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(
        EnrollmentApplication,
        on_delete=models.CASCADE,
        related_name='status_history'
    )
    from_status = models.CharField(max_length=20)
    to_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='enrollment_status_changes'
    )
    notes = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-changed_at']
        verbose_name = 'Status History'
        verbose_name_plural = 'Status Histories'
    
    def __str__(self):
        return f"{self.application.tracking_number}: {self.from_status} → {self.to_status}"
