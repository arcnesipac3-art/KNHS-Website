from django.db import connection
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        db_ok = True
        try:
            connection.ensure_connection()
        except Exception:
            db_ok = False

        return Response(
            {
                "status": "ok" if db_ok else "degraded",
                "db": "ok" if db_ok else "error",
                "version": "0.1.0",
            }
        )


ROLE_HOME = {
    "student": "/dashboard",
    "teacher": "/dashboard",
    "admin": "/dashboard",
    "principal": "/dashboard",
    "guidance": "/dashboard",
    "registrar": "/dashboard",
    "parent": "/dashboard",
}


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role

        base = {
            "role": role,
            "home_path": ROLE_HOME.get(role, "/dashboard"),
            "display_name": user.display_name,
            "message": f"Welcome to the KNHS Official Digital Campus, {user.display_name}.",
        }

        widgets = {
            "student": {
                "quick_actions": ["Join Class", "View Assignments", "Check Grades"],
                "kpis": {"pending_assignments": 0, "overdue": 0, "published_grades": 0},
            },
            "teacher": {
                "quick_actions": ["Create Assignment", "Mark Attendance", "Input Grades"],
                "kpis": {"total_students": 0, "pending_grades": 0, "submissions_this_week": 0},
            },
            "admin": {
                "quick_actions": ["Add User", "Review Enrollment", "Post Announcement", "Settings"],
                "kpis": {"total_students": 0, "total_teachers": 0, "active_classes": 0},
            },
            "principal": {
                "quick_actions": ["Approval Center", "School Analytics", "Announcements"],
                "kpis": {"pending_approvals": 0, "enrollment_pending": 0},
            },
            "guidance": {
                "quick_actions": ["Student Lookup", "Cases & Notes"],
                "kpis": {"active_cases": 0, "at_risk_students": 0},
            },
            "registrar": {
                "quick_actions": ["Enrollment Queue", "Student Records", "Section Assignment"],
                "kpis": {"pending_applications": 0, "documents_to_verify": 0},
            },
            "parent": {
                "quick_actions": ["View Child Grades", "Attendance", "Announcements"],
                "kpis": {"linked_children": 0},
            },
        }

        base["widgets"] = widgets.get(role, widgets["student"])
        return Response(base)
