import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bot } from 'lucide-react';
import PestanasCategorias, { VALOR_RECOMENDADO } from '../components/productos/PestanasCategorias.jsx';
import TarjetaProducto from '../components/productos/TarjetaProducto.jsx';
import { api } from '../services/api.js';

const NOTAS_ORIGEN = {
  ia: 'Selección del asistente de IA.',
  respaldo: 'Sugerencias según calificaciones y novedades (el asistente de IA no está disponible en este momento).',
};

export default function Home() {
  const [categoria, setCategoria] = useState(null); // null = Todos; VALOR_RECOMENDADO = selección del asistente
  const [estado, setEstado] = useState({ cargando: true });
  const recomendados = categoria === VALOR_RECOMENDADO;

  useEffect(() => {
    let vigente = true;
    setEstado({ cargando: true });
    const ruta = recomendados ? '/chatbot/recomendados' : categoria ? `/productos?categoria=${categoria}` : '/productos';
    api(ruta)
      .then((datos) => vigente && setEstado(recomendados ? { productos: datos.productos, origen: datos.origen } : { productos: datos }))
      .catch((err) => vigente && setEstado({ error: err.message }));
    return () => {
      vigente = false;
    };
  }, [categoria, recomendados]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {/* La búsqueda tiene su propia pantalla (sin barra inferior) */}
        <Link to="/buscar" aria-label="Buscar" className="flex flex-1 items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-2.5">
          <Search size={18} className="text-gray-400" />
          <span className="text-sm text-gray-400">Buscar comida, locales…</span>
        </Link>
        <Link to="/asistente" aria-label="Abrir asistente" className="rounded-full bg-brand-600 p-2.5 text-white">
          <Bot size={20} />
        </Link>
      </div>

      <PestanasCategorias valor={categoria} onChange={setCategoria} conIA />

      {estado.cargando && <p className="text-sm text-gray-500">Cargando productos…</p>}
      {estado.error && <p role="alert" className="text-sm text-red-700">{estado.error}</p>}
      {recomendados && estado.origen && <p className="text-xs text-gray-500">{NOTAS_ORIGEN[estado.origen]}</p>}
      {estado.productos?.length === 0 && (
        <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          {recomendados ? (
            'Aún no hay productos para recomendar.'
          ) : categoria ? (
            'Aún no hay productos en esta categoría.'
          ) : (
            <>Aún no hay productos publicados. Crea tu local en <strong>Mi Local</strong> y publica el primero.</>
          )}
        </p>
      )}
      {estado.productos?.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {estado.productos.map((p) => (
            <TarjetaProducto key={p.id} producto={p} />
          ))}
        </div>
      )}
    </div>
  );
}
