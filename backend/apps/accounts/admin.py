from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    extra = 0


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("email",)
    list_display = ("email", "role", "is_active", "is_approved", "created_at")
    list_filter = ("role", "is_active", "is_approved", "is_verified")
    search_fields = ("email", "profile__first_name", "profile__last_name", "profile__lrn")
    inlines = (UserProfileInline,)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Role & Status", {"fields": ("role", "is_active", "is_verified", "is_approved", "must_change_password")}),
        ("Permissions", {"fields": ("is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2", "role", "is_staff", "is_superuser"),
            },
        ),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("full_name", "user", "lrn", "grade_level", "strand")
    search_fields = ("first_name", "last_name", "lrn", "user__email")
