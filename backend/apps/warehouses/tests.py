from django.test import TestCase
from django.core.exceptions import ValidationError
from decimal import Decimal


class WarehouseTests(TestCase):
    """Pruebas CRUD para el modelo Warehouse."""

    def setUp(self):
        from apps.companies.models import Company
        from apps.warehouses.models import Warehouse
        self.Warehouse = Warehouse
        self.company = Company.objects.create(
            name="Empresa Test",
            email="empresa@test.com",
            rfc="XAXX010101000"
        )

    def test_create_warehouse(self):
        """Prueba la creación de un almacén válido."""
        warehouse = self.Warehouse.objects.create(
            company=self.company,
            name="Almacén Central",
            address="Calle Falsa 123",
            city="Cuernavaca",
            state="Morelos",
            postal_code="62000",
            latitude=Decimal("18.920000"),
            longitude=Decimal("-99.230000")
        )
        self.assertEqual(warehouse.name, "Almacén Central")
        self.assertEqual(warehouse.company, self.company)
        self.assertEqual(warehouse.city, "Cuernavaca")
        self.assertEqual(warehouse.state, "Morelos")
        self.assertEqual(warehouse.postal_code, "62000")
        self.assertEqual(warehouse.latitude, Decimal("18.920000"))
        self.assertEqual(warehouse.longitude, Decimal("-99.230000"))

    def test_create_warehouse_invalid_postal_code(self):
        """Prueba que un código postal inválido lance ValidationError."""
        with self.assertRaises(ValidationError):
            warehouse = self.Warehouse(
                company=self.company,
                name="Almacén Test",
                address="Calle Falsa 123",
                city="Cuernavaca",
                state="Morelos",
                postal_code="123",  # inválido, menos de 5 dígitos
                latitude=Decimal("18.920000"),
                longitude=Decimal("-99.230000")
            )
            warehouse.full_clean()

    def test_create_warehouse_invalid_latitude(self):
        """Prueba que una latitud fuera de México lance ValidationError."""
        with self.assertRaises(ValidationError):
            warehouse = self.Warehouse(
                company=self.company,
                name="Almacén Test",
                address="Calle Falsa 123",
                city="Cuernavaca",
                state="Morelos",
                postal_code="62000",
                latitude=Decimal("10.000000"),  # fuera de rango
                longitude=Decimal("-99.230000")
            )
            warehouse.full_clean()

    def test_read_warehouse(self):
        """Prueba la lectura de almacenes."""
        warehouse = self.Warehouse.objects.create(
            company=self.company,
            name="Almacén Test",
            address="Calle Falsa 123",
            city="Cuernavaca",
            state="Morelos",
            postal_code="62000",
            latitude=Decimal("18.920000"),
            longitude=Decimal("-99.230000")
        )
        retrieved = self.Warehouse.objects.get(pk=warehouse.pk)
        self.assertEqual(retrieved.name, "Almacén Test")

    def test_update_warehouse(self):
        """Prueba la actualización de un almacén."""
        warehouse = self.Warehouse.objects.create(
            company=self.company,
            name="Almacén Test",
            address="Calle Falsa 123",
            city="Cuernavaca",
            state="Morelos",
            postal_code="62000",
            latitude=Decimal("18.920000"),
            longitude=Decimal("-99.230000")
        )
        warehouse.name = "Almacén Actualizado"
        warehouse.save()
        warehouse.refresh_from_db()
        self.assertEqual(warehouse.name, "Almacén Actualizado")

    def test_delete_warehouse(self):
        """Prueba la eliminación de un almacén."""
        warehouse = self.Warehouse.objects.create(
            company=self.company,
            name="Almacén Test",
            address="Calle Falsa 123",
            city="Cuernavaca",
            state="Morelos",
            postal_code="62000",
            latitude=Decimal("18.920000"),
            longitude=Decimal("-99.230000")
        )
        pk = warehouse.pk
        warehouse.delete()
        with self.assertRaises(self.Warehouse.DoesNotExist):
            self.Warehouse.objects.get(pk=pk)

    def test_warehouse_related_to_company(self):
        """Prueba la relación con Company."""
        warehouse = self.Warehouse.objects.create(
            company=self.company,
            name="Almacén Test",
            address="Calle Falsa 123",
            city="Cuernavaca",
            state="Morelos",
            postal_code="62000",
            latitude=Decimal("18.920000"),
            longitude=Decimal("-99.230000")
        )
        self.assertEqual(warehouse.company.name, "Empresa Test")
        self.assertIn(warehouse, self.company.warehouses.all())
