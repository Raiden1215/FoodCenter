const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// "Recordarme" guarda el token en localStorage; si no, en sessionStorage (se borra al cerrar el navegador).
export const obtenerToken = () => localStorage.getItem('token') ?? sessionStorage.getItem('token');

export function guardarToken(token, recordar) {
  borrarToken();
  (recordar ? localStorage : sessionStorage).setItem('token', token);
}

export function borrarToken() {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
}

async function peticion(path, { method, body, headers }) {
  const token = obtenerToken();
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
      body,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0);
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error ?? 'Error de red', res.status);
  return data;
}

export function api(path, { method = 'GET', body, headers } = {}) {
  return peticion(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Envía un archivo (Blob) como cuerpo binario.
export function apiSubir(path, blob) {
  return peticion(path, { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob });
}
