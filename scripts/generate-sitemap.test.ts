// scripts/generate-sitemap.test.ts
//
// Task 17 (06-sharing-seo-sample-project TASKS.md) — per PRD §7's sixth
// bullet. Uses `generate-sitemap.mjs`'s exported `buildSitemapUrls`/
// `STATIC_ROUTES` directly with fixture slug arrays — no real filesystem
// scan needed to prove the URL-composition and exclusion logic, since
// `buildSitemapUrls` is a pure function that takes plain arrays and does
// no I/O of its own.
//
// Round 3.1 restoration of the /live subsystem (see
// .dev/website-revamp-r3/CONTENT-AUTHORING.md's "The `live` field"
// section): the pre-round-3 `hostedLiveSlugs` (which parsed
// src/pages/live/registry.ts's HOSTED_LIVE_PAGES for slugs directly) is
// now `hostedPageNames` (same text-parse approach, but "page" is no
// longer the same thing as "slug" — a page name is a registry key,
// looked up per-entry via that entry's own `live.page`), plus a new
// `selfHostedLiveUrls` that scans a content collection directory for
// `live: { type: self, page }` entries and cross-checks each against the
// registry's page names.
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
import { buildSitemapUrls, hostedPageNames, selfHostedLiveUrls, escapeXml, STATIC_ROUTES } from './generate-sitemap.mjs';

describe('buildSitemapUrls', () => {
  it('includes every static route, project slug, research slug, and hosted /live URL', () => {
    const urls = buildSitemapUrls(STATIC_ROUTES, ['juno', 'sample-project'], ['flood-nlp'], ['/projects/sample-project/live']);
    expect(urls).toHaveLength(STATIC_ROUTES.length + 2 + 1 + 1);
    expect(urls).toContain('/projects/juno');
    expect(urls).toContain('/projects/sample-project');
    expect(urls).toContain('/research/flood-nlp');
    expect(urls).toContain('/projects/sample-project/live');
  });

  it('never includes a /live entry for a project slug not passed in hostedLiveUrls (redirect/no-live mode)', () => {
    // 'juno' is redirect (or no-live-field) mode here: present in
    // projectSlugs but its /live URL is NOT in hostedLiveUrls — proven by
    // construction, since buildSitemapUrls only ever emits exactly the
    // URLs it's handed in that fourth argument.
    const urls = buildSitemapUrls(STATIC_ROUTES, ['juno'], [], []);
    expect(urls).not.toContain('/projects/juno/live');
  });

  it('returns just the static routes, unmodified, when every collection/hosted array is empty', () => {
    const urls = buildSitemapUrls(STATIC_ROUTES, [], [], []);
    expect(urls).toEqual(STATIC_ROUTES);
  });

  it('defaults hostedLiveUrls to [] when omitted entirely', () => {
    const urls = buildSitemapUrls(STATIC_ROUTES, ['a'], ['b']);
    expect(urls).toEqual([...STATIC_ROUTES, '/projects/a', '/research/b']);
  });

  it('composes multiple hosted /live URLs independently of project/research slug order', () => {
    const urls = buildSitemapUrls(STATIC_ROUTES, ['a', 'b'], [], ['/projects/a/live', '/projects/b/live']);
    expect(urls).toContain('/projects/a/live');
    expect(urls).toContain('/projects/b/live');
    expect(urls).not.toContain('/research/a/live');
  });
});

