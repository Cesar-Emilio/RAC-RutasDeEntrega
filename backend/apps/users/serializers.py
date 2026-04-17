import logging
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

logger = logging.getLogger(__name__)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'name', 'password', 'role', 'company')

    def create(self, validated_data):
        try:
            user = User.objects.create_user(**validated_data)
            logger.info(f"Usuario creado con éxito | email={validated_data['email']} | role={validated_data['role']}")
            return user
        except Exception as e:
            logger.error(f"Error al crear el usuario | email={validated_data.get('email')} | role={validated_data.get('role')} | error={str(e)}")
            raise serializers.ValidationError("Error al crear el usuario.")

    def validate(self, data):
        try:
            if not data.get('password'):
                logger.warning("Contraseña no proporcionada durante el registro.")
                raise serializers.ValidationError('La contraseña es obligatoria')

            role = data.get('role', 'company')
            company = data.get('company')
            if role == 'company' and company is None:
                logger.warning(f"Usuario con rol 'company' no tiene empresa asociada | role={role}")
                raise serializers.ValidationError({'company': 'La empresa es obligatoria para usuarios con rol company.'})
            
            logger.debug(f"Validación de datos exitosa | email={data.get('email')} | role={role}")
            return data
        except Exception as e:
            logger.error(f"Error en la validación de datos | email={data.get('email')} | error={str(e)}")
            raise e

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'role', 'company', 'is_active')