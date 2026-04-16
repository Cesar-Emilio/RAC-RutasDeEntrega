"""
audit/apps.py

AppConfig que conecta las signals automáticamente al iniciar Django.
Sin esto, las signals en signals.py nunca se registran.
"""

from django.apps import AppConfig


class AuditConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.audit"

    def ready(self):
        import apps.audit.signals