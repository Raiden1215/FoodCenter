import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.jsx';
import { RequireAuth, SoloPublico } from './components/RutasAuth.jsx';
import Home from './pages/Home.jsx';
import Cart from './pages/Cart.jsx';
import MyStore from './pages/MyStore.jsx';
import Settings from './pages/Settings.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Recuperar from './pages/Recuperar.jsx';
import Buscar from './pages/Buscar.jsx';
import ProductoDetalle from './pages/ProductoDetalle.jsx';
import LocalForm from './pages/LocalForm.jsx';
import ProductoForm from './pages/ProductoForm.jsx';

export default function App() {
  return (
    <Routes>
      {/* Requieren sesión; incluyen la barra de navegación inferior */}
      <Route element={<RequireAuth />}>
        {/* La búsqueda ocupa toda la pantalla, sin barra inferior (RF-18) */}
        <Route path="/buscar" element={<Buscar />} />
        {/* El detalle tiene su propia barra de acciones, sin barra inferior */}
        <Route path="/producto/:id" element={<ProductoDetalle />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/mi-local" element={<MyStore />} />
          <Route path="/mi-local/editar" element={<LocalForm />} />
          <Route path="/mi-local/productos/nuevo" element={<ProductoForm />} />
          <Route path="/mi-local/productos/:id" element={<ProductoForm />} />
          <Route path="/configuracion" element={<Settings />} />
        </Route>
      </Route>

      {/* Solo para quien aún no inició sesión */}
      <Route element={<SoloPublico />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/recuperar" element={<Recuperar />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
