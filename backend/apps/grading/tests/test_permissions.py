"""
Permission tests for grading system.
Tests role-based access control for all grading endpoints.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.academics.models import AcademicYear, Classroom, Subject, ClassSubject, Quarter, ClassEnrollment
from apps.grading.models import Grade


@pytest.mark.django_db
class TestGradePermissions:
    """Test permission controls for grade operations."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test data for all permission tests."""
        self.client = APIClient()

        # Create academic year and quarter
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

        # Create users for each role
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="test123",
            role="admin",
            first_name="Admin",
            last_name="User"
        )

        self.principal = User.objects.create_user(
            email="principal@test.com",
            password="test123",
            role="principal",
            first_name="Principal",
            last_name="User"
        )

        self.teacher = User.objects.create_user(
            email="teacher@test.com",
            password="test123",
            role="teacher",
            first_name="Teacher",
            last_name="User"
        )

        self.student = User.objects.create_user(
            email="student@test.com",
            password="test123",
            role="student",
            first_name="Student",
            last_name="User"
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

        # Create a grade
        self.grade = Grade.objects.create(
            class_enrollment=self.enrollment,
            class_subject=self.class_subject,
            quarter=self.quarter,
            ww_score=85.0,
            pt_score=90.0,
            qa_score=88.0,
            status="computed"
        )

    def test_anonymous_user_cannot_access_grades(self):
        """Anonymous users should be redirected/denied."""
        url = reverse('grade-list')
        response = self.client.get(url)
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_student_can_only_view_own_published_grades(self):
        """Students should only see their own published grades."""
        self.client.force_authenticate(user=self.student)
        url = reverse('grade-list')
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # Draft/computed grades should not be visible
        assert len(response.data) == 0

        # Publish the grade
        self.grade.status = "published"
        self.grade.save()

        response = self.client.get(url)
        assert len(response.data) == 1

    def test_student_cannot_access_other_student_grades(self):
        """Students cannot view grades of other students."""
        # Create another student
        other_student = User.objects.create_user(
            email="other@test.com",
            password="test123",
            role="student"
        )

        self.client.force_authenticate(user=other_student)
        url = reverse('grade-detail', args=[self.grade.id])
        response = self.client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_student_cannot_batch_input_grades(self):
        """Students cannot input grades."""
        self.client.force_authenticate(user=self.student)
        url = reverse('grade-batch-input')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id),
            'grades': []
        }
        response = self.client.post(url, data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_teacher_can_input_grades(self):
        """Teachers can input grades for their classes."""
        self.client.force_authenticate(user=self.teacher)
        url = reverse('grade-batch-input')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id),
            'grades': [{
                'student_id': str(self.student.id),
                'ww_score': 90.0,
                'pt_score': 92.0,
                'qa_score': 88.0
            }]
        }
        response = self.client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK

    def test_teacher_can_submit_for_approval(self):
        """Teachers can submit grades for approval."""
        self.client.force_authenticate(user=self.teacher)
        url = reverse('grade-submit-for-approval')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id),
            'reason': 'Ready for review'
        }
        response = self.client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK

    def test_teacher_cannot_approve_grades(self):
        """Teachers cannot approve their own grades."""
        self.grade.status = "pending_approval"
        self.grade.save()

        self.client.force_authenticate(user=self.teacher)
        url = reverse('grade-publish')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id)
        }
        response = self.client.post(url, data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_teacher_cannot_lock_grades(self):
        """Teachers cannot lock grades."""
        self.grade.status = "published"
        self.grade.save()

        self.client.force_authenticate(user=self.teacher)
        url = reverse('grade-lock')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id)
        }
        response = self.client.post(url, data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_teacher_cannot_unlock_grades(self):
        """Teachers cannot unlock grades."""
        self.grade.status = "locked"
        self.grade.save()

        self.client.force_authenticate(user=self.teacher)
        url = reverse('grade-unlock', args=[self.grade.id])
        data = {'reason': 'Emergency correction needed for data entry error'}
        response = self.client.post(url, data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_principal_can_approve_grades(self):
        """Principals can approve submitted grades."""
        self.grade.status = "pending_approval"
        self.grade.save()

        self.client.force_authenticate(user=self.principal)
        url = reverse('grade-publish')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id),
            'reason': 'Approved after review'
        }
        response = self.client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK

    def test_principal_can_reject_grades(self):
        """Principals can reject submitted grades."""
        self.grade.status = "pending_approval"
        self.grade.save()

        self.client.force_authenticate(user=self.principal)
        url = reverse('grade-reject')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id),
            'reason': 'Please review student scores for accuracy'
        }
        response = self.client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK

    def test_principal_can_lock_grades(self):
        """Principals can lock published grades."""
        self.grade.status = "published"
        self.grade.save()

        self.client.force_authenticate(user=self.principal)
        url = reverse('grade-lock')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id)
        }
        response = self.client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK

    def test_principal_cannot_unlock_grades(self):
        """Principals cannot unlock grades (admin only)."""
        self.grade.status = "locked"
        self.grade.save()

        self.client.force_authenticate(user=self.principal)
        url = reverse('grade-unlock', args=[self.grade.id])
        data = {'reason': 'Emergency correction needed for data entry error'}
        response = self.client.post(url, data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_unlock_grades(self):
        """Admins can unlock locked grades."""
        self.grade.status = "locked"
        self.grade.save()

        self.client.force_authenticate(user=self.admin)
        url = reverse('grade-unlock', args=[self.grade.id])
        data = {'reason': 'Emergency correction needed for data entry error discovered during audit'}
        response = self.client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK

    def test_admin_has_all_permissions(self):
        """Admins can perform all grade operations."""
        self.client.force_authenticate(user=self.admin)

        # Can input
        url = reverse('grade-batch-input')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id),
            'grades': []
        }
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK

        # Can approve
        self.grade.status = "pending_approval"
        self.grade.save()
        url = reverse('grade-publish')
        data = {
            'class_subject_id': str(self.class_subject.id),
            'quarter_id': str(self.quarter.id)
        }
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK

        # Can lock
        url = reverse('grade-lock')
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK

        # Can unlock
        url = reverse('grade-unlock', args=[self.grade.id])
        data = {'reason': 'Admin emergency unlock for correction'}
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestTransmutationTablePermissions:
    """Test transmutation table endpoint is public."""

    def test_anonymous_can_access_transmutation_table(self):
        """Transmutation table should be publicly accessible."""
        client = APIClient()
        url = reverse('grade-transmutation-table')
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'table' in response.data
        assert 'passing_grade' in response.data
        assert response.data['passing_grade'] == 75
