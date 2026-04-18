import logging
from rest_framework import serializers
from .models import Route, RouteInputFile, DeliveryPoint, RouteSolution, RouteSolutionDetail, FileType

logger = logging.getLogger(__name__)

class RouteListSerializer(serializers.ModelSerializer):
    """
    Representación resumida de una ruta para el endpoint de listado (GET /).

    Expone solo los campos necesarios para construir una tabla:
    id, estado, fecha, almacén, empresa y conteo de entregas.
    El nombre del archivo se limpia para mostrar solo el basename.
    """

    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)
    file_name = serializers.SerializerMethodField()

    class Meta:
        model = Route
        fields = [
            "id",
            "status",
            "created_at",
            "company_name",
            "warehouse_name",
            "delivery_count",
            "file_name",
        ]

    def get_file_name(self, obj):
        """Devuelve solo el nombre del archivo sin la ruta del storage."""
        try:
            return obj.input_file.file.name.split("/")[-1]
        except RouteInputFile.DoesNotExist:
            logger.error("route_input_file_error: no existe el archivo en la base de datos")
            return None

class RouteCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para la creación de una nueva ruta (POST /create).

    Recibe el archivo y su tipo junto con los datos de la ruta.
    Crea Route y RouteInputFile en una sola operación.
    El campo file_type se valida contra el enum FileType.
    """

    file = serializers.FileField(write_only=True)
    file_type = serializers.ChoiceField(
        choices=FileType.choices,
        write_only=True,
    )
 
    k_opt = serializers.IntegerField(
        min_value=0,
        max_value=10,
        default=0,
        help_text="Iteraciones de mejora k-opt (0 = sin mejora, máx. 10).",
    )

    class Meta:
        model = Route
        fields = ["company", "warehouse", "delivery_count", "file", "file_type", "k_opt"]

    def create(self, validated_data):
        file = validated_data.pop("file")
        file_type = validated_data.pop("file_type")

        route = Route.objects.create(**validated_data)

        RouteInputFile.objects.create(
            route=route,
            file=file,
            file_type=file_type,
        )

        return route


class DeliveryPointSerializer(serializers.ModelSerializer):
    """
    Punto de entrega individual.
    Usado como serializer anidado dentro del detalle de solución.
    """

    class Meta:
        model = DeliveryPoint
        fields = ["id", "address", "latitude", "longitude"]


class RouteSolutionDetailSerializer(serializers.ModelSerializer):
    """
    Detalle de una solución: un punto de entrega con su índice de orden.
    Los puntos se devuelven ordenados por order_index desde la query (ver RouteSolutionSerializer).
    """

    delivery_point = DeliveryPointSerializer(read_only=True)

    class Meta:
        model = RouteSolutionDetail
        fields = ["order_index", "delivery_point"]


class RouteSolutionSerializer(serializers.ModelSerializer):
    """
    Solución de optimización de una ruta.
    Incluye la distancia total y los puntos ordenados por order_index.
    """

    details = serializers.SerializerMethodField()

    class Meta:
        model = RouteSolution
        fields = ["id", "total_distance", "created_at", "details"]

    def get_details(self, obj):
        ordered_details = obj.details.select_related("delivery_point").order_by("order_index")
        return RouteSolutionDetailSerializer(ordered_details, many=True).data


class RouteDetailSerializer(serializers.ModelSerializer):
    """
    Representación completa de una ruta para el endpoint de detalle (GET /id).

    Incluye:
    - Datos de la ruta y su estado
    - Nombre del archivo de entrada
    - Todos los puntos de entrega registrados
    - La solución con los puntos ordenados (última solución generada)
    """

    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)
    file_name = serializers.SerializerMethodField()
    delivery_points = DeliveryPointSerializer(many=True, read_only=True)
    solution = serializers.SerializerMethodField()

    class Meta:
        model = Route
        fields = [
            "id",
            "status",
            "created_at",
            "company_name",
            "warehouse_name",
            "delivery_count",
            "file_name",
            "delivery_points",
            "solution",
        ]

    def get_file_name(self, obj):
        try:
            return obj.input_file.file.name.split("/")[-1]
        except RouteInputFile.DoesNotExist:
            return None

    def get_solution(self, obj):
        """
        Devuelve la solución más reciente asociada a la ruta.
        Retorna None si la ruta aún no tiene solución calculada.
        """
        solution = obj.solutions.order_by("-created_at").first()
        if solution is None:
            return None
        return RouteSolutionSerializer(solution).data