from types import SimpleNamespace

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db.models import Count
from django.utils import timezone

from .models import Message, MessageThread
from .serializers import MessageSerializer, MessageThreadSerializer


def get_thread_room_name(thread_id):
    return f"thread_{thread_id}"


def get_user_room_name(user_id):
    return f"user_{user_id}"


def find_existing_thread_for_participants(current_user, participant_ids, subject=""):
    normalized_subject = (subject or "").strip()
    all_ids = [str(current_user.id), *[str(participant_id) for participant_id in participant_ids]]
    unique_ids = sorted(set(all_ids))

    queryset = MessageThread.objects.annotate(
        participant_count=Count("participants", distinct=True)
    ).filter(
        participant_count=len(unique_ids),
        subject=normalized_subject,
    )

    for participant_id in unique_ids:
        queryset = queryset.filter(participants__id=participant_id)

    return queryset.distinct().first()


def get_or_create_thread_for_participants(current_user, participant_ids, subject=""):
    existing_thread = find_existing_thread_for_participants(
        current_user=current_user,
        participant_ids=participant_ids,
        subject=subject,
    )
    if existing_thread:
        return existing_thread, False

    thread = MessageThread.objects.create(subject=(subject or "").strip())
    thread.participants.add(current_user, *participant_ids)
    return thread, True


def create_message_for_thread(thread, sender, content):
    if not thread.participants.filter(id=sender.id).exists():
        raise ValueError("You are not a participant in this conversation.")

    message = Message.objects.create(
        thread=thread,
        sender=sender,
        content=content.strip(),
    )
    thread.updated_at = timezone.now()
    thread.save(update_fields=["updated_at"])
    return message


def serialize_message(message):
    return MessageSerializer(message).data


def serialize_thread_for_user(thread, user):
    return MessageThreadSerializer(
        thread,
        context={"request": SimpleNamespace(user=user)},
    ).data


def broadcast_thread_updated(thread):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    for participant in thread.participants.all():
        async_to_sync(channel_layer.group_send)(
            get_user_room_name(participant.id),
            {
                "type": "thread.updated",
                "thread": serialize_thread_for_user(thread, participant),
            },
        )


def broadcast_message_created(thread, message):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    async_to_sync(channel_layer.group_send)(
        get_thread_room_name(thread.id),
        {
            "type": "message.created",
            "thread_id": str(thread.id),
            "message": serialize_message(message),
        },
    )
    broadcast_thread_updated(thread)
