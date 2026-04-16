from rest_framework.permissions import BasePermission

class IsAdminUser(BasePermission):
    """
    Solo permite el acceso a los usuarios administradores (is_staff).
    """
    message = "Se requiere ser un usuario administrador."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)

class IsAdminOrCompanyUser(BasePermission):
    """
    Permite el acceso a administradores (is_staff) y usuarios con empresa asociada.
    """
    message = "Se requiere un rol de administrador o una cuenta con una empresa asociada."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.company_id is not None))

class IsCompanyUser(BasePermission):
    """
    Permite el acceso solo a los usuarios que tienen una compañía asociada.
    """
    message = "Se requiere una cuenta de empresa para realizar esta acción."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.company_id is not None)