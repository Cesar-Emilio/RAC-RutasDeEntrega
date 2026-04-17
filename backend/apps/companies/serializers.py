import logging
from rest_framework import serializers
from .models import Company

logger = logging.getLogger(__name__)

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ('id', 'name', 'email', 'rfc', 'active', 'created_at', 'updated_at')

    def validate_rfc(self, value):
        try:
            logger.debug(f"Validando RFC: {value}")
            
            validated_value = value.upper()
            
            logger.debug(f"RFC validado: {validated_value}")
            
            return validated_value
        except Exception as e:
            logger.error(f"Error al validar RFC: {value} | Error: {str(e)}")
            raise serializers.ValidationError("Error en la validación del RFC.")