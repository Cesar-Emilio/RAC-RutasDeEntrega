from django.db import models
from django.core.validators import RegexValidator

class Company(models.Model):
    # validaciones para el RFC
    rfc_validator = RegexValidator(
        regex=r'^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$',
        message='RFC inválido'
    )

    name = models.CharField(max_length=255)
    rfc = models.CharField(max_length=13, unique=True, validators=[rfc_validator])
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.rfc})"
    
    # class Meta:
    #     ordering = ['-created_at']