import datetime
import decimal
import uuid

from django.core import serializers as django_serializers
from django.db import models


def serialize_instance(instance: models.Model | None) -> dict | None:
    if instance is None:
        return None

    EXCLUDED_FIELDS = {"password", "token", "secret", "file"}

    data = {}
    for field in instance._meta.get_fields():
        name = field.name

        if any(excluded in name for excluded in EXCLUDED_FIELDS):
            continue
        if field.auto_created and not field.concrete:
            continue
        if field.many_to_many:
            try:
                value = getattr(instance, name)
                data[name] = list(value.values_list("id", flat=True))
            except Exception:
                data[name] = []
            continue
        if field.is_relation:
            data[name] = getattr(instance, f"{name}_id", None)
            continue
        if hasattr(field, "attname"):
            value = getattr(instance, field.attname, None)
            data[name] = _make_serializable(value)

    return data


def _make_serializable(value):
    """Convierte tipos no serializables a sus equivalentes JSON."""
    if isinstance(value, datetime.datetime):
        return value.isoformat()
    if isinstance(value, datetime.date):
        return value.isoformat()
    if isinstance(value, decimal.Decimal):
        return float(value)
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, bytes):
        return None
    return value