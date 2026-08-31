// vite.config.test.ts
//
// Task 24 per .dev/website-revamp/04-projects-research-pages/TASKS.md.
// Exercises `readLiveUrls` (Task 13's export) directly against a fixture
// temp directory of .md files, and separately exercises the exact
// `entries.map(...)` transform `liveRedirectsPlugin`'s `closeBundle` hook
// uses to build `hosting.redirects` — reimplemented inline here (not
// called through the real plugin) because `liveRedirectsPlugin` itself is
// deliberately NOT exported (per PRD §4.6/§7: "keep vite.config.ts's own
// exports minimal"; only `readLiveUrls` is exported for testing). This
// test never invokes a real `npm run build` or writes to the real
// firebase.json — everything below is in-memory or a throwaway temp dir.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readLiveUrls } from './vite.config';

function writeMdFile(dir: string, filename: string, frontmatter: string, body = 'Some body.'): void {
  writeFileSync(path.join(dir, filename), `---\n${frontmatter}\n---\n${body}\n`);
}

describe('readLiveUrls', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'live-redirects-fixture-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns exactly the {slug, liveUrl} pairs for liveUrl-bearing files, excluding hosted-mode files with no liveUrl key', () => {
    writeMdFile(dir, 'juno.md', 'slug: juno\ntitle: Juno\nliveUrl: https://app.meetjuno.health');
    writeMdFile(dir, 'sample-project.md', 'slug: sample-project\ntitle: Sample Project'); // hosted mode — no liveUrl
    writeMdFile(dir, 'med-doc-tracker.md', 'slug: med-doc-tracker\ntitle: Med-Doc Tracker\nliveUrl: https://tejitpabari.short.gy/med-doc-tracker');

    const result = readLiveUrls(dir);

    expect(result.sort((a, b) => a.slug.localeCompare(b.slug))).toEqual([
      { slug: 'juno', liveUrl: 'https://app.meetjuno.health' },
      { slug: 'med-doc-tracker', liveUrl: 'https://tejitpabari.short.gy/med-doc-tracker' },
    ]);
  });

  it('returns an empty array when every file is hosted-mode (no liveUrl key anywhere)', () => {
    writeMdFile(dir, 'sample-project.md', 'slug: sample-project\ntitle: Sample Project');
    writeMdFile(dir, 'another.md', 'slug: another\ntitle: Another');

    expect(readLiveUrls(dir)).toEqual([]);
  });

  it('ignores non-.md files in the directory', () => {
    writeMdFile(dir, 'juno.md', 'slug: juno\nliveUrl: https://app.meetjuno.health');
    writeFileSync(path.join(dir, 'README.txt'), 'not a content file');

    expect(readLiveUrls(dir)).toEqual([{ slug: 'juno', liveUrl: 'https://app.meetjuno.health' }]);
  });

  it('excludes a file whose liveUrl frontmatter value is not a string', () => {
    // e.g. an accidental YAML boolean/number — the type guard in
    // readLiveUrls filters on `typeof data.liveUrl === 'string'`.
    writeMdFile(dir, 'weird.md', 'slug: weird\nliveUrl: true');

    expect(readLiveUrls(dir)).toEqual([]);
  });
});

describe('the hosting.redirects transform used by liveRedirectsPlugin.closeBundle', () => {
  // Reimplements, verbatim, the transform from vite.config.ts's
  // closeBundle: `config.hosting.redirects = entries.map(({ slug, liveUrl }) => ({
  // source: `/projects/${slug}/live`, destination: liveUrl, type: 302 }));`
  function applyRedirectsTransform(entries: { slug: string; liveUrl: string }[]) {
    return entries.map(({ slug, liveUrl }) => ({
      source: `/projects/${slug}/live`,
      destination: liveUrl,
      type: 302,
    }));
  }

  it('produces exactly the expected {source, destination, type: 302} entries', () => {
    const entries = [
      { slug: 'juno', liveUrl: 'https://app.meetjuno.health' },
      { slug: 'med-doc-tracker', liveUrl: 'https://tejitpabari.short.gy/med-doc-tracker' },
    ];

    expect(applyRedirectsTransform(entries)).toEqual([
      { source: '/projects/juno/live', destination: 'https://app.meetjuno.health', type: 302 },
      { source: '/projects/med-doc-tracker/live', destination: 'https://tejitpabari.short.gy/med-doc-tracker', type: 302 },
    ]);
  });

  it('leaves every other key on the fixture firebase.json object unchanged when hosting.redirects is assigned', () => {
    const fixtureConfig = {
      hosting: {
        public: 'dist',
        cleanUrls: true,
        trailingSlash: false,
        ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
        rewrites: [{ source: '**', destination: '/index.html' }],
        headers: [
          { source: '**/assets/**', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
        ],
      },
    };
    const before = JSON.parse(JSON.stringify(fixtureConfig));

    const entries = [{ slug: 'juno', liveUrl: 'https://app.meetjuno.health' }];
    fixtureConfig.hosting = {
      ...fixtureConfig.hosting,
      redirects: applyRedirectsTransform(entries),
    } as typeof fixtureConfig.hosting & { redirects: ReturnType<typeof applyRedirectsTransform> };

    expect(fixtureConfig.hosting.public).toEqual(before.hosting.public);
    expect(fixtureConfig.hosting.cleanUrls).toEqual(before.hosting.cleanUrls);
    expect(fixtureConfig.hosting.trailingSlash).toEqual(before.hosting.trailingSlash);
    expect(fixtureConfig.hosting.ignore).toEqual(before.hosting.ignore);
    expect(fixtureConfig.hosting.rewrites).toEqual(before.hosting.rewrites);
    expect(fixtureConfig.hosting.headers).toEqual(before.hosting.headers);
    expect((fixtureConfig.hosting as { redirects: unknown }).redirects).toEqual([
      { source: '/projects/juno/live', destination: 'https://app.meetjuno.health', type: 302 },
    ]);
  });
});
