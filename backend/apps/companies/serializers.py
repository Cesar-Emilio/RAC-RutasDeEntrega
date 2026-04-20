import logging
from rest_framework import serializers
from .models import Company

logger = logging.getLogger(__name__)

class CompanySerializer(serializers.ModelSerializer):
    user_active = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = ('id', 'name', 'email', 'rfc', 'user_active', 'user_email', 'created_at', 'updated_at')

    def get_user_active(self, obj):
        user = obj.users.first()
        return user.is_active if user else None

    def get_user_email(self, obj):
        user = obj.users.first()
        return user.email if user else None

    def validate_rfc(self, value):
        try:
            logger.debug(f"Validando RFC: {value}")
            
            validated_value = value.upper()
            
            logger.debug(f"RFC validado: {validated_value}")
            
            return validated_value
        except Exception as e:
            logger.error(f"Error al validar RFC: {value} | Error: {str(e)}")
            raise serializers.ValidationError("Error en la validación del RFC.")