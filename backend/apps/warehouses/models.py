from django.db import models
from django.db.models import Q
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from apps.companies.models import Company

MEXICAN_STATES = [
    ('Aguascalientes', 'Aguascalientes'),
    ('Baja California', 'Baja California'),
    ('Baja California Sur', 'Baja California Sur'),
    ('Campeche', 'Campeche'),
    ('Chiapas', 'Chiapas'),
    ('Chihuahua', 'Chihuahua'),
    ('Ciudad de México', 'Ciudad de México'),
    ('Coahuila', 'Coahuila'),
    ('Colima', 'Colima'),
    ('Durango', 'Durango'),
    ('Guanajuato', 'Guanajuato'),
    ('Guerrero', 'Guerrero'),
    ('Hidalgo', 'Hidalgo'),
    ('Jalisco', 'Jalisco'),
    ('México', 'México'),
    ('Michoacán', 'Michoacán'),
    ('Morelos', 'Morelos'),
    ('Nayarit', 'Nayarit'),
    ('Nuevo León', 'Nuevo León'),
    ('Oaxaca', 'Oaxaca'),
    ('Puebla', 'Puebla'),
    ('Querétaro', 'Querétaro'),
    ('Quintana Roo', 'Quintana Roo'),
    ('San Luis Potosí', 'San Luis Potosí'),
    ('Sinaloa', 'Sinaloa'),
    ('Sonora', 'Sonora'),
    ('Tabasco', 'Tabasco'),
    ('Tamaulipas', 'Tamaulipas'),
    ('Tlaxcala', 'Tlaxcala'),
    ('Veracruz', 'Veracruz'),
    ('Yucatán', 'Yucatán'),
    ('Zacatecas', 'Zacatecas'),
]


class Warehouse(models.Model):
    """
    Modelo que representa un almacén físico asociado a una empresa.

    Almacena la ubicación del almacén mediante dirección postal y/o coordenadas
    geográficas. Todos los almacenes están restringidos al territorio mexicano,
    tanto a nivel de validación como de constraints en base de datos.

    Attributes:
        company (ForeignKey): Empresa propietaria del almacén.
        name (CharField): Nombre del almacén.
        address (CharField): Dirección física del almacén.
        city (CharField): Ciudad donde se ubica.
        state (CharField): Estado de la república mexicana.
        country (CharField): País, siempre 'México', no editable.
        postal_code (CharField): Código postal de 5 dígitos.
        latitude (DecimalField): Latitud geográfica dentro del rango del territorio mexicano.
        longitude (DecimalField): Longitud geográfica dentro del rango del territorio mexicano.
        active (BooleanField): Indica si el almacén está activo (borrado lógico).
        created_at (DateTimeField): Fecha y hora de creación, asignada automáticamente.
        updated_at (DateTimeField): Fecha y hora de última actualización, asignada automáticamente.
    """
    postal_code_validator = RegexValidator(
        regex=r'^\d{5}$',
        message='El código postal debe contener exactamente 5 dígitos numéricos'
    )
    name_validator = RegexValidator(
        regex=r'^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s\-\.\,\#]{2,255}$',
        message='El nombre solo puede contener letras, números y los caracteres: - . , # y debe tener entre 2 y 255 caracteres'
    )
    address_validator = RegexValidator(
        regex=r'^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s\-\.\,\#\/]{5,255}$',
        message='La dirección solo puede contener letras, números y los caracteres: - . , # / y debe tener entre 5 y 255 caracteres'
    )
    city_state_validator = RegexValidator(
        regex=r'^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\-\.]{2,100}$',
        message='El campo solo puede contener letras y debe tener entre 2 y 100 caracteres'
    )

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='warehouses'
    )
    name = models.CharField(
        max_length=255,
        validators=[name_validator]
    )
    address = models.CharField(
        max_length=255,
        validators=[address_validator]
    )
    city = models.CharField(
        max_length=100,
        validators=[city_state_validator]
    )
    state = models.CharField(
        max_length=50,
        choices=MEXICAN_STATES
    )
    country = models.CharField(
        max_length=50,
        default='México',
        editable=False
    )
    postal_code = models.CharField(
        max_length=5,
        validators=[postal_code_validator]
    )

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[
            MinValueValidator(14.500000, message='Latitud fuera del territorio mexicano'),
            MaxValueValidator(32.700000, message='Latitud fuera del territorio mexicano')
        ]
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[
            MinValueValidator(-118.400000, message='Longitud fuera del territorio mexicano'),
            MaxValueValidator(-86.700000, message='Longitud fuera del territorio mexicano')
        ]
    )
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        """
        Retorna una representación legible del almacén.

        Returns:
            str: Cadena con formato 'Nombre - Ciudad, Estado'.
        """
        return f"{self.name} - {self.city}, {self.state}"

    def clean(self):
        """
        Validaciones a nivel de modelo ejecutadas antes de guardar.

        Verifica que la ubicación sea consistente: si se proporcionan coordenadas,
        ambas (latitud y longitud) deben estar presentes. También verifica que
        exista al menos una forma de ubicación (dirección completa o coordenadas).

        Raises:
            ValidationError: Si la combinación de campos de ubicación es inválida.
        """
        from django.core.exceptions import ValidationError

        has_address = all([self.address, self.city, self.state, self.postal_code])
        has_coords = self.latitude is not None and self.longitude is not None

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(country='México'),
                name='warehouse_country_mexico'
            ),
            models.CheckConstraint(
                condition=Q(state__in=[state[0] for state in MEXICAN_STATES]),
                name='warehouse_state_valid'
            ),
            models.CheckConstraint(
                condition=(
                    Q(latitude__isnull=True, longitude__isnull=True) |
                    Q(latitude__isnull=False, longitude__isnull=False)
                ),
                name='warehouse_coordinates_complete'
            ),
            models.CheckConstraint(
                condition=Q(latitude__isnull=True) | Q(latitude__gte=14.500000),
                name='warehouse_latitude_min'
            ),
            models.CheckConstraint(
                condition=Q(latitude__isnull=True) | Q(latitude__lte=32.700000),
                name='warehouse_latitude_max'
            ),
            models.CheckConstraint(
                condition=Q(longitude__isnull=True) | Q(longitude__gte=-118.400000),
                name='warehouse_longitude_min'
            ),
            models.CheckConstraint(
                condition=Q(longitude__isnull=True) | Q(longitude__lte=-86.700000),
                name='warehouse_longitude_max'
            ),
        ]