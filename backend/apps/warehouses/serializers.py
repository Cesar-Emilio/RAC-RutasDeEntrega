from rest_framework import serializers
from .models import Warehouse

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = "__all__"
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
            raise serializers.ValidationError(
                'El código postal debe contener exactamente 5 dígitos numéricos.'
            )
        return value

    def validate(self, data):
        # En PATCH, los campos no enviados se toman de la instancia existente
        instance = self.instance
        
        address = data.get('address', getattr(instance, 'address', None))
        city = data.get('city', getattr(instance, 'city', None))
        state = data.get('state', getattr(instance, 'state', None))
        postal_code = data.get('postal_code', getattr(instance, 'postal_code', None))
        latitude = data.get('latitude', getattr(instance, 'latitude', None))
        longitude = data.get('longitude', getattr(instance, 'longitude', None))

        has_address = all([address, city, state, postal_code])
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
        return Warehouse.objects.create(**validated_data)

    def update(self, instance, validated_data):
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