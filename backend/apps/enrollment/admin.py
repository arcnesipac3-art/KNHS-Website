from django.contrib import admin
from django.utils.html import format_html
from .models import EnrollmentApplication, EnrollmentStatusHistory


@admin.register(EnrollmentApplication)
class EnrollmentApplicationAdmin(admin.ModelAdmin):
    """
    Admin interface for enrollment applications
    """
    list_display = [
        'tracking_number',
        'applicant_name',
        'grade_level',
        'strand',
        'status_badge',
        'submitted_at',
        'reviewed_by',
    ]
    list_filter = [
        'status',
        'grade_level',
        'strand',
        'submitted_at',
    ]
    search_fields = [
        'tracking_number',
        'applicant_data__personal__first_name',
        'applicant_data__personal__last_name',
        'applicant_data__personal__lrn',
        'applicant_data__contact__email',
    ]
    readonly_fields = [
        'id',
        'tracking_number',
        'submitted_at',
        'updated_at',
        'reviewed_at',
        'applicant_name',
        'applicant_email',
        'applicant_phone',
        'applicant_lrn',
    ]
    fieldsets = [
        ('Application Info', {
            'fields': [
                'id',
                'tracking_number',
                'status',
                'submitted_at',
                'updated_at',
            ]
        }),
        ('Applicant Summary', {
            'fields': [
                'applicant_name',
                'applicant_email',
                'applicant_phone',
                'applicant_lrn',
            ]
        }),
        ('Academic Information', {
            'fields': [
                'grade_level',
                'strand',
            ]
        }),
        ('Application Data', {
            'fields': [
                'applicant_data',
                'notes',
            ],
            'classes': ['collapse'],
        }),
        ('Review', {
            'fields': [
                'reviewed_by',
                'reviewed_at',
                'reviewer_notes',
            ]
        }),
    ]
    
    def status_badge(self, obj):
        """Display status with color badge"""
        colors = {
            'pending': '#F59E0B',
            'under_review': '#3B82F6',
            'approved': '#10B981',
            'rejected': '#EF4444',
        }
        color = colors.get(obj.status, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 12px; '
            'border-radius: 12px; font-size: 12px; font-weight: 600;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def has_add_permission(self, request):
        """Disable adding applications through admin (use public form)"""
        return False


@admin.register(EnrollmentStatusHistory)
class EnrollmentStatusHistoryAdmin(admin.ModelAdmin):
    """
    Admin interface for enrollment status history
    """
    list_display = [
        'application',
        'from_status',
        'to_status',
        'changed_by',
        'changed_at',
    ]
    list_filter = [
        'from_status',
        'to_status',
        'changed_at',
    ]
    search_fields = [
        'application__tracking_number',
        'notes',
    ]
    readonly_fields = [
        'id',
        'application',
        'from_status',
        'to_status',
        'changed_by',
        'changed_at',
    ]
    
    def has_add_permission(self, request):
        """Disable manual creation of history entries"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Make history read-only"""
        return False
