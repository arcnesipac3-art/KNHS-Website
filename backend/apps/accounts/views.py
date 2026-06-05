from django.conf import settings
from django.contrib.auth import authenticate
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import (
    ChangePasswordSerializer,
    CreateUserSerializer,
    LoginSerializer,
    UpdateProfileSerializer,
    UpdateUserSerializer,
    UserDetailSerializer,
    UserListSerializer,
    UserSerializer,
)


def _set_refresh_cookie(response, refresh_token):
    cookie_params = {
        "key": settings.REFRESH_TOKEN_COOKIE_NAME,
        "value": str(refresh_token),
        "max_age": int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        "httponly": settings.REFRESH_TOKEN_COOKIE_HTTPONLY,
        "secure": settings.REFRESH_TOKEN_COOKIE_SECURE,
        "samesite": settings.REFRESH_TOKEN_COOKIE_SAMESITE,
    }
    
    # In production, don't set domain to allow cookie to work cross-origin
    # The cookie will be set for the exact domain (Render backend)
    
    response.set_cookie(**cookie_params)


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
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"error": "Current password is incorrect.", "old_password": ["Current password is incorrect."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["new_password"])
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password", "updated_at"])

        return Response({"detail": "Password updated successfully."})


class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = UpdateProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        profile = user.profile

        # Update profile fields
        for field, value in serializer.validated_data.items():
            setattr(profile, field, value)
        
        profile.save()

        # Return updated user data
        return Response(_user_payload(user), status=status.HTTP_200_OK)


# User Management ViewSet (Admin Only)

class IsAdminUser(IsAuthenticated):
    """Permission class for admin-only endpoints"""
    def has_permission(self, request, view):
        return (
            super().has_permission(request, view) and
            request.user.role in [User.Role.ADMIN, User.Role.PRINCIPAL]
        )


class UserManagementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing users (admin only).
    Provides CRUD operations for user accounts.
    """
    permission_classes = [IsAdminUser]
    queryset = User.objects.select_related('profile').all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        elif self.action == 'create':
            return CreateUserSerializer
        elif self.action in ['update', 'partial_update']:
            return UpdateUserSerializer
        return UserDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by role
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by approved status
        is_approved = self.request.query_params.get('is_approved')
        if is_approved is not None:
            queryset = queryset.filter(is_approved=is_approved.lower() == 'true')
        
        # Search by name, email, or LRN
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(profile__first_name__icontains=search) |
                Q(profile__last_name__icontains=search) |
                Q(profile__lrn__icontains=search) |
                Q(profile__employee_id__icontains=search)
            )
        
        return queryset.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Return detailed user data
        detail_serializer = UserDetailSerializer(user)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(
            instance, 
            data=request.data, 
            partial=partial,
            context={'user': instance}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Return detailed user data
        detail_serializer = UserDetailSerializer(user)
        return Response(detail_serializer.data)

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Reset user password to a temporary password"""
        user = self.get_object()
        
        # Generate temporary password
        import secrets
        temp_password = secrets.token_urlsafe(12)
        
        user.set_password(temp_password)
        user.must_change_password = True
        user.save(update_fields=['password', 'must_change_password'])
        
        return Response({
            'detail': 'Password reset successfully.',
            'temporary_password': temp_password,
            'note': 'User must change password on next login.'
        })

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate user account"""
        user = self.get_object()
        user.is_active = False
        user.save(update_fields=['is_active'])
        
        return Response({'detail': 'User deactivated successfully.'})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate user account"""
        user = self.get_object()
        user.is_active = True
        user.save(update_fields=['is_active'])
        
        return Response({'detail': 'User activated successfully.'})

