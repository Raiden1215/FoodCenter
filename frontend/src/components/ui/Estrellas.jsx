import { Star } from 'lucide-react';

const SERIE = [1, 2, 3, 4, 5];

// Estrellas de solo lectura: el valor se redondea a la estrella más cercana.
export function Estrellas({ valor, tamano = 16 }) {
  const llenas = Math.round(valor ?? 0);
  return (
    <span role="img" aria-label={`${valor ?? 0} de 5 estrellas`} className="inline-flex text-amber-500">
      {SERIE.map((n) => (
        <Star key={n} size={tamano} fill={n <= llenas ? 'currentColor' : 'none'} aria-hidden="true" />
      ))}
    </span>
  );
}

// Selector de 1 a 5 estrellas.
export function EstrellasInput({ valor, onChange }) {
  return (
    <div role="radiogroup" aria-label="Tu calificación" className="inline-flex gap-1 text-amber-500">
      {SERIE.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={valor === n}
          aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <Star size={30} fill={n <= valor ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
