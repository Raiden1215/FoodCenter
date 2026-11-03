export function notFound(_req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

const MENSAJES = {
  'entity.too.large': 'El archivo es demasiado grande (máximo 5 MB)',
  'entity.parse.failed': 'El cuerpo de la petición no es un JSON válido',
};

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Error interno del servidor' : (MENSAJES[err.type] ?? err.message) });
}
