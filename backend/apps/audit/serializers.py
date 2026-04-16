from rest_framework import serializers
from .models import AuditLog
 
 
class AuditLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    model = serializers.SerializerMethodField()
 
    class Meta:
        model = AuditLog
        fields = [
            "id",
            "timestamp",
            "user",
            "ip_address",
            "method",
            "endpoint",
            "action",
            "model",
            "object_id",
            "object_repr",
            "before",
            "after",
        ]
 
    def get_model(self, obj) -> str:
        return obj.content_type.model