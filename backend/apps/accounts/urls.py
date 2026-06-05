from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ChangePasswordView,
    LoginView,
    LogoutView,
    MeView,
    RefreshView,
    UpdateProfileView,
    UserManagementViewSet,
)

router = DefaultRouter()
router.register(r'users', UserManagementViewSet, basename='user')

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("auth/profile/", UpdateProfileView.as_view(), name="auth-update-profile"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
    
    # User management (admin only)
    path("", include(router.urls)),
]

