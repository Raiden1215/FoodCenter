import path from 'node:path';

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL,
  // Asistente (chatbot). La clave solo vive en el servidor; nunca se envía al navegador.
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || null,
    // Los nombres de modelo cambian con el tiempo (gemini-1.5-flash y gemini-2.0-flash ya se apagaron):
    // se puede cambiar con GEMINI_MODEL sin tocar el código.
    modelo: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
    // Opcional: nivel de "razonamiento" (p. ej. "low") para responder más rápido en modelos que lo admiten.
    pensamiento: process.env.GEMINI_THINKING_LEVEL || null,
    tiempoMaxMs: Number(process.env.GEMINI_TIMEOUT_MS) || 9000, // RNF-04: responder en menos de 10 s
  },
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
