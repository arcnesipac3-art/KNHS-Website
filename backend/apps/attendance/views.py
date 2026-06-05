from datetime import date, timedelta
from django.db.models import Count, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.academics.models import Classroom, ClassEnrollment, Quarter
from apps.academics.permissions import IsAdminUser, IsTeacherUser
from .models import AttendanceRecord
from .serializers import (
    AttendanceRecordSerializer,
    BulkAttendanceSerializer,
    AttendanceSummarySerializer,
)


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    """Attendance record management."""

    queryset = AttendanceRecord.objects.select_related(
        "class_enrollment",
        "class_enrollment__student",
        "class_enrollment__student__profile",
        "class_enrollment__classroom",
        "recorded_by",
    ).all()
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Filter by date range
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)

        # Filter by classroom
        classroom_id = self.request.query_params.get("classroom")
        if classroom_id:
            queryset = queryset.filter(class_enrollment__classroom_id=classroom_id)

        # Filter by student
        student_id = self.request.query_params.get("student")
        if student_id:
            queryset = queryset.filter(class_enrollment__student_id=student_id)

        # Role-based filtering
        if user.role == "student":
            # Students see only their own attendance
            queryset = queryset.filter(class_enrollment__student=user)
        elif user.role == "teacher":
            # Teachers see attendance from their classes
            queryset = queryset.filter(
                Q(class_enrollment__classroom__adviser=user)
                | Q(class_enrollment__classroom__class_subjects__teacher=user)
            ).distinct()

        return queryset

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsTeacherUser()] if self.request.user.role == "teacher" else [IsAdminUser()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)

    @action(detail=False, methods=["post"])
    def bulk_mark(self, request):
        """Bulk attendance marking for a classroom on a specific date."""
        if request.user.role not in ["teacher", "admin"]:
            return Response(
                {"error": "Only teachers and admins can mark attendance"},
                status=status.HTTP_403_FORBIDDEN,
            )

        classroom_id = request.data.get("classroom_id")
        attendance_date = request.data.get("date")
        attendance_data = request.data.get("attendance", [])

        if not classroom_id or not attendance_date:
            return Response(
                {"error": "classroom_id and date are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            classroom = Classroom.objects.get(id=classroom_id)
        except Classroom.DoesNotExist:
            return Response(
                {"error": "Classroom not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Validate attendance data
        serializer = BulkAttendanceSerializer(data=attendance_data, many=True)
        serializer.is_valid(raise_exception=True)

        created_count = 0
        updated_count = 0

        for att_data in serializer.validated_data:
            student_id = att_data["student_id"]

            # Get enrollment
            try:
                enrollment = ClassEnrollment.objects.get(
                    classroom=classroom,
                    student_id=student_id,
                    status="active",
                )
            except ClassEnrollment.DoesNotExist:
                continue

            # Create or update attendance record
            record, created = AttendanceRecord.objects.update_or_create(
                class_enrollment=enrollment,
                date=attendance_date,
                defaults={
                    "status": att_data["status"],
                    "notes": att_data.get("notes", ""),
                    "recorded_by": request.user,
                },
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        return Response(
            {
                "message": "Attendance marked successfully",
                "created": created_count,
                "updated": updated_count,
            }
        )

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Get attendance summary for a classroom over a date range."""
        classroom_id = request.query_params.get("classroom")
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        if not classroom_id:
            return Response(
                {"error": "classroom_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            classroom = Classroom.objects.get(id=classroom_id)
        except Classroom.DoesNotExist:
            return Response(
                {"error": "Classroom not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Default to current quarter if no date range
        if not date_from or not date_to:
            today = date.today()
            date_from = today - timedelta(days=30)
            date_to = today

        # Get all active enrollments
        enrollments = classroom.enrollments.filter(status="active").select_related(
            "student", "student__profile"
        )

        # Single aggregated query instead of N+1 (one query per student)
        from django.db.models import Count, Case, When, IntegerField as IntF
        records_qs = AttendanceRecord.objects.filter(
            class_enrollment__classroom=classroom,
            class_enrollment__status="active",
            date__gte=date_from,
            date__lte=date_to,
        ).values('class_enrollment_id').annotate(
            present=Count(Case(When(status='P', then=1), output_field=IntF())),
            absent=Count(Case(When(status='A', then=1), output_field=IntF())),
            late=Count(Case(When(status='L', then=1), output_field=IntF())),
            excused=Count(Case(When(status='E', then=1), output_field=IntF())),
        )
        records_map = {r['class_enrollment_id']: r for r in records_qs}

        summary_data = []
        for enrollment in enrollments:
            r = records_map.get(enrollment.id, {})
            present = r.get('present', 0)
            absent = r.get('absent', 0)
            late = r.get('late', 0)
            excused = r.get('excused', 0)
            total = present + absent + late + excused
            attendance_rate = (present / total * 100) if total > 0 else 0

            summary_data.append(
                {
                    "student_id": enrollment.student.id,
                    "student_name": enrollment.student.display_name,
                    "student_lrn": enrollment.student.profile.lrn,
                    "present_count": present,
                    "absent_count": absent,
                    "late_count": late,
                    "excused_count": excused,
                    "total_days": total,
                    "attendance_rate": round(attendance_rate, 2),
                }
            )

        serializer = AttendanceSummarySerializer(summary_data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def quarterly_rollup(self, request):
        """Get attendance rollup for a specific student and quarter (for SF9)."""
        student_id = request.query_params.get("student")
        quarter_id = request.query_params.get("quarter")

        if not student_id or not quarter_id:
            return Response(
                {"error": "student and quarter parameters are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            quarter = Quarter.objects.get(id=quarter_id)
            enrollment = ClassEnrollment.objects.get(
                student_id=student_id,
                classroom__academic_year=quarter.academic_year,
                status="active"
            )
        except (Quarter.DoesNotExist, ClassEnrollment.DoesNotExist):
            return Response(
                {"error": "Invalid student or quarter ID"},
                status=status.HTTP_404_NOT_FOUND,
            )

        records = AttendanceRecord.objects.filter(
            class_enrollment=enrollment,
            date__gte=quarter.start_date,
            date__lte=quarter.end_date,
        )

        present = records.filter(status="P").count()
        absent = records.filter(status="A").count()
        late = records.filter(status="L").count()
        excused = records.filter(status="E").count()
        total = present + absent + late + excused

        attendance_rate = (present / total * 100) if total > 0 else 0

        data = {
            "student_id": student_id,
            "student_name": enrollment.student.display_name,
            "quarter_name": quarter.name,
            "present_count": present,
            "absent_count": absent,
            "late_count": late,
            "excused_count": excused,
            "total_days": total,
            "attendance_rate": round(attendance_rate, 2),
        }

        return Response(data)
