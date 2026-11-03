import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCarrito } from '../context/CarritoContext.jsx';
import { api } from '../services/api.js';
import { formatearPrecio } from '../utils/formato.js';

const ORDENES = [
  { valor: 'fecha', etiqueta: 'Fecha de publicación' },
  { valor: 'alfabetico', etiqueta: 'Orden alfabético' },
  { valor: 'disponibilidad', etiqueta: 'Disponibilidad' },
];
const RANGO_ESTADO = { DISPONIBLE: 0, FUERA_DE_HORARIO: 1, NO_DISPONIBLE: 2 };
const ETIQUETA_ESTADO = { FUERA_DE_HORARIO: 'Fuera de horario', NO_DISPONIBLE: 'No disponible' };

const porNombre = (a, b) => (a.producto?.nombre ?? '').localeCompare(b.producto?.nombre ?? '', 'es');

// RF-20. Los productos que ya no existen van siempre al final.
function ordenar(filas, criterio) {
  return [...filas].sort((a, b) => {
    if (!a.producto || !b.producto) return Number(!a.producto) - Number(!b.producto);
    if (criterio === 'alfabetico') return porNombre(a, b);
    if (criterio === 'disponibilidad') return RANGO_ESTADO[a.producto.estadoVenta] - RANGO_ESTADO[b.producto.estadoVenta] || porNombre(a, b);
    return new Date(b.producto.creadoEn) - new Date(a.producto.creadoEn); // más reciente primero
  });
}

