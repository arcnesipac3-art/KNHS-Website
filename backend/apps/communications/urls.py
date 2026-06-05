from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnnouncementViewSet, NotificationViewSet, NotificationPreferencesViewSet

router = DefaultRouter()
router.register(r"announcements", AnnouncementViewSet, basename="announcement")
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"notification-preferences", NotificationPreferencesViewSet, basename="notification-preferences")

urlpatterns = [
    path("", include(router.urls)),
]
