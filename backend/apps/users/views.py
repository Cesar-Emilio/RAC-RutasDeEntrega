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
from django.db import IntegrityError, transaction
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

        email = decoded.get('email')
        name = request.data.get('name')
        password = request.data.get('password')
        role = request.data.get('role', 'company')
        company_name = request.data.get('company_name')
        rfc = request.data.get('rfc')
        
        missing = [f for f, v in {
            "name": name, "password": password,
            "company_name": company_name, "rfc": rfc,
        }.items() if not v]
        if missing:
            logger.warning(
                "complete_register | action=validate_fields | result=missing_fields "
                "| email={email} | missing={missing} | ip={ip}",
                email=email, missing=missing, ip=ip,
            )
            return ApiResponse.error(
                message="Faltan campos requeridos.",
                errors={"detail": f"Campos faltantes: {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
            
        if User.objects.filter(email__iexact=email, is_active=True).exists():
            logger.warning(
                "complete_register | action=validate_email | result=already_registered "
                "| email={email} | ip={ip}",
                email=email, ip=ip,
            )
            return ApiResponse.error(
                message="Ya existe una cuenta activa con ese correo.",
                errors={"detail": "Este correo ya está registrado."},
                status=status.HTTP_409_CONFLICT,
            )
            
        if Company.objects.filter(rfc=rfc).exists():
            logger.warning(
                "complete_register | action=validate_rfc | result=rfc_taken "
                "| rfc={rfc} | email={email} | ip={ip}",
                rfc=rfc, email=email, ip=ip,
            )
            return ApiResponse.error(
                message="El RFC ya está registrado en el sistema.",
                errors={"detail": "Ya existe una empresa con ese RFC."},
                status=status.HTTP_409_CONFLICT,
            )

        try:
            with transaction.atomic():
                company = Company.objects.create(
                    name=company_name,
                    rfc=rfc,
                    email=email,
                )
                user = User.objects.create_user(
                    email=email,
                    name=name,
                    password=password,
                    role=role,
                    company=company,
                    is_active=True,
                )

            logger.info(
                "complete_register | action=create_user | result=success | user_id={user_id} "
                "| email={email} | role={role} | company_id={company_id} | ip={ip}",
                user_id=user.id, email=email, role=role, company_id=company.id, ip=ip,
            )
            return ApiResponse.created(
                message="Usuario registrado correctamente.",
                data={"user": {"id": user.id, "email": user.email, "name": user.name}},
            )

        except IntegrityError as e:
            # Salvaguarda: si dos requests llegan simultáneamente y pasan las
            # validaciones al mismo tiempo, la constraint de BD lo detiene aquí.
            error_str = str(e).lower()
            if "rfc" in error_str:
                detail = "Ya existe una empresa con ese RFC."
            elif "email" in error_str:
                detail = "Ya existe una cuenta con ese correo."
            elif "unique_active_user_per_company" in error_str:
                detail = "Esta empresa ya tiene un usuario registrado."
            else:
                detail = "Conflicto en la base de datos."
            logger.warning(
                "complete_register | action=create_user | result=integrity_error "
                "| email={email} | detail={detail} | ip={ip}",
                email=email, detail=detail, ip=ip,
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
                email=email, error=str(e), ip=ip,
            )
            return ApiResponse.error(
                message="Error al registrar usuario.",
                errors={"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
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