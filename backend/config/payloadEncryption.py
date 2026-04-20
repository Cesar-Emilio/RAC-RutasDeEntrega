import base64
import io
import json

from django.http import JsonResponse


class PayloadEncryptionMiddleware:
    """Decode encrypted JSON payloads sent by frontend Axios interceptor."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if self._should_decode(request):
            error_response = self._decode_request_payload(request)
            if error_response is not None:
                return error_response

        return self.get_response(request)

    def _should_decode(self, request):
        if request.method in {"GET", "HEAD", "OPTIONS"}:
            return False

        is_encrypted = request.headers.get("X-Payload-Encrypted", "").lower() == "true"
        content_type = request.headers.get("Content-Type", "")

        return is_encrypted and "application/json" in content_type

    def _decode_request_payload(self, request):
        try:
            body_data = json.loads(request.body.decode("utf-8") or "{}")
        except (json.JSONDecodeError, UnicodeDecodeError):
            return JsonResponse(
                {
                    "success": False,
                    "message": "Cuerpo JSON inválido.",
                    "errors": {"detail": "El payload cifrado de la petición es inválido."},
                },
                status=400,
            )

        payload = body_data.get("payload")
        if not isinstance(payload, str):
            return JsonResponse(
                {
                    "success": False,
                    "message": "Payload cifrado inválido.",
                    "errors": {"detail": "El payload cifrado debe ser una cadena base64."},
                },
                status=400,
            )

        try:
            # Normalize padding to avoid false negatives with base64 payloads.
            normalized_payload = payload.strip()
            missing_padding = len(normalized_payload) % 4
            if missing_padding:
                normalized_payload += "=" * (4 - missing_padding)

            decoded_bytes = base64.b64decode(normalized_payload, validate=True)
            decoded_data = json.loads(decoded_bytes.decode("utf-8"))
        except (ValueError, UnicodeDecodeError, json.JSONDecodeError):
            return JsonResponse(
                {
                    "success": False,
                    "message": "No se pudo descifrar el payload.",
                    "errors": {"detail": "El payload cifrado es inválido."},
                },
                status=400,
            )

        normalized_body = json.dumps(decoded_data).encode("utf-8")
        request._body = normalized_body
        request._stream = io.BytesIO(normalized_body)
        request.META["CONTENT_LENGTH"] = str(len(normalized_body))

        return None
