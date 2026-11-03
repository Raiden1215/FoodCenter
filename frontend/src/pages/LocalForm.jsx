import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormularioLocal from '../components/local/FormularioLocal.jsx';
import EncabezadoPagina from '../components/layout/EncabezadoPagina.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

export default function LocalForm() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [estado, setEstado] = useState({ cargando: true });

  useEffect(() => {
    api('/locales/mio')
      .then((local) => setEstado({ local }))
      .catch((err) => setEstado({ error: err.message }));
  }, []);

  return (
    <div>
      <EncabezadoPagina titulo={estado.local ? 'Editar local' : 'Crea tu negocio'} />
      {estado.cargando && <p className="text-sm text-gray-500">Cargando…</p>}
      {estado.error && <p role="alert" className="text-sm text-red-700">{estado.error}</p>}
      {!estado.cargando && !estado.error && (
        <FormularioLocal inicial={estado.local} usuario={usuario} onGuardado={() => navigate('/mi-local')} />
      )}
    </div>
  );
}
