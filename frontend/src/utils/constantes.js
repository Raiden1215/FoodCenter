export const CATEGORIAS = [
  { valor: 'COMIDA_RAPIDA', etiqueta: 'Comida rápida' },
  { valor: 'ALMUERZOS', etiqueta: 'Almuerzos' },
  { valor: 'DESAYUNOS', etiqueta: 'Desayunos' },
  { valor: 'POSTRES', etiqueta: 'Postres' },
  { valor: 'BEBIDAS', etiqueta: 'Bebidas' },
  { valor: 'SNACKS', etiqueta: 'Snacks' },
  { valor: 'INGREDIENTES', etiqueta: 'Ingredientes' },
];

export const METODOS_PAGO = [
  { valor: 'EFECTIVO', etiqueta: 'Efectivo' },
  { valor: 'QR_NEQUI', etiqueta: 'QR de Nequi' },
  { valor: 'TRANSFERENCIA', etiqueta: 'Transferencia bancaria' },
];

// El índice es el número de día que usa la API (0 = domingo).
export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
// Orden en que se muestran en pantalla: de lunes a domingo.
export const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];
