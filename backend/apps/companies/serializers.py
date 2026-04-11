from rest_framework import serializers

from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ('id', 'name', 'email', 'rfc', 'active', 'created_at', 'updated_at')

    def validate_rfc(self, value):
        return value.upper()
