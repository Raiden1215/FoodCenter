import { ExternalLink, X } from 'lucide-react';

export default function ModalComprobante({ url, onCerrar }) {
  if (!url) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Comprobante de pago"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      onClick={onCerrar}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h3 className="font-semibold text-gray-800">Comprobante de pago Nequi</h3>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar modal"
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex max-h-[70vh] items-center justify-center overflow-auto bg-gray-50 p-4">
          <img src={url} alt="Comprobante Nequi" className="max-h-[65vh] w-auto rounded-lg object-contain shadow-xs" />
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
          >
            <ExternalLink size={14} /> Abrir imagen original
          </a>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl bg-gray-800 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
