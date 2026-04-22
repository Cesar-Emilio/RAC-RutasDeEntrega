import time

from rest_framework import viewsets, status
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
from config.logging_utils import get_logger, build_request_context

logger = get_logger(__name__)


@extend_schema(
    description="Gestión completa de almacenes (CRUD). Permite listar, crear, actualizar y desactivar almacenes.",
)
class WarehouseViewSet(viewsets.ModelViewSet):
    """
    ViewSet que expone las operaciones CRUD para el modelo Warehouse.

    Todas las operaciones están restringidas a los almacenes de la empresa
    del usuario autenticado. El borrado es lógico (campo `active=False`).

    Endpoints disponibles:
        GET    /warehouses/              -> list()
        POST   /warehouses/              -> create()
        GET    /warehouses/{pk}/         -> retrieve()
        PUT    /warehouses/{pk}/         -> update()
        PATCH  /warehouses/{pk}/         -> partial_update()
        DELETE /warehouses/{pk}/         -> destroy()
        PATCH  /warehouses/{pk}/toggle/  -> toggle()
    """
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
        """
        Lista todos los almacenes de la empresa del usuario autenticado.

        Soporta filtrado opcional por estado mediante el query param `active`.
        Registra métricas de ejecución (tiempo, cantidad de resultados) en los logs.

        Args:
            request (Request): Solicitud HTTP. Puede incluir query param `active=true|false`.

        Returns:
            ApiResponse (200): Lista serializada de almacenes con mensaje de éxito.
        """
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
        """
        Obtiene el detalle de un almacén específico por su ID.

        Args:
            request (Request): Solicitud HTTP autenticada.
            kwargs: Debe incluir `pk` con el ID del almacén a consultar.

        Returns:
            ApiResponse (200): Datos serializados del almacén solicitado.

        Raises:
            NotFound (404): Si el almacén no existe o no pertenece a la empresa del usuario.
        """
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
        """
        Crea un nuevo almacén y lo asocia automáticamente a la empresa del usuario.

        La empresa se asigna en `perform_create` desde el usuario autenticado,
        por lo que no debe incluirse en el payload de la solicitud.

        Args:
            request (Request): Solicitud HTTP con los datos del nuevo almacén en el body.

        Returns:
            ApiResponse (201): Datos serializados del almacén recién creado.

        Raises:
            ValidationError (400): Si los datos del body no pasan las validaciones del serializer.
        """
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
        """
        Actualiza un almacén existente, de forma completa (PUT) o parcial (PATCH).

        Cuando es llamado desde `partial_update`, el kwarg `partial=True` indica
        al serializer que no todos los campos son obligatorios.

        Args:
            request (Request): Solicitud HTTP con los datos a actualizar en el body.
            kwargs: Puede incluir `partial=True` si la actualización es parcial.

        Returns:
            ApiResponse (200): Datos serializados del almacén actualizado.

        Raises:
            NotFound (404): Si el almacén no existe o no pertenece a la empresa del usuario.
            ValidationError (400): Si los datos no pasan las validaciones del serializer.
        """
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
        """
        Delegación de actualización parcial (PATCH) hacia `update` con `partial=True`.

        Args:
            request (Request): Solicitud HTTP con los campos a actualizar parcialmente.

        Returns:
            ApiResponse (200): Resultado de `update()` con partial=True.
        """
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    @extend_schema(
        description="Desactiva un almacén (borrado lógico).",
        responses={200: OpenApiTypes.OBJECT},
    )
    def destroy(self, request, *args, **kwargs):
        """
        Realiza un borrado lógico del almacén estableciendo `active=False`.

        No elimina el registro de la base de datos. El almacén puede ser
        reactivado posteriormente mediante el endpoint `toggle`.

        Args:
            request (Request): Solicitud HTTP autenticada.
            kwargs: Debe incluir `pk` con el ID del almacén a desactivar.

        Returns:
            ApiResponse (200): Mensaje de confirmación de desactivación.

        Raises:
            NotFound (404): Si el almacén no existe o no pertenece a la empresa del usuario.
        """
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

    @extend_schema(
        description="Alterna el estado activo/inactivo de un almacén.",
        request=None,
        responses={200: WarehouseSerializer},
    )
    @action(detail=True, methods=['patch'], url_path='toggle')
    def toggle(self, request, pk=None):
        """
        Alterna el estado `active` de un almacén entre True y False.

        Si el almacén estaba activo, lo desactiva; si estaba inactivo, lo activa.

        Args:
            request (Request): Solicitud HTTP autenticada.
            pk (int): ID del almacén cuyo estado se va a alternar.

        Returns:
            ApiResponse (200): Datos serializados del almacén con su nuevo estado,
                               acompañado de un mensaje indicando si fue activado o desactivado.

        Raises:
            NotFound (404): Si el almacén no existe o no pertenece a la empresa del usuario.
        """
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

        Query Params:
            active (str, opcional): 'true' para almacenes activos, 'false' para inactivos.
                                    Si no se proporciona, retorna todos.

        Returns:
            QuerySet: Almacenes filtrados por empresa y opcionalmente por estado.
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
        """
        Persiste el nuevo almacén asignando automáticamente la empresa del usuario autenticado.

        Args:
            serializer (WarehouseSerializer): Serializer ya validado con los datos del nuevo almacén.
        """
        serializer.save(company=self.request.user.company)