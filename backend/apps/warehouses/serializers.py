from rest_framework import serializers
from .models import Warehouse


class WarehouseSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Warehouse.

    Gestiona la validación, normalización y persistencia de datos de almacenes.
    Los campos `id`, `company`, `country`, `created_at` y `updated_at` son de solo lectura.

    Validaciones aplicadas:
        - name: Normalizado a title case sin espacios extremos.
        - address: Saneado de espacios extremos.
        - city: Normalizado a title case sin espacios extremos.
        - postal_code: Exactamente 5 dígitos numéricos.
        - Ubicación: Requiere dirección completa o coordenadas (latitud + longitud juntas).
    """

    class Meta:
        model = Warehouse
        fields = "__all__"
        read_only_fields = ['id', 'company', 'country', 'created_at', 'updated_at']

    def validate_name(self, value):
        """
        Normaliza el nombre del almacén eliminando espacios extremos y aplicando title case.

        Args:
            value (str): Valor del campo `name` recibido en la solicitud.

        Returns:
            str: Nombre normalizado.
        """
        return value.strip().title()

    def validate_address(self, value):
        """
        Sanitiza la dirección eliminando espacios extremos.

        Args:
            value (str): Valor del campo `address` recibido en la solicitud.

        Returns:
            str: Dirección sin espacios al inicio ni al final.
        """
        return value.strip()

    def validate_city(self, value):
        """
        Normaliza el nombre de la ciudad eliminando espacios extremos y aplicando title case.

        Args:
            value (str): Valor del campo `city` recibido en la solicitud.

        Returns:
            str: Ciudad normalizada.
        """
        return value.strip().title()

    def validate_postal_code(self, value):
        """
        Valida que el código postal sea exactamente 5 dígitos numéricos.

        Args:
            value (str): Valor del campo `postal_code` recibido en la solicitud.

        Returns:
            str: Código postal validado y sin espacios extremos.

        Raises:
            ValidationError: Si el valor no es numérico o no tiene exactamente 5 dígitos.
        """
        value = value.strip()
        if not value.isdigit() or len(value) != 5:
            raise serializers.ValidationError('El código postal debe contener exactamente 5 dígitos numéricos.')
        return value

    def validate(self, data):
        """
        Validación transversal de campos de ubicación.

        En solicitudes PATCH (parciales) se omite esta validación para permitir
        actualizaciones de campos individuales sin exigir la ubicación completa.

        Reglas:
            - En POST/PUT: debe existir dirección completa (address, city, state, postal_code)
              o coordenadas completas (latitude y longitude). Al menos una de las dos.
            - Latitud y longitud deben proporcionarse siempre juntas; no se acepta solo una.

        Args:
            data (dict): Datos ya validados campo a campo por el serializer.

        Returns:
            dict: Los mismos datos si pasan todas las validaciones.

        Raises:
            ValidationError: Si no se proporciona ninguna ubicación válida,
                             o si se envía solo latitud o solo longitud.
        """
        if self.partial:
            return data

        has_address = all([
            data.get('address'),
            data.get('city'),
            data.get('state'),
            data.get('postal_code')
        ])
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        has_coords = latitude is not None and longitude is not None

        if not has_address and not has_coords:
            raise serializers.ValidationError(
                'Debes proporcionar al menos una ubicación: dirección completa o coordenadas (latitud y longitud).'
            )

        if (latitude is None) != (longitude is None):
            raise serializers.ValidationError(
                'Latitud y longitud deben proporcionarse juntas.'
            )

        return data

    def create(self, validated_data):
        """
        Crea un nuevo almacén asignando explícitamente el país como 'México'.

        Args:
            validated_data (dict): Datos validados listos para persistir.

        Returns:
            Warehouse: Instancia del almacén recién creado.
        """
        validated_data['country'] = 'México'
        warehouse = Warehouse.objects.create(**validated_data)
        return warehouse

    def update(self, instance, validated_data):
        """
        Actualiza una instancia existente de Warehouse con los datos proporcionados.

        El campo `country` es ignorado aunque se incluya en el payload,
        ya que no es editable por diseño.

        Args:
            instance (Warehouse): Instancia del almacén a actualizar.
            validated_data (dict): Datos validados con los campos a modificar.

        Returns:
            Warehouse: Instancia del almacén actualizada y guardada.
        """
        validated_data.pop('country', None)

        instance.name = validated_data.get('name', instance.name)
        instance.address = validated_data.get('address', instance.address)
        instance.city = validated_data.get('city', instance.city)
        instance.state = validated_data.get('state', instance.state)
        instance.postal_code = validated_data.get('postal_code', instance.postal_code)
        instance.latitude = validated_data.get('latitude', instance.latitude)
        instance.longitude = validated_data.get('longitude', instance.longitude)
        instance.active = validated_data.get('active', instance.active)
        instance.save()
        return instance