from django.core.validators import RegexValidator
from django.db import models

class Company(models.Model):
    """
    Modelo para representar una empresa. Este modelo incluye el nombre de la empresa, su correo electrónico,
    su RFC y las fechas de creación y última actualización.

    Attributes:
        name (str): Nombre de la empresa.
        email (str): Correo electrónico único de la empresa.
        rfc (str): RFC único de la empresa, validado con una expresión regular.
        created_at (datetime): Fecha y hora en que se creó la empresa.
        updated_at (datetime): Fecha y hora de la última actualización de la empresa.
    
    Methods:
        __str__: Retorna el nombre de la empresa como representación en cadena del objeto.
    """

    rfc_validator = RegexValidator(
        regex=r'^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$',
        message='RFC inválido'
    )

    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    rfc = models.CharField(max_length=13, unique=True, validators=[rfc_validator])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        """
        Representación en cadena del modelo Company.

        Returns:
            str: El nombre de la empresa.
        """
        return self.name