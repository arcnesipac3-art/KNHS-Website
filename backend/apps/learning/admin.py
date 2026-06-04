from django.contrib import admin
from .models import Assignment, Submission, LearningMaterial


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ["title", "class_subject", "due_date", "max_score", "status", "submission_count", "created_at"]
    list_filter = ["status", "due_date", "class_subject__classroom__grade_level"]
    search_fields = ["title", "description", "class_subject__subject__name"]
    readonly_fields = ["created_by", "submission_count", "is_overdue", "created_at", "updated_at"]
    ordering = ["-due_date"]
    
    fieldsets = (
        ("Assignment Info", {
            "fields": ("class_subject", "title", "description", "status")
        }),
        ("Scoring", {
            "fields": ("due_date", "max_score", "allow_late_submission", "attachment_url")
        }),
        ("Metadata", {
            "fields": ("created_by", "submission_count", "is_overdue", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ["student", "assignment", "status", "score", "submitted_at", "is_late"]
    list_filter = ["status", "submitted_at"]
    search_fields = ["student__email", "student__profile__lrn", "assignment__title"]
    readonly_fields = ["student", "assignment", "submitted_at", "is_late", "graded_at", "graded_by", "created_at", "updated_at"]
    ordering = ["-submitted_at"]


@admin.register(LearningMaterial)
class LearningMaterialAdmin(admin.ModelAdmin):
    list_display = ["title", "class_subject", "material_type", "uploaded_by", "created_at"]
    list_filter = ["material_type", "created_at"]
    search_fields = ["title", "description", "class_subject__subject__name"]
    readonly_fields = ["uploaded_by", "created_at", "updated_at"]
    ordering = ["-created_at"]
