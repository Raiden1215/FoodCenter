import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Settings() {
  const { usuario, logout } = useAuth();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Configuraciones</h1>

      <div className="rounded-xl border border-brand-100 bg-white p-4">
        <p className="font-semibold">{usuario.nombre}</p>
        <p className="text-sm text-gray-600">{usuario.correo}</p>
        {usuario.direccion && <p className="mt-1 text-sm text-gray-600">{usuario.direccion}</p>}
      </div>

      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 font-semibold text-red-700"
      >
        <LogOut size={18} /> Cerrar sesión
      </button>
    </div>
  );
}
