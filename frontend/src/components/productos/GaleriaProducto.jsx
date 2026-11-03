import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const botonFlecha = 'absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white';

// Carrusel deslizable con el dedo; en el computador, con flechas. Los puntos indican la foto actual.
export default function GaleriaProducto({ imagenes, alt, atenuada = false }) {
  const pista = useRef(null);
  const [indice, setIndice] = useState(0);
  const total = imagenes.length;

  const alDesplazar = () => {
    const el = pista.current;
    if (el) setIndice(Math.round(el.scrollLeft / (el.clientWidth || 1)));
  };
  const ir = (destino) => pista.current?.scrollTo?.({ left: destino * pista.current.clientWidth, behavior: 'smooth' });

  if (!total) return <div className="aspect-[4/3] bg-gray-100" />;

  return (
    <div className="relative" role="group" aria-roledescription="carrusel" aria-label={`Fotos de ${alt}`}>
      <div
        ref={pista}
        onScroll={alDesplazar}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {imagenes.map((img, i) => (
          <img
            key={i}
            src={img.url}
            alt={`${alt} (foto ${i + 1} de ${total})`}
            className={`aspect-[4/3] w-full shrink-0 snap-center object-cover ${atenuada ? 'opacity-60 grayscale' : ''}`}
          />
        ))}
      </div>

      {total > 1 && (
        <>
          {indice > 0 && (
            <button type="button" aria-label="Foto anterior" onClick={() => ir(indice - 1)} className={`${botonFlecha} left-2`}>
              <ChevronLeft size={20} />
            </button>
          )}
          {indice < total - 1 && (
            <button type="button" aria-label="Foto siguiente" onClick={() => ir(indice + 1)} className={`${botonFlecha} right-2`}>
              <ChevronRight size={20} />
            </button>
          )}
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5" aria-hidden="true">
            {imagenes.map((_, i) => (
              <span key={i} className={`size-2 rounded-full ${i === indice ? 'bg-white' : 'bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
