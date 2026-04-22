#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
BACKUP_ROOT="${BACKUP_ROOT:-/app/db/backups/full}"

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

mapfile -t TABLES < <(
  "${MYSQL_BASE[@]}" -Nse "
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='${DB_NAME}'
      AND table_type='BASE TABLE'
    ORDER BY table_name;
  "
)

if [[ ${#TABLES[@]} -eq 0 ]]; then
  echo "ERROR: No BASE TABLE tables found in database '${DB_NAME}'." >&2
  exit 1
fi

printf "Database: %s\n" "${DB_NAME}" > "${META_DIR}/manifest.txt"
printf "Generated: %s\n" "$(date -Iseconds)" >> "${META_DIR}/manifest.txt"
printf "Tables: %s\n\n" "${#TABLES[@]}" >> "${META_DIR}/manifest.txt"

for table in "${TABLES[@]}"; do
  schema_file="${TARGET_DIR}/${table}_schema.sql"
  data_file="${TARGET_DIR}/${table}_data.sql"

  echo "Backing up table: ${table}"

  "${MYSQLDUMP_BASE[@]}" \
    --skip-comments \
    --no-tablespaces \
    --single-transaction \
    --routines=false \
    --events=false \
    --triggers=true \
    --no-data \
    "${DB_NAME}" "${table}" > "${schema_file}"

  "${MYSQLDUMP_BASE[@]}" \
    --skip-comments \
    --no-tablespaces \
    --single-transaction \
    --no-create-info \
    --skip-triggers \
    --complete-insert \
    "${DB_NAME}" "${table}" > "${data_file}"

  printf "%s|%s|%s\n" "${table}" "$(basename "${schema_file}")" "$(basename "${data_file}")" >> "${META_DIR}/manifest.txt"
done

"${MYSQLDUMP_BASE[@]}" \
  --skip-comments \
  --no-tablespaces \
  --no-data \
  --routines \
  --events \
  --triggers \
  "${DB_NAME}" > "${META_DIR}/database_objects.sql"

printf "\nBackup completed successfully at: %s\n" "${TARGET_DIR}"