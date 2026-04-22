from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import authenticate


class UserTests(TestCase):
    """Pruebas CRUD para el modelo User."""

    def setUp(self):
        from apps.companies.models import Company
        from apps.users.models import User
        self.User = User
        self.company = Company.objects.create(
            name="Empresa Test",
            email="empresa@test.com",
            rfc="XAXX010101000"
        )

    def test_create_admin_user(self):
        """Prueba la creación de un usuario admin."""
        user = self.User.objects.create_user(
            email="admin@test.com",
            password="password123",
            name="Admin User",
            role="admin"
        )
        self.assertEqual(user.email, "admin@test.com")
        self.assertEqual(user.name, "Admin User")
        self.assertEqual(user.role, "admin")
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertIsNone(user.company)

    def test_create_company_user(self):
        """Prueba la creación de un usuario company."""
        user = self.User.objects.create_user(
            email="company@test.com",
            password="password123",
            name="Company User",
            role="company",
            company=self.company
        )
        self.assertEqual(user.email, "company@test.com")
        self.assertEqual(user.role, "company")
        self.assertEqual(user.company, self.company)

    def test_create_company_user_without_company_fails(self):
        """Prueba que un usuario company sin empresa falle."""
        with self.assertRaises(ValidationError):
            user = self.User(
                email="fail@test.com",
                name="Fail User",
                role="company"
            )
            user.full_clean()

    def test_read_user(self):
        """Prueba la lectura de usuarios."""
        user = self.User.objects.create_user(
            email="read@test.com",
            password="password123",
            name="Read User",
            role="admin"
        )
        retrieved = self.User.objects.get(pk=user.pk)
        self.assertEqual(retrieved.email, "read@test.com")

    def test_update_user(self):
        """Prueba la actualización de un usuario."""
        user = self.User.objects.create_user(
            email="update@test.com",
            password="password123",
            name="Update User",
            role="admin"
        )
        user.name = "Updated Name"
        user.save()
        user.refresh_from_db()
        self.assertEqual(user.name, "Updated Name")

    def test_delete_user(self):
        """Prueba la eliminación de un usuario."""
        user = self.User.objects.create_user(
            email="delete@test.com",
            password="password123",
            name="Delete User",
            role="admin"
        )
        pk = user.pk
        user.delete()
        with self.assertRaises(self.User.DoesNotExist):
            self.User.objects.get(pk=pk)

    def test_authenticate_user(self):
        """Prueba la autenticación de usuario."""
        user = self.User.objects.create_user(
            email="auth@test.com",
            password="password123",
            name="Auth User",
            role="admin"
        )
        authenticated = authenticate(email="auth@test.com", password="password123")
        self.assertEqual(authenticated, user)

    def test_unique_email(self):
        """Prueba que el email sea único."""
        self.User.objects.create_user(
            email="unique@test.com",
            password="pass",
            name="User 1",
            role="admin"
        )
        with self.assertRaises(Exception):  # IntegrityError
            self.User.objects.create_user(
                email="unique@test.com",
                password="pass",
                name="User 2",
                role="admin"
            )

    def test_email_lowercased_on_save(self):
        """Prueba que el email se guarde en minúsculas."""
        user = self.User.objects.create_user(
            email="UPPER@TEST.COM",
            password="pass",
            name="Upper User",
            role="admin"
        )
        self.assertEqual(user.email, "upper@test.com")
