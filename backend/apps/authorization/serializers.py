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
        "active": getattr(user, "active", None)
        if hasattr(user, "active")
        else getattr(user, "is_active", True),
    }


class LoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        if hasattr(user, "role"):
            token["role"] = user.role
        if hasattr(user, "company_id"):
            token["company_id"] = user.company_id
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        if hasattr(user, "active") and not user.active:
            raise serializers.ValidationError("User is inactive.")
        data["user"] = _serialize_user(user)
        return data


class MeSerializer(serializers.Serializer):
    user = serializers.DictField()

    def to_representation(self, instance):
        user = instance
        return {"user": _serialize_user(user)}
