from rest_framework import generics
from rest_framework.permissions import IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, filters as df_filters
from .models import AuditLog
from .serializers import AuditLogSerializer
 
 
class AuditLogFilter(FilterSet):
    """Filtros disponibles en GET /audit/?action=create&model=route&user=3"""
    model  = df_filters.CharFilter(field_name="content_type__model")
    user   = df_filters.NumberFilter(field_name="user__id")
    action = df_filters.CharFilter(field_name="action")
    from_date = df_filters.DateTimeFilter(field_name="timestamp", lookup_expr="gte")
    to_date   = df_filters.DateTimeFilter(field_name="timestamp", lookup_expr="lte")
 
    class Meta:
        model = AuditLog
        fields = ["action", "model", "user", "from_date", "to_date"]
 
 
class AuditLogListView(generics.ListAPIView):
    """
    Listado paginado de la bitácora. Solo admins.
 
    Filtros disponibles via query params:
        ?action=create|read|update|delete
        ?model=route|company|user|...
        ?user=<id>
        ?from_date=2026-01-01T00:00:00
        ?to_date=2026-12-31T23:59:59
    """
    serializer_class   = AuditLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends    = [DjangoFilterBackend]
    filterset_class    = AuditLogFilter
 
    def get_queryset(self):
        return (
            AuditLog.objects
            .select_related("user", "content_type")
            .order_by("-timestamp")
        )