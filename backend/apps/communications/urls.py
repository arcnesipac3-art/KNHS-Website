from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnnouncementViewSet, NotificationViewSet, NotificationPreferencesViewSet, MessageThreadViewSet, MessageViewSet, CounselingCaseViewSet

router = DefaultRouter()
router.register(r"announcements", AnnouncementViewSet, basename="announcement")
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"notification-preferences", NotificationPreferencesViewSet, basename="notification-preferences")
router.register(r"message-threads", MessageThreadViewSet, basename="message-thread")
router.register(r"messages", MessageViewSet, basename="message")
router.register(r"counseling-cases", CounselingCaseViewSet, basename="counseling-case")

urlpatterns = [
    path("", include(router.urls)),
]
