from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.academics.models import ClassEnrollment, ClassSubject, Quarter
from apps.academics.permissions import IsAdminUser, IsTeacherUser
from .models import Grade, GradePublishEvent
from .serializers import (
    GradeSerializer,
    GradeInputSerializer,
    GradePublishEventSerializer,
    PublishGradesSerializer,
    UnlockGradeSerializer,
)


class GradeViewSet(viewsets.ModelViewSet):
    """Grade management."""

    queryset = Grade.objects.select_related(
        "class_enrollment",
        "class_enrollment__student",
        "class_enrollment__student__profile",
        "class_subject",
        "class_subject__subject",
        "class_subject__classroom",
        "quarter",
    ).all()
    serializer_class = GradeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Filter by class_subject if provided
        class_subject_id = self.request.query_params.get("class_subject")
        if class_subject_id:
            queryset = queryset.filter(class_subject_id=class_subject_id)

        # Filter by quarter if provided
        quarter_id = self.request.query_params.get("quarter")
        if quarter_id:
            queryset = queryset.filter(quarter_id=quarter_id)

        # Filter by student if provided
        student_id = self.request.query_params.get("student")
        if student_id:
            queryset = queryset.filter(class_enrollment__student_id=student_id)

        # Role-based filtering
        if user.role == "student":
            # Students see only their own published grades
            queryset = queryset.filter(
                class_enrollment__student=user,
                status__in=["published", "locked"],
            )
        elif user.role == "teacher":
            # Teachers see grades from their assigned classes
            queryset = queryset.filter(class_subject__teacher=user)

        return queryset

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update"]:
            return [IsTeacherUser()] if self.request.user.role == "teacher" else [IsAdminUser()]
        return [IsAuthenticated()]

    @action(detail=False, methods=["post"])
    def batch_input(self, request):
        """Batch grade input for a class-subject-quarter."""
        if request.user.role not in ["teacher", "admin"]:
            return Response(
                {"error": "Only teachers and admins can input grades"},
                status=status.HTTP_403_FORBIDDEN,
            )

        class_subject_id = request.data.get("class_subject_id")
        quarter_id = request.data.get("quarter_id")
        grades_data = request.data.get("grades", [])

        if not class_subject_id or not quarter_id:
            return Response(
                {"error": "class_subject_id and quarter_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            class_subject = ClassSubject.objects.get(id=class_subject_id)
            quarter = Quarter.objects.get(id=quarter_id)
        except (ClassSubject.DoesNotExist, Quarter.DoesNotExist):
            return Response(
                {"error": "Invalid class_subject_id or quarter_id"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Validate grades data
        serializer = GradeInputSerializer(data=grades_data, many=True)
        serializer.is_valid(raise_exception=True)

        created_count = 0
        updated_count = 0

        for grade_data in serializer.validated_data:
            student_id = grade_data["student_id"]

            # Get or create enrollment
            try:
                enrollment = ClassEnrollment.objects.get(
                    classroom=class_subject.classroom,
                    student_id=student_id,
                    status="active",
                )
            except ClassEnrollment.DoesNotExist:
                continue

            # Get or create grade
            grade, created = Grade.objects.get_or_create(
                class_enrollment=enrollment,
                class_subject=class_subject,
                quarter=quarter,
            )

            # Update scores
            if "ww_score" in grade_data:
                grade.ww_score = grade_data["ww_score"]
            if "pt_score" in grade_data:
                grade.pt_score = grade_data["pt_score"]
            if "qa_score" in grade_data:
                grade.qa_score = grade_data["qa_score"]
            if "remarks" in grade_data:
                grade.remarks = grade_data["remarks"]

            grade.save()

            if created:
                created_count += 1
            else:
                updated_count += 1

        return Response(
            {
                "message": "Grades saved successfully",
                "created": created_count,
                "updated": updated_count,
            }
        )

    @action(detail=False, methods=["post"])
    def publish(self, request):
        """Publish grades for a class-subject-quarter."""
        if request.user.role not in ["teacher", "admin"]:
            return Response(
                {"error": "Only teachers and admins can publish grades"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = PublishGradesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        class_subject_id = serializer.validated_data["class_subject_id"]
        quarter_id = serializer.validated_data["quarter_id"]

        grades = Grade.objects.filter(
            class_subject_id=class_subject_id,
            quarter_id=quarter_id,
            status__in=["computed", "pending_approval"],
        )

        if not grades.exists():
            return Response(
                {"error": "No grades found to publish"},
                status=status.HTTP_404_NOT_FOUND,
            )

        published_count = 0
        for grade in grades:
            grade.status = "published"
            grade.save()

            # Create publish event
            GradePublishEvent.objects.create(
                grade=grade,
                action="published",
                actor=request.user,
            )

            published_count += 1

            # TODO: Create notification for student

        return Response(
            {
                "message": f"Published {published_count} grades successfully",
                "count": published_count,
            }
        )

    @action(detail=True, methods=["post"])
    def unlock(self, request, pk=None):
        """Unlock a published grade for editing."""
        if request.user.role != "admin":
            return Response(
                {"error": "Only admins can unlock grades"},
                status=status.HTTP_403_FORBIDDEN,
            )

        grade = self.get_object()
        serializer = UnlockGradeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if grade.status not in ["published", "locked"]:
            return Response(
                {"error": "Only published or locked grades can be unlocked"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        grade.status = "computed"
        grade.save()

        # Create audit log
        GradePublishEvent.objects.create(
            grade=grade,
            action="unlocked",
            actor=request.user,
            reason=serializer.validated_data["reason"],
        )

        return Response({"message": "Grade unlocked successfully"})


class GradePublishEventViewSet(viewsets.ReadOnlyModelViewSet):
    """Grade publish event audit trail."""

    queryset = GradePublishEvent.objects.select_related("grade", "actor").all()
    serializer_class = GradePublishEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by grade if provided
        grade_id = self.request.query_params.get("grade")
        if grade_id:
            queryset = queryset.filter(grade_id=grade_id)

        # Only admins and teachers can view audit logs
        if self.request.user.role not in ["admin", "teacher"]:
            return queryset.none()

        return queryset
