from rest_framework import viewsets
from .models import Company
from .serializers import CompanySerializer
from apps.authorization.permissions import IsAdminRole


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.filter(active=True)
    serializer_class = CompanySerializer
    permission_classes = [IsAdminRole]
