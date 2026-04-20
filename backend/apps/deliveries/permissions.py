from rest_framework.permissions import BasePermission
from config.logging_utils import get_logger

logger = get_logger(__name__)


class IsCompanyUser(BasePermission):
    """
    Permite el acceso solo a usuarios que tienen una compañía asociada
    (user.company_id no es None) y que estén activos (is_active=True).
    """
    message = "Se requiere una cuenta de empresa activa para realizar esta acción."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if not getattr(user, "is_active", False):
            logger.warning(
                "permission | action=check_company_user | result=rejected_inactive_user "
                "| user_id={user_id} | endpoint={endpoint} | method={method}",
                user_id=getattr(user, "id", None),
                endpoint=request.path,
                method=request.method,
            )
            return False
        return user.company_id is not None


class IsAdminOrCompanyUser(BasePermission):
    """
    Permite el acceso a admins (is_staff) y a usuarios con empresa asociada.
    Se usa en lecturas: cada uno verá solo lo que le corresponde (filtrado en get_queryset).
    Requiere que el usuario esté activo (is_active=True).
    """
    message = "Se requiere autenticación con una cuenta válida y activa."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if not getattr(user, "is_active", False):
            logger.warning(
                "permission | action=check_admin_or_company | result=rejected_inactive_user "
                "| user_id={user_id} | endpoint={endpoint} | method={method}",
                user_id=getattr(user, "id", None),
                endpoint=request.path,
                method=request.method,
            )
            return False
        return user.is_staff or user.company_id is not None