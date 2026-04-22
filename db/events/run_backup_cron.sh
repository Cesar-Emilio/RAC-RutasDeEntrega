#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="/home/ubuntu/RAC-RutasDeEntrega"
BACKUP_SCRIPT="${PROJECT_ROOT}/db/events/rac_full_backup_event.sh"
BACKUP_LOG="${PROJECT_ROOT}/db/backups/backup_cron.log"

# Crear directorio de backups si no existe
mkdir -p "${PROJECT_ROOT}/db/backups"

# Variables de entorno para la BD
export DB_HOST="127.0.0.1"
export DB_PORT="3306"
export DB_NAME="rac_db"
export DB_USER="root"
export DB_PASSWORD="root"
export BACKUP_ROOT="${PROJECT_ROOT}/db/backups/full"

# Ejecutar backup con timestamp en log
{
  echo "===== Backup iniciado: $(date '+%Y-%m-%d %H:%M:%S') ====="
  bash "${BACKUP_SCRIPT}"
  echo "===== Backup completado: $(date '+%Y-%m-%d %H:%M:%S') ====="
} >> "${BACKUP_LOG}" 2>&1

exit 0
