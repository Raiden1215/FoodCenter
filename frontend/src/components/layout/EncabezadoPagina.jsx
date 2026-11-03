import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function EncabezadoPagina({ titulo, volverA = '/mi-local' }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Link to={volverA} aria-label="Volver" className="-ml-2 rounded-full p-2 text-gray-700">
        <ArrowLeft size={22} />
      </Link>
      <h1 className="text-lg font-semibold">{titulo}</h1>
    </div>
  );
}
