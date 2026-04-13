from rest_framework import generics, status

from .models import Route
from .serializers import RouteListSerializer, RouteCreateSerializer, RouteDetailSerializer
from .tasks import enqueue_process_route

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
            data = {"id": route.id, "status": route.status, "task_id": task_id},
            status = status.HTTP_202_ACCEPTED,
            headers = headers,
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