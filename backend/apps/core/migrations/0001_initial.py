# Generated migration for School Settings

import uuid
import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SchoolSettings',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('school_name', models.CharField(default='Kalangitan National High School', max_length=200)),
                ('school_short_name', models.CharField(default='KNHS', max_length=50)),
                ('school_logo_url', models.URLField(blank=True, help_text='URL to school logo image')),
                ('primary_color', models.CharField(default='#6B21A8', help_text='Primary brand color (hex format: #RRGGBB)', max_length=7)),
                ('secondary_color', models.CharField(default='#FCD34D', help_text='Secondary brand color (hex format: #RRGGBB)', max_length=7)),
                ('enrollment_enabled', models.BooleanField(default=True, help_text='Enable or disable public enrollment applications')),
                ('enrollment_message', models.TextField(blank=True, help_text='Message to display when enrollment is closed')),
                ('enrollment_start_date', models.DateField(blank=True, help_text='Date when enrollment opens', null=True)),
                ('enrollment_end_date', models.DateField(blank=True, help_text='Date when enrollment closes', null=True)),
                ('password_min_length', models.PositiveSmallIntegerField(default=8, help_text='Minimum password length (6-32 characters)', validators=[django.core.validators.MinValueValidator(6), django.core.validators.MaxValueValidator(32)])),
                ('password_require_uppercase', models.BooleanField(default=True, help_text='Require at least one uppercase letter')),
                ('password_require_lowercase', models.BooleanField(default=True, help_text='Require at least one lowercase letter')),
                ('password_require_digit', models.BooleanField(default=True, help_text='Require at least one digit')),
                ('password_require_special', models.BooleanField(default=False, help_text='Require at least one special character')),
                ('session_timeout_minutes', models.PositiveSmallIntegerField(default=480, help_text='Session timeout in minutes (15-1440)', validators=[django.core.validators.MinValueValidator(15), django.core.validators.MaxValueValidator(1440)])),
                ('max_login_attempts', models.PositiveSmallIntegerField(default=5, help_text='Maximum failed login attempts before lockout (3-10)', validators=[django.core.validators.MinValueValidator(3), django.core.validators.MaxValueValidator(10)])),
                ('lockout_duration_minutes', models.PositiveSmallIntegerField(default=30, help_text='Account lockout duration in minutes (5-120)', validators=[django.core.validators.MinValueValidator(5), django.core.validators.MaxValueValidator(120)])),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='settings_updates', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'School Settings',
                'verbose_name_plural': 'School Settings',
            },
        ),
    ]
