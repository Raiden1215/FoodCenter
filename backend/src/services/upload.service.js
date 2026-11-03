import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

// Se identifica el formato por los primeros bytes del archivo, no por lo que declara el cliente.
export function detectarFormato(b) {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

export async function guardarImagen(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new HttpError(400, 'No se recibió ninguna imagen (formatos permitidos: JPG, PNG o WebP)');
  }
  const formato = detectarFormato(buffer);
  if (!formato) throw new HttpError(400, 'El archivo no es una imagen válida (usa JPG, PNG o WebP)');

  await fs.mkdir(env.uploadsDir, { recursive: true });
  const nombre = `${randomUUID()}.${formato}`;
  await fs.writeFile(path.join(env.uploadsDir, nombre), buffer);
  return `/uploads/${nombre}`;
}
