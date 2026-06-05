from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EnrollmentApplicationViewSet

router = DefaultRouter()
router.register(r'enrollment-applications', EnrollmentApplicationViewSet, basename='enrollment-application')

urlpatterns = [
    path('', include(router.urls)),
]
