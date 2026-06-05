"""
Workflow tests for grade state machine.
Tests the complete grade lifecycle and state transitions.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.academics.models import AcademicYear, Classroom, Subject, ClassSubject, Quarter, ClassEnrollment
from apps.grading.models import Grade, GradePublishEvent


@pytest.mark.django_db
class TestGradeWorkflow:
    """Test grade state machine and transitions."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test data."""
        self.client = APIClient()

        # Create academic data
        self.academic_year = AcademicYear.objects.create(
            label="2026-2027",
            start_date="2026-06-01",
            end_date="2027-03-31",
            is_active=True
        )
        self.quarter = Quarter.objects.create(
            academic_year=self.academic_year,
            number=1,
            name="Q1",
            start_date="2026-06-01",
            end_date="2026-09-30"
        )

        # Create subject and classroom
        self.subject = Subject.objects.create(name="Mathematics", code="MATH7")
        self.classroom = Classroom.objects.create(
            name="Grade 7-A",
            grade_level=7,
            section="A",
            academic_year=self.academic_year
        )

        # Create users
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="test123",
            role="admin"
        )
        self.principal = User.objects.create_user(
            email="principal@test.com",
            password="test123",
            role="principal"
        )
        self.teacher = User.objects.create_user(
            email="teacher@test.com",
            password="test123",
            role="teacher"
        )
        self.student = User.objects.create_user(
            email="student@test.com",
            password="test123",
            role="student"
        )

        # Create class subject
        self.class_subject = ClassSubject.objects.create(
            classroom=self.classroom,
            subject=self.subject,
            teacher=self.teacher
        )

        # Create student enrollment
        self.enrollment = ClassEnrollment.objects.create(
            classroom=self.classroom,
            student=self.student,
            status="active"
        )

    def test_complete_grade_lifecycle(self):
        """Test complete workflow: draft -> computed -> pending -> published -> locked."""
        # Step 1: Teacher inputs grades (creates as computed)
        self.client.force_authenticate(user=self.teacher)
        url = reverse('grade-batch-input')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id),
            'grades': [{
                'student_id': str(self.student.id),
                'ww_score': 85.0,
                'pt_score': 90.0,
                'qa_score': 88.0
            }]
        }
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK

        grade = Grade.objects.get(class_enrollment=self.enrollment)
        assert grade.status == "computed"

        # Step 2: Teacher submits for approval
        url = reverse('grade-submit-for-approval')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id),
            'reason': 'Ready for review'
        }
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK

        grade.refresh_from_db()
        assert grade.status == "pending_approval"

        # Step 3: Principal approves and publishes
        self.client.force_authenticate(user=self.principal)
        url = reverse('grade-publish')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id),
            'reason': 'Approved after review'
        }
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK

        grade.refresh_from_db()
        assert grade.status == "published"

        # Step 4: Principal locks grades
        url = reverse('grade-lock')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id)
        }
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK

        grade.refresh_from_db()
        assert grade.status == "locked"

        # Verify audit trail
        events = GradePublishEvent.objects.filter(grade=grade).order_by('created_at')
        assert events.count() >= 4  # computed, submitted, approved, published, locked

    def test_cannot_skip_approval_step(self):
        """Test that computed grades cannot be directly published."""
        # Create a computed grade
        grade = Grade.objects.create(
            class_enrollment=self.enrollment,
            class_subject=self.class_subject,
            quarter=self.quarter,
            ww_score=85.0,
            pt_score=90.0,
            qa_score=88.0,
            status="computed"
        )

        # Try to publish directly (should fail - no pending grades)
        self.client.force_authenticate(user=self.principal)
        url = reverse('grade-publish')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id)
        }
        response = self.client.post(url, data, format='json')

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'No pending grades' in response.data['error']

    def test_reject_returns_to_computed(self):
        """Test that rejecting grades returns them to computed state."""
        # Create pending grade
        grade = Grade.objects.create(
            class_enrollment=self.enrollment,
            class_subject=self.class_subject,
            quarter=self.quarter,
            ww_score=85.0,
            pt_score=90.0,
            qa_score=88.0,
            status="pending_approval"
        )

        # Principal rejects
        self.client.force_authenticate(user=self.principal)
        url = reverse('grade-reject')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id),
            'reason': 'Please review WW scores for accuracy'
        }
        response = self.client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        grade.refresh_from_db()
        assert grade.status == "computed"

    def test_cannot_edit_pending_grades(self):
        """Test that pending grades cannot be edited by teacher."""
        # Create pending grade
        grade = Grade.objects.create(
            class_enrollment=self.enrollment,
            class_subject=self.class_subject,
            quarter=self.quarter,
            ww_score=85.0,
            pt_score=90.0,
            qa_score=88.0,
            status="pending_approval"
        )

        # Try to batch input (should skip pending grades)
        self.client.force_authenticate(user=self.teacher)
        url = reverse('grade-batch-input')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id),
            'grades': [{
                'student_id': str(self.student.id),
                'ww_score': 95.0,  # Try to change
                'pt_score': 95.0,
                'qa_score': 95.0
            }]
        }
        response = self.client.post(url, data, format='json')

        # Should succeed but not update the pending grade
        assert response.status_code == status.HTTP_200_OK
        grade.refresh_from_db()
        assert grade.ww_score == 85.0  # Unchanged

    def test_cannot_edit_locked_grades(self):
        """Test that locked grades cannot be edited."""
        grade = Grade.objects.create(
            class_enrollment=self.enrollment,
            class_subject=self.class_subject,
            quarter=self.quarter,
            ww_score=85.0,
            pt_score=90.0,
            qa_score=88.0,
            status="locked"
        )

        # Try to edit
        self.client.force_authenticate(user=self.teacher)
        url = reverse('grade-batch-input')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id),
            'grades': [{
                'student_id': str(self.student.id),
                'ww_score': 95.0,
                'pt_score': 95.0,
                'qa_score': 95.0
            }]
        }
        response = self.client.post(url, data, format='json')

        # Should succeed but not update locked grade
        grade.refresh_from_db()
        assert grade.ww_score == 85.0  # Unchanged

    def test_unlock_returns_to_computed(self):
        """Test that unlocking returns grade to computed state."""
        grade = Grade.objects.create(
            class_enrollment=self.enrollment,
            class_subject=self.class_subject,
            quarter=self.quarter,
            ww_score=85.0,
            pt_score=90.0,
            qa_score=88.0,
            status="locked"
        )

        # Admin unlocks
        self.client.force_authenticate(user=self.admin)
        url = reverse('grade-unlock', args=[grade.id])
        data = {'reason': 'Emergency correction needed due to DepEd request for score verification'}
        response = self.client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        grade.refresh_from_db()
        assert grade.status == "computed"

    def test_cannot_lock_non_published_grades(self):
        """Test that only published grades can be locked."""
        grade = Grade.objects.create(
            class_enrollment=self.enrollment,
            class_subject=self.class_subject,
            quarter=self.quarter,
            ww_score=85.0,
            pt_score=90.0,
            qa_score=88.0,
            status="computed"
        )

        # Try to lock
        self.client.force_authenticate(user=self.principal)
        url = reverse('grade-lock')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id)
        }
        response = self.client.post(url, data, format='json')

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'No published grades' in response.data['error']

    def test_multiple_submit_approve_cycles(self):
        """Test that grades can go through multiple submit/reject cycles."""
        grade = Grade.objects.create(
            class_enrollment=self.enrollment,
            class_subject=self.class_subject,
            quarter=self.quarter,
            ww_score=85.0,
            pt_score=90.0,
            qa_score=88.0,
            status="computed"
        )

        # Cycle 1: Submit -> Reject
        self.client.force_authenticate(user=self.teacher)
        url = reverse('grade-submit-for-approval')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id),
            'reason': 'First submission'
        }
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK

        self.client.force_authenticate(user=self.principal)
        url = reverse('grade-reject')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id),
            'reason': 'Need corrections'
        }
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK

        # Cycle 2: Submit -> Approve
        self.client.force_authenticate(user=self.teacher)
        url = reverse('grade-submit-for-approval')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id),
            'reason': 'Resubmission after corrections'
        }
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK

        self.client.force_authenticate(user=self.principal)
        url = reverse('grade-publish')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id),
            'reason': 'Approved'
        }
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK

        grade.refresh_from_db()
        assert grade.status == "published"

    def test_audit_trail_completeness(self):
        """Test that all state transitions are logged."""
        # Create and transition a grade through all states
        grade = Grade.objects.create(
            class_enrollment=self.enrollment,
            class_subject=self.class_subject,
            quarter=self.quarter,
            ww_score=85.0,
            pt_score=90.0,
            qa_score=88.0,
            status="computed"
        )

        # Log initial creation
        GradePublishEvent.objects.create(
            grade=grade,
            action="computed",
            actor=self.teacher
        )

        # Submit for approval
        self.client.force_authenticate(user=self.teacher)
        url = reverse('grade-submit-for-approval')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id),
            'reason': 'Ready'
        }
        self.client.post(url, data, format='json')

        # Approve and publish
        self.client.force_authenticate(user=self.principal)
        url = reverse('grade-publish')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id),
            'reason': 'Approved'
        }
        self.client.post(url, data, format='json')

        # Lock
        url = reverse('grade-lock')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id)
        }
        self.client.post(url, data, format='json')

        # Unlock
        self.client.force_authenticate(user=self.admin)
        url = reverse('grade-unlock', args=[grade.id])
        data = {'reason': 'Emergency correction'}
        self.client.post(url, data, format='json')

        # Check audit trail
        events = GradePublishEvent.objects.filter(grade=grade).order_by('created_at')
        actions = list(events.values_list('action', flat=True))

        assert 'computed' in actions
        assert 'submitted' in actions
        assert 'approved' in actions
        assert 'published' in actions
        assert 'unlocked' in actions

        # Verify actors
        assert events.filter(actor=self.teacher).exists()
        assert events.filter(actor=self.principal).exists()
        assert events.filter(actor=self.admin).exists()
