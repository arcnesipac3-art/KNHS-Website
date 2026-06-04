from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.academics.permissions import IsAdminUser, IsTeacherUser, IsStudentUser
from .models import Assignment, Submission, LearningMaterial
from .serializers import (
    AssignmentSerializer,
    SubmissionSerializer,
    SubmitAssignmentSerializer,
    GradeSubmissionSerializer,
    LearningMaterialSerializer,
)


class AssignmentViewSet(viewsets.ModelViewSet):
    """Assignment management."""

    queryset = Assignment.objects.select_related(
        "class_subject", "class_subject__subject", "class_subject__classroom", "created_by"
    ).all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Filter by class_subject if provided
        class_subject_id = self.request.query_params.get("class_subject")
        if class_subject_id:
            queryset = queryset.filter(class_subject_id=class_subject_id)

        # Role-based filtering
        if user.role == "student":
            # Students see published assignments from their enrolled classes
            queryset = queryset.filter(
                status="published",
                class_subject__classroom__enrollments__student=user,
                class_subject__classroom__enrollments__status="active",
            ).distinct()
        elif user.role == "teacher":
            # Teachers see assignments from classes they teach
            queryset = queryset.filter(class_subject__teacher=user)

        # Filter by status
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        """Publish an assignment."""
        assignment = self.get_object()

        if request.user.role not in ["teacher", "admin"]:
            return Response(
                {"error": "Only teachers and admins can publish assignments"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if assignment.status == "published":
            return Response(
                {"error": "Assignment is already published"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        assignment.status = "published"
        assignment.save()

        # TODO: Create notifications for students

        return Response({"message": "Assignment published successfully"})

    @action(detail=True, methods=["get"])
    def submissions(self, request, pk=None):
        """Get all submissions for this assignment."""
        assignment = self.get_object()
        submissions = assignment.submissions.select_related("student", "student__profile", "graded_by").all()
        
        serializer = SubmissionSerializer(submissions, many=True)
        return Response(serializer.data)


class SubmissionViewSet(viewsets.ModelViewSet):
    """Student submission management."""

    queryset = Submission.objects.select_related(
        "assignment", "student", "student__profile", "graded_by"
    ).all()
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Filter by assignment if provided
        assignment_id = self.request.query_params.get("assignment")
        if assignment_id:
            queryset = queryset.filter(assignment_id=assignment_id)

        # Role-based filtering
        if user.role == "student":
            # Students see only their own submissions
            queryset = queryset.filter(student=user)
        elif user.role == "teacher":
            # Teachers see submissions from their assigned classes
            queryset = queryset.filter(assignment__class_subject__teacher=user)

        return queryset

    @action(detail=False, methods=["post"])
    def submit(self, request):
        """Student submits an assignment."""
        if request.user.role != "student":
            return Response(
                {"error": "Only students can submit assignments"},
                status=status.HTTP_403_FORBIDDEN,
            )

        assignment_id = request.data.get("assignment_id")
        if not assignment_id:
            return Response(
                {"error": "assignment_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            assignment = Assignment.objects.get(id=assignment_id, status="published")
        except Assignment.DoesNotExist:
            return Response(
                {"error": "Assignment not found or not published"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if student is enrolled in the class
        if not assignment.class_subject.classroom.enrollments.filter(
            student=request.user, status="active"
        ).exists():
            return Response(
                {"error": "You are not enrolled in this class"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if already submitted
        existing_submission = Submission.objects.filter(
            assignment=assignment, student=request.user
        ).first()

        if existing_submission and existing_submission.status in ["submitted", "late", "graded"]:
            return Response(
                {"error": "Assignment already submitted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate submission data
        serializer = SubmitAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create or update submission
        submission, created = Submission.objects.get_or_create(
            assignment=assignment,
            student=request.user,
            defaults={
                "file_urls": serializer.validated_data.get("file_urls", []),
                "text_response": serializer.validated_data.get("text_response", ""),
            },
        )

        if not created:
            submission.file_urls = serializer.validated_data.get("file_urls", [])
            submission.text_response = serializer.validated_data.get("text_response", "")

        submission.submit()

        # TODO: Create notification for teacher

        return Response(
            {
                "message": "Assignment submitted successfully",
                "submission": SubmissionSerializer(submission).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def grade(self, request, pk=None):
        """Teacher grades a submission."""
        if request.user.role not in ["teacher", "admin"]:
            return Response(
                {"error": "Only teachers and admins can grade submissions"},
                status=status.HTTP_403_FORBIDDEN,
            )

        submission = self.get_object()
        serializer = GradeSubmissionSerializer(
            data=request.data, context={"submission": submission}
        )
        serializer.is_valid(raise_exception=True)

        submission.score = serializer.validated_data["score"]
        submission.feedback = serializer.validated_data.get("feedback", "")
        submission.status = "graded"
        submission.graded_at = timezone.now()
        submission.graded_by = request.user
        submission.save()

        # TODO: Create notification for student

        return Response(
            {
                "message": "Submission graded successfully",
                "submission": SubmissionSerializer(submission).data,
            }
        )


class LearningMaterialViewSet(viewsets.ModelViewSet):
    """Learning materials management."""

    queryset = LearningMaterial.objects.select_related(
        "class_subject", "class_subject__subject", "class_subject__classroom", "uploaded_by"
    ).all()
    serializer_class = LearningMaterialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Filter by class_subject if provided
        class_subject_id = self.request.query_params.get("class_subject")
        if class_subject_id:
            queryset = queryset.filter(class_subject_id=class_subject_id)

        # Role-based filtering
        if user.role == "student":
            # Students see materials from enrolled classes
            queryset = queryset.filter(
                class_subject__classroom__enrollments__student=user,
                class_subject__classroom__enrollments__status="active",
            ).distinct()
        elif user.role == "teacher":
            # Teachers see materials from their classes
            queryset = queryset.filter(class_subject__teacher=user)

        return queryset

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsTeacherUser()] if self.request.user.role == "teacher" else [IsAdminUser()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
