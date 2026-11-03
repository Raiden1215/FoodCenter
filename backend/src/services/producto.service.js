import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { estaAbierto } from '../utils/horario.js';
import { normalizar, puntuarProducto } from '../utils/busqueda.js';
import { resumenPorProducto, SIN_RESENAS } from './resena.service.js';

const INCLUDE_IMAGENES = { imagenes: { orderBy: { orden: 'asc' } } };
const urlsAImagenes = (urls) => urls.map((url, orden) => ({ url, orden }));

async function localDe(usuarioId) {
  const local = await prisma.local.findUnique({ where: { propietarioId: usuarioId } });
  if (!local) throw new HttpError(409, 'Primero crea tu local para publicar productos');
  return local;
}

// Devuelve el producto solo si pertenece al local del usuario; si no, responde como si no existiera.
async function productoPropio(usuarioId, id) {
  const producto = await prisma.producto.findUnique({
    where: { id },
    include: { local: { select: { propietarioId: true } } },
  });
  if (!producto || producto.local.propietarioId !== usuarioId) throw new HttpError(404, 'Producto no encontrado');
  return producto;
}

export async function crearProducto(usuarioId, { imagenes, ...datos }) {
  const local = await localDe(usuarioId);
  return prisma.producto.create({
    data: { ...datos, localId: local.id, imagenes: { create: urlsAImagenes(imagenes) } },
    include: INCLUDE_IMAGENES,
  });
}

export async function actualizarProducto(usuarioId, id, { imagenes, ...datos }) {
  await productoPropio(usuarioId, id);
  return prisma.$transaction(async (tx) => {
    await tx.producto.update({ where: { id }, data: datos });
    await tx.imagenProducto.deleteMany({ where: { productoId: id } });
    await tx.imagenProducto.createMany({ data: urlsAImagenes(imagenes).map((i) => ({ ...i, productoId: id })) });
    return tx.producto.findUnique({ where: { id }, include: INCLUDE_IMAGENES });
  });
}

export async function eliminarProducto(usuarioId, id) {
  await productoPropio(usuarioId, id);
  await prisma.producto.delete({ where: { id } });
}

export async function listarMisProductos(usuarioId) {
  const local = await prisma.local.findUnique({ where: { propietarioId: usuarioId } });
  if (!local) return [];
  return prisma.producto.findMany({
    where: { localId: local.id },
    orderBy: { creadoEn: 'desc' },
    include: INCLUDE_IMAGENES,
  });
}

// DISPONIBLE | FUERA_DE_HORARIO | NO_DISPONIBLE (RF-13 y RF-14)
export function estadoDeVenta(producto, local, fecha = new Date()) {
  if (local.estado === 'SIN_SERVICIO' || producto.cantidadDisponible <= 0) return 'NO_DISPONIBLE';
  if (!estaAbierto(local.horarios, fecha)) return 'FUERA_DE_HORARIO';
  return 'DISPONIBLE';
}

// Catálogo de la pantalla principal. Admite filtro por categoría, búsqueda por texto (ordenada por relevancia)
// y una lista de ids (la usa el carrito). Cada producto incluye su calificación promedio.
export async function listarCatalogo({ categoria, q, ids } = {}) {
  const consulta = q ? normalizar(q) : '';
  const lista = ids ? ids.split(',') : null;

  const productos = await prisma.producto.findMany({
    where: { activo: true, ...(categoria ? { categoria } : {}), ...(lista ? { id: { in: lista } } : {}) },
    orderBy: { creadoEn: 'desc' },
    // Con texto se traen más productos porque el filtrado por relevancia (sin tildes) se hace aquí.
    take: consulta ? 500 : 50,
    include: {
      ...INCLUDE_IMAGENES,
      local: { select: { id: true, nombre: true, logoUrl: true, estado: true, horarios: true } },
    },
  });

  let items = productos.map((producto) => ({ producto, puntaje: consulta ? puntuarProducto(producto, consulta) : 0 }));
  if (consulta) {
    items = items
      .filter((i) => i.puntaje > 0)
      .sort((a, b) => b.puntaje - a.puntaje || b.producto.creadoEn - a.producto.creadoEn);
  }
  items = items.slice(0, 50);

  const resumenes = await resumenPorProducto(items.map((i) => i.producto.id));
  const ahora = new Date();
  return items.map(({ producto: { local, ...p } }) => ({
    ...p,
    estadoVenta: estadoDeVenta(p, local, ahora),
    calificacion: resumenes.get(p.id) ?? SIN_RESENAS,
    local: { id: local.id, nombre: local.nombre, logoUrl: local.logoUrl },
  }));
}

// Detalle de un producto con los datos del local (dirección, horarios, tiempos, domicilio y contacto).
// Un producto oculto solo lo ve su dueño. No se exponen datos de pago (como el QR de Nequi).
export async function obtenerDetalle(usuarioId, id) {
  const producto = await prisma.producto.findUnique({
    where: { id },
    include: {
      ...INCLUDE_IMAGENES,
      local: { include: { horarios: { orderBy: [{ diaSemana: 'asc' }, { abreMin: 'asc' }] } } },
    },
  });
  const esMio = producto?.local.propietarioId === usuarioId;
  if (!producto || (!producto.activo && !esMio)) throw new HttpError(404, 'Producto no encontrado');

  const { local, ...p } = producto;
  const calificacion = (await resumenPorProducto([id])).get(id) ?? SIN_RESENAS;

  return {
    ...p,
    estadoVenta: estadoDeVenta(p, local),
    esMio,
    calificacion,
    local: {
      id: local.id,
      nombre: local.nombre,
      logoUrl: local.logoUrl,
      portadaUrl: local.portadaUrl,
      eslogan: local.eslogan,
      direccion: local.direccion,
      latitud: local.latitud,
      longitud: local.longitud,
      tiempoPreparacionMin: local.tiempoPreparacionMin,
      tiempoEntregaMin: local.tiempoEntregaMin,
      zonaDomicilio: local.zonaDomicilio,
      radioDomicilioKm: local.radioDomicilioKm,
      precioDomicilio: local.precioDomicilio,
      whatsapp: local.whatsapp,
      redesSociales: local.redesSociales,
      metodosPago: local.metodosPago,
      estado: local.estado,
      abierto: estaAbierto(local.horarios),
      horarios: local.horarios.map(({ diaSemana, abreMin, cierraMin }) => ({ diaSemana, abreMin, cierraMin })),
    },
  };
}
