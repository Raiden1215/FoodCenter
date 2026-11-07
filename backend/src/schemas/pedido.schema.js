import { z } from 'zod';
import { ESTADOS_PEDIDO, METODOS_PAGO } from './enums.js';

export const itemPedidoSchema = z.object({
  productoId: z.string().uuid('ID de producto inválido').optional().nullable(),
  cantidad: z
    .number({ invalid_type_error: 'La cantidad debe ser un número' })
    .int('La cantidad debe ser un entero')
    .min(1, 'La cantidad mínima es 1')
    .max(100, 'La cantidad máxima por producto es 100'),
  notas: z
    .string()
    .trim()
    .max(300, 'Las especificaciones de ingredientes no pueden superar 300 caracteres')
    .optional()
    .nullable(),
});

export const crearPedidoSchema = z
  .object({
    localId: z.string().uuid('ID de local inválido'),
    metodoPago: z.enum(METODOS_PAGO, {
      errorMap: () => ({ message: 'Elige un método de pago válido (EFECTIVO o QR_NEQUI)' }),
    }),
    direccionEntrega: z
      .string()
      .trim()
      .min(5, 'Ingresa una dirección de entrega válida (mínimo 5 caracteres)')
      .max(200, 'La dirección es demasiado larga'),
    referencias: z
      .string()
      .trim()
      .max(250, 'Las referencias de ubicación no pueden superar 250 caracteres')
      .optional()
      .nullable(),
    latitudEntrega: z.number().optional().nullable(),
    longitudEntrega: z.number().optional().nullable(),
    comprobanteUrl: z.string().trim().optional().nullable(),
    items: z.array(itemPedidoSchema).min(1, 'El pedido debe incluir al menos un producto'),
  })
  .superRefine((data, ctx) => {
    if (data.metodoPago === 'QR_NEQUI' && (!data.comprobanteUrl || data.comprobanteUrl.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes adjuntar el comprobante de pago de Nequi para continuar',
        path: ['comprobanteUrl'],
      });
    }
  });

export const cambiarEstadoPedidoSchema = z.object({
  estado: z.enum(ESTADOS_PEDIDO, {
    errorMap: () => ({ message: 'Estado de pedido inválido (PENDIENTE, HECHO o CANCELADO)' }),
  }),
  efectivoRecibido: z
    .number({ invalid_type_error: 'El monto en efectivo debe ser un número' })
    .int('El monto debe ser un entero en pesos')
    .min(0, 'El monto recibido no puede ser negativo')
    .optional()
    .nullable(),
});
