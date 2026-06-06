from rest_framework import serializers

from .models import Grade, GradePublishEvent, ConductRating, GradeReviewComment, ReportCard


class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="class_enrollment.student.display_name", read_only=True)
    student_lrn = serializers.CharField(source="class_enrollment.student.profile.lrn", read_only=True)
    subject_name = serializers.CharField(source="class_subject.subject.name", read_only=True)
    subject_code = serializers.CharField(source="class_subject.subject.code", read_only=True)
    classroom_name = serializers.CharField(source="class_subject.classroom.name", read_only=True)
    quarter_name = serializers.CharField(source="quarter.name", read_only=True)
    quarter_number = serializers.IntegerField(source="quarter.number", read_only=True)
    is_passing = serializers.BooleanField(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Grade
        fields = [
            "id",
            "class_enrollment",
            "student_name",
            "student_lrn",
            "class_subject",
            "subject_name",
            "subject_code",
            "classroom_name",
            "quarter",
            "quarter_name",
            "quarter_number",
            "ww_score",
            "pt_score",
            "qa_score",
            "initial_grade",
            "transmuted_grade",
            "is_passing",
            "status",
            "status_display",
            "remarks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "initial_grade", "transmuted_grade", "created_at", "updated_at"]

    def validate(self, data):
        """Validate component scores are within range."""
        for component in ["ww_score", "pt_score", "qa_score"]:
            score = data.get(component)
            if score is not None and (score < 0 or score > 100):
                raise serializers.ValidationError(f"{component} must be between 0 and 100")
        return data


class GradeInputSerializer(serializers.Serializer):
    """Serializer for batch grade input."""
    student_id = serializers.UUIDField()
    ww_score = serializers.DecimalField(max_digits=6, decimal_places=2, min_value=0, max_value=100, required=False, allow_null=True)
    pt_score = serializers.DecimalField(max_digits=6, decimal_places=2, min_value=0, max_value=100, required=False, allow_null=True)
    qa_score = serializers.DecimalField(max_digits=6, decimal_places=2, min_value=0, max_value=100, required=False, allow_null=True)
    remarks = serializers.CharField(required=False, allow_blank=True)


class GradePublishEventSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.display_name", read_only=True)
    action_display = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = GradePublishEvent
        fields = [
            "id",
            "grade",
            "action",
            "action_display",
            "actor",
            "actor_name",
            "reason",
            "metadata",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class PublishGradesSerializer(serializers.Serializer):
    """Serializer for publishing grades for a quarter."""
    class_subject_id = serializers.UUIDField()
    quarter_id = serializers.UUIDField()


class GradeWorkflowActionSerializer(serializers.Serializer):
    """Serializer for quarter-wide grade workflow actions."""

    class_subject_id = serializers.UUIDField()
    quarter_id = serializers.UUIDField()
    reason = serializers.CharField(required=False, allow_blank=True, max_length=500)


class UnlockGradeSerializer(serializers.Serializer):
    """Serializer for unlocking a published grade."""
    reason = serializers.CharField(required=True, min_length=10)


class ConductRatingSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="class_enrollment.student.display_name", read_only=True)
    student_lrn = serializers.CharField(source="class_enrollment.student.profile.lrn", read_only=True)
    quarter_name = serializers.CharField(source="quarter.name", read_only=True)
    core_value_display = serializers.CharField(source="get_core_value_display", read_only=True)
    rating_display = serializers.CharField(source="get_rating_display", read_only=True)

    class Meta:
        model = ConductRating
        fields = [
            "id",
            "class_enrollment",
            "student_name",
            "student_lrn",
            "quarter",
            "quarter_name",
            "core_value",
            "core_value_display",
            "behavior",
            "rating",
            "rating_display",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ConductRatingInputSerializer(serializers.Serializer):
    """Serializer for batch conduct rating input."""
    student_id = serializers.UUIDField()
    core_value = serializers.ChoiceField(choices=ConductRating.CORE_VALUE_CHOICES)
    behavior = serializers.CharField(max_length=255)
    rating = serializers.ChoiceField(choices=ConductRating.RATING_CHOICES)


class BulkGradeWorkflowSerializer(serializers.Serializer):
    """Serializer for bulk approve/reject operations."""
    items = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField()),
        min_length=1,
        help_text="List of {class_subject_id, quarter_id} dictionaries"
    )
    reason = serializers.CharField(required=False, allow_blank=True, max_length=500)
    
    def validate_items(self, value):
        """Validate that each item has required fields."""
        for item in value:
            if 'class_subject_id' not in item or 'quarter_id' not in item:
                raise serializers.ValidationError(
                    "Each item must have 'class_subject_id' and 'quarter_id'"
                )
        return value


class GradeReviewCommentSerializer(serializers.ModelSerializer):
    """Serializer for grade review comments."""
    author_name = serializers.CharField(source="author.display_name", read_only=True)
    author_role = serializers.CharField(source="author.role", read_only=True)
    
    class Meta:
        model = GradeReviewComment
        fields = [
            "id",
            "class_subject",
            "quarter",
            "author",
            "author_name",
            "author_role",
            "comment",
            "is_internal",
            "created_at",
        ]
        read_only_fields = ["id", "author", "created_at"]


class GradeReviewCommentInputSerializer(serializers.Serializer):
    """Serializer for creating grade review comments."""
    class_subject_id = serializers.UUIDField()
    quarter_id = serializers.UUIDField()
    comment = serializers.CharField(min_length=10, max_length=2000)
    is_internal = serializers.BooleanField(default=False)


class ReportCardSerializer(serializers.ModelSerializer):
    """Serializer for SF5/SF10 report cards."""

    student_name = serializers.CharField(source="student.display_name", read_only=True)
    student_lrn = serializers.CharField(source="student.profile.lrn", read_only=True)
    student_grade_level = serializers.IntegerField(source="student.profile.grade_level", read_only=True)
    student_strand = serializers.CharField(source="student.profile.strand", read_only=True)
    generated_by_name = serializers.CharField(source="generated_by.display_name", read_only=True)
    signed_by_name = serializers.CharField(source="signed_by.display_name", read_only=True)
    report_type_display = serializers.CharField(source="get_report_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    quarter_name = serializers.CharField(source="quarter.name", read_only=True)

    class Meta:
        model = ReportCard
        fields = [
            "id",
            "student",
            "student_name",
            "student_lrn",
            "student_grade_level",
            "student_strand",
            "report_type",
            "report_type_display",
            "school_year",
            "quarter",
            "quarter_name",
            "status",
            "status_display",
            "generated_by",
            "generated_by_name",
            "generated_at",
            "signed_by",
            "signed_by_name",
            "signed_at",
            "remarks",
            "metadata",
        ]
        read_only_fields = ["id", "generated_at", "signed_at"]


class CreateReportCardSerializer(serializers.Serializer):
    """Serializer for creating a new report card."""

    student_id = serializers.UUIDField()
    report_type = serializers.ChoiceField(choices=ReportCard.REPORT_TYPE_CHOICES)
    school_year = serializers.CharField(max_length=20)
    quarter_id = serializers.UUIDField(required=False, allow_null=True)

    def validate_student_id(self, value):
        """Validate that the student exists."""
        from apps.accounts.models import User
        try:
            student = User.objects.get(id=value, role="student")
        except User.DoesNotExist:
            raise serializers.ValidationError("Student not found")
        return value

    def validate(self, data):
        """Validate that SF5 requires a quarter."""
        if data.get("report_type") == "sf5" and not data.get("quarter_id"):
            raise serializers.ValidationError("quarter_id is required for SF5 (Report Card)")
        return data
