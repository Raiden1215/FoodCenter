import { useState } from 'react';

const MENSAJES = {
  1: 'Permiso de ubicación denegado. Actívalo desde el candado de la barra de direcciones y vuelve a intentarlo.',
  2: 'Tu dispositivo no pudo determinar la ubicación (es común en computadores). Puedes continuar sin ella.',
  3: 'Se agotó el tiempo para obtener la ubicación. Inténtalo de nuevo.',
};

export function useGeolocalizacion() {
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  function obtener(alObtener) {
    if (!window.isSecureContext) {
      setMensaje('La ubicación solo funciona en HTTPS o en localhost. Puedes continuar sin ella.');
      return;
    }
    if (!navigator.geolocation) {
      setMensaje('Tu navegador no permite obtener la ubicación.');
      return;
    }
    setCargando(true);
    setMensaje('Obteniendo ubicación…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        alObtener({ latitud: pos.coords.latitude, longitud: pos.coords.longitude });
        setMensaje('Ubicación guardada.');
        setCargando(false);
      },
      (err) => {
        setMensaje(MENSAJES[err.code] ?? 'No se pudo obtener la ubicación. Puedes continuar sin ella.');
        setCargando(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return { mensaje, cargando, obtener };
}
