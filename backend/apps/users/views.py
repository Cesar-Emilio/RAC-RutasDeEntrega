from rest_framework import generics
from django.contrib.auth import get_user_model
from apps.authorization.permissions import IsAdminRole
from .serializers import RegisterSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (IsAdminRole,)
    serializer_class = RegisterSerializer