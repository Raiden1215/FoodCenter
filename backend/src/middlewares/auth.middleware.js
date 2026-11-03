import { HttpError } from '../utils/httpError.js';
import { verificarToken } from '../utils/token.js';

// Protege rutas: exige "Authorization: Bearer <token>" y deja el id en req.usuarioId.
export function requireAuth(req, _res, next) {
  const [tipo, token] = (req.headers.authorization ?? '').split(' ');
  if (tipo !== 'Bearer' || !token) return next(new HttpError(401, 'No autenticado'));

  try {
    const payload = verificarToken(token);
    // Los tokens de un solo propósito (p. ej. recuperación de contraseña) no abren sesión.
    if (payload.proposito) throw new Error('Token que no es de sesión');
    req.usuarioId = payload.sub;
    next();
  } catch {
    next(new HttpError(401, 'Sesión inválida o expirada'));
  }
}
