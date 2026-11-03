import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const PROPOSITO_RECUPERACION = 'recuperacion';
export const MINUTOS_TOKEN_RECUPERACION = 10;

// Token de sesión: lo usa el cliente en "Authorization: Bearer ...".
export function firmarToken(usuarioId) {
  return jwt.sign({}, env.jwtSecret, { subject: usuarioId, expiresIn: env.jwtExpiresIn });
}

// Lanza un error si el token es inválido o expiró. Devuelve el payload (sub = id del usuario).
export function verificarToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

// Token de un solo propósito: prueba que el usuario ya verificó su código de recuperación.
// Lleva el id del código para poder gastarlo una sola vez, y NO sirve como token de sesión.
export function firmarTokenRecuperacion(usuarioId, codigoId) {
  return jwt.sign({ proposito: PROPOSITO_RECUPERACION, cid: codigoId }, env.jwtSecret, {
    subject: usuarioId,
    expiresIn: `${MINUTOS_TOKEN_RECUPERACION}m`,
  });
}

// Devuelve { usuarioId, codigoId } o lanza un error si el token no es de recuperación o venció.
export function verificarTokenRecuperacion(token) {
  const payload = jwt.verify(token, env.jwtSecret);
  if (payload.proposito !== PROPOSITO_RECUPERACION || !payload.cid) throw new Error('Token de otro tipo');
  return { usuarioId: payload.sub, codigoId: payload.cid };
}
