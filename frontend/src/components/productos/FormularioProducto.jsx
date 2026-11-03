import { useState } from 'react';
import { api } from '../../services/api.js';
import { CATEGORIAS } from '../../utils/constantes.js';
import { construirPayloadProducto, estadoInicialProducto } from '../../utils/producto.js';
import { AreaForm, CampoForm, SelectorForm } from '../ui/CampoForm.jsx';
import GaleriaCampo from '../ui/GaleriaCampo.jsx';

export default function FormularioProducto({ producto, onGuardado }) {
  const [f, setF] = useState(() => estadoInicialProducto(producto));
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setF((a) => ({ ...a, [campo]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await api(producto ? `/productos/${producto.id}` : '/productos', {
        method: producto ? 'PUT' : 'POST',
        body: construirPayloadProducto(f),
      });
      onGuardado();
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  async function eliminar() {
    if (!window.confirm(`¿Eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`)) return;
    setError('');
    setEnviando(true);
    try {
      await api(`/productos/${producto.id}`, { method: 'DELETE' });
      onGuardado();
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <GaleriaCampo etiqueta="Fotos" valor={f.imagenes} onChange={(imagenes) => setF((a) => ({ ...a, imagenes }))} />
      <CampoForm id="nombre" label="Nombre" required value={f.nombre} onChange={cambiar('nombre')} />
      <AreaForm id="descripcion" label="Descripción" required value={f.descripcion} onChange={cambiar('descripcion')} />
      <SelectorForm id="categoria" label="Categoría" required placeholder="Elige una categoría" opciones={CATEGORIAS} value={f.categoria} onChange={cambiar('categoria')} />
      <div className="grid grid-cols-2 gap-3">
        <CampoForm id="precio" label="Precio ($)" type="number" min="100" step="100" inputMode="numeric" required value={f.precio} onChange={cambiar('precio')} />
        <CampoForm id="cantidad" label="Cantidad disponible" type="number" min="0" inputMode="numeric" required value={f.cantidadDisponible} onChange={cambiar('cantidadDisponible')} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={f.activo} onChange={(e) => setF((a) => ({ ...a, activo: e.target.checked }))} className="size-4 accent-brand-600" />
        Visible en la pantalla principal
      </label>
      <p className="-mt-2 text-xs text-gray-500">La dirección, los horarios y el contacto se toman automáticamente de tu local.</p>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      <button type="submit" disabled={enviando} className="w-full rounded-xl bg-brand-600 py-3.5 font-semibold tracking-wide text-white uppercase disabled:opacity-60">
        {enviando ? 'Guardando…' : producto ? 'Guardar cambios' : 'Publicar producto'}
      </button>
      {producto && (
        <button type="button" onClick={eliminar} disabled={enviando} className="w-full rounded-xl border border-red-200 bg-white py-3 font-semibold text-red-700 disabled:opacity-60">
          Eliminar producto
        </button>
      )}
    </form>
  );
}
