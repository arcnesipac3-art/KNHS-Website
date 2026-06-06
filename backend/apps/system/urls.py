from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AnalyticsViewSet, DashboardView, AuditLogViewSet

router = DefaultRouter()
router.register('analytics', AnalyticsViewSet, basename='analytics')
router.register('audit-logs', AuditLogViewSet, basename='audit-logs')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
]
