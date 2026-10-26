// src/layout/PageShell.tsx
import { Outlet } from 'react-router-dom';
import { ScrollManager } from '@/lib/ScrollManager';
import { AnalyticsListener } from '@/lib/AnalyticsListener'; // SP05 add
import { ConsentProvider } from '@/context/ConsentContext';   // SP05 add
import { ConsentBanner } from '@/components/ConsentBanner';   // SP05 add
import { Nav } from './Nav';
import { Footer } from './Footer';

// Round 3 (owner: "Remove back from all places. I think navbar is good
// enough maybe. Confusing to have both."): the "back-only" chrome mode
// that hid Nav on /projects and /projects/:slug is gone entirely - Nav is
// now unconditionally visible on every route.
export function PageShell() {
  return (
    <ConsentProvider> {/* SP05 add: wraps everything below */}
      <ScrollManager />
      <AnalyticsListener /> {/* SP05 add */}
      <div className="flex min-h-screen flex-col">
        <Nav />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <ConsentBanner /> {/* SP05 add */}
    </ConsentProvider>
  );
}
