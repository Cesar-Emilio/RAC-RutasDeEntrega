from rest_framework import serializers
from .models import Route, RouteInputFile, DeliveryPoint, RouteSolution, RouteSolutionDetail
    
class RouteListSerializer(serializers.ModelSerializer):
    """
    Serializer para la representación resumida de las rutas
    
    Se utiliza en endpoints de listado para devolver la información mínima de cada ruta, intentando reducir el tamaño de la respuesta
    
    Solo se incluye su identificador, estado actual y fecha de creación de la ruta
    """
    class Meta:
        model = Route
        fields = ["id", "status", "created_at"]
        
class DeliveryPointSerializer(serializers.ModelSerializer):
    """
    Serializer para los puntos de entrega
    
    Puede ser usado en contextos de detalle o como serializer anidado dentro de otros serializers
    """
    class Meta:
        model = DeliveryPoint
        fields = "__all__"
        
class RouteSolutionSerializer(serializers.ModelSerializer):
    """
    Serilaizer para detalles de la solución de una ruta
    
    Se puede usar para mostrar los detalles de la solución, contiene la fecha de creación y la distancia de solución (no sé si lo pueda hacer, intentaré)
    """
    class Meta:
        model = RouteSolution
        fields = "__all__"

class RouteCreateWithFileSerializer(serializers.ModelSerializer):
    """
    Serializador para la creación de una nueva ruta
    
    Este serializador guarda los datos del tipo de archivo en el modelo RouteInputFile al momento de crear una nueva ruta
    """
    file = serializers.FileField(write_only=True)
    file_type = serializers.CharField(write_only=True)

    class Meta:
        model = Route
        fields = ["company", "warehouse", "delivery_count", "file", "file_type"]

    def create(self, validated_data):
        file = validated_data.pop("file")
        file_type = validated_data.pop("file_type")

        route = Route.objects.create(**validated_data)

        RouteInputFile.objects.create(
            route=route,
            file=file,
            file_type=file_type
        )

        return route
        
class RouteDetailSerializer(serializers.ModelSerializer):
    """
    Serializer para la representación detallada de una ruta.
    
    Incluye toda la info de la ruta junto con sus puntos de entrega asociados, utilizando un serializer anidado para exponerlos en la respuesta
    """
    
    delivery_points = DeliveryPointSerializer(many=True, read_only=True)

    class Meta:
        model = Route
        fields = "__all__"
        
class RouteSolutionDetailSerializer(serializers.ModelSerializer):
    """
    Serializador para mostrar los puntos de la solución de una ruta
    
    Lo mismo que el de arriba, con la diferencia de que los puntos de aquí ya van con orden
    """
    
    delivery_point = DeliveryPointSerializer()

    class Meta:
        model = RouteSolutionDetail
        fields = ["order_index", "delivery_point"]
        
class RouteSolutionDetailFullSerializer(serializers.ModelSerializer):
    """
    Serializer para la representación detallada de una solución de ruta.

    Incluye las métricas principales de la solución, como la distancia total,
    junto con el listado ordenado de puntos de entrega que conforman la ruta
    optimizada mediante un serializer anidado.
    """
    
    details = RouteSolutionDetailSerializer(many=True, read_only=True)

    class Meta:
        model = RouteSolution
        fields = ["id", "total_distance", "created_at", "details"]