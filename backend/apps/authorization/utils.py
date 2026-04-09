from rest_framework.response import Response


def api_response(status_value, message, data=None, errors=None, http_status=200):
    payload = {
        "status": status_value,
        "message": message,
        "data": data,
        "errors": errors,
    }
    return Response(payload, status=http_status)
