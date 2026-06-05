from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AcademicYearViewSet,
    QuarterViewSet,
    SubjectViewSet,
    ClassroomViewSet,
    ClassSubjectViewSet,
    ClassEnrollmentViewSet,
    SchoolEventViewSet,
    PeriodViewSet,
    TimetableSlotViewSet,
)

router = DefaultRouter()
router.register(r"academic-years", AcademicYearViewSet, basename="academic-year")
router.register(r"quarters", QuarterViewSet, basename="quarter")
router.register(r"subjects", SubjectViewSet, basename="subject")
router.register(r"classrooms", ClassroomViewSet, basename="classroom")
router.register(r"class-subjects", ClassSubjectViewSet, basename="class-subject")
router.register(r"enrollments", ClassEnrollmentViewSet, basename="enrollment")
router.register(r"events", SchoolEventViewSet, basename="event")
router.register(r"periods", PeriodViewSet, basename="period")
router.register(r"timetable", TimetableSlotViewSet, basename="timetable")

urlpatterns = [
    path("", include(router.urls)),
]
