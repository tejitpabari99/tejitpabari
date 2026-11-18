// scripts/lib/site-config.mjs
//
// Shared by the build scripts (generate-sitemap, generate-og-cards,
// normalize-ssg-build-id, inject-csp-hashes). Reads src/config/sites.json
// with readFileSync (scripts run as plain Node, no '@/' alias or JSON
// module support needed) and resolves the current site from process.env.SITE
// (unset or empty -> main). Mirrors vite.config.ts's resolveSite.
import { readFileSync } from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '..', '..');

export function loadSites(root = ROOT) {
  return JSON.parse(readFileSync(path.join(root, 'src/config/sites.json'), 'utf-8'));
}

export function resolveSite(value, sites = loadSites()) {
  const site = value === undefined || value === '' ? 'main' : value;
  if (!Object.prototype.hasOwnProperty.call(sites, site)) {
    throw new Error(`site-config: invalid SITE "${site}". Expected one of: ${Object.keys(sites).join(', ')}.`);
  }
  return site;
}

/** { site, config, distDir } for the current process.env.SITE. */
export function currentSite(env = process.env, root = ROOT) {
  const sites = loadSites(root);
  const site = resolveSite(env.SITE, sites);
  const config = sites[site];
  return { site, config, distDir: path.join(root, config.outDir) };
}

/** Frontmatter `sites:` of a content file; missing = ['main']. */
export function sitesOf(data) {
  return Array.isArray(data.sites) && data.sites.length > 0 ? data.sites : ['main'];
}
