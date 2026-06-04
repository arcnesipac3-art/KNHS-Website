from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import ChangePasswordSerializer, LoginSerializer, UserSerializer


def _set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        value=str(refresh_token),
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        httponly=settings.REFRESH_TOKEN_COOKIE_HTTPONLY,
        secure=settings.REFRESH_TOKEN_COOKIE_SECURE,
        samesite=settings.REFRESH_TOKEN_COOKIE_SAMESITE,
    )


def _clear_refresh_cookie(response):
    response.delete_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        samesite=settings.REFRESH_TOKEN_COOKIE_SAMESITE,
    )


def _tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return refresh, refresh.access_token


def _user_payload(user):
    return UserSerializer(user).data


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            email=serializer.validated_data["email"].lower(),
            password=serializer.validated_data["password"],
        )

        if user is None:
            return Response(
                {"error": {"code": "invalid_credentials", "message": "Invalid email or password."}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {"error": {"code": "account_inactive", "message": "This account is inactive."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not user.is_approved and user.role != User.Role.ADMIN:
            return Response(
                {"error": {"code": "account_pending", "message": "Your account is pending approval."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh, access = _tokens_for_user(user)
        response = Response(
            {
                "access_token": str(access),
                "user": _user_payload(user),
            },
            status=status.HTTP_200_OK,
        )
        _set_refresh_cookie(response, refresh)
        return response


class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE_NAME)
        if not refresh_token:
            return Response(
                {"error": {"code": "missing_refresh", "message": "Refresh token not found."}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            refresh = RefreshToken(refresh_token)
            user_id = refresh.get("user_id")
            from .models import User

            user = User.objects.get(id=user_id)
            refresh.blacklist()
            new_refresh, access = _tokens_for_user(user)
        except (TokenError, User.DoesNotExist):
            response = Response(
                {"error": {"code": "invalid_refresh", "message": "Invalid or expired refresh token."}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            _clear_refresh_cookie(response)
            return response

        response = Response({"access_token": str(access)}, status=status.HTTP_200_OK)
        _set_refresh_cookie(response, new_refresh)
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE_NAME)
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass

        response = Response({"detail": "Logged out."}, status=status.HTTP_200_OK)
        _clear_refresh_cookie(response)
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_user_payload(request.user))


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data["current_password"]):
            return Response(
                {"error": {"code": "invalid_password", "message": "Current password is incorrect."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["new_password"])
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password", "updated_at"])

        return Response({"detail": "Password updated successfully."})
