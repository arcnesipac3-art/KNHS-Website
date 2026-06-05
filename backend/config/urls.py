from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.academics.urls")),
    path("api/v1/", include("apps.learning.urls")),
    path("api/v1/", include("apps.grading.urls")),
    path("api/v1/", include("apps.attendance.urls")),
    path("api/v1/", include("apps.communications.urls")),
    path("api/v1/", include("apps.enrollment.urls")),
    path("api/v1/", include("apps.system.urls")),
    path("api/v1/", include("apps.core.urls")),
]
