#!/usr/bin/env bash
# Prepara el archivo .env con un JWT_SECRET aleatorio. Es seguro ejecutarlo varias veces.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env ]; then
  echo ".env ya existe, no se modifica."
  exit 0
fi

cp .env.example .env
SECRET=$(openssl rand -hex 32)
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${SECRET}|" .env
echo ".env creado con un JWT_SECRET nuevo."
