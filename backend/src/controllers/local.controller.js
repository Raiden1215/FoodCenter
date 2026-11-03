import * as localService from '../services/local.service.js';

export async function obtenerMio(req, res) {
  res.json(await localService.obtenerMiLocal(req.usuarioId));
}

export async function crear(req, res) {
  res.status(201).json(await localService.crearLocal(req.usuarioId, req.body));
}

export async function actualizar(req, res) {
  res.json(await localService.actualizarLocal(req.usuarioId, req.body));
}

export async function cambiarEstado(req, res) {
  res.json(await localService.cambiarEstado(req.usuarioId, req.body.estado));
}
