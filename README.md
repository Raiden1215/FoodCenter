# FoodCenter

App web (PWA) para vender y comprar comida de locales cercanos. Enfocada en Android (Chrome).

**Stack:** React + Vite + Tailwind (PWA) · Node.js + Express · PostgreSQL + Prisma · Gemini API · Docker Compose

## Primer arranque

```bash
./scripts/init.sh                 # crea .env con un JWT_SECRET aleatorio
docker compose up --build         # primera vez (descarga imágenes e instala dependencias)
docker compose exec backend npx prisma migrate dev --name init   # crea las tablas (solo la primera vez)
```

| Servicio  | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:5173        |
| API       | http://localhost:4000/api/health |
| PostgreSQL| localhost:5432 (usuario/clave del `.env`) |
| Mailpit (correos de desarrollo) | http://localhost:8025 |

Si en la pantalla Principal aparece **"Sistema OK"**, frontend, API y base de datos están conectados.

## Día a día

```bash
docker compose up -d              # arrancar en segundo plano
docker compose logs -f backend    # ver logs (o frontend, db)
docker compose down               # detener (los datos de la BD se conservan)
```

El código de `backend/` y `frontend/` se recarga solo al guardar.

**Instalar una dependencia nueva** (se instala dentro del contenedor y queda en `package.json`):

```bash
docker compose exec backend npm install <paquete>
docker compose exec frontend npm install <paquete>
```

**Prisma:**

```bash
docker compose exec backend npx prisma migrate dev --name <cambio>   # tras editar schema.prisma
```

**Recuperación de contraseña:** el correo con el código no sale a internet; aparece en la bandeja de Mailpit (http://localhost:8025). Para enviar correos reales, define las variables `SMTP_*` y `MAIL_FROM` en `.env` (ver `.env.example`).

**Asistente de IA (Gemini):** consigue una clave gratuita en https://aistudio.google.com, pégala en `GEMINI_API_KEY` dentro de `.env` y ejecuta `docker compose up -d`. La clave solo la usa el servidor; nunca llega al navegador. Sin clave, el asistente avisa que no está configurado.

Para explorar la base de datos puedes usar DBeaver o `psql` contra `localhost:5432`.

**Borrar la base de datos y empezar de cero:** `docker compose down -v` (elimina los volúmenes).

## Probar en el celular Android

- **Misma red WiFi:** abre `http://IP-DE-TU-PC:5173` en Chrome. Funciona para ver y probar la interfaz.
- **Instalar como PWA:** Chrome solo permite instalarla en un origen seguro (HTTPS o `localhost`). Opciones:
  - Por USB con depuración activada: en el PC abre `chrome://inspect/#devices`, activa *Port forwarding* (5173 → localhost:5173) y abre `http://localhost:5173` en el celular.
  - Con un túnel HTTPS (por ejemplo Cloudflare Tunnel) apuntando al puerto 5173.

## Estructura

```
foodcenter/
├── docker-compose.yml
├── .env.example
├── scripts/init.sh
├── backend/
│   ├── prisma/schema.prisma      # modelo de datos (hoy solo Usuario)
│   └── src/
│       ├── index.js / app.js     # arranque y configuración de Express
│       ├── config/               # variables de entorno
│       ├── lib/                  # cliente de Prisma
│       ├── routes/               # definición de endpoints
│       ├── controllers/          # manejo de peticiones
│       ├── services/             # lógica de negocio (y cliente de Gemini)
│       ├── middlewares/          # errores, autenticación...
│       └── utils/
└── frontend/
    ├── vite.config.js            # React, Tailwind, PWA y proxy /api → backend
    ├── public/                   # íconos de la PWA
    └── src/
        ├── pages/                # una por pantalla
        ├── components/layout/    # AppLayout y BottomNav
        ├── services/api.js       # cliente HTTP
        ├── context/  hooks/  utils/
        └── App.jsx / main.jsx
```
