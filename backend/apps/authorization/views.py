import os
import secrets
import urllib.parse

import requests
from django.contrib.auth import get_user_model
from django.http import HttpResponseRedirect
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.openapi import OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema

from .permissions import IsActiveUser
from .serializers import LoginSerializer, MeSerializer, _serialize_user
from .throttles import LoginRateThrottle
from utils.response_helper import ApiResponse
from config.logging_utils import get_logger, get_client_ip

logger = get_logger(__name__)


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    @extend_schema(
        description="Autentica a un usuario y devuelve tokens JWT junto con los datos del usuario.",
        request=LoginSerializer,
        responses={200: LoginSerializer},
    )
    def post(self, request):
        ip = get_client_ip(request)
        email = request.data.get("email", "")

        serializer = LoginSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError:
            logger.warning(
                "login | action=authenticate | result=invalid_credentials | email={email} | ip={ip}",
                email=email,
                ip=ip,
            )
            return ApiResponse.error(
                message="Invalid credentials.",
                errors={"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except AuthenticationFailed as exc:
            logger.warning(
                "login | action=authenticate | result=auth_failed | email={email} | ip={ip} | detail={detail}",
                email=email,
                ip=ip,
                detail=str(exc.detail),
            )
            return ApiResponse.error(
                message="Invalid credentials.",
                errors={"detail": exc.detail},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except ValidationError as exc:
            logger.warning(
                "login | action=authenticate | result=validation_error | email={email} | ip={ip}",
                email=email,
                ip=ip,
            )
            return ApiResponse.error(
                message="Login failed.",
                errors={"detail": exc.detail},
            )
        except Exception as exc:
            logger.error(
                "login | action=authenticate | result=unexpected_error | email={email} | ip={ip} | error={error}",
                email=email,
                ip=ip,
                error=str(exc),
            )
            return ApiResponse.error(
                message="Login failed.",
                errors={"detail": "Unable to process login."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        user_data = serializer.validated_data
        user_id = user_data.get("user", {}).get("id") if isinstance(user_data.get("user"), dict) else None
        logger.info(
            "login | action=authenticate | result=success | user_id={user_id} | email={email} "
            "| ip={ip} | method=POST | status_code=200",
            user_id=user_id,
            email=email,
            ip=ip,
        )

        return ApiResponse.success(
            message="Login successful.",
            data=user_data,
        )


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]

    @extend_schema(
        description="Renueva el token de acceso usando un refresh token válido.",
        request=TokenRefreshSerializer,
        responses={200: OpenApiResponse(description='Token refreshed successfully.')},
    )
    def post(self, request, *args, **kwargs):
        ip = get_client_ip(request)
        try:
            response = super().post(request, *args, **kwargs)
        except TokenError:
            logger.warning(
                "token_refresh | action=refresh | result=invalid_token | ip={ip}",
                ip=ip,
            )
            return ApiResponse.error(
                message="Invalid refresh token.",
                errors={"detail": "Invalid refresh token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        logger.info(
            "token_refresh | action=refresh | result=success | ip={ip} | status_code=200",
            ip=ip,
        )
        return ApiResponse.success(
            message="Token refreshed.",
            data=response.data,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser]

    @extend_schema(
        description="Recupera el perfil del usuario autenticado.",
        responses=MeSerializer,
    )
    def get(self, request):
        logger.debug(
            "me | action=get_profile | user_id={user_id} | endpoint=/auth/me/ | method=GET",
            user_id=request.user.id,
        )
        serializer = MeSerializer(instance=request.user)
        return ApiResponse.success(
            message="User profile retrieved.",
            data=serializer.data,
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        description="Cierra sesión invalidando el refresh token proporcionado.",
        request=TokenRefreshSerializer,
        responses={200: OpenApiResponse(description='Logout successful.')},
    )
    def post(self, request):
        user_id = request.user.id
        refresh_token = request.data.get("refresh")

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token_user_id = token.payload.get("user_id")

                if token_user_id is None or str(token_user_id) != str(request.user.id):
                    logger.warning(
                        "logout | action=blacklist_token | result=token_mismatch | user_id={user_id} "
                        "| token_owner={token_owner} | ip={ip}",
                        user_id=user_id,
                        token_owner=token_user_id,
                        ip=get_client_ip(request),
                    )
                    return ApiResponse.error(
                        message="Refresh token does not belong to the authenticated user.",
                        errors={
                            "detail": "Refresh token does not belong to the authenticated user."
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )

                token.blacklist()

            except TokenError:
                logger.warning(
                    "logout | action=blacklist_token | result=invalid_token | user_id={user_id} | ip={ip}",
                    user_id=user_id,
                    ip=get_client_ip(request),
                )
                return ApiResponse.error(
                    message="Invalid refresh token.",
                    errors={"detail": "Invalid refresh token."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        logger.info(
            "logout | action=logout | result=success | user_id={user_id} | ip={ip} | status_code=200",
            user_id=user_id,
            ip=get_client_ip(request),
        )
        return ApiResponse.success(
            message="Logout successful.",
            data=None,
            status=status.HTTP_200_OK,
        )


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        description="Redirige al usuario a Google OAuth para iniciar sesión con Google.",
        responses=OpenApiResponse(description='Redirect to Google OAuth consent screen.'),
    )
    def get(self, request):
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")

        if not client_id or not redirect_uri:
            logger.error(
                "google_login | action=initiate | result=misconfigured | ip={ip}",
                ip=get_client_ip(request),
            )
            return ApiResponse.error(
                message="Google OAuth not configured.",
                errors={"detail": "Missing Google OAuth configuration."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        state = secrets.token_urlsafe(16)
        request.session["google_oauth_state"] = state
        request.session.modified = True

        logger.debug(
            "google_login | action=redirect | ip={ip}",
            ip=get_client_ip(request),
        )

        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }

        auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
        return HttpResponseRedirect(f"{auth_url}?{urllib.parse.urlencode(params)}")


class GoogleCallbackView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        description="Procesa la respuesta de Google OAuth y redirige al frontend con tokens.",
        parameters=[
            OpenApiParameter(
                name='code',
                location=OpenApiParameter.QUERY,
                required=True,
                type=OpenApiTypes.STR,
                description='Código de autorización devuelto por Google.',
            ),
            OpenApiParameter(
                name='state',
                location=OpenApiParameter.QUERY,
                required=True,
                type=OpenApiTypes.STR,
                description='Token de estado para validar la respuesta de OAuth.',
            ),
        ],
        responses=OpenApiResponse(description='Redirect back to frontend with access and refresh tokens.'),
    )
    def get(self, request):
        ip = get_client_ip(request)
        code = request.query_params.get("code")
        state = request.query_params.get("state")
        expected_state = request.session.get("google_oauth_state")

        if not code:
            logger.warning(
                "google_callback | action=validate | result=missing_code | ip={ip}",
                ip=ip,
            )
            return ApiResponse.error(
                message="Missing authorization code.",
                errors={"detail": "Missing code."},
            )

        if not state or state != expected_state:
            logger.warning(
                "google_callback | action=validate | result=state_mismatch | ip={ip} "
                "| possible_csrf=true",
                ip=ip,
            )
            return ApiResponse.error(
                message="Invalid Google OAuth state.",
                errors={"detail": "Invalid state."},
            )

        request.session.pop("google_oauth_state", None)

        client_id = os.getenv("GOOGLE_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")

        if not client_id or not client_secret or not redirect_uri:
            logger.error(
                "google_callback | action=token_exchange | result=misconfigured | ip={ip}",
                ip=ip,
            )
            return ApiResponse.error(
                message="Google OAuth not configured.",
                errors={"detail": "Missing Google OAuth configuration."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        token_url = "https://oauth2.googleapis.com/token"
        token_payload = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
        }

        token_response = requests.post(token_url, data=token_payload, timeout=10)

        if token_response.status_code != 200:
            logger.warning(
                "google_callback | action=token_exchange | result=failed | ip={ip} "
                "| http_status={http_status}",
                ip=ip,
                http_status=token_response.status_code,
            )
            return ApiResponse.error(
                message="Google authentication failed.",
                errors={"detail": "Unable to complete Google authentication."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token_data = token_response.json()
        id_token_value = token_data.get("id_token")

        if not id_token_value:
            logger.warning(
                "google_callback | action=token_exchange | result=missing_id_token | ip={ip}",
                ip=ip,
            )
            return ApiResponse.error(
                message="Google token missing.",
                errors={"detail": "Missing id_token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            id_info = id_token.verify_oauth2_token(
                id_token_value,
                google_requests.Request(),
                client_id,
                clock_skew_in_seconds=30,
            )
        except Exception as exc:
            logger.warning(
                "google_callback | action=verify_id_token | result=invalid | ip={ip} | error={error}",
                ip=ip,
                error=str(exc),
            )
            return ApiResponse.error(
                message="Google token invalid.",
                errors={"detail": "Invalid Google token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        google_id = id_info.get("sub")
        email = id_info.get("email")

        if not google_id or not email:
            logger.warning(
                "google_callback | action=extract_user_info | result=missing_data | ip={ip}",
                ip=ip,
            )
            return ApiResponse.error(
                message="Google user data missing.",
                errors={"detail": "Missing google id or email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        User = get_user_model()
        user = User.objects.filter(google_id=google_id).first()

        if not user:
            user = User.objects.filter(email=email).first()

            if user:
                user.google_id = google_id
                user.save(update_fields=["google_id"])
                logger.debug(
                    "google_callback | action=link_google_id | user_id={user_id} | email={email}",
                    user_id=user.id,
                    email=email,
                )
            else:
                logger.warning(
                    "google_callback | action=find_user | result=not_found | email={email} | ip={ip}",
                    email=email,
                    ip=ip,
                )
                return ApiResponse.error(
                    message="User account not found.",
                    errors={"detail": "Account does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        refresh = RefreshToken.for_user(user)

        logger.info(
            "google_callback | action=authenticate | result=success | user_id={user_id} "
            "| email={email} | ip={ip} | status_code=302",
            user_id=user.id,
            email=email,
            ip=ip,
        )

        data = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": _serialize_user(user),
        }

        frontend_base = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")
        fragment = urllib.parse.urlencode({
            "access": data["access"],
            "refresh": data["refresh"],
        })

        redirect_url = f"{frontend_base}/auth/google/callback#{fragment}"
        return HttpResponseRedirect(redirect_url)