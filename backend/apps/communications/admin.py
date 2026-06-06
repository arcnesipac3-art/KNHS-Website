from django.contrib import admin
from .models import (
    Announcement, AnnouncementAttachment, AnnouncementRead, Notification,
    AnnouncementLike, AnnouncementComment, MessageThread, Message,
    CounselingCase, CounselingNote, Friendship
)


class AnnouncementAttachmentInline(admin.TabularInline):
    model = AnnouncementAttachment
    extra = 1
    readonly_fields = ["created_at"]


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ["title", "author", "audience_type", "priority", "published_at", "is_published", "is_expired"]
    list_filter = ["audience_type", "priority", "published_at", "expires_at"]
    search_fields = ["title", "body", "author__email"]
    readonly_fields = ["author", "is_published", "is_expired", "created_at", "updated_at"]
    ordering = ["-published_at", "-created_at"]
    inlines = [AnnouncementAttachmentInline]
    date_hierarchy = "published_at"
    
    fieldsets = (
        ("Content", {
            "fields": ("title", "body", "priority")
        }),
        ("Audience", {
            "fields": ("audience_type", "audience_ref_id", "audience_metadata")
        }),
        ("Publishing", {
            "fields": ("published_at", "expires_at", "is_published", "is_expired")
        }),
        ("Metadata", {
            "fields": ("author", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(AnnouncementRead)
class AnnouncementReadAdmin(admin.ModelAdmin):
    list_display = ["user", "announcement", "read_at"]
    list_filter = ["read_at"]
    search_fields = ["user__email", "announcement__title"]
    readonly_fields = ["announcement", "user", "read_at"]
    ordering = ["-read_at"]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["title", "user", "notification_type", "is_read", "created_at"]
    list_filter = ["notification_type", "is_read", "created_at"]
    search_fields = ["title", "body", "user__email"]
    readonly_fields = ["created_at"]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"


@admin.register(AnnouncementLike)
class AnnouncementLikeAdmin(admin.ModelAdmin):
    list_display = ["user", "announcement", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["user__email", "announcement__title"]
    readonly_fields = ["created_at"]


@admin.register(AnnouncementComment)
class AnnouncementCommentAdmin(admin.ModelAdmin):
    list_display = ["user", "announcement", "content", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["user__email", "announcement__title", "content"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display = ["requester", "recipient", "status", "created_at", "updated_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["requester__email", "recipient__email"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]
