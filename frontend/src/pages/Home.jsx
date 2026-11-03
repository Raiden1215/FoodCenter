import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bot } from 'lucide-react';
import PestanasCategorias from '../components/productos/PestanasCategorias.jsx';
import TarjetaProducto from '../components/productos/TarjetaProducto.jsx';
import { api } from '../services/api.js';

export default function Home() {
  const [categoria, setCategoria] = useState(null); // null = Todos
  const [estado, setEstado] = useState({ cargando: true });

  useEffect(() => {
    let vigente = true;
    setEstado({ cargando: true });
    api(categoria ? `/productos?categoria=${categoria}` : '/productos')
      .then((productos) => vigente && setEstado({ productos }))
      .catch((err) => vigente && setEstado({ error: err.message }));
    return () => {
      vigente = false;
    };
  }, [categoria]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {/* La búsqueda tiene su propia pantalla (sin barra inferior) */}
        <Link to="/buscar" aria-label="Buscar" className="flex flex-1 items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-2.5">
          <Search size={18} className="text-gray-400" />
          <span className="text-sm text-gray-400">Buscar comida, locales…</span>
        </Link>
        <button type="button" aria-label="Abrir chatbot" className="rounded-full bg-brand-600 p-2.5 text-white">
          <Bot size={20} />
        </button>
      </div>

      <PestanasCategorias valor={categoria} onChange={setCategoria} />

      {estado.cargando && <p className="text-sm text-gray-500">Cargando productos…</p>}
      {estado.error && <p role="alert" className="text-sm text-red-700">{estado.error}</p>}
      {estado.productos?.length === 0 && (
        <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          {categoria ? (
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
