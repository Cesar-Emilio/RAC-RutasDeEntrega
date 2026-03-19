from rest_framework.throttling import SimpleRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    scope = "login"

    def get_cache_key(self, request, view):
        email = request.data.get("email", "")
        ident = self.get_ident(request)
        if not email and not ident:
            return None
        return f"login:{ident}:{email.lower()}"
