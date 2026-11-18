// src/config/site-target.ts
// The single seam for "current site". VITE_SITE is set by vite.config.ts from
// process.env.SITE (default main), so SSR and client agree.
import type { SiteId } from '@/data';
import sites from './sites.json';

export interface SiteConfig {
  id: SiteId;
  url: string;
  name: string;
  description: string;
  outDir: string;
  target: string;
  hasLiveRoutes: boolean;
  staticRoutes: string[];
}

export const SITE = (import.meta.env.VITE_SITE ?? 'main') as SiteId;

export const SITE_CONFIG: SiteConfig = (sites as Record<SiteId, SiteConfig>)[SITE];
