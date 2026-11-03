import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EncabezadoPagina from '../components/layout/EncabezadoPagina.jsx';
import FormularioProducto from '../components/productos/FormularioProducto.jsx';
import { api } from '../services/api.js';

export default function ProductoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState({ cargando: true });

  useEffect(() => {
    api('/productos/mios')
      .then((productos) => {
        const producto = id ? productos.find((p) => p.id === id) : null;
        if (id && !producto) throw new Error('Producto no encontrado');
        setEstado({ producto });
      })
      .catch((err) => setEstado({ error: err.message }));
  }, [id]);

  return (
    <div>
      <EncabezadoPagina titulo={id ? 'Editar producto' : 'Nuevo producto'} />
      {estado.cargando && <p className="text-sm text-gray-500">Cargando…</p>}
      {estado.error && <p role="alert" className="text-sm text-red-700">{estado.error}</p>}
      {!estado.cargando && !estado.error && (
        <FormularioProducto producto={estado.producto} onGuardado={() => navigate('/mi-local')} />
      )}
    </div>
  );
}
