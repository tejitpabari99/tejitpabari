// scripts/generate-sitemap.test.ts
//
// Task 17 (06-sharing-seo-sample-project TASKS.md) — per PRD §7's sixth
// bullet. Uses `generate-sitemap.mjs`'s exported `buildSitemapUrls`/
// `STATIC_ROUTES` directly with fixture slug arrays — no real filesystem
// scan needed to prove the URL-composition and exclusion logic, since
// `buildSitemapUrls` is a pure function that takes plain arrays and does
// no I/O of its own.
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
import { buildSitemapUrls, STATIC_ROUTES } from './generate-sitemap.mjs';

describe('buildSitemapUrls', () => {
  it('includes every static route, project slug, research slug, and hosted /live slug', () => {
    const urls = buildSitemapUrls(STATIC_ROUTES, ['juno', 'sample-project'], ['flood-nlp'], ['sample-project']);
    expect(urls).toHaveLength(STATIC_ROUTES.length + 2 + 1 + 1);
    expect(urls).toContain('/projects/juno');
    expect(urls).toContain('/projects/sample-project');
    expect(urls).toContain('/research/flood-nlp');
    expect(urls).toContain('/projects/sample-project/live');
  });

  it('never includes a /live entry for a project slug not in the hosted list (redirect mode)', () => {
    // 'juno' is redirect-mode: present in projectSlugs but NOT in
    // hostedLiveSlugList — this is binding decision D (PRD §4.4/§9) proven
    // by construction: the function has no way to add /juno/live because it
    // never reads liveUrl at all, only the hosted-slug array.
    const urls = buildSitemapUrls(STATIC_ROUTES, ['juno'], [], []);
    expect(urls).not.toContain('/projects/juno/live');
  });

  it('returns just the static routes, unmodified, when every collection/hosted array is empty', () => {
    const urls = buildSitemapUrls(STATIC_ROUTES, [], [], []);
    expect(urls).toEqual(STATIC_ROUTES);
  });

  it('composes multiple hosted /live slugs independently of project/research slug order', () => {
    const urls = buildSitemapUrls(STATIC_ROUTES, ['a', 'b'], [], ['a', 'b']);
    expect(urls).toContain('/projects/a/live');
    expect(urls).toContain('/projects/b/live');
    expect(urls).not.toContain('/research/a/live');
  });
});
