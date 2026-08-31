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
import { afterEach, describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildSitemapUrls, hostedLiveSlugs, escapeXml, STATIC_ROUTES } from './generate-sitemap.mjs';

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

describe('hostedLiveSlugs', () => {
  // Regression coverage for the LIVE defect a code review caught after
  // sp06-b3 merged: `sample-project.test.tsx` (SP06 Task 18's unit test
  // for `SampleProjectLive`) lives right next to `sample-project.tsx` in
  // src/pages/live/, and the ORIGINAL implementation derived hosted slugs
  // from `readdirSync(liveDir).filter(f => f.endsWith('.tsx'))` — a filter
  // that matches `.test.tsx` files too, since they end in `.tsx`. That
  // shipped a `/projects/sample-project.test/live` entry to sitemap.xml:
  // a URL with no route, no prerendered page, and no registry entry,
  // published straight to search engines. The fix reads the slug list out
  // of registry.ts's HOSTED_LIVE_PAGES object text instead of scanning the
  // directory at all, so a sibling `*.test.tsx` file can never contribute
  // a slug regardless of its name.
  let fixtureDir: string;

  afterEach(() => {
    if (fixtureDir) {
      rmSync(fixtureDir, { recursive: true, force: true });
    }
  });

  function makeFixtureDir(): string {
    return mkdtempSync(path.join(tmpdir(), 'hosted-live-slugs-'));
  }

  it('emits only the real hosted slug from registry.ts, ignoring a sibling *.test.tsx file entirely', () => {
    fixtureDir = makeFixtureDir();
    writeFileSync(
      path.join(fixtureDir, 'registry.ts'),
      [
        "import type { ComponentType } from 'react';",
        "import RealProjectLive from './real-project';",
        '',
        'export const HOSTED_LIVE_PAGES: Record<string, ComponentType> = {',
        "  'real-project': RealProjectLive,",
        '};',
        '',
      ].join('\n'),
    );
    writeFileSync(path.join(fixtureDir, 'real-project.tsx'), 'export default function RealProjectLive() { return null; }\n');
    // The exact shape of the live defect: a same-directory test file that
    // ends in `.tsx` and would have matched the old readdirSync-based
    // filter, but is NOT listed in HOSTED_LIVE_PAGES.
    writeFileSync(path.join(fixtureDir, 'real-project.test.tsx'), "import { it } from 'vitest';\nit.skip('placeholder', () => {});\n");

    const slugs = hostedLiveSlugs(fixtureDir);

    expect(slugs).toEqual(['real-project']);
    expect(slugs).not.toContain('real-project.test');
  });

  it('throws, naming the missing file, when registry.ts lists a slug with no matching component file', () => {
    fixtureDir = makeFixtureDir();
    writeFileSync(
      path.join(fixtureDir, 'registry.ts'),
      [
        "import type { ComponentType } from 'react';",
        '',
        'export const HOSTED_LIVE_PAGES: Record<string, ComponentType> = {',
        "  'ghost-project': GhostProjectLive,",
        '};',
        '',
      ].join('\n'),
    );

    expect(() => hostedLiveSlugs(fixtureDir)).toThrow(/ghost-project/);
  });

  it('throws when registry.ts has no HOSTED_LIVE_PAGES object to parse', () => {
    fixtureDir = makeFixtureDir();
    writeFileSync(path.join(fixtureDir, 'registry.ts'), "export const NOTHING_HERE = 42;\n");

    expect(() => hostedLiveSlugs(fixtureDir)).toThrow(/HOSTED_LIVE_PAGES/);
  });

  // Regression coverage for the launch-blocking defect a pre-production
  // adversarial review reproduced: after the owner deletes the sample
  // project's HOSTED_LIVE_PAGES entry (leaving an empty object) and runs
  // this repo's own `npm run format`, Prettier (semi: false in this repo's
  // .prettierrc) collapses `{\n}` to `{}` with no trailing semicolon. The
  // original regex required a literal `\n};`, so it threw
  // "could not find ... in registry.ts" out of `prebuild`, failing
  // `npm run build`/CI before typecheck even ran. These three cases cover
  // every Prettier-legal empty-object shape plus a still-populated registry,
  // to prove the fix didn't just special-case one exact string.
  it('returns an empty array for an empty registry collapsed to `{}` on one line (Prettier\'s post-format shape)', () => {
    fixtureDir = makeFixtureDir();
    writeFileSync(
      path.join(fixtureDir, 'registry.ts'),
      [
        "import type { ComponentType } from 'react';",
        '',
        'export const HOSTED_LIVE_PAGES: Record<string, ComponentType> = {};',
        '',
      ].join('\n'),
    );

    expect(hostedLiveSlugs(fixtureDir)).toEqual([]);
  });

  it('returns an empty array for an empty registry written across two lines (`{\\n}`, pre-format shape)', () => {
    fixtureDir = makeFixtureDir();
    writeFileSync(
      path.join(fixtureDir, 'registry.ts'),
      [
        "import type { ComponentType } from 'react';",
        '',
        'export const HOSTED_LIVE_PAGES: Record<string, ComponentType> = {',
        '};',
        '',
      ].join('\n'),
    );

    expect(hostedLiveSlugs(fixtureDir)).toEqual([]);
  });

  it('still resolves every slug correctly for a populated, semicolon-terminated, multi-line registry', () => {
    fixtureDir = makeFixtureDir();
    writeFileSync(
      path.join(fixtureDir, 'registry.ts'),
      [
        "import type { ComponentType } from 'react';",
        "import RealProjectLive from './real-project';",
        "import AnotherProjectLive from './another-project';",
        '',
        'export const HOSTED_LIVE_PAGES: Record<string, ComponentType> = {',
        "  'real-project': RealProjectLive,",
        "  'another-project': AnotherProjectLive,",
        '};',
        '',
      ].join('\n'),
    );
    writeFileSync(path.join(fixtureDir, 'real-project.tsx'), 'export default function RealProjectLive() { return null; }\n');
    writeFileSync(path.join(fixtureDir, 'another-project.tsx'), 'export default function AnotherProjectLive() { return null; }\n');

    expect(hostedLiveSlugs(fixtureDir)).toEqual(['real-project', 'another-project']);
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
