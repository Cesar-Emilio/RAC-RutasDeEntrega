from rest_framework.permissions import BasePermission
from config.logging_utils import get_logger

logger = get_logger(__name__)


class IsAdminUser(BasePermission):
    """
    Solo permite el acceso a los usuarios administradores (is_staff)
    que estén activos (is_active=True).
    """
    message = "Se requiere ser un usuario administrador activo."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if not getattr(user, "is_active", False):
            logger.warning(
                "permission | action=check_admin | result=rejected_inactive_user "
                "| user_id={user_id} | endpoint={endpoint} | method={method}",
                user_id=getattr(user, "id", None),
                endpoint=request.path,
                method=request.method,
            )
            return False
        if not user.is_staff:
            return False
        return True


class IsAdminOrCompanyUser(BasePermission):
    """
    Permite el acceso a administradores (is_staff) y usuarios con una compañía asociada.
    Requiere que el usuario esté activo (is_active=True).
    """
    message = "Se requiere un rol de administrador o una cuenta con una empresa asociada."

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


class IsCompanyUser(BasePermission):
    """
    Permite el acceso solo a los usuarios que tienen una compañía asociada
    y que estén activos (is_active=True).
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