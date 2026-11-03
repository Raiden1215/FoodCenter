import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Cargando() {
  return <p className="p-6 text-center text-sm text-gray-500">Cargando…</p>;
}

// Solo deja pasar a usuarios con sesión; si no, los manda al login.
export function RequireAuth() {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

// Login y registro: si ya hay sesión, redirige a la pantalla de origen (o a Principal).
export function SoloPublico() {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return <Cargando />;
  if (usuario) return <Navigate to={location.state?.from?.pathname ?? '/'} replace />;
  return <Outlet />;
}
