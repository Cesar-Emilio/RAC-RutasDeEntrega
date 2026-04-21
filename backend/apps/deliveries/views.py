import time

from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from drf_spectacular.openapi import OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import Route
from .serializers import RouteListSerializer, RouteCreateSerializer, RouteDetailSerializer, RouteDeleteSerializer
from .tasks import enqueue_process_route
from .permissions import IsAdminOrCompanyUser, IsCompanyUser
from utils.response_helper import ApiResponse
from config.logging_utils import get_logger, build_request_context, sanitize_params

logger = get_logger(__name__)


class CompanyScopedMixin:
    """
    Restringe el queryset base según el rol del usuario:
 
    - Admin (is_superuser)  -> acceso total, sin filtro de compañía.
                          Acepta ?company=<id> para filtrar opcionalmente.
    - Company user      -> solo rutas de su propia compañía (user.company_id).
                          El parámetro ?company= se ignora para evitar escalada.
    """
 
    def get_company_filtered_queryset(self, queryset):
        user = self.request.user
        ctx = build_request_context(self.request)
 
        if user.is_superuser:
            company_id = self.request.query_params.get("company")
            if company_id:
                queryset = queryset.filter(company_id=company_id)
                logger.debug(
                    "company_scope | action=filter_by_company | company_id={company_id} "
                    "| request_id={request_id} | user_id={user_id}",
                    company_id=company_id,
                    **ctx,
                )
        else:
            queryset = queryset.filter(company_id=user.company_id)
            logger.debug(
                "company_scope | action=restrict_to_own_company | company_id={company_id} "
                "| request_id={request_id} | user_id={user_id}",
                company_id=user.company_id,
                **ctx,
            )
 
        return queryset


@extend_schema(
    description=(
        "Recupera la lista resumida de rutas ordenadas de más recientes a más antiguas. "
        "Los admins ven todas las rutas y pueden filtrar por ?company=<id>. "
        "Los usuarios de empresa solo ven las rutas de su propia compañía."
    ),
    parameters=[
        OpenApiParameter(
            name="company",
            location=OpenApiParameter.QUERY,
            required=False,
            type=OpenApiTypes.INT,
            description="(Solo admin) Filtra rutas por ID de compañía.",
        ),
    ],
    responses={200: RouteListSerializer(many=True)},
)
class RouteListView(CompanyScopedMixin, generics.ListAPIView):
    """
    Devuelve la lista resumida de todas las rutas accesibles para el usuario.
    """

    serializer_class = RouteListSerializer
    permission_classes = [IsAdminOrCompanyUser]
 
    def get_queryset(self):
        ctx = build_request_context(self.request)
        logger.debug(
            "route_list | action=get_queryset | params={params} "
            "| request_id={request_id} | user_id={user_id}",
            params=sanitize_params(dict(self.request.query_params)),
            **ctx,
        )
        queryset = (
            Route.objects
            .select_related("warehouse", "company", "input_file")
            .order_by("-created_at")
        )
        return self.get_company_filtered_queryset(queryset)

    def list(self, request, *args, **kwargs):
        ctx = build_request_context(request)
        start = time.perf_counter()
        response = super().list(request, *args, **kwargs)
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        count = len(response.data) if hasattr(response, "data") and isinstance(response.data, list) else "?"
        logger.info(
            "route_list | action=list_routes | result=success | count={count} "
            "| execution_time_ms={elapsed_ms} | request_id={request_id} | user_id={user_id} "
            "| endpoint={endpoint} | method={method} | status_code=200",
            count=count,
            elapsed_ms=elapsed_ms,
            **ctx,
        )
        return response


