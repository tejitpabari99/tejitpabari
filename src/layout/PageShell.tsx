// src/layout/PageShell.tsx
import { Outlet, useMatches } from 'react-router-dom';
import { ScrollManager } from '@/lib/ScrollManager';
import { AnalyticsListener } from '@/lib/AnalyticsListener'; // SP05 add
import { ConsentProvider } from '@/context/ConsentContext';   // SP05 add
import { ConsentBanner } from '@/components/ConsentBanner';   // SP05 add
import { Nav } from './Nav';
import { Footer } from './Footer';
import { chromeModeFromHandle } from './chromeMode';

export function PageShell() {
  const matches = useMatches();
  // routes.tsx has exactly one level of route beneath PageShell today, so
  // ".at(-1)" (the deepest/leaf match) is the only match that carries a
  // page-specific handle. Written this way (rather than indexing [0]) so a
  // future nested route's own handle still wins over an ancestor's,
  // matching react-router's own handle convention.
  const chromeMode = chromeModeFromHandle(matches.at(-1)?.handle);

  return (
    <ConsentProvider> {/* SP05 add: wraps everything below */}
      <ScrollManager />
      <AnalyticsListener /> {/* SP05 add */}
      <div className="flex min-h-screen flex-col">
        {chromeMode === 'full' && <Nav />}
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <ConsentBanner /> {/* SP05 add */}
    </ConsentProvider>
  );
}
