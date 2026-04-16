"""
middleware.py — Middleware de logging de requests para RAC Backend

Responsabilidades:
  1. Generar un request_id UUID corto y adjuntarlo a `request.request_id`.
  2. Loggear el inicio del request (INFO): método, endpoint, IP.
  3. Loggear el fin del request (INFO): status_code, execution_time_ms.
  4. Emitir WARNING si el tiempo de respuesta supera SLOW_REQUEST_THRESHOLD_MS.
"""

import time
import uuid

from loguru import logger

from config.logging_utils import get_client_ip

SLOW_REQUEST_THRESHOLD_MS = 2000

_EXCLUDED_PATHS = frozenset(
    {
        "/favicon.ico",
        "/health/",
        "/api/schema/",
    }
)


class RequestLoggingMiddleware:
    """
    Middleware WSGI/ASGI que:
    - Genera y propaga un request_id por cada request.
    - Registra inicio y fin del request con latencia.
    - Advierte sobre requests lentos (> 2 s).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path in _EXCLUDED_PATHS or request.path.startswith("/static/"):
            return self.get_response(request)
        
        if request.method == "OPTIONS":
            return self.get_response(request)
        
        request_id = uuid.uuid4().hex[:12]
        request.request_id = request_id
        client_ip = get_client_ip(request)


        logger.info(
            "request_start | request_id={request_id} | method={method} | endpoint={endpoint} "
            "| ip={ip}",
            request_id=request_id,
            method=request.method,
            endpoint=request.path,
            ip=client_ip,
        )

        start = time.perf_counter()
        response = self.get_response(request)
        elapsed_ms = int((time.perf_counter() - start) * 1000)

        user = getattr(request, "user", None)
        user_id = None
        if user and hasattr(user, "is_authenticated") and user.is_authenticated:
            user_id = getattr(user, "id", None)

        logger.info(
            "request_end | request_id={request_id} | method={method} | endpoint={endpoint} "
            "| status={status} | execution_time_ms={elapsed_ms} | user_id={user_id}",
            request_id=request_id,
            method=request.method,
            endpoint=request.path,
            status=response.status_code,
            elapsed_ms=elapsed_ms,
            user_id=user_id,
        )

        if elapsed_ms > SLOW_REQUEST_THRESHOLD_MS:
            logger.warning(
                "slow_request | request_id={request_id} | endpoint={endpoint} "
                "| execution_time_ms={elapsed_ms} | threshold_ms={threshold}",
                request_id=request_id,
                endpoint=request.path,
                elapsed_ms=elapsed_ms,
                threshold=SLOW_REQUEST_THRESHOLD_MS,
            )

        return response
