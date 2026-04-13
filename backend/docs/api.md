# RAC API Documentation

## Base URL
http://127.0.0.1:8000/api/


## Autenticación

La API utiliza JSON Web Tokens (JWT).

Header requerido:
Authorization: Bearer <token>


# Auth

## Login
- Método: POST  
- Endpoint: /api/auth/login/  

### Request
{
  "email": "user@example.com",
  "password": "string"
}

Campos:
- email (string, requerido)
- password (string, requerido)

### Response (200 OK)
{
  "access": "token",
  "refresh": "token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "admin"
  }
}

### Response (400 Bad Request)
{
  "error": "Credenciales inválidas"
}


## Refresh Token
- Método: POST  
- Endpoint: /api/auth/refresh/  

### Request
{
  "refresh": "token"
}

### Response (200 OK)
{
  "access": "new_token"
}


## Perfil de Usuario
- Método: GET  
- Endpoint: /api/auth/me/  
- Requiere autenticación: Sí  

### Response (200 OK)
{
  "id": 1,
  "name": "Usuario",
  "email": "user@example.com",
  "role": "admin",
  "company": 1
}


## Logout
- Método: POST  
- Endpoint: /api/auth/logout/  

### Request
{
  "refresh": "token"
}

### Response (200 OK)
{
  "message": "Sesión cerrada correctamente"
}


# Users

## Registro
- Método: POST  
- Endpoint: /api/users/register/  
- Requiere rol: Admin  

### Request
{
  "name": "Usuario",
  "email": "user@example.com",
  "password": "string",
  "role": "company",
  "company": 1
}

Campos:
- name (string, requerido)
- email (string, requerido, único)
- password (string, requerido)
- role (string: admin | company)
- company (integer, requerido si role=company)

### Response (201 Created)
{
  "id": 1,
  "name": "Usuario",
  "email": "user@example.com",
  "role": "company",
  "company": 1
}

### Response (400 Bad Request)
{
  "error": "El correo ya está registrado"
}


# Companies

## Listar compañías
- Método: GET  
- Endpoint: /api/companies/  

### Response (200 OK)
[
  {
    "id": 1,
    "name": "Empresa SA",
    "email": "empresa@mail.com",
    "rfc": "ABC123456XYZ",
    "active": true
  }
]


## Crear compañía
- Método: POST  
- Endpoint: /api/companies/  

### Request
{
  "name": "Empresa SA",
  "email": "empresa@mail.com",
  "rfc": "ABC123456XYZ"
}

Campos:
- name (string, requerido)
- email (string, requerido, único)
- rfc (string, requerido, formato válido)

### Response (201 Created)
{
  "id": 1,
  "name": "Empresa SA",
  "email": "empresa@mail.com",
  "rfc": "ABC123456XYZ",
  "active": true
}

### Response (400 Bad Request)
{
  "error": "RFC inválido"
}


## Obtener compañía
- Método: GET  
- Endpoint: /api/companies/{id}/  

### Response (200 OK)
{
  "id": 1,
  "name": "Empresa SA",
  "email": "empresa@mail.com",
  "rfc": "ABC123456XYZ",
  "active": true
}


## Actualizar compañía
- Método: PUT / PATCH  
- Endpoint: /api/companies/{id}/  

### Request
{
  "name": "Empresa Actualizada"
}

### Response (200 OK)
{
  "id": 1,
  "name": "Empresa Actualizada"
}


## Eliminar compañía
- Método: DELETE  
- Endpoint: /api/companies/{id}/  

### Response (200 OK)
{
  "message": "Compañía eliminada"
}


# Warehouses

## Listar almacenes
- Método: GET  
- Endpoint: /api/warehouses/  

### Response (200 OK)
[
  {
    "id": 1,
    "name": "Almacén Central",
    "city": "Cuernavaca",
    "state": "Morelos",
    "active": true
  }
]


## Crear almacén
- Método: POST  
- Endpoint: /api/warehouses/  

### Request
{
  "company": 1,
  "name": "Almacén Central",
  "address": "Av. Morelos 123",
  "city": "Cuernavaca",
  "state": "Morelos",
  "postal_code": "62000",
  "latitude": 18.920000,
  "longitude": -99.230000
}

### Response (201 Created)
{
  "id": 1,
  "name": "Almacén Central",
  "city": "Cuernavaca",
  "state": "Morelos"
}

### Response (400 Bad Request)
{
  "error": "Debes proporcionar dirección o coordenadas"
}


## Obtener almacén
- Método: GET  
- Endpoint: /api/warehouses/{id}/  

### Response (200 OK)
{
  "id": 1,
  "name": "Almacén Central",
  "address": "Av. Morelos 123"
}


## Actualizar almacén
- Método: PUT / PATCH  
- Endpoint: /api/warehouses/{id}/  

### Request
{
  "name": "Nuevo nombre"
}

### Response (200 OK)
{
  "id": 1,
  "name": "Nuevo nombre"
}


## Eliminar almacén
- Método: DELETE  
- Endpoint: /api/warehouses/{id}/  

### Response (200 OK)
{
  "message": "Almacén desactivado"
}


# Routes

## Listar rutas
- Método: GET  
- Endpoint: /api/routes/  

### Response (200 OK)
[
  {
    "id": 1,
    "company": 1,
    "warehouse": 1,
    "delivery_count": 10,
    "status": "pending"
  }
]


## Crear ruta
- Método: POST  
- Endpoint: /api/routes/create/  

### Request
{
  "company": 1,
  "warehouse": 1,
  "delivery_count": 10,
  "file": "archivo.csv",
  "file_type": "csv"
}

### Response (201 Created)
{
  "id": 1,
  "status": "pending"
}

### Response (400 Bad Request)
{
  "error": "Formato de archivo inválido"
}


## Obtener ruta
- Método: GET  
- Endpoint: /api/routes/{id}/  

### Response (200 OK)
{
  "id": 1,
  "company": 1,
  "warehouse": 1,
  "status": "completed",
  "delivery_count": 10
}


# Dashboard

## Resumen
- Método: GET  
- Endpoint: /api/dashboard/summary/  

### Response (200 OK)
{
  "total_routes": 10,
  "completed_routes": 7,
  "pending_routes": 3
}


# Documentación interactiva

Swagger UI:
/api/docs/

OpenAPI:
/api/schema/
