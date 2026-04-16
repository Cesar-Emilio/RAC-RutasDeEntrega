from django.db import models
import json

class Audit(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    user_email = models.EmailField(null=True)
    ip_address = models.GenericIPAddressField()
    action_type = models.CharField(max_length=10)
    model_name = models.CharField(max_length=100)
    object_id = models.BigIntegerField()
    object_data = models.JSONField()
    request_method = models.CharField(max_length=10)
    request_url = models.CharField(max_length=255)
    previous_data = models.JSONField(null=True, blank=True)
    session_id = models.CharField(max_length=255, null=True, blank=True)
    user_agent = models.CharField(max_length=255, null=True, blank=True)
    error_details = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Audit {self.id} - {self.timestamp}"