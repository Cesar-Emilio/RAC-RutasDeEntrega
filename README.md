# RAC — Plataforma de Gestión de Rutas de Entrega

Sistema web que permite calcular rutas óptimas de entrega para una flota de vehículos, a partir de un conjunto de direcciones proporcionadas por empresas, utilizando algoritmos de búsqueda de caminos (Dijkstra y A\*).

El sistema genera rutas visualizables en mapas interactivos y archivos descargables con los resultados.

---

## Objetivo

Desarrollar un sistema modular, escalable y eficiente para el cálculo de rutas óptimas, con:

- Procesamiento eficiente
- Arquitectura desacoplada
- Visualización clara
- Escalabilidad futura para múltiples vehículos

---

## Características principales

### Gestión de usuarios y empresas
- Autenticación mediante JWT
- Roles: Administrador y Empresa
- CRUD completo de empresas

### Gestión de consultas
- Carga de archivos con múltiples direcciones
- Definición de punto inicial
- Historial de consultas

### Procesamiento de rutas
- Algoritmos:
        - Dijkstra
        - A*
- Generación de rutas óptimas
- Exportación de resultados

### Visualización
- Mapas interactivos
- Visualización clara de trayectos

# Fases del desarrollo

El sistema sigue el ciclo de vida del software **SDLC**, compuesto por las siguientes fases:

## 1. Análisis de requerimientos

En esta fase se identifican las necesidades del sistema y las funcionalidades requeridas mediante investigación, entrevistas y análisis del problema.

Documentación generada:

* Documento formal de requisitos
* Project Charter
* Modelado de amenazas

---

## 2. Diseño del sistema

En esta fase se define la arquitectura del sistema, el modelo de base de datos y el diseño de las interfaces.

Documentación generada:

* Modelo Entidad-Relación
* Prototipos de interfaz de usuario

---

## 3. Desarrollo

Durante esta fase se implementa el sistema conforme a las especificaciones definidas.

Se desarrollan:

* Backend
* Frontend
* APIs
* Base de datos
* Mecanismos de seguridad

Documentación generada:

* Código fuente documentado
* Repositorio del proyecto
* Registro de cambios

---

## 4. Pruebas

En esta fase se valida el correcto funcionamiento del sistema mediante diferentes tipos de pruebas.

Tipos de pruebas aplicadas:

* Pruebas unitarias
* Pruebas de integración
* Pruebas funcionales
* Pruebas de seguridad
* Pruebas de rendimiento

---

## 5. Despliegue

En esta fase se realiza la implementación del sistema en un entorno de producción y se ejecutan pruebas de carga para validar el comportamiento del sistema.

---

# Arquitectura del sistema

El sistema utiliza una **arquitectura cliente-servidor**, separando las responsabilidades entre frontend y backend.

Frontend
Se encarga de la interfaz de usuario, la presentación de la información y la interacción con el sistema.

Backend
Gestiona la lógica de negocio, el procesamiento de datos y el acceso a la base de datos.

La comunicación entre ambos se realiza mediante **APIs REST usando HTTP y JSON**.

```
Frontend (Next.js + React)
        │
        │ HTTP / JSON
        ▼
Backend (Django REST)
        │
        ▼
Base de datos (MySQL)
```

---

# Tecnologías utilizadas

## Backend

* Python **3.14.2**
* Django **5.0**
* Django REST Framework
* bcrypt **5.0.0**
* python-jwt **2.11.0**
* django-cors-headers
* Django ORM

---

## Frontend

* React **19.2.3**
* Next.js **16.1.6**
* TypeScript **5.9.3**
* Axios **1.13.5**
* Axios Interceptors
* JWT Decode

---

## Base de datos

* MySQL **8.0**

---

## Control de versiones

* Git **> 2.44**
* GitHub

---

## Protocolos y estándares

* HTTP REST
* JSON
* JSON Web Tokens (JWT — RFC 7519)

---

# Estructura del proyecto

```
RAC-RutasDeEntrega

backend
│
├── apps
│   ├── administration
│   ├── authorization
│   ├── companies
│   ├── deliveries
│   └── warehouses
│
├── config
│   ├── settings
│   │   └── base.py
│   ├── urls.py
│   └── wsgi.py
│
├── manage.py

frontend
│
├── app
├── components
├── hooks
├── lib
├── services
├── public

.env.example
README.md
```

---

# Variables de entorno

El sistema utiliza variables de entorno para almacenar configuraciones sensibles.

Para configurar el proyecto se debe copiar el archivo de ejemplo:

```
cp .env.example .env
```

Luego se deben completar las variables correspondientes.

Variables requeridas para Google OAuth (backend)

```
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback/
FRONTEND_BASE_URL=http://localhost:3000
```

---

# Configuración del Backend

Entrar a la carpeta backend

```
cd backend
```

Crear entorno virtual

```
python -m venv venv
```

