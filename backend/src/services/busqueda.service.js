import { prisma } from '../lib/prisma.js';

const MAXIMO_HISTORIAL = 10;

export function listarHistorial(usuarioId) {
  return prisma.busqueda.findMany({
    where: { usuarioId },
    orderBy: { creadoEn: 'desc' },
    take: MAXIMO_HISTORIAL,
  });
}

// Guarda la búsqueda al inicio del historial: sin repetidos (ignora mayúsculas) y con un máximo de 10.
export async function registrarBusqueda(usuarioId, texto) {
  await prisma.busqueda.deleteMany({ where: { usuarioId, texto: { equals: texto, mode: 'insensitive' } } });
  await prisma.busqueda.create({ data: { usuarioId, texto } });

  const sobrantes = await prisma.busqueda.findMany({
    where: { usuarioId },
    orderBy: { creadoEn: 'desc' },
    skip: MAXIMO_HISTORIAL,
    select: { id: true },
  });
  if (sobrantes.length) {
    await prisma.busqueda.deleteMany({ where: { id: { in: sobrantes.map((b) => b.id) } } });
  }
  return listarHistorial(usuarioId);
}

export async function eliminarBusqueda(usuarioId, id) {
  await prisma.busqueda.deleteMany({ where: { id, usuarioId } });
}

export async function vaciarHistorial(usuarioId) {
  await prisma.busqueda.deleteMany({ where: { usuarioId } });
}