describe('hostedPageNames', () => {
  // Regression coverage carried over from the pre-round-3 hostedLiveSlugs:
  // a code review caught that `sample-project.test.tsx` living right next
  // to `sample-project.tsx` in src/pages/live/ could be picked up by a
  // naive `readdirSync(liveDir).filter(f => f.endsWith('.tsx'))` scan — a
  // filter that matches `.test.tsx` files too. The fix reads the page-name
  // list out of registry.ts's HOSTED_LIVE_PAGES object text instead of
  // scanning the directory at all, so a sibling `*.test.tsx` file can
  // never contribute a name regardless of what it's called.
  let fixtureDir: string;

  afterEach(() => {
    if (fixtureDir) {
      rmSync(fixtureDir, { recursive: true, force: true });
    }
  });

  function makeFixtureDir(): string {
    return mkdtempSync(path.join(tmpdir(), 'hosted-page-names-'));
  }

  it('emits only the real registered page name from registry.ts, ignoring a sibling *.test.tsx file entirely', () => {
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
    writeFileSync(path.join(fixtureDir, 'real-project.test.tsx'), "import { it } from 'vitest';\nit.skip('placeholder', () => {});\n");

    const names = hostedPageNames(fixtureDir);

    expect(names).toEqual(['real-project']);
    expect(names).not.toContain('real-project.test');
  });

  it('ignores the commented-out documentation example line registry.ts ships with', () => {
    fixtureDir = makeFixtureDir();
    writeFileSync(
      path.join(fixtureDir, 'registry.ts'),
      [
        "import type { ComponentType } from 'react';",
        '',
        'export const HOSTED_LIVE_PAGES: Record<string, ComponentType> = {',
        "  // 'crunchy-filler': CrunchyFillerLivePage,",
        '};',
        '',
      ].join('\n'),
    );

    expect(hostedPageNames(fixtureDir)).toEqual([]);
  });

  it('throws, naming the missing file, when registry.ts lists a page name with no matching component file', () => {
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

    expect(() => hostedPageNames(fixtureDir)).toThrow(/ghost-project/);
  });

  it('throws when registry.ts has no HOSTED_LIVE_PAGES object to parse', () => {
    fixtureDir = makeFixtureDir();
    writeFileSync(path.join(fixtureDir, 'registry.ts'), 'export const NOTHING_HERE = 42;\n');

    expect(() => hostedPageNames(fixtureDir)).toThrow(/HOSTED_LIVE_PAGES/);
  });

  // Same Prettier-collapse regression the pre-round-3 version guarded
  // against (empty object collapsed to `{}` with no trailing semicolon by
  // this repo's `npm run format`, semi: false).
  it('returns an empty array for an empty registry collapsed to `{}` on one line', () => {
    fixtureDir = makeFixtureDir();
    writeFileSync(
      path.join(fixtureDir, 'registry.ts'),
      ["import type { ComponentType } from 'react';", '', 'export const HOSTED_LIVE_PAGES: Record<string, ComponentType> = {};', ''].join('\n'),
    );

    expect(hostedPageNames(fixtureDir)).toEqual([]);
  });

  it('still resolves every name correctly for a populated, semicolon-terminated, multi-line registry', () => {
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

    expect(hostedPageNames(fixtureDir)).toEqual(['real-project', 'another-project']);
  });
});

describe('selfHostedLiveUrls', () => {
  let fixtureDir: string;

  afterEach(() => {
    if (fixtureDir) {
      rmSync(fixtureDir, { recursive: true, force: true });
    }
  });

  function makeFixtureDir(): string {
    return mkdtempSync(path.join(tmpdir(), 'self-hosted-live-urls-'));
  }

  function writeMd(dir: string, filename: string, frontmatter: string): void {
    writeFileSync(path.join(dir, filename), `---\n${frontmatter}\n---\nBody.\n`);
  }

  it('includes exactly the /live URL for a type: self entry, excluding type: external and no-live-field entries', () => {
    fixtureDir = makeFixtureDir();
    writeMd(fixtureDir, 'hosted.md', 'slug: hosted\nlive:\n  type: self\n  page: real-project');
    writeMd(fixtureDir, 'external.md', 'slug: external\nlive:\n  type: external\n  href: https://example.com');
    writeMd(fixtureDir, 'plain.md', 'slug: plain');

    const urls = selfHostedLiveUrls(fixtureDir, 'projects', ['real-project']);

    expect(urls).toEqual(['/projects/hosted/live']);
  });

  it('uses the given routePrefix ("research") to build the URL', () => {
    fixtureDir = makeFixtureDir();
    writeMd(fixtureDir, 'hosted.md', 'slug: hosted\nlive:\n  type: self\n  page: real-project');

    expect(selfHostedLiveUrls(fixtureDir, 'research', ['real-project'])).toEqual(['/research/hosted/live']);
  });

  it('returns an empty array when no file declares live: { type: self, ... }', () => {
    fixtureDir = makeFixtureDir();
    writeMd(fixtureDir, 'external.md', 'slug: external\nlive:\n  type: external\n  href: https://example.com');
    writeMd(fixtureDir, 'plain.md', 'slug: plain');

    expect(selfHostedLiveUrls(fixtureDir, 'projects', [])).toEqual([]);
  });

  it('throws, naming the file and the bad page value, when a type: self entry\'s "page" is not in hostedNames', () => {
    fixtureDir = makeFixtureDir();
    writeMd(fixtureDir, 'hosted.md', 'slug: hosted\nlive:\n  type: self\n  page: not-registered');

    expect(() => selfHostedLiveUrls(fixtureDir, 'projects', ['real-project'])).toThrow(/hosted\.md.*not-registered/s);
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