@extend_schema(
    description=(
        "Crea una nueva ruta y encola su procesamiento. "
        "Solo usuarios con empresa asociada pueden crear rutas. "
        "La ruta se asocia automáticamente a la compañía del usuario autenticado."
    ),
    request=RouteCreateSerializer,
    responses={
        202: OpenApiResponse(
            description="Ruta aceptada para procesamiento. Retorna id, status y task_id."
        ),
        403: OpenApiResponse(description="El usuario no tiene empresa asociada."),
    },
)
class RouteCreateView(generics.CreateAPIView):
    """
    Crea una nueva ruta junto con su RouteInputFile.
 
    El campo company se sobreescribe con user.company para evitar
    que el cliente pueda crear rutas bajo otra compañía.
    """

    serializer_class = RouteCreateSerializer
    permission_classes = [IsCompanyUser]
 
    def perform_create(self, serializer):
        """
        Inyecta la compañía del usuario autenticado, ignorando cualquier
        valor que el cliente haya enviado en el campo company.
        """
        file = self.request.FILES.get("file")
        delivery_count = self.count_deliveries(file, serializer.validated_data["file_type"])
 
        serializer.save(
            company=self.request.user.company,
            delivery_count=delivery_count,
        )
    
    def count_deliveries(self, file, file_type: str) -> int:
        """
        Cuenta las entregas del archivo para poblar delivery_count.
        Se hace aquí para no duplicar la lógica de parseo completa
        antes de que el worker procese el archivo.
        """
        import csv, json, io
        import openpyxl
 
        file.seek(0)
        content = file.read()
        file.seek(0)
 
        try:
            if file_type == "csv":
                reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))
                return sum(1 for _ in reader)
            elif file_type == "json":
                data = json.loads(content.decode("utf-8"))
                if isinstance(data, dict):
                    data = data.get("deliveries", [])
                return len(data) if isinstance(data, list) else 0
            elif file_type == "xlsx":
                wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
                ws = wb["Entregas"]
                return sum(
                    1 for row in ws.iter_rows(min_row=2, values_only=True)
                    if any(cell is not None for cell in row)
                )
        except Exception:
            return 0
 
    def create(self, request, *args, **kwargs):
        ctx = build_request_context(request)
        start = time.perf_counter()

        logger.info(
            "route_create | action=create_route_start | file_type={file_type} "
            "| company_id={company_id} | request_id={request_id} | user_id={user_id} "
            "| endpoint={endpoint} | method={method}",
            file_type=request.data.get("file_type"),
            company_id=getattr(request.user.company, "id", None),
            **ctx,
        )
        logger.debug(
            "route_create | action=request_params | params={params} "
            "| request_id={request_id} | user_id={user_id}",
            params=sanitize_params({k: v for k, v in request.data.items() if k != "file"}),
            **ctx,
        )

        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            self.perform_create(serializer)
            route = serializer.instance
     
            task_id = enqueue_process_route(route.id)
            elapsed_ms = int((time.perf_counter() - start) * 1000)
     
            logger.info(
                "route_create | action=create_route_end | result=success | route_id={route_id} "
                "| task_id={task_id} | delivery_count={delivery_count} "
                "| execution_time_ms={elapsed_ms} | request_id={request_id} | user_id={user_id} "
                "| endpoint={endpoint} | method={method} | status_code=202",
                route_id=route.id,
                task_id=task_id,
                delivery_count=route.delivery_count,
                elapsed_ms=elapsed_ms,
                **ctx,
            )
     
            headers = self.get_success_headers(serializer.data)
            return ApiResponse.success(
                data={"id": route.id, "status": route.status, "task_id": task_id},
                status=status.HTTP_202_ACCEPTED,
                headers=headers,
            )

        except Exception as exc:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            logger.error(
                "route_create | action=create_route_end | result=failure | error={error} "
                "| execution_time_ms={elapsed_ms} | request_id={request_id} | user_id={user_id} "
                "| endpoint={endpoint} | method={method}",
                error=str(exc),
                elapsed_ms=elapsed_ms,
                **ctx,
            )
            raise

