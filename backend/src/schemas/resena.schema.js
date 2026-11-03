import { z } from 'zod';

export const resenaSchema = z.object({
  calificacion: z
    .number('La calificación no es válida')
    .int('La calificación debe ser un número entero')
    .min(1, 'La calificación mínima es 1')
    .max(5, 'La calificación máxima es 5'),
  // Un comentario vacío se guarda como null.
  comentario: z
    .string()
    .trim()
    .max(500, 'El comentario es demasiado largo (máximo 500 caracteres)')
    .nullish()
    .transform((valor) => valor || null),
});
