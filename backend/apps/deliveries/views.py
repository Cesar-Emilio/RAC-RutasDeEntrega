from rest_framework import generics, status
from drf_spectacular.openapi import OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import Route
from .serializers import RouteListSerializer, RouteCreateSerializer, RouteDetailSerializer
from .tasks import enqueue_process_route
from utils.response_helper import ApiResponse


@extend_schema(
    description="Recupera la lista resumida de rutas registradas, ordenadas de más recientes a más antiguas.",
    responses={200: RouteListSerializer(many=True)},  # 🔥 FIX
)
class RouteListView(generics.ListAPIView):
    """
    Devuelve la lista resumida de todas las rutas.
    """

    serializer_class = RouteListSerializer

    def get_queryset(self):
        return (
            Route.objects
            .select_related("warehouse", "company", "input_file")
            .order_by("-created_at")
        )


@extend_schema(
    description="Crea una nueva ruta y encola su procesamiento. Devuelve el id de la ruta, su estado inicial y el task_id de procesamiento.",
    request=RouteCreateSerializer,
    responses={
        202: OpenApiResponse(
            description="Ruta aceptada para procesamiento. Retorna id, status y task_id."
        )
    },  # 🔥 FIX (más claro)
)
class RouteCreateView(generics.CreateAPIView):
    """
    Crea una nueva ruta junto con su RouteInputFile.
    """

    serializer_class = RouteCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        route = serializer.save()

        task_id = enqueue_process_route(route.id)

        headers = self.get_success_headers(serializer.data)
        return ApiResponse.success(
            data={"id": route.id, "status": route.status, "task_id": task_id},
            status=status.HTTP_202_ACCEPTED,
            headers=headers,
        )


@extend_schema(
    description="Recupera el detalle completo de una ruta, incluyendo datos base, puntos de entrega y la última solución ordenada.",
    parameters=[  # 🔥 FIX (faltaba)
        OpenApiParameter(
            name='id',
            location=OpenApiParameter.PATH,
            required=True,
            type=OpenApiTypes.INT,
            description='ID de la ruta a obtener.',
        ),
    ],
    responses={200: RouteDetailSerializer},  # 🔥 FIX
)
class RouteDetailView(generics.RetrieveAPIView):
    """
    Devuelve el detalle completo de una ruta: datos base, puntos de entrega
    y la solución más reciente con sus puntos ordenados.
    """

    serializer_class = RouteDetailSerializer

    def get_queryset(self):
        return (
            Route.objects
            .select_related("warehouse", "company", "input_file")
            .prefetch_related(
                "delivery_points",
                "solutions__details__delivery_point",
            )
        )