// tsconfig.app.json (which covers all of src/, including this file) scopes
// "types" to just ["vite/client"] — a deliberate browser-only default for
// application code — so @types/node's ambient 'node:*' module declarations
// aren't pulled in automatically here. This file's "duplicate slug guard"
// block below needs real node:fs/node:path/node:child_process (to spawn a
// real nested vitest process against real fixture files — see that
// block's own comment for why). Pull in just @types/node's declarations
// for this one file, the same targeted-reference technique vite.config.ts
// already uses for vite-react-ssg's types.
/// <reference types="node" />
import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { projects } from './projects';

describe('migrated project links', () => {
  it('keeps the Juno Website link on HTTPS, marked primary with a globe icon', () => {
    const juno = projects.find((project) => project.slug === 'juno');
    expect(juno?.links).toContainEqual({
      label: 'Website', href: 'https://meetjuno.health/', icon: 'globe', primary: true,
    });
  });
});

// Coverage-audit gap F: projects.ts's module-scope duplicate-slug guard
// (lines ~73-79) was never exercised. It can't be reached through two
// genuinely well-formed real files, by construction — assertSlugMatchesFilename
// (called first, for every file) already forces each file's own frontmatter
// slug to equal its own filename, and a flat directory can't hold two files
// with the same filename, so two real files' slugs can never collide (the
// guard's own comment says exactly this). Reaching the guard therefore
// requires bypassing that filename check with a mock — and reliably picking
// up newly-written fixture files requires a genuinely fresh Vite transform,
// which THIS process no longer has (this same file's static `import {
// projects } from './projects'` above, and every other already-run test
// file that touches `@/data`, warms Vite's import.meta.glob transform
// cache for the whole `vitest run` process; `vi.resetModules()` clears
// Vitest's module registry but not that transform cache, so a same-process
// dynamic re-import silently returns the stale, pre-fixture file list —
// confirmed empirically while developing this test). A genuinely separate
// OS process has no such stale cache, so this spawns one: `npx vitest
// run`'s bundled binary against a throwaway helper test file that mocks
// `./shared`'s assertSlugMatchesFilename to a passthrough and imports
// `./projects` — written to disk, run, and deleted within this one test,
// exactly like scripts/check-no-forms.test.ts's real-directory fixture
// pattern, so it's never present for the outer suite's own file discovery.
describe('duplicate slug guard', () => {
  const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
  const VITEST_BIN = path.join(REPO_ROOT, 'node_modules/.bin/vitest');
  const CONTENT_DIR = path.resolve(import.meta.dirname, '../content/projects');
  const fixtureA = path.join(CONTENT_DIR, '__dup-slug-fixture-a__.md');
  const fixtureB = path.join(CONTENT_DIR, '__dup-slug-fixture-b__.md');
  // Distinct filename from research.test.ts's identical block — Vitest runs
  // different test files in parallel workers, so a shared filename here
  // risks both suites writing/deleting the same path concurrently.
  const helperFile = path.join(import.meta.dirname, '__dup-slug-nested-check-projects__.test.ts');

  function makeFixture(slug: string) {
    return `---\nslug: ${slug}\ntitle: Dup\ndescription: d\nimage: /x.png\ntags: [Others]\nlinks: []\ndate: "2024-01-01"\n---\nbody\n`;
  }

  afterEach(() => {
    for (const f of [fixtureA, fixtureB, helperFile]) {
      if (existsSync(f)) rmSync(f);
    }
  });

  it(
    'throws "Duplicate slug" when two files share a slug (via a fresh nested process)',
    () => {
      const slug = 'dup-slug-fixture';
      mkdirSync(CONTENT_DIR, { recursive: true });
      writeFileSync(fixtureA, makeFixture(slug));
      writeFileSync(fixtureB, makeFixture(slug));
      writeFileSync(
        helperFile,
        [
          "import { describe, it, expect, vi } from 'vitest';",
          '',
          "vi.mock('./shared', async (importOriginal) => {",
          "  const actual = await importOriginal<typeof import('./shared')>();",
          '  return {',
          '    ...actual,',
          '    assertSlugMatchesFilename: (_path: string, _filenameSlug: string, data: Record<string, unknown>) => data.slug as string,',
          '  };',
          '});',
          '',
          "describe('nested duplicate-slug check', () => {",
          `  it('rejects on import with the real Duplicate slug message', async () => {`,
          `    await expect(import('./projects')).rejects.toThrow(/Duplicate slug "${slug}"/);`,
          '  });',
          '});',
          '',
        ].join('\n'),
      );

      let result: { status: number; output: string };
      try {
        const output = execFileSync(VITEST_BIN, ['run', helperFile], {
          cwd: REPO_ROOT,
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        result = { status: 0, output };
      } catch (err) {
        const e = err as { status: number | null; stdout?: string; stderr?: string };
        result = { status: e.status ?? 1, output: `${e.stdout ?? ''}${e.stderr ?? ''}` };
      }

      // The nested test file's own assertion is what actually proves the
      // guard fired with the right message; a passing (exit 0) nested run
      // is what proves that assertion held.
      expect(result.output).toContain('1 passed');
      expect(result.status).toBe(0);
    },
    30_000, // generous: a full nested `vitest run` process, not a plain assertion
  );
});
