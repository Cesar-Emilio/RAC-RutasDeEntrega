from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

# serializer para registro de uusarios
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'name','password', 'role', 'company')

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
    
    # Validacion para la contraseña
    def validate(self, data):
        if not data.get('password'):
            raise serializers.ValidationError("La contraseña es obligatoria")
        return data
    
# serializer para lectura de usuarios
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'role', 'company', 'active')