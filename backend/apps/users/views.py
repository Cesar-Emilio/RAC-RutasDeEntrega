from rest_framework import generics
from drf_spectacular.utils import extend_schema
from django.contrib.auth import get_user_model
from apps.authorization.permissions import IsAdminRole
from .serializers import RegisterSerializer

User = get_user_model()


@extend_schema(
    description="Registra un nuevo usuario con rol y empresa asociados.",
    request=RegisterSerializer,
    responses={201: RegisterSerializer},
)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (IsAdminRole,)
    serializer_class = RegisterSerializer