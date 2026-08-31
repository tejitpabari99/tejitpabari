// src/layout/PageShell.tsx
import { Outlet } from 'react-router-dom';
import { ScrollManager } from '@/lib/ScrollManager';
import { Nav } from './Nav';
import { Footer } from './Footer';

export function PageShell() {
  return (
    <>
      <ScrollManager />
      <Nav />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
