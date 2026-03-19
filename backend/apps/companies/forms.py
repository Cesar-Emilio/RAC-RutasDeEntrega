from django import forms
from .models import Company
from django.core.exceptions import ValidationError
import re

class CompanyForm(forms.ModelForm):
    class Meta:
        model = Company
        fields = ['name', 'rfc']

        labels= {
            'name': 'Nombre de la empresa',
            'rfc': 'RFC',
        }

        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ingrese el nombre de la empresa'}),
            'rfc': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ingrese el RFC'}),
        }

    def clean_name(self):
        data = self.cleaned_data['name']

        if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s\.,\-]+$', data):
            raise ValidationError("El nombre solo puede contener letras, números, espacios y signos básicos.")

        if len(data.strip()) < 2:
            raise ValidationError("El nombre es demasiado corto.")

        return data.strip()
    
    def clean_rfc(self):
        data = self.cleaned_data['rfc']

        if not re.match(r'^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$', data):
            raise ValidationError("El RFC debe tener un formato válido (3-4 letras mayúsculas seguidas de 6 dígitos y 3 caracteres alfanuméricos).")

        return data.strip()
