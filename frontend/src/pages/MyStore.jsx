import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Store } from 'lucide-react';
import GestorPedidos from '../components/pedidos/GestorPedidos.jsx';
import { api } from '../services/api.js';
import { CATEGORIAS } from '../utils/constantes.js';
import { formatearPrecio } from '../utils/formato.js';

const etiquetaCategoria = (valor) => CATEGORIAS.find((c) => c.valor === valor)?.etiqueta ?? valor;

export default function MyStore() {
  const [datos, setDatos] = useState({ cargando: true });
  const [errorEstado, setErrorEstado] = useState('');

  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        const local = await api('/locales/mio');
        const productos = local ? await api('/productos/mios') : [];
        if (vigente) setDatos({ local, productos });
      } catch (err) {
        if (vigente) setDatos({ error: err.message });
      }
    })();
    return () => {
      vigente = false;
    };
  }, []);

  async function cambiarEstado(estado) {
    setErrorEstado('');
    try {
      const local = await api('/locales/mio/estado', { method: 'PATCH', body: { estado } });
      setDatos((d) => ({ ...d, local }));
    } catch (err) {
      setErrorEstado(err.message);
    }
  }

  if (datos.cargando) return <p className="text-sm text-gray-500">Cargando…</p>;
  if (datos.error) return <p role="alert" className="text-sm text-red-700">{datos.error}</p>;

  const { local, productos } = datos;

  if (!local) {
    return (
      <div className="flex flex-col items-center gap-3 pt-10 text-center">
        <Store size={48} className="text-brand-600" />
        <h1 className="text-lg font-semibold">Crea tu negocio</h1>
        <p className="max-w-xs text-sm text-gray-600">
          Registra tu local para publicar productos y recibir pedidos de clientes cercanos.
        </p>
        <Link
          to="/mi-local/editar"
          className="mt-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold tracking-wide text-white uppercase"
        >
          Crear mi local
        </Link>
      </div>
    );
  }

  const sinServicio = local.estado === 'SIN_SERVICIO';

  return (
    <div className="space-y-6 pb-20">
      <section className="overflow-hidden rounded-2xl border border-brand-100 bg-white">
        <div className="aspect-[3/1] bg-brand-100">
          {local.portadaUrl && <img src={local.portadaUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex items-center gap-3 p-4">
          <div className="-mt-10 size-16 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-brand-50">
            {local.logoUrl ? (
              <img src={local.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Store className="m-4 text-brand-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold">{local.nombre}</h1>
            {local.eslogan && <p className="truncate text-sm text-gray-600">{local.eslogan}</p>}
          </div>
          <Link
            to="/mi-local/editar"
            aria-label="Editar local"
            className="rounded-full border border-brand-100 p-2 text-brand-600 hover:bg-brand-50"
          >
            <Pencil size={18} />
          </Link>
        </div>
        <div className="border-t border-brand-100 p-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Estado del local</p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Estado del local">
            {[
              ['DISPONIBLE', 'Disponible'],
              ['SIN_SERVICIO', 'Sin servicio'],
            ].map(([valor, texto]) => (
              <button
                key={valor}
                type="button"
                aria-pressed={local.estado === valor}
                onClick={() => local.estado !== valor && cambiarEstado(valor)}
                className={`rounded-xl border py-2 text-sm font-medium transition-colors ${
                  local.estado === valor
                    ? valor === 'DISPONIBLE'
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-gray-700 bg-gray-700 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {texto}
              </button>
            ))}
          </div>
          {sinServicio && (
            <p className="mt-2 text-xs text-gray-500">
              Tus productos aparecen como "No disponible" y no reciben pedidos.
            </p>
          )}
          {errorEstado && (
            <p role="alert" className="mt-2 text-xs text-red-700">
              {errorEstado}
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Mis productos ({productos.length})</h2>
          <Link
            to="/mi-local/productos/nuevo"
            className="flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus size={16} /> Agregar
          </Link>
        </div>
        {productos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            Aún no has publicado productos.
          </p>
        ) : (
          <ul className="space-y-2">
            {productos.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/mi-local/productos/${p.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white p-2 transition-shadow hover:shadow-xs"
                >
                  <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {p.imagenes[0] && (
                      <img src={p.imagenes[0].url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">{p.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {etiquetaCategoria(p.categoria)} · {p.cantidadDisponible} disp.
                    </p>
                    <p className="text-sm font-bold text-brand-700">{formatearPrecio(p.precio)}</p>
                  </div>
                  {!p.activo && (
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">Oculto</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <GestorPedidos />
    </div>
  );
}
