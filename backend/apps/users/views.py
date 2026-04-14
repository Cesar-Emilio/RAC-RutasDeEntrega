from rest_framework import generics
from drf_spectacular.utils import extend_schema
from django.contrib.auth import get_user_model
from apps.authorization.permissions import IsAdminRole
from .serializers import RegisterSerializer
import jwt
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from .models import User
from apps.companies.models import Company

User = get_user_model()


@extend_schema(
    description="Registra un nuevo usuario con rol y empresa asociados.",
    request=RegisterSerializer,
    responses={201: RegisterSerializer},
)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (IsAdminRole,)
    serializer_class = RegisterSerializer

@method_decorator(csrf_exempt, name='dispatch')
class CompleteRegisterView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            # Decodificar el token
            decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            email = decoded.get('email')
            if decoded['exp'] < timezone.now().timestamp():
                return Response({'detail': 'El enlace de invitación ha expirado.'}, status=status.HTTP_400_BAD_REQUEST)

        except jwt.ExpiredSignatureError:
            return Response({'detail': 'El enlace ha expirado.'}, status=status.HTTP_400_BAD_REQUEST)
        except jwt.InvalidTokenError:
            return Response({'detail': 'Token inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'email': email}, status=status.HTTP_200_OK)

    def post(self, request, token):
        try:
            # Decodificar el token
            decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            email = decoded.get('email')
            if decoded['exp'] < timezone.now().timestamp():
                return Response({'detail': 'El enlace de invitación ha expirado.'}, status=status.HTTP_400_BAD_REQUEST)

        except jwt.ExpiredSignatureError:
            return Response({'detail': 'El enlace ha expirado.'}, status=status.HTTP_400_BAD_REQUEST)
        except jwt.InvalidTokenError:
            return Response({'detail': 'Token inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        # Extraer datos del cuerpo de la solicitud
        name = request.data.get('name')
        password = request.data.get('password')
        role = request.data.get('role', 'company')
        company_name = request.data.get('company_name')
        rfc = request.data.get('rfc')

        # Validar que todos los campos requeridos estén presentes
        if not all([name, password, company_name, rfc]):
            return Response(
                {'detail': 'Faltan campos requeridos: name, password, company_name, rfc.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Crear o obtener la Company
            company, created = Company.objects.get_or_create(
                rfc=rfc.upper(),
                defaults={'name': company_name, 'email': email}
            )

            # Si la empresa ya existe pero con diferente email o nombre, actualizar
            if not created:
                company.name = company_name
                company.email = email
                company.save()

            # Crear el usuario
            user = User.objects.create_user(
                email=email,
                name=name,
                password=password,
                role=role,
                company=company,
                is_active=True
            )

            return Response(
                {'detail': 'Usuario registrado correctamente.', 'user': {'id': user.id, 'email': user.email, 'name': user.name}},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'detail': f'Error al registrar usuario: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )