from rest_framework import serializers
from .models import Warehouse


class WarehouseSerializer(serializers.ModelSerializer):

    class Meta:
        model = Warehouse
        fields = "__all__"
        # CAMBIO: 'company' se agrega a read_only_fields porque se inyecta automáticamente
        # desde request.user.company en perform_create/perform_update del ViewSet
        read_only_fields = ['id', 'company', 'country', 'created_at', 'updated_at']

    def validate_name(self, value):
        return value.strip().title()

    def validate_address(self, value):
        return value.strip()

    def validate_city(self, value):
        return value.strip().title()

    def validate_postal_code(self, value):
        value = value.strip()
        if not value.isdigit() or len(value) != 5:
            raise serializers.ValidationError('El código postal debe contener exactamente 5 dígitos numéricos.')
        return value

    def validate(self, data):
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
        validated_data['country'] = 'México'
        warehouse = Warehouse.objects.create(**validated_data)
        return warehouse

    def update(self, instance, validated_data):
        # country no es editable, se ignora si alguien lo manda
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