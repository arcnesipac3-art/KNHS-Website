from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SchoolSettingsViewSet, ContentBlockViewSet

router = DefaultRouter()
router.register('school-settings', SchoolSettingsViewSet, basename='school-settings')
router.register('content-blocks', ContentBlockViewSet, basename='content-block')

urlpatterns = [
    path('', include(router.urls)),
]
