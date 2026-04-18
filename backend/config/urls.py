"""
URL configuration for config project.
The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.administration.views import DashboardSummaryView
from apps.users.views import RegisterView, CompleteRegisterView
from apps.companies.views import CompanyViewSet, InviteCompanyView
from apps.warehouses.views import WarehouseViewSet

router = DefaultRouter()
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'warehouses', WarehouseViewSet, basename='warehouse')

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/companies/invite/', InviteCompanyView.as_view(), name='company-invite'),

    # Entregas API
    path('api/', include(router.urls)),
    path('api/auth/', include('apps.authorization.urls')),
    path('api/deliveries/', include('apps.deliveries.urls')),
    path('api/users/register/', RegisterView.as_view(), name='register'),
    path('api/register/<str:token>/', CompleteRegisterView.as_view(), name='complete-register'),
    path('api/dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),

    # Swagger/OpenAPI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]