from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse
import time

# Lightweight health check — no DB, no auth, <5ms response
# Used by frontend keep-alive and Render health monitoring
def health_check(request):
    return JsonResponse({
        "status": "ok",
        "timestamp": int(time.time()),
    })

urlpatterns = [
    path("api/health/", health_check),
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
