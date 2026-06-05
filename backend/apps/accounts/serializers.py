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
