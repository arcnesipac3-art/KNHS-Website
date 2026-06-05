from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import AcademicYear, Quarter, Subject, Classroom, ClassSubject, ClassEnrollment, SchoolEvent
from .serializers import (
    AcademicYearSerializer,
    QuarterSerializer,
    SubjectSerializer,
    ClassroomListSerializer,
    ClassroomDetailSerializer,
    ClassSubjectSerializer,
    ClassEnrollmentSerializer,
    JoinClassSerializer,
    SchoolEventSerializer,
)
from .permissions import IsAdminUser, IsTeacherUser, IsStudentUser


class AcademicYearViewSet(viewsets.ModelViewSet):
    """Academic year management (admin only)."""

    queryset = AcademicYear.objects.prefetch_related('quarters').all()
    serializer_class = AcademicYearSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["post"])
    def set_current(self, request, pk=None):
        """Set this academic year as current."""
        if not request.user.role == "admin":
            return Response(
                {"error": "Only administrators can change the current academic year"},
                status=status.HTTP_403_FORBIDDEN,
            )

        academic_year = self.get_object()
        academic_year.is_current = True
        academic_year.save()

        return Response(
            {"message": f"{academic_year.label} is now the current academic year"},
            status=status.HTTP_200_OK,
        )


class QuarterViewSet(viewsets.ModelViewSet):
    """Quarter management."""

    queryset = Quarter.objects.select_related('academic_year').all()
    serializer_class = QuarterSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        academic_year_id = self.request.query_params.get("academic_year")
        if academic_year_id:
            queryset = queryset.filter(academic_year_id=academic_year_id)
        return queryset


class SubjectViewSet(viewsets.ModelViewSet):
    """Subject catalog management."""

    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by grade level
        grade_level = self.request.query_params.get("grade_level")
        if grade_level:
            queryset = queryset.filter(grade_level=grade_level)

        # Filter by strand
        strand = self.request.query_params.get("strand")
        if strand:
            queryset = queryset.filter(Q(strand=strand) | Q(strand=""))

        # Filter active only
        if self.request.query_params.get("active_only") == "true":
            queryset = queryset.filter(is_active=True)

        return queryset


