from django.db import migrations, models
from django.db.models import Q


def deactivate_invalid_company_users(apps, schema_editor):
    User = apps.get_model('users', 'User')
    User.objects.filter(role='company', company__isnull=True, is_active=True).update(is_active=False)


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_alter_user_managers_alter_user_groups_and_more'),
    ]

    operations = [
        migrations.RunPython(deactivate_invalid_company_users, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name='user',
            constraint=models.CheckConstraint(
                condition=Q(is_active=False) | Q(role='admin') | Q(company__isnull=False),
                name='user_role_company_requires_company',
            ),
        ),
    ]