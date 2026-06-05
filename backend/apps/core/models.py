import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, MinLengthValidator


class SchoolSettings(models.Model):
    """
    Singleton model for school-wide settings.
    Only one instance should exist.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Branding
    school_name = models.CharField(max_length=200, default="Kiwalan National High School")
    school_short_name = models.CharField(max_length=50, default="KNHS")
    school_logo_url = models.URLField(blank=True, help_text="URL to school logo image")
    primary_color = models.CharField(
        max_length=7, 
        default="#6B21A8",
        help_text="Primary brand color (hex format: #RRGGBB)"
    )
    secondary_color = models.CharField(
        max_length=7,
        default="#FCD34D", 
        help_text="Secondary brand color (hex format: #RRGGBB)"
    )
    
    # Enrollment
    enrollment_enabled = models.BooleanField(
        default=True,
        help_text="Enable or disable public enrollment applications"
    )
    enrollment_message = models.TextField(
        blank=True,
        help_text="Message to display when enrollment is closed"
    )
    enrollment_start_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when enrollment opens"
    )
    enrollment_end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when enrollment closes"
    )
    
    # Security Policies
    password_min_length = models.PositiveSmallIntegerField(
        default=8,
        validators=[MinValueValidator(6), MaxValueValidator(32)],
        help_text="Minimum password length (6-32 characters)"
    )
    password_require_uppercase = models.BooleanField(
        default=True,
        help_text="Require at least one uppercase letter"
    )
    password_require_lowercase = models.BooleanField(
        default=True,
        help_text="Require at least one lowercase letter"
    )
    password_require_digit = models.BooleanField(
        default=True,
        help_text="Require at least one digit"
    )
    password_require_special = models.BooleanField(
        default=False,
        help_text="Require at least one special character"
    )
    session_timeout_minutes = models.PositiveSmallIntegerField(
        default=480,  # 8 hours
        validators=[MinValueValidator(15), MaxValueValidator(1440)],  # 15 min to 24 hours
        help_text="Session timeout in minutes (15-1440)"
    )
    max_login_attempts = models.PositiveSmallIntegerField(
        default=5,
        validators=[MinValueValidator(3), MaxValueValidator(10)],
        help_text="Maximum failed login attempts before lockout (3-10)"
    )
    lockout_duration_minutes = models.PositiveSmallIntegerField(
        default=30,
        validators=[MinValueValidator(5), MaxValueValidator(120)],
        help_text="Account lockout duration in minutes (5-120)"
    )
    
    # Metadata
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='settings_updates'
    )
    
    class Meta:
        verbose_name = "School Settings"
        verbose_name_plural = "School Settings"
    
    def __str__(self):
        return f"{self.school_name} Settings"
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        if not self.pk and SchoolSettings.objects.exists():
            raise ValueError("Only one SchoolSettings instance is allowed")
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """Get or create the singleton settings instance."""
        settings, created = cls.objects.get_or_create(
            pk=cls.objects.first().pk if cls.objects.exists() else uuid.uuid4()
        )
        return settings
