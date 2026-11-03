import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { firmarTokenRecuperacion, verificarTokenRecuperacion } from '../utils/token.js';
import { enviarCorreo } from './correo.service.js';

export const VALIDEZ_CODIGO_MIN = 10; // RNF-06
export const MAXIMO_INTENTOS = 5;
export const ESPERA_REENVIO_SEG = 60;
export const MAXIMO_CODIGOS_POR_HORA = 5;
const SALT_ROUNDS = 10;

const ERROR_CODIGO = 'El código es incorrecto o venció. Si ya lo intentaste varias veces, solicita uno nuevo.';
const ERROR_TOKEN = 'El enlace de recuperación no es válido o venció. Solicita un código nuevo.';

const generarCodigo = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

// En la base de datos solo se guarda una huella del código, ligada al usuario.
const huella = (usuarioId, codigo) => crypto.createHmac('sha256', env.jwtSecret).update(`${usuarioId}:${codigo}`).digest('hex');

function iguales(a, b) {
  const x = Buffer.from(a, 'hex');
  const y = Buffer.from(b, 'hex');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function enviarCodigo(usuario, codigo) {
  const nombre = usuario.nombre.split(' ')[0];
  const texto = [
    `Hola ${nombre},`,
    '',
    `Tu código para recuperar tu contraseña de FoodCenter es: ${codigo}`,
    '',
    `Vence en ${VALIDEZ_CODIGO_MIN} minutos y solo sirve una vez. Si no lo solicitaste, ignora este mensaje: tu contraseña no cambiará.`,
  ].join('\n');
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;color:#1f2937">
      <h1 style="color:#0d8254;font-size:22px;margin:0 0 16px">FoodCenter</h1>
      <p>Hola ${nombre},</p>
      <p>Tu código para recuperar tu contraseña es:</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#0d8254;margin:16px 0">${codigo}</p>
      <p style="font-size:14px;color:#6b7280">Vence en ${VALIDEZ_CODIGO_MIN} minutos y solo sirve una vez. Si no lo solicitaste, ignora este mensaje: tu contraseña no cambiará.</p>
    </div>`;
  return enviarCorreo({ para: usuario.correo, asunto: 'Tu código para recuperar tu contraseña de FoodCenter', texto, html });
}

// Paso 1 (RF-03). La respuesta al cliente es siempre la misma exista o no el correo, para no revelar quién está registrado.
// El correo se envía sin hacer esperar la respuesta; "envio" solo existe para que las pruebas puedan esperarlo.
export async function solicitarCodigo(correo) {
  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (!usuario) return { envio: null };

  const ahora = new Date();
  const recientes = await prisma.codigoRecuperacion.findMany({
    where: { usuarioId: usuario.id, creadoEn: { gte: new Date(ahora.getTime() - 3_600_000) } },
    orderBy: { creadoEn: 'desc' },
    select: { creadoEn: true },
  });
  const muchos = recientes.length >= MAXIMO_CODIGOS_POR_HORA;
  const muyPronto = recientes[0] && ahora - recientes[0].creadoEn < ESPERA_REENVIO_SEG * 1000;
  if (muchos || muyPronto) return { envio: null };

  const codigo = generarCodigo();
  // Un código nuevo anula los anteriores que siguieran vigentes.
  await prisma.codigoRecuperacion.updateMany({ where: { usuarioId: usuario.id, usadoEn: null }, data: { usadoEn: ahora } });
  await prisma.codigoRecuperacion.create({
    data: { usuarioId: usuario.id, codigoHash: huella(usuario.id, codigo), expiraEn: new Date(ahora.getTime() + VALIDEZ_CODIGO_MIN * 60_000) },
  });

  const envio = enviarCodigo(usuario, codigo).catch((err) => console.error('No se pudo enviar el correo de recuperación:', err.message));
  return { envio };
}

// Paso 2 (RF-04, primera parte): comprueba el código y entrega un token de un solo propósito para el paso 3.
export async function verificarCodigo(correo, codigo) {
  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (!usuario) throw new HttpError(400, ERROR_CODIGO);

  const ahora = new Date();
  const activo = await prisma.codigoRecuperacion.findFirst({
    where: { usuarioId: usuario.id, usadoEn: null, expiraEn: { gt: ahora } },
    orderBy: { creadoEn: 'desc' },
  });
  if (!activo) throw new HttpError(400, ERROR_CODIGO);

  // El intento se cuenta ANTES de comparar, de forma atómica: así ni las peticiones simultáneas superan el tope.
  const codigoActual = await prisma.codigoRecuperacion.update({ where: { id: activo.id }, data: { intentos: { increment: 1 } } });
  if (codigoActual.intentos > MAXIMO_INTENTOS) throw new HttpError(429, 'Demasiados intentos. Solicita un código nuevo.');

  if (!iguales(codigoActual.codigoHash, huella(usuario.id, codigo))) {
    if (codigoActual.intentos >= MAXIMO_INTENTOS) {
      await prisma.codigoRecuperacion.updateMany({ where: { id: codigoActual.id }, data: { usadoEn: ahora } });
      throw new HttpError(429, 'Demasiados intentos. Solicita un código nuevo.');
    }
    throw new HttpError(400, ERROR_CODIGO);
  }
  return { token: firmarTokenRecuperacion(usuario.id, codigoActual.id) };
}

// Paso 3 (RF-04, segunda parte): define la nueva contraseña. El código se gasta en el mismo instante: sirve una sola vez.
export async function restablecerPassword(token, password) {
  let datos;
  try {
    datos = verificarTokenRecuperacion(token);
  } catch {
    throw new HttpError(400, ERROR_TOKEN);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const ahora = new Date();

  await prisma.$transaction(async (tx) => {
    const gastado = await tx.codigoRecuperacion.updateMany({
      where: { id: datos.codigoId, usuarioId: datos.usuarioId, usadoEn: null, expiraEn: { gt: ahora } },
      data: { usadoEn: ahora },
    });
    if (gastado.count !== 1) throw new HttpError(400, ERROR_TOKEN);

    await tx.usuario.update({ where: { id: datos.usuarioId }, data: { passwordHash } });
    await tx.codigoRecuperacion.updateMany({ where: { usuarioId: datos.usuarioId, usadoEn: null }, data: { usadoEn: ahora } });
  });
}
