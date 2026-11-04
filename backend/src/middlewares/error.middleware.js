import { HttpError } from '../utils/httpError.js';

export function notFound(_req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

const MENSAJES = {
  'entity.too.large': 'El archivo es demasiado grande (máximo 5 MB)',
  'entity.parse.failed': 'El cuerpo de la petición no es un JSON válido',
};

// Los HttpError se lanzan a propósito con mensajes pensados para el usuario (incluidos 503 y 504 del asistente),
// así que se muestran tal cual. Cualquier otro error 5xx es inesperado: se registra y el cliente solo ve un mensaje genérico.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  const status = err.status ?? 500;
  const controlado = err instanceof HttpError;
  if (status >= 500 && !controlado) console.error(err);

  const mensaje = controlado
    ? err.message
    : status >= 500
      ? 'Error interno del servidor'
      : (MENSAJES[err.type] ?? err.message);
  res.status(status).json({ error: mensaje });
}
