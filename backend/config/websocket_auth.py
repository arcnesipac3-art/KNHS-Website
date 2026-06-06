import logging
from urllib.parse import parse_qs

from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication

logger = logging.getLogger(__name__)


@database_sync_to_async
def get_user_from_token(token):
    try:
        authenticator = JWTAuthentication()
        validated_token = authenticator.get_validated_token(token)
        user = authenticator.get_user(validated_token)
        logger.info(f"WebSocket authentication successful for user: {user}")
        return user
    except Exception as e:
        logger.error(f"WebSocket authentication failed: {str(e)}", exc_info=True)
        return AnonymousUser()


class QueryStringJWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_params = parse_qs(scope.get("query_string", b"").decode())
        token = query_params.get("token", [None])[0]

        if token:
            logger.info("WebSocket connection attempt with token")
            scope["user"] = await get_user_from_token(token)
            if not scope["user"].is_authenticated:
                logger.warning("WebSocket authentication failed - user not authenticated")
        else:
            logger.warning("WebSocket connection attempt without token")

        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    return QueryStringJWTAuthMiddleware(AuthMiddlewareStack(inner))
