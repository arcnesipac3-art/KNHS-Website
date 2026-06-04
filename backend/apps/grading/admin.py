from django.contrib import admin
from .models import Grade, GradePublishEvent


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = [
        "get_student_name",
        "get_subject_name",
        "quarter",
        "ww_score",
        "pt_score",
        "qa_score",
        "transmuted_grade",
        "is_passing",
        "status",
    ]
    list_filter = [
        "status",
        "quarter__academic_year",
        "quarter",
        "class_subject__classroom__grade_level",
    ]
    search_fields = [
        "class_enrollment__student__email",
        "class_enrollment__student__profile__lrn",
        "class_subject__subject__name",
    ]
    readonly_fields = ["initial_grade", "transmuted_grade", "is_passing", "created_at", "updated_at"]
    ordering = ["quarter", "class_enrollment__classroom", "class_subject"]
    
    fieldsets = (
        ("Student & Subject", {
            "fields": ("class_enrollment", "class_subject", "quarter")
        }),
        ("Component Scores", {
            "fields": ("ww_score", "pt_score", "qa_score")
        }),
        ("Computed Grades", {
            "fields": ("initial_grade", "transmuted_grade", "is_passing"),
            "classes": ("collapse",)
        }),
        ("Status & Remarks", {
            "fields": ("status", "remarks")
        }),
        ("Metadata", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )
    
    def get_student_name(self, obj):
        return obj.class_enrollment.student.display_name
    get_student_name.short_description = "Student"
    
    def get_subject_name(self, obj):
        return obj.class_subject.subject.name
    get_subject_name.short_description = "Subject"


@admin.register(GradePublishEvent)
class GradePublishEventAdmin(admin.ModelAdmin):
    list_display = ["grade", "action", "actor", "created_at"]
    list_filter = ["action", "created_at"]
    search_fields = ["grade__class_enrollment__student__email", "actor__email", "reason"]
    readonly_fields = ["grade", "action", "actor", "reason", "metadata", "created_at"]
    ordering = ["-created_at"]
