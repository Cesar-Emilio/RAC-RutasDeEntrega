from rest_framework.permissions import BasePermission

class IsCompanyUser(BasePermission):
    """
    Permite el acceso solo a usuarios que tienen una compañía asociada
    (user.company_id no es None).
    """
    message = "Se requiere una cuenta de empresa para realizar esta acción."
 
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.company_id is not None
        )
 
 
class IsAdminOrCompanyUser(BasePermission):
    """
    Permite el acceso a admins (is_staff) y a usuarios con empresa asociada.
    Se usa en lecturas: cada uno verá solo lo que le corresponde (filtrado en get_queryset).
    """
    message = "Se requiere autenticación con una cuenta válida."
 
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_staff or request.user.company_id is not None