import * as productoService from '../services/producto.service.js';

export async function catalogo(req, res) {
  res.json(await productoService.listarCatalogo(req.consulta));
}

export async function detalle(req, res) {
  res.json(await productoService.obtenerDetalle(req.usuarioId, req.params.id));
}

export async function listarMios(req, res) {
  res.json(await productoService.listarMisProductos(req.usuarioId));
}

export async function crear(req, res) {
  res.status(201).json(await productoService.crearProducto(req.usuarioId, req.body));
}

export async function actualizar(req, res) {
  res.json(await productoService.actualizarProducto(req.usuarioId, req.params.id, req.body));
}

export async function eliminar(req, res) {
  await productoService.eliminarProducto(req.usuarioId, req.params.id);
  res.status(204).end();
}
