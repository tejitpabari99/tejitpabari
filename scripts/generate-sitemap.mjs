// scripts/generate-sitemap.mjs
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
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

// Hosted /live slugs must come from src/pages/live/registry.ts's
// HOSTED_LIVE_PAGES — the one map routes.tsx/getStaticPaths actually build
// on (see registry.ts's computeProjectLiveSlugs) — never from a raw
// directory listing. A filesystem scan of `*.tsx` files necessarily also
// matches sibling test files (e.g. `sample-project.test.tsx`, which itself
// ends in `.tsx`), publishing sitemap entries for routes that don't exist.
//
// registry.ts can't be `import`-ed from this plain `.mjs` script: it pulls
// in `@/data`, whose loaders call Vite-only `import.meta.glob(...)` at
// module top level — a build-time macro with no runtime implementation
// outside Vite's own transform. Node (and esbuild-based `tsx`, already a
// devDependency) both throw `TypeError: (intermediate value).glob is not
// a function` on that import; this is the exact, already-documented
// constraint scripts/check-launch-content.test.ts hit for the same
// `src/data` import (see that file's header comment) — it's why that
// script runs under Vitest's own transform instead of `tsx`/`node`, which
// isn't an option here since this generator is a `prebuild` script, not a
// test file.
//
// So: parse registry.ts's source text for the HOSTED_LIVE_PAGES object's
// keys directly. This makes the registry authoritative (the slug list is
// read out of the registry's own literal contents, not re-derived from
// directory contents) without needing a module import. Each parsed slug is
// then cross-checked against the real filesystem so a malformed registry
// edit fails the build loudly instead of silently mis-publishing.
export function hostedLiveSlugs(liveDir, registryPath = path.join(liveDir, 'registry.ts')) {
  const source = readFileSync(registryPath, 'utf-8');
  const objectMatch = source.match(/HOSTED_LIVE_PAGES\s*:\s*Record<[^>]*>\s*=\s*\{([\s\S]*?)\n\};/);
  if (!objectMatch) {
    throw new Error(
      `generate-sitemap.mjs: could not find "HOSTED_LIVE_PAGES: Record<...> = { ... }" in ` +
        `${registryPath} — the sitemap generator derives hosted /live slugs from that object ` +
        `and cannot proceed without it.`,
    );
  }

  const slugs = [...objectMatch[1].matchAll(/['"]([^'"]+)['"]\s*:/g)].map((m) => m[1]);

  for (const slug of slugs) {
    const componentFile = path.join(liveDir, `${slug}.tsx`);
    if (!existsSync(componentFile)) {
      throw new Error(
        `generate-sitemap.mjs: ${registryPath}'s HOSTED_LIVE_PAGES lists "${slug}" but ` +
          `${componentFile} does not exist.`,
      );
    }
  }

  return slugs;
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
export function buildSitemapUrls(staticRoutes, projectSlugs, researchSlugs, hostedLiveSlugList) {
  return [
    ...staticRoutes,
    ...projectSlugs.map((slug) => `/projects/${slug}`),
    ...researchSlugs.map((slug) => `/research/${slug}`),
    ...hostedLiveSlugList.map((slug) => `/projects/${slug}/live`),
  ];
}

function main() {
  const urls = buildSitemapUrls(
    STATIC_ROUTES,
    collectionSlugs(path.join(ROOT, 'src/content/projects')),
    collectionSlugs(path.join(ROOT, 'src/content/research')),
    hostedLiveSlugs(path.join(ROOT, 'src/pages/live')),
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
