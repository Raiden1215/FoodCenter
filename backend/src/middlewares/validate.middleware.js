import { HttpError } from '../utils/httpError.js';

// Valida req.body con un esquema de Zod y lo reemplaza por los datos ya limpios.
export const validar = (schema) => (req, _res, next) => {
  const resultado = schema.safeParse(req.body ?? {});
  if (!resultado.success) {
    return next(new HttpError(400, resultado.error.issues[0].message));
  }
  req.body = resultado.data;
  next();
};

// Valida los parámetros de la URL (?a=b) y deja el resultado en req.consulta.
export const validarConsulta = (schema) => (req, _res, next) => {
  const resultado = schema.safeParse(req.query ?? {});
  if (!resultado.success) {
    return next(new HttpError(400, resultado.error.issues[0].message));
  }
  req.consulta = resultado.data;
  next();
};
