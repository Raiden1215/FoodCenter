import { ETIQUETAS_CATEGORIA } from '../schemas/enums.js';

// Minúsculas y sin tildes, para que "clasicas" encuentre "clásicas".
export const normalizar = (texto) =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

const inicioDePalabra = (texto, palabra) => ` ${texto}`.includes(` ${palabra}`);

// Búsqueda clásica por coincidencia de texto. Devuelve 0 si el producto no coincide.
// Cada palabra de la consulta debe aparecer en algún campo (nombre, descripción, categoría o local);
// el puntaje favorece las coincidencias en el nombre y al inicio de una palabra.
export function puntuarProducto(producto, consulta) {
  const palabras = consulta.split(/\s+/).filter(Boolean);
  if (!palabras.length) return 0;

  const nombre = normalizar(producto.nombre);
  const descripcion = normalizar(producto.descripcion);
  const categoria = normalizar(ETIQUETAS_CATEGORIA[producto.categoria] ?? '');
  const local = normalizar(producto.local?.nombre ?? '');

  let total = 0;
  for (const palabra of palabras) {
    let puntos = 0;
    if (inicioDePalabra(nombre, palabra)) puntos += 30;
    else if (nombre.includes(palabra)) puntos += 20;
    if (descripcion.includes(palabra)) puntos += 8;
    if (categoria.includes(palabra)) puntos += 12;
    if (local.includes(palabra)) puntos += 10;

    if (puntos === 0) return 0;
    total += puntos;
  }

  if (nombre.includes(consulta)) total += 25; // la frase completa aparece en el nombre
  return total;
}
