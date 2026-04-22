# Smart Route Planner — RAC (Rutas de Entrega)

> Sistema web para la **gestión y optimización de rutas de entrega** orientado a empresas de distribución logística.

![Django](https://img.shields.io/badge/Django-6.0.2-092E20?style=flat&logo=django&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16.1.6-000000?style=flat&logo=next.js&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql&logoColor=white)

---

## 1. Descripción general

### ¿Qué problema resuelve?

Las empresas de distribución gestionan decenas o cientos de puntos de entrega a diario sin ninguna herramienta centralizada. RAC permite subir un archivo de direcciones (CSV, JSON o XLSX), calcular automáticamente la ruta óptima entre ellas usando algoritmos de grafos (k-opt con NetworkX), y visualizar el resultado en un mapa interactivo. Además, centraliza la administración de empresas, almacenes y usuarios bajo un sistema de roles.

### Roles del sistema

| Rol | Descripción |
|-----|-------------|
| **Administrador (`admin`)** | Usuario de plataforma con acceso total. Gestiona empresas, invita operadores, consulta el dashboard global con métricas agregadas de todas las empresas y almacenes. |
| **Empresa asociada (`company`)** | Usuario vinculado a una empresa específica. Gestiona los almacenes propios, crea y consulta rutas de entrega, y accede a su propio dashboard con métricas de su empresa. |

### Flujo principal del sistema

```
1. El Administrador crea una Empresa en el panel de administración.
2. El Administrador envía una invitación por correo electrónico al operador de la empresa.
3. El operador completa su registro mediante el token incluido en el correo.
4. El usuario tipo Empresa inicia sesión con credenciales o con Google OAuth.
5. El usuario crea o selecciona un Almacén (punto de origen de la ruta).
6. El usuario sube un archivo de entregas (CSV / JSON / XLSX) con las direcciones destino.
7. El backend encola el procesamiento asíncrono con Django-Q2.
8. El worker geocodifica las direcciones, construye un grafo de distancias y aplica k-opt.
9. La solución óptima se persiste en base de datos (RouteSolution + RouteSolutionDetail).
10. El usuario visualiza la ruta optimizada en el mapa interactivo (Leaflet + OpenRouteService).
```

### Funcionalidades principales

- **Autenticación:** Login con email/contraseña o Google OAuth 2.0; tokens JWT (access + refresh).
- **Gestión de empresas:** CRUD completo con búsqueda por nombre, email y RFC. Activar/desactivar usuario asociado.
- **Gestión de almacenes:** CRUD con validación geográfica (coordenadas dentro del territorio mexicano), borrado lógico (soft-delete) y toggle de estado.
- **Optimización de rutas:** Procesamiento asíncrono de rutas a partir de archivos de entregas; algoritmo k-opt sobre grafo de distancias.
- **Dashboard diferenciado:** Métricas en tiempo real según el rol del usuario autenticado.
- **Trazabilidad:** Logs estructurados con Loguru (debug / info / warning / error / critical) y auditoría de peticiones.
- **Documentación API:** Swagger UI auto-generado con drf-spectacular (`/api/docs/`).

---

## 2. Arquitectura del sistema

```
                        ┌──────────┐
       Usuario ────────▶│  Nginx   │ :80 / :443
                        │ 1.25-alp │
                        └────┬─────┘
                 ┌───────────┴───────────┐
                 ▼                       ▼
         ┌──────────────┐       ┌──────────────┐
         │  Django REST │       │   Next.js    │
         │  + Gunicorn  │       │   (App)      │
         │  :8000       │       │   :3000      │
         └──────┬───────┘       └──────────────┘
                │
         ┌──────▼───────┐      ┌──────────────┐
         │    MySQL     │      │  Django-Q2   │
         │    8.0       │      │  (Worker)    │
         └──────────────┘      └──────────────┘
```

### Explicación de cada servicio

| Servicio | Imagen / Base | Rol en el sistema |
|----------|---------------|-------------------|
| **Nginx** | `nginx:1.25-alpine` | Reverse proxy. Redirige `/api/*` al backend y `/` al frontend. Gestiona TLS/SSL con Certbot y bloquea conexiones directas por IP. |
| **Django REST + Gunicorn** | `python:3.12-slim` | API REST. Contiene toda la lógica de negocio, modelos y endpoints. Gunicorn corre 4 workers para concurrencia. |
| **Django-Q2 Worker** | `python:3.12-slim` | Proceso separado que ejecuta tareas asíncronas: geocodificación de direcciones y cálculo de rutas óptimas. |
| **Next.js** | `node:20-alpine` | Interfaz de usuario. SPA compilada en modo standalone para producción. |
| **MySQL** | `mysql:8.0` | Base de datos relacional con volumen persistente (`rac_mysql_data`). |

### Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend framework | Django | 6.0.2 |
| API toolkit | Django REST Framework | 3.16.1 |
| Autenticación JWT | djangorestframework-simplejwt | 5.5.1 |
| Servidor WSGI | Gunicorn | 25.3.0 |
| Tareas asíncronas | Django-Q2 | 1.9.0 |
| Optimización de grafos | NetworkX | 3.6.1 |
| Logging | Loguru | 0.7.3 |
| Documentación API | drf-spectacular | 0.29.0 |
| Base de datos | MySQL | 8.0 |
| ORM driver | mysqlclient | 2.2.8 |
| Frontend framework | Next.js | 16.1.6 |
| UI library | React | 19.2.3 |
| Lenguaje frontend | TypeScript | ^5 |
| Estilos | TailwindCSS | ^4.2.1 |
| HTTP client | Axios | ^1.15.0 |
| Validación frontend | Zod | ^4.3.6 |
| Mapas | Leaflet + react-leaflet | 1.9.4 / ^5.0.0 |
| Reverse proxy | Nginx | 1.25-alpine |
| Contenedores | Docker + Compose | — |
| Python runtime (contenedor) | python | 3.12-slim |
| Node runtime (contenedor) | node | 20-alpine |

---

## 3. Estructura del repositorio

```
RAC-RutasDeEntrega/
│
├── backend/                         ← Django 6 + Gunicorn (API REST)
│   ├── apps/
│   │   ├── administration/          ← Dashboard y resumen de métricas
│   │   ├── audit/                   ← Middleware de auditoría de peticiones
│   │   ├── authorization/           ← Login, logout, refresh, Google OAuth
│   │   ├── companies/               ← CRUD de empresas e invitaciones
│   │   ├── deliveries/              ← Rutas de entrega y optimización
│   │   ├── users/                   ← Registro y modelo de usuario personalizado
│   │   └── warehouses/              ← CRUD y gestión de almacenes
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py              ← Configuración común
│   │   │   ├── dev.py               ← Overrides para desarrollo local
│   │   │   └── prod.py              ← Overrides para producción
│   │   ├── interceptor.py           ← Handler de Loguru para Django logging
│   │   ├── logging_utils.py         ← Helpers de logging estructurado
│   │   ├── middleware.py            ← Middleware de logging de requests
│   │   ├── payloadEncryption.py     ← Middleware de cifrado de payload
│   │   ├── renderers.py             ← Renderer de respuesta unificada
│   │   ├── urls.py                  ← Router principal y registro de ViewSets
│   │   └── wsgi.py
│   ├── routes/                      ← Algoritmos de optimización de rutas
│   ├── utils/                       ← Helpers: response_helper, gmail_backend
│   ├── logs/                        ← Archivos de log (debug/info/warning/error/critical)
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                        ← Next.js 16 (SPA)
│   ├── app/
│   │   ├── admin/                   ← Páginas del rol administrador
│   │   │   ├── dashboard/           ← Dashboard global
│   │   │   ├── companies/           ← Gestión de empresas
│   │   │   ├── deliveries/          ← Histórico de entregas (admin)
│   │   │   └── routes/              ← Rutas (admin)
│   │   ├── company/                 ← Páginas del rol empresa
│   │   │   ├── dashboard/           ← Dashboard de empresa
│   │   │   ├── warehouses/          ← Gestión de almacenes
│   │   │   ├── new-warehouses/      ← Crear almacén
│   │   │   ├── deliveries/          ← Historial de entregas
│   │   │   └── new-delivery/        ← Crear nueva entrega
│   │   ├── auth/                    ← Callback de Google OAuth
│   │   ├── login/                   ← Página de inicio de sesión
│   │   ├── logout/                  ← Cierre de sesión
│   │   └── register/                ← Completar registro por token
│   ├── components/                  ← Componentes reutilizables
│   ├── lib/                         ← Configuración de Axios e instancias HTTP
│   ├── schemas/                     ← Esquemas de validación Zod
│   ├── types/                       ← Tipos TypeScript globales
│   ├── public/                      ← Activos estáticos
│   ├── package.json
│   └── .env.example
│
├── docker/                          ← Infraestructura de contenedores
│   ├── Dockerfile.backend           ← Imagen Python 3.12-slim
│   ├── Dockerfile.frontend          ← Imagen Node 20-alpine (multi-stage)
│   ├── docker-compose.yml           ← Orquestación de 5 servicios
│   ├── nginx/
│   │   └── nginx.conf               ← Reverse proxy con TLS/SSL
│   └── .env.example                 ← Plantilla de variables de entorno
│
├── db/                              ← Scripts SQL o fixtures de base de datos
├── postman/                         ← Colección de Postman para la API
├── testfiles/                       ← Archivos de prueba (CSV / JSON / XLSX)
├── generate_mapa_sitio.py           ← Script para generar mapa técnico del site
├── mapa_sitio_tecnico.xlsx          ← Mapa técnico generado
├── GUIA_EJECUCION_BACK_FRONT_OAUTH.txt
└── README.md
```

---

## 4. Requisitos del sistema

### Software requerido

| Herramienta | Versión mínima recomendada |
|-------------|---------------------------|
| Sistema operativo | Windows 10 / Ubuntu 20.04 / macOS 12 |
| Git | ≥ 2.44 |
| Python | 3.12 |
| Node.js | 20 LTS |
| npm | 10+ |
| Docker Engine | 24+ |
| Docker Compose | v2.20+ |
| MySQL (manual) | 8.0 (solo sin Docker) |

### Variables de entorno necesarias

Existen **dos archivos `.env.example`** en el repositorio:

1. `docker/.env.example` → usado por `docker-compose.yml` (entorno containerizado)
2. `backend/.env.example` → usado por el backend en modo manual

Copiar el archivo correspondiente y completar los valores antes de ejecutar cualquier servicio.

---

## 5. Instalación y despliegue local

### Vía 1 — Con Docker Compose (recomendada)

```bash
# 1. Clonar el repositorio
git clone https://github.com/Cesar-Emilio/RAC-RutasDeEntrega.git
cd RAC-RutasDeEntrega

# 2. Configurar variables de entorno para Docker
cp docker/.env.example docker/.env
# Editar docker/.env con los valores correctos

# 3. Levantar todos los servicios
cd docker
docker compose up -d --build

# 4. Aplicar migraciones (se ejecutan automáticamente al iniciar el backend,
#    pero también se pueden forzar manualmente)
docker exec -it rac_backend python manage.py migrate

# 5. Crear superusuario administrador
docker exec -it rac_backend python manage.py createsuperuser
```

#### URLs de acceso

| Servicio | URL |
|----------|-----|
| Frontend (Next.js) | http://localhost (puerto 80 vía Nginx) |
| Backend API | http://localhost/api/ |
| Documentación Swagger | http://localhost/api/docs/ |
| Backend directo (desarrollo) | http://localhost:8000/api/ |

---

### Vía 2 — Sin Docker (manual)

#### Backend

```bash
# 1. Entrar a la carpeta del backend
cd backend

# 2. Crear el entorno virtual de Python
python -m venv venv

# 3. Activar el entorno virtual
# Windows (PowerShell):
venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# 4. Instalar dependencias
pip install -r requirements.txt

# 5. Configurar variables de entorno
cp .env.example .env
# Editar .env con los datos de conexión a MySQL local

# 6. Aplicar migraciones
python manage.py migrate

# 7. Crear superusuario administrador
python manage.py createsuperuser

# 8. Iniciar el worker de tareas asíncronas en una segunda terminal
python manage.py qcluster

# 9. Levantar servidor de desarrollo
python manage.py runserver
# API disponible en: http://127.0.0.1:8000/api/
```

#### Frontend

```bash
# En una nueva terminal
cd frontend

# 1. Configurar variables de entorno del frontend
cp .env.example .env.local
# Editar .env.local: NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# 2. Instalar dependencias
npm install

# 3. Levantar servidor de desarrollo
npm run dev
# Aplicación disponible en: http://localhost:3000
```

---

## 6. Despliegue en producción (AWS EC2)

### Configuración recomendada de la instancia

| Parámetro | Valor sugerido |
|-----------|---------------|
| AMI | Ubuntu Server 22.04 LTS |
| Tipo de instancia | c7i-flex.large |
| Almacenamiento | 20 GB gp3 |
| Puertos (Security Group) | 22 (SSH), 80 (HTTP), 443 (HTTPS) |

### Instalación de Docker en la instancia

```bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Verificar instalación
docker --version
docker compose version
```

### Clonar el repositorio y configurar entorno

```bash
git clone https://github.com/Cesar-Emilio/RAC-RutasDeEntrega.git
cd RAC-RutasDeEntrega/docker

# Copiar y editar variables de producción
cp .env.example .env
nano .env
# Configurar: dominio, claves secretas, credenciales de DB, Google OAuth, etc.
```

### Levantar los servicios

```bash
cd RAC-RutasDeEntrega/docker
docker compose up -d --build

# Verificar que todos los contenedores estén corriendo
docker compose ps

# Ver logs en tiempo real
docker compose logs -f
```

### Configuración de HTTPS con Certbot

```bash
# Instalar Certbot
sudo apt install certbot -y

# Detener Nginx temporalmente para obtener el certificado
docker compose stop nginx

# Obtener certificado SSL
sudo certbot certonly --standalone -d rac-entregas.online -d www.rac-entregas.online

# Copiar certificados al directorio de Nginx
sudo cp /etc/letsencrypt/live/rac-entregas.online/fullchain.pem docker/nginx/certs/
sudo cp /etc/letsencrypt/live/rac-entregas.online/privkey.pem docker/nginx/certs/

# Reiniciar Nginx
docker compose start nginx
```

> **Nota:** El `nginx.conf` ya incluye la redirección automática HTTP → HTTPS y bloqueo de acceso directo por IP.

---

## 7. Variables de entorno

Las variables se dividen en dos archivos según el contexto de ejecución.

### `docker/.env` — Entorno containerizado

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Clave secreta de Django | `cambiar-por-clave-aleatoria-larga` |
| `SECRET_KEY` | Alias de `DJANGO_SECRET_KEY` | `cambiar-por-clave-aleatoria-larga` |
| `DEBUG` | Modo debug (`True` solo en desarrollo) | `False` |
| `ALLOWED_HOSTS` | Hosts permitidos por Django, separados por coma | `rac-entregas.online,www.rac-entregas.online` |
| `DB_NAME` | Nombre de la base de datos | `rac_db` |
| `DB_USER` | Usuario de MySQL | `rac_user` |
| `DB_PASSWORD` | Contraseña del usuario de MySQL | `password-seguro` |
| `DB_ROOT_PASSWORD` | Contraseña root de MySQL (solo Docker) | `root-password-seguro` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos para CORS | `https://rac-entregas.online` |
| `FRONTEND_BASE_URL` | URL base del frontend | `https://rac-entregas.online` |
| `FRONTEND_URL` | URL del frontend (para emails) | `https://rac-entregas.online` |
| `JWT_SECRET_KEY` | Clave secreta para firmar JWTs | `clave-jwt-segura` |
| `JWT_ALGORITHM` | Algoritmo de firma JWT | `HS256` |
| `JWT_EXP_DELTA_SECONDS` | Duración del token de acceso en segundos | `3600` |
| `LOGIN_THROTTLE_RATE` | Límite de intentos de login | `3/min` |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth 2.0 | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google OAuth 2.0 | `GOCSPX-xxx` |
| `GOOGLE_REDIRECT_URI` | URI de callback OAuth | `https://dominio/api/auth/google/callback/` |
| `GOOGLE_EMAIL_USER` | Correo del remitente (Gmail API) | `noreply@utez.edu.mx` |
| `GOOGLE_EMAIL_APP_PASSWORD` | App Password de Gmail | `xxxx xxxx xxxx xxxx` |
| `GOOGLE_CREDENTIALS_PATH` | Ruta al JSON de credenciales de Google | `/app/google-credentials.json` |
| `NEXT_PUBLIC_API_URL` | URL base de la API (build-time Next.js) | `https://rac-entregas.online` |
| `NEXT_PUBLIC_ORS_API_KEY` | API Key de OpenRouteService (mapas) | `tu-ors-api-key` |

---

## 8. API — Endpoints principales

> La documentación interactiva completa está disponible en `/api/docs/` (Swagger UI).

### Autenticación — `/api/auth/`

| Método | Ruta | Descripción | Rol requerido |
|--------|------|-------------|---------------|
| `POST` | `/api/auth/login/` | Iniciar sesión con email y contraseña. Retorna access + refresh tokens. | Público |
| `POST` | `/api/auth/refresh/` | Renovar el token de acceso usando el refresh token. | Público |
| `GET` | `/api/auth/me/` | Obtener información del usuario autenticado. | Autenticado |
| `POST` | `/api/auth/logout/` | Invalidar la sesión actual. | Autenticado |
| `GET` | `/api/auth/google/login/` | Iniciar flujo de autenticación con Google OAuth 2.0. | Público |
| `GET` | `/api/auth/google/callback/` | Callback de Google OAuth. Genera tokens JWT. | Público |

### Usuarios — `/api/`

| Método | Ruta | Descripción | Rol requerido |
|--------|------|-------------|---------------|
| `POST` | `/api/users/register/` | Crear cuenta de administrador. | Público |
| `POST` | `/api/register/<token>/` | Completar registro mediante token de invitación. | Público (token válido) |

### Empresas — `/api/companies/`

| Método | Ruta | Descripción | Rol requerido |
|--------|------|-------------|---------------|
| `GET` | `/api/companies/` | Listar todas las empresas. Acepta `?search=`. | Admin |
| `POST` | `/api/companies/` | Crear nueva empresa. | Admin |
| `GET` | `/api/companies/<id>/` | Detalle de una empresa. | Admin |
| `PUT` | `/api/companies/<id>/` | Actualizar empresa completa. | Admin |
| `PATCH` | `/api/companies/<id>/` | Actualizar campos parciales (incluye toggle de usuario). | Admin |
| `DELETE` | `/api/companies/<id>/` | Eliminar empresa. | Admin |
| `POST` | `/api/companies/invite/` | Enviar correo de invitación a operador de empresa. | Admin |

### Almacenes — `/api/warehouses/`

| Método | Ruta | Descripción | Rol requerido |
|--------|------|-------------|---------------|
| `GET` | `/api/warehouses/` | Listar almacenes de la empresa. Acepta `?active=true\|false`. | Company |
| `POST` | `/api/warehouses/` | Crear nuevo almacén. Se asocia automáticamente a la empresa del usuario. | Company |
| `GET` | `/api/warehouses/<id>/` | Detalle de un almacén. | Company |
| `PUT` | `/api/warehouses/<id>/` | Actualizar almacén completo. | Company |
| `PATCH` | `/api/warehouses/<id>/` | Actualizar campos parciales del almacén. | Company |
| `DELETE` | `/api/warehouses/<id>/` | Desactivar almacén (borrado lógico, `active=False`). | Company |
| `PATCH` | `/api/warehouses/<id>/toggle/` | Alternar estado activo/inactivo del almacén. | Company |

### Rutas de entrega — `/api/deliveries/`

| Método | Ruta | Descripción | Rol requerido |
|--------|------|-------------|---------------|
| `GET` | `/api/deliveries/` | Listar rutas. Admin ve todo; empresa ve solo las suyas. Acepta `?company=<id>`. | Admin / Company |
| `POST` | `/api/deliveries/create/` | Crear nueva ruta y encolar procesamiento. Acepta archivo CSV/JSON/XLSX. | Company |
| `GET` | `/api/deliveries/<id>/` | Detalle completo de una ruta con solución optimizada. | Admin / Company |
| `DELETE` | `/api/deliveries/<id>/delete/` | Eliminar físicamente una ruta. | Company |

### Dashboard y utilidades

| Método | Ruta | Descripción | Rol requerido |
|--------|------|-------------|---------------|
| `GET` | `/api/dashboard/summary/` | Métricas del dashboard. Respuesta diferenciada por rol. | Autenticado |
| `GET` | `/api/schema/` | Esquema OpenAPI en formato YAML. | Público |
| `GET` | `/api/docs/` | Interfaz Swagger UI interactiva. | Público |

---

## 9. Decisiones técnicas

### Por qué Django + Next.js como servicios separados (arquitectura desacoplada)

Separar el backend del frontend permite **escalar cada capa de forma independiente**. El backend puede atender múltiples clientes (web, mobile, integraciones de terceros) sin estar acoplado a una tecnología de presentación específica. Next.js, por su parte, ofrece renderizado del lado del servidor (SSR), optimización de imágenes y un sistema de enrutamiento basado en el sistema de archivos que acelera el desarrollo del frontend sin comprometer la lógica de negocio.

### Por qué Gunicorn + Nginx en lugar de solo Django `runserver`

El servidor de desarrollo de Django (`runserver`) es **monohilo, no seguro para producción y no soporta concurrencia real**. Gunicorn lanza múltiples procesos worker (configurados en 4) que atienden peticiones simultáneas. Nginx actúa como proxy inverso y se encarga de:

- Terminación TLS/SSL (HTTPS)
- Servir archivos estáticos directamente sin pasar por Python
- Balanceo de carga entre workers
- Protección contra acceso directo por IP (bloqueo con código 444)

### Por qué Docker Compose para orquestar los servicios

Docker Compose define en un único archivo (`docker-compose.yml`) los **cinco servicios del sistema** (MySQL, Django/Gunicorn, Django-Q2 worker, Next.js, Nginx) con sus dependencias, variables de entorno, volúmenes y red interna. Esto garantiza:

- **Reproducibilidad:** el entorno es idéntico en desarrollo, staging y producción.
- **Aislamiento:** cada servicio corre en su propio contenedor sin interferir con el sistema operativo del host.
- **Facilidad de despliegue:** un solo comando (`docker compose up -d --build`) levanta toda la infraestructura.
- **Healthchecks:** el backend espera a que MySQL esté disponible antes de iniciar, evitando errores de conexión en el arranque.

---

## 10. Convenciones del proyecto

### Nomenclatura de código

| Convención | Uso |
|------------|-----|
| `camelCase` | Variables y funciones |
| `PascalCase` | Clases y componentes React |
| `snake_case` | Campos de base de datos y serializers |
| `kebab-case` | Archivos, rutas URL y nombres de ramas |
| `id_resource` | Identificadores de recursos (ej. `id_company`, `id_delivery`) |

### Conventional Commits

```
<tipo>(<alcance>): <descripción>
```

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de errores |
| `docs` | Cambios en documentación |
| `style` | Cambios de formato sin lógica |
| `refactor` | Reestructuración de código |
| `test` | Pruebas unitarias o de integración |
| `chore` | Configuración o mantenimiento |

**Ejemplos:**

```bash
feat(auth): implementar autenticación con Google OAuth
fix(warehouses): corregir validación de coordenadas fuera de México
docs(readme): generar README profesional completo
refactor(deliveries): extraer lógica de geocodificación a servicio
chore(docker): añadir healthcheck a servicio de base de datos
```

### Ramas

| Rama | Propósito |
|------|-----------|
| `master` | Versión estable lista para producción (rama por defecto) |
| `feature/<modulo>` | Desarrollo de nuevas funcionalidades (ej. `feature/ui-components`, `feature/security-tests`) |
| `db/<modulo>` | Cambios relacionados a base de datos (ej. `db/constraints`) |
| `fix/<modulo>` | Corrección de errores (ej. `fix/sonar-fixes-frontend`, `fix/warehouses-responses`) |

---

## 11. Seguridad

| Mecanismo | Implementación |
|-----------|----------------|
| Autenticación | JWT con SimpleJWT (access 60 min, refresh 7 días) |
| OAuth | Google OAuth 2.0 |
| Contraseñas | Hash seguro con `django.contrib.auth` (PBKDF2 por defecto) |
| Protección SQL | Django ORM (consultas parametrizadas, sin SQL crudo) |
| CORS | `django-cors-headers` con lista de orígenes explícita |
| Rate limiting | Throttle en endpoint de login (`3/min` configurable) |
| Cifrado de payload | `PayloadEncryptionMiddleware` personalizado |
| Logs de auditoría | `AuditMiddleware` + Loguru estructurado por nivel |
| Acceso por IP | Nginx bloquea conexiones directas por IP (código 444) |
| TLS/SSL | Certbot + nginx con TLSv1.2 / TLSv1.3 |

---

## 12. Pruebas

Las pruebas están definidas en los archivos `tests.py` de cada aplicación Django.

```bash
# Ejecutar todas las pruebas
python manage.py test

# Ejecutar pruebas de un módulo específico
python manage.py test apps.deliveries
python manage.py test apps.authorization
```

Tipos de pruebas implementadas:

- **Pruebas unitarias:** validación de modelos y serializers
- **Pruebas de integración:** flujos completos de endpoints via `APIClient`
- **Pruebas funcionales:** escenarios de negocio end-to-end

---

## 13. Monitoreo y logs

Los logs del backend se almacenan en `backend/logs/` con rotación automática cada 10 MB y retención de 7 días:

| Archivo | Nivel | Contenido |
|---------|-------|-----------|
| `debug.log` | DEBUG | Información detallada de ejecución |
| `info.log` | INFO | Eventos operacionales normales |
| `warning.log` | WARNING | Situaciones inesperadas no críticas |
| `error.log` | ERROR | Errores con backtrace completo |
| `critical.log` | CRITICAL | Fallas graves del sistema |

```bash
# Ver logs en tiempo real (Docker)
docker exec -it rac_backend tail -f logs/info.log

# Ver todos los logs del contenedor
docker compose logs -f backend
```

---

*Documentación generada el 2026-04-21 | RAC — Smart Route Planner v1.0.0*
