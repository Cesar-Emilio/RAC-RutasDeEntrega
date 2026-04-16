import logging

from django.contrib.contenttypes.models import ContentType
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .middleware import get_client_ip, get_current_request
from .models import AuditAction, AuditLog
from .utils import serialize_instance

logger = logging.getLogger(__name__)

EXCLUDED_MODELS = {
    "AuditLog",
    "LogEntry",
    "Session",
    "ContentType",
    "Permission",
    "Migration",
}


def _should_audit(sender) -> bool:
    return sender.__name__ not in EXCLUDED_MODELS


def _get_request_context() -> dict:
    """Extrae user, IP, método y endpoint del request activo."""
    request = get_current_request()
    if request is None:
        return {"user": None, "ip_address": None, "method": "", "endpoint": ""}

    user = request.user if request.user.is_authenticated else None
    return {
        "user": user,
        "ip_address": get_client_ip(request),
        "method": request.method,
        "endpoint": request.path,
    }


def _write_log(sender, instance, action: str, before: dict | None, after: dict | None):
    """Persiste una entrada de AuditLog de forma segura."""
    try:
        ctx = _get_request_context()
        AuditLog.objects.create(
            user=ctx["user"],
            ip_address=ctx["ip_address"],
            method=ctx["method"],
            endpoint=ctx["endpoint"],
            action=action,
            content_type=ContentType.objects.get_for_model(sender),
            object_id=instance.pk,
            object_repr=str(instance)[:500],
            before=before,
            after=after,
        )
    except Exception:
        # La bitácora nunca debe interrumpir el flujo principal
        logger.exception("Error al escribir en la bitácora para %s pk=%s", sender.__name__, instance.pk)

@receiver(pre_save)
def capture_before_state(sender, instance, **kwargs):
    if not _should_audit(sender):
        return

    if instance.pk:
        try:
            old = sender.objects.filter(pk=instance.pk).first()
            instance._audit_before = serialize_instance(old)
        except sender.DoesNotExist:
            instance._audit_before = None
    else:
        # Es un CREATE: no hay estado previo
        instance._audit_before = None

@receiver(post_save)
def log_save(sender, instance, created, **kwargs):
    if not _should_audit(sender):
        return

    action = AuditAction.CREATE if created else AuditAction.UPDATE
    before = None if created else getattr(instance, "_audit_before", None)
    after  = serialize_instance(instance)

    _write_log(sender, instance, action, before, after)

@receiver(post_delete)
def log_delete(sender, instance, **kwargs):
    if not _should_audit(sender):
        return

    before = serialize_instance(instance)
    _write_log(sender, instance, AuditAction.DELETE, before, after=None)