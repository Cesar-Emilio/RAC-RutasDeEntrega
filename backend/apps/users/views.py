import logging
from rest_framework import generics
from drf_spectacular.utils import extend_schema
from django.contrib.auth import get_user_model
from .permissions import IsAdminUser
from .serializers import RegisterSerializer
import jwt
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework import status
from .models import User
from apps.companies.models import Company
# CAMBIO: se importa ApiResponse para unificar el formato de respuesta
from utils.response_helper import ApiResponse
# CAMBIO: se importa IntegrityError para manejar UNIQUE constraint de BD
from django.db import IntegrityError

User = get_user_model()

logger = logging.getLogger(__name__)

@extend_schema(
    description="Registra un nuevo usuario con rol y empresa asociados.",
    request=RegisterSerializer,
    responses={201: RegisterSerializer},
)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAdminUser]  # Solo los administradores pueden registrar usuarios
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        try:
            # Registro exitoso del usuario
            user = serializer.save()
            logger.info(f"Usuario registrado con éxito | email={user.email} | role={user.role} | company={user.company.name if user.company else 'N/A'}")
        except Exception as e:
            logger.error(f"Error al registrar usuario | error={str(e)}")
            raise e


@method_decorator(csrf_exempt, name='dispatch')
class CompleteRegisterView(APIView):
    permission_classes = [AllowAny]  # Accesible para cualquier usuario

    def get(self, request, token):
        try:
            # CAMBIO: se usa ApiResponse para formato estándar
            decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            email = decoded.get('email')
            if decoded['exp'] < timezone.now().timestamp():
                logger.warning(f"Enlace de invitación expirado | email={email} | token_expiration={decoded['exp']}")
                return ApiResponse.error(
                    message="El enlace de invitación ha expirado.",
                    errors={"detail": "El enlace de invitación ha expirado."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except jwt.ExpiredSignatureError:
            logger.error(f"Token expirado | token={token}")
            return ApiResponse.error(
                message="El enlace ha expirado.",
                errors={"detail": "El enlace ha expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except jwt.InvalidTokenError:
            logger.error(f"Token inválido | token={token}")
            return ApiResponse.error(
                message="Token inválido.",
                errors={"detail": "Token inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        logger.debug(f"Token decodificado correctamente | email={email}")
        return ApiResponse.success(
            message="Token válido.",
            data={"email": email},
            status=status.HTTP_200_OK,
        )

    def post(self, request, token):
        try:
            # CAMBIO: se usa ApiResponse para formato estándar
            decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            email = decoded.get('email')
            if decoded['exp'] < timezone.now().timestamp():
                logger.warning(f"Enlace de invitación expirado | email={email} | token_expiration={decoded['exp']}")
                return ApiResponse.error(
                    message="El enlace de invitación ha expirado.",
                    errors={"detail": "El enlace de invitación ha expirado."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except jwt.ExpiredSignatureError:
            logger.error(f"Token expirado | token={token}")
            return ApiResponse.error(
                message="El enlace ha expirado.",
                errors={"detail": "El enlace ha expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except jwt.InvalidTokenError:
            logger.error(f"Token inválido | token={token}")
            return ApiResponse.error(
                message="Token inválido.",
                errors={"detail": "Token inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Extraer datos del cuerpo de la solicitud
        name = request.data.get('name')
        password = request.data.get('password')
        role = request.data.get('role', 'company')
        company_name = request.data.get('company_name')
        rfc = request.data.get('rfc')

        # CAMBIO: validación con mensajes de error claros en formato estándar
        if not all([name, password, company_name, rfc]):
            logger.warning(f"Campos requeridos faltantes | email={email} | missing_fields={'name, password, company_name, rfc' if not name or not password or not company_name or not rfc else ''}")
            return ApiResponse.error(
                message="Faltan campos requeridos.",
                errors={"detail": "Se requieren los campos: name, password, company_name, rfc."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            company, created = Company.objects.get_or_create(
                rfc=rfc.upper(),
                defaults={'name': company_name, 'email': email}
            )

            if created:
                logger.info(f"Compañía creada | rfc={rfc.upper()} | company_name={company_name} | email={email}")
            else:
                logger.info(f"Compañía actualizada | rfc={rfc.upper()} | company_name={company_name} | email={email}")

            user = User.objects.create_user(
                email=email,
                name=name,
                password=password,
                role=role,
                company=company,
                is_active=True
            )

            logger.info(f"Usuario registrado correctamente | email={email} | user_id={user.id} | role={role} | company_name={company_name}")

            return ApiResponse.created(
                message="Usuario registrado correctamente.",
                data={"user": {"id": user.id, "email": user.email, "name": user.name}},
            )
        # CAMBIO: se captura IntegrityError para manejar UNIQUE constraint (email duplicado)
        except IntegrityError as e:
            error_str = str(e).lower()
            if "email" in error_str:
                detail = "Ya existe un usuario registrado con ese correo electrónico."
            elif "rfc" in error_str:
                detail = "Ya existe una empresa registrada con ese RFC."
            else:
                detail = "Conflicto en la base de datos. Verifica los datos enviados."
            return ApiResponse.error(
                message="Error de registro.",
                errors={"detail": detail},
                status=status.HTTP_409_CONFLICT,
            )

        except Exception as e:
            logger.error(f"Error al registrar usuario | email={email} | error={str(e)}")
            return ApiResponse.error(
                message="Error al registrar usuario.",
                errors={"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )