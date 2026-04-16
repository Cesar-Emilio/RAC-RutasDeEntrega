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
from utils.response_helper import ApiResponse
from django.db import IntegrityError
from config.logging_utils import get_logger, get_client_ip

User = get_user_model()
logger = get_logger(__name__)


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
        actor_id = getattr(self.request.user, "id", None)
        try:
            user = serializer.save()
            company_id = getattr(user.company, "id", None) if user.company else None
            logger.info(
                "register | action=create_user | result=success | user_id={user_id} "
                "| email={email} | role={role} | company_id={company_id} | actor_user_id={actor_id}",
                user_id=user.id,
                email=user.email,
                role=user.role,
                company_id=company_id,
                actor_id=actor_id,
            )
        except Exception as e:
            logger.error(
                "register | action=create_user | result=failure | actor_user_id={actor_id} | error={error}",
                actor_id=actor_id,
                error=str(e),
            )
            raise e


@method_decorator(csrf_exempt, name='dispatch')
class CompleteRegisterView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        ip = get_client_ip(request)
        try:
            decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            email = decoded.get('email')
            if decoded['exp'] < timezone.now().timestamp():
                logger.warning(
                    "complete_register | action=validate_token | result=expired "
                    "| email={email} | ip={ip}",
                    email=email,
                    ip=ip,
                )
                return ApiResponse.error(
                    message="El enlace de invitación ha expirado.",
                    errors={"detail": "El enlace de invitación ha expirado."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except jwt.ExpiredSignatureError:
            logger.warning(
                "complete_register | action=validate_token | result=expired_signature | ip={ip}",
                ip=ip,
            )
            return ApiResponse.error(
                message="El enlace ha expirado.",
                errors={"detail": "El enlace ha expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except jwt.InvalidTokenError:
            logger.error(
                "complete_register | action=validate_token | result=invalid_token | ip={ip}",
                ip=ip,
            )
            return ApiResponse.error(
                message="Token inválido.",
                errors={"detail": "Token inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = decoded.get('email')
        logger.debug(
            "complete_register | action=validate_token | result=valid | email={email} | ip={ip}",
            email=email,
            ip=ip,
        )
        return ApiResponse.success(
            message="Token válido.",
            data={"email": email},
            status=status.HTTP_200_OK,
        )

    def post(self, request, token):
        ip = get_client_ip(request)
        try:
            decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            email = decoded.get('email')
            if decoded['exp'] < timezone.now().timestamp():
                logger.warning(
                    "complete_register | action=validate_token | result=expired "
                    "| email={email} | ip={ip}",
                    email=email,
                    ip=ip,
                )
                return ApiResponse.error(
                    message="El enlace de invitación ha expirado.",
                    errors={"detail": "El enlace de invitación ha expirado."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except jwt.ExpiredSignatureError:
            logger.warning(
                "complete_register | action=validate_token | result=expired_signature | ip={ip}",
                ip=ip,
            )
            return ApiResponse.error(
                message="El enlace ha expirado.",
                errors={"detail": "El enlace ha expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except jwt.InvalidTokenError:
            logger.error(
                "complete_register | action=validate_token | result=invalid_token | ip={ip}",
                ip=ip,
            )
            return ApiResponse.error(
                message="Token inválido.",
                errors={"detail": "Token inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Extraer datos del cuerpo de la solicitud
        email = decoded.get('email')
        name = request.data.get('name')
        password = request.data.get('password')
        role = request.data.get('role', 'company')
        company_name = request.data.get('company_name')
        rfc = request.data.get('rfc')

        if not all([name, password, company_name, rfc]):
            missing = [f for f, v in {'name': name, 'password': password, 'company_name': company_name, 'rfc': rfc}.items() if not v]
            logger.warning(
                "complete_register | action=validate_fields | result=missing_fields "
                "| email={email} | missing_fields={missing} | ip={ip}",
                email=email,
                missing=missing,
                ip=ip,
            )
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
                logger.info(
                    "complete_register | action=create_company | result=created "
                    "| rfc={rfc} | company_name={company_name} | email={email}",
                    rfc=rfc.upper(),
                    company_name=company_name,
                    email=email,
                )
            else:
                logger.info(
                    "complete_register | action=create_company | result=existing "
                    "| rfc={rfc} | company_name={company_name} | email={email}",
                    rfc=rfc.upper(),
                    company_name=company_name,
                    email=email,
                )

            user = User.objects.create_user(
                email=email,
                name=name,
                password=password,
                role=role,
                company=company,
                is_active=True
            )

            logger.info(
                "complete_register | action=create_user | result=success | user_id={user_id} "
                "| email={email} | role={role} | company_id={company_id} | ip={ip} | status_code=201",
                user_id=user.id,
                email=email,
                role=role,
                company_id=company.id,
                ip=ip,
            )

            return ApiResponse.created(
                message="Usuario registrado correctamente.",
                data={"user": {"id": user.id, "email": user.email, "name": user.name}},
            )
        except IntegrityError as e:
            error_str = str(e).lower()
            if "email" in error_str:
                detail = "Ya existe un usuario registrado con ese correo electrónico."
            elif "rfc" in error_str:
                detail = "Ya existe una empresa registrada con ese RFC."
            else:
                detail = "Conflicto en la base de datos. Verifica los datos enviados."
            logger.warning(
                "complete_register | action=create_user | result=integrity_error "
                "| email={email} | detail={detail} | ip={ip}",
                email=email,
                detail=detail,
                ip=ip,
            )
            return ApiResponse.error(
                message="Error de registro.",
                errors={"detail": detail},
                status=status.HTTP_409_CONFLICT,
            )

        except Exception as e:
            logger.error(
                "complete_register | action=create_user | result=unexpected_error "
                "| email={email} | error={error} | ip={ip}",
                email=email,
                error=str(e),
                ip=ip,
            )
            return ApiResponse.error(
                message="Error al registrar usuario.",
                errors={"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )