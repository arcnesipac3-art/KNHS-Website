import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

django_asgi_app = get_asgi_application()

# Defer imports that require Django apps to be ready
def get_websocket_application():
    from apps.communications.routing import websocket_urlpatterns
    from config.websocket_auth import JWTAuthMiddlewareStack
    return JWTAuthMiddlewareStack(URLRouter(websocket_urlpatterns))

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": get_websocket_application(),
    }
)
