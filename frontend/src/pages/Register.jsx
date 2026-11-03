import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Mail, MapPin, User } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import Campo from '../components/ui/Campo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useGeolocalizacion } from '../hooks/useGeolocalizacion.js';

export default function Register() {
  const { registrar } = useAuth();
  const [form, setForm] = useState({ nombre: '', correo: '', password: '', confirmar: '', direccion: '' });
  const [ubicacion, setUbicacion] = useState(null); // { latitud, longitud }
  const geo = useGeolocalizacion();
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setEnviando(true);
    try {
      const { confirmar: _confirmar, ...datos } = form;
      await registrar({ ...datos, ...ubicacion });
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <AuthLayout titulo="Crear cuenta">
      <form onSubmit={enviar} className="space-y-4">
        <Campo id="nombre" label="Nombre" icono={User} autoComplete="name" required value={form.nombre} onChange={cambiar('nombre')} />
        <Campo id="correo" label="Correo" icono={Mail} type="email" autoComplete="email" required value={form.correo} onChange={cambiar('correo')} />
        <Campo id="password" label="Contraseña" icono={Lock} type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={cambiar('password')} />
        <p className="-mt-2 px-1 text-xs text-gray-500">Mínimo 8 caracteres, con letras y números.</p>
        <Campo id="confirmar" label="Confirmar contraseña" icono={Lock} type="password" autoComplete="new-password" required value={form.confirmar} onChange={cambiar('confirmar')} />
        <Campo id="direccion" label="Dirección" icono={MapPin} autoComplete="street-address" required value={form.direccion} onChange={cambiar('direccion')} />

        <div>
          <button type="button" onClick={() => geo.obtener(setUbicacion)} disabled={geo.cargando} className="flex items-center gap-2 text-sm font-semibold text-brand-600">
            <MapPin size={18} /> Usar mi ubicación actual
          </button>
          {geo.mensaje && <p className="mt-1 text-xs text-gray-500">{geo.mensaje}</p>}
        </div>

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={enviando} className="w-full rounded-xl bg-brand-600 py-3.5 font-semibold tracking-wide text-white uppercase disabled:opacity-60">
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-brand-600">Inicia sesión</Link>
      </p>
    </AuthLayout>
  );
}
