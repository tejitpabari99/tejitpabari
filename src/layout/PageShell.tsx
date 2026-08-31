// src/layout/PageShell.tsx
import { Outlet } from 'react-router-dom';
import { ScrollManager } from '@/lib/ScrollManager';
import { AnalyticsListener } from '@/lib/AnalyticsListener'; // SP05 add
import { ConsentProvider } from '@/context/ConsentContext';   // SP05 add
import { ConsentBanner } from '@/components/ConsentBanner';   // SP05 add
import { Nav } from './Nav';
import { Footer } from './Footer';

export function PageShell() {
  return (
    <ConsentProvider> {/* SP05 add: wraps everything below */}
      <ScrollManager />
      <AnalyticsListener /> {/* SP05 add */}
      <Nav />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ConsentBanner /> {/* SP05 add */}
    </ConsentProvider>
  );
}
