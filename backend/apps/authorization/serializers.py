from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from config.logging_utils import get_logger

logger = get_logger(__name__)


def _serialize_user(user):
    company_id = getattr(user, "company_id", None)
    if company_id is None and getattr(user, "company", None) is not None:
        company_id = getattr(user.company, "id", None)
    return {
        "id": getattr(user, "id", None),
        "name": getattr(user, "name", None)
        or " ".join(filter(None, [getattr(user, "first_name", ""), getattr(user, "last_name", "")])).strip()
        or None,
        "email": getattr(user, "email", None),
        "role": getattr(user, "role", None),
        "company_id": company_id,
        "is_active": getattr(user, "is_active", True),
    }


class LoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        if hasattr(user, "role"):
            token["role"] = user.role
        if getattr(user, "company_id", None) is not None:
            token["company_id"] = user.company_id
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        if not getattr(user, "is_active", True):
            logger.warning(
                "login | action=authenticate | result=rejected_inactive_user "
                "| user_id={user_id} | email={email}",
                user_id=getattr(user, "id", None),
                email=getattr(user, "email", None),
            )
            raise serializers.ValidationError("User is inactive.")
        data["user"] = _serialize_user(user)
        return data


class MeSerializer(serializers.Serializer):
    user = serializers.DictField()

    def to_representation(self, instance):
        user = instance
        return {"user": _serialize_user(user)}
