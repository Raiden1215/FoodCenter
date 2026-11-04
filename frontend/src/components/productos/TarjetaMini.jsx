import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { formatearPrecio, formatearPromedio } from '../../utils/formato.js';

const ETIQUETAS = { FUERA_DE_HORARIO: 'Fuera de horario', NO_DISPONIBLE: 'No disponible' };

// Tarjeta compacta de un producto dentro de la conversación con el asistente.
export default function TarjetaMini({ producto }) {
  const etiqueta = ETIQUETAS[producto.estadoVenta];
  const foto = producto.imagenes?.[0]?.url;
  return (
    <Link to={`/producto/${producto.id}`} className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-2">
      <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {foto && <img src={foto} alt="" className={`h-full w-full object-cover ${etiqueta ? 'opacity-60 grayscale' : ''}`} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{producto.nombre}</p>
        <p className="text-sm font-bold text-brand-700">{formatearPrecio(producto.precio)}</p>
        <p className="flex items-center gap-2 truncate text-xs text-gray-500">
          <span className="truncate">{producto.local.nombre}</span>
          {producto.calificacion?.total > 0 && (
            <span className="flex shrink-0 items-center gap-0.5">
              <Star size={11} fill="currentColor" className="text-amber-500" aria-hidden="true" />
              {formatearPromedio(producto.calificacion.promedio)}
            </span>
          )}
          {etiqueta && <span className="shrink-0 font-medium text-gray-700">{etiqueta}</span>}
        </p>
      </div>
    </Link>
  );
}
