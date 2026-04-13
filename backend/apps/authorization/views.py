import logging
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
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .permissions import IsActiveUser
from .serializers import LoginSerializer, MeSerializer, _serialize_user
from .throttles import LoginRateThrottle
from utils.response_helper import ApiResponse

logger = logging.getLogger(__name__)

class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError:
            return ApiResponse.error(
                message="Invalid credentials.",
                errors={"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except AuthenticationFailed as exc:
            return ApiResponse.error(
                message="Invalid credentials.",
                errors={"detail": exc.detail},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except ValidationError as exc:
            return ApiResponse.error(
                message="Login failed.",
                errors={"detail": exc.detail},
            )
        except Exception as exc:
            logger.exception("Unexpected login error: %s", exc)
            return ApiResponse.error(
                message="Login failed.",
                errors={"detail": "Unable to process login."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return ApiResponse.success(
            message="Login successful.",
            data=serializer.validated_data,
        )


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
        except TokenError:
            return ApiResponse.error(
                message="Invalid refresh token.",
                errors={"detail": "Invalid refresh token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return ApiResponse.success(
            message="Token refreshed.",
            data=response.data,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser]

    def get(self, request):
        serializer = MeSerializer(instance=request.user)
        return ApiResponse.success(
            message="User profile retrieved.",
            data=serializer.data,
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token_user_id = token.payload.get("user_id")
                if token_user_id is None or str(token_user_id) != str(request.user.id):
                    return ApiResponse.error(
                        message="Refresh token does not belong to the authenticated user.",
                        errors={
                            "detail": "Refresh token does not belong to the authenticated user."
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )
                token.blacklist()
            except TokenError:
                return ApiResponse.error(
                    message="Invalid refresh token.",
                    errors={"detail": "Invalid refresh token."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return ApiResponse.success(
            message="Logout successful.",
            data=None,
            status=status.HTTP_200_OK,
        )


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
        if not client_id or not redirect_uri:
            return ApiResponse.error(
                message="Google OAuth not configured.",
                errors={"detail": "Missing Google OAuth configuration."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        state = secrets.token_urlsafe(16)
        request.session["google_oauth_state"] = state
        request.session.modified = True

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

    def get(self, request):
        code = request.query_params.get("code")
        state = request.query_params.get("state")
        expected_state = request.session.get("google_oauth_state")

        if not code:
            return ApiResponse.error(
                message="Missing authorization code.",
                errors={"detail": "Missing code."},
            )

        if not state or state != expected_state:
            return ApiResponse.error(
                message="Invalid Google OAuth state.",
                errors={"detail": "Invalid state."},
            )

        request.session.pop("google_oauth_state", None)

        client_id = os.getenv("GOOGLE_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
        if not client_id or not client_secret or not redirect_uri:
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
            logger.warning("Google token exchange failed: %s", token_response.text)
            return ApiResponse.error(
                message="Google authentication failed.",
                errors={"detail": "Unable to complete Google authentication."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token_data = token_response.json()
        id_token_value = token_data.get("id_token")
        if not id_token_value:
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
            logger.warning("Google id token validation failed: %s", exc)
            return ApiResponse.error(
                message="Google token invalid.",
                errors={"detail": "Invalid Google token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        google_id = id_info.get("sub")
        email = id_info.get("email")
        name = id_info.get("name") or id_info.get("given_name") or "Google User"

        if not google_id or not email:
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
                if getattr(user, "role", None) == "company" and getattr(user, "company_id", None) is None:
                    return ApiResponse.error(
                        message="User company account is not configured.",
                        errors={
                            "detail": (
                                "La cuenta debe ser creada por un administrador y tener una empresa asignada."
                            )
                        },
                        status=status.HTTP_409_CONFLICT,
                    )
                user.google_id = google_id
                user.save(update_fields=["google_id"])
            else:
                return ApiResponse.error(
                    message="User account not found.",
                    errors={
                        "detail": (
                            "La cuenta no existe. Debe ser creada por un administrador con empresa asignada."
                        )
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

        if not getattr(user, "is_active", True):
            return ApiResponse.error(
                message="User is inactive.",
                errors={"detail": "User inactive."},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        data = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": _serialize_user(user),
        }

        frontend_base = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")
        fragment = urllib.parse.urlencode(
            {"access": data["access"], "refresh": data["refresh"]}
        )
        redirect_url = f"{frontend_base}/auth/google/callback#{fragment}"
        return HttpResponseRedirect(redirect_url)
