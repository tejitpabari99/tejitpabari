// vite.config.test.ts
//
// Round 3.1 restoration of the /live subsystem (see
// .dev/website-revamp-r3/CONTENT-AUTHORING.md's "The `live` field"
// section). Exercises `readLiveRedirects` (vite.config.ts's exported
// build-time scanner) directly against a fixture temp directory of .md
// files, and separately exercises the exact `entries.map(...)` transform
// `liveRedirectsPlugin`'s `closeBundle` hook uses to build
// `hosting.redirects` — reimplemented inline here (not called through the
// real plugin) because `liveRedirectsPlugin` itself is deliberately NOT
// exported (keep vite.config.ts's own exports minimal; only
// `readLiveRedirects` is exported for testing). This test never invokes a
// real `npm run build` or writes to the real firebase.json — everything
// below is in-memory or a throwaway temp dir.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readLiveRedirects } from './vite.config';
import viteConfig from './vite.config';

function writeMdFile(dir: string, filename: string, frontmatter: string, body = 'Some body.'): void {
  writeFileSync(path.join(dir, filename), `---\n${frontmatter}\n---\n${body}\n`);
}

describe('readLiveRedirects', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'live-redirects-fixture-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('redirects a type: external entry to its href', () => {
    writeMdFile(dir, 'juno.md', 'slug: juno\ntitle: Juno\nlive:\n  type: external\n  href: https://app.meetjuno.health');

    expect(readLiveRedirects(dir, 'projects')).toEqual([
      { source: '/projects/juno/live', destination: 'https://app.meetjuno.health' },
    ]);
  });

  it('redirects an entry with no "live" field at all to its own detail page (the guaranteed-URL fallback)', () => {
    writeMdFile(dir, 'plain.md', 'slug: plain\ntitle: Plain');

    expect(readLiveRedirects(dir, 'projects')).toEqual([{ source: '/projects/plain/live', destination: '/projects/plain' }]);
  });

  it('excludes a type: self entry entirely — no redirect entry, it renders its own prerendered page', () => {
    writeMdFile(dir, 'hosted.md', 'slug: hosted\ntitle: Hosted\nlive:\n  type: self\n  page: hosted');

    expect(readLiveRedirects(dir, 'projects')).toEqual([]);
  });

  it('uses the given routePrefix ("research") to build both source and the no-live-field destination', () => {
    writeMdFile(dir, 'plain.md', 'slug: plain\ntitle: Plain');

    expect(readLiveRedirects(dir, 'research')).toEqual([{ source: '/research/plain/live', destination: '/research/plain' }]);
  });

  it('composes a mix of all three modes correctly across multiple files', () => {
    writeMdFile(dir, 'external.md', 'slug: external\nlive:\n  type: external\n  href: https://example.com');
    writeMdFile(dir, 'self.md', 'slug: self\nlive:\n  type: self\n  page: whatever');
    writeMdFile(dir, 'none.md', 'slug: none');

    const result = readLiveRedirects(dir, 'projects').sort((a, b) => a.source.localeCompare(b.source));

    expect(result).toEqual([
      { source: '/projects/external/live', destination: 'https://example.com' },
      { source: '/projects/none/live', destination: '/projects/none' },
    ]);
  });

  it('ignores non-.md files in the directory', () => {
    writeMdFile(dir, 'external.md', 'slug: external\nlive:\n  type: external\n  href: https://example.com');
    writeFileSync(path.join(dir, 'README.txt'), 'not a content file');

    expect(readLiveRedirects(dir, 'projects')).toEqual([{ source: '/projects/external/live', destination: 'https://example.com' }]);
  });

  // Security regression (verified finding, carried over from the
  // pre-round-3 readLiveUrls this replaces): closeBundle fires during
  // vite-react-ssg's client bundle step, BEFORE assertOptionalLive
  // (src/data/shared.ts) ever runs during SSR route rendering. Without its
  // own validation, readLiveRedirects would let an unvalidated href reach
  // firebase.json's hosting.redirects — e.g. a protocol-relative
  // "//evil.com/phish", which Firebase Hosting serves as an open redirect
  // off tejitpabari.com. readLiveRedirects must reject these itself,
  // loudly, before anything downstream writes them out.
  it('throws, naming the file and the offending value, for a protocol-relative href ("//evil.com/...")', () => {
    writeMdFile(dir, 'evil.md', 'slug: evil\nlive:\n  type: external\n  href: "//evil.com/phish"');

    expect(() => readLiveRedirects(dir, 'projects')).toThrow(/evil\.md.*live\.href.*evil\.com\/phish/s);
  });

  it('throws for a javascript: URL href', () => {
    writeMdFile(dir, 'xss.md', 'slug: xss\nlive:\n  type: external\n  href: "javascript:alert(1)"');

    expect(() => readLiveRedirects(dir, 'projects')).toThrow(/xss\.md.*live\.href.*javascript:alert\(1\)/s);
  });

  it('throws, naming the file, for an unrecognized "live.type"', () => {
    writeMdFile(dir, 'weird.md', 'slug: weird\nlive:\n  type: nope');

    expect(() => readLiveRedirects(dir, 'projects')).toThrow(/weird\.md.*live\.type/s);
  });

  it('throws, naming the file, when a file has no string "slug" in its frontmatter', () => {
    writeFileSync(path.join(dir, 'no-slug.md'), '---\ntitle: No Slug\n---\nBody.\n');

    expect(() => readLiveRedirects(dir, 'projects')).toThrow(/no-slug\.md.*slug/s);
  });
});

