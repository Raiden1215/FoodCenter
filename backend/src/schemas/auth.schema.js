import { z } from 'zod';

export const correo = z.string().trim().toLowerCase().pipe(z.email('El correo no es válido'));

// bcrypt solo procesa los primeros 72 bytes, por eso el máximo.
export const password = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede superar los 72 caracteres')
  .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra')
  .regex(/\d/, 'La contraseña debe incluir al menos un número');

export const registroSchema = z
  .object({
    nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80, 'El nombre es demasiado largo'),
    correo,
    password,
    direccion: z.string().trim().min(5, 'La dirección es obligatoria').max(200, 'La dirección es demasiado larga'),
    latitud: z.number('La latitud no es válida').min(-90).max(90).optional(),
    longitud: z.number('La longitud no es válida').min(-180).max(180).optional(),
  })
  .refine((d) => (d.latitud === undefined) === (d.longitud === undefined), {
    message: 'La ubicación debe incluir latitud y longitud',
  });

export const loginSchema = z.object({
  correo,
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

// ---------- recuperación de contraseña ----------
export const recuperarSchema = z.object({ correo });

export const codigoSchema = z.object({
  correo,
  codigo: z.string().trim().regex(/^\d{6}$/, 'El código debe tener 6 dígitos'),
});

export const nuevaPasswordSchema = z.object({
  token: z.string().min(1, 'Falta el token de recuperación'),
  password,
});
