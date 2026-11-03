import { z } from 'zod';
import { CATEGORIAS } from './enums.js';
import { imagen } from './local.schema.js';

export const productoSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80, 'El nombre es demasiado largo'),
  descripcion: z.string().trim().min(5, 'La descripción debe tener al menos 5 caracteres').max(500, 'La descripción es demasiado larga'),
  categoria: z.enum(CATEGORIAS, 'Elige una categoría'),
  precio: z.number('El precio no es válido').int('El precio debe ser un número entero').min(100, 'El precio mínimo es $100').max(10000000, 'El precio es demasiado alto'),
  cantidadDisponible: z.number('La cantidad no es válida').int('La cantidad debe ser un número entero').min(0, 'La cantidad no puede ser negativa').max(10000, 'La cantidad es demasiado alta'),
  activo: z.boolean().default(true),
  imagenes: z.array(imagen).min(1, 'Sube al menos una foto').max(5, 'Máximo 5 fotos'),
});
