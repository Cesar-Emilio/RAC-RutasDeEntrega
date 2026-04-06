from rest_framework import generics
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer
from apps.authorization.permissions import IsAdminRole

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True)
    permission_classes = (IsAdminRole,)
    serializer_class = RegisterSerializer