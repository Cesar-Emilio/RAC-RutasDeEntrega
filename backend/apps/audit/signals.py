# audit_log/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Audit
from django.utils.timezone import now
from django.forms.models import model_to_dict
import json
from apps.users.models import User
from apps.warehouses.models import Warehouse

@receiver(post_save)
def log_create_or_update(sender, instance, created, **kwargs):
    if sender in [User, Warehouse]:
        action_type = 'INSERT' if created else 'UPDATE'

        instance_data = model_to_dict(instance)
        instance_data.pop('_state', None)

        Audit.objects.create(
            timestamp=now(),
            user=instance,
            user_email=instance.email,
            ip_address='',
            action_type=action_type,
            model_name=sender.__name__,
            object_id=instance.id,
            object_data=json.dumps(instance_data),
            request_method='POST',
            request_url='',
            previous_data=json.dumps(''), 
            session_id='',
            user_agent='',
            error_details='',
        )

@receiver(post_delete)
def log_delete(sender, instance, **kwargs):
    if sender in [User, Warehouse]: 
        Audit.objects.create(
            timestamp=now(),
            user=instance,
            user_email=instance.email, 
            ip_address='',
            action_type='DELETE',
            model_name=sender.__name__,
            object_id=instance.id,
            object_data=json.dumps(''),
            request_method='DELETE',
            request_url='',
            previous_data=json.dumps(instance.__dict__),  # Datos antes de la eliminación
            session_id='',
            user_agent='',
            error_details='',
        )