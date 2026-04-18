from rest_framework import viewsets
from drf_spectacular.openapi import OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from django.core.mail import BadHeaderError
from django.db.models import Q
from .models import Company
from .serializers import CompanySerializer
from .permissions import IsAdminUser
import jwt
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework import status
from utils.response_helper import ApiResponse
from config.logging_utils import get_logger, get_client_ip

logger = get_logger(__name__)


@extend_schema_view(
    list=extend_schema(
        description="Lista todas las Empresas activas.",
        responses=CompanySerializer(many=True),
    ),
    retrieve=extend_schema(
        description="Recupera los datos de una Empresa activa por su ID.",
        parameters=[
            OpenApiParameter(
                name='pk',
                location=OpenApiParameter.PATH,
                required=True,
                type=OpenApiTypes.INT,
                description='ID de la Empresa.',
            ),
        ],
        responses=CompanySerializer,
    ),
    create=extend_schema(
        description="Crea una nueva Empresa con los datos proporcionados.",
        request=CompanySerializer,
        responses={201: CompanySerializer},
    ),
    update=extend_schema(
        description="Actualiza los datos completos de una Empresa existente.",
        request=CompanySerializer,
        responses=CompanySerializer,
    ),
    partial_update=extend_schema(
        description="Actualiza campos parciales de una Empresa existente.",
        request=CompanySerializer,
        responses=CompanySerializer,
    ),
    destroy=extend_schema(
        description="Elimina una Empresa activa.",
        responses={204: OpenApiResponse(description='Empresa eliminada correctamente.')},
    ),
)
class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Company.objects.all().order_by("-created_at")
        search = self.request.query_params.get("search", "").strip()
        active = self.request.query_params.get("active")

        if active in ["true", "false"]:
            queryset = queryset.filter(active=(active == "true"))

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(email__icontains=search)
                | Q(rfc__icontains=search)
            )

        return queryset

    def create(self, request, *args, **kwargs):
        actor_id = getattr(request.user, "id", None)
        try:
            response = super().create(request, *args, **kwargs)
            company_id = response.data.get("id") if hasattr(response, "data") else None
            logger.info(
                "company | action=create | result=success | company_id={company_id} "
                "| actor_user_id={actor_id} | status_code=201",
                company_id=company_id,
                actor_id=actor_id,
            )
            return response
        except Exception as e:
            logger.error(
                "company | action=create | result=failure | actor_user_id={actor_id} | error={error}",
                actor_id=actor_id,
                error=str(e),
            )
            return ApiResponse.error(
                message="Error al crear la empresa.",
                errors={"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def update(self, request, *args, **kwargs):
        actor_id = getattr(request.user, "id", None)
        company_id = kwargs.get("pk")
        try:
            response = super().update(request, *args, **kwargs)
            logger.info(
                "company | action=update | result=success | company_id={company_id} "
                "| actor_user_id={actor_id} | status_code=200",
                company_id=company_id,
                actor_id=actor_id,
            )
            return response
        except Exception as e:
            logger.error(
                "company | action=update | result=failure | company_id={company_id} "
                "| actor_user_id={actor_id} | error={error}",
                company_id=company_id,
                actor_id=actor_id,
                error=str(e),
            )
            return ApiResponse.error(
                message="Error al actualizar la empresa.",
                errors={"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def destroy(self, request, *args, **kwargs):
        actor_id = getattr(request.user, "id", None)
        company_id = kwargs.get("pk")
        try:
            response = super().destroy(request, *args, **kwargs)
            logger.info(
                "company | action=destroy | result=success | company_id={company_id} "
                "| actor_user_id={actor_id} | status_code=204",
                company_id=company_id,
                actor_id=actor_id,
            )
            return response
        except Exception as e:
            logger.error(
                "company | action=destroy | result=failure | company_id={company_id} "
                "| actor_user_id={actor_id} | error={error}",
                company_id=company_id,
                actor_id=actor_id,
                error=str(e),
            )
            return ApiResponse.error(
                message="Error al eliminar la empresa.",
                errors={"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


@method_decorator(csrf_exempt, name='dispatch')
class InviteCompanyView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        actor_id = getattr(request.user, "id", None)
        ip = get_client_ip(request)
        email = request.data.get('email')

        if not email:
            logger.warning(
                "invite | action=send_invitation | result=missing_email "
                "| actor_user_id={actor_id} | ip={ip}",
                actor_id=actor_id,
                ip=ip,
            )
            return ApiResponse.error(
                message="El campo email es requerido.",
                errors={"detail": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Generar el token con una fecha de expiración de 24 horas
            # El token no se loga para evitar exponer el enlace de invitación
            expiration_time = timezone.now() + timedelta(hours=24)
            token = jwt.encode({'email': email, 'exp': expiration_time}, settings.SECRET_KEY, algorithm='HS256')

            self.send_invitation_email(email, token, actor_id=actor_id, ip=ip)

            logger.info(
                "invite | action=send_invitation | result=success | email={email} "
                "| actor_user_id={actor_id} | ip={ip} | status_code=200",
                email=email,
                actor_id=actor_id,
                ip=ip,
            )
            return ApiResponse.success(
                message="Invitación enviada correctamente.",
                data={"email": email},
                status=status.HTTP_200_OK,
            )
        except (ValueError, BadHeaderError) as exc:
            logger.error(
                "invite | action=send_invitation | result=failure_controlled | email={email} "
                "| actor_user_id={actor_id} | ip={ip} | error={error}",
                email=email,
                actor_id=actor_id,
                ip=ip,
                error=str(exc),
            )
            return ApiResponse.error(
                message="Error al enviar la invitación.",
                errors={"detail": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as exc:
            logger.opt(exception=True).error(
                "invite | action=send_invitation | result=failure_unexpected | email={email} "
                "| actor_user_id={actor_id} | ip={ip} | error={error}",
                email=email,
                actor_id=actor_id,
                ip=ip,
                error=str(exc),
            )
            return ApiResponse.error(
                message="No se pudo enviar la invitación.",
                errors={"detail": "Unable to send invitation."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def send_invitation_email(self, email, token, actor_id=None, ip=None):
        subject = 'Invitación para completar el registro'
        message = f'Por favor complete su registro en el siguiente enlace: {settings.FRONTEND_URL}/auth/complete-registration/{token}'
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
        except Exception as exc:
            logger.opt(exception=True).error(
                "invite | action=send_email | result=failure | email={email} "
                "| actor_user_id={actor_id} | ip={ip} | error={error}",
                email=email,
                actor_id=actor_id,
                ip=ip,
                error=str(exc),
            )
            raise