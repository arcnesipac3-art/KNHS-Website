from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SchoolSettingsViewSet

router = DefaultRouter()
router.register('school-settings', SchoolSettingsViewSet, basename='school-settings')

urlpatterns = [
    path('', include(router.urls)),
]
