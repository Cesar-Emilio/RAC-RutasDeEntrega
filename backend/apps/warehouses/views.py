from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter

from utils.response_helper import ApiResponse
from .models import Warehouse
from .serializers import WarehouseSerializer


@extend_schema(
    description="Gestión completa de almacenes (CRUD). Permite listar, crear, actualizar y desactivar almacenes.",
)
class WarehouseViewSet(viewsets.ModelViewSet):
    serializer_class = WarehouseSerializer

    @extend_schema(
        description="Obtiene la lista de almacenes de la empresa del usuario autenticado. Acepta el parámetro ?active=true|false para filtrar por estado.",
        parameters=[
            OpenApiParameter(
                name='active',
                location=OpenApiParameter.QUERY,
                required=False,
                type=OpenApiTypes.BOOL,
                description='Filtra por estado: true = activos, false = inactivos. Sin parámetro devuelve todos.'
            )
        ],
        responses={200: WarehouseSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return ApiResponse.success(
            data=serializer.data,
            message="Lista de almacenes obtenida correctamente."
        )

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
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return ApiResponse.success(
            data=serializer.data,
            message="Detalle del almacén obtenido correctamente."
        )

    @extend_schema(
        description="Crea un nuevo almacén asociado a la empresa del usuario autenticado.",
        request=WarehouseSerializer,
        responses={201: WarehouseSerializer},
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return ApiResponse.created(
            data=serializer.data,
            message="Almacén creado correctamente."
        )

    @extend_schema(
        description="Actualiza completamente un almacén existente.",
        request=WarehouseSerializer,
        responses={200: WarehouseSerializer},
    )
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return ApiResponse.success(
            data=serializer.data,
            message="Almacén actualizado correctamente."
        )

    @extend_schema(
        description="Actualiza parcialmente un almacén existente.",
        request=WarehouseSerializer,
        responses={200: WarehouseSerializer},
    )
    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    @extend_schema(
        description="Desactiva un almacén (borrado lógico).",
        responses={200: OpenApiTypes.OBJECT},
    )
    def destroy(self, request, *args, **kwargs):
        warehouse = self.get_object()
        warehouse.active = False
        warehouse.save()
        return ApiResponse.success(
            message="Almacén desactivado correctamente."
        )

    @extend_schema(
        description="Alterna el estado activo/inactivo de un almacén.",
        request=None,
        responses={200: WarehouseSerializer},
    )
    @action(detail=True, methods=['patch'], url_path='toggle')
    def toggle(self, request, pk=None):
        warehouse = self.get_object()
        warehouse.active = not warehouse.active
        warehouse.save()
        serializer = self.get_serializer(warehouse)
        estado = "activado" if warehouse.active else "desactivado"
        return ApiResponse.success(
            data=serializer.data,
            message=f"Almacén {estado} correctamente."
        )

    def get_queryset(self):
        """
        Devuelve todos los almacenes de la empresa del usuario autenticado.
        Opcionalmente filtra por estado usando ?active=true|false.
        """
        queryset = Warehouse.objects.filter(
            company=self.request.user.company
        )

        active_param = self.request.query_params.get('active', None)
        if active_param is not None:
            if active_param.lower() == 'true':
                queryset = queryset.filter(active=True)
            elif active_param.lower() == 'false':
                queryset = queryset.filter(active=False)

        return queryset

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)