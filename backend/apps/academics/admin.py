from django.contrib import admin
from .models import AcademicYear, Quarter, Subject, Classroom, ClassSubject, ClassEnrollment, SchoolEvent


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ["label", "start_date", "end_date", "is_current", "created_at"]
    list_filter = ["is_current"]
    search_fields = ["label"]
    ordering = ["-start_date"]


@admin.register(Quarter)
class QuarterAdmin(admin.ModelAdmin):
    list_display = ["name", "academic_year", "number", "start_date", "end_date", "is_active"]
    list_filter = ["academic_year", "number"]
    search_fields = ["name", "academic_year__label"]
    ordering = ["academic_year", "number"]


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "grade_level", "strand", "is_active"]
    list_filter = ["grade_level", "strand", "is_active"]
    search_fields = ["name", "code"]
    ordering = ["grade_level", "name"]


@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "grade_level",
        "section",
        "strand",
        "adviser",
        "academic_year",
        "join_code",
        "enrollment_count",
        "capacity",
        "is_active",
    ]
    list_filter = ["grade_level", "strand", "academic_year", "is_active"]
    search_fields = ["name", "section", "join_code"]
    ordering = ["academic_year", "grade_level", "name"]
    readonly_fields = ["enrollment_count", "join_code", "created_at", "updated_at"]

    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing existing object
            return self.readonly_fields
        return ["enrollment_count", "created_at", "updated_at"]


@admin.register(ClassSubject)
class ClassSubjectAdmin(admin.ModelAdmin):
    list_display = ["classroom", "subject", "teacher", "ww_weight", "pt_weight", "qa_weight"]
    list_filter = ["classroom__grade_level", "subject__grade_level"]
    search_fields = ["classroom__name", "subject__name", "teacher__email"]
    ordering = ["classroom", "subject"]


@admin.register(ClassEnrollment)
class ClassEnrollmentAdmin(admin.ModelAdmin):
    list_display = ["student", "classroom", "status", "enrolled_at"]
    list_filter = ["status", "classroom__grade_level", "classroom__academic_year"]
    search_fields = ["student__email", "student__profile__lrn", "classroom__name"]
    ordering = ["-enrolled_at"]
    readonly_fields = ["enrolled_at", "created_at", "updated_at"]


@admin.register(SchoolEvent)
class SchoolEventAdmin(admin.ModelAdmin):
    list_display = ["title", "event_type", "start_date", "end_date", "academic_year", "is_school_wide", "created_by"]
    list_filter = ["event_type", "is_school_wide", "academic_year"]
    search_fields = ["title", "description"]
    ordering = ["-start_date"]
    readonly_fields = ["created_by", "created_at", "updated_at"]
