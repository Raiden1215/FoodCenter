import * as pedidoService from '../services/pedido.service.js';

export async function crear(req, res) {
  const pedido = await pedidoService.crearPedido(req.usuarioId, req.body);
  res.status(201).json(pedido);
}

export async function listarLocal(req, res) {
  const estadoFiltro = req.query.estado ? req.query.estado.toUpperCase() : null;
  const pedidos = await pedidoService.obtenerPedidosLocal(req.usuarioId, estadoFiltro);
  res.json(pedidos);
}

export async function cambiarEstado(req, res) {
  const pedido = await pedidoService.cambiarEstadoPedido(req.usuarioId, req.params.id, req.body);
  res.json(pedido);
}

export async function obtener(req, res) {
  const pedido = await pedidoService.obtenerPedidoPorId(req.usuarioId, req.params.id);
  res.json(pedido);
}

export async function listarMisPedidos(req, res) {
  const pedidos = await pedidoService.obtenerMisPedidos(req.usuarioId);
  res.json(pedidos);
}
