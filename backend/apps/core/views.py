from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from apps.academics.permissions import IsAdminUser
from .models import SchoolSettings, ContentBlock
from .serializers import SchoolSettingsSerializer, PublicSchoolSettingsSerializer, ContentBlockSerializer, PublicContentBlockSerializer


class SchoolSettingsViewSet(viewsets.ViewSet):
    """
    School settings management.
    Only admins can update, but public settings are available to all.
    """
    
    def get_permissions(self):
        if self.action in ['public_settings']:
            return [AllowAny()]
        elif self.action in ['retrieve', 'list']:
            return [IsAuthenticated()]
        else:  # update, partial_update
            return [IsAdminUser()]
    
    def list(self, request):
        """Get school settings (authenticated users only)."""
        settings = SchoolSettings.get_settings()
        serializer = SchoolSettingsSerializer(settings)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        """Get school settings by ID (authenticated users only)."""
        settings = SchoolSettings.get_settings()
        serializer = SchoolSettingsSerializer(settings)
        return Response(serializer.data)
    
    def update(self, request, pk=None):
        """Update school settings (admin only)."""
        settings = SchoolSettings.get_settings()
        serializer = SchoolSettingsSerializer(settings, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(serializer.data)
    
    def partial_update(self, request, pk=None):
        """Partially update school settings (admin only)."""
        settings = SchoolSettings.get_settings()
        serializer = SchoolSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def public_settings(self, request):
        """
        Get public school settings (no authentication required).
        Used for branding on public pages and enrollment status check.
        """
        settings = SchoolSettings.get_settings()
        serializer = PublicSchoolSettingsSerializer(settings)
        return Response(serializer.data)


class ContentBlockViewSet(viewsets.ModelViewSet):
    """CMS content blocks management."""

    serializer_class = ContentBlockSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Admin-only for write operations, read-only for authenticated users."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Filter by section if provided."""
        queryset = ContentBlock.objects.all()
        section = self.request.query_params.get('section')
        if section:
            queryset = queryset.filter(section=section)
        return queryset

    def perform_create(self, serializer):
        """Set updated_by to current user on create."""
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        """Set updated_by to current user on update."""
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'])
    def public(self, request):
        """
        Get public content blocks (no authentication required).
        Used for displaying CMS content on public pages.
        """
        queryset = ContentBlock.objects.filter(is_active=True)
        section = self.request.query_params.get('section')
        if section:
            queryset = queryset.filter(section=section)
        
        serializer = PublicContentBlockSerializer(queryset, many=True)
        return Response(serializer.data)
