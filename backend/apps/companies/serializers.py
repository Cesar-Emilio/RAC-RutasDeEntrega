from rest_framework import serializers
from .models import Company

class CompanySerializer(serializers.ModelSerializer):

    class Meta:
        model = Company
        fields = "__all__"

    def validate_rfc(self, value):
        return value.upper()

    def create(self, validated_data):
        company = Company.objects.create(**validated_data)
        return company