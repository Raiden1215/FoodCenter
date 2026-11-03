import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/httpError.js';

export const SIN_RESENAS = { promedio: null, total: 0 };
const MAXIMO_RESENAS = 20;

// Promedio (con un decimal) y cantidad de reseñas de varios productos a la vez.
export async function resumenPorProducto(ids) {
  if (!ids.length) return new Map();
  const grupos = await prisma.resena.groupBy({
    by: ['productoId'],
    where: { productoId: { in: ids } },
    _avg: { calificacion: true },
    _count: { _all: true },
  });
  return new Map(
    grupos.map((g) => [g.productoId, { promedio: Math.round(g._avg.calificacion * 10) / 10, total: g._count._all }])
  );
}

// Un producto oculto solo lo ve su dueño; para los demás es como si no existiera.
async function productoVisible(usuarioId, productoId) {
  const producto = await prisma.producto.findUnique({
    where: { id: productoId },
    include: { local: { select: { propietarioId: true } } },
  });
  if (!producto || (!producto.activo && producto.local.propietarioId !== usuarioId)) {
    throw new HttpError(404, 'Producto no encontrado');
  }
  return producto;
}

export async function obtenerResenas(usuarioId, productoId) {
  await productoVisible(usuarioId, productoId);

  const [lista, resumen, mia] = await Promise.all([
    prisma.resena.findMany({
      where: { productoId },
      orderBy: { creadoEn: 'desc' },
      take: MAXIMO_RESENAS,
      include: { usuario: { select: { id: true, nombre: true } } },
    }),
    resumenPorProducto([productoId]),
    prisma.resena.findUnique({ where: { productoId_usuarioId: { productoId, usuarioId } } }),
  ]);

  return {
    calificacion: resumen.get(productoId) ?? SIN_RESENAS,
    resenas: lista.map((r) => ({
      id: r.id,
      calificacion: r.calificacion,
      comentario: r.comentario,
      creadoEn: r.creadoEn,
      autor: r.usuario.nombre.split(' ')[0], // solo el primer nombre, por privacidad
      esMia: r.usuarioId === usuarioId,
    })),
    miResena: mia ? { calificacion: mia.calificacion, comentario: mia.comentario } : null,
  };
}

// Crea o actualiza la reseña del usuario (una por producto). El dueño no puede calificar su propio producto.
export async function guardarResena(usuarioId, productoId, { calificacion, comentario }) {
  const producto = await productoVisible(usuarioId, productoId);
  if (producto.local.propietarioId === usuarioId) {
    throw new HttpError(403, 'No puedes calificar tu propio producto');
  }

  await prisma.resena.upsert({
    where: { productoId_usuarioId: { productoId, usuarioId } },
    create: { productoId, usuarioId, calificacion, comentario },
    update: { calificacion, comentario, creadoEn: new Date() },
  });
  return obtenerResenas(usuarioId, productoId);
}

export async function eliminarMiResena(usuarioId, productoId) {
  await productoVisible(usuarioId, productoId);
  await prisma.resena.deleteMany({ where: { productoId, usuarioId } });
  return obtenerResenas(usuarioId, productoId);
}
