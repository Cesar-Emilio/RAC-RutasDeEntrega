from django.test import TestCase
from django.contrib.contenttypes.models import ContentType


class AuditLogTests(TestCase):
    """Pruebas CRUD para el modelo AuditLog."""

    def setUp(self):
        from apps.audit.models import AuditLog, AuditAction
        from apps.companies.models import Company
        from apps.users.models import User
        self.AuditLog = AuditLog
        self.AuditAction = AuditAction
        self.company = Company.objects.create(
            name="Empresa Test",
            email="empresa@test.com",
            rfc="XAXX010101000"
        )
        self.user = User.objects.create_user(
            email="user@test.com",
            password="pass",
            name="Test User",
            role="admin"
        )
        self.content_type = ContentType.objects.get_for_model(Company)

    def test_create_audit_log(self):
        """Prueba la creación de un registro de auditoría."""
        audit = self.AuditLog.objects.create(
            user=self.user,
            ip_address="192.168.1.1",
            method="POST",
            endpoint="/api/companies/",
            action=self.AuditAction.CREATE,
            content_type=self.content_type,
            object_id=str(self.company.pk),
            object_repr=str(self.company),
            before=None,
            after={"name": "Empresa Test"}
        )
        self.assertEqual(audit.action, self.AuditAction.CREATE)
        self.assertEqual(audit.action, AuditAction.CREATE)
        self.assertEqual(audit.object_repr, str(self.company))
        self.assertIsNotNone(audit.timestamp)

    def test_create_audit_log_without_user(self):
        """Prueba la creación de un registro sin usuario (anónimo)."""
        audit = self.AuditLog.objects.create(
            ip_address="192.168.1.1",
            method="GET",
            endpoint="/api/companies/",
            action=self.AuditAction.READ,
            content_type=self.content_type,
            object_id=str(self.company.pk),
            object_repr=str(self.company),
            before=None,
            after=None
        )
        self.assertEqual(audit.action, self.AuditAction.READ)
        self.assertEqual(audit.action, AuditAction.READ)

    def test_read_audit_log(self):
        """Prueba la lectura de registros de auditoría."""
        audit = self.AuditLog.objects.create(
            user=self.user,
            action=self.AuditAction.UPDATE,
            content_type=self.content_type,
            object_id=str(self.company.pk),
            object_repr=str(self.company),
            before={"name": "Old Name"},
            after={"name": "New Name"}
        )
        retrieved = self.AuditLog.objects.get(pk=audit.pk)
        self.assertEqual(retrieved.action, self.AuditAction.UPDATE)
        self.assertEqual(retrieved.before, {"name": "Old Name"})

    def test_update_audit_log(self):
        """Prueba la actualización de un registro de auditoría (aunque rara)."""
        audit = self.AuditLog.objects.create(
            user=self.user,
            action=self.AuditAction.CREATE,
            content_type=self.content_type,
            object_id=str(self.company.pk),
            object_repr=str(self.company)
        )
        audit.endpoint = "/updated/endpoint/"
        audit.save()
        audit.refresh_from_db()
        self.assertEqual(audit.endpoint, "/updated/endpoint/")

    def test_delete_audit_log(self):
        """Prueba la eliminación de un registro de auditoría."""
        audit = self.AuditLog.objects.create(
            user=self.user,
            action=self.AuditAction.DELETE,
            content_type=self.content_type,
            object_id=str(self.company.pk),
            object_repr=str(self.company)
        )
        pk = audit.pk
        audit.delete()
        with self.assertRaises(self.AuditLog.DoesNotExist):
            self.AuditLog.objects.get(pk=pk)

    def test_audit_log_str(self):
        """Prueba el método __str__."""
        audit = self.AuditLog.objects.create(
            user=self.user,
            action=AuditAction.CREATE,
            content_type=self.content_type,
            object_id=str(self.company.pk),
            object_repr=str(self.company)
        )
        expected = f"[{audit.timestamp:%Y-%m-%d %H:%M:%S}] create — {str(self.company)}"
        self.assertEqual(str(audit), expected)

    def test_audit_log_ordering(self):
        """Prueba el ordering por timestamp descendente."""
        audit1 = self.AuditLog.objects.create(
            action=self.AuditAction.CREATE,
            content_type=self.content_type,
            object_id=str(self.company.pk),
            object_repr="Audit 1"
        )
        audit2 = self.AuditLog.objects.create(
            action=self.AuditAction.UPDATE,
            content_type=self.content_type,
            object_id=str(self.company.pk),
            object_repr="Audit 2"
        )
        audits = list(self.AuditLog.objects.all())
        self.assertEqual(audits[0], audit2)  # Más reciente primero
        self.assertEqual(audits[1], audit1)
