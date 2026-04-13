from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'name', 'password', 'role', 'company')

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

    def validate(self, data):
        if not data.get('password'):
            raise serializers.ValidationError('La contraseña es obligatoria')

        role = data.get('role', 'company')
        company = data.get('company')
        if role == 'company' and company is None:
            raise serializers.ValidationError({'company': 'La empresa es obligatoria para usuarios con rol company.'})
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'role', 'company', 'is_active')
