from django.db import models
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from apps.companies.models import Company


class Warehouse(models.Model):
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
        null=True,
        blank=True,
        validators=[
            MinValueValidator(14.500000, message='Latitud fuera del territorio mexicano'),
            MaxValueValidator(32.700000, message='Latitud fuera del territorio mexicano')
        ]
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(-118.400000, message='Longitud fuera del territorio mexicano'),
            MaxValueValidator(-86.700000, message='Longitud fuera del territorio mexicano')
        ]
    )
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.city}, {self.state}"

    def clean(self):
        from django.core.exceptions import ValidationError

        has_address = all([self.address, self.city, self.state, self.postal_code])
        has_coords = self.latitude is not None and self.longitude is not None

        if not has_address and not has_coords:
            raise ValidationError(
                'Debes proporcionar al menos una ubicación: dirección completa o coordenadas (latitud y longitud).'
            )

        if (self.latitude is None) != (self.longitude is None):
            raise ValidationError(
                'Latitud y longitud deben proporcionarse juntas.'
            )

    # class Meta:
    #     ordering = ['-created_at']