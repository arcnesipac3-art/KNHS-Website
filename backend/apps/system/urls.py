from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import DashboardView, HealthView, AnalyticsViewSet

router = DefaultRouter()
router.register('analytics', AnalyticsViewSet, basename='analytics')

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path('', include(router.urls)),
]
