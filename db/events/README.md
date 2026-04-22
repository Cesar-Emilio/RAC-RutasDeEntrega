# Eventos de respaldo (Bash)

Este directorio incluye un script de respaldo completo por tabla:

- `rac_full_backup_event.sh`

## Que genera

Por cada tabla base de la BD genera **dos archivos SQL**:

- `<tabla>_schema.sql` (estructura)
- `<tabla>_data.sql` (datos)

Tambien genera metadata en `_meta/`:

- `manifest.txt`
- `database_objects.sql`

## Ejecucion manual

```bash
DB_HOST=127.0.0.1 DB_PORT=3306 DB_NAME=rac_db DB_USER=root DB_PASSWORD=tu_password ./db/events/rac_full_backup_event.sh
```

## Programarlo como evento (cron diario 02:00)

```bash
crontab -e
```

Agregar:

```cron
0 2 * * * DB_NAME=rac_db DB_USER=root DB_PASSWORD=tu_password /ruta/al/proyecto/db/events/rac_full_backup_event.sh >> /ruta/al/proyecto/db/backups/backup.log 2>&1
```

Salida esperada:

- `db/backups/full/<db>_<timestamp>/`
- Dentro de esa carpeta, 2 archivos por tabla.
