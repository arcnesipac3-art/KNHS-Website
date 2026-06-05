from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """Allow access only to admin users."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == "admin"


class IsTeacherUser(permissions.BasePermission):
    """Allow access only to teacher users."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == "teacher"


class IsStudentUser(permissions.BasePermission):
    """Allow access only to student users."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == "student"


class IsTeacherOfClass(permissions.BasePermission):
    """Allow access only to teachers of the specific class."""

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True

        if request.user.role != "teacher":
            return False

        # Check if user is the adviser or teaches a subject in this class
        if hasattr(obj, "adviser"):
            # obj is a Classroom
            return obj.adviser == request.user or obj.class_subjects.filter(teacher=request.user).exists()
        elif hasattr(obj, "classroom"):
            # obj is related to a classroom (enrollment, assignment, etc.)
            classroom = obj.classroom
            return classroom.adviser == request.user or classroom.class_subjects.filter(
                teacher=request.user
            ).exists()

        return False


class IsAdviserOfClass(permissions.BasePermission):
    """Allow access only to advisers of the specific class."""

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True

        if request.user.role != "teacher":
            return False

        if hasattr(obj, "adviser"):
            return obj.adviser == request.user
        elif hasattr(obj, "classroom"):
            return obj.classroom.adviser == request.user

        return False


class IsAdminOrRegistrar(permissions.BasePermission):
    """Allow access only to admin or registrar users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["admin", "registrar"]
        )
