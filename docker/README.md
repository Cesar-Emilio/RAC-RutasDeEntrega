# RAC – Rutas de Entrega · Guía Docker

---

## Requisitos previos

| Herramienta | Versión mínima |
|-------------|---------------|
| Docker Desktop | 24 |
| Docker Compose | v2 (incluido en Docker Desktop) |

---

## Estructura de la carpeta `docker/`

```
docker/
├── .env.example        < Plantilla de variables de entorno
├── docker-compose.yml  < Orquestación de servicios
├── Dockerfile.backend  < Imagen Django / Django-Q
├── Dockerfile.frontend < Imagen Next.js (multi-stage)
└── README.md           < Esta guía
```

---

## Paso 1 – Configurar variables de entorno

```bash
cp docker/.env.example docker/.env
```

Edita `docker/.env` y rellena **todos** los valores marcados con `cambia-…`.

---

## Paso 2 – (Opcional) Habilitar Next.js standalone

Para que el `Dockerfile.frontend` funcione en modo producción, el output de Next.js
debe ser `standalone`. Añade o verifica esta línea en `frontend/next.config.ts`:

```ts
const nextConfig: NextConfig = {
  output: 'standalone',
  // … resto de tu config
};
```

---

## Paso 3 – Construir y levantar los servicios

```bash
# Desde la carpeta docker/
cd docker

# Construir imágenes (solo la primera vez o al cambiar dependencias)
docker compose build

# Levantar todos los servicios en segundo plano
docker compose up -d
```

Los servicios que se inician son:

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| `db` | 3306 | MySQL 8 |
| `backend` | 8000 | Django + Gunicorn |
| `qcluster` | — | Worker de Django-Q (`python manage.py qcluster`) |
| `frontend` | 3000 | Next.js (producción) |

---

## Paso 4 – Verificar que todo está corriendo

```bash
docker compose ps
```

Deberías ver los 4 servicios con estado `Up` (o `healthy` para `db`).

```bash
# Ver logs en tiempo real de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f qcluster
```

---

## Paso 5 – Acceder a la aplicación

| Recurso | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Django | http://localhost:8000/api/ |
| Django Admin | http://localhost:8000/admin/ |
| Swagger / OpenAPI | http://localhost:8000/api/schema/swagger-ui/ |

---

## Comandos útiles

### Crear superusuario de Django

```bash
docker compose exec backend python manage.py createsuperuser
```

### Aplicar migraciones manualmente

```bash
docker compose exec backend python manage.py migrate
```

### Abrir shell de Django

```bash
docker compose exec backend python manage.py shell
```

### Acceder a MySQL

```bash
docker compose exec db mysql -u rac_user -p rac_db
```

---

## Modo desarrollo (sin build de Next)

Si quieres correr el frontend en modo **dev** (con hot-reload) sin necesidad del
build de producción, puedes sobreescribir el entrypoint desde la línea de comandos:

```bash
# Solo base de datos + backend + qcluster
docker compose up -d db backend qcluster

# Frontend local (fuera de Docker)
cd ../frontend
npm install
npm run dev
```

---

## Detener y limpiar

```bash
# Detener servicios (conserva volúmenes y datos)
docker compose down

# Detener y eliminar volúmenes (¡borra la base de datos!)
docker compose down -v

# Eliminar imágenes generadas
docker compose down --rmi local
```

---

## Notas sobre Django-Q (`qcluster`)

El servicio `qcluster` ejecuta `python manage.py qcluster` y comparte la misma
imagen que el backend. Utiliza la tabla de la base de datos como broker (`orm: 'default'`),
por lo que no requiere Redis ni ningún broker externo.

Si necesitas cambiar el número de workers o el timeout, edita `Q_CLUSTER` en
`backend/config/settings/base.py` (sin cambios en Docker).

---

## Solución de problemas frecuentes

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| `backend` falla al iniciar | DB aún no lista | Docker Compose reintenta; espera unos segundos |
| `django.db.OperationalError` | Credenciales incorrectas | Revisa `DB_USER`, `DB_PASSWORD` en `docker/.env` |
| Puerto 3000/8000 ocupado | Otro proceso usa ese puerto | Cambia el puerto en `docker-compose.yml` |
| `next.config.ts` sin `standalone` | Build del frontend falla | Añade `output: 'standalone'` (ver Paso 2) |
| Tareas de Django-Q no se ejecutan | `qcluster` caído | `docker compose restart qcluster` |
