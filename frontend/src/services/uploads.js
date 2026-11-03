import { apiSubir } from './api.js';

// Reduce la foto en el celular antes de subirla (las fotos de cámara pueden pesar varios MB).
export async function comprimirImagen(archivo, maxLado = 1280, calidad = 0.85) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(archivo);
  } catch {
    throw new Error('No se pudo leer la imagen. Prueba con una foto JPG o PNG.');
  }

  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // el JPEG no tiene transparencia
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen'))), 'image/jpeg', calidad)
  );
}

export async function subirImagen(archivo) {
  if (!archivo.type.startsWith('image/')) throw new Error('El archivo debe ser una imagen');
  const { url } = await apiSubir('/uploads', await comprimirImagen(archivo));
  return url;
}
