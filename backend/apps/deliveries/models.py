from django.db import models

class FileType(models.TextChoices):
    """
    Tipos de archivos aceptados por el sistema
    """
    
    JSON = "json", "JSON"
    CSV = "csv", "CSV"

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
    Representa una ruta de entregas asociada a una empresa y un almacén
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
    Es el archivo de entrada a procesar. Se almacena en memoria dentro de la carpeta media/routes/
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
    Representa un punto de entrega dentro del archivo de paquetes
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
    Representa el resultado de la optimización de una ruta.

    Contiene métricas agregadas como distancia total y puede tener múltiples versiones por ruta.
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
    Representa los detalles de la solución de la ruta
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