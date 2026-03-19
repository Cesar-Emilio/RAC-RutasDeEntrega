from django.urls import path

from .views import LoginView, LogoutView, MeView, RefreshView, GoogleLoginView, GoogleCallbackView

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("google/login/", GoogleLoginView.as_view(), name="auth-google-login"),
    path("google/callback/", GoogleCallbackView.as_view(), name="auth-google-callback"),
]
