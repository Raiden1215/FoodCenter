import { NavLink } from 'react-router-dom';
import { Home, ShoppingCart, Store, Settings } from 'lucide-react';
import { useCarrito } from '../../context/CarritoContext.jsx';

const items = [
  { to: '/', label: 'Principal', icon: Home },
  { to: '/carrito', label: 'Carrito', icon: ShoppingCart },
  { to: '/mi-local', label: 'Mi Local', icon: Store },
  { to: '/configuracion', label: 'Config.', icon: Settings },
];

export default function BottomNav() {
  const { unidades } = useCarrito();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-brand-100 bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="mx-auto flex max-w-xl">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                  isActive ? 'text-brand-600' : 'text-gray-500'
                }`
              }
            >
              <span className="relative">
                <Icon size={22} />
                {to === '/carrito' && unidades > 0 && (
                  <span aria-label={`${unidades} en el carrito`} className="absolute -top-1.5 -right-2.5 flex min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] leading-4 font-bold text-white">
                    {unidades > 99 ? '99+' : unidades}
                  </span>
                )}
              </span>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
