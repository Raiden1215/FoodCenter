#!/usr/bin/env bash
# Restaura la base de datos desde un respaldo .sql. REEMPLAZA los datos actuales.
# Uso: ./scripts/restore-db.sh backups/foodcenter_YYYYMMDD_HHMMSS.sql
set -euo pipefail
cd "$(dirname "$0")/.."

if [ $# -ne 1 ] || [ ! -f "$1" ]; then
  echo "Uso: ./scripts/restore-db.sh backups/<archivo>.sql"
  exit 1
fi

read -rp "Esto reemplaza los datos actuales de la base de datos. ¿Continuar? (s/N) " RESPUESTA
[ "$RESPUESTA" = "s" ] || { echo "Cancelado."; exit 0; }

docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$POSTGRES_DB\" WITH (FORCE)" -c "CREATE DATABASE \"$POSTGRES_DB\""'
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"' < "$1"
echo "Restauración completada. Reinicia el backend: docker compose restart backend"
