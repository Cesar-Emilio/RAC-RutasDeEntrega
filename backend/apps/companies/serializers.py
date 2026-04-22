import logging
from rest_framework import serializers
from .models import Company

logger = logging.getLogger(__name__)

class CompanySerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo de empresa (Company). Se encarga de validar y representar los datos de una empresa,
    incluyendo la información de los usuarios asociados y el RFC.

    Attributes:
        user_active (bool): Indica si el primer usuario asociado a la empresa está activo.
        user_email (str): Correo electrónico del primer usuario asociado a la empresa.

    Methods:
        get_user_active: Obtiene el estado de actividad del primer usuario asociado a la empresa.
        get_user_email: Obtiene el correo electrónico del primer usuario asociado a la empresa.
        validate_rfc: Valida y normaliza el RFC, convirtiéndolo a mayúsculas.
    """
    
    user_active = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = ('id', 'name', 'email', 'rfc', 'user_active', 'user_email', 'created_at', 'updated_at')

    def get_user_active(self, obj):
        """
        Obtiene el estado de actividad del primer usuario asociado a la empresa.

        Args:
            obj (Company): Instancia del modelo de empresa.

        Returns:
            bool: Estado de actividad del primer usuario o None si no hay usuario.
        """
        user = obj.users.first()
        return user.is_active if user else None

    def get_user_email(self, obj):
        """
        Obtiene el correo electrónico del primer usuario asociado a la empresa.

        Args:
            obj (Company): Instancia del modelo de empresa.

        Returns:
            str: Correo electrónico del primer usuario o None si no hay usuario.
        """
        user = obj.users.first()
        return user.email if user else None

    def validate_rfc(self, value):
        """
        Valida y normaliza el RFC, convirtiéndolo a mayúsculas.

        Args:
            value (str): RFC a validar.

        Returns:
            str: RFC validado en mayúsculas.

        Raises:
            ValidationError: Si ocurre un error durante la validación del RFC.
        """
        try:
            logger.debug(f"Validando RFC: {value}")
            
            validated_value = value.upper()
            
            logger.debug(f"RFC validado: {validated_value}")
            
            return validated_value
        except Exception as e:
            logger.error(f"Error al validar RFC: {value} | Error: {str(e)}")
            raise serializers.ValidationError("Error en la validación del RFC.")