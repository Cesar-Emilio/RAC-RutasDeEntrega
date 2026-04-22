#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
BACKUP_ROOT="${BACKUP_ROOT:-${PROJECT_ROOT}/db/backups/incremental}"

if [[ -z "${DB_NAME}" ]]; then
  echo "ERROR: DB_NAME is required." >&2
  exit 1
fi

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
TARGET_DIR="${BACKUP_ROOT}/${DB_NAME}_${TIMESTAMP}"
META_DIR="${TARGET_DIR}/_meta"

mkdir -p "${TARGET_DIR}" "${META_DIR}"


TMP_CNF="$(mktemp)"
cleanup() {
  rm -f "${TMP_CNF}"
}
trap cleanup EXIT

cat > "${TMP_CNF}" <<EOF
[client]
host=${DB_HOST}
port=${DB_PORT}
user=${DB_USER}
password=${DB_PASSWORD}
default-character-set=utf8mb4
EOF

MYSQL_BASE=(mysql --defaults-extra-file="${TMP_CNF}" --protocol=TCP)
MYSQLDUMP_BASE=(mysqldump --defaults-extra-file="${TMP_CNF}" --protocol=TCP)


LAST_BACKUP_TIMESTAMP_FILE="${PROJECT_ROOT}/db/backups/last_backup_timestamp.txt"

if [[ -f "${LAST_BACKUP_TIMESTAMP_FILE}" ]]; then
  LAST_BACKUP_TIMESTAMP=$(cat "${LAST_BACKUP_TIMESTAMP_FILE}")
else
  
  LAST_BACKUP_TIMESTAMP="1970-01-01 00:00:00"
fi

echo "Último respaldo realizado: ${LAST_BACKUP_TIMESTAMP}"


mapfile -t TABLES < <(
  "${MYSQL_BASE[@]}" -Nse "
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='${DB_NAME}' AND table_type='BASE TABLE'
    ORDER BY table_name;
  "
)

if [[ ${#TABLES[@]} -eq 0 ]]; then
  echo "ERROR: No BASE TABLE tables found in database '${DB_NAME}'." >&2
  exit 1
fi

printf "Database: %s\n" "${DB_NAME}" > "${META_DIR}/manifest.txt"
printf "Generated: %s\n" "$(date -Iseconds)" >> "${META_DIR}/manifest.txt"
printf "Tables: %s\n" "${#TABLES[@]}" >> "${META_DIR}/manifest.txt"

for table in "${TABLES[@]}"; do
  schema_file="${TARGET_DIR}/${table}_schema_incremental.sql"
  data_file="${TARGET_DIR}/${table}_data_incremental.sql"

  echo "Backing up incremental data for table: ${table}"

  
  LAST_MODIFIED_FIELD=$( "${MYSQL_BASE[@]}" -Nse "
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = '${DB_NAME}' AND TABLE_NAME = '${table}'
    AND COLUMN_NAME IN ('updated_at', 'created_at')
    LIMIT 1;
  ")

  if [[ -z "${LAST_MODIFIED_FIELD}" ]]; then
    echo "ERROR: La tabla ${table} no tiene columna 'updated_at' ni 'created_at'. No se puede hacer un respaldo incremental." >&2
    continue
  fi

  
  query="SELECT * FROM ${table} WHERE ${LAST_MODIFIED_FIELD} > '${LAST_BACKUP_TIMESTAMP}';"
  
  
  "${MYSQL_BASE[@]}" -e "$query" "${DB_NAME}" > "${data_file}"

  
  "${MYSQLDUMP_BASE[@]}" --no-data --skip-comments --set-gtid-purged=OFF --single-transaction --routines=false --events=false --triggers=true "${DB_NAME}" "${table}" > "${schema_file}"

  
  printf "%s|%s|%s\n" "${table}" "$(basename "${schema_file}")" "$(basename "${data_file}")" >> "${META_DIR}/manifest.txt"
done


echo "$(date +%Y-%m-%d\ %H:%M:%S)" > "${PROJECT_ROOT}/db/backups/last_backup_timestamp.txt"

printf "\nIncremental backup completed successfully at: %s\n" "${TARGET_DIR}"