import threading

_thread_local = threading.local()

def get_current_request():
    """Retorna el request activo en este hilo, o None si es un proceso interno."""
    return getattr(_thread_local, "request", None)


def get_client_ip(request) -> str | None:
    """
    Extrae la IP real del cliente considerando proxies y load balancers.
    X-Forwarded-For puede contener varias IPs separadas por coma;
    la primera es siempre la del cliente original.
    """
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class AuditMiddleware:
    """
    Middleware que inyecta el request en el thread-local al inicio
    de cada ciclo y lo limpia al finalizar para evitar leaks entre requests.

    Agregar en settings.py ANTES de cualquier middleware de auth:

        MIDDLEWARE = [
            ...
            "audit.middleware.AuditMiddleware",
            ...
        ]
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_local.request = request
        try:
            response = self.get_response(request)
        finally:
            _thread_local.request = None
        return response