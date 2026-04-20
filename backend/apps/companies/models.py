from django.core.validators import RegexValidator
from django.db import models


class Company(models.Model):
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
        return self.name
