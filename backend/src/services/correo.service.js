import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporte = null;

function crearTransporte() {
  // Sin SMTP configurado (solo desarrollo fuera de Docker): el mensaje no sale; se escribe en el registro.
  if (!env.smtp.host) return nodemailer.createTransport({ jsonTransport: true });

  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    // Para que un servidor de correo caído no deje la petición colgada.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

// Solo para pruebas: reemplaza el transporte.
export function usarTransporte(nuevo) {
  transporte = nuevo;
}

export async function enviarCorreo({ para, asunto, texto, html }) {
  transporte ??= crearTransporte();
  const info = await transporte.sendMail({ from: env.smtp.from, to: para, subject: asunto, text: texto, html });
  if (!env.smtp.host) console.log(`[correo simulado, SMTP_HOST sin definir] Para: ${para}\n${texto}`);
  return info;
}
