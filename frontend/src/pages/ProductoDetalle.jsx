import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Link2, MapPin, Minus, Plus, ShoppingCart } from 'lucide-react';
import GaleriaProducto from '../components/productos/GaleriaProducto.jsx';
import SeccionResenas from '../components/productos/SeccionResenas.jsx';
import { Estrellas } from '../components/ui/Estrellas.jsx';
import { MAXIMO_POR_PRODUCTO, useCarrito } from '../context/CarritoContext.jsx';
import { api } from '../services/api.js';
import { CATEGORIAS, DIAS, ORDEN_DIAS } from '../utils/constantes.js';
import { diaActualColombia, formatearPrecio, formatearPromedio, rangoHorario } from '../utils/formato.js';
import { copiarTexto } from '../utils/portapapeles.js';

const AVISO_ESTADO = { FUERA_DE_HORARIO: 'Fuera de horario', NO_DISPONIBLE: 'No disponible' };
const TONO = { DISPONIBLE: 'bg-brand-50', FUERA_DE_HORARIO: 'bg-amber-50', NO_DISPONIBLE: 'bg-gray-100' };

function Dato({ etiqueta, children }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-gray-500">{etiqueta}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cantidadDe, puedeAgregar, agregar } = useCarrito();
  const [estado, setEstado] = useState({ cargando: true });
  const [cantidad, setCantidad] = useState(1);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let vigente = true;
    setEstado({ cargando: true });
    setCantidad(1);
    setAviso('');
    api(`/productos/${id}`)
      .then((producto) => vigente && setEstado({ producto }))
      .catch((err) => vigente && setEstado({ error: err.message, noExiste: err.status === 404 }));
    return () => {
      vigente = false;
    };
  }, [id]);

  const actualizarCalificacion = (calificacion) =>
    setEstado((e) => (e.producto ? { producto: { ...e.producto, calificacion } } : e));

  if (estado.cargando) return <p className="p-6 text-sm text-gray-500">Cargando…</p>;
  if (estado.error) {
    return (
      <div className="mx-auto max-w-xl space-y-3 p-6">
        <p role="alert" className="text-sm text-red-700">{estado.noExiste ? 'Este producto no existe o ya no está disponible.' : estado.error}</p>
        <Link to="/" className="text-sm font-semibold text-brand-600">Volver a Principal</Link>
      </div>
    );
  }

  const { producto } = estado;
  const { local, calificacion, estadoVenta, esMio } = producto;
  const disponible = estadoVenta === 'DISPONIBLE';
  const maximo = Math.min(producto.cantidadDisponible, MAXIMO_POR_PRODUCTO);
  const enCarrito = cantidadDe(producto.id);
  const hoy = diaActualColombia();
  const categoria = CATEGORIAS.find((c) => c.valor === producto.categoria)?.etiqueta ?? producto.categoria;
  const mapa = local.latitud != null && local.longitud != null
    ? `https://www.openstreetmap.org/?mlat=${local.latitud}&mlon=${local.longitud}#map=17/${local.latitud}/${local.longitud}`
    : null;
  const redes = Object.entries(local.redesSociales ?? {}).filter(([, valor]) => valor);

  async function copiarEnlace() {
    const copiado = await copiarTexto(`${window.location.origin}/producto/${producto.id}`);
    setAviso(copiado ? 'Enlace copiado' : 'No se pudo copiar el enlace');
  }

  // Suma al carrito respetando las existencias y devuelve true si agregó algo.
  function sumarAlCarrito() {
    if (!puedeAgregar(producto.id)) {
      setAviso('Tu carrito está lleno (máximo 50 productos distintos)');
      return false;
    }
    if (maximo - enCarrito <= 0) {
      setAviso('Ya tienes en el carrito todas las unidades disponibles');
      return false;
    }
    agregar(producto.id, cantidad, maximo);
    return true;
  }

  function agregarAlCarrito() {
    if (sumarAlCarrito()) setAviso('Agregado al carrito');
  }

  // Por ahora "Ordenar" lleva el producto al carrito; el pedido y el pago llegan en la siguiente fase.
  function ordenar() {
    if (enCarrito > 0 || sumarAlCarrito()) navigate('/carrito');
  }

  return (
    <div className={`min-h-full ${TONO[estadoVenta]}`}>
      <div className="mx-auto max-w-xl pb-44">
        <div className="relative">
          <GaleriaProducto imagenes={producto.imagenes} alt={producto.nombre} atenuada={!disponible} />
          <Link to="/" aria-label="Volver" className="absolute top-3 left-3 flex size-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}>
            <ArrowLeft size={22} />
          </Link>
          <button type="button" onClick={copiarEnlace} aria-label="Copiar enlace" className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}>
            <Link2 size={20} />
          </button>
          {!disponible && (
            <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-sm font-semibold text-white">{AVISO_ESTADO[estadoVenta]}</span>
          )}
        </div>

        <div className="space-y-5 px-4 pt-4">
          <header className="space-y-1">
            <h1 className="text-xl font-semibold">{producto.nombre}</h1>
            <p className="text-2xl font-bold text-brand-700">{formatearPrecio(producto.precio)}</p>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
              {calificacion.total > 0 ? (
                <span className="flex items-center gap-1">
                  <Estrellas valor={calificacion.promedio} tamano={15} /> {formatearPromedio(calificacion.promedio)} ({calificacion.total})
                </span>
              ) : (
                <span>Sin calificaciones</span>
              )}
              <span>{categoria}</span>
              <span>{producto.cantidadDisponible > 0 ? `${producto.cantidadDisponible} disponibles` : 'Agotado'}</span>
            </p>
          </header>

          <section aria-labelledby="titulo-descripcion">
            <h2 id="titulo-descripcion" className="sr-only">Descripción</h2>
            <p className="text-sm whitespace-pre-line text-gray-700">{producto.descripcion}</p>
          </section>

          <section aria-labelledby="titulo-local" className="space-y-3 rounded-2xl border border-brand-100 bg-white p-4">
            <h2 id="titulo-local" className="sr-only">El local</h2>
            <div className="flex items-center gap-3">
              <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-brand-50">
                {local.logoUrl && <img src={local.logoUrl} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{local.nombre}</p>
                {local.eslogan && <p className="truncate text-xs text-gray-500">{local.eslogan}</p>}
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${local.abierto ? 'bg-brand-100 text-brand-700' : 'bg-gray-200 text-gray-700'}`}>
                {local.abierto ? 'Abierto ahora' : 'Cerrado ahora'}
              </span>
            </div>

            <p className="flex items-start gap-2 text-sm text-gray-700">
              <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />
              <span>
                {local.direccion}
                {mapa && (
                  <>
                    {' · '}
                    <a href={mapa} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700">Ver en el mapa</a>
                  </>
                )}
              </span>
            </p>

            <details className="text-sm">
              <summary className="flex cursor-pointer items-center gap-2 font-medium text-gray-800">
                <Clock size={16} className="text-gray-400" /> Horarios
              </summary>
              <ul className="mt-2 space-y-1">
                {ORDEN_DIAS.map((dia) => {
                  const bloques = local.horarios.filter((h) => h.diaSemana === dia);
                  return (
                    <li key={dia} className={`flex justify-between ${dia === hoy ? 'font-semibold text-brand-700' : 'text-gray-600'}`}>
                      <span>{DIAS[dia]}{dia === hoy && ' (hoy)'}</span>
                      <span>{bloques.length ? rangoHorario(bloques) : 'Cerrado'}</span>
                    </li>
                  );
                })}
              </ul>
              {local.horarios.length === 0 && <p className="mt-1 text-xs text-gray-500">El local no ha definido horarios.</p>}
            </details>

            <dl className="space-y-1.5 border-t border-brand-100 pt-3">
              {local.tiempoPreparacionMin != null && <Dato etiqueta="Preparación">{local.tiempoPreparacionMin} min</Dato>}
              {local.tiempoEntregaMin != null && <Dato etiqueta="Entrega">{local.tiempoEntregaMin} min</Dato>}
              {local.zonaDomicilio && <Dato etiqueta="Zona de domicilio">{local.zonaDomicilio}</Dato>}
              {local.radioDomicilioKm != null && <Dato etiqueta="Radio de domicilio">{local.radioDomicilioKm.toLocaleString('es-CO')} km</Dato>}
              <Dato etiqueta="Costo del domicilio">{local.precioDomicilio > 0 ? formatearPrecio(local.precioDomicilio) : 'Sin costo'}</Dato>
            </dl>

            {(local.whatsapp || redes.length > 0) && (
              <div className="space-y-2 border-t border-brand-100 pt-3">
                {local.whatsapp && (
                  <a href={`https://wa.me/${local.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-brand-600 py-2.5 text-center text-sm font-semibold text-brand-700">
                    Escribir por WhatsApp
                  </a>
                )}
                {redes.length > 0 && (
                  <p className="text-xs text-gray-600">
                    {redes.map(([red, valor]) => `${red[0].toUpperCase()}${red.slice(1)}: ${valor}`).join(' · ')}
                  </p>
                )}
              </div>
            )}
          </section>

          <SeccionResenas productoId={producto.id} esMio={esMio} onCambio={actualizarCalificacion} />
        </div>
      </div>

      {/* Barra de acciones fija (RF-11) */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-brand-100 bg-white" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="mx-auto max-w-xl space-y-2 px-4 py-3">
          {esMio ? (
            <p className="text-center text-sm text-gray-600">
              Este es tu producto ·{' '}
              <Link to={`/mi-local/productos/${producto.id}`} className="font-semibold text-brand-700">Editar</Link>
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center rounded-xl border border-gray-300" role="group" aria-label="Cantidad">
                  <button type="button" aria-label="Menos" disabled={!disponible || cantidad <= 1} onClick={() => setCantidad((c) => c - 1)} className="p-2.5 disabled:opacity-30"><Minus size={18} /></button>
                  <span className="min-w-8 text-center font-semibold" aria-live="polite">{cantidad}</span>
                  <button type="button" aria-label="Más" disabled={!disponible || cantidad >= maximo} onClick={() => setCantidad((c) => c + 1)} className="p-2.5 disabled:opacity-30"><Plus size={18} /></button>
                </div>
                <p className="text-right text-sm text-gray-600" role="status">
                  {!disponible ? <strong>{AVISO_ESTADO[estadoVenta]}</strong> : aviso || (enCarrito > 0 ? `${enCarrito} en tu carrito` : '')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" disabled={!disponible} onClick={agregarAlCarrito} className="flex items-center justify-center gap-2 rounded-xl border border-brand-600 py-3 text-sm font-semibold text-brand-700 disabled:opacity-40">
                  <ShoppingCart size={18} /> Agregar al carrito
                </button>
                <button type="button" disabled={!disponible} onClick={ordenar} className="rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white uppercase disabled:opacity-40">
                  Ordenar
                </button>
              </div>
              {!disponible && aviso && <p className="text-center text-xs text-gray-600" role="status">{aviso}</p>}
            </>
          )}
          {esMio && aviso && <p className="text-center text-xs text-gray-600" role="status">{aviso}</p>}
        </div>
      </div>
    </div>
  );
}
