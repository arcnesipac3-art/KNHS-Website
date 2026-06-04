from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssignmentViewSet, SubmissionViewSet, LearningMaterialViewSet

router = DefaultRouter()
router.register(r"assignments", AssignmentViewSet, basename="assignment")
router.register(r"submissions", SubmissionViewSet, basename="submission")
router.register(r"learning-materials", LearningMaterialViewSet, basename="learning-material")

urlpatterns = [
    path("", include(router.urls)),
]
