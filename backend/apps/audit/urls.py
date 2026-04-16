from django.urls import path
from .views_and_serializers import AuditLogListView
 
urlpatterns = [
    path("", AuditLogListView.as_view()),
]