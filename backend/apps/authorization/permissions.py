from rest_framework.permissions import BasePermission


def _is_active(user):
    if user is None or not getattr(user, "is_authenticated", False):
        return False
    return bool(getattr(user, "is_active", True))


class IsActiveUser(BasePermission):
    def has_permission(self, request, view):
        return _is_active(request.user)


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        if not _is_active(request.user):
            return False
        return getattr(request.user, "role", None) == "admin"


class IsCompanyRole(BasePermission):
    def has_permission(self, request, view):
        if not _is_active(request.user):
            return False
        return getattr(request.user, "role", None) == "company"
