"""
Tests para la app Companies.
Cubre creación, validaciones y endpoints CRUD de compañías.
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.companies.models import Company
from apps.users.models import User


class CompanyEndpointTests(TestCase):
    """Pruebas de los endpoints de compañía."""

    @classmethod
    def setUpTestData(cls):
        cls.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='admin123',
            name='Admin',
            role='admin'
        )
        cls.company = Company.objects.create(
            name='Empresa de Prueba',
            email='empresa@test.com',
            rfc='TEST123456789'
        )

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Login único para toda la clase, evita rate limit por múltiples logins
        client = APIClient()
        response = client.post(
            reverse('auth-login'),
            {'email': 'admin@test.com', 'password': 'admin123'},
            format='json'
        )
        cls._admin_token = response.data['data']['access']

    def setUp(self):
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self._admin_token}')

    def test_get_companies(self):
        """GET /api/companies/ debe listar compañías activas."""
        url = reverse('company-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertTrue(any(item['id'] == self.company.id for item in data))

    def test_create_company_valida(self):
        """POST /api/companies/ debe crear una compañía válida."""
        url = reverse('company-list')
        data = {
            'name': 'Nueva Compañía',
            'email': 'nueva@test.com',
            'rfc': 'TEST987654321'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Company.objects.filter(email='nueva@test.com').exists())

    def test_create_company_requiere_nombre(self):
        """POST /api/companies/ debe devolver 400 si falta nombre."""
        url = reverse('company-list')
        data = {
            'email': 'sinname@test.com',
            'rfc': 'TEST111222333'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_company_requiere_email(self):
        """POST /api/companies/ debe devolver 400 si falta email."""
        url = reverse('company-list')
        data = {
            'name': 'Compañía Sin Email',
            'rfc': 'TEST222333444'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_company_duplicada_falla(self):
        """POST /api/companies/ debe devolver 400 cuando la compañía ya existe."""
        url = reverse('company-list')
        data = {
            'name': 'Empresa de Prueba',
            'email': 'empresa@test.com',
            'rfc': 'TEST123456789'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_company_parcial(self):
        """PATCH /api/companies/{id}/ debe actualizar campos parciales."""
        url = reverse('company-detail', kwargs={'pk': self.company.id})
        data = {'name': 'Empresa Editada'}

        response = self.client.patch(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.company.refresh_from_db()
        self.assertEqual(self.company.name, 'Empresa Editada')

    def test_delete_company(self):
        """DELETE /api/companies/{id}/ debe eliminar la compañía existente."""
        url = reverse('company-detail', kwargs={'pk': self.company.id})

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Company.objects.filter(pk=self.company.id).exists())