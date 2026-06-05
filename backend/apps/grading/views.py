from collections import defaultdict

from django.db import transaction
from django.db.models import Max, Q
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.academics.models import ClassEnrollment, ClassSubject, Quarter
from apps.academics.permissions import IsAdminOrPrincipal, IsAdminUser, IsTeacherUser
from apps.communications.models import Notification
from .models import Grade, GradePublishEvent, ConductRating
from .reports import SF9Generator
from .serializers import (
    GradeSerializer,
    GradeInputSerializer,
    GradePublishEventSerializer,
    GradeWorkflowActionSerializer,
    PublishGradesSerializer,
    UnlockGradeSerializer,
    ConductRatingSerializer,
    ConductRatingInputSerializer,
)


def _notify_users(users, notification_type, title, body, link=""):
    notifications = []
    for user in users:
        if user is None:
            continue
        notifications.append(
            Notification(
                user=user,
                notification_type=notification_type,
                title=title,
                body=body,
                link=link,
            )
        )
    if notifications:
        Notification.objects.bulk_create(notifications)


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

        # Filter by status if provided
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

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
        if self.action in ["create", "update", "partial_update", "batch_input", "submit_for_approval"]:
            return [IsTeacherUser()] if self.request.user.role == "teacher" else [IsAdminUser()]
        if self.action in ["publish", "reject", "lock", "unlock", "approval_queue"]:
            return [IsAdminOrPrincipal()] if self.request.user.role == "principal" else [IsAdminUser()]
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

        with transaction.atomic():
            for grade_data in serializer.validated_data:
                student_id = grade_data["student_id"]

                try:
                    enrollment = ClassEnrollment.objects.get(
                        classroom=class_subject.classroom,
                        student_id=student_id,
                        status="active",
                    )
                except ClassEnrollment.DoesNotExist:
                    continue

                grade, created = Grade.objects.get_or_create(
                    class_enrollment=enrollment,
                    class_subject=class_subject,
                    quarter=quarter,
                )

                if grade.status in ["pending_approval", "published", "locked"]:
                    continue

                if "ww_score" in grade_data:
                    grade.ww_score = grade_data["ww_score"]
                if "pt_score" in grade_data:
                    grade.pt_score = grade_data["pt_score"]
                if "qa_score" in grade_data:
                    grade.qa_score = grade_data["qa_score"]
                if "remarks" in grade_data:
                    grade.remarks = grade_data["remarks"]

                grade.save()

                GradePublishEvent.objects.create(
                    grade=grade,
                    action="edited" if not created else "computed",
                    actor=request.user,
                )

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
    def submit_for_approval(self, request):
        """Submit a class-subject-quarter grade set for principal approval."""
        if request.user.role not in ["teacher", "admin"]:
            return Response(
                {"error": "Only teachers and admins can submit grades for approval"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = GradeWorkflowActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        class_subject_id = serializer.validated_data["class_subject_id"]
        quarter_id = serializer.validated_data["quarter_id"]
        reason = serializer.validated_data.get("reason", "")

        grades = Grade.objects.filter(
            class_subject_id=class_subject_id,
            quarter_id=quarter_id,
        ).select_related("class_subject", "quarter", "class_enrollment__student")

        if not grades.exists():
            return Response(
                {"error": "No grades found to submit"},
                status=status.HTTP_404_NOT_FOUND,
            )

        incomplete_count = grades.filter(
            Q(ww_score__isnull=True) | Q(pt_score__isnull=True) | Q(qa_score__isnull=True)
        ).count()
        if incomplete_count:
            return Response(
                {"error": f"{incomplete_count} grade record(s) are incomplete and cannot be submitted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        submitted_count = 0
        with transaction.atomic():
            for grade in grades:
                if grade.status in ["published", "locked"]:
                    continue
                grade.status = "pending_approval"
                grade.save(update_fields=["status", "updated_at"])
                GradePublishEvent.objects.create(
                    grade=grade,
                    action="submitted",
                    actor=request.user,
                    reason=reason,
                )
                submitted_count += 1

            approvers = list(
                request.user.__class__.objects.filter(role__in=["principal", "admin"], is_active=True)
            )
            if approvers:
                first_grade = grades.first()
                _notify_users(
                    approvers,
                    "grade",
                    "Grades pending approval",
                    f"{first_grade.class_subject.classroom.name} - {first_grade.class_subject.subject.name} for {first_grade.quarter.name} is awaiting review.",
                    "/approvals",
                )

        return Response(
            {
                "message": f"Submitted {submitted_count} grades for approval",
                "count": submitted_count,
            }
        )

    @action(detail=False, methods=["post"])
    def publish(self, request):
        """Approve and publish grades for a class-subject-quarter."""
        if request.user.role not in ["principal", "admin"]:
            return Response(
                {"error": "Only principals and admins can publish grades"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = GradeWorkflowActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        class_subject_id = serializer.validated_data["class_subject_id"]
        quarter_id = serializer.validated_data["quarter_id"]
        reason = serializer.validated_data.get("reason", "")

        grades = Grade.objects.filter(
            class_subject_id=class_subject_id,
            quarter_id=quarter_id,
            status="pending_approval",
        ).select_related("class_subject", "quarter", "class_enrollment__student")

        if not grades.exists():
            return Response(
                {"error": "No pending grades found to publish"},
                status=status.HTTP_404_NOT_FOUND,
            )

        published_count = 0
        students_to_notify = []

        with transaction.atomic():
            for grade in grades:
                grade.status = "published"
                grade.save(update_fields=["status", "updated_at"])
                GradePublishEvent.objects.create(
                    grade=grade,
                    action="approved",
                    actor=request.user,
                    reason=reason,
                )
                GradePublishEvent.objects.create(
                    grade=grade,
                    action="published",
                    actor=request.user,
                    reason=reason,
                )
                students_to_notify.append(grade.class_enrollment.student)
                published_count += 1

            if students_to_notify:
                first_grade = grades.first()
                _notify_users(
                    students_to_notify,
                    "grade",
                    "Grades published",
                    f"Your {first_grade.class_subject.subject.name} grade for {first_grade.quarter.name} is now available.",
                    "/grades",
                )

        return Response(
            {
                "message": f"Published {published_count} grades successfully",
                "count": published_count,
            }
        )

    @action(detail=False, methods=["post"])
    def reject(self, request):
        """Reject a submitted grade set back to draft/computed state."""
        if request.user.role not in ["principal", "admin"]:
            return Response(
                {"error": "Only principals and admins can reject grades"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = GradeWorkflowActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data.get("reason", "").strip()
        if len(reason) < 10:
            return Response(
                {"error": "A rejection reason with at least 10 characters is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        grades = Grade.objects.filter(
            class_subject_id=serializer.validated_data["class_subject_id"],
            quarter_id=serializer.validated_data["quarter_id"],
            status="pending_approval",
        ).select_related("class_subject", "quarter")

        if not grades.exists():
            return Response(
                {"error": "No pending grades found to reject"},
                status=status.HTTP_404_NOT_FOUND,
            )

        rejected_count = 0
        with transaction.atomic():
            for grade in grades:
                grade.status = "computed"
                grade.save(update_fields=["status", "updated_at"])
                GradePublishEvent.objects.create(
                    grade=grade,
                    action="edited",
                    actor=request.user,
                    reason=reason,
                    metadata={"result": "rejected"},
                )
                rejected_count += 1

            teacher = grades.first().class_subject.teacher if grades.first() else None
            if teacher:
                first_grade = grades.first()
                _notify_users(
                    [teacher],
                    "grade",
                    "Grades returned for revision",
                    f"{first_grade.class_subject.classroom.name} - {first_grade.class_subject.subject.name} for {first_grade.quarter.name} needs updates.",
                    "/grades/input",
                )

        return Response(
            {"message": f"Returned {rejected_count} grades for revision", "count": rejected_count}
        )

    @action(detail=False, methods=["post"])
    def lock(self, request):
        """Lock published grades after release."""
        if request.user.role not in ["principal", "admin"]:
            return Response(
                {"error": "Only principals and admins can lock grades"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = PublishGradesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        grades = Grade.objects.filter(
            class_subject_id=serializer.validated_data["class_subject_id"],
            quarter_id=serializer.validated_data["quarter_id"],
            status="published",
        )
        if not grades.exists():
            return Response(
                {"error": "No published grades found to lock"},
                status=status.HTTP_404_NOT_FOUND,
            )

        locked_count = 0
        with transaction.atomic():
            for grade in grades:
                grade.status = "locked"
                grade.save(update_fields=["status", "updated_at"])
                GradePublishEvent.objects.create(
                    grade=grade,
                    action="published",
                    actor=request.user,
                    metadata={"result": "locked"},
                )
                locked_count += 1

        return Response(
            {
                "message": f"Locked {locked_count} grades successfully",
                "count": locked_count,
            }
        )

    @action(detail=True, methods=["post"])
    def unlock(self, request, pk=None):
        """Unlock a published grade for editing."""
        if request.user.role not in ["principal", "admin"]:
            return Response(
                {"error": "Only principals and admins can unlock grades"},
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

    @action(detail=False, methods=["get"])
    def approval_queue(self, request):
        """Return grouped grade approval queue for principals/admins."""
        grades = (
            Grade.objects.filter(status="pending_approval")
            .select_related(
                "class_subject",
                "class_subject__subject",
                "class_subject__classroom",
                "class_subject__teacher",
                "quarter",
                "class_enrollment__student",
                "class_enrollment__student__profile",
            )
            .order_by("class_subject__classroom__name", "class_subject__subject__name", "quarter__number")
        )

        quarter_id = request.query_params.get("quarter")
        if quarter_id:
            grades = grades.filter(quarter_id=quarter_id)

        grouped = defaultdict(lambda: {"meta": None, "grades": [], "latest_submitted_at": None})
        for grade in grades:
            key = f"{grade.class_subject_id}:{grade.quarter_id}"
            latest_event = grade.publish_events.filter(action="submitted").aggregate(latest=Max("created_at"))
            latest_submitted_at = latest_event.get("latest")

            if grouped[key]["meta"] is None:
                grouped[key]["meta"] = {
                    "class_subject_id": str(grade.class_subject_id),
                    "quarter_id": str(grade.quarter_id),
                    "classroom_name": grade.class_subject.classroom.name,
                    "subject_name": grade.class_subject.subject.name,
                    "teacher_name": grade.class_subject.teacher.display_name if grade.class_subject.teacher else "Unassigned",
                    "quarter_name": grade.quarter.name,
                }
            grouped[key]["grades"].append(GradeSerializer(grade).data)
            grouped[key]["latest_submitted_at"] = latest_submitted_at

        queue = []
        for group in grouped.values():
            queue.append(
                {
                    **group["meta"],
                    "latest_submitted_at": group["latest_submitted_at"],
                    "student_count": len(group["grades"]),
                    "grades": group["grades"],
                }
            )

        queue.sort(key=lambda item: item["latest_submitted_at"] or "", reverse=True)
        return Response(queue)

    @action(detail=False, methods=["get"])
    def transmutation_table(self, request):
        """Return DepEd transmutation table for frontend use."""
        from .models import DEPED_TRANSMUTATION
        
        # Convert to list of dictionaries for easier frontend consumption
        table = [
            {"initial_grade": float(initial), "transmuted_grade": transmuted}
            for initial, transmuted in sorted(DEPED_TRANSMUTATION.items(), reverse=True)
        ]
        
        return Response({
            "table": table,
            "description": "DepEd Transmutation Table (Initial Grade → Transmuted Grade)",
            "passing_grade": 75,
            "grade_range": {"min": 60, "max": 100}
        })

    @action(detail=False, methods=["get"])
    def sf9(self, request):
        """Generate SF9 PDF for a student."""
        student_id = request.query_params.get("student")
        if not student_id:
            return Response({"error": "student ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            enrollment = ClassEnrollment.objects.get(student_id=student_id, status="active")
        except ClassEnrollment.DoesNotExist:
            return Response({"error": "Student enrollment not found"}, status=status.HTTP_404_NOT_FOUND)

        # 1. Fetch Student Info
        student_data = {
            "name": enrollment.student.display_name,
            "lrn": enrollment.student.profile.lrn,
            "grade_level": enrollment.classroom.grade_level,
            "section": enrollment.classroom.section,
            "academic_year": enrollment.classroom.academic_year.label,
            "sex": getattr(enrollment.student.profile, 'sex', 'N/A'),
        }

        # 2. Fetch Grades
        grades_qs = Grade.objects.filter(class_enrollment=enrollment, status__in=["published", "locked"])
        grades_data = {}
        for g in grades_qs:
            subj_name = g.class_subject.subject.name
            if subj_name not in grades_data:
                grades_data[subj_name] = {}
            grades_data[subj_name][g.quarter.number] = g.transmuted_grade
            
        # Compute Final Grades
        for subj_name, quarters in grades_data.items():
            valid_grades = [v for k, v in quarters.items() if isinstance(k, int)]
            if len(valid_grades) == 4:
                grades_data[subj_name]['final'] = round(sum(valid_grades) / 4)

        # 3. Fetch Conduct Ratings
        conduct_qs = ConductRating.objects.filter(class_enrollment=enrollment)
        conduct_data = {}
        for c in conduct_qs:
            cv_label = c.get_core_value_display()
            if cv_label not in conduct_data:
                conduct_data[cv_label] = {}
            if c.behavior not in conduct_data[cv_label]:
                conduct_data[cv_label][c.behavior] = {}
            conduct_data[cv_label][c.behavior][c.quarter.number] = c.rating

        # 4. Fetch Attendance (Rollup)
        # For simplicity in MVP, we'll just send empty data for now or a basic summary
        attendance_data = {} 

        generator = SF9Generator(student_data, grades_data, conduct_data, attendance_data)
        pdf_content = generator.generate()

        response = HttpResponse(pdf_content, content_type='application/pdf')
        filename = f"SF9_{enrollment.student.profile.lrn}_{enrollment.classroom.academic_year.label}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


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

        # Only admins, principals, and teachers can view audit logs
        if self.request.user.role not in ["admin", "principal", "teacher"]:
            return queryset.none()

        return queryset


class ConductRatingViewSet(viewsets.ModelViewSet):
    """Conduct rating management."""

    queryset = ConductRating.objects.select_related(
        "class_enrollment",
        "class_enrollment__student",
        "class_enrollment__student__profile",
        "quarter",
    ).all()
    serializer_class = ConductRatingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Filter by quarter if provided
        quarter_id = self.request.query_params.get("quarter")
        if quarter_id:
            queryset = queryset.filter(quarter_id=quarter_id)

        # Filter by student if provided
        student_id = self.request.query_params.get("student")
        if student_id:
            queryset = queryset.filter(class_enrollment__student_id=student_id)

        # Filter by classroom if provided
        classroom_id = self.request.query_params.get("classroom")
        if classroom_id:
            queryset = queryset.filter(class_enrollment__classroom_id=classroom_id)

        # Role-based filtering
        if user.role == "student":
            # Students see only their own ratings
            queryset = queryset.filter(class_enrollment__student=user)
        elif user.role == "teacher":
            # Teachers see ratings from their advisory classes
            queryset = queryset.filter(class_enrollment__classroom__adviser=user)

        return queryset

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy", "batch_input"]:
            return [IsTeacherUser()] if self.request.user.role == "teacher" else [IsAdminUser()]
        return [IsAuthenticated()]

    @action(detail=False, methods=["post"])
    def batch_input(self, request):
        """Batch conduct rating input for a classroom-quarter."""
        classroom_id = request.data.get("classroom_id")
        quarter_id = request.data.get("quarter_id")
        ratings_data = request.data.get("ratings", [])

        if not classroom_id or not quarter_id:
            return Response(
                {"error": "classroom_id and quarter_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            quarter = Quarter.objects.get(id=quarter_id)
        except Quarter.DoesNotExist:
            return Response(
                {"error": "Invalid quarter_id"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Validate ratings data
        serializer = ConductRatingInputSerializer(data=ratings_data, many=True)
        serializer.is_valid(raise_exception=True)

        created_count = 0
        updated_count = 0

        for rating_data in serializer.validated_data:
            student_id = rating_data["student_id"]

            # Get enrollment
            try:
                enrollment = ClassEnrollment.objects.get(
                    classroom_id=classroom_id,
                    student_id=student_id,
                    status="active",
                )
            except ClassEnrollment.DoesNotExist:
                continue

            # Update or create conduct rating
            rating, created = ConductRating.objects.update_or_create(
                class_enrollment=enrollment,
                quarter=quarter,
                core_value=rating_data["core_value"],
                behavior=rating_data["behavior"],
                defaults={
                    "rating": rating_data["rating"]
                }
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        return Response(
            {
                "message": "Conduct ratings saved successfully",
                "created": created_count,
                "updated": updated_count,
            }
        )
