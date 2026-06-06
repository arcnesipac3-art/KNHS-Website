from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .models import MessageThread
from .services import (
    create_message_for_thread,
    get_thread_room_name,
    get_user_room_name,
    serialize_message,
    serialize_thread_for_user,
)


class MessagesConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return

        self.user = user
        self.subscribed_threads = set()
        self.user_room_name = get_user_room_name(user.id)

        await self.channel_layer.group_add(self.user_room_name, self.channel_name)
        await self.accept()
        await self.send_json({"type": "connection.ready"})

    async def disconnect(self, close_code):
        for thread_id in list(getattr(self, "subscribed_threads", set())):
            await self.channel_layer.group_discard(
                get_thread_room_name(thread_id),
                self.channel_name,
            )
        if hasattr(self, "user_room_name"):
            await self.channel_layer.group_discard(self.user_room_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        event_type = content.get("type")

        if event_type == "thread.subscribe":
            await self.subscribe_thread(content.get("thread_id"))
            return

        if event_type == "thread.unsubscribe":
            await self.unsubscribe_thread(content.get("thread_id"))
            return

        if event_type == "message.send":
            await self.handle_send_message(content)
            return

        if event_type == "ping":
            await self.send_json({"type": "pong"})
            return

        await self.send_json(
            {
                "type": "error",
                "message": "Unsupported event type.",
            }
        )

    async def subscribe_thread(self, thread_id):
        if not thread_id:
            return

        if not await self.user_has_thread_access(thread_id):
            await self.send_json({"type": "error", "message": "Conversation not found."})
            return

        room_name = get_thread_room_name(thread_id)
        await self.channel_layer.group_add(room_name, self.channel_name)
        self.subscribed_threads.add(str(thread_id))
        await self.send_json({"type": "thread.subscribed", "thread_id": str(thread_id)})

    async def unsubscribe_thread(self, thread_id):
        if not thread_id:
            return

        room_name = get_thread_room_name(thread_id)
        await self.channel_layer.group_discard(room_name, self.channel_name)
        self.subscribed_threads.discard(str(thread_id))

    async def handle_send_message(self, content):
        thread_id = content.get("thread_id")
        message_text = (content.get("content") or "").strip()
        client_id = content.get("client_id")

        if not thread_id or not message_text:
            await self.send_json({"type": "error", "message": "thread_id and content are required."})
            return

        if not await self.user_has_thread_access(thread_id):
            await self.send_json({"type": "error", "message": "Conversation not found."})
            return

        thread, message_data, thread_payloads = await self.create_message_payloads(thread_id, message_text)

        await self.channel_layer.group_send(
            get_thread_room_name(thread.id),
            {
                "type": "message.created",
                "thread_id": str(thread.id),
                "message": message_data,
                "client_id": client_id,
            },
        )

        for payload in thread_payloads:
            await self.channel_layer.group_send(
                get_user_room_name(payload["user_id"]),
                {
                    "type": "thread.updated",
                    "thread": payload["thread"],
                },
            )

    async def message_created(self, event):
        await self.send_json(
            {
                "type": "message.created",
                "thread_id": event["thread_id"],
                "message": event["message"],
                "client_id": event.get("client_id"),
            }
        )

    async def thread_updated(self, event):
        await self.send_json(
            {
                "type": "thread.updated",
                "thread": event["thread"],
            }
        )

    @database_sync_to_async
    def user_has_thread_access(self, thread_id):
        return MessageThread.objects.filter(id=thread_id, participants=self.user).exists()

    @database_sync_to_async
    def create_message_payloads(self, thread_id, message_text):
        thread = MessageThread.objects.prefetch_related("participants", "messages").get(
            id=thread_id,
            participants=self.user,
        )
        message = create_message_for_thread(thread, self.user, message_text)
        thread.refresh_from_db()
        message_data = serialize_message(message)
        thread_payloads = [
            {
                "user_id": str(participant.id),
                "thread": serialize_thread_for_user(thread, participant),
            }
            for participant in thread.participants.all()
        ]
        return thread, message_data, thread_payloads
