import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { subirImagen } from '../../services/uploads.js';

export default function GaleriaCampo({ etiqueta, valor, onChange, max = 5 }) {
  const entrada = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  async function elegir(e) {
    const archivos = [...(e.target.files ?? [])].slice(0, max - valor.length);
    e.target.value = '';
    if (!archivos.length) return;
    setError('');
    setSubiendo(true);
    try {
      const nuevas = [];
      for (const archivo of archivos) nuevas.push(await subirImagen(archivo));
      onChange([...valor, ...nuevas]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  }

  const quitar = (indice) => onChange(valor.filter((_, i) => i !== indice));

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-gray-700">
        {etiqueta} <span className="font-normal text-gray-500">({valor.length}/{max})</span>
      </p>
      <div className="grid grid-cols-3 gap-2">
        {valor.map((url, i) => (
          <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-gray-200">
            <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 text-[10px] text-white">Principal</span>}
            <button
              type="button"
              onClick={() => quitar(i)}
              aria-label={`Quitar foto ${i + 1}`}
              className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {valor.length < max && (
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            disabled={subiendo}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400"
          >
            <Plus size={24} />
            {subiendo ? 'Subiendo…' : 'Agregar'}
          </button>
        )}
      </div>
      <input ref={entrada} type="file" accept="image/*" multiple className="hidden" onChange={elegir} />
      <p className="mt-1 text-xs text-gray-500">La primera foto es la que se muestra en la pantalla principal.</p>
      {error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
