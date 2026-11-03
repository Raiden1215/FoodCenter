const formatoPesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export const formatearPrecio = (valor) => formatoPesos.format(valor);

// Minutos desde las 00:00 <-> "HH:MM" (formato de <input type="time">).
export function minutosAHora(minutos) {
  const m = minutos % 1440; // 1440 (medianoche) se muestra como 00:00
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function horaAMinutos(hora, esCierre = false) {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m;
  return esCierre && total === 0 ? 1440 : total;
}

export const aNumero = (texto) => (texto === '' || texto == null ? null : Number(texto));

// Día de la semana actual (0 = domingo) en la zona horaria de los locales.
export function diaActualColombia(fecha = new Date()) {
  const dia = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', weekday: 'short' }).format(fecha);
  return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[dia];
}

// "08:00 – 18:00" (varios bloques de un mismo día se separan con coma)
export const rangoHorario = (bloques) => bloques.map((b) => `${minutosAHora(b.abreMin)} – ${minutosAHora(b.cierraMin)}`).join(', ');

export const formatearFecha = (fecha) =>
  new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(fecha));

// 4.5 -> "4,5"
export const formatearPromedio = (valor) => valor.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
