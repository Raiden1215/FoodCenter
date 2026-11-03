import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { formatearFecha, formatearPromedio } from '../../utils/formato.js';
import { Estrellas, EstrellasInput } from '../ui/Estrellas.jsx';

const SIN_RESEÑA = { calificacion: 0, comentario: '' };

// Reseñas de un producto (RF-12): lista, promedio y formulario para calificar (una reseña por usuario).
export default function SeccionResenas({ productoId, esMio, onCambio }) {
  const [datos, setDatos] = useState(null);
  const [form, setForm] = useState(SIN_RESEÑA);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  function aplicar(nuevos) {
    setDatos(nuevos);
    setForm(nuevos.miResena ? { calificacion: nuevos.miResena.calificacion, comentario: nuevos.miResena.comentario ?? '' } : SIN_RESEÑA);
    onCambio?.(nuevos.calificacion);
  }

  useEffect(() => {
    let vigente = true;
    api(`/productos/${productoId}/resenas`)
      .then((d) => vigente && aplicar(d))
      .catch((err) => vigente && setError(err.message));
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoId]);

  async function enviar(e) {
    e.preventDefault();
    if (!form.calificacion) {
      setError('Elige de 1 a 5 estrellas');
      return;
    }
    setError('');
    setEnviando(true);
    try {
      aplicar(await api(`/productos/${productoId}/resenas`, { method: 'PUT', body: { calificacion: form.calificacion, comentario: form.comentario } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function eliminar() {
    if (!window.confirm('¿Eliminar tu reseña?')) return;
    setError('');
    setEnviando(true);
    try {
      aplicar(await api(`/productos/${productoId}/resenas`, { method: 'DELETE' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const { calificacion, resenas } = datos ?? { calificacion: { promedio: null, total: 0 }, resenas: [] };

  return (
    <section aria-labelledby="titulo-resenas" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="titulo-resenas" className="font-semibold">Reseñas</h2>
        {calificacion.total > 0 && (
          <span className="flex items-center gap-2 text-sm text-gray-600">
            <Estrellas valor={calificacion.promedio} />
            <strong>{formatearPromedio(calificacion.promedio)}</strong> ({calificacion.total})
          </span>
        )}
      </div>

      {esMio ? (
        <p className="text-sm text-gray-500">No puedes calificar tu propio producto.</p>
      ) : (
        datos && (
          <form onSubmit={enviar} className="space-y-3 rounded-2xl border border-brand-100 bg-white p-4">
            <p className="text-sm font-medium text-gray-700">{datos.miResena ? 'Tu reseña' : 'Califica este producto'}</p>
            <EstrellasInput valor={form.calificacion} onChange={(calificacion) => setForm((f) => ({ ...f, calificacion }))} />
            <label htmlFor="comentario" className="sr-only">Comentario</label>
            <textarea
              id="comentario"
              rows={3}
              maxLength={500}
              placeholder="Cuéntanos qué te pareció (opcional)"
              value={form.comentario}
              onChange={(e) => setForm((f) => ({ ...f, comentario: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:border-brand-500 focus:bg-white"
            />
            <div className="flex items-center gap-3">
              <button type="submit" disabled={enviando} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {datos.miResena ? 'Actualizar' : 'Publicar'}
              </button>
              {datos.miResena && (
                <button type="button" onClick={eliminar} disabled={enviando} className="text-sm font-medium text-red-700">
                  Eliminar mi reseña
                </button>
              )}
            </div>
          </form>
        )
      )}

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      {datos && resenas.length === 0 && <p className="text-sm text-gray-500">Aún no hay reseñas.</p>}
      <ul className="space-y-3">
        {resenas.map((r) => (
          <li key={r.id} className="border-b border-brand-100 pb-3">
            <div className="flex items-center gap-2 text-sm">
              <Estrellas valor={r.calificacion} tamano={14} />
              <span className="font-medium">{r.autor}</span>
              {r.esMia && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">Tú</span>}
              <span className="ml-auto text-xs text-gray-500">{formatearFecha(r.creadoEn)}</span>
            </div>
            {r.comentario && <p className="mt-1 text-sm text-gray-700">{r.comentario}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
