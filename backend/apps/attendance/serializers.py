from rest_framework import serializers

from .models import AttendanceRecord


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="class_enrollment.student.display_name", read_only=True)
    student_lrn = serializers.CharField(source="class_enrollment.student.profile.lrn", read_only=True)
    classroom_name = serializers.CharField(source="class_enrollment.classroom.name", read_only=True)
    recorded_by_name = serializers.CharField(source="recorded_by.display_name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            "id",
            "class_enrollment",
            "student_name",
            "student_lrn",
            "classroom_name",
            "date",
            "status",
            "status_display",
            "notes",
            "recorded_by",
            "recorded_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "recorded_by", "created_at", "updated_at"]


class BulkAttendanceSerializer(serializers.Serializer):
    """Serializer for bulk attendance marking."""
    student_id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=["P", "A", "L", "E"])
    notes = serializers.CharField(required=False, allow_blank=True)


class AttendanceSummarySerializer(serializers.Serializer):
    """Serializer for attendance summary."""
    student_id = serializers.UUIDField(read_only=True)
    student_name = serializers.CharField(read_only=True)
    student_lrn = serializers.CharField(read_only=True)
    present_count = serializers.IntegerField(read_only=True)
    absent_count = serializers.IntegerField(read_only=True)
    late_count = serializers.IntegerField(read_only=True)
    excused_count = serializers.IntegerField(read_only=True)
    total_days = serializers.IntegerField(read_only=True)
    attendance_rate = serializers.FloatField(read_only=True)
