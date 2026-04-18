"""
logging_utils.py — Utilidades centrales de logging para RAC Backend

Proporciona:
- get_logger(name)             Logger loguru con nombre de módulo
- sanitize_params(data)        Filtra campos sensibles antes de loggear
- get_client_ip(request)       IP real del cliente (soporta proxies)
- build_request_context(req)   Dict estándar de contexto para logs de vistas
"""

from __future__ import annotations

from typing import Any

from loguru import logger as _loguru_logger

_SENSITIVE_FIELDS = frozenset(
    {
        "password",
        "password1",
        "password2",
        "new_password",
        "old_password",
        "token",
        "access",
        "refresh",
        "id_token",
        "client_secret",
        "authorization",
        "credit_card",
        "card_number",
        "cvv",
        "ssn",
        "curp",
    }
)

_REDACTED = "***REDACTED***"

def get_logger(name: str):
    """
    Devuelve un logger loguru con bind de 'module' para trazabilidad.
    Uso:  logger = get_logger(__name__)
    """
    return _loguru_logger.bind(module=name)

def sanitize_params(data: Any, max_str_len: int = 200) -> Any:
    """
    Filtra de forma recursiva cualquier campo sensible dentro de un dict,
    list o valor primitivo.

    - Los campos en _SENSITIVE_FIELDS se reemplazan por '***REDACTED***'.
    - Las cadenas largas se truncan a max_str_len caracteres.
    - No modifica el objeto original.

    Ejemplo:
        sanitize_params({'email': 'a@b.com', 'password': 'secret'})
        # -> {'email': 'a@b.com', 'password': '***REDACTED***'}
    """
    if isinstance(data, dict):
        return {
            k: _REDACTED if k.lower() in _SENSITIVE_FIELDS else sanitize_params(v, max_str_len)
            for k, v in data.items()
        }
    if isinstance(data, (list, tuple)):
        return [sanitize_params(item, max_str_len) for item in data]
    if isinstance(data, str) and len(data) > max_str_len:
        return data[:max_str_len] + "…[truncated]"
    return data

def get_client_ip(request) -> str:
    """
    Extrae la IP real del cliente.
    Respeta las cabeceras X-Forwarded-For y X-Real-IP (proxies / load balancers).
    """
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("HTTP_X_REAL_IP") or request.META.get("REMOTE_ADDR", "unknown")

def build_request_context(request) -> dict:
    """
    Construye el dict de contexto estándar para logs de vistas DRF.

    Campos incluidos (si están disponibles):
        request_id  — UUID corto generado por el middleware
        user_id     — ID del usuario autenticado (None si es anónimo)
        method      — Método HTTP
        endpoint    — Path de la URL
        ip          — IP del cliente
    """
    user = getattr(request, "user", None)
    user_id = getattr(user, "id", None) if user and user.is_authenticated else None

    return {
        "request_id": getattr(request, "request_id", None),
        "user_id": user_id,
        "method": request.method,
        "endpoint": request.path,
        "ip": get_client_ip(request),
    }



