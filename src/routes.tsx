// src/routes.tsx
//
// Per-site route tables (01-multi-site-build, Decision 2). `routes` is picked
// with a static `import.meta.env.VITE_SITE` comparison so the bundler can drop
// the other sites' tables (and main-only pages) from a subsite build.
// `routesBySite` is for tests/tooling only; build entry points must keep using
// `routes`.
import type { RouteRecord } from 'vite-react-ssg';
import type { SiteId } from '@/data';
import { mainRoutes } from './routes/main';
import { healthtechRoutes } from './routes/healthtech';
import { nonprofitRoutes } from './routes/nonprofit';

export const routesBySite: Record<SiteId, RouteRecord[]> = {
  main: mainRoutes,
  healthtech: healthtechRoutes,
  nonprofit: nonprofitRoutes,
};

export const routes: RouteRecord[] =
  import.meta.env.VITE_SITE === 'healthtech'
    ? healthtechRoutes
    : import.meta.env.VITE_SITE === 'nonprofit'
      ? nonprofitRoutes
      : mainRoutes;
