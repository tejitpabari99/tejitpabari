// scripts/generate-sitemap.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// Deliberately duplicated from src/config/site.ts — see PRD §4.1.
const SITE_URL = 'https://tejitpabari.com';

const ROOT = path.resolve(import.meta.dirname, '..');

// SP01's static route table, minus the client-only catch-all ('*' has no
// concrete path to list) and minus any /live path — handled separately.
export const STATIC_ROUTES = ['/', '/projects', '/work-experience', '/research', '/privacy', '/terms'];

export function collectionSlugs(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => matter(readFileSync(path.join(dir, f), 'utf-8')).data.slug);
}

// Defense-in-depth, not a fix for a proven exploit: collectionSlugs() below
// reads `slug` from frontmatter with no validation of its own (unlike
// scripts/generate-og-cards.mjs's readCollection, fixed separately to
// reject path-traversal/mismatched slugs for its own writeFileSync use).
// The real build's loader (src/data/shared.ts's assertSlugMatchesFilename)
// does validate every slug, but only later, during SSR route rendering —
// same ordering gap as SP02/SP04's other findings. An odd slug value could
// otherwise be interpolated into this file's raw <loc> text unescaped.
export function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Pure URL-list builder — no filesystem access, easy to unit-test directly. */
export function buildSitemapUrls(staticRoutes, projectSlugs, researchSlugs) {
  return [
    ...staticRoutes,
    ...projectSlugs.map((slug) => `/projects/${slug}`),
    ...researchSlugs.map((slug) => `/research/${slug}`),
  ];
}

function main() {
  const urls = buildSitemapUrls(
    STATIC_ROUTES,
    collectionSlugs(path.join(ROOT, 'src/content/projects')),
    collectionSlugs(path.join(ROOT, 'src/content/research')),
  );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => `  <url><loc>${escapeXml(SITE_URL + u)}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');

  writeFileSync(path.join(ROOT, 'public/sitemap.xml'), xml);
  console.log(`sitemap.xml: ${urls.length} URLs`);

  writeFileSync(path.join(ROOT, 'public/robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  console.log('robots.txt written');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
