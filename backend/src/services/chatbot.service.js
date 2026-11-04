import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { estadoDeVenta } from './producto.service.js';
import { resumenPorProducto, SIN_RESENAS } from './resena.service.js';
import { generarJSON, geminiConfigurado } from './gemini.service.js';
import {
  construirSistemaChat,
  construirSistemaRecomendacion,
  limpiarTexto,
  ordenarParaRecomendar,
  seleccionarCandidatos,
} from '../utils/contextoCatalogo.js';

const MAXIMO_PRODUCTOS_EN_RESPUESTA = 4;
const MAXIMO_RECOMENDADOS = 8;
const TURNOS_DE_HISTORIAL = 6;
const VIGENCIA_IA_MS = 30 * 60_000;
const VIGENCIA_RESPALDO_MS = 2 * 60_000; // si la IA falló, se reintenta pronto

const INCLUIR = {
  imagenes: { orderBy: { orden: 'asc' }, take: 1 },
  local: { select: { id: true, nombre: true, logoUrl: true, estado: true, horarios: true, precioDomicilio: true, tiempoEntregaMin: true } },
};

// Productos visibles con su estado de venta y su calificación, listos para armar el contexto y las tarjetas.
async function cargarProductos(donde, tomar) {
  const productos = await prisma.producto.findMany({ where: { activo: true, ...donde }, orderBy: { creadoEn: 'desc' }, take: tomar, include: INCLUIR });
  const resumenes = await resumenPorProducto(productos.map((p) => p.id));
  const ahora = new Date();
  return productos.map((p) => ({
    ...p,
    estadoVenta: estadoDeVenta(p, p.local, ahora),
    calificacion: resumenes.get(p.id) ?? SIN_RESENAS,
  }));
}

// Misma forma que el catálogo, para reutilizar las tarjetas del frontend.
const aTarjeta = ({ local, ...p }, motivo) => ({
  id: p.id,
  nombre: p.nombre,
  descripcion: p.descripcion,
  categoria: p.categoria,
  precio: p.precio,
  cantidadDisponible: p.cantidadDisponible,
  creadoEn: p.creadoEn,
  estadoVenta: p.estadoVenta,
  calificacion: p.calificacion,
  imagenes: p.imagenes.map((i) => ({ url: i.url })),
  local: { id: local.id, nombre: local.nombre, logoUrl: local.logoUrl },
  ...(motivo ? { motivo } : {}),
});

// Gemini espera turnos que empiecen con el usuario y se alternen; se fusionan los consecutivos del mismo rol.
function armarMensajes(historial, mensaje) {
  const turnos = [...historial.slice(-TURNOS_DE_HISTORIAL), { rol: 'usuario', texto: mensaje }].map((t) => ({
    role: t.rol === 'usuario' ? 'user' : 'model',
    texto: limpiarTexto(t.texto, 1500),
  }));
  const resultado = [];
  for (const turno of turnos) {
    const ultimo = resultado.at(-1);
    if (ultimo?.role === turno.role) ultimo.parts[0].text += `\n${turno.texto}`;
    else resultado.push({ role: turno.role, parts: [{ text: turno.texto }] });
  }
  while (resultado.length && resultado[0].role !== 'user') resultado.shift();
  return resultado;
}

const ESQUEMA_RESPUESTA = {
  type: 'object',
  properties: {
    respuesta: { type: 'string', description: 'Respuesta para el usuario, en español y en máximo 100 palabras.' },
    productos: { type: 'array', items: { type: 'string' }, description: 'Ids exactos de los productos recomendados (máximo 4). Vacío si no recomiendas ninguno.' },
  },
  required: ['respuesta', 'productos'],
};

