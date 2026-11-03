import { z } from 'zod';
import { CATEGORIAS } from './enums.js';

// Parámetros de GET /api/productos?categoria=...&q=...&ids=a,b,c
export const consultaCatalogoSchema = z.object({
  categoria: z.enum(CATEGORIAS, 'Categoría no válida').optional(),
  q: z.string().trim().max(100, 'La búsqueda es demasiado larga').optional(),
  // Lista de ids separados por coma (hasta 50); la usa el carrito para consultar sus productos.
  ids: z
    .string()
    .regex(/^[0-9a-f-]{36}(,[0-9a-f-]{36}){0,49}$/i, 'La lista de productos no es válida')
    .optional(),
});

export const busquedaSchema = z.object({
  texto: z.string().trim().min(1, 'Escribe algo para buscar').max(100, 'La búsqueda es demasiado larga'),
});
