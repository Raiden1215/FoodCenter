import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Loader2,
  Minus,
  Plus,
  QrCode,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { subirImagen } from '../../services/uploads.js';
import { formatearPrecio } from '../../utils/formato.js';

export default function BottomSheetPedido({
  producto,
  local,
  cantidadInicial = 1,
  abierto,
  onCerrar,
  onExito,
}) {
  const { usuario } = useAuth();

  const [cantidad, setCantidad] = useState(cantidadInicial);
  const [ingredientes, setIngredientes] = useState('');
  const [direccion, setDireccion] = useState(usuario?.direccion || '');
  const [referencias, setReferencias] = useState('');
  const [metodoPago, setMetodoPago] = useState(
    local?.metodosPago?.includes('QR_NEQUI') ? 'QR_NEQUI' : 'EFECTIVO'
  );

  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const [errorComprobante, setErrorComprobante] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [pedidoCompletado, setPedidoCompletado] = useState(null);

  useEffect(() => {
    if (abierto) {
      setCantidad(Math.max(1, cantidadInicial));
      setDireccion(usuario?.direccion || '');
      setErrorEnvio('');
      setErrorComprobante('');
      setPedidoCompletado(null);
    }
  }, [abierto, cantidadInicial, usuario]);

  useEffect(() => {
    const alPresionarEsc = (e) => {
      if (e.key === 'Escape' && abierto && !enviando) onCerrar();
    };
    window.addEventListener('keydown', alPresionarEsc);
    return () => window.removeEventListener('keydown', alPresionarEsc);
  }, [abierto, enviando, onCerrar]);

  if (!abierto) return null;

  const stockMax = producto.cantidadDisponible || 1;
  const precioUnitario = producto.precio;
  const subtotal = precioUnitario * cantidad;
  const costoDomicilio = local.precioDomicilio || 0;
  const total = subtotal + costoDomicilio;

  async function manejarSubidaComprobante(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setErrorComprobante('');
    setSubiendoComprobante(true);
    try {
      const url = await subirImagen(archivo);
      setComprobanteUrl(url);
    } catch (err) {
      setErrorComprobante(err.message || 'Error al subir el comprobante. Intenta con otra imagen.');
    } finally {
      setSubiendoComprobante(false);
    }
  }

  async function enviarPedido(e) {
    e.preventDefault();
    setErrorEnvio('');

    if (!direccion.trim()) {
      setErrorEnvio('Por favor ingresa la dirección exacta de entrega');
      return;
    }

    if (metodoPago === 'QR_NEQUI' && !comprobanteUrl) {
      setErrorEnvio('Debes subir el comprobante de pago de Nequi antes de ordenar');
      return;
    }

    setEnviando(true);
    try {
      const payload = {
        localId: local.id,
        metodoPago,
        direccionEntrega: direccion.trim(),
        referencias: referencias.trim() || null,
        comprobanteUrl: metodoPago === 'QR_NEQUI' ? comprobanteUrl : null,
        items: [
          {
            productoId: producto.id,
            cantidad,
            notas: ingredientes.trim() || null,
          },
        ],
      };

      const respuesta = await api('/pedidos', {
        method: 'POST',
        body: payload,
      });

      setPedidoCompletado(respuesta);
      if (onExito) onExito(respuesta);
    } catch (err) {
      setErrorEnvio(err.message || 'No se pudo crear el pedido');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirmación de pedido"
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-300"
      onClick={() => !enviando && onCerrar()}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-100 bg-white/95 px-5 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-10 rounded-full bg-gray-300" />
            <h2 className="text-base font-bold text-gray-800">
              {pedidoCompletado ? '¡Pedido Confirmado!' : 'Completar Pedido'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={enviando}
            aria-label="Cerrar ventana"
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {pedidoCompletado ? (
          <div className="space-y-4 px-6 py-8 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">¡Tu pedido ha sido enviado!</h3>
            <p className="text-sm text-gray-600">
              El negocio <strong>{local.nombre}</strong> ya recibió tu orden. Te notificaremos en cuanto el repartidor
              concrete la entrega.
            </p>

            <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-left text-sm space-y-2">
              <div className="flex justify-between font-medium">
                <span className="text-gray-600">Total a pagar:</span>
                <span className="font-bold text-brand-700">{formatearPrecio(pedidoCompletado.total)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Método de pago:</span>
                <span className="font-semibold">
                  {pedidoCompletado.metodoPago === 'QR_NEQUI' ? '📱 QR Nequi (Comprobante verificado)' : '💵 Pago en efectivo'}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Dirección:</span>
                <span className="font-semibold text-right max-w-[200px] truncate">
                  {pedidoCompletado.direccionEntrega}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onCerrar}
              className="w-full rounded-xl bg-brand-600 py-3.5 font-bold text-white shadow-md transition-colors hover:bg-brand-700"
            >
              Listo, volver a la tienda
            </button>
          </div>
        ) : (
          <form onSubmit={enviarPedido} className="space-y-5 px-5 py-4">
            <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/40 p-3">
              <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                {producto.imagenes?.[0] ? (
                  <img src={producto.imagenes[0].url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-300">
                    <ImageIcon size={24} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-1 text-sm font-bold text-gray-900">{producto.nombre}</h3>
                <p className="line-clamp-2 text-xs text-gray-600">{producto.descripcion}</p>
                <p className="mt-1 text-sm font-bold text-brand-700">{formatearPrecio(producto.precio)} c/u</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-xs text-gray-700">
              <Clock size={15} className="shrink-0 text-brand-600" />
              <span>
                Local <strong>{local.nombre}</strong> · {local.abierto ? 'Atendiendo en este momento' : 'Horario habitual'}
              </span>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wide text-gray-700 uppercase">
                Cantidad a comprar
              </label>
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <span className="text-sm text-gray-700">
                  Subtotal: <strong className="text-brand-700">{formatearPrecio(subtotal)}</strong>
                </span>
                <div className="flex items-center rounded-lg border border-gray-300 bg-white" role="group">
                  <button
                    type="button"
                    aria-label="Disminuir cantidad"
                    disabled={cantidad <= 1 || enviando}
                    onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                    className="p-2 text-gray-600 disabled:opacity-30"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-8 text-center text-sm font-bold">{cantidad}</span>
                  <button
                    type="button"
                    aria-label="Aumentar cantidad"
                    disabled={cantidad >= stockMax || enviando}
                    onClick={() => setCantidad((c) => Math.min(stockMax, c + 1))}
                    className="p-2 text-gray-600 disabled:opacity-30"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              {stockMax > 0 && cantidad >= stockMax && (
                <p className="mt-1 text-xs text-gray-500">Stock máximo disponible alcanzado ({stockMax})</p>
              )}
            </div>

            <div>
              <label htmlFor="campo-ingredientes" className="mb-1 block text-xs font-semibold tracking-wide text-gray-700 uppercase">
                ¿Deseas personalizar ingredientes? (Opcional)
              </label>
              <textarea
                id="campo-ingredientes"
                rows={2}
                value={ingredientes}
                onChange={(e) => setIngredientes(e.target.value)}
                placeholder="Ej. Sin salsa de tomate, con extra cebolla, salsa tártara aparte..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none placeholder:text-gray-400 focus:border-brand-500 focus:bg-white"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="campo-direccion" className="mb-1 block text-xs font-semibold tracking-wide text-gray-700 uppercase">
                  Dirección exacta de entrega <span className="text-red-500">*</span>
                </label>
                <input
                  id="campo-direccion"
                  type="text"
                  required
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej. Calle 8 # 14-42, Barrio Centro"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none placeholder:text-gray-400 focus:border-brand-500 focus:bg-white"
                />
              </div>

              <div>
                <label htmlFor="campo-referencias" className="mb-1 block text-xs font-semibold tracking-wide text-gray-700 uppercase">
                  Indicaciones / Residencia (Opcional)
                </label>
                <input
                  id="campo-referencias"
                  type="text"
                  value={referencias}
                  onChange={(e) => setReferencias(e.target.value)}
                  placeholder="Ej. Casa de reja blanca de 2 pisos, portón negro"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none placeholder:text-gray-400 focus:border-brand-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold tracking-wide text-gray-700 uppercase">
                Método de pago
              </label>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Métodos de pago">
                <button
                  type="button"
                  role="radio"
                  aria-checked={metodoPago === 'QR_NEQUI'}
                  onClick={() => setMetodoPago('QR_NEQUI')}
                  className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition-all ${
                    metodoPago === 'QR_NEQUI'
                      ? 'border-brand-600 bg-brand-50/60 font-semibold text-brand-700 shadow-xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <QrCode size={22} className={metodoPago === 'QR_NEQUI' ? 'text-brand-600' : 'text-gray-500'} />
                  <span className="text-xs">QR Nequi</span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={metodoPago === 'EFECTIVO'}
                  onClick={() => setMetodoPago('EFECTIVO')}
                  className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition-all ${
                    metodoPago === 'EFECTIVO'
                      ? 'border-brand-600 bg-brand-50/60 font-semibold text-brand-700 shadow-xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Banknote size={22} className={metodoPago === 'EFECTIVO' ? 'text-brand-600' : 'text-gray-500'} />
                  <span className="text-xs">Pago en físico</span>
                </button>
              </div>

              {metodoPago === 'QR_NEQUI' && (
                <div className="mt-3 rounded-2xl border border-purple-200 bg-purple-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-900">
                    <QrCode size={16} />
                    <span>Instrucciones para pagar con Nequi:</span>
                  </div>

                  {local.qrNequiUrl ? (
                    <div className="flex flex-col items-center justify-center rounded-xl bg-white p-3 border border-purple-100">
                      <p className="mb-2 text-center text-xs font-medium text-gray-600">
                        Escanea o guarda el QR de <strong>{local.nombre}</strong>:
                      </p>
                      <img
                        src={local.qrNequiUrl}
                        alt="QR Nequi del local"
                        className="size-40 rounded-lg object-contain shadow-xs"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                      ⚠️ El local acepta transferencias Nequi. Si no visualizas el código QR, transfiere al número de WhatsApp{' '}
                      <strong>{local.whatsapp || 'del negocio'}</strong> y sube el comprobante.
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-purple-950">
                      Subir comprobante de pago (Captura) <span className="text-red-500">* Requerido</span>
                    </label>

                    {comprobanteUrl ? (
                      <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 p-3">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                          <span className="truncate text-xs font-medium text-emerald-800">
                            Comprobante adjuntado con éxito
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setComprobanteUrl('')}
                          className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={15} /> Quitar
                        </button>
                      </div>
                    ) : (
                      <div>
                        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-white p-4 transition-colors hover:bg-purple-50">
                          {subiendoComprobante ? (
                            <div className="flex items-center gap-2 text-xs font-semibold text-purple-700">
                              <Loader2 size={18} className="animate-spin" /> Subiendo comprobante…
                            </div>
                          ) : (
                            <>
                              <Upload size={22} className="text-purple-600" />
                              <span className="text-xs font-semibold text-purple-900">
                                Toca aquí para adjuntar comprobante
                              </span>
                              <span className="text-[11px] text-gray-500">Formatos permitidos: JPG, PNG o WebP</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            disabled={subiendoComprobante}
                            onChange={manejarSubidaComprobante}
                          />
                        </label>
                      </div>
                    )}

                    {errorComprobante && (
                      <p role="alert" className="text-xs text-red-600">
                        {errorComprobante}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {metodoPago === 'EFECTIVO' && (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                  <Banknote size={18} className="shrink-0 text-amber-700 mt-0.5" />
                  <p>
                    <strong>Pago contra entrega:</strong> Pagarás directamente al domiciliario al recibir tu comida. El
                    repartidor registrará el monto entregado al concretar la orden.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
              <div className="flex justify-between text-gray-600 text-xs">
                <span>Subtotal ({cantidad} {cantidad === 1 ? 'unidad' : 'unidades'})</span>
                <span className="font-semibold text-gray-800">{formatearPrecio(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 text-xs">
                <span>Costo de envío a domicilio</span>
                <span className="font-semibold text-gray-800">
                  {costoDomicilio > 0 ? formatearPrecio(costoDomicilio) : 'Gratis'}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold text-gray-900">
                <span>Total a pagar</span>
                <span className="text-brand-700">{formatearPrecio(total)}</span>
              </div>
            </div>

            {errorEnvio && (
              <div role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorEnvio}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={
                enviando ||
                subiendoComprobante ||
                !direccion.trim() ||
                (metodoPago === 'QR_NEQUI' && !comprobanteUrl)
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 py-4 text-sm font-bold tracking-wide text-white uppercase shadow-lg transition-all hover:bg-brand-700 disabled:opacity-40"
            >
              {enviando ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Procesando pedido…
                </>
              ) : (
                `Confirmar y Ordenar · ${formatearPrecio(total)}`
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