Activar entorno virtual

Windows

```
venv\Scripts\activate
```

Instalar dependencias

```
pip install -r requirements.txt
pip install cryptography
```

Aplicar migraciones

```
python manage.py migrate
```

Crear usuarios demo (opcional)

```
python manage.py shell
```

Dentro del shell:

```
from apps.users.models import User
from apps.companies.models import Company

company, _ = Company.objects.get_or_create(
        rfc="RAC123456ABC",
        defaults={"name": "RAC Demo", "active": True},
)

User.objects.get_or_create(
        email="empresa@rac.com",
        defaults={
                "name": "Empresa Demo",
                "role": "company",
                "company": company,
                "active": True,
        },
)

admin, _ = User.objects.get_or_create(
        email="admin@rac.com",
        defaults={
                "name": "Admin RAC",
                "role": "admin",
                "is_staff": True,
                "is_superuser": True,
                "active": True,
        },
)

admin.set_password("Empresa2026!")
admin.save()
```

Ejecutar servidor

```
python manage.py runserver
```

Servidor disponible en

```
http://127.0.0.1:8000
```

---

# Endpoints de autenticación

```
POST /api/auth/login/
POST /api/auth/refresh/
GET  /api/auth/me/
POST /api/auth/logout/
GET  /api/auth/google/login/
GET  /api/auth/google/callback/
```

Formato de respuesta estándar

```
{
        "status": "success" | "error",
        "message": "...",
        "data": { ... } | null,
        "errors": { ... } | null
}
```

---

# Inicio rápido

```
python manage.py migrate
python manage.py shell
python manage.py runserver
```

---

# Configuración del Frontend

Entrar a la carpeta frontend

```
cd frontend
```

Instalar dependencias

```
npm install
```

Ejecutar servidor

```
npm run dev
```

Aplicación disponible en

```
http://localhost:3000
```

---

# Estándar de nombramiento

Para mantener consistencia en el código se utilizan las siguientes convenciones:

camelCase
Para variables y funciones.

PascalCase
Para clases y componentes.

snake_case
Para nombres de campos en la base de datos.

kebab-case
Para nombres de archivos y rutas.

Se utilizan nombres descriptivos y semánticamente claros.

---

# Estándar de URLs

Las APIs del backend siguen un diseño orientado a recursos.

Formato general:

```
/api/<recurso>
```

Ejemplos:

```
/api/companies
/api/deliveries
/api/warehouses
```

Las rutas del frontend representan vistas del sistema:

```
/login
/dashboard
/deliveries
```

---

# Seguridad en el desarrollo

El sistema integra medidas de seguridad durante todas las fases del desarrollo.

## Validación de datos

Todos los datos recibidos son validados tanto en frontend como backend para prevenir ataques como:

* XSS
* Inyección de código
* Manipulación de parámetros

## Autenticación

El sistema utiliza **JSON Web Tokens (JWT)** para autenticar usuarios.

## Seguridad de contraseñas

Las contraseñas se almacenan utilizando algoritmos de **hash seguro (bcrypt)**.

## Seguridad en base de datos

Se utilizan consultas seguras mediante **Django ORM** para prevenir ataques de inyección SQL.

---

# Uso de GitHub

El proyecto utiliza GitHub para el control de versiones y colaboración entre los desarrolladores.

## Ramas del proyecto

master
Contiene la versión estable del sistema.

develop/<module>
Ramas utilizadas para desarrollar nuevas funcionalidades.

fix/<module>
Ramas utilizadas para corregir errores.

---

# Convención de commits

El proyecto utiliza el estándar **Conventional Commits**.

Formato:

```
type(scope): descripción
```

Tipos de commit utilizados:

feat → nueva funcionalidad
fix → corrección de errores
docs → cambios en documentación
style → cambios de formato
refactor → reestructuración del código
test → pruebas
chore → configuración o mantenimiento

Ejemplos:

```
feat(auth): implementar autenticación JWT
fix(routes): corregir cálculo de rutas
docs(readme): actualizar documentación
chore(config): configuración inicial del proyecto
```

---

# Desarrollo y consumo de APIs

El sistema implementa **APIs REST** para la comunicación entre frontend y backend.

Métodos HTTP utilizados:

GET → consulta de información
POST → creación de recursos
PUT / PATCH → actualización de datos
DELETE → eliminación de recursos

El frontend consume las APIs mediante **Axios**.

---

# Aseguramiento de calidad de software

El proyecto implementa mecanismos de control de calidad durante todo el desarrollo.

Tipos de pruebas aplicadas:

* Pruebas unitarias
* Pruebas de integración
* Pruebas funcionales
* Pruebas de seguridad
* Pruebas de rendimiento

Además se aplican prácticas como:

* Revisión de código
* Uso de estándares de codificación
* Refactorización continua
* Control de calidad del código
>>>>>>> Stashed changes
