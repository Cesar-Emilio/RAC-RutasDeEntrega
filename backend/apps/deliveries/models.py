from django.db import models

class FileType(models.TextChoices):
    """
    Tipos de archivos aceptados por el sistema
    """    
    JSON = "json", "JSON"
    CSV = "csv", "CSV"
    XLSX = "xlsx", "XLSX"

class Status(models.TextChoices):
    """
    Tipos de estados por los que puede pasar un procesamiento de ruta
    """
    PENDING = "pending", "Pendiente"
    PROCESSING = "processing", "Procesando"
    COMPLETED = "completed", "Completado"
    ERROR = "error", "Error"
    
class Route(models.Model):
    """
    Modelo principal que representa una ruta de entregas.

    Agrupa la información necesaria para procesar una optimización de entregas
    a partir de un conjunto de puntos asociados a una empresa y un almacén.
    """
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="routes"
    )

    warehouse = models.ForeignKey(
        "warehouses.Warehouse",
        on_delete=models.CASCADE,
        related_name="routes"
    )

    delivery_count = models.IntegerField()
    
    k_opt = models.PositiveSmallIntegerField(default=2)

    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.PENDING
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Route {self.id} - {self.status}"
    
class RouteInputFile(models.Model):
    """
    Archivo de entrada asociado a una ruta.

    Contiene el archivo original (CSV o JSON) desde el cual se generan los puntos de entrega.
    """
    route = models.OneToOneField(
        Route,
        on_delete=models.CASCADE,
        related_name="input_file"
    )

    file = models.FileField(upload_to="routes/")
    
    file_type = models.CharField(
        max_length=10,
        choices=FileType.choices
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)
    
class DeliveryPoint(models.Model):
    """
    Punto individual de entrega dentro de una ruta.

    Cada instancia representa una ubicación geográfica que debe ser visitada durante la ejecución de la ruta.
    """
    route = models.ForeignKey(
        Route,
        on_delete=models.CASCADE,
        related_name="delivery_points"
    )

    address = models.CharField(max_length=255)

    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    sequence_order = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.address} ({self.route_id})"

class RouteSolution(models.Model):
    """
    Resultado de la optimización de una ruta.

    Almacena métricas agregadas como distancia total y permite
    mantener múltiples soluciones para una misma ruta.
    """
    route = models.ForeignKey(
        Route,
        on_delete=models.CASCADE,
        related_name="solutions"
    )

    total_distance = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

class RouteSolutionDetail(models.Model):
    """
    Detalle de una solución de ruta.

    Define el orden en que deben visitarse los puntos de entrega
    para una solución específica.
    """
    solution = models.ForeignKey(
        RouteSolution,
        on_delete=models.CASCADE,
        related_name="details"
    )

    delivery_point = models.ForeignKey(
        DeliveryPoint,
        on_delete=models.CASCADE
    )

    order_index = models.IntegerField()