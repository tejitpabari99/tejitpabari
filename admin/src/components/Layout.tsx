import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-cream font-sans text-ink">
      <header className="px-4 py-3 font-semibold text-teal">admin.tejitpabari.com</header>
      <main className="px-4">
        <Outlet />
      </main>
    </div>
  );
}
