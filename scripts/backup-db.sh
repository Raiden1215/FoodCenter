#!/usr/bin/env bash
# Respaldo de la base de datos y de las fotos subidas, en la carpeta backups/ del proyecto.
# Requiere que los contenedores estén corriendo (docker compose up -d).
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p backups
SELLO=$(date +%Y%m%d_%H%M%S)

docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "backups/foodcenter_${SELLO}.sql"
echo "Base de datos respaldada en backups/foodcenter_${SELLO}.sql"

if [ -d backend/uploads ]; then
  tar czf "backups/uploads_${SELLO}.tar.gz" backend/uploads
  echo "Fotos respaldadas en backups/uploads_${SELLO}.tar.gz"
fi
