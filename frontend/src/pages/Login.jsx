import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import Campo from '../components/ui/Campo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const aviso = useLocation().state?.aviso; // p. ej. "Tu contraseña se actualizó" tras recuperarla
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [recordar, setRecordar] = useState(true);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login({ correo, password, recordar });
      // La redirección la hace <SoloPublico> al detectar la sesión.
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <AuthLayout titulo="Iniciar sesión">
      {aviso && <p role="status" className="mb-4 rounded-xl bg-brand-100 px-4 py-3 text-sm text-brand-700">{aviso}</p>}
      <form onSubmit={enviar} className="space-y-4">
        <Campo id="correo" label="Correo" icono={Mail} type="email" autoComplete="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
        <Campo id="password" label="Contraseña" icono={Lock} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-gray-600">
            <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} className="size-4 accent-brand-600" />
            Recordarme
          </label>
          <Link to="/recuperar" className="font-medium text-brand-600 italic">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={enviando} className="w-full rounded-xl bg-brand-600 py-3.5 font-semibold tracking-wide text-white uppercase disabled:opacity-60">
          {enviando ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-brand-600">Regístrate</Link>
      </p>
    </AuthLayout>
  );
}
