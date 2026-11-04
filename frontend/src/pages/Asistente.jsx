import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bot, RotateCcw, Send } from 'lucide-react';
import TarjetaMini from '../components/productos/TarjetaMini.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

const SUGERENCIAS = ['¿Qué hay abierto ahora?', 'Recomiéndame algo con pollo', '¿Cuáles son los mejor calificados?', '¿Cómo funciona la app?'];
const BIENVENIDA = 'Hola, soy el asistente de FoodCenter. Puedo ayudarte a encontrar productos, ver qué está disponible ahora y explicarte cómo funciona la app.';
const MAXIMO_GUARDADOS = 20; // mensajes que se conservan al navegar a un producto y volver
const TURNOS_AL_SERVIDOR = 6;

const clave = (usuarioId) => `foodcenter:chat:${usuarioId}`;
const valido = (m) => (m?.rol === 'usuario' || m?.rol === 'asistente') && typeof m.texto === 'string';

function leer(usuarioId) {
  try {
    const datos = JSON.parse(sessionStorage.getItem(clave(usuarioId)) ?? '[]');
    return Array.isArray(datos) ? datos.filter(valido).slice(-MAXIMO_GUARDADOS) : [];
  } catch {
    return [];
  }
}

// Asistente con IA (RF-38 a RF-41). La conversación se guarda solo en esta pestaña del navegador (sessionStorage).
export default function Asistente() {
  const { usuario } = useAuth();
  const [mensajes, setMensajes] = useState(() => leer(usuario.id));
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const fin = useRef(null);

  useEffect(() => {
    try {
      if (mensajes.length) sessionStorage.setItem(clave(usuario.id), JSON.stringify(mensajes.slice(-MAXIMO_GUARDADOS)));
      else sessionStorage.removeItem(clave(usuario.id));
    } catch {
      /* sin almacenamiento: la conversación solo vive mientras la pantalla esté abierta */
    }
  }, [mensajes, usuario.id]);

  useEffect(() => {
    fin.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [mensajes, enviando, error]);

  async function enviar(pregunta) {
    const mensaje = pregunta.trim();
    if (!mensaje || enviando) return;

    const historial = mensajes.slice(-TURNOS_AL_SERVIDOR).map(({ rol, texto: t }) => ({ rol, texto: t }));
    setMensajes((m) => [...m, { rol: 'usuario', texto: mensaje }]);
    setTexto('');
    setError('');
    setEnviando(true);
    try {
      const respuesta = await api('/chatbot', { method: 'POST', body: { mensaje, historial } });
      setMensajes((m) => [...m, { rol: 'asistente', texto: respuesta.respuesta, productos: respuesta.productos }]);
    } catch (err) {
      // Si falla, la pregunta vuelve al campo para poder reintentarla sin escribirla otra vez.
      setMensajes((m) => m.slice(0, -1));
      setTexto(mensaje);
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  function nuevaConversacion() {
    setMensajes([]);
    setError('');
  }

  const sinPreguntas = !mensajes.some((m) => m.rol === 'usuario');

  return (
    <div className="mx-auto flex h-dvh max-w-xl flex-col bg-brand-50">
      <header className="flex items-center gap-2 border-b border-brand-100 bg-white px-3 py-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}>
        <Link to="/" aria-label="Volver" className="rounded-full p-2 text-gray-700"><ArrowLeft size={22} /></Link>
        <Bot size={22} className="text-brand-600" aria-hidden="true" />
        <h1 className="flex-1 font-semibold">Asistente de FoodCenter</h1>
        {mensajes.length > 0 && (
          <button type="button" onClick={nuevaConversacion} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-brand-700">
            <RotateCcw size={16} aria-hidden="true" /> Nueva conversación
          </button>
        )}
      </header>

      <div role="log" aria-live="polite" aria-label="Conversación" className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <p className="max-w-[85%] self-start rounded-2xl rounded-bl-sm border border-brand-100 bg-white px-4 py-3 text-sm">{BIENVENIDA}</p>

        {sinPreguntas && (
          <div className="flex flex-wrap gap-2" aria-label="Preguntas sugeridas">
            {SUGERENCIAS.map((s) => (
              <button key={s} type="button" onClick={() => enviar(s)} disabled={enviando} className="rounded-full border border-brand-600 bg-white px-3 py-1.5 text-sm text-brand-700 disabled:opacity-50">
                {s}
              </button>
            ))}
          </div>
        )}

        {mensajes.map((m, i) =>
          m.rol === 'usuario' ? (
            <p key={i} className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-brand-600 px-4 py-3 text-sm whitespace-pre-line text-white">{m.texto}</p>
          ) : (
            <div key={i} className="flex max-w-[92%] flex-col gap-2 self-start">
              <p className="rounded-2xl rounded-bl-sm border border-brand-100 bg-white px-4 py-3 text-sm whitespace-pre-line">{m.texto}</p>
              {m.productos?.length > 0 && (
                <div className="space-y-2">
                  {m.productos.map((p) => <TarjetaMini key={p.id} producto={p} />)}
                </div>
              )}
            </div>
          )
        )}

        {enviando && <p role="status" className="self-start text-sm text-gray-500">Escribiendo…</p>}
        {error && <p role="alert" className="self-start rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700">{error}</p>}
        <div ref={fin} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); enviar(texto); }}
        className="border-t border-brand-100 bg-white px-3 pt-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center gap-2">
          <label htmlFor="pregunta" className="sr-only">Escribe tu pregunta</label>
          <input
            id="pregunta"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={500}
            disabled={enviando}
            autoComplete="off"
            enterKeyHint="send"
            placeholder="Escribe tu pregunta…"
            className="min-w-0 flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:border-brand-500 focus:bg-white disabled:opacity-60"
          />
          <button type="submit" aria-label="Enviar" disabled={enviando || !texto.trim()} className="rounded-full bg-brand-600 p-3 text-white disabled:opacity-40">
            <Send size={20} />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-gray-500">Respuestas generadas por IA: pueden tener errores. Confirma precios y horarios en el producto y no escribas datos personales.</p>
      </form>
    </div>
  );
}
