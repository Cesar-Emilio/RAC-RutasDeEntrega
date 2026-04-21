"""
URLs de la aplicación de solución de una ruta

/ - Listar rutas (Tabla)
/create - Creación de una nueva ruta
/{id} - Ver detalles de una ruta completa
"""
from django.urls import path
from .views import RouteDeleteView, RouteListView, RouteCreateView, RouteDetailView

urlpatterns = [
    path('', RouteListView.as_view(), name='routes-list'),
    path('create/', RouteCreateView.as_view(), name='route-create'),
    path('<int:pk>/', RouteDetailView.as_view(), name='route-details'),
    path("<int:pk>/delete/", RouteDeleteView.as_view(), name="route-delete"),
]