class ClassroomViewSet(viewsets.ModelViewSet):
    """Classroom management."""

    queryset = Classroom.objects.select_related(
        "adviser", "adviser__profile", "academic_year"
    ).prefetch_related('class_subjects', 'class_subjects__subject', 'class_subjects__teacher').all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "retrieve" or self.request.user.role in ["admin", "teacher"]:
            return ClassroomDetailSerializer
        return ClassroomListSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Filter by academic year
        academic_year_id = self.request.query_params.get("academic_year")
        if academic_year_id:
            queryset = queryset.filter(academic_year_id=academic_year_id)
        else:
            # Default to current academic year
            queryset = queryset.filter(academic_year__is_current=True)

        # Role-based filtering
        if user.role == "student":
            # Students see only their enrolled classes
            queryset = queryset.filter(enrollments__student=user, enrollments__status="active")
        elif user.role == "teacher":
            # Teachers see classes they teach or advise
            advised_filter = self.request.query_params.get("advised")
            if advised_filter == "true":
                queryset = queryset.filter(adviser=user)
            else:
                queryset = queryset.filter(
                    Q(adviser=user) | Q(class_subjects__teacher=user)
                ).distinct()

        # Filter by grade level
        grade_level = self.request.query_params.get("grade_level")
        if grade_level:
            queryset = queryset.filter(grade_level=grade_level)

        return queryset

    @action(detail=True, methods=["post"])
    def regenerate_code(self, request, pk=None):
        """Regenerate join code for a classroom."""
        classroom = self.get_object()

        if request.user.role not in ["admin"] and classroom.adviser != request.user:
            return Response(
                {"error": "Only the adviser or administrators can regenerate the join code"},
                status=status.HTTP_403_FORBIDDEN,
            )

        classroom.regenerate_join_code()

        return Response(
            {
                "message": "Join code regenerated successfully",
                "join_code": classroom.join_code,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"])
    def enrollments(self, request, pk=None):
        """Get all enrollments for a classroom."""
        classroom = self.get_object()
        enrollments = classroom.enrollments.select_related("student", "student__profile").all()

        # Filter by status
        status_filter = request.query_params.get("status")
        if status_filter:
            enrollments = enrollments.filter(status=status_filter)

        serializer = ClassEnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], permission_classes=[IsStudentUser])
    def join(self, request):
        """Student joins a class using join code."""
        serializer = JoinClassSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        join_code = serializer.validated_data["join_code"]
        classroom = Classroom.objects.get(join_code=join_code, is_active=True)

        # Check if student's grade level matches classroom
        student_grade = request.user.profile.grade_level
        if student_grade and student_grade != classroom.grade_level:
            return Response(
                {"error": "Your grade level does not match this classroom"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if already enrolled
        if ClassEnrollment.objects.filter(classroom=classroom, student=request.user).exists():
            return Response(
                {"error": "You are already enrolled in this class"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create enrollment
        enrollment = ClassEnrollment.objects.create(classroom=classroom, student=request.user)

        return Response(
            {
                "message": f"Successfully joined {classroom.name}",
                "enrollment": ClassEnrollmentSerializer(enrollment).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ClassSubjectViewSet(viewsets.ModelViewSet):
    """Subject assignments within classrooms."""

    queryset = ClassSubject.objects.select_related("classroom", "subject", "teacher").all()
    serializer_class = ClassSubjectSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by classroom
        classroom_id = self.request.query_params.get("classroom")
        if classroom_id:
            queryset = queryset.filter(classroom_id=classroom_id)

        # Filter by teacher
        if self.request.user.role == "teacher":
            queryset = queryset.filter(teacher=self.request.user)

        return queryset


class ClassEnrollmentViewSet(viewsets.ModelViewSet):
    """Student enrollment management."""

    queryset = ClassEnrollment.objects.select_related("classroom", "student", "student__profile").all()
    serializer_class = ClassEnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Filter by classroom
        classroom_id = self.request.query_params.get("classroom")
        if classroom_id:
            queryset = queryset.filter(classroom_id=classroom_id)

        # Filter by student
        student_id = self.request.query_params.get("student")
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        # Role-based filtering
        if user.role == "student":
            queryset = queryset.filter(student=user)

        return queryset

    @action(detail=True, methods=["post"])
    def transfer(self, request, pk=None):
        """Transfer student to a different classroom."""
        if request.user.role != "admin":
            return Response(
                {"error": "Only administrators can transfer students"},
                status=status.HTTP_403_FORBIDDEN,
            )

        enrollment = self.get_object()
        new_classroom_id = request.data.get("new_classroom_id")

        if not new_classroom_id:
            return Response(
                {"error": "new_classroom_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            new_classroom = Classroom.objects.get(id=new_classroom_id, is_active=True)
        except Classroom.DoesNotExist:
            return Response(
                {"error": "Invalid classroom ID"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if new_classroom.is_full:
            return Response(
                {"error": "Target classroom is full"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mark old enrollment as transferred
        enrollment.status = "transferred"
        enrollment.notes = f"Transferred to {new_classroom.name}"
        enrollment.save()

        # Create new enrollment
        new_enrollment = ClassEnrollment.objects.create(
            classroom=new_classroom,
            student=enrollment.student,
            notes=f"Transferred from {enrollment.classroom.name}",
        )

        return Response(
            {
                "message": f"Student transferred to {new_classroom.name}",
                "new_enrollment": ClassEnrollmentSerializer(new_enrollment).data,
            },
            status=status.HTTP_200_OK,
        )


class SchoolEventViewSet(viewsets.ModelViewSet):
    """School calendar event management (admin only for CUD)."""

    queryset = SchoolEvent.objects.select_related('academic_year', 'created_by').all()
    serializer_class = SchoolEventSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by academic year
        academic_year_id = self.request.query_params.get('academic_year')
        if academic_year_id:
            queryset = queryset.filter(academic_year_id=academic_year_id)

        # Filter by event type
        event_type = self.request.query_params.get('event_type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)

        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(
                Q(end_date__lte=end_date) | Q(end_date__isnull=True, start_date__lte=end_date)
            )

        # School-wide only filter
        if self.request.query_params.get('school_wide') == 'true':
            queryset = queryset.filter(is_school_wide=True)

        return queryset

    def perform_create(self, serializer):
        """Set created_by to current user."""
        serializer.save(created_by=self.request.user)


# ── Schedule Views ────────────────────────────────────────────────────────────

from .models import Period, TimetableSlot  # noqa: E402
from .serializers import PeriodSerializer, TimetableSlotSerializer  # noqa: E402


class PeriodViewSet(viewsets.ModelViewSet):
    """School day periods/time slots (admin only for CUD)."""

    queryset = Period.objects.select_related('academic_year').all()
    serializer_class = PeriodSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        academic_year_id = self.request.query_params.get('academic_year')
        if academic_year_id:
            queryset = queryset.filter(academic_year_id=academic_year_id)
        else:
            # Default to current academic year
            queryset = queryset.filter(academic_year__is_current=True)
        return queryset


class TimetableSlotViewSet(viewsets.ModelViewSet):
    """Timetable slot management (admin only for CUD)."""

    queryset = TimetableSlot.objects.select_related(
        'classroom',
        'class_subject',
        'class_subject__subject',
        'class_subject__teacher',
        'period',
    ).all()
    serializer_class = TimetableSlotSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Filter by classroom
        classroom_id = self.request.query_params.get('classroom')
        if classroom_id:
            queryset = queryset.filter(classroom_id=classroom_id)

        # Filter by day
        day = self.request.query_params.get('day')
        if day:
            queryset = queryset.filter(day_of_week=day)

        # Role-based: students see their enrolled class's timetable
        if user.role == 'student':
            enrolled_classrooms = user.class_enrollments.filter(
                status='active'
            ).values_list('classroom_id', flat=True)
            queryset = queryset.filter(classroom_id__in=enrolled_classrooms)

        # Teachers see their teaching assignments
        elif user.role == 'teacher':
            queryset = queryset.filter(class_subject__teacher=user)

        return queryset
