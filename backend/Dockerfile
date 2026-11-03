FROM node:22-slim

# Prisma necesita OpenSSL en la imagen "slim"
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package*.json ./
COPY --chown=node:node prisma ./prisma
RUN npm install

COPY --chown=node:node . .

EXPOSE 4000

# Genera el cliente de Prisma, aplica migraciones existentes y arranca con recarga automática
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run dev"]
