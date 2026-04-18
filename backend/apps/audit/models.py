from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models


class AuditAction(models.TextChoices):
    CREATE = "create", "Creación"
    READ   = "read",   "Consulta"
    UPDATE = "update", "Actualización"
    DELETE = "delete", "Eliminación"


class AuditLog(models.Model):
    """
    Entrada de bitácora.

    Campos
    ------
    user        : Usuario que ejecutó la acción (null si es anónimo o proceso interno).
    ip_address  : IP de origen extraída por el middleware.
    method      : Método HTTP (GET, POST, PATCH, DELETE…).
    endpoint    : Path del request (/api/routes/create/).
    action      : Tipo de operación (CRUD).
    content_type: Tipo de modelo afectado (Route, Company, User…).
    object_id   : PK del objeto afectado.
    object_repr : Representación legible del objeto (__str__) al momento del evento.
    before      : Estado del objeto antes de la operación (null en CREATE).
    after       : Estado del objeto después de la operación (null en DELETE).
    timestamp   : Fecha y hora exacta del evento (UTC).
    """

    user = models.ForeignKey(
        "users.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
        verbose_name="Usuario",
    )

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    method     = models.CharField(max_length=10, blank=True)
    endpoint   = models.CharField(max_length=500, blank=True)
    action     = models.CharField(max_length=10, choices=AuditAction.choices)

    # Referencia genérica al objeto afectado
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id    = models.CharField(max_length=255)
    content_object = GenericForeignKey("content_type", "object_id")
    object_repr  = models.CharField(max_length=500)

    before = models.JSONField(null=True, blank=True)
    after  = models.JSONField(null=True, blank=True)

    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["user", "timestamp"]),
            models.Index(fields=["action", "timestamp"]),
        ]
        verbose_name = "Entrada de bitácora"
        verbose_name_plural = "Bitácora"

    def __str__(self):
        return f"[{self.timestamp:%Y-%m-%d %H:%M:%S}] {self.action} — {self.object_repr}"