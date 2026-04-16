class CaptureRequestDataMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Captura la IP
        request.ip_address = request.META.get('REMOTE_ADDR', '')

        # Captura el User-Agent
        request.user_agent = request.META.get('HTTP_USER_AGENT', '')

        response = self.get_response(request)
        return response