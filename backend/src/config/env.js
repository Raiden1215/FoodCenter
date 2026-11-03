import path from 'node:path';

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL,
  // Carpeta donde se guardan las fotos subidas (logos, portadas, productos, QR).
  uploadsDir: process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads'),
  // Zona horaria usada para decidir si un local está abierto.
  timezone: process.env.APP_TIMEZONE ?? 'America/Bogota',
  // Correo saliente (recuperación de contraseña). En desarrollo se usa Mailpit (ver docker-compose.yml).
  smtp: {
    host: process.env.SMTP_HOST || null,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true = TLS directo (normalmente puerto 465)
    user: process.env.SMTP_USER || null,
    pass: process.env.SMTP_PASS || null,
    from: process.env.MAIL_FROM || 'FoodCenter <no-responder@foodcenter.local>',
  },
};

if (env.nodeEnv === 'production') {
  if (!env.jwtSecret || env.jwtSecret.startsWith('cambia-')) {
    throw new Error('JWT_SECRET debe definirse con un valor seguro en producción.');
  }
  if (!env.smtp.host) {
    throw new Error('SMTP_HOST debe definirse en producción para poder enviar correos.');
  }
}
