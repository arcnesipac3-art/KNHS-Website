from rest_framework import serializers
from django.utils import timezone

from .models import Assignment, Submission, LearningMaterial


class AssignmentSerializer(serializers.ModelSerializer):
    class_subject_name = serializers.CharField(source="class_subject.subject.name", read_only=True)
    classroom_name = serializers.CharField(source="class_subject.classroom.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.display_name", read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    submission_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Assignment
        fields = [
            "id",
            "class_subject",
            "class_subject_name",
            "classroom_name",
            "title",
            "description",
            "due_date",
            "max_score",
            "status",
            "allow_late_submission",
            "attachment_url",
            "created_by",
            "created_by_name",
            "is_overdue",
            "submission_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def validate_due_date(self, value):
        """Ensure due date is in the future for new assignments."""
        if not self.instance and value < timezone.now():
            raise serializers.ValidationError("Due date must be in the future")
        return value


class SubmissionSerializer(serializers.ModelSerializer):
    assignment_title = serializers.CharField(source="assignment.title", read_only=True)
    student_name = serializers.CharField(source="student.display_name", read_only=True)
    student_lrn = serializers.CharField(source="student.profile.lrn", read_only=True)
    graded_by_name = serializers.CharField(source="graded_by.display_name", read_only=True)
    is_late = serializers.BooleanField(read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id",
            "assignment",
            "assignment_title",
            "student",
            "student_name",
            "student_lrn",
            "file_urls",
            "text_response",
            "submitted_at",
            "score",
            "feedback",
            "status",
            "graded_at",
            "graded_by",
            "graded_by_name",
            "is_late",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "student", "submitted_at", "graded_at", "graded_by", "status", "created_at", "updated_at"]


class SubmitAssignmentSerializer(serializers.Serializer):
    """Serializer for student submitting an assignment."""
    file_urls = serializers.ListField(child=serializers.URLField(), required=False, allow_empty=True)
    text_response = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        """Ensure at least one type of submission is provided."""
        if not data.get("file_urls") and not data.get("text_response"):
            raise serializers.ValidationError("Either file_urls or text_response must be provided")
        return data


class GradeSubmissionSerializer(serializers.Serializer):
    """Serializer for teacher grading a submission."""
    score = serializers.DecimalField(max_digits=6, decimal_places=2, min_value=0)
    feedback = serializers.CharField(required=False, allow_blank=True)

    def validate_score(self, value):
        """Ensure score doesn't exceed max_score."""
        submission = self.context.get("submission")
        if submission and value > submission.assignment.max_score:
            raise serializers.ValidationError(
                f"Score cannot exceed max score of {submission.assignment.max_score}"
            )
        return value


class LearningMaterialSerializer(serializers.ModelSerializer):
    class_subject_name = serializers.CharField(source="class_subject.subject.name", read_only=True)
    classroom_name = serializers.CharField(source="class_subject.classroom.name", read_only=True)
    uploaded_by_name = serializers.CharField(source="uploaded_by.display_name", read_only=True)
    material_type_display = serializers.CharField(source="get_material_type_display", read_only=True)

    class Meta:
        model = LearningMaterial
        fields = [
            "id",
            "class_subject",
            "class_subject_name",
            "classroom_name",
            "title",
            "description",
            "material_type",
            "material_type_display",
            "file_url",
            "file_size",
            "uploaded_by",
            "uploaded_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "uploaded_by", "created_at", "updated_at"]
