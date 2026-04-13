# RAC API Documentation

## Base URL
http://127.0.0.1:8000/api/

---

## Autenticación

La API utiliza JSON Web Tokens (JWT).

Para acceder a endpoints protegidos se debe enviar el token en el header:

Authorization: Bearer <token>

---

## Auth

### Login
- Método: POST
- Endpoint: /api/auth/login/
- Descripción: Autentica a un usuario y devuelve tokens JWT.

Request:
{
  "email": "user@example.com",
  "password": "123456"
}

Response:
{
  "access": "token",
  "refresh": "token",
  "user": {}
}

---

### Refresh Token
- Método: POST
- Endpoint: /api/auth/refresh/
- Descripción: Genera un nuevo access token usando refresh token.

Request:
{
  "refresh": "token"
}

Response:
{
  "access": "new_token"
}

---

### Perfil de Usuario
- Método: GET
- Endpoint: /api/auth/me/
- Requiere autenticación: Sí

Response:
{
  "id": 1,
  "email": "user@example.com",
  "role": "admin"
}

---

### Logout
- Método: POST
- Endpoint: /api/auth/logout/
- Requiere autenticación: Sí

Request:
{
  "refresh": "token"
}

---

### Google Login
- Método: GET
- Endpoint: /api/auth/google/
- Descripción: Redirige al usuario a Google OAuth.

---

### Google Callback
- Método: GET
- Endpoint: /api/auth/google/callback/
- Descripción: Procesa la autenticación con Google y redirige al frontend.

---

## Users

### Registro
- Método: POST
- Endpoint: /api/users/register/
- Requiere rol: Admin

Request:
{
  "email": "user@example.com",
  "password": "123456",
  "role": "user"
}

---

## Companies

### Listar compañías
- Método: GET
- Endpoint: /api/companies/

### Crear compañía
- Método: POST
- Endpoint: /api/companies/

### Obtener compañía
- Método: GET
- Endpoint: /api/companies/{id}/

### Actualizar compañía
- Método: PUT / PATCH
- Endpoint: /api/companies/{id}/

### Eliminar compañía
- Método: DELETE
- Endpoint: /api/companies/{id}/

---

## Warehouses

### Listar almacenes
- Método: GET
- Endpoint: /api/warehouses/

### Crear almacén
- Método: POST
- Endpoint: /api/warehouses/

### Obtener almacén
- Método: GET
- Endpoint: /api/warehouses/{id}/

### Actualizar almacén
- Método: PUT / PATCH
- Endpoint: /api/warehouses/{id}/

### Eliminar (desactivar) almacén
- Método: DELETE
- Endpoint: /api/warehouses/{id}/

---

## Routes / Deliveries

### Listar rutas
- Método: GET
- Endpoint: /api/routes/

### Crear ruta
- Método: POST
- Endpoint: /api/routes/create/

Request:
{
  "company": 1,
  "warehouse": 1,
  "delivery_count": 10,
  "file": "archivo.csv",
  "file_type": "CSV"
}

### Obtener detalle de ruta
- Método: GET
- Endpoint: /api/routes/{id}/

---

## Dashboard

### Resumen
- Método: GET
- Endpoint: /api/dashboard/summary/

---

## Documentación interactiva

Swagger UI disponible en:
/api/docs/

Schema OpenAPI:
/api/schema/