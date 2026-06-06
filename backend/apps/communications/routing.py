from django.urls import path, re_path

from .consumers import MessagesConsumer


websocket_urlpatterns = [
    path("ws/messages/", MessagesConsumer.as_asgi()),
    path("ws/messages", MessagesConsumer.as_asgi()),
    re_path(r"ws/messages/?", MessagesConsumer.as_asgi()),
]
