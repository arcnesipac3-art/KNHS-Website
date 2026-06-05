from django.contrib import admin
from .models import Grade, GradePublishEvent, GradeReviewComment, ConductRating


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


@admin.register(GradeReviewComment)
class GradeReviewCommentAdmin(admin.ModelAdmin):
    list_display = ["get_subject_name", "quarter", "author", "is_internal", "created_at"]
    list_filter = ["is_internal", "created_at", "quarter__academic_year"]
    search_fields = ["class_subject__subject__name", "author__email", "comment"]
    readonly_fields = ["author", "created_at"]
    ordering = ["-created_at"]
    
    fieldsets = (
        ("Grade Set", {
            "fields": ("class_subject", "quarter")
        }),
        ("Comment", {
            "fields": ("author", "comment", "is_internal")
        }),
        ("Metadata", {
            "fields": ("created_at",),
            "classes": ("collapse",)
        }),
    )
    
    def get_subject_name(self, obj):
        return f"{obj.class_subject.subject.name} - {obj.class_subject.classroom.name}"
    get_subject_name.short_description = "Subject & Class"


@admin.register(ConductRating)
class ConductRatingAdmin(admin.ModelAdmin):
    list_display = ["get_student_name", "quarter", "core_value", "behavior", "rating"]
    list_filter = ["rating", "core_value", "quarter__academic_year", "quarter"]
    search_fields = ["class_enrollment__student__email", "behavior"]
    ordering = ["quarter", "class_enrollment__classroom", "class_enrollment__student"]
    
    def get_student_name(self, obj):
        return obj.class_enrollment.student.display_name
    get_student_name.short_description = "Student"
