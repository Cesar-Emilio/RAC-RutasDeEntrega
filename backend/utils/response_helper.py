from rest_framework.response import Response
from rest_framework import status as http_status

class ApiResponse:
    @staticmethod
    # CAMBIO: headers="" → headers=None (tipo correcto para parámetro de headers HTTP)
    def success(data=None, message="Success", status=http_status.HTTP_200_OK, headers=None):
        return Response({"success": True, "message": message, "data": data}, status=status, headers=headers)

    @staticmethod
    def error(message="Error", errors=None, status=http_status.HTTP_400_BAD_REQUEST):
        return Response({"success": False, "message": message, "errors": errors}, status=status)

    @staticmethod
    def created(data=None, message="Created"):
        return ApiResponse.success(data=data, message=message, status=http_status.HTTP_201_CREATED)