from django.utils import timezone
from rest_framework import serializers

from .models import User, UserProfile


def generate_employee_id():
    """Generate the next teacher employee ID in TCH-YYYY-### format."""
    year = timezone.now().year
    prefix = f"TCH-{year}-"
    existing_ids = UserProfile.objects.filter(
        employee_id__startswith=prefix
    ).values_list("employee_id", flat=True)

    highest_sequence = 0
    for employee_id in existing_ids:
        suffix = employee_id.removeprefix(prefix)
        if suffix.isdigit():
            highest_sequence = max(highest_sequence, int(suffix))

    return f"{prefix}{highest_sequence + 1:03d}"


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = UserProfile
        fields = (
            "first_name",
            "last_name",
            "middle_name",
            "full_name",
            "lrn",
            "grade_level",
            "strand",
            "employee_id",
            "phone",
            "avatar_url",
        )


class UserSerializer(serializers.ModelSerializer):
    # Flatten profile fields into user serializer for frontend convenience
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    lrn = serializers.SerializerMethodField()
    grade_level = serializers.SerializerMethodField()
    strand = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()
    display_name = serializers.ReadOnlyField()
    is_active = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "role",
            "display_name",
            "is_active",
            "is_verified",
            "is_approved",
            "must_change_password",
            "created_at",
            # Profile fields
            "first_name",
            "last_name",
            "phone",
            "avatar_url",
            "lrn",
            "grade_level",
            "strand",
            "employee_id",
        )
        read_only_fields = fields

    def get_first_name(self, obj):
        return getattr(obj.profile, 'first_name', '') if hasattr(obj, 'profile') else ''
    
    def get_last_name(self, obj):
        return getattr(obj.profile, 'last_name', '') if hasattr(obj, 'profile') else ''
    
    def get_phone(self, obj):
        return getattr(obj.profile, 'phone', '') if hasattr(obj, 'profile') else ''
    
    def get_avatar_url(self, obj):
        return getattr(obj.profile, 'avatar_url', '') if hasattr(obj, 'profile') else ''
    
    def get_lrn(self, obj):
        return getattr(obj.profile, 'lrn', '') if hasattr(obj, 'profile') else ''
    
    def get_grade_level(self, obj):
        return getattr(obj.profile, 'grade_level', None) if hasattr(obj, 'profile') else None
    
    def get_strand(self, obj):
        return getattr(obj.profile, 'strand', '') if hasattr(obj, 'profile') else ''
    
    def get_employee_id(self, obj):
        return getattr(obj.profile, 'employee_id', '') if hasattr(obj, 'profile') else ''


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_password = serializers.CharField(write_only=True, min_length=8)


class UpdateProfileSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100, required=False)
    last_name = serializers.CharField(max_length=100, required=False)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    avatar_url = serializers.URLField(required=False, allow_blank=True)

    def validate(self, data):
        # At least one field must be provided
        if not any(data.values()):
            raise serializers.ValidationError("At least one field must be provided.")
        return data


# User Management Serializers (Admin Only)

class UserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for user lists"""
    full_name = serializers.CharField(source='profile.full_name', read_only=True)
    grade_level = serializers.IntegerField(source='profile.grade_level', read_only=True)
    strand = serializers.CharField(source='profile.strand', read_only=True)
    lrn = serializers.CharField(source='profile.lrn', read_only=True)
    employee_id = serializers.CharField(source='profile.employee_id', read_only=True)

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'role',
            'full_name',
            'lrn',
            'grade_level',
            'strand',
            'employee_id',
            'is_active',
            'is_approved',
            'created_at',
        )


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed user info for view/edit"""
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'role',
            'is_active',
            'is_verified',
            'is_approved',
            'must_change_password',
            'created_at',
            'updated_at',
            'profile',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class CreateUserSerializer(serializers.Serializer):
    """Create new user with profile"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=User.Role.choices)
    must_change_password = serializers.BooleanField(default=True)
    is_approved = serializers.BooleanField(default=True)
    
    # Profile fields
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    middle_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    lrn = serializers.CharField(max_length=12, required=False, allow_blank=True)
    grade_level = serializers.IntegerField(required=False, allow_null=True)
    strand = serializers.CharField(max_length=50, required=False, allow_blank=True)
    employee_id = serializers.CharField(max_length=50, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    @staticmethod
    def _clean_optional_text(value):
        return value.strip() if isinstance(value, str) else value

    def validate_first_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("First name is required.")
        return value

    def validate_last_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Last name is required.")
        return value

    def validate_middle_name(self, value):
        return self._clean_optional_text(value)

    def validate_strand(self, value):
        return self._clean_optional_text(value)

    def validate_employee_id(self, value):
        return self._clean_optional_text(value)

    def validate_phone(self, value):
        return self._clean_optional_text(value)

    def validate_email(self, value):
        # Normalize email
        email = value.lower().strip()
        
        # Basic format validation (DRF already does this, but we can add more)
        if len(email) > 254:
            raise serializers.ValidationError("Email address is too long.")
        
        # Check for existing user
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        
        return email

    def validate_lrn(self, value):
        if not value:
            return None
            
        # Trim and validate LRN format
        lrn = value.strip()
        
        # LRN should be exactly 12 digits
        if lrn and (not lrn.isdigit() or len(lrn) != 12):
            raise serializers.ValidationError("LRN must be exactly 12 digits.")
        
        # Check for duplicates
        if lrn and UserProfile.objects.filter(lrn=lrn).exists():
            raise serializers.ValidationError("A user with this LRN already exists.")
        
        return lrn

    def validate(self, data):
        role = data.get('role')
        grade_level = data.get('grade_level')
        strand = data.get('strand', '')
        
        # Validate role-specific required fields
        if role == User.Role.STUDENT:
            if not data.get('lrn'):
                raise serializers.ValidationError({"lrn": "LRN is required for students."})
            if grade_level is None:
                raise serializers.ValidationError({"grade_level": "Grade level is required for students."})
            # Validate grade level range
            if grade_level and not (7 <= grade_level <= 12):
                raise serializers.ValidationError({"grade_level": "Grade level must be between 7 and 12."})
            if grade_level >= 11 and not strand:
                raise serializers.ValidationError({"strand": "Strand is required for Senior High School students."})
        else:
            data['lrn'] = None
            data['grade_level'] = None
            data['strand'] = ''

        if role == User.Role.TEACHER:
            data['employee_id'] = generate_employee_id()
        else:
            data['employee_id'] = ''
        
        return data

    def create(self, validated_data):
        # Extract profile fields
        profile_fields = {
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'middle_name': validated_data.pop('middle_name', ''),
            'lrn': validated_data.pop('lrn', None),
            'grade_level': validated_data.pop('grade_level', None),
            'strand': validated_data.pop('strand', ''),
            'employee_id': validated_data.pop('employee_id', ''),
            'phone': validated_data.pop('phone', ''),
        }

        # Create user
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)

        # Update the profile created by signal (don't create duplicate)
        # The post_save signal already created an empty profile
        profile = user.profile
        for field, value in profile_fields.items():
            setattr(profile, field, value)
        profile.save()

        return user


class UpdateUserSerializer(serializers.Serializer):
    """Update existing user and profile"""
    # User fields
    role = serializers.ChoiceField(choices=User.Role.choices, required=False)
    is_active = serializers.BooleanField(required=False)
    is_approved = serializers.BooleanField(required=False)
    must_change_password = serializers.BooleanField(required=False)
    
    # Profile fields
    first_name = serializers.CharField(max_length=100, required=False)
    last_name = serializers.CharField(max_length=100, required=False)
    middle_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    lrn = serializers.CharField(max_length=12, required=False, allow_blank=True)
    grade_level = serializers.IntegerField(required=False, allow_null=True)
    strand = serializers.CharField(max_length=50, required=False, allow_blank=True)
    employee_id = serializers.CharField(max_length=50, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    @staticmethod
    def _clean_optional_text(value):
        return value.strip() if isinstance(value, str) else value

    def validate_first_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("First name is required.")
        return value

    def validate_last_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Last name is required.")
        return value

    def validate_middle_name(self, value):
        return self._clean_optional_text(value)

    def validate_strand(self, value):
        return self._clean_optional_text(value)

    def validate_employee_id(self, value):
        return self._clean_optional_text(value)

    def validate_phone(self, value):
        return self._clean_optional_text(value)

    def validate_lrn(self, value):
        if not value:
            return None

        value = value.strip()
        if not value.isdigit() or len(value) != 12:
            raise serializers.ValidationError("LRN must be exactly 12 digits.")

        # Check if LRN is already taken by another user
        user = self.context.get('user')
        if value and UserProfile.objects.filter(lrn=value).exclude(user=user).exists():
            raise serializers.ValidationError("A user with this LRN already exists.")
        return value

    def validate(self, data):
        user = self.context.get('user')
        role = data.get('role', user.role)
        grade_level = data.get('grade_level', user.profile.grade_level)
        strand = data.get('strand', user.profile.strand)

        if role == User.Role.STUDENT:
            lrn = data.get('lrn', user.profile.lrn)
            if not lrn:
                raise serializers.ValidationError({"lrn": "LRN is required for students."})
            if grade_level is None:
                raise serializers.ValidationError({"grade_level": "Grade level is required for students."})
            if not (7 <= grade_level <= 12):
                raise serializers.ValidationError({"grade_level": "Grade level must be between 7 and 12."})
            if grade_level >= 11 and not strand:
                raise serializers.ValidationError({"strand": "Strand is required for Senior High School students."})
        else:
            data['lrn'] = None
            data['grade_level'] = None
            data['strand'] = ''

        if role == User.Role.TEACHER:
            data['employee_id'] = user.profile.employee_id or generate_employee_id()
        else:
            data['employee_id'] = ''

        return data

    def update(self, instance, validated_data):
        # Update user fields
        user_fields = ['role', 'is_active', 'is_approved', 'must_change_password']
        for field in user_fields:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        
        instance.save()

        # Update profile fields
        profile = instance.profile
        profile_fields = ['first_name', 'last_name', 'middle_name', 'lrn', 
                         'grade_level', 'strand', 'employee_id', 'phone']
        for field in profile_fields:
            if field in validated_data:
                setattr(profile, field, validated_data[field])

        if instance.role != User.Role.STUDENT:
            profile.lrn = None
            profile.grade_level = None
            profile.strand = ''

        if instance.role != User.Role.TEACHER:
            profile.employee_id = ''
        
        profile.save()

        return instance

