import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIAS } from '../../utils/constantes.js';

const PESTANAS = [{ valor: null, etiqueta: 'Todos' }, ...CATEGORIAS];

const botonFlecha =
  'absolute top-[calc(50%-2px)] z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-brand-100 bg-white text-gray-700 shadow';

// valor = null significa "Todos".
// En el celular se desliza con el dedo; en el computador hay flechas y la rueda del mouse mueve la lista.
export default function PestanasCategorias({ valor, onChange }) {
  const lista = useRef(null);
  const [hay, setHay] = useState({ izquierda: false, derecha: false });

  // Muestra cada flecha solo si hay más pestañas ocultas en esa dirección.
  const actualizar = useCallback(() => {
    const el = lista.current;
    if (!el) return;
    const izquierda = el.scrollLeft > 1;
    const derecha = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
    setHay((previo) => (previo.izquierda === izquierda && previo.derecha === derecha ? previo : { izquierda, derecha }));
  }, []);

  useEffect(() => {
    const el = lista.current;
    actualizar();

    // La rueda del mouse (vertical) desplaza la lista en horizontal. Si ya está en el extremo,
    // se deja pasar para que la página siga bajando con normalidad.
    function rueda(e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // ya es un gesto horizontal (touchpad)
      const maximo = el.scrollWidth - el.clientWidth;
      const delta = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY; // algunos navegadores envían líneas
      if (maximo <= 0 || (delta < 0 && el.scrollLeft <= 0) || (delta > 0 && el.scrollLeft >= maximo)) return;
      e.preventDefault();
      el.scrollLeft += delta;
    }

    el.addEventListener('wheel', rueda, { passive: false });
    window.addEventListener('resize', actualizar);
    const observador = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(actualizar);
    observador?.observe(el);

    return () => {
      el.removeEventListener('wheel', rueda);
      window.removeEventListener('resize', actualizar);
      observador?.disconnect();
    };
  }, [actualizar]);

  const mover = (direccion) =>
    lista.current.scrollBy({ left: direccion * lista.current.clientWidth * 0.7, behavior: 'smooth' });

  return (
    <div className="relative">
      <div
        ref={lista}
        role="tablist"
        aria-label="Categorías"
        onScroll={actualizar}
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {PESTANAS.map((p) => {
          const activa = p.valor === valor;
          return (
            <button
              key={p.etiqueta}
              type="button"
              role="tab"
              aria-selected={activa}
              onClick={(e) => {
                onChange(p.valor);
                // Si la pestaña quedó a medias en el borde, la acerca al centro.
                e.currentTarget.scrollIntoView?.({ inline: 'center', block: 'nearest', behavior: 'smooth' });
              }}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap ${
                activa ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-300 bg-white text-gray-700'
              }`}
            >
              {p.etiqueta}
            </button>
          );
        })}
      </div>

      {hay.izquierda && (
        <button type="button" aria-label="Ver categorías anteriores" onClick={() => mover(-1)} className={`${botonFlecha} left-0`}>
          <ChevronLeft size={18} />
        </button>
      )}
      {hay.derecha && (
        <button type="button" aria-label="Ver más categorías" onClick={() => mover(1)} className={`${botonFlecha} right-0`}>
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}
