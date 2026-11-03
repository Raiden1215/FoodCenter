import { z } from 'zod';
import { CATEGORIAS, ESTADOS_LOCAL, METODOS_PAGO } from './enums.js';

// Solo se aceptan imágenes subidas a este servidor (ver POST /api/uploads).
export const RUTA_IMAGEN = /^\/uploads\/[0-9a-f-]{36}\.(jpg|png|webp)$/;
export const imagen = z.string().regex(RUTA_IMAGEN, 'La imagen no es válida');

const horario = z
  .object({
    diaSemana: z.number('Día no válido').int('Día no válido').min(0, 'Día no válido').max(6, 'Día no válido'), // 0 = domingo ... 6 = sábado
    abreMin: z.number('Hora no válida').int('Hora no válida').min(0, 'Hora no válida').max(1439, 'Hora no válida'), // minutos desde las 00:00
    cierraMin: z.number('Hora no válida').int('Hora no válida').min(1, 'Hora no válida').max(1440, 'Hora no válida'),
  })
  .refine((h) => h.cierraMin > h.abreMin, { message: 'La hora de cierre debe ser posterior a la de apertura' });

function sinSolapes(horarios) {
  const porDia = Map.groupBy(horarios, (h) => h.diaSemana);
  for (const bloques of porDia.values()) {
    const orden = [...bloques].sort((a, b) => a.abreMin - b.abreMin);
    for (let i = 1; i < orden.length; i++) if (orden[i].abreMin < orden[i - 1].cierraMin) return false;
  }
  return true;
}

export const localSchema = z
  .object({
    nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80, 'El nombre es demasiado largo'),
    logoUrl: imagen.nullish(),
    portadaUrl: imagen.nullish(),
    eslogan: z.string().trim().max(120, 'El eslogan es demasiado largo').nullish(),
    especialidades: z.array(z.enum(CATEGORIAS)).min(1, 'Elige al menos una especialidad').max(7),
    tiempoPreparacionMin: z.number().int().min(1).max(240).nullish(),
    tiempoEntregaMin: z.number().int().min(1).max(240).nullish(),
    zonaDomicilio: z.string().trim().max(120, 'La zona de domicilio es demasiado larga').nullish(),
    radioDomicilioKm: z.number('El radio no es válido').min(0.1, 'El radio mínimo es 0,1 km').max(50, 'El radio máximo es 50 km').nullish(),
    precioDomicilio: z.number().int('El precio del domicilio debe ser un número entero').min(0).max(100000).default(0),
    direccion: z.string().trim().min(5, 'La dirección es obligatoria').max(200, 'La dirección es demasiado larga'),
    latitud: z.number().min(-90).max(90).nullish(),
    longitud: z.number().min(-180).max(180).nullish(),
    whatsapp: z
      .string()
      .trim()
      .transform((v) => v.replace(/[\s-]/g, ''))
      .pipe(z.string().regex(/^\+?\d{7,15}$/, 'El número de WhatsApp no es válido'))
      .nullish(),
    redesSociales: z
      .object({
        instagram: z.string().trim().max(100).optional(),
        facebook: z.string().trim().max(100).optional(),
        tiktok: z.string().trim().max(100).optional(),
      })
      .default({}),
    metodosPago: z.array(z.enum(METODOS_PAGO)).min(1, 'Elige al menos un método de pago'),
    qrNequiUrl: imagen.nullish(),
    estado: z.enum(ESTADOS_LOCAL).optional(),
    horarios: z.array(horario).max(21, 'Demasiados bloques de horario'),
  })
  .refine((d) => (d.latitud == null) === (d.longitud == null), {
    message: 'La ubicación debe incluir latitud y longitud',
  })
  .refine((d) => !d.metodosPago.includes('QR_NEQUI') || Boolean(d.qrNequiUrl), {
    message: 'Sube tu código QR de Nequi para habilitar ese método de pago',
  })
  .refine((d) => sinSolapes(d.horarios), { message: 'Los horarios de un mismo día no pueden solaparse' });

export const estadoSchema = z.object({ estado: z.enum(ESTADOS_LOCAL, 'Estado no válido') });
