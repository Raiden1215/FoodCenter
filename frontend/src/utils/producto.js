import { aNumero } from './formato.js';

export function estadoInicialProducto(producto) {
  return {
    nombre: producto?.nombre ?? '',
    descripcion: producto?.descripcion ?? '',
    categoria: producto?.categoria ?? '',
    precio: producto?.precio?.toString() ?? '',
    cantidadDisponible: producto?.cantidadDisponible?.toString() ?? '1',
    activo: producto?.activo ?? true,
    imagenes: producto?.imagenes?.map((i) => i.url) ?? [],
  };
}

export function construirPayloadProducto(f) {
  return {
    nombre: f.nombre,
    descripcion: f.descripcion,
    categoria: f.categoria,
    precio: aNumero(f.precio),
    cantidadDisponible: aNumero(f.cantidadDisponible),
    activo: f.activo,
    imagenes: f.imagenes,
  };
}
