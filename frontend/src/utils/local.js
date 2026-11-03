import { ORDEN_DIAS } from './constantes.js';
import { aNumero, horaAMinutos, minutosAHora } from './formato.js';

// Estado inicial del formulario del local: datos del local si existe; si no, valores por defecto.
export function estadoInicialLocal(local, usuario) {
  const horarios = Array.from({ length: 7 }, (_, dia) => {
    const bloque = local?.horarios?.find((h) => h.diaSemana === dia);
    if (bloque) return { activo: true, abre: minutosAHora(bloque.abreMin), cierra: minutosAHora(bloque.cierraMin) };
    // Un local nuevo arranca abierto de lunes a sábado, de 8:00 a 18:00.
    return { activo: !local && dia >= 1 && dia <= 6, abre: '08:00', cierra: '18:00' };
  });

  return {
    nombre: local?.nombre ?? '',
    eslogan: local?.eslogan ?? '',
    logoUrl: local?.logoUrl ?? null,
    portadaUrl: local?.portadaUrl ?? null,
    especialidades: local?.especialidades ?? [],
    tiempoPreparacionMin: local?.tiempoPreparacionMin?.toString() ?? '',
    tiempoEntregaMin: local?.tiempoEntregaMin?.toString() ?? '',
    zonaDomicilio: local?.zonaDomicilio ?? '',
    radioDomicilioKm: local?.radioDomicilioKm?.toString() ?? '',
    precioDomicilio: local?.precioDomicilio?.toString() ?? '0',
    // Al crear el local se parte de los datos del usuario; al editar, solo valen los del local.
    direccion: local ? local.direccion : (usuario?.direccion ?? ''),
    latitud: local ? local.latitud : (usuario?.latitud ?? null),
    longitud: local ? local.longitud : (usuario?.longitud ?? null),
    whatsapp: local?.whatsapp ?? '',
    instagram: local?.redesSociales?.instagram ?? '',
    facebook: local?.redesSociales?.facebook ?? '',
    tiktok: local?.redesSociales?.tiktok ?? '',
    metodosPago: local?.metodosPago ?? ['EFECTIVO'],
    qrNequiUrl: local?.qrNequiUrl ?? null,
    estado: local?.estado ?? 'DISPONIBLE',
    horarios,
  };
}

// Convierte el estado del formulario en el cuerpo que espera la API.
export function construirPayloadLocal(f) {
  const redesSociales = Object.fromEntries(
    ['instagram', 'facebook', 'tiktok'].filter((r) => f[r].trim()).map((r) => [r, f[r].trim()])
  );

  return {
    nombre: f.nombre,
    eslogan: f.eslogan.trim() || null,
    logoUrl: f.logoUrl,
    portadaUrl: f.portadaUrl,
    especialidades: f.especialidades,
    tiempoPreparacionMin: aNumero(f.tiempoPreparacionMin),
    tiempoEntregaMin: aNumero(f.tiempoEntregaMin),
    zonaDomicilio: f.zonaDomicilio.trim() || null,
    radioDomicilioKm: aNumero(f.radioDomicilioKm),
    precioDomicilio: aNumero(f.precioDomicilio) ?? 0,
    direccion: f.direccion,
    latitud: f.latitud,
    longitud: f.longitud,
    whatsapp: f.whatsapp.trim() || null,
    redesSociales,
    metodosPago: f.metodosPago,
    qrNequiUrl: f.metodosPago.includes('QR_NEQUI') ? f.qrNequiUrl : null,
    estado: f.estado,
    horarios: ORDEN_DIAS.filter((dia) => f.horarios[dia].activo).map((dia) => ({
      diaSemana: dia,
      abreMin: horaAMinutos(f.horarios[dia].abre),
      cierraMin: horaAMinutos(f.horarios[dia].cierra, true),
    })),
  };
}
