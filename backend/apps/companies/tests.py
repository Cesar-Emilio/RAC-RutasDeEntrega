from django.test import TestCase
from django.core.exceptions import ValidationError

from apps.companies.models import Company


class CompanyTests(TestCase):
    """Pruebas CRUD para el modelo Company."""

    def test_create_company(self):
        """Prueba la creación de una compañía válida."""
        company = Company.objects.create(
            name="Empresa Test",
            email="test@empresa.com",
            rfc="XAXX010101000"
        )
        self.assertEqual(company.name, "Empresa Test")
        self.assertEqual(company.email, "test@empresa.com")
        self.assertEqual(company.rfc, "XAXX010101000")
        self.assertIsNotNone(company.created_at)
        self.assertIsNotNone(company.updated_at)

    def test_create_company_invalid_rfc(self):
        """Prueba que un RFC inválido lance ValidationError."""
        with self.assertRaises(ValidationError):
            company = Company(
                name="Empresa Test",
                email="test@empresa.com",
                rfc="INVALID"
            )
            company.full_clean()  # Llama a validadores

    def test_read_company(self):
        """Prueba la lectura de compañías."""
        company = Company.objects.create(
            name="Empresa Test",
            email="test@empresa.com",
            rfc="XAXX010101000"
        )
        retrieved = Company.objects.get(pk=company.pk)
        self.assertEqual(retrieved.name, "Empresa Test")

    def test_update_company(self):
        """Prueba la actualización de una compañía."""
        company = Company.objects.create(
            name="Empresa Test",
            email="test@empresa.com",
            rfc="XAXX010101000"
        )
        company.name = "Empresa Actualizada"
        company.save()
        company.refresh_from_db()
        self.assertEqual(company.name, "Empresa Actualizada")

    def test_delete_company(self):
        """Prueba la eliminación de una compañía."""
        company = Company.objects.create(
            name="Empresa Test",
            email="test@empresa.com",
            rfc="XAXX010101000"
        )
        pk = company.pk
        company.delete()
        with self.assertRaises(Company.DoesNotExist):
            Company.objects.get(pk=pk)

    def test_unique_email(self):
        """Prueba que el email sea único."""
        Company.objects.create(
            name="Empresa 1",
            email="test@empresa.com",
            rfc="XAXX010101000"
        )
        with self.assertRaises(Exception):  # IntegrityError
            Company.objects.create(
                name="Empresa 2",
                email="test@empresa.com",
                rfc="XAXX010101001"
            )

    def test_unique_rfc(self):
        """Prueba que el RFC sea único."""
        Company.objects.create(
            name="Empresa 1",
            email="test1@empresa.com",
            rfc="XAXX010101000"
        )
        with self.assertRaises(Exception):  # IntegrityError
            Company.objects.create(
                name="Empresa 2",
                email="test2@empresa.com",
                rfc="XAXX010101000"
            )
