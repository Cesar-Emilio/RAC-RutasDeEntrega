"""
Tests para la app Users.
Cubre creación de usuarios, autenticación y restricciones de rol/empresa.
"""

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.companies.models import Company
from apps.users.models import User


class UsuarioBaseTests(TestCase):
    """Base para pruebas de usuarios con autenticación JWT."""

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(
            name='Empresa de Prueba',
            email='empresa@test.com',
            rfc='TEST123456789'
        )
        cls.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='admin123',
            name='Admin',
            role='admin'
        )
        cls.company_user = User.objects.create_user(
            email='usuario@test.com',
            password='secret123',
            name='Usuario de Prueba',
            role='company',
            company=cls.company
        )

    def setUp(self):
        self.client = APIClient()

    def authenticate(self, email, password):
        url = reverse('auth-login')
        response = self.client.post(url, {'email': email, 'password': password}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        access = response.data['data']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')


class UsuarioCreacionTests(UsuarioBaseTests):
    """Pruebas de creación y validación de usuarios."""

    def test_crea_usuario_valido(self):
        """POST /api/users/register/ debe crear un usuario válido."""
        self.authenticate(self.admin_user.email, 'admin123')
        url = reverse('register')
        data = {
            'email': 'nuevo@test.com',
            'name': 'Nuevo Usuario',
            'password': 'password123',
            'role': 'company',
            'company': self.company.id
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='nuevo@test.com').exists())

    def test_falla_sin_email(self):
        """POST /api/users/register/ debe devolver 400 si falta email."""
        self.authenticate(self.admin_user.email, 'admin123')
        url = reverse('register')
        data = {
            'name': 'Usuario Sin Email',
            'password': 'password123',
            'role': 'company',
            'company': self.company.id
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_falla_sin_password(self):
        """POST /api/users/register/ debe devolver 400 si falta password."""
        self.authenticate(self.admin_user.email, 'admin123')
        url = reverse('register')
        data = {
            'email': 'usuario3@test.com',
            'name': 'Usuario Sin Password',
            'role': 'company',
            'company': self.company.id
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_falla_con_rol_invalido(self):
        """POST /api/users/register/ debe devolver 400 para rol inválido."""
        self.authenticate(self.admin_user.email, 'admin123')
        url = reverse('register')
        data = {
            'email': 'usuario4@test.com',
            'name': 'Usuario Rol Invalido',
            'password': 'password123',
            'role': 'invalid',
            'company': self.company.id
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_falla_sin_company_para_rol_company(self):
        """POST /api/users/register/ debe devolver 400 si falta company para rol company."""
        self.authenticate(self.admin_user.email, 'admin123')
        url = reverse('register')
        data = {
            'email': 'usuario2@test.com',
            'name': 'Usuario Sin Empresa',
            'password': 'password123',
            'role': 'company'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UsuarioAutenticacionTests(UsuarioBaseTests):
    """Pruebas de autenticación de usuarios."""

    def test_autenticacion_correcta(self):
        """POST /api/auth/login/ debe autenticar con credenciales válidas."""
        url = reverse('auth-login')
        data = {'email': self.company_user.email, 'password': 'secret123'}

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data['data'])
        self.assertIn('refresh', response.data['data'])
        self.assertEqual(response.data['data']['user']['email'], self.company_user.email)

    def test_autenticacion_incorrecta(self):
        """POST /api/auth/login/ debe devolver 401 para credenciales inválidas."""
        url = reverse('auth-login')
        data = {'email': self.company_user.email, 'password': 'wrongpass'}

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UsuarioModelTests(UsuarioBaseTests):
    """Pruebas de las reglas y restricciones del modelo User."""

    def test_cambia_contrasena(self):
        """set_password debe actualizar el hash de la contraseña."""
        user = User.objects.create_user(
            email='cambia@test.com',
            password='oldpass123',
            name='Usuario Cambio',
            role='company',
            company=self.company
        )

        user.set_password('newpass123')
        user.save()

        self.assertTrue(user.check_password('newpass123'))

    def test_restriccion_role_company_consistency(self):
        """full_clean debe fallar cuando rol company no tiene company."""
        user = User(
            email='inconsistent@test.com',
            name='Usuario Inconsistente',
            role='company'
        )
        user.set_password('password123')

        with self.assertRaises(ValidationError):
            user.full_clean()

    def test_usuario_company_se_crea_correctamente(self):
        """Un usuario company se puede crear cuando tiene company antes de guardarse."""
        user = User(
            email='companyuser@test.com',
            name='Usuario Empresa',
            role='company',
            company=self.company
        )
        user.set_password('company123')
        user.save()

        self.assertIsNotNone(user.id)
        self.assertEqual(user.company, self.company)
