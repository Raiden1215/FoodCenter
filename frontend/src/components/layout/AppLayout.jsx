import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav.jsx';

export default function AppLayout() {
  return (
    <div className="mx-auto min-h-full max-w-xl pb-20">
      <main className="px-4 pt-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))' }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
