"""Tests para la app Warehouses."""
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.companies.models import Company
from apps.users.models import User
from apps.warehouses.models import Warehouse


class WarehouseBaseTests(TestCase):
    """Base para pruebas de almacenes con autenticación JWT."""

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(
            name='Empresa de Prueba',
            email='empresa@test.com',
            rfc='TEST123456789'
        )
        cls.other_company = Company.objects.create(
            name='Otra Empresa',
            email='otra@test.com',
            rfc='OTRA123456789'
        )
        cls.company_user = User.objects.create_user(
            email='company@test.com',
            password='company123',
            name='Usuario Company',
            role='company',
            company=cls.company
        )
        cls.other_company_user = User.objects.create_user(
            email='other@test.com',
            password='other123',
            name='Usuario Otro',
            role='company',
            company=cls.other_company
        )
        cls.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='admin123',
            name='Admin',
            role='admin'
        )
        cls.active_warehouse = Warehouse.objects.create(
            name='Almacén Central',
            address='Calle Falsa 123',
            postal_code='45000',
            city='Zapopan',
            state='Jalisco',
            latitude=20.6597,
            longitude=-103.3496,
            company=cls.company
        )
        cls.other_warehouse = Warehouse.objects.create(
            name='Almacén Frente',
            address='Calle Otra 456',
            postal_code='45010',
            city='Zapopan',
            state='Jalisco',
            latitude=20.6597,
            longitude=-103.3496,
            company=cls.other_company
        )

    def setUp(self):
        self.client = APIClient()

    def get_token(self, email, password):
        """Obtiene token JWT haciendo login. Usar con moderación para evitar rate limit."""
        client = APIClient()
        response = client.post(
            reverse('auth-login'),
            {'email': email, 'password': password},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.data['data']['access']

    def authenticate(self, email, password):
        token = self.get_token(email, password)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')


class WarehouseEndpointTests(WarehouseBaseTests):
    """Pruebas de los endpoints de almacenes."""

    # Token compartido para todos los tests de esta clase, evita múltiples logins
    _company_token = None
    _other_token = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Login único por clase para no disparar rate limit
        client = APIClient()
        response = client.post(
            reverse('auth-login'),
            {'email': 'company@test.com', 'password': 'company123'},
            format='json'
        )
        cls._company_token = response.data['data']['access']

        response = client.post(
            reverse('auth-login'),
            {'email': 'other@test.com', 'password': 'other123'},
            format='json'
        )
        cls._other_token = response.data['data']['access']

    def setUp(self):
        super().setUp()
        # Por defecto autenticado como company_user
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self._company_token}')

    def authenticate_as_other(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self._other_token}')

    def test_get_warehouses(self):
        """GET /api/warehouses/ debe listar solo almacenes activos de la empresa."""
        url = reverse('warehouse-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Soporta tanto respuesta paginada como lista directa
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['name'], self.active_warehouse.name)

    def test_create_warehouse_valido(self):
        """POST /api/warehouses/ debe crear un almacén válido con company del usuario."""
        url = reverse('warehouse-list')
        data = {
            'name': 'Nuevo Almacén',
            'address': 'Nueva Calle 456',
            'postal_code': '54321',
            'city': 'Nueva Ciudad',
            'state': 'Jalisco',
            'latitude': 19.4326,
            'longitude': -99.1332
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Warehouse.objects.filter(name='Nuevo Almacén', company=self.company).exists()
        )

    def test_patch_warehouse_parcial(self):
        """PATCH /api/warehouses/{id}/ debe actualizar un almacén existente."""
        url = reverse('warehouse-detail', kwargs={'pk': self.active_warehouse.id})
        response = self.client.patch(url, {'name': 'Almacén Central Editado'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.active_warehouse.refresh_from_db()
        self.assertEqual(self.active_warehouse.name, 'Almacén Central Editado')

    def test_usuario_sin_permisos_no_puede_editar_almacen_ajeno(self):
        """PATCH /api/warehouses/{id}/ de otra compañía debe devolver 404."""
        self.authenticate_as_other()
        url = reverse('warehouse-detail', kwargs={'pk': self.active_warehouse.id})
        response = self.client.patch(url, {'name': 'Intento Editar'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_usuario_no_autenticado_no_puede_crear_almacen(self):
        """POST /api/warehouses/ sin autenticación debe devolver 401."""
        self.client.credentials()  # limpia credenciales
        url = reverse('warehouse-list')
        response = self.client.post(url, {
            'name': 'Sin Auth',
            'address': 'Calle 1',
            'postal_code': '54321',
            'city': 'Ciudad',
            'state': 'Jalisco',
            'latitude': 19.4326,
            'longitude': -99.1332
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class WarehouseModelTests(TestCase):
    """Pruebas de las restricciones y lógica del modelo Warehouse."""

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(
            name='Empresa de Prueba',
            email='empresa@test.com',
            rfc='TEST123456789'
        )

    def test_warehouse_sin_company_lanza_error(self):
        """full_clean debe fallar si un warehouse no tiene company."""
        warehouse = Warehouse(
            name='Almacén Demo',
            address='Av. Demo 100',
            postal_code='45000',
            city='Zapopan',
            state='Jalisco',
            latitude=20.6597,
            longitude=-103.3496
        )
        with self.assertRaises(ValidationError):
            warehouse.full_clean()

    def test_coordinates_must_be_complete(self):
        """clean() debe fallar cuando falta latitud o longitud."""
        warehouse = Warehouse(
            name='Almacén Demo 2',
            address='Av. Demo 200',
            postal_code='45000',
            city='Zapopan',
            state='Jalisco',
            latitude=20.6597,
            longitude=None,
            company=self.company
        )
        with self.assertRaises(ValidationError):
            warehouse.clean()

    def test_location_requires_address_or_coordinates(self):
        """clean() debe fallar si no hay dirección completa ni coordenadas."""
        warehouse = Warehouse(
            name='Almacén Demo 3',
            address='',
            postal_code='',
            city='',
            state='Jalisco',
            latitude=None,
            longitude=None,
            company=self.company
        )
        with self.assertRaises(ValidationError):
            warehouse.clean()