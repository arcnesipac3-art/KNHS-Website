from rest_framework import serializers
from .models import SchoolSettings


class SchoolSettingsSerializer(serializers.ModelSerializer):
    """Serializer for school settings."""
    updated_by_name = serializers.CharField(source='updated_by.display_name', read_only=True)
    
    class Meta:
        model = SchoolSettings
        fields = [
            'id',
            # Branding
            'school_name',
            'school_short_name',
            'school_logo_url',
            'primary_color',
            'secondary_color',
            # Enrollment
            'enrollment_enabled',
            'enrollment_message',
            'enrollment_start_date',
            'enrollment_end_date',
            # Security
            'password_min_length',
            'password_require_uppercase',
            'password_require_lowercase',
            'password_require_digit',
            'password_require_special',
            'session_timeout_minutes',
            'max_login_attempts',
            'lockout_duration_minutes',
            # Metadata
            'updated_at',
            'updated_by',
            'updated_by_name',
        ]
        read_only_fields = ['id', 'updated_at', 'updated_by']
    
    def validate_primary_color(self, value):
        """Validate hex color format."""
        if not value.startswith('#') or len(value) != 7:
            raise serializers.ValidationError("Color must be in hex format: #RRGGBB")
        try:
            int(value[1:], 16)
        except ValueError:
            raise serializers.ValidationError("Invalid hex color value")
        return value
    
    def validate_secondary_color(self, value):
        """Validate hex color format."""
        if not value.startswith('#') or len(value) != 7:
            raise serializers.ValidationError("Color must be in hex format: #RRGGBB")
        try:
            int(value[1:], 16)
        except ValueError:
            raise serializers.ValidationError("Invalid hex color value")
        return value
    
    def validate(self, data):
        """Cross-field validation."""
        # Validate enrollment dates
        start = data.get('enrollment_start_date')
        end = data.get('enrollment_end_date')
        if start and end and end < start:
            raise serializers.ValidationError({
                'enrollment_end_date': 'End date must be after start date'
            })
        
        return data


class PublicSchoolSettingsSerializer(serializers.ModelSerializer):
    """Public-facing school settings (no sensitive data)."""
    
    class Meta:
        model = SchoolSettings
        fields = [
            'school_name',
            'school_short_name',
            'school_logo_url',
            'primary_color',
            'secondary_color',
            'enrollment_enabled',
            'enrollment_message',
            'enrollment_start_date',
            'enrollment_end_date',
        ]
