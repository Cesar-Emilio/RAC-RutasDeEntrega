from rest_framework import viewsets
from drf_spectacular.openapi import OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view

from .models import Company
from .serializers import CompanySerializer
from apps.authorization.permissions import IsAdminRole
import jwt
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status

@extend_schema_view(
    list=extend_schema(
        description="Lista todas las compañías activas.",
        responses=CompanySerializer(many=True),
    ),
    retrieve=extend_schema(
        description="Recupera los datos de una compañía activa por su ID.",
        parameters=[
            OpenApiParameter(
                name='pk',
                location=OpenApiParameter.PATH,
                required=True,
                type=OpenApiTypes.INT,
                description='ID de la compañía.',
            ),
        ],
        responses=CompanySerializer,
    ),
    create=extend_schema(
        description="Crea una nueva compañía con los datos proporcionados.",
        request=CompanySerializer,
        responses={201: CompanySerializer},
    ),
    update=extend_schema(
        description="Actualiza los datos completos de una compañía existente.",
        request=CompanySerializer,
        responses=CompanySerializer,
    ),
    partial_update=extend_schema(
        description="Actualiza campos parciales de una compañía existente.",
        request=CompanySerializer,
        responses=CompanySerializer,
    ),
    destroy=extend_schema(
        description="Elimina una compañía activa.",
        responses={204: OpenApiResponse(description='Compañía eliminada correctamente.')},
    ),
)
class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.filter(active=True)
    serializer_class = CompanySerializer
    permission_classes = [IsAdminRole]


@method_decorator(csrf_exempt, name='dispatch')
class InviteCompanyView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generar el token con una fecha de expiración de 24 horas
        expiration_time = timezone.now() + timedelta(hours=24)
        token = jwt.encode({'email': email, 'exp': expiration_time}, settings.SECRET_KEY, algorithm='HS256')

        # Enviar correo con el token (la URL va al frontend donde el usuario completará el registro)
        self.send_invitation_email(email, token)

        return Response({'detail': 'Invitation sent.'}, status=status.HTTP_200_OK)

    def send_invitation_email(self, email, token):
        subject = 'Invitación para completar el registro'
        message = f'Por favor complete su registro en el siguiente enlace: {settings.FRONTEND_URL}/auth/complete-registration/{token}'
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])