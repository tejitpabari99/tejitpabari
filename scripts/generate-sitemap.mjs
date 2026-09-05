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

// Round 3.1 restoration of the /live subsystem's sitemap entry: only a
// self-hosted live page (`live: { type: self, page: <name> }`) is real,
// prerendered, crawlable content of its own - it belongs in the sitemap.
// An external redirect (`live: { type: external, href }`) and the
// no-`live`-field detail-page fallback both just 301 elsewhere (see
// vite.config.ts's live-redirects plugin) and must NOT appear here: a
// sitemap entry that immediately redirects is exactly the kind of noise
// sitemaps exist to avoid.
//
// Parses src/pages/live/registry.ts's HOSTED_LIVE_PAGES object literal for
// its keys (page names) rather than `import`-ing it: registry.ts pulls in
// no `@/data` any more (round 3.1 moved that dependency direction the
// other way - see src/data/shared.ts's assertOptionalLive), but this
// script still can't rely on this project's '@/...' TS path alias or on
// any Vite-only transform (see collectionSlugs's sibling note in the
// removed pre-round-3 version of this function, and
// scripts/check-launch-content.test.ts's header comment, for the same
// constraint hit elsewhere). Text-parsing keeps this script free of the
// app's module resolution entirely.
export function hostedPageNames(liveDir, registryPath = path.join(liveDir, 'registry.ts')) {
  const source = readFileSync(registryPath, 'utf-8');
  // Match up to the FIRST closing brace after the `= {` - the object body
  // is always a flat list of `'name': Identifier` entries (no nested
  // object/array values), so the first `}` is always the real close - safe
  // to use a non-greedy match instead of requiring a specific line-break/
  // semicolon shape. This tolerates every Prettier-legal rendering of an
  // empty object (`{}`, `{\n}`, with or without a trailing `;`) as well as
  // the populated, multi-line, semicolon-terminated form.
  const objectMatch = source.match(/HOSTED_LIVE_PAGES\s*:\s*Record<[^>]*>\s*=\s*\{([\s\S]*?)\}\s*;?/);
  if (!objectMatch) {
    throw new Error(
      `generate-sitemap.mjs: could not find "HOSTED_LIVE_PAGES: Record<...> = { ... }" in ` +
        `${registryPath} — the sitemap generator derives self-hosted live page names from that object ` +
        `and cannot proceed without it.`,
    );
  }

  // Strip full-line `//` comments before scanning for `'key':` entries -
  // registry.ts ships with a commented-out documentation example
  // (`// 'name': Component,`) that must NOT be counted as a real
  // registered page name.
  const body = objectMatch[1].replace(/^\s*\/\/.*$/gm, '');
  const names = [...body.matchAll(/['"]([^'"]+)['"]\s*:/g)].map((m) => m[1]);

  for (const name of names) {
    const componentFile = path.join(liveDir, `${name}.tsx`);
    if (!existsSync(componentFile)) {
      throw new Error(
        `generate-sitemap.mjs: ${registryPath}'s HOSTED_LIVE_PAGES lists "${name}" but ` +
          `${componentFile} does not exist.`,
      );
    }
  }

  return names;
}

// Scans one content collection directory for `live: { type: self, page }`
// entries and returns their full `/live` sitemap URLs, cross-checking each
// `page` against `hostedNames` (defense-in-depth: the real content loader,
// src/data/shared.ts's assertOptionalLive, validates this too, but only
// later during the main build's SSR step - this `prebuild` script runs
// first and would otherwise happily publish a sitemap URL for a page that
// the main build is about to reject).
export function selfHostedLiveUrls(dir, routePrefix, hostedNames) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ file: f, data: matter(readFileSync(path.join(dir, f), 'utf-8')).data }))
    .filter(({ data }) => data.live && data.live.type === 'self')
    .map(({ file, data }) => {
      if (!hostedNames.includes(data.live.page)) {
        throw new Error(
          `generate-sitemap.mjs: ${path.join(dir, file)}: "live.page: ${data.live.page}" is not registered in ` +
            `src/pages/live/registry.ts's HOSTED_LIVE_PAGES.`,
        );
      }
      return `/${routePrefix}/${data.slug}/live`;
    });
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

/** Pure URL-list builder — no filesystem access, easy to unit-test directly.
 *  `hostedLiveUrls` is a flat list of already-prefixed paths (e.g.
 *  "/projects/crunchy-filler/live") — see selfHostedLiveUrls above —
 *  defaulting to [] so every existing call site without a live-URL
 *  argument still works unchanged. */
export function buildSitemapUrls(staticRoutes, projectSlugs, researchSlugs, hostedLiveUrls = []) {
  return [
    ...staticRoutes,
    ...projectSlugs.map((slug) => `/projects/${slug}`),
    ...researchSlugs.map((slug) => `/research/${slug}`),
    ...hostedLiveUrls,
  ];
}

function main() {
  const liveDir = path.join(ROOT, 'src/pages/live');
  const hostedNames = hostedPageNames(liveDir);

  const urls = buildSitemapUrls(
    STATIC_ROUTES,
    collectionSlugs(path.join(ROOT, 'src/content/projects')),
    collectionSlugs(path.join(ROOT, 'src/content/research')),
    [
      ...selfHostedLiveUrls(path.join(ROOT, 'src/content/projects'), 'projects', hostedNames),
      ...selfHostedLiveUrls(path.join(ROOT, 'src/content/research'), 'research', hostedNames),
    ],
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
