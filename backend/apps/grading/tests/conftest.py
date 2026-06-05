"""
Shared test fixtures for grading app tests.
"""
import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.academics.models import AcademicYear, Classroom, Subject, ClassSubject, Quarter, ClassEnrollment
from apps.grading.models import Grade


@pytest.fixture
def api_client():
    """Return an API client for testing."""
    return APIClient()


@pytest.fixture
def academic_year():
    """Create and return an active academic year."""
    return AcademicYear.objects.create(
        label="2026-2027",
        start_date="2026-06-01",
        end_date="2027-03-31",
        is_active=True
    )


@pytest.fixture
def quarter(academic_year):
    """Create and return a quarter."""
    return Quarter.objects.create(
        academic_year=academic_year,
        number=1,
        name="Q1",
        start_date="2026-06-01",
        end_date="2026-09-30"
    )


@pytest.fixture
def subject():
    """Create and return a subject."""
    return Subject.objects.create(
        name="Mathematics",
        code="MATH7"
    )


@pytest.fixture
def classroom(academic_year):
    """Create and return a classroom."""
    return Classroom.objects.create(
        name="Grade 7-A",
        grade_level=7,
        section="A",
        academic_year=academic_year
    )


@pytest.fixture
def admin_user():
    """Create and return an admin user."""
    return User.objects.create_user(
        email="admin@test.com",
        password="test123",
        role="admin",
        first_name="Admin",
        last_name="User"
    )


@pytest.fixture
def principal_user():
    """Create and return a principal user."""
    return User.objects.create_user(
        email="principal@test.com",
        password="test123",
        role="principal",
        first_name="Principal",
        last_name="User"
    )


@pytest.fixture
def teacher_user():
    """Create and return a teacher user."""
    return User.objects.create_user(
        email="teacher@test.com",
        password="test123",
        role="teacher",
        first_name="Teacher",
        last_name="User"
    )


@pytest.fixture
def student_user():
    """Create and return a student user."""
    return User.objects.create_user(
        email="student@test.com",
        password="test123",
        role="student",
        first_name="Student",
        last_name="User"
    )


@pytest.fixture
def class_subject(classroom, subject, teacher_user):
    """Create and return a class subject assignment."""
    return ClassSubject.objects.create(
        classroom=classroom,
        subject=subject,
        teacher=teacher_user
    )


@pytest.fixture
def enrollment(classroom, student_user):
    """Create and return a student enrollment."""
    return ClassEnrollment.objects.create(
        classroom=classroom,
        student=student_user,
        status="active"
    )


@pytest.fixture
def computed_grade(enrollment, class_subject, quarter):
    """Create and return a grade in computed status."""
    return Grade.objects.create(
        class_enrollment=enrollment,
        class_subject=class_subject,
        quarter=quarter,
        ww_score=85.0,
        pt_score=90.0,
        qa_score=88.0,
        status="computed"
    )


@pytest.fixture
def pending_grade(enrollment, class_subject, quarter):
    """Create and return a grade in pending_approval status."""
    return Grade.objects.create(
        class_enrollment=enrollment,
        class_subject=class_subject,
        quarter=quarter,
        ww_score=85.0,
        pt_score=90.0,
        qa_score=88.0,
        status="pending_approval"
    )


@pytest.fixture
def published_grade(enrollment, class_subject, quarter):
    """Create and return a grade in published status."""
    return Grade.objects.create(
        class_enrollment=enrollment,
        class_subject=class_subject,
        quarter=quarter,
        ww_score=85.0,
        pt_score=90.0,
        qa_score=88.0,
        status="published"
    )


@pytest.fixture
def locked_grade(enrollment, class_subject, quarter):
    """Create and return a grade in locked status."""
    return Grade.objects.create(
        class_enrollment=enrollment,
        class_subject=class_subject,
        quarter=quarter,
        ww_score=85.0,
        pt_score=90.0,
        qa_score=88.0,
        status="locked"
    )
