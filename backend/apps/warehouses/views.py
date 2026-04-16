import time

from rest_framework import viewsets, status
from rest_framework.exceptions import NotFound
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter

from utils.response_helper import ApiResponse
from .models import Warehouse
from .serializers import WarehouseSerializer
from config.logging_utils import get_logger, build_request_context

logger = get_logger(__name__)


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
        ctx = build_request_context(request)
        start = time.perf_counter()

        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        count = queryset.count()
        elapsed_ms = int((time.perf_counter() - start) * 1000)

        logger.debug(
            "warehouse | action=list | company_id={company_id} | request_id={request_id} | user_id={user_id}",
            company_id=getattr(request.user.company, "id", None),
            **ctx,
        )
        logger.info(
            "warehouse | action=list | result=success | count={count} "
            "| execution_time_ms={elapsed_ms} | request_id={request_id} | user_id={user_id} "
            "| endpoint={endpoint} | method={method} | status_code=200",
            count=count,
            elapsed_ms=elapsed_ms,
            **ctx,
        )
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
        ctx = build_request_context(request)
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        logger.debug(
            "warehouse | action=retrieve | warehouse_id={warehouse_id} "
            "| request_id={request_id} | user_id={user_id}",
            warehouse_id=instance.id,
            **ctx,
        )
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
        ctx = build_request_context(request)
        actor_id = ctx.get("user_id")
        company_id = getattr(request.user.company, "id", None)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        logger.info(
            "warehouse | action=create | result=success | warehouse_id={warehouse_id} "
            "| company_id={company_id} | actor_user_id={actor_id} "
            "| request_id={request_id} | user_id={user_id} | status_code=201",
            warehouse_id=serializer.instance.id,
            company_id=company_id,
            actor_id=actor_id,
            **ctx,
        )
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
        ctx = build_request_context(request)
        actor_id = ctx.get("user_id")
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        action = "partial_update" if partial else "update"
        logger.info(
            "warehouse | action={action} | result=success | warehouse_id={warehouse_id} "
            "| actor_user_id={actor_id} | request_id={request_id} | user_id={user_id} | status_code=200",
            action=action,
            warehouse_id=instance.id,
            actor_id=actor_id,
            **ctx,
        )
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
        ctx = build_request_context(request)
        actor_id = ctx.get("user_id")
        warehouse = self.get_object()
        warehouse.active = False
        warehouse.save()

        logger.info(
            "warehouse | action=destroy | result=soft_deleted | warehouse_id={warehouse_id} "
            "| actor_user_id={actor_id} | request_id={request_id} | user_id={user_id} | status_code=200",
            warehouse_id=warehouse.id,
            actor_id=actor_id,
            **ctx,
        )
        return ApiResponse.success(
            message="Almacén desactivado correctamente."
        )

    def get_queryset(self):
        return Warehouse.objects.filter(
            active=True,
            company=self.request.user.company
        )

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)