from django.core.exceptions import ValidationError
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    """
    Custom manager for the User model. Handles the creation of regular users and superusers.
    
    Methods:
        create_user: Creates and returns a regular user with an encrypted password.
        create_superuser: Creates and returns a superuser with necessary permissions.
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """
        Crea y devuelve un usuario con un correo electrónico y una contraseña encriptada.
        
        Args:
            email (str): Correo electrónico del usuario.
            password (str, optional): Contraseña del usuario.
            **extra_fields (dict): Campos adicionales para el usuario.
        
        Returns:
            User: Usuario recién creado.
        
        Raises:
            ValueError: Si el correo electrónico no es proporcionado.
        """
        if not email:
            raise ValueError('El correo electronico debe ser proporcionado')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        # encripta la contraseña
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Crea y devuelve un superusuario con los permisos necesarios.
        
        Args:
            email (str): Correo electrónico del superusuario.
            password (str, optional): Contraseña del superusuario.
            **extra_fields (dict): Campos adicionales para el superusuario.
        
        Returns:
            User: Superusuario recién creado.
        
        Raises:
            ValueError: Si los campos 'is_staff' o 'is_superuser' no son establecidos como True.
        """
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('El superusuario debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El superusuario debe tener is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    """
    Modelo de usuario personalizado que usa el correo electrónico como identificador único para la autenticación.
    Incluye campos para el rol del usuario, empresa asociada, y diversos permisos.
    
    Atributos:
        name (str): Nombre completo del usuario.
        email (str): Correo electrónico único del usuario.
        google_id (str, optional): ID único del usuario de Google.
        role (str): Rol del usuario (admin o company).
        company (ForeignKey): Referencia a la empresa asociada al usuario.
        is_active (bool): Indica si el usuario está activo.
        is_staff (bool): Indica si el usuario tiene permisos de administrador.
        created_at (datetime): Fecha de creación del usuario.
        updated_at (datetime): Fecha de última actualización del usuario.
    """
    
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('company', 'Company'),
    ]

    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True)

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='company')
    
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users'
    )
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def save(self, *args, **kwargs):
        """
        Guarda el usuario y asegura que el correo electrónico esté en minúsculas antes de almacenarlo.
        
        Args:
            *args: Argumentos adicionales para el método save.
            **kwargs: Palabras clave adicionales para el método save.
        """
        self.email = self.email.lower()
        super().save(*args, **kwargs)

    def clean(self):
        """
        Valida los datos del usuario antes de guardarlos, asegurando que los usuarios con el rol
        'company' tengan una empresa asociada.
        
        Raises:
            ValidationError: Si el rol es 'company' y no se ha asignado una empresa.
        """
        super().clean()
        if self.role == 'company' and self.company_id is None:
            raise ValidationError({'company': 'La empresa es obligatoria para usuarios con rol company.'})

    def __str__(self):
        """
        Representación en cadena del usuario, que es su correo electrónico.
        
        Returns:
            str: Correo electrónico del usuario.
        """
        return self.email
    
    class Meta:
        """
        Definición de índices y restricciones para el modelo de usuario.
        """
        indexes = [
            models.Index(fields=['email']),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(role__in=['admin', 'company']),
                name='user_role_valid'
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(role='admin', company__isnull=True) |
                    models.Q(role='company', company__isnull=False)
                ),
                name='user_role_company_consistency'
            ),
            models.UniqueConstraint(
                fields=["company"],
                condition=models.Q(role="company", is_active=True),
                name="unique_active_user_per_company",
            ),
        ]