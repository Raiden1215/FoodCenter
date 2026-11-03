import { createContext, useContext, useEffect, useState } from 'react';
import { api, borrarToken, guardarToken, obtenerToken } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // Si hay un token guardado, hay que verificarlo antes de decidir qué pantalla mostrar.
  const [cargando, setCargando] = useState(() => Boolean(obtenerToken()));

  useEffect(() => {
    if (!obtenerToken()) return;
    api('/auth/me')
      .then(setUsuario)
      .catch(borrarToken)
      .finally(() => setCargando(false));
  }, []);

  function guardarSesion({ token, usuario }, recordar) {
    guardarToken(token, recordar);
    setUsuario(usuario);
  }

  async function login({ recordar = true, ...datos }) {
    guardarSesion(await api('/auth/login', { method: 'POST', body: datos }), recordar);
  }

  async function registrar(datos) {
    guardarSesion(await api('/auth/registro', { method: 'POST', body: datos }), true);
  }

  function logout() {
    borrarToken();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
