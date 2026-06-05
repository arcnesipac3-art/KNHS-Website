from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GradeViewSet, GradePublishEventViewSet, ConductRatingViewSet

router = DefaultRouter()
router.register(r"grades", GradeViewSet, basename="grade")
router.register(r"grade-events", GradePublishEventViewSet, basename="grade-event")
router.register(r"conduct-ratings", ConductRatingViewSet, basename="conduct-rating")

urlpatterns = [
    path("", include(router.urls)),
]
