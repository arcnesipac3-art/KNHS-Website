from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AcademicYearViewSet,
    QuarterViewSet,
    SubjectViewSet,
    ClassroomViewSet,
    ClassSubjectViewSet,
    ClassEnrollmentViewSet,
)

router = DefaultRouter()
router.register(r"academic-years", AcademicYearViewSet, basename="academic-year")
router.register(r"quarters", QuarterViewSet, basename="quarter")
router.register(r"subjects", SubjectViewSet, basename="subject")
router.register(r"classrooms", ClassroomViewSet, basename="classroom")
router.register(r"class-subjects", ClassSubjectViewSet, basename="class-subject")
router.register(r"enrollments", ClassEnrollmentViewSet, basename="enrollment")

urlpatterns = [
    path("", include(router.urls)),
]
