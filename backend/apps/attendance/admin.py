from django.contrib import admin
from .models import AttendanceRecord


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ["get_student_name", "get_classroom_name", "date", "status", "recorded_by"]
    list_filter = ["status", "date", "class_enrollment__classroom__grade_level"]
    search_fields = [
        "class_enrollment__student__email",
        "class_enrollment__student__profile__lrn",
        "class_enrollment__classroom__name",
    ]
    readonly_fields = ["recorded_by", "created_at", "updated_at"]
    ordering = ["-date", "class_enrollment__classroom"]
    date_hierarchy = "date"
    
    def get_student_name(self, obj):
        return obj.class_enrollment.student.display_name
    get_student_name.short_description = "Student"
    
    def get_classroom_name(self, obj):
        return obj.class_enrollment.classroom.name
    get_classroom_name.short_description = "Classroom"
