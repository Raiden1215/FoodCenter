import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { formatearPrecio, formatearPromedio } from '../../utils/formato.js';

const ETIQUETAS = { FUERA_DE_HORARIO: 'Fuera de horario', NO_DISPONIBLE: 'No disponible' };
const TONOS = {
  DISPONIBLE: 'border-brand-100 bg-white',
  FUERA_DE_HORARIO: 'border-amber-200 bg-amber-50',
  NO_DISPONIBLE: 'border-gray-200 bg-gray-100',
};

export default function TarjetaProducto({ producto }) {
  const { estadoVenta = 'DISPONIBLE' } = producto;
  const etiqueta = ETIQUETAS[estadoVenta];
  const foto = producto.imagenes?.[0]?.url;

  return (
    <Link to={`/producto/${producto.id}`} className="block">
    <article className={`overflow-hidden rounded-2xl border ${TONOS[estadoVenta]}`}>
      <div className="relative aspect-[4/3] bg-gray-100">
        {foto && (
          <img
            src={foto}
            alt={producto.nombre}
            loading="lazy"
            className={`h-full w-full object-cover ${etiqueta ? 'opacity-60 grayscale' : ''}`}
          />
        )}
        {etiqueta && (
          <span className="absolute top-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">{etiqueta}</span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm leading-tight font-semibold">{producto.nombre}</h3>
        <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">{producto.descripcion}</p>
        {producto.motivo && <p className="mt-1 text-xs text-brand-700 italic">{producto.motivo}</p>}
        <p className="mt-2 text-sm font-bold text-brand-700">{formatearPrecio(producto.precio)}</p>
        {producto.calificacion?.total > 0 && (
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-600">
            <Star size={13} fill="currentColor" className="text-amber-500" aria-hidden="true" />
            {formatearPromedio(producto.calificacion.promedio)} ({producto.calificacion.total})
          </p>
        )}
        {producto.local && <p className="mt-1 truncate text-xs text-gray-500">{producto.local.nombre}</p>}
      </div>
    </article>
    </Link>
  );
}
