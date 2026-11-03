import * as resenaService from '../services/resena.service.js';

export async function listar(req, res) {
  res.json(await resenaService.obtenerResenas(req.usuarioId, req.params.id));
}

export async function guardar(req, res) {
  res.json(await resenaService.guardarResena(req.usuarioId, req.params.id, req.body));
}

export async function eliminar(req, res) {
  res.json(await resenaService.eliminarMiResena(req.usuarioId, req.params.id));
}
