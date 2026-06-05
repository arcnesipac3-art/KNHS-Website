from rest_framework import serializers

from .models import User, UserProfile


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
    first_name = serializers.CharField(source='profile.first_name', read_only=True)
    last_name = serializers.CharField(source='profile.last_name', read_only=True)
    phone = serializers.CharField(source='profile.phone', read_only=True)
    avatar_url = serializers.URLField(source='profile.avatar_url', read_only=True)
    lrn = serializers.CharField(source='profile.lrn', read_only=True)
    grade_level = serializers.IntegerField(source='profile.grade_level', read_only=True)
    strand = serializers.CharField(source='profile.strand', read_only=True)
    employee_id = serializers.CharField(source='profile.employee_id', read_only=True)
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


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
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

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_lrn(self, value):
        if value and UserProfile.objects.filter(lrn=value).exists():
            raise serializers.ValidationError("A user with this LRN already exists.")
        return value

    def validate(self, data):
        role = data.get('role')
        
        # Validate role-specific required fields
        if role == User.Role.STUDENT:
            if not data.get('lrn'):
                raise serializers.ValidationError({"lrn": "LRN is required for students."})
            if data.get('grade_level') is None:
                raise serializers.ValidationError({"grade_level": "Grade level is required for students."})
            # Validate grade level range
            if data.get('grade_level') and not (7 <= data.get('grade_level') <= 12):
                raise serializers.ValidationError({"grade_level": "Grade level must be between 7 and 12."})
        
        if role == User.Role.TEACHER and not data.get('employee_id'):
            raise serializers.ValidationError({"employee_id": "Employee ID is required for teachers."})
        
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

        # Create profile
        UserProfile.objects.create(user=user, **profile_fields)

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

    def validate_lrn(self, value):
        # Check if LRN is already taken by another user
        user = self.context.get('user')
        if value and UserProfile.objects.filter(lrn=value).exclude(user=user).exists():
            raise serializers.ValidationError("A user with this LRN already exists.")
        return value

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
        
        profile.save()

        return instance

