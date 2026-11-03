import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const CarritoContext = createContext(null);

export const MAXIMO_POR_PRODUCTO = 99;
export const MAXIMO_PRODUCTOS = 50; // coincide con el máximo de ids que acepta GET /api/productos?ids=

// Cada usuario tiene su propio carrito en el dispositivo (RF-21).
const clave = (usuarioId) => `foodcenter:carrito:${usuarioId}`;

function leer(usuarioId) {
  try {
    const datos = JSON.parse(localStorage.getItem(clave(usuarioId)) ?? '[]');
    if (!Array.isArray(datos)) return [];
    return datos
      .filter((i) => typeof i?.id === 'string' && Number.isInteger(i.cantidad) && i.cantidad > 0)
      .slice(0, MAXIMO_PRODUCTOS)
      .map((i) => ({ id: i.id, cantidad: Math.min(i.cantidad, MAXIMO_POR_PRODUCTO) }));
  } catch {
    return []; // almacenamiento no disponible o datos dañados
  }
}

export function CarritoProvider({ children }) {
  const { usuario } = useAuth();
  const usuarioId = usuario?.id ?? null;
  const [items, setItems] = useState([]); // [{ id, cantidad }]
  const [cargadoPara, setCargadoPara] = useState(null);

  // Al iniciar sesión (o cambiar de usuario) se carga su carrito guardado.
  useEffect(() => {
    setItems(usuarioId ? leer(usuarioId) : []);
    setCargadoPara(usuarioId);
  }, [usuarioId]);

  useEffect(() => {
    if (!usuarioId || cargadoPara !== usuarioId) return;
    try {
      localStorage.setItem(clave(usuarioId), JSON.stringify(items));
    } catch {
      /* sin almacenamiento: el carrito vive solo mientras la página esté abierta */
    }
  }, [items, usuarioId, cargadoPara]);

  const cantidadDe = useCallback((id) => items.find((i) => i.id === id)?.cantidad ?? 0, [items]);
  const puedeAgregar = useCallback((id) => items.length < MAXIMO_PRODUCTOS || items.some((i) => i.id === id), [items]);

  // Suma unidades sin pasar de "maximo" (las existencias del producto).
  const agregar = useCallback((id, cantidad = 1, maximo = MAXIMO_POR_PRODUCTO) => {
    setItems((previo) => {
      const tope = Math.min(maximo, MAXIMO_POR_PRODUCTO);
      const existente = previo.find((i) => i.id === id);
      if (!existente && previo.length >= MAXIMO_PRODUCTOS) return previo;
      const nueva = Math.min((existente?.cantidad ?? 0) + cantidad, tope);
      if (nueva <= 0) return previo;
      return existente ? previo.map((i) => (i.id === id ? { ...i, cantidad: nueva } : i)) : [...previo, { id, cantidad: nueva }];
    });
  }, []);

  const cambiarCantidad = useCallback((id, cantidad, maximo = MAXIMO_POR_PRODUCTO) => {
    const tope = Math.min(maximo, MAXIMO_POR_PRODUCTO);
    setItems((previo) => previo.map((i) => (i.id === id ? { ...i, cantidad: Math.max(1, Math.min(cantidad, tope)) } : i)));
  }, []);

  const quitar = useCallback((id) => setItems((previo) => previo.filter((i) => i.id !== id)), []);
  const vaciar = useCallback(() => setItems([]), []);

  const valor = useMemo(
    () => ({
      items,
      unidades: items.reduce((suma, i) => suma + i.cantidad, 0),
      cantidadDe,
      puedeAgregar,
      agregar,
      cambiarCantidad,
      quitar,
      vaciar,
    }),
    [items, cantidadDe, puedeAgregar, agregar, cambiarCantidad, quitar, vaciar]
  );

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}

export function useCarrito() {
  return useContext(CarritoContext);
}
