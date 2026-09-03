// scripts/generate-sitemap.test.ts
//
// Task 17 (06-sharing-seo-sample-project TASKS.md) — per PRD §7's sixth
// bullet. Uses `generate-sitemap.mjs`'s exported `buildSitemapUrls`/
// `STATIC_ROUTES` directly with fixture slug arrays — no real filesystem
// scan needed to prove the URL-composition logic, since `buildSitemapUrls`
// is a pure function that takes plain arrays and does no I/O of its own.
//
// Round 3 (r3-01-schema-icons-content): the /live subsystem (and its
// `hostedLiveSlugs`/fourth `buildSitemapUrls` argument) was removed —
// `generate-sitemap.mjs` no longer parses src/pages/live/registry.ts for a
// hosted-slug list, so that describe block and argument are gone from this
// file too.
//
// This file intentionally lives under `scripts/`, not `src/`, and — like
// scripts/generate-og-cards.test.ts (Task 15/16) before it — is excluded
// from vitest's default test discovery via `test.exclude` in
// vite.config.ts (`scripts/**`), so `npm test` (`vitest run` with no path
// argument) does not pick it up and its suite/test counts stay unaffected.
// Because Vitest applies `exclude` before a CLI path argument filters
// anything, run this file with the same lever `check:launch` uses to lift
// the `scripts/**` exclusion for one invocation:
// `CHECK_LAUNCH=1 npx vitest run scripts/generate-sitemap.test.ts`.
import { describe, it, expect } from 'vitest';
import { buildSitemapUrls, escapeXml, STATIC_ROUTES } from './generate-sitemap.mjs';

describe('buildSitemapUrls', () => {
  it('includes every static route, project slug, and research slug', () => {
    const urls = buildSitemapUrls(STATIC_ROUTES, ['juno', 'sample-project'], ['flood-nlp']);
    expect(urls).toHaveLength(STATIC_ROUTES.length + 2 + 1);
    expect(urls).toContain('/projects/juno');
    expect(urls).toContain('/projects/sample-project');
    expect(urls).toContain('/research/flood-nlp');
  });

  it('returns just the static routes, unmodified, when every collection array is empty', () => {
    const urls = buildSitemapUrls(STATIC_ROUTES, [], []);
    expect(urls).toEqual(STATIC_ROUTES);
  });

  it('composes multiple project/research slugs independently of input order', () => {
    const urls = buildSitemapUrls(STATIC_ROUTES, ['a', 'b'], ['c']);
    expect(urls).toContain('/projects/a');
    expect(urls).toContain('/projects/b');
    expect(urls).toContain('/research/c');
    expect(urls).not.toContain('/research/a');
  });
});

// Defense-in-depth (non-blocking finding): collectionSlugs() reads `slug`
// from frontmatter with no validation of its own, and main() interpolates
// it, unescaped, into raw <loc> XML text. escapeXml() closes that off
// regardless of what a slug (or any other value threaded through it)
// contains.
describe('escapeXml', () => {
  it('escapes all five XML-significant characters', () => {
    expect(escapeXml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&apos;');
  });

  it('leaves an ordinary URL unchanged', () => {
    expect(escapeXml('https://tejitpabari.com/projects/juno')).toBe('https://tejitpabari.com/projects/juno');
  });

  it('neutralizes a slug value that would otherwise break out of <loc> (e.g. "]]></loc><script>")', () => {
    const malicious = 'https://tejitpabari.com/projects/x"><script>alert(1)</script>';
    const escaped = escapeXml(malicious);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });
});
