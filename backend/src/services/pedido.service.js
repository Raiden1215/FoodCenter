import { prisma } from '../lib/prisma.js';
import { estaAbierto } from '../utils/horario.js';
import { HttpError } from '../utils/httpError.js';

const INCLUDE_DETALLE = {
  items: {
    include: {
      producto: {
        include: { imagenes: { take: 1, orderBy: { orden: 'asc' } } },
      },
    },
  },
  comprador: {
    select: {
      id: true,
      nombre: true,
      correo: true,
      direccion: true,
    },
  },
  local: {
    select: {
      id: true,
      nombre: true,
      whatsapp: true,
      direccion: true,
      logoUrl: true,
      qrNequiUrl: true,
    },
  },
};

export async function crearPedido(compradorId, datos) {
  const { localId, metodoPago, direccionEntrega, referencias, latitudEntrega, longitudEntrega, comprobanteUrl, items } =
    datos;

  const comprador = await prisma.usuario.findUnique({ where: { id: compradorId } });
  if (!comprador) throw new HttpError(404, 'Usuario comprador no encontrado');

  const local = await prisma.local.findUnique({
    where: { id: localId },
    include: { horarios: true },
  });
  if (!local) throw new HttpError(404, 'El local no existe');

  if (local.propietarioId === compradorId) {
    throw new HttpError(400, 'No puedes realizar pedidos a tu propio negocio');
  }

  if (local.estado !== 'DISPONIBLE') {
    throw new HttpError(400, 'El local no puede brindar servicio en este momento');
  }

  if (!estaAbierto(local.horarios)) {
    throw new HttpError(400, 'El local se encuentra fuera de horario de atención');
  }

  if (metodoPago === 'QR_NEQUI' && !local.qrNequiUrl) {
    throw new HttpError(400, 'El local no tiene configurado el código QR de Nequi actualmente');
  }

  const productoIds = items.map((it) => it.productoId).filter(Boolean);
  const productosEnBd = await prisma.producto.findMany({
    where: { id: { in: productoIds }, localId, activo: true },
  });

  if (productosEnBd.length !== productoIds.length) {
    throw new HttpError(400, 'Uno o varios productos seleccionados no están disponibles o no pertenecen a este local');
  }

  const mapaProductos = new Map(productosEnBd.map((p) => [p.id, p]));

  let subtotal = 0;
  const itemsParaCrear = [];

  for (const item of items) {
    const prod = mapaProductos.get(item.productoId);
    if (!prod) continue;

    if (prod.cantidadDisponible < item.cantidad) {
      throw new HttpError(
        400,
        `No hay suficiente stock para "${prod.nombre}". Disponibles: ${prod.cantidadDisponible}, solicitados: ${item.cantidad}`
      );
    }

    subtotal += prod.precio * item.cantidad;
    itemsParaCrear.push({
      productoId: prod.id,
      nombreProducto: prod.nombre,
      precioUnitario: prod.precio,
      cantidad: item.cantidad,
      notas: item.notas?.trim() || null,
    });
  }

  const costoDomicilio = local.precioDomicilio || 0;
  const total = subtotal + costoDomicilio;

  return prisma.$transaction(async (tx) => {
    const pedido = await tx.pedido.create({
      data: {
        compradorId,
        localId,
        estado: 'PENDIENTE',
        metodoPago,
        subtotal,
        costoDomicilio,
        total,
        direccionEntrega,
        referencias: referencias?.trim() || null,
        latitudEntrega: latitudEntrega ?? null,
        longitudEntrega: longitudEntrega ?? null,
        comprobanteUrl: comprobanteUrl || null,
        items: {
          create: itemsParaCrear,
        },
      },
      include: INCLUDE_DETALLE,
    });

    for (const item of items) {
      await tx.producto.update({
        where: { id: item.productoId },
        data: {
          cantidadDisponible: {
            decrement: item.cantidad,
          },
        },
      });
    }

    await tx.notificacion.create({
      data: {
        usuarioId: local.propietarioId,
        pedidoId: pedido.id,
        tipo: 'PEDIDO_NUEVO',
        titulo: '¡Nuevo pedido recibido!',
        mensaje: `Has recibido un nuevo pedido de ${comprador.nombre} por valor de $${total.toLocaleString('es-CO')}.`,
      },
    });

    return pedido;
  });
}

export async function obtenerPedidosLocal(usuarioId, estadoFiltro) {
  const local = await prisma.local.findUnique({
    where: { propietarioId: usuarioId },
  });
  if (!local) throw new HttpError(404, 'No tienes un local registrado');

  const where = {
    localId: local.id,
    ...(estadoFiltro ? { estado: estadoFiltro } : {}),
  };

  return prisma.pedido.findMany({
    where,
    include: INCLUDE_DETALLE,
    orderBy: { creadoEn: 'desc' },
  });
}

export async function obtenerPedidoPorId(usuarioId, pedidoId) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: INCLUDE_DETALLE,
  });
  if (!pedido) throw new HttpError(404, 'Pedido no encontrado');

  const local = await prisma.local.findUnique({ where: { id: pedido.localId } });
  const esVendedor = local?.propietarioId === usuarioId;
  const esComprador = pedido.compradorId === usuarioId;

  if (!esVendedor && !esComprador) {
    throw new HttpError(403, 'No tienes permiso para ver este pedido');
  }

  return pedido;
}

export async function cambiarEstadoPedido(usuarioId, pedidoId, { estado, efectivoRecibido }) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      local: true,
      items: true,
      comprador: true,
    },
  });
  if (!pedido) throw new HttpError(404, 'Pedido no encontrado');

  if (pedido.local.propietarioId !== usuarioId) {
    throw new HttpError(403, 'Solo el propietario del local puede gestionar este pedido');
  }

  const estadoAnterior = pedido.estado;

  return prisma.$transaction(async (tx) => {
    if (estado === 'CANCELADO' && estadoAnterior !== 'CANCELADO') {
      for (const item of pedido.items) {
        if (item.productoId) {
          await tx.producto.update({
            where: { id: item.productoId },
            data: { cantidadDisponible: { increment: item.cantidad } },
          });
        }
      }
    }

    const dataActualizacion = {
      estado,
      atendidoEn: estado === 'HECHO' || estado === 'CANCELADO' ? new Date() : null,
    };

    if (efectivoRecibido !== undefined && efectivoRecibido !== null) {
      dataActualizacion.efectivoRecibido = efectivoRecibido;
    }

    const pedidoActualizado = await tx.pedido.update({
      where: { id: pedidoId },
      data: dataActualizacion,
      include: INCLUDE_DETALLE,
    });

    if (estado === 'HECHO' || estado === 'CANCELADO') {
      const esHecho = estado === 'HECHO';
      await tx.notificacion.create({
        data: {
          usuarioId: pedido.compradorId,
          pedidoId: pedido.id,
          tipo: esHecho ? 'PEDIDO_HECHO' : 'PEDIDO_CANCELADO',
          titulo: esHecho ? '¡Tu pedido ha sido entregado!' : 'Tu pedido fue cancelado',
          mensaje: esHecho
            ? `${pedido.local.nombre} confirmó la entrega de tu pedido. ¡Buen provecho!`
            : `${pedido.local.nombre} canceló tu pedido.`,
        },
      });
    }

    return pedidoActualizado;
  });
}

export async function obtenerMisPedidos(compradorId) {
  return prisma.pedido.findMany({
    where: { compradorId },
    include: INCLUDE_DETALLE,
    orderBy: { creadoEn: 'desc' },
  });
}
