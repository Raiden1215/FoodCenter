import { prisma } from '../lib/prisma.js';

export async function listar(req, res) {
  const notificaciones = await prisma.notificacion.findMany({
    where: { usuarioId: req.usuarioId },
    orderBy: { creadoEn: 'desc' },
    take: 20,
  });
  res.json(notificaciones);
}

export async function marcarLeida(req, res) {
  const { id } = req.params;
  const notif = await prisma.notificacion.updateMany({
    where: { id, usuarioId: req.usuarioId },
    data: { leida: true },
  });
  res.json({ ok: true, actualizadas: notif.count });
}
