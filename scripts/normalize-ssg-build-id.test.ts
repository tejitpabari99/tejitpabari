// scripts/normalize-ssg-build-id.test.ts
//
// Regression test for scripts/normalize-ssg-build-id.mjs (see that file's
// header for the full investigation: `firebase.json` — specifically the
// Content-Security-Policy `script-src` allow-list scripts/inject-csp-hashes.mjs
// writes — used to change on every single `npm run build` of an otherwise
// unchanged tree, purely because vite-react-ssg reseeds a `Math.random()`
// id on every build and threads it through every prerendered page's
// hydration bootstrap script). Exercises the module's exported pure
// functions directly — no real `vite-react-ssg build`, no filesystem I/O
// against a real dist/ — proving the DETERMINISM PROPERTY itself (same
// input bytes -> same id; a changed manifest -> a different id; a
// nondeterministically-ordered route map -> the same sorted output
// regardless of input order) rather than re-running the (slow, already
// manually verified — see the task's own two-clean-builds check) full
// build pipeline twice.
//
// This file intentionally lives under `scripts/`, not `src/`, and — like
// scripts/generate-sitemap.test.ts and scripts/generate-og-cards.test.ts
// before it — is excluded from vitest's default test discovery via
// `test.exclude` in vite.config.ts (`scripts/**`), so `npm test` (`vitest
// run` with no path argument) does not pick it up and its suite/test
// counts stay unaffected. Because Vitest applies `exclude` before a CLI
// path argument filters anything, run this file with the same lever
// `check:launch` uses to lift the `scripts/**` exclusion for one
// invocation: `CHECK_LAUNCH=1 npx vitest run scripts/normalize-ssg-build-id.test.ts`.
import { describe, it, expect } from 'vitest';
import { computeDeterministicBuildId, rewriteLoaderDataManifest } from './normalize-ssg-build-id.mjs';

describe('computeDeterministicBuildId', () => {
  it('is a pure function of its input bytes: identical bytes -> identical id, across repeated calls', () => {
    const manifestBytes = Buffer.from(
      '{"index.html":{"file":"assets/index-a1b2c3d4.js","isEntry":true},"index.css":{"file":"assets/index-e5f6.css"}}',
    );
    const first = computeDeterministicBuildId(manifestBytes);
    const second = computeDeterministicBuildId(Buffer.from(manifestBytes)); // fresh Buffer, same bytes — proves it's not identity/reference-based
    expect(first).toBe(second);
  });

  it('is exactly what motivated this fix: two DIFFERENT random-looking inputs (standing in for two builds that only ' +
    "differ by vite-react-ssg's Math.random() seed) must not be allowed to leak through — only real content bytes " +
    'do, and those are identical here, so the id must match', () => {
    // Same manifest content, constructed two different ways (string vs.
    // Buffer.from(Buffer.from(...))) to rule out any accidental dependence
    // on object identity, encoding object reuse, etc. — only the bytes matter.
    const content = '{"index.html":{"file":"assets/index-deadbeef.js"}}';
    const a = computeDeterministicBuildId(Buffer.from(content, 'utf-8'));
    const b = computeDeterministicBuildId(Buffer.from(Buffer.from(content, 'utf-8')));
    expect(a).toBe(b);
  });

  it('changes when the underlying build content changes (real content edits must still bust caches)', () => {
    const before = computeDeterministicBuildId(Buffer.from('{"a":"assets/index-111.js"}'));
    const after = computeDeterministicBuildId(Buffer.from('{"a":"assets/index-222.js"}'));
    expect(before).not.toBe(after);
  });

  it('returns a fixed-length lowercase hex string suitable for a filename/URL segment', () => {
    const id = computeDeterministicBuildId(Buffer.from('{"a":"b"}'));
    expect(id).toMatch(/^[0-9a-f]{10}$/);
  });
});

describe('rewriteLoaderDataManifest', () => {
  const oldId = 'randomOldId';
  const newId = 'deterministicNewId';

  it('sorts by route path regardless of input key order — the second, independent nondeterminism source ' +
    "(vite-react-ssg's concurrent rendering queue produces a different insertion order every build)", () => {
    const inOneOrder = {
      '/projects/juno': `static-loader-data/projects/juno.${oldId}.json`,
      '/': `static-loader-data/index.${oldId}.json`,
      '/research': `static-loader-data/research.${oldId}.json`,
    };
    const inAnotherOrder = {
      '/research': `static-loader-data/research.${oldId}.json`,
      '/': `static-loader-data/index.${oldId}.json`,
      '/projects/juno': `static-loader-data/projects/juno.${oldId}.json`,
    };
    const a = rewriteLoaderDataManifest(inOneOrder, oldId, newId);
    const b = rewriteLoaderDataManifest(inAnotherOrder, oldId, newId);
    // Object key order is significant to JSON.stringify — asserting on the
    // serialized string (not just deep-equality) is what actually proves
    // dist/static-loader-data-manifest-*.json comes out byte-identical
    // regardless of which order routes finished rendering in.
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(Object.keys(a)).toEqual(['/', '/projects/juno', '/research']);
  });

  it('rewrites every relative path to swap the old build id for the new one', () => {
    const result = rewriteLoaderDataManifest(
      { '/': `static-loader-data/index.${oldId}.json`, '/about': `static-loader-data/about.${oldId}.json` },
      oldId,
      newId,
    );
    expect(result).toEqual({
      '/': `static-loader-data/index.${newId}.json`,
      '/about': `static-loader-data/about.${newId}.json`,
    });
  });

  it('throws rather than silently ignoring an entry whose path does not carry the expected old-id suffix', () => {
    expect(() => rewriteLoaderDataManifest({ '/': 'static-loader-data/index.someOtherId.json' }, oldId, newId)).toThrow(
      /does not end with the expected/,
    );
  });
});
