import { HttpError } from './httpError.js';

// Limita cuántas peticiones puede hacer cada usuario en una ventana de tiempo (en memoria, por proceso).
// Protege la cuota (y el costo) del servicio de IA. Si algún día hay varias instancias del servidor,
// habrá que moverlo a un almacén compartido.
export function limitarPorUsuario({ max, ventanaMs, mensaje }) {
  const registros = new Map();

  return (req, _res, next) => {
    const ahora = Date.now();
    const recientes = (registros.get(req.usuarioId) ?? []).filter((t) => ahora - t < ventanaMs);
    if (recientes.length >= max) return next(new HttpError(429, mensaje));

    recientes.push(ahora);
    registros.set(req.usuarioId, recientes);

    if (registros.size > 1000) {
      for (const [id, tiempos] of registros) if (tiempos.every((t) => ahora - t >= ventanaMs)) registros.delete(id);
    }
    next();
  };
}