describe('the hosting.redirects transform used by liveRedirectsPlugin.closeBundle', () => {
  // Reimplements, verbatim, the transform from vite.config.ts's
  // closeBundle: `entries.map(({ source, destination }) => ({ source,
  // destination, type: 301 }))`.
  function applyRedirectsTransform(entries: { source: string; destination: string }[]) {
    return entries.map(({ source, destination }) => ({ source, destination, type: 301 }));
  }

  it('produces exactly the expected {source, destination, type: 301} entries', () => {
    const entries = [
      { source: '/projects/juno/live', destination: 'https://app.meetjuno.health' },
      { source: '/projects/plain/live', destination: '/projects/plain' },
    ];

    expect(applyRedirectsTransform(entries)).toEqual([
      { source: '/projects/juno/live', destination: 'https://app.meetjuno.health', type: 301 },
      { source: '/projects/plain/live', destination: '/projects/plain', type: 301 },
    ]);
  });

  it('leaves every other key on the fixture firebase.json object unchanged when hosting.redirects is assigned', () => {
    const fixtureConfig = {
      hosting: {
        public: 'dist',
        cleanUrls: true,
        trailingSlash: false,
        ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
        headers: [
          { source: '**/assets/**', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
        ],
      },
    };
    const before = JSON.parse(JSON.stringify(fixtureConfig));

    const entries = [{ source: '/projects/juno/live', destination: 'https://app.meetjuno.health' }];
    fixtureConfig.hosting = {
      ...fixtureConfig.hosting,
      redirects: applyRedirectsTransform(entries),
    } as typeof fixtureConfig.hosting & { redirects: ReturnType<typeof applyRedirectsTransform> };

    expect(fixtureConfig.hosting.public).toEqual(before.hosting.public);
    expect(fixtureConfig.hosting.cleanUrls).toEqual(before.hosting.cleanUrls);
    expect(fixtureConfig.hosting.trailingSlash).toEqual(before.hosting.trailingSlash);
    expect(fixtureConfig.hosting.ignore).toEqual(before.hosting.ignore);
    expect(fixtureConfig.hosting.headers).toEqual(before.hosting.headers);
    expect((fixtureConfig.hosting as { redirects: unknown }).redirects).toEqual([
      { source: '/projects/juno/live', destination: 'https://app.meetjuno.health', type: 301 },
    ]);
  });
});

describe('liveRedirectsPlugin build-only guard', () => {
  // Regression test: closeBundle's firebase.json write is a build-only side
  // effect. Without `apply: 'build'` on the plugin object, Vitest's own
  // config loading resolves the plugin pipeline and closeBundle fires on
  // every `npm test` / `npx vitest run`, silently rewriting the real,
  // committed firebase.json. Asserting `apply: 'build'` here is what keeps
  // that regression from coming back unnoticed.
  it('declares apply: "build" on the live-redirects plugin, so it never runs under Vitest or `vite dev`', () => {
    const plugins = (viteConfig.plugins ?? []).flat(Infinity) as { name?: string; apply?: unknown }[];
    const liveRedirects = plugins.find((p) => p?.name === 'live-redirects');

    expect(liveRedirects).toBeDefined();
    expect(liveRedirects?.apply).toBe('build');
  });
});
