import { z } from 'zod';

export const chatbotSchema = z.object({
  mensaje: z.string().trim().min(1, 'Escribe tu pregunta').max(500, 'La pregunta es demasiado larga (máximo 500 caracteres)'),
  // Mensajes anteriores de la conversación; el servidor solo usa los últimos.
  historial: z
    .array(
      z.object({
        rol: z.enum(['usuario', 'asistente'], 'Rol no válido'),
        texto: z.string().trim().min(1).max(1500),
      })
    )
    .max(10, 'El historial es demasiado largo')
    .default([]),
});
