from rest_framework.permissions import BasePermission
from config.logging_utils import get_logger

logger = get_logger(__name__)


def _is_active(user):
    if user is None or not getattr(user, "is_authenticated", False):
        return False
    return bool(getattr(user, "is_active", True))


class IsActiveUser(BasePermission):
    def has_permission(self, request, view):
        if not _is_active(request.user):
            logger.warning(
                "permission | action=check_active_user | result=rejected_inactive_user "
                "| user_id={user_id} | endpoint={endpoint} | method={method}",
                user_id=getattr(request.user, "id", None),
                endpoint=request.path,
                method=request.method,
            )
            return False
        return True


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        if not _is_active(request.user):
            logger.warning(
                "permission | action=check_admin_role | result=rejected_inactive_user "
                "| user_id={user_id} | endpoint={endpoint} | method={method}",
                user_id=getattr(request.user, "id", None),
                endpoint=request.path,
                method=request.method,
            )
            return False
        if getattr(request.user, "role", None) != "admin":
            logger.warning(
                "permission | action=check_admin_role | result=rejected_not_admin "
                "| user_id={user_id} | role={role} | endpoint={endpoint} | method={method}",
                user_id=getattr(request.user, "id", None),
                role=getattr(request.user, "role", None),
                endpoint=request.path,
                method=request.method,
            )
            return False
        return True


class IsCompanyRole(BasePermission):
    def has_permission(self, request, view):
        if not _is_active(request.user):
            logger.warning(
                "permission | action=check_company_role | result=rejected_inactive_user "
                "| user_id={user_id} | endpoint={endpoint} | method={method}",
                user_id=getattr(request.user, "id", None),
                endpoint=request.path,
                method=request.method,
            )
            return False
        if getattr(request.user, "role", None) != "company":
            logger.warning(
                "permission | action=check_company_role | result=rejected_not_company "
                "| user_id={user_id} | role={role} | endpoint={endpoint} | method={method}",
                user_id=getattr(request.user, "id", None),
                role=getattr(request.user, "role", None),
                endpoint=request.path,
                method=request.method,
            )
            return False
        return True
