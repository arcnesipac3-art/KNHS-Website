from rest_framework import serializers

from apps.accounts.serializers import UserSerializer, UserProfileSerializer
from .models import AcademicYear, Quarter, Subject, Classroom, ClassSubject, ClassEnrollment, SchoolEvent


class AcademicYearSerializer(serializers.ModelSerializer):
    quarters_count = serializers.SerializerMethodField()

    class Meta:
        model = AcademicYear
        fields = [
            "id",
            "label",
            "start_date",
            "end_date",
            "is_current",
            "quarters_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_quarters_count(self, obj):
        return obj.quarters.count()


class QuarterSerializer(serializers.ModelSerializer):
    academic_year_label = serializers.CharField(source="academic_year.label", read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Quarter
        fields = [
            "id",
            "academic_year",
            "academic_year_label",
            "number",
            "name",
            "start_date",
            "end_date",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SubjectSerializer(serializers.ModelSerializer):
    strand_display = serializers.CharField(source="get_strand_display", read_only=True)

    class Meta:
        model = Subject
        fields = [
            "id",
            "name",
            "code",
            "description",
            "grade_level",
            "strand",
            "strand_display",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ClassroomListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing classrooms."""

    adviser_name = serializers.CharField(source="adviser.display_name", read_only=True)
    academic_year_label = serializers.CharField(source="academic_year.label", read_only=True)
    enrollment_count = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    strand_display = serializers.CharField(source="get_strand_display", read_only=True)

    class Meta:
        model = Classroom
        fields = [
            "id",
            "name",
            "grade_level",
            "section",
            "strand",
            "strand_display",
            "adviser",
            "adviser_name",
            "academic_year",
            "academic_year_label",
            "enrollment_count",
            "capacity",
            "is_full",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "join_code", "created_at", "updated_at"]


class ClassroomDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with join code (teacher/admin only)."""

    adviser_name = serializers.CharField(source="adviser.display_name", read_only=True)
    academic_year_label = serializers.CharField(source="academic_year.label", read_only=True)
    enrollment_count = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    strand_display = serializers.CharField(source="get_strand_display", read_only=True)

    class Meta:
        model = Classroom
        fields = [
            "id",
            "name",
            "grade_level",
            "section",
            "strand",
            "strand_display",
            "adviser",
            "adviser_name",
            "academic_year",
            "academic_year_label",
            "join_code",
            "enrollment_count",
            "capacity",
            "is_full",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "join_code", "created_at", "updated_at"]


class ClassSubjectSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    subject_code = serializers.CharField(source="subject.code", read_only=True)
    teacher_name = serializers.CharField(source="teacher.display_name", read_only=True)
    classroom_name = serializers.CharField(source="classroom.name", read_only=True)

    class Meta:
        model = ClassSubject
        fields = [
            "id",
            "classroom",
            "classroom_name",
            "subject",
            "subject_name",
            "subject_code",
            "teacher",
            "teacher_name",
            "ww_weight",
            "pt_weight",
            "qa_weight",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        """Ensure weights sum to 100%."""
        ww = data.get("ww_weight", 30)
        pt = data.get("pt_weight", 50)
        qa = data.get("qa_weight", 20)
        total = ww + pt + qa
        if total != 100:
            raise serializers.ValidationError(f"Component weights must sum to 100% (currently {total}%)")
        return data


class ClassEnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.display_name", read_only=True)
    student_lrn = serializers.CharField(source="student.profile.lrn", read_only=True)
    classroom_name = serializers.CharField(source="classroom.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = ClassEnrollment
        fields = [
            "id",
            "classroom",
            "classroom_name",
            "student",
            "student_name",
            "student_lrn",
            "status",
            "status_display",
            "enrolled_at",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "enrolled_at", "created_at", "updated_at"]


class JoinClassSerializer(serializers.Serializer):
    """Serializer for students joining a class via code."""

    join_code = serializers.CharField(max_length=8, min_length=6)

    def validate_join_code(self, value):
        """Validate that the join code exists and classroom is active."""
        try:
            classroom = Classroom.objects.get(join_code=value.upper(), is_active=True)
        except Classroom.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive join code")

        if classroom.is_full:
            raise serializers.ValidationError("This class is full")

        return value.upper()



class SchoolEventSerializer(serializers.ModelSerializer):
    """Serializer for school calendar events."""
    
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.display_name', read_only=True)
    academic_year_label = serializers.CharField(source='academic_year.label', read_only=True)
    is_multi_day = serializers.BooleanField(read_only=True)
    duration_days = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = SchoolEvent
        fields = [
            'id',
            'title',
            'description',
            'event_type',
            'event_type_display',
            'start_date',
            'end_date',
            'academic_year',
            'academic_year_label',
            'is_school_wide',
            'is_multi_day',
            'duration_days',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate that end_date is after start_date."""
        start = data.get('start_date')
        end = data.get('end_date')
        
        if end and start and end < start:
            raise serializers.ValidationError({
                'end_date': 'End date must be after start date'
            })
        
        return data


# ── Schedule Serializers ──────────────────────────────────────────────────────

from .models import Period, TimetableSlot  # noqa: E402 — appended after initial imports


class PeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Period
        fields = (
            'id', 'academic_year', 'name', 'start_time', 'end_time',
            'order', 'is_break', 'created_at',
        )
        read_only_fields = ('id', 'created_at')


class TimetableSlotSerializer(serializers.ModelSerializer):
    # Nested read-only detail fields
    subject_name = serializers.CharField(source='class_subject.subject.name', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    period_name = serializers.CharField(source='period.name', read_only=True)
    period_start_time = serializers.TimeField(source='period.start_time', read_only=True)
    period_end_time = serializers.TimeField(source='period.end_time', read_only=True)
    period_order = serializers.IntegerField(source='period.order', read_only=True)
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    day_name = serializers.SerializerMethodField()

    class Meta:
        model = TimetableSlot
        fields = (
            'id', 'classroom', 'classroom_name',
            'class_subject', 'subject_name', 'teacher_name',
            'period', 'period_name', 'period_start_time', 'period_end_time', 'period_order',
            'day_of_week', 'day_name', 'room',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_teacher_name(self, obj):
        teacher = obj.class_subject.teacher
        return teacher.display_name if teacher else 'Unassigned'

    def get_day_name(self, obj):
        return dict(TimetableSlot.DAY_CHOICES).get(obj.day_of_week, '')
