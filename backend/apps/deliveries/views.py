from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from drf_spectacular.openapi import OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import Route
from .serializers import RouteListSerializer, RouteCreateSerializer, RouteDetailSerializer
from .tasks import enqueue_process_route
from .permissions import IsAdminOrCompanyUser, IsCompanyUser
from utils.response_helper import ApiResponse

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
 
        if user.is_superuser:
            company_id = self.request.query_params.get("company")
            if company_id:
                queryset = queryset.filter(company_id=company_id)
        else:
            queryset = queryset.filter(company_id=user.company_id)
 
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
class RouteListView(generics.ListAPIView):
    """
    Devuelve la lista resumida de todas las rutas accesibles para el usuario.
    """

    serializer_class = RouteListSerializer
    permission_classes = [IsAdminOrCompanyUser]
 
    def get_queryset(self):
        queryset = (
            Route.objects
            .select_related("warehouse", "company", "input_file")
            .order_by("-created_at")
        )
        return self.get_company_filtered_queryset(queryset)


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
        serializer.save(company=self.request.user.company)
 
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        route = serializer.instance
 
        task_id = enqueue_process_route(route.id)
 
        headers = self.get_success_headers(serializer.data)
        return ApiResponse.success(
            data={"id": route.id, "status": route.status, "task_id": task_id},
            status=status.HTTP_202_ACCEPTED,
            headers=headers,
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
            description="ID de la ruta a obtener.",
        ),
    ],
    responses={
        200: RouteDetailSerializer,
        403: OpenApiResponse(description="La ruta no pertenece a la compañía del usuario."),
        404: OpenApiResponse(description="Ruta no encontrada."),
    },
)
class RouteDetailView(generics.RetrieveAPIView):
    """
    Devuelve el detalle completo de una ruta con su solución ordenada.
 
    El scope de compañía se aplica en get_queryset, por lo que un usuario
    de empresa que intente acceder a una ruta ajena recibirá 404 en lugar
    de 403, evitando exponer la existencia del recurso.
    """

    serializer_class = RouteDetailSerializer
    permission_classes = [IsAdminOrCompanyUser]

    def get_queryset(self):
        queryset = (
            Route.objects
            .select_related("warehouse", "company", "input_file")
            .prefetch_related(
                "delivery_points",
                "solutions__details__delivery_point",
            )
        )
        return self.get_company_filtered_queryset(queryset)