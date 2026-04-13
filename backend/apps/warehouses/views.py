from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter

from .models import Warehouse
from .serializers import WarehouseSerializer


@extend_schema(
    description="Gestión completa de almacenes (CRUD). Permite listar, crear, actualizar y desactivar almacenes.",
)
class WarehouseViewSet(viewsets.ModelViewSet):
    serializer_class = WarehouseSerializer

    @extend_schema(
        description="Obtiene la lista de almacenes activos del usuario autenticado.",
        responses={200: WarehouseSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        description="Obtiene el detalle de un almacén específico.",
        parameters=[
            OpenApiParameter(
                name='pk',
                location=OpenApiParameter.PATH,
                required=True,
                type=OpenApiTypes.INT,
                description='ID del almacén'
            )
        ],
        responses={200: WarehouseSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        description="Crea un nuevo almacén asociado a la empresa del usuario autenticado.",
        request=WarehouseSerializer,
        responses={201: WarehouseSerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        description="Actualiza completamente un almacén existente.",
        request=WarehouseSerializer,
        responses={200: WarehouseSerializer},
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        description="Actualiza parcialmente un almacén existente.",
        request=WarehouseSerializer,
        responses={200: WarehouseSerializer},
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        description="Desactiva un almacén (borrado lógico).",
        responses={200: OpenApiTypes.OBJECT},
    )
    def destroy(self, request, *args, **kwargs):
        warehouse = self.get_object()
        warehouse.active = False
        warehouse.save()
        return Response(
            {'detail': 'Almacén desactivado correctamente.'},
            status=status.HTTP_200_OK
        )

    def get_queryset(self):
        return Warehouse.objects.filter(
            active=True,
            company=self.request.user.company
        )

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)