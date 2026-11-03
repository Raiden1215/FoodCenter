import { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { subirImagen } from '../../services/uploads.js';

export default function ImagenCampo({ etiqueta, valor, onChange, aspecto = 'aspect-video', ayuda }) {
  const entrada = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  async function elegir(e) {
    const archivo = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir la misma foto
    if (!archivo) return;
    setError('');
    setSubiendo(true);
    try {
      onChange(await subirImagen(archivo));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-gray-700">{etiqueta}</p>
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        disabled={subiendo}
        aria-label={valor ? `Cambiar ${etiqueta}` : `Subir ${etiqueta}`}
        className={`relative flex w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 ${aspecto}`}
      >
        {valor ? (
          <img src={valor} alt={etiqueta} className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-xs">
            <ImagePlus size={28} />
            {subiendo ? 'Subiendo…' : 'Toca para subir'}
          </span>
        )}
        {valor && subiendo && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-medium text-gray-700">Subiendo…</span>
        )}
      </button>
      <input ref={entrada} type="file" accept="image/*" className="hidden" onChange={elegir} />

      <div className="mt-1 flex items-center justify-between">
        {ayuda ? <p className="text-xs text-gray-500">{ayuda}</p> : <span />}
        {valor && (
          <button type="button" onClick={() => onChange(null)} className="text-xs font-medium text-red-700">
            Quitar
          </button>
        )}
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
