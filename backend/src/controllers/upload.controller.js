import { guardarImagen } from '../services/upload.service.js';

export async function subir(req, res) {
  res.status(201).json({ url: await guardarImagen(req.body) });
}
