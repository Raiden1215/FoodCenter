import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  MapPin,
  Package,
  QrCode,
  RefreshCw,
  User,
  XCircle,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { formatearFecha, formatearPrecio } from '../../utils/formato.js';
import ModalComprobante from './ModalComprobante.jsx';

const PESTANAS = [
  { id: 'PENDIENTE', etiqueta: 'Pendientes', color: 'bg-amber-500 text-white' },
  { id: 'HECHO', etiqueta: 'Hechos', color: 'bg-emerald-600 text-white' },
  { id: 'CANCELADO', etiqueta: 'Cancelados', color: 'bg-gray-600 text-white' },
];

export default function GestorPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [pestañaActiva, setPestañaActiva] = useState('PENDIENTE');

  const [comprobanteModalUrl, setComprobanteModalUrl] = useState(null);
  const [montosEfectivo, setMontosEfectivo] = useState({});
  const [procesandoId, setProcesandoId] = useState(null);

  async function cargarPedidos() {
    setError('');
    setCargando(true);
    try {
      const data = await api('/pedidos/mi-local');
      setPedidos(data || []);
      const inicialEfectivo = {};
      (data || []).forEach((p) => {
        if (p.efectivoRecibido != null) {
          inicialEfectivo[p.id] = p.efectivoRecibido;
        } else if (p.metodoPago === 'EFECTIVO') {
          inicialEfectivo[p.id] = p.total;
        }
      });
      setMontosEfectivo(inicialEfectivo);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los pedidos');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarPedidos();
  }, []);

  async function actualizarEstado(pedidoId, nuevoEstado) {
    if (nuevoEstado === 'CANCELADO') {
      const confirma = window.confirm('¿Seguro que deseas cancelar este pedido? Se repondrá el inventario.');
      if (!confirma) return;
    }

    setProcesandoId(pedidoId);
    try {
      const payload = {
        estado: nuevoEstado,
      };

      if (montosEfectivo[pedidoId] != null && montosEfectivo[pedidoId] !== '') {
        payload.efectivoRecibido = Number(montosEfectivo[pedidoId]);
      }

      const pedidoActualizado = await api(`/pedidos/${pedidoId}/estado`, {
        method: 'PATCH',
        body: payload,
      });

      setPedidos((prev) => prev.map((p) => (p.id === pedidoId ? pedidoActualizado : p)));
    } catch (err) {
      alert(err.message || 'Error al actualizar el estado del pedido');
    } finally {
      setProcesandoId(null);
    }
  }

  const pedidosFiltrados = pedidos.filter((p) => p.estado === pestañaActiva);
  const pendientesCount = pedidos.filter((p) => p.estado === 'PENDIENTE').length;
  const hechosCount = pedidos.filter((p) => p.estado === 'HECHO').length;
  const canceladosCount = pedidos.filter((p) => p.estado === 'CANCELADO').length;

  const conteos = {
    PENDIENTE: pendientesCount,
    HECHO: hechosCount,
    CANCELADO: canceladosCount,
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Gestor de Pedidos</h2>
          <p className="text-xs text-gray-500">Administra las órdenes que llegan a tu negocio</p>
        </div>
        <button
          type="button"
          onClick={cargarPedidos}
          disabled={cargando}
          aria-label="Actualizar pedidos"
          className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-2xs hover:bg-brand-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      <div className="flex gap-2 rounded-2xl bg-gray-100 p-1.5" role="tablist">
        {PESTANAS.map((tab) => {
          const activa = pestañaActiva === tab.id;
          const cantidad = conteos[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activa}
              onClick={() => setPestañaActiva(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                activa ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{tab.etiqueta}</span>
              {cantidad > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                    tab.id === 'PENDIENTE'
                      ? 'bg-amber-500 text-white'
                      : tab.id === 'HECHO'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-400 text-white'
                  }`}
                >
                  {cantidad}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {cargando ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Cargando pedidos…
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <Package className="mx-auto mb-2 text-gray-300" size={32} />
          <p className="text-sm font-medium text-gray-700">
            No hay pedidos en estado "{PESTANAS.find((p) => p.id === pestañaActiva)?.etiqueta}"
          </p>
          <p className="text-xs text-gray-500 mt-1">Los nuevos pedidos de tus clientes aparecerán aquí automáticamente.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {pedidosFiltrados.map((pedido) => {
            const esPendiente = pedido.estado === 'PENDIENTE';
            const esHecho = pedido.estado === 'HECHO';
            const esCancelado = pedido.estado === 'CANCELADO';
            const esQr = pedido.metodoPago === 'QR_NEQUI';
            const esEfectivo = pedido.metodoPago === 'EFECTIVO';
            const estaProcesando = procesandoId === pedido.id;

            return (
              <li
                key={pedido.id}
                className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-xs transition-shadow"
              >
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-4 py-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-800">#{pedido.id.slice(0, 8)}</span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock size={13} /> {formatearFecha(pedido.creadoEn)}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-bold uppercase tracking-wider text-[10px] ${
                      esPendiente
                        ? 'bg-amber-100 text-amber-800'
                        : esHecho
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {pedido.estado}
                  </span>
                </div>

                <div className="space-y-3 p-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                      <User size={14} className="text-gray-400 shrink-0" />
                      <span>{pedido.comprador?.nombre || 'Cliente'}</span>
                      {pedido.comprador?.correo && (
                        <span className="text-gray-400 font-normal">({pedido.comprador.correo})</span>
                      )}
                    </div>
                    <div className="flex items-start gap-1.5 text-gray-600">
                      <MapPin size={14} className="text-brand-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-800">{pedido.direccionEntrega}</p>
                        {pedido.referencias && (
                          <p className="text-[11px] text-gray-500">Ref: {pedido.referencias}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Productos ordenados
                    </p>
                    <ul className="space-y-2 divide-y divide-gray-200/60">
                      {pedido.items?.map((item) => (
                        <li key={item.id} className="pt-1.5 first:pt-0">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-gray-800">
                              {item.cantidad}x {item.nombreProducto}
                            </span>
                            <span className="font-medium text-gray-600">
                              {formatearPrecio(item.precioUnitario * item.cantidad)}
                            </span>
                          </div>
                          {item.notas && (
                            <p className="mt-0.5 flex items-start gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 rounded-md p-1.5">
                              <FileText size={12} className="shrink-0 mt-0.5 text-amber-600" />
                              <span>Nota: {item.notas}</span>
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>

                    <div className="border-t border-gray-200/80 pt-2 text-xs space-y-1">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal productos:</span>
                        <span>{formatearPrecio(pedido.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Costo de domicilio:</span>
                        <span>{pedido.costoDomicilio > 0 ? formatearPrecio(pedido.costoDomicilio) : 'Sin costo'}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-200">
                        <span>Total del pedido:</span>
                        <span className="text-brand-700">{formatearPrecio(pedido.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-700">Método de pago:</span>
                      <span className="inline-flex items-center gap-1 font-bold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg">
                        {esQr ? (
                          <>
                            <QrCode size={14} className="text-purple-600" /> QR Nequi
                          </>
                        ) : (
                          <>
                            <Banknote size={14} className="text-emerald-600" /> Pago en físico (Efectivo)
                          </>
                        )}
                      </span>
                    </div>

                    {esQr && (
                      <div className="pt-1">
                        {pedido.comprobanteUrl ? (
                          <div className="flex items-center justify-between rounded-lg bg-purple-50/70 p-2 border border-purple-100">
                            <div className="flex items-center gap-2">
                              <img
                                src={pedido.comprobanteUrl}
                                alt="Miniatura comprobante"
                                className="size-10 rounded-md object-cover border border-purple-200 shadow-2xs"
                              />
                              <span className="text-xs font-medium text-purple-900">Comprobante adjunto</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setComprobanteModalUrl(pedido.comprobanteUrl)}
                              className="inline-flex items-center gap-1 rounded-lg bg-purple-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-purple-800"
                            >
                              <Eye size={13} /> Ver comprobante
                            </button>
                          </div>
                        ) : (
                          <p className="text-red-600 text-xs font-medium">⚠️ No se adjuntó comprobante de pago.</p>
                        )}
                      </div>
                    )}

                    {esEfectivo && (
                      <div className="pt-1 space-y-1">
                        {esPendiente ? (
                          <div>
                            <label
                              htmlFor={`efectivo-${pedido.id}`}
                              className="block text-[11px] font-semibold text-gray-600"
                            >
                              Monto total recibido en efectivo (para confirmar entrega):
                            </label>
                            <div className="relative mt-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                              <input
                                id={`efectivo-${pedido.id}`}
                                type="number"
                                min="0"
                                value={montosEfectivo[pedido.id] ?? ''}
                                onChange={(e) =>
                                  setMontosEfectivo((prev) => ({ ...prev, [pedido.id]: e.target.value }))
                                }
                                placeholder={String(pedido.total)}
                                className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-7 pr-3 text-xs font-semibold outline-none focus:border-brand-500"
                              />
                            </div>
                          </div>
                        ) : (
                          pedido.efectivoRecibido != null && (
                            <p className="text-xs text-gray-600">
                              Dinero recibido en físico: <strong className="text-emerald-700">{formatearPrecio(pedido.efectivoRecibido)}</strong>
                            </p>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {esPendiente && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        disabled={estaProcesando}
                        onClick={() => actualizarEstado(pedido.id, 'HECHO')}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700 disabled:opacity-40"
                      >
                        <CheckCircle size={15} /> Marcar como Hecho
                      </button>
                      <button
                        type="button"
                        disabled={estaProcesando}
                        onClick={() => actualizarEstado(pedido.id, 'CANCELADO')}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-red-300 bg-white py-2.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
                      >
                        <XCircle size={15} /> Cancelar pedido
                      </button>
                    </div>
                  )}

                  {esHecho && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-xl p-2.5">
                      <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                      <span>Pedido entregado y completado con éxito.</span>
                    </div>
                  )}

                  {esCancelado && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-xl p-2.5">
                      <XCircle size={16} className="text-red-600 shrink-0" />
                      <span>Pedido cancelado. El stock fue repuesto al inventario.</span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {comprobanteModalUrl && (
        <ModalComprobante url={comprobanteModalUrl} onCerrar={() => setComprobanteModalUrl(null)} />
      )}
    </section>
  );
}
