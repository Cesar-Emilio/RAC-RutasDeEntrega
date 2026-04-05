from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from .models import Warehouse
from .serializers import WarehouseSerializer


class WarehouseViewSet(viewsets.ModelViewSet):
    serializer_class = WarehouseSerializer

    def get_queryset(self):
        return Warehouse.objects.filter(
            active=True,
            company=self.request.user.company
        )

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)

    def destroy(self, request, *args, **kwargs):
        warehouse = self.get_object()
        warehouse.active = False
        warehouse.save()
        return Response(
            {'detail': 'Almacén desactivado correctamente.'},
            status=status.HTTP_200_OK
        )