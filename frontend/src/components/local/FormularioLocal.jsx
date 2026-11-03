import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { api } from '../../services/api.js';
import { useGeolocalizacion } from '../../hooks/useGeolocalizacion.js';
import { CATEGORIAS, DIAS, METODOS_PAGO, ORDEN_DIAS } from '../../utils/constantes.js';
import { construirPayloadLocal, estadoInicialLocal } from '../../utils/local.js';
import { AreaForm, CampoForm, SelectorForm, Seccion } from '../ui/CampoForm.jsx';
import ImagenCampo from '../ui/ImagenCampo.jsx';

const alternar = (lista, valor) => (lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);

export default function FormularioLocal({ inicial, usuario, onGuardado }) {
  const [f, setF] = useState(() => estadoInicialLocal(inicial, usuario));
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const ubicacion = useGeolocalizacion();

  const poner = (campo) => (valor) => setF((actual) => ({ ...actual, [campo]: valor }));
  const cambiar = (campo) => (e) => poner(campo)(e.target.value);
  const cambiarHorario = (dia, cambio) =>
    setF((actual) => ({ ...actual, horarios: actual.horarios.map((h, i) => (i === dia ? { ...h, ...cambio } : h)) }));

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await api(inicial ? '/locales/mio' : '/locales', { method: inicial ? 'PUT' : 'POST', body: construirPayloadLocal(f) });
      onGuardado();
    } catch (err) {
      setError(err.message);
      setEnviando(false);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <Seccion titulo="Identidad">
        <CampoForm id="nombre" label="Nombre o marca" required value={f.nombre} onChange={cambiar('nombre')} />
        <CampoForm id="eslogan" label="Eslogan (opcional)" value={f.eslogan} onChange={cambiar('eslogan')} />
        <div className="grid grid-cols-3 gap-3">
          <ImagenCampo etiqueta="Logotipo" aspecto="aspect-square" valor={f.logoUrl} onChange={poner('logoUrl')} />
          <div className="col-span-2">
            <ImagenCampo etiqueta="Portada" aspecto="aspect-[2/1]" valor={f.portadaUrl} onChange={poner('portadaUrl')} />
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Especialidad">
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS.map(({ valor, etiqueta }) => {
            const activo = f.especialidades.includes(valor);
            return (
              <button
                key={valor}
                type="button"
                aria-pressed={activo}
                onClick={() => poner('especialidades')(alternar(f.especialidades, valor))}
                className={`rounded-full border px-3 py-1.5 text-sm ${activo ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-300 bg-white text-gray-700'}`}
              >
                {etiqueta}
              </button>
            );
          })}
        </div>
      </Seccion>

      <Seccion titulo="Servicio y domicilio">
        <div className="grid grid-cols-2 gap-3">
          <CampoForm id="prep" label="Preparación (min)" type="number" min="1" max="240" inputMode="numeric" value={f.tiempoPreparacionMin} onChange={cambiar('tiempoPreparacionMin')} />
          <CampoForm id="entrega" label="Entrega (min)" type="number" min="1" max="240" inputMode="numeric" value={f.tiempoEntregaMin} onChange={cambiar('tiempoEntregaMin')} />
        </div>
        <CampoForm id="zona" label="Zona de domicilio" placeholder="Ej.: Centro y Bocagrande" value={f.zonaDomicilio} onChange={cambiar('zonaDomicilio')} />
        <div className="grid grid-cols-2 gap-3">
          <CampoForm id="radio" label="Radio (km)" type="number" min="0.1" max="50" step="0.1" inputMode="decimal" value={f.radioDomicilioKm} onChange={cambiar('radioDomicilioKm')} />
          <CampoForm id="costoDomicilio" label="Costo del domicilio ($)" type="number" min="0" step="100" inputMode="numeric" value={f.precioDomicilio} onChange={cambiar('precioDomicilio')} />
        </div>
      </Seccion>

      <Seccion titulo="Horarios">
        <ul className="space-y-2">
          {ORDEN_DIAS.map((dia) => {
            const h = f.horarios[dia];
            return (
              <li key={dia} className="flex items-center gap-2">
                <label className="flex w-28 items-center gap-2 text-sm">
                  <input type="checkbox" checked={h.activo} onChange={(e) => cambiarHorario(dia, { activo: e.target.checked })} className="size-4 accent-brand-600" />
                  {DIAS[dia]}
                </label>
                <input type="time" aria-label={`${DIAS[dia]}: abre`} value={h.abre} disabled={!h.activo} required={h.activo} onChange={(e) => cambiarHorario(dia, { abre: e.target.value })} className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm disabled:opacity-40" />
                <span className="text-gray-400">a</span>
                <input type="time" aria-label={`${DIAS[dia]}: cierra`} value={h.cierra} disabled={!h.activo} required={h.activo} onChange={(e) => cambiarHorario(dia, { cierra: e.target.value })} className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm disabled:opacity-40" />
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-gray-500">Los días sin marcar el local aparece cerrado. Si no marcas ningún día, se considera abierto siempre. Para cerrar a medianoche, usa 00:00.</p>
      </Seccion>

      <Seccion titulo="Ubicación y contacto">
        <CampoForm id="direccion" label="Dirección" required value={f.direccion} onChange={cambiar('direccion')} />
        <div>
          <button
            type="button"
            disabled={ubicacion.cargando}
            onClick={() => ubicacion.obtener(({ latitud, longitud }) => setF((a) => ({ ...a, latitud, longitud })))}
            className="flex items-center gap-2 text-sm font-semibold text-brand-600"
          >
            <MapPin size={18} /> Usar mi ubicación actual
          </button>
          <p className="mt-1 text-xs text-gray-500">
            {ubicacion.mensaje || (f.latitud != null ? 'Ubicación guardada.' : 'Sin ubicación en el mapa (opcional).')}
          </p>
        </div>
        <CampoForm id="whatsapp" label="WhatsApp para pedidos" type="tel" inputMode="tel" placeholder="+57 300 123 4567" value={f.whatsapp} onChange={cambiar('whatsapp')} />
        <CampoForm id="instagram" label="Instagram (opcional)" value={f.instagram} onChange={cambiar('instagram')} />
        <CampoForm id="facebook" label="Facebook (opcional)" value={f.facebook} onChange={cambiar('facebook')} />
        <CampoForm id="tiktok" label="TikTok (opcional)" value={f.tiktok} onChange={cambiar('tiktok')} />
      </Seccion>

      <Seccion titulo="Métodos de pago">
        <div className="space-y-2">
          {METODOS_PAGO.map(({ valor, etiqueta }) => (
            <label key={valor} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f.metodosPago.includes(valor)} onChange={() => poner('metodosPago')(alternar(f.metodosPago, valor))} className="size-4 accent-brand-600" />
              {etiqueta}
            </label>
          ))}
        </div>
        {f.metodosPago.includes('QR_NEQUI') && (
          <ImagenCampo etiqueta="Código QR de Nequi" aspecto="aspect-square max-w-48" valor={f.qrNequiUrl} onChange={poner('qrNequiUrl')} ayuda="Es el código que verán tus clientes para pagarte." />
        )}
      </Seccion>

      {inicial && (
        <Seccion titulo="Estado del local">
          <SelectorForm id="estado" label="Estado" value={f.estado} onChange={cambiar('estado')} opciones={[{ valor: 'DISPONIBLE', etiqueta: 'Disponible' }, { valor: 'SIN_SERVICIO', etiqueta: 'Sin servicio' }]} ayuda="Sin servicio bloquea los pedidos de todos tus productos." />
        </Seccion>
      )}

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      <button type="submit" disabled={enviando} className="w-full rounded-xl bg-brand-600 py-3.5 font-semibold tracking-wide text-white uppercase disabled:opacity-60">
        {enviando ? 'Guardando…' : inicial ? 'Guardar cambios' : 'Crear mi local'}
      </button>
    </form>
  );
}