export default function Cart() {
  const { items, cambiarCantidad, quitar, vaciar } = useCarrito();
  const [criterio, setCriterio] = useState('fecha');
  const [estado, setEstado] = useState({ cargando: items.length > 0 });

  // Los datos (precio, existencias, estado) se consultan al servidor; en el dispositivo solo se guardan ids y cantidades.
  const ids = useMemo(() => items.map((i) => i.id).sort().join(','), [items]);
  useEffect(() => {
    if (!ids) {
      setEstado({ productos: [] });
      return;
    }
    let vigente = true;
    api(`/productos?ids=${ids}`)
      .then((productos) => vigente && setEstado({ productos }))
      .catch((err) => vigente && setEstado({ error: err.message }));
    return () => {
      vigente = false;
    };
  }, [ids]);

  const mapa = useMemo(() => new Map((estado.productos ?? []).map((p) => [p.id, p])), [estado.productos]);

  // Si bajaron las existencias, se ajusta la cantidad guardada.
  useEffect(() => {
    for (const item of items) {
      const p = mapa.get(item.id);
      if (p && p.cantidadDisponible > 0 && item.cantidad > p.cantidadDisponible) cambiarCantidad(item.id, p.cantidadDisponible, p.cantidadDisponible);
    }
  }, [items, mapa, cambiarCantidad]);

  const filas = ordenar(items.map((item) => ({ item, producto: mapa.get(item.id) })), criterio);
  const comprables = filas.filter((f) => f.producto?.estadoVenta === 'DISPONIBLE');
  const total = comprables.reduce((suma, f) => suma + f.producto.precio * f.item.cantidad, 0);
  const excluidos = filas.length - comprables.length;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 pt-10 text-center">
        <ShoppingCart size={48} className="text-brand-600" />
        <h1 className="text-lg font-semibold">Tu carrito está vacío</h1>
        <p className="max-w-xs text-sm text-gray-600">Agrega productos desde la pantalla principal para verlos aquí.</p>
        <Link to="/" className="mt-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold tracking-wide text-white uppercase">Ver productos</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Carrito</h1>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          <ArrowUpDown size={16} aria-hidden="true" />
          <span className="sr-only">Ordenar por</span>
          <select aria-label="Ordenar por" value={criterio} onChange={(e) => setCriterio(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm">
            {ORDENES.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
          </select>
        </label>
      </div>

      {estado.cargando === undefined && !estado.productos && !estado.error && <p className="text-sm text-gray-500">Cargando…</p>}
      {estado.cargando && <p className="text-sm text-gray-500">Cargando…</p>}
      {estado.error && <p role="alert" className="text-sm text-red-700">{estado.error}</p>}

      <ul className="space-y-3">
        {filas.map(({ item, producto }) => {
          if (!producto) {
            return estado.productos ? (
              <li key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-100 p-3 text-sm text-gray-600">
                <span>Este producto ya no está disponible.</span>
                <button type="button" onClick={() => quitar(item.id)} className="font-semibold text-red-700">Quitar</button>
              </li>
            ) : null;
          }
          const etiqueta = ETIQUETA_ESTADO[producto.estadoVenta];
          const maximo = producto.cantidadDisponible;
          return (
            <li key={item.id} className={`flex gap-3 rounded-2xl border p-2 ${etiqueta ? (producto.estadoVenta === 'NO_DISPONIBLE' ? 'border-gray-200 bg-gray-100' : 'border-amber-200 bg-amber-50') : 'border-brand-100 bg-white'}`}>
              <Link to={`/producto/${producto.id}`} className="size-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                {producto.imagenes[0] && <img src={producto.imagenes[0].url} alt={producto.nombre} className={`h-full w-full object-cover ${etiqueta ? 'opacity-60 grayscale' : ''}`} />}
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/producto/${producto.id}`} className="line-clamp-2 text-sm leading-tight font-semibold">{producto.nombre}</Link>
                <p className="truncate text-xs text-gray-500">{producto.local.nombre}</p>
                <p className="text-sm font-bold text-brand-700">{formatearPrecio(producto.precio)}</p>
                {etiqueta && <p className="text-xs font-medium text-gray-700">{etiqueta}</p>}
                <div className="mt-1 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-gray-300 bg-white" role="group" aria-label={`Cantidad de ${producto.nombre}`}>
                    <button type="button" aria-label={`Menos ${producto.nombre}`} disabled={item.cantidad <= 1} onClick={() => cambiarCantidad(item.id, item.cantidad - 1, maximo)} className="p-1.5 disabled:opacity-30"><Minus size={16} /></button>
                    <span className="min-w-7 text-center text-sm font-semibold">{item.cantidad}</span>
                    <button type="button" aria-label={`Más ${producto.nombre}`} disabled={item.cantidad >= maximo} onClick={() => cambiarCantidad(item.id, item.cantidad + 1, maximo)} className="p-1.5 disabled:opacity-30"><Plus size={16} /></button>
                  </div>
                  <button type="button" onClick={() => quitar(item.id)} aria-label={`Quitar ${producto.nombre}`} className="p-2 text-gray-500"><Trash2 size={18} /></button>
                </div>
                {maximo > 0 && item.cantidad >= maximo && <p className="text-xs text-gray-500">Solo quedan {maximo} disponibles</p>}
              </div>
            </li>
          );
        })}
      </ul>

      {estado.productos && (
        <section className="space-y-3 rounded-2xl border border-brand-100 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total de productos disponibles</span>
            <strong className="text-lg text-brand-700">{formatearPrecio(total)}</strong>
          </div>
          {excluidos > 0 && <p className="text-xs text-gray-500">Los productos fuera de horario, no disponibles o eliminados no se incluyen en el total.</p>}
          <button type="button" disabled className="w-full rounded-xl bg-brand-600 py-3.5 font-semibold tracking-wide text-white uppercase disabled:opacity-40">
            Continuar con el pedido
          </button>
          <p className="text-center text-xs text-gray-500">La confirmación del pedido y el pago estarán disponibles próximamente.</p>
        </section>
      )}

      <button type="button" onClick={() => window.confirm('¿Vaciar el carrito?') && vaciar()} className="w-full text-sm font-medium text-red-700">
        Vaciar carrito
      </button>
    </div>
  );
}
