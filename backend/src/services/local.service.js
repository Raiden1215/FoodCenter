import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/httpError.js';

const INCLUDE = { horarios: { orderBy: [{ diaSemana: 'asc' }, { abreMin: 'asc' }] } };

export function obtenerMiLocal(usuarioId) {
  return prisma.local.findUnique({ where: { propietarioId: usuarioId }, include: INCLUDE });
}

export async function crearLocal(usuarioId, { horarios, ...datos }) {
  if (await obtenerMiLocal(usuarioId)) throw new HttpError(409, 'Ya tienes un local creado');
  return prisma.local.create({
    data: { ...datos, propietarioId: usuarioId, horarios: { create: horarios } },
    include: INCLUDE,
  });
}

// PUT: reemplaza todos los datos editables del local y sus horarios.
export async function actualizarLocal(usuarioId, { horarios, especialidades, metodosPago, ...datos }) {
  const local = await obtenerMiLocal(usuarioId);
  if (!local) throw new HttpError(404, 'Aún no tienes un local');

  return prisma.$transaction(async (tx) => {
    await tx.local.update({
      where: { id: local.id },
      data: { ...datos, especialidades: { set: especialidades }, metodosPago: { set: metodosPago } },
    });
    await tx.horarioLocal.deleteMany({ where: { localId: local.id } });
    if (horarios.length) {
      await tx.horarioLocal.createMany({ data: horarios.map((h) => ({ ...h, localId: local.id })) });
    }
    return tx.local.findUnique({ where: { id: local.id }, include: INCLUDE });
  });
}

export async function cambiarEstado(usuarioId, estado) {
  const local = await obtenerMiLocal(usuarioId);
  if (!local) throw new HttpError(404, 'Aún no tienes un local');
  return prisma.local.update({ where: { id: local.id }, data: { estado }, include: INCLUDE });
}
