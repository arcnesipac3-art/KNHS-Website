from django.utils import timezone
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.throttling import ScopedRateThrottle
from .models import EnrollmentApplication, EnrollmentStatusHistory
from .serializers import (
    EnrollmentApplicationSerializer,
    EnrollmentApplicationCreateSerializer,
    EnrollmentApplicationTrackingSerializer,
    EnrollmentApplicationReviewSerializer,
)
from apps.academics.permissions import IsAdminRegistrarOrPrincipal
from apps.system.tasks import send_enrollment_status_email, log_system_event


class EnrollmentApplicationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for enrollment applications.
    
    Public endpoints:
    - POST /api/enrollment-applications/ - Create new application
    - GET /api/enrollment-applications/track/ - Track by tracking number
    
    Protected endpoints (registrar/admin):
    - GET /api/enrollment-applications/ - List all applications
    - GET /api/enrollment-applications/{id}/ - Get application detail
    - PATCH /api/enrollment-applications/{id}/review/ - Review application
    """
    queryset = EnrollmentApplication.objects.all()
    serializer_class = EnrollmentApplicationSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "sensitive"
    
    def get_permissions(self):
        """
        Public access for create and track actions.
        Admin/Registrar only for list, retrieve, review actions.
        """
        if self.action in ['create', 'track']:
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminRegistrarOrPrincipal()]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return EnrollmentApplicationCreateSerializer
        elif self.action == 'track':
            return EnrollmentApplicationTrackingSerializer
        return EnrollmentApplicationSerializer
    
    def get_queryset(self):
        """
        Filter applications based on query parameters.
        Registrar/admin can filter by status, grade_level, etc.
        """
        queryset = EnrollmentApplication.objects.all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by grade level
        grade_level = self.request.query_params.get('grade_level')
        if grade_level:
            queryset = queryset.filter(grade_level=grade_level)
        
        # Filter by strand
        strand = self.request.query_params.get('strand')
        if strand:
            queryset = queryset.filter(strand=strand)
        
        # Search by tracking number (for admin/registrar)
        tracking_number = self.request.query_params.get('tracking_number')
        if tracking_number:
            queryset = queryset.filter(tracking_number__icontains=tracking_number)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        Create new enrollment application (public endpoint).
        Returns tracking number for the applicant.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        
        # Return response with tracking number
        response_serializer = EnrollmentApplicationSerializer(application)
        return Response(
            {
                **response_serializer.data,
                'message': 'Application submitted successfully! Save your tracking number.'
            },
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def track(self, request):
        """
        Track application by tracking number (public endpoint).
        GET /api/enrollment-applications/track/?tracking_number=ENR-2026-ABCD1234
        """
        tracking_number = request.query_params.get('tracking_number')
        
        if not tracking_number:
            return Response(
                {'error': 'tracking_number parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            application = EnrollmentApplication.objects.get(
                tracking_number=tracking_number
            )
        except EnrollmentApplication.DoesNotExist:
            return Response(
                {'error': 'Application not found. Please check your tracking number.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(application)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsAdminRegistrarOrPrincipal])
    def review(self, request, pk=None):
        """
        Review and update application status (registrar/admin only).
        PATCH /api/enrollment-applications/{id}/review/
        Body: { "status": "approved", "reviewer_notes": "..." }
        """
        application = self.get_object()
        serializer = EnrollmentApplicationReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        old_status = application.status
        new_status = serializer.validated_data['status']
        reviewer_notes = serializer.validated_data.get('reviewer_notes', '')
        
        # Update application
        application.status = new_status
        application.reviewer_notes = reviewer_notes
        application.reviewed_by = request.user
        application.reviewed_at = timezone.now()
        application.save()
        
        # Create status history entry
        EnrollmentStatusHistory.objects.create(
            application=application,
            from_status=old_status,
            to_status=new_status,
            changed_by=request.user,
            notes=reviewer_notes
        )
        
        # Send email notification to applicant (Asynchronously)
        try:
            email = application.applicant_data.get('contact', {}).get('email')
            if email:
                send_enrollment_status_email(application.id, new_status, email)
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.warning(f"Could not send enrollment status email: {e}")
        
        # Log system event for audit
        log_system_event(
            "ENROLLMENT_REVIEW",
            f"Application {application.tracking_number} status changed from {old_status} to {new_status}",
            request.user.id
        )
        
        response_serializer = EnrollmentApplicationSerializer(application)
        return Response({
            **response_serializer.data,
            'message': f'Application status updated to {new_status}'
        })
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsAdminRegistrarOrPrincipal])
    def history(self, request, pk=None):
        """
        Get status change history for an application.
        GET /api/enrollment-applications/{id}/history/
        """
        application = self.get_object()
        history = application.status_history.all()
        
        from .serializers import EnrollmentStatusHistorySerializer
        serializer = EnrollmentStatusHistorySerializer(history, many=True)
        return Response(serializer.data)
