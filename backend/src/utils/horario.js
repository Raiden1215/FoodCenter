import { env } from '../config/env.js';

const DIAS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// Día de la semana (0 = domingo) y minutos desde las 00:00 en la zona horaria del negocio.
export function momentoLocal(fecha = new Date(), timeZone = env.timezone) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(fecha);
  const valor = (tipo) => partes.find((p) => p.type === tipo).value;
  return { dia: DIAS[valor('weekday')], minutos: (Number(valor('hour')) % 24) * 60 + Number(valor('minute')) };
}

// Un local sin horarios configurados se considera siempre abierto.
export function estaAbierto(horarios, fecha = new Date()) {
  if (!horarios?.length) return true;
  const { dia, minutos } = momentoLocal(fecha);
  return horarios.some((h) => h.diaSemana === dia && minutos >= h.abreMin && minutos < h.cierraMin);
}
