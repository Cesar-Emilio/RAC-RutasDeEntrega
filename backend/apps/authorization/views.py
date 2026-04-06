import logging
import os
import secrets
import urllib.parse

import requests
from django.contrib.auth import get_user_model
from django.http import HttpResponseRedirect
from django.utils.crypto import get_random_string
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
from .utils import api_response


logger = logging.getLogger(__name__)


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError:
            return api_response(
                "error",
                "Invalid credentials.",
                errors={"detail": "Invalid credentials."},
                http_status=status.HTTP_401_UNAUTHORIZED,
            )
        except AuthenticationFailed as exc:
            return api_response(
                "error",
                "Invalid credentials.",
                errors={"detail": exc.detail},
                http_status=status.HTTP_401_UNAUTHORIZED,
            )
        except ValidationError as exc:
            return api_response(
                "error",
                "Login failed.",
                errors={"detail": exc.detail},
                http_status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            return api_response(
                "error",
                "Login failed.",
                errors={"detail": str(exc)},
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        return api_response(
            "success",
            "Login successful.",
            data=serializer.validated_data,
            http_status=status.HTTP_200_OK,
        )


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
        except TokenError:
            return api_response(
                "error",
                "Invalid refresh token.",
                errors={"detail": "Invalid refresh token."},
                http_status=status.HTTP_401_UNAUTHORIZED,
            )

        return api_response(
            "success",
            "Token refreshed.",
            data=response.data,
            http_status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser]

    def get(self, request):
        serializer = MeSerializer(instance=request.user)
        return api_response(
            "success",
            "User profile retrieved.",
            data=serializer.data,
            http_status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                return api_response(
                    "error",
                    "Invalid refresh token.",
                    errors={"detail": "Invalid refresh token."},
                    http_status=status.HTTP_400_BAD_REQUEST,
                )

        return api_response(
            "success",
            "Logout successful.",
            data=None,
            http_status=status.HTTP_200_OK,
        )


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
        if not client_id or not redirect_uri:
            return api_response(
                "error",
                "Google OAuth not configured.",
                errors={"detail": "Missing Google OAuth configuration."},
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
            return api_response(
                "error",
                "Missing authorization code.",
                errors={"detail": "Missing code."},
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        if not state or state != expected_state:
            return api_response(
                "error",
                "Invalid Google OAuth state.",
                errors={"detail": "Invalid state."},
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        request.session.pop("google_oauth_state", None)

        client_id = os.getenv("GOOGLE_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
        if not client_id or not client_secret or not redirect_uri:
            return api_response(
                "error",
                "Google OAuth not configured.",
                errors={"detail": "Missing Google OAuth configuration."},
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
            return api_response(
                "error",
                "Google authentication failed.",
                errors={"detail": "Unable to complete Google authentication."},
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        token_data = token_response.json()
        id_token_value = token_data.get("id_token")
        if not id_token_value:
            return api_response(
                "error",
                "Google token missing.",
                errors={"detail": "Missing id_token."},
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            id_info = id_token.verify_oauth2_token(
                id_token_value,
                google_requests.Request(),
                client_id,
            )
        except Exception as exc:
            return api_response(
                "error",
                "Google token invalid.",
                errors={"detail": str(exc)},
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        google_id = id_info.get("sub")
        email = id_info.get("email")
        name = id_info.get("name") or id_info.get("given_name") or "Google User"

        if not google_id or not email:
            return api_response(
                "error",
                "Google user data missing.",
                errors={"detail": "Missing google id or email."},
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        User = get_user_model()
        user = User.objects.filter(google_id=google_id).first()
        if not user:
            user = User.objects.filter(email=email).first()
            if user:
                user.google_id = google_id
                user.save(update_fields=["google_id"])
            else:
                user = User.objects.create_user(
                    email=email,
                    password=get_random_string(32),
                    name=name,
                    role="company",
                    is_active=True,
                    google_id=google_id,
                )

        if not getattr(user, "is_active", True):
            return api_response(
                "error",
                "User is inactive.",
                errors={"detail": "User inactive."},
                http_status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        data = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": _serialize_user(user),
        }

        frontend_base = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")
        query = urllib.parse.urlencode(
            {"access": data["access"], "refresh": data["refresh"]}
        )
        redirect_url = f"{frontend_base}/auth/google/callback?{query}"
        return HttpResponseRedirect(redirect_url)
