from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


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


def _validate_user_login_access(user):
    if not getattr(user, "is_active", True):
        raise serializers.ValidationError("Usuario inactivo.")

    is_company_user = getattr(user, "role", None) == "company"
    company = getattr(user, "company", None)
    if is_company_user and company is not None and not getattr(company, "active", True):
        raise serializers.ValidationError("Empresa inactiva.")


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
        _validate_user_login_access(user)
        data["user"] = _serialize_user(user)
        return data


class MeSerializer(serializers.Serializer):
    user = serializers.DictField()

    def to_representation(self, instance):
        user = instance
        return {"user": _serialize_user(user)}
