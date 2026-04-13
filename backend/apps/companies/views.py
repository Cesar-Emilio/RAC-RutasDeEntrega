from rest_framework import viewsets
from drf_spectacular.openapi import OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view

from .models import Company
from .serializers import CompanySerializer
from apps.authorization.permissions import IsAdminRole


@extend_schema_view(
    list=extend_schema(
        description="Lista todas las compañías activas.",
        responses=CompanySerializer(many=True),
    ),
    retrieve=extend_schema(
        description="Recupera los datos de una compañía activa por su ID.",
        parameters=[
            OpenApiParameter(
                name='pk',
                location=OpenApiParameter.PATH,
                required=True,
                type=OpenApiTypes.INT,
                description='ID de la compañía.',
            ),
        ],
        responses=CompanySerializer,
    ),
    create=extend_schema(
        description="Crea una nueva compañía con los datos proporcionados.",
        request=CompanySerializer,
        responses={201: CompanySerializer},
    ),
    update=extend_schema(
        description="Actualiza los datos completos de una compañía existente.",
        request=CompanySerializer,
        responses=CompanySerializer,
    ),
    partial_update=extend_schema(
        description="Actualiza campos parciales de una compañía existente.",
        request=CompanySerializer,
        responses=CompanySerializer,
    ),
    destroy=extend_schema(
        description="Elimina una compañía activa.",
        responses={204: OpenApiResponse(description='Compañía eliminada correctamente.')},
    ),
)
class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.filter(active=True)
    serializer_class = CompanySerializer
    permission_classes = [IsAdminRole]