// RF-39, RF-40 y RF-41. El modelo solo ve productos reales y solo puede devolver ids de esos productos.
export async function responder(mensaje, historial = []) {
  if (!geminiConfigurado()) throw new HttpError(503, 'El asistente aún no está configurado.');

  const catalogo = await cargarProductos({}, 300);
  const candidatos = seleccionarCandidatos(mensaje, catalogo);

  const salida = await generarJSON({
    sistema: construirSistemaChat(candidatos),
    mensajes: armarMensajes(historial, mensaje),
    esquema: ESQUEMA_RESPUESTA,
  });

  const texto = typeof salida?.respuesta === 'string' ? salida.respuesta.replace(/[ \t]+\n/g, '\n').trim().slice(0, 900) : '';
  if (!texto) throw new HttpError(503, 'No pude generar una respuesta para eso. Prueba con otra pregunta.');

  // Los ids que invente el modelo se descartan: solo se muestran productos que existen y que se le dieron.
  const permitidos = new Map(candidatos.map((p) => [p.id, p]));
  const ids = [...new Set(Array.isArray(salida.productos) ? salida.productos : [])]
    .filter((id) => typeof id === 'string' && permitidos.has(id))
    .slice(0, MAXIMO_PRODUCTOS_EN_RESPUESTA);

  return { respuesta: texto, productos: ids.map((id) => aTarjeta(permitidos.get(id))) };
}

// ---------- Recomendado por IA (RF-42) ----------

const ESQUEMA_RECOMENDACION = {
  type: 'object',
  properties: {
    recomendados: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, motivo: { type: 'string', description: 'Máximo 60 caracteres.' } },
        required: ['id', 'motivo'],
      },
    },
  },
  required: ['recomendados'],
};

function respaldo(candidatos) {
  return ordenarParaRecomendar(candidatos, MAXIMO_RECOMENDADOS).map((p) => ({
    id: p.id,
    motivo: p.calificacion.total > 0 && p.calificacion.promedio >= 4 ? 'Muy bien calificado' : 'Reciente en FoodCenter',
  }));
}

// Se guardan solo los ids elegidos y su motivo; el estado (abierto, agotado...) se vuelve a consultar en cada petición.
let memoria = null;
export const reiniciarMemoriaRecomendados = () => {
  memoria = null;
};

export async function recomendados() {
  if (!memoria || memoria.vence < Date.now()) {
    const candidatos = ordenarParaRecomendar(await cargarProductos({}, 300), 30);
    let origen = 'respaldo';
    let elegidos = respaldo(candidatos);

    if (candidatos.length && geminiConfigurado()) {
      try {
        const salida = await generarJSON({
          sistema: construirSistemaRecomendacion(candidatos),
          mensajes: [{ role: 'user', parts: [{ text: 'Elige los productos para la pestaña "Recomendado por IA".' }] }],
          esquema: ESQUEMA_RECOMENDACION,
          maxTokens: 900,
        });
        const permitidos = new Set(candidatos.map((p) => p.id));
        const vistos = new Set();
        const delModelo = (Array.isArray(salida?.recomendados) ? salida.recomendados : [])
          .filter((r) => typeof r?.id === 'string' && permitidos.has(r.id) && !vistos.has(r.id) && vistos.add(r.id))
          .slice(0, MAXIMO_RECOMENDADOS)
          .map((r) => ({ id: r.id, motivo: limpiarTexto(r.motivo, 60) }));
        if (delModelo.length) {
          elegidos = delModelo;
          origen = 'ia';
        }
      } catch {
        /* el error ya quedó en el registro; se muestra la selección de respaldo */
      }
    }
    memoria = { origen, elegidos, vence: Date.now() + (origen === 'ia' ? VIGENCIA_IA_MS : VIGENCIA_RESPALDO_MS) };
  }

  const frescos = new Map((await cargarProductos({ id: { in: memoria.elegidos.map((e) => e.id) } }, MAXIMO_RECOMENDADOS)).map((p) => [p.id, p]));
  const productos = memoria.elegidos.filter((e) => frescos.has(e.id)).map((e) => aTarjeta(frescos.get(e.id), e.motivo));
  return { origen: memoria.origen, productos };
}
