import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Lock, Mail } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import Campo from '../components/ui/Campo.jsx';
import { api } from '../services/api.js';

const TITULOS = {
  correo: 'Recuperar contraseña',
  codigo: 'Ingresa el código',
  nueva: 'Crea una contraseña nueva',
};

const boton = 'w-full rounded-xl bg-brand-600 py-3.5 font-semibold tracking-wide text-white uppercase disabled:opacity-60';

// Recuperación de contraseña (RF-03 y RF-04) en tres pasos: correo -> código -> contraseña nueva.
export default function Recuperar({ segundosEspera = 60 }) {
  const navigate = useNavigate();
  const [paso, setPaso] = useState('correo');
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [token, setToken] = useState(null); // solo en memoria: prueba que el código ya se verificó
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [espera, setEspera] = useState(0); // segundos antes de poder pedir otro código

  useEffect(() => {
    if (espera <= 0) return;
    const temporizador = setTimeout(() => setEspera((e) => e - 1), 1000);
    return () => clearTimeout(temporizador);
  }, [espera]);

  // Ejecuta una llamada a la API mostrando el estado de "enviando" y los errores.
  async function intentar(accion) {
    setError('');
    setEnviando(true);
    try {
      await accion();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const pedirCodigo = (reenvio = false) =>
    intentar(async () => {
      await api('/auth/recuperar', { method: 'POST', body: { correo } });
      setCodigo('');
      setEspera(segundosEspera);
      setPaso('codigo');
      // El servidor responde igual exista o no el correo, así que el mensaje tampoco lo confirma.
      setInfo(
        `${reenvio ? 'Pedimos un código nuevo. ' : ''}Si ese correo está registrado, te enviamos un código de 6 dígitos. Revisa también la carpeta de spam. Vence en 10 minutos.`
      );
    });

  const verificarCodigo = () =>
    intentar(async () => {
      const { token: nuevoToken } = await api('/auth/recuperar/codigo', { method: 'POST', body: { correo, codigo } });
      setToken(nuevoToken);
      setInfo('');
      setPaso('nueva');
    });

  const guardarPassword = () => {
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }
    return intentar(async () => {
      const { mensaje } = await api('/auth/recuperar/nueva', { method: 'POST', body: { token, password } });
      navigate('/login', { replace: true, state: { aviso: mensaje } });
    });
  };

  function volverAEmpezar() {
    setError('');
    setInfo('');
    setToken(null);
    setPassword('');
    setConfirmar('');
    setPaso('correo');
  }

  const enviar = (accion) => (e) => {
    e.preventDefault();
    accion();
  };

  return (
    <AuthLayout titulo={TITULOS[paso]}>
      {paso === 'correo' && (
        <form onSubmit={enviar(() => pedirCodigo(false))} className="space-y-4">
          <p className="text-sm text-gray-600">Escribe el correo de tu cuenta y te enviaremos un código para crear una contraseña nueva.</p>
          <Campo id="correo" label="Correo" icono={Mail} type="email" autoComplete="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={enviando} className={boton}>{enviando ? 'Enviando…' : 'Enviar código'}</button>
        </form>
      )}

      {paso === 'codigo' && (
        <form onSubmit={enviar(verificarCodigo)} className="space-y-4">
          {info && <p role="status" className="text-sm text-gray-600">{info}</p>}
          <Campo
            id="codigo"
            label="Código de 6 dígitos"
            icono={KeyRound}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={enviando || codigo.length !== 6} className={boton}>{enviando ? 'Verificando…' : 'Verificar código'}</button>
          <button
            type="button"
            disabled={enviando || espera > 0}
            onClick={() => pedirCodigo(true)}
            className="w-full py-2 text-sm font-semibold text-brand-700 disabled:text-gray-400"
          >
            {espera > 0 ? `Reenviar código (${espera} s)` : 'Reenviar código'}
          </button>
        </form>
      )}

      {paso === 'nueva' && (
        <form onSubmit={enviar(guardarPassword)} className="space-y-4">
          <p className="text-sm text-gray-600">Código verificado. Elige una contraseña nueva.</p>
          <Campo id="password" label="Contraseña nueva" icono={Lock} type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="-mt-2 px-1 text-xs text-gray-500">Mínimo 8 caracteres, con letras y números.</p>
          <Campo id="confirmar" label="Confirmar contraseña" icono={Lock} type="password" autoComplete="new-password" required value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={enviando} className={boton}>{enviando ? 'Guardando…' : 'Cambiar contraseña'}</button>
        </form>
      )}

      <div className="mt-6 space-y-2 text-center text-sm text-gray-600">
        {paso !== 'correo' && (
          <p>
            ¿El código venció o te equivocaste de correo?{' '}
            <button type="button" onClick={volverAEmpezar} className="font-semibold text-brand-700">Empezar de nuevo</button>
          </p>
        )}
        <p><Link to="/login" className="font-semibold text-brand-600">Volver a iniciar sesión</Link></p>
      </div>
    </AuthLayout>
  );
}
