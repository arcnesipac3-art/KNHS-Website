from rest_framework import serializers
from .models import EnrollmentApplication, EnrollmentStatusHistory


class EnrollmentApplicationSerializer(serializers.ModelSerializer):
    """
    Serializer for enrollment applications
    """
    applicant_name = serializers.ReadOnlyField()
    applicant_email = serializers.ReadOnlyField()
    applicant_phone = serializers.ReadOnlyField()
    applicant_lrn = serializers.ReadOnlyField()
    
    class Meta:
        model = EnrollmentApplication
        fields = [
            'id',
            'tracking_number',
            'applicant_data',
            'grade_level',
            'strand',
            'status',
            'reviewer_notes',
            'reviewed_by',
            'notes',
            'submitted_at',
            'reviewed_at',
            'updated_at',
            'applicant_name',
            'applicant_email',
            'applicant_phone',
            'applicant_lrn',
        ]
        read_only_fields = [
            'id',
            'tracking_number',
            'submitted_at',
            'reviewed_at',
            'updated_at',
        ]
    
    def validate(self, data):
        """Validate strand requirement for SHS"""
        grade_level = data.get('grade_level')
        strand = data.get('strand')
        
        if grade_level in ['11', '12'] and not strand:
            raise serializers.ValidationError({
                'strand': 'Strand is required for Grade 11 and 12'
            })
        
        return data
    
    def validate_applicant_data(self, value):
        """Validate required fields in applicant_data JSON"""
        required_sections = ['personal', 'contact', 'guardian']
        
        for section in required_sections:
            if section not in value:
                raise serializers.ValidationError(
                    f'Missing required section: {section}'
                )
        
        # Validate personal info
        personal = value.get('personal', {})
        required_personal = ['first_name', 'last_name', 'birth_date', 'sex']
        for field in required_personal:
            if not personal.get(field):
                raise serializers.ValidationError(
                    f'Missing required personal field: {field}'
                )
        
        # Validate contact info
        contact = value.get('contact', {})
        required_contact = ['email', 'phone', 'address']
        for field in required_contact:
            if not contact.get(field):
                raise serializers.ValidationError(
                    f'Missing required contact field: {field}'
                )
        
        # Validate guardian info
        guardian = value.get('guardian', {})
        required_guardian = ['name', 'relationship', 'phone']
        for field in required_guardian:
            if not guardian.get(field):
                raise serializers.ValidationError(
                    f'Missing required guardian field: {field}'
                )
        
        return value


class EnrollmentApplicationCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new enrollment applications (public endpoint)
    """
    class Meta:
        model = EnrollmentApplication
        fields = [
            'applicant_data',
            'grade_level',
            'strand',
            'notes',
        ]
    
    def validate(self, data):
        """Validate strand requirement for SHS"""
        grade_level = data.get('grade_level')
        strand = data.get('strand')
        
        if grade_level in ['11', '12'] and not strand:
            raise serializers.ValidationError({
                'strand': 'Strand is required for Grade 11 and 12'
            })
        
        return data
    
    def validate_applicant_data(self, value):
        """Validate required fields in applicant_data JSON"""
        required_sections = ['personal', 'contact', 'guardian']
        
        for section in required_sections:
            if section not in value:
                raise serializers.ValidationError(
                    f'Missing required section: {section}'
                )
        
        # Validate personal info
        personal = value.get('personal', {})
        required_personal = ['first_name', 'last_name', 'birth_date', 'sex']
        for field in required_personal:
            if not personal.get(field):
                raise serializers.ValidationError(
                    f'Missing required personal field: {field}'
                )
        
        # Validate contact info
        contact = value.get('contact', {})
        required_contact = ['email', 'phone', 'address']
        for field in required_contact:
            if not contact.get(field):
                raise serializers.ValidationError(
                    f'Missing required contact field: {field}'
                )
        
        # Validate guardian info
        guardian = value.get('guardian', {})
        required_guardian = ['name', 'relationship', 'phone']
        for field in required_guardian:
            if not guardian.get(field):
                raise serializers.ValidationError(
                    f'Missing required guardian field: {field}'
                )
        
        return value


class EnrollmentApplicationTrackingSerializer(serializers.ModelSerializer):
    """
    Serializer for tracking applications (public endpoint - limited info)
    Does NOT expose PII (name, email, phone, LRN) for security.
    """
    class Meta:
        model = EnrollmentApplication
        fields = [
            'tracking_number',
            'grade_level',
            'strand',
            'status',
            'submitted_at',
            'reviewed_at',
        ]
        read_only_fields = fields


class EnrollmentApplicationReviewSerializer(serializers.Serializer):
    """
    Serializer for reviewing applications (registrar/admin)
    """
    status = serializers.ChoiceField(
        choices=EnrollmentApplication.STATUS_CHOICES,
        required=True
    )
    reviewer_notes = serializers.CharField(
        required=False,
        allow_blank=True
    )


class EnrollmentStatusHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for status history
    """
    changed_by_name = serializers.CharField(
        source='changed_by.get_full_name',
        read_only=True
    )
    
    class Meta:
        model = EnrollmentStatusHistory
        fields = [
            'id',
            'application',
            'from_status',
            'to_status',
            'changed_by',
            'changed_by_name',
            'notes',
            'changed_at',
        ]
        read_only_fields = fields
