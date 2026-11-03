import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Search, X } from 'lucide-react';
import PestanasCategorias from '../components/productos/PestanasCategorias.jsx';
import TarjetaProducto from '../components/productos/TarjetaProducto.jsx';
import { api } from '../services/api.js';

function Cuadricula({ productos }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {productos.map((p) => (
        <TarjetaProducto key={p.id} producto={p} />
      ))}
    </div>
  );
}

export default function Buscar() {
  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState(null);
  const [resultados, setResultados] = useState(null); // null = todavía no se busca nada
  const [historial, setHistorial] = useState([]);
  const [sugeridos, setSugeridos] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const contador = useRef(0); // descarta respuestas de búsquedas que ya quedaron viejas
  const consulta = texto.trim();

  // Al abrir: historial y productos sugeridos (RF-15 y RF-17)
  useEffect(() => {
    api('/busquedas').then(setHistorial).catch(() => {});
    api('/productos')
      .then((productos) => setSugeridos(productos.filter((p) => p.estadoVenta === 'DISPONIBLE').slice(0, 6)))
      .catch(() => {});
  }, []);

  // Busca 300 ms después de la última tecla o al cambiar de pestaña (RF-16 y RF-18)
  useEffect(() => {
    const id = ++contador.current;
    if (!consulta && !categoria) {
      setResultados(null);
      setBuscando(false);
      setError('');
      return;
    }
    setBuscando(true);
    const espera = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (consulta) params.set('q', consulta);
        if (categoria) params.set('categoria', categoria);
        const datos = await api(`/productos?${params}`);
        if (id === contador.current) {
          setResultados(datos);
          setError('');
        }
      } catch (err) {
        if (id === contador.current) setError(err.message);
      } finally {
        if (id === contador.current) setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(espera);
  }, [consulta, categoria]);

  async function guardar(valor) {
    const v = valor.trim();
    if (!v) return;
    try {
      setHistorial(await api('/busquedas', { method: 'POST', body: { texto: v } }));
    } catch {
      /* el historial es opcional: si falla, la búsqueda sigue funcionando */
    }
  }

  function enviar(e) {
    e.preventDefault();
    guardar(texto);
    document.activeElement?.blur(); // cierra el teclado en el celular
  }

  function usarDelHistorial(valor) {
    setTexto(valor);
    guardar(valor);
  }

  async function quitar(id) {
    setHistorial((h) => h.filter((b) => b.id !== id));
    try {
      await api(`/busquedas/${id}`, { method: 'DELETE' });
    } catch {
      /* se ignora */
    }
  }

  async function vaciar() {
    setHistorial([]);
    try {
      await api('/busquedas', { method: 'DELETE' });
    } catch {
      /* se ignora */
    }
  }

  return (
    <div className="mx-auto min-h-full max-w-xl px-4 pb-8" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))' }}>
      <form onSubmit={enviar} role="search" className="flex items-center gap-2">
        <Link to="/" aria-label="Volver" className="-ml-2 rounded-full p-2 text-gray-700">
          <ArrowLeft size={22} />
        </Link>
        <div className="flex flex-1 items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-2.5">
          <Search size={18} className="shrink-0 text-gray-400" />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoFocus
            aria-label="Buscar"
            placeholder="Buscar comida, locales…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
          />
          {texto && (
            <button type="button" aria-label="Borrar texto" onClick={() => setTexto('')}>
              <X size={18} className="text-gray-400" />
            </button>
          )}
        </div>
      </form>

      <div className="mt-3">
        <PestanasCategorias valor={categoria} onChange={setCategoria} />
      </div>

      <div className="mt-4 space-y-5">
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

        {resultados === null && !error && (
          <>
            {historial.length > 0 && (
              <section>
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-700">Búsquedas recientes</h2>
                  <button type="button" onClick={vaciar} className="text-xs font-medium text-brand-700">
                    Borrar todo
                  </button>
                </div>
                <ul>
                  {historial.map((b) => (
                    <li key={b.id} className="flex items-center gap-2 border-b border-brand-100 py-1">
                      <button type="button" onClick={() => usarDelHistorial(b.texto)} className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left text-sm">
                        <Clock size={16} className="shrink-0 text-gray-400" />
                        <span className="truncate">{b.texto}</span>
                      </button>
                      <button type="button" onClick={() => quitar(b.id)} aria-label={`Quitar "${b.texto}" del historial`} className="p-2 text-gray-400">
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {sugeridos.length > 0 && (
              <section>
                <h2 className="mb-2 text-sm font-semibold text-gray-700">Sugeridos</h2>
                <Cuadricula productos={sugeridos} />
              </section>
            )}
          </>
        )}

        {resultados !== null && (
          <>
            {buscando && <p className="text-sm text-gray-500">Buscando…</p>}
            {!buscando && resultados.length === 0 && (
              <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                {consulta ? <>Sin resultados para «{consulta}».</> : 'Aún no hay productos en esta categoría.'}
              </p>
            )}
            {resultados.length > 0 && <Cuadricula productos={resultados} />}
          </>
        )}
      </div>
    </div>
  );
}
