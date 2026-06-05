from django.contrib import admin
from .models import SchoolSettings


@admin.register(SchoolSettings)
class SchoolSettingsAdmin(admin.ModelAdmin):
    list_display = ['school_name', 'enrollment_enabled', 'updated_at', 'updated_by']
    readonly_fields = ['id', 'updated_at', 'updated_by']
    
    fieldsets = (
        ('Branding', {
            'fields': ('school_name', 'school_short_name', 'school_logo_url', 'primary_color', 'secondary_color')
        }),
        ('Enrollment', {
            'fields': ('enrollment_enabled', 'enrollment_message', 'enrollment_start_date', 'enrollment_end_date')
        }),
        ('Security Policies', {
            'fields': (
                'password_min_length', 
                'password_require_uppercase', 
                'password_require_lowercase',
                'password_require_digit',
                'password_require_special',
                'session_timeout_minutes',
                'max_login_attempts',
                'lockout_duration_minutes'
            )
        }),
        ('Metadata', {
            'fields': ('id', 'updated_at', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        # Only one instance allowed
        return not SchoolSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Cannot delete the settings
        return False
