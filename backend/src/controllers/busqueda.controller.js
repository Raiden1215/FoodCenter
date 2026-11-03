import * as busquedaService from '../services/busqueda.service.js';

export async function listar(req, res) {
  res.json(await busquedaService.listarHistorial(req.usuarioId));
}

export async function registrar(req, res) {
  res.status(201).json(await busquedaService.registrarBusqueda(req.usuarioId, req.body.texto));
}

export async function eliminar(req, res) {
  await busquedaService.eliminarBusqueda(req.usuarioId, req.params.id);
  res.status(204).end();
}

export async function vaciar(req, res) {
  await busquedaService.vaciarHistorial(req.usuarioId);
  res.status(204).end();
}