@extend_schema(
    description=(
        "Elimina físicamente una ruta de entrega. "
        "Solo usuarios de empresa pueden eliminar rutas de su propia compañía."
    ),
    parameters=[
        OpenApiParameter(
            name="id",
            location=OpenApiParameter.PATH,
            required=True,
            type=OpenApiTypes.INT,
            description="ID de la ruta de entrega a eliminar.",
        ),
    ],
    responses={
        204: OpenApiResponse(description="Ruta eliminada correctamente."),
        404: OpenApiResponse(description="Ruta no encontrada."),
    },
)
class RouteDeleteView(CompanyScopedMixin, generics.DestroyAPIView):
    """
    Elimina físicamente una ruta de entrega.
    """

    serializer_class = RouteDeleteSerializer
    permission_classes = [IsCompanyUser]

    def get_queryset(self):
        ctx = build_request_context(self.request)
        route_id = self.kwargs.get("pk")
        logger.debug(
            "route_delete | action=get_queryset | route_id={route_id} "
            "| request_id={request_id} | user_id={user_id}",
            route_id=route_id,
            **ctx,
        )
        queryset = Route.objects.all()
        return self.get_company_filtered_queryset(queryset)

    def destroy(self, request, *args, **kwargs):
        ctx = build_request_context(request)
        start = time.perf_counter()

        instance = self.get_object()
        route_id = instance.id

        self.perform_destroy(instance)

        elapsed_ms = int((time.perf_counter() - start) * 1000)
        logger.info(
            "route_delete | action=delete_route | result=success | route_id={route_id} "
            "| execution_time_ms={elapsed_ms} | request_id={request_id} | user_id={user_id} "
            "| endpoint={endpoint} | method={method} | status_code=200",
            route_id=route_id,
            elapsed_ms=elapsed_ms,
            **ctx,
        )

        return ApiResponse.success(
            data=None,
            status=status.HTTP_200_OK,
    )

@extend_schema(
    description=(
        "Recupera el detalle completo de una ruta: datos base, puntos de entrega "
        "y la última solución ordenada. "
        "Los usuarios de empresa solo pueden acceder a rutas de su propia compañía."
    ),
    parameters=[
        OpenApiParameter(
            name="id",
            location=OpenApiParameter.PATH,
            required=True,
            type=OpenApiTypes.INT,
            description="ID de la ruta de entrega a obtener.",
        ),
    ],
    responses={
        200: RouteDetailSerializer,
        403: OpenApiResponse(description="La ruta de entrega no pertenece a la compañía del usuario."),
        404: OpenApiResponse(description="Ruta de entrega no encontrada."),
    },
)
class RouteDetailView(CompanyScopedMixin, generics.RetrieveAPIView):
    """
    Devuelve el detalle completo de una ruta de entrega con su solución ordenada.
 
    El scope de compañía se aplica en get_queryset, por lo que un usuario
    de empresa que intente acceder a una ruta de entrega ajena recibirá 404 en lugar
    de 403, evitando exponer la existencia del recurso.
    """

    serializer_class = RouteDetailSerializer
    permission_classes = [IsAdminOrCompanyUser]

    def get_queryset(self):
        ctx = build_request_context(self.request)
        route_id = self.kwargs.get("pk")
        logger.debug(
            "route_detail | action=get_queryset | route_id={route_id} "
            "| request_id={request_id} | user_id={user_id}",
            route_id=route_id,
            **ctx,
        )
        queryset = (
            Route.objects
            .select_related("warehouse", "company", "input_file")
            .prefetch_related(
                "delivery_points",
                "solutions__details__delivery_point",
            )
        )
        return self.get_company_filtered_queryset(queryset)

    def retrieve(self, request, *args, **kwargs):
        ctx = build_request_context(request)
        start = time.perf_counter()
        response = super().retrieve(request, *args, **kwargs)
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        route_id = kwargs.get("pk")
        logger.info(
            "route_detail | action=retrieve_route | result=success | route_id={route_id} "
            "| execution_time_ms={elapsed_ms} | request_id={request_id} | user_id={user_id} "
            "| endpoint={endpoint} | method={method} | status_code=200",
            route_id=route_id,
            elapsed_ms=elapsed_ms,
            **ctx,
        )
        return response