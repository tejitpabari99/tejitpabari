// See projects.test.ts's identical reference comment: tsconfig.app.json
// scopes "types" to just ["vite/client"], so @types/node's ambient
// 'node:*' declarations need pulling in explicitly for this file's
// "duplicate slug guard" block below.
/// <reference types="node" />
import { describe, expect, it, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseResearch, research } from './research';

const bodylessResearch = `---
slug: example
title: Example Research
description: A concise research abstract.
image: /x.png
tags: [Other]
status: Completed
links: []
date: "2024-01-01"
---
`;

describe('parseResearch', () => {
  it('loads a valid research entry when its markdown body is empty', () => {
    const result = parseResearch('/src/content/research/example.md', bodylessResearch);

    expect(result.description).toBe('A concise research abstract.');
    expect(result.body).toBe('');
  });

  // Coverage-audit gap D: parseResearch had only the one happy-path test
  // above — none of its malformed-fixture throw paths were exercised.
  // Ports src/data/shared.test.ts's parseProject malformed-fixture pattern
  // to research.
  it('throws naming the file and field on a missing required field', () => {
    const raw = `---\nslug: example\ntitle: Example Research\nimage: /x.png\ntags: [Other]\nlinks: []\ndate: "2024-01-01"\n---\n`;
    expect(() => parseResearch('/src/content/research/example.md', raw)).toThrow(/example\.md.*description/is);
  });

  it('throws on an invalid status enum value', () => {
    const raw = `---\nslug: example\ntitle: Example Research\ndescription: D\nimage: /x.png\ntags: [Other]\nstatus: Shipped\nlinks: []\ndate: "2024-01-01"\n---\n`;
    expect(() => parseResearch('/src/content/research/example.md', raw)).toThrow(/status/i);
  });

  it('throws on an unknown frontmatter key', () => {
    const raw = `---\nslug: example\ntitle: Example Research\ndescription: D\nimage: /x.png\ntags: [Other]\nlinks: []\ndate: "2024-01-01"\ndescrption: typo\n---\n`;
    expect(() => parseResearch('/src/content/research/example.md', raw)).toThrow(/descrption/);
  });

  it('throws on a slug/filename mismatch', () => {
    const raw = `---\nslug: different\ntitle: Example Research\ndescription: D\nimage: /x.png\ntags: [Other]\nlinks: []\ndate: "2024-01-01"\n---\n`;
    expect(() => parseResearch('/src/content/research/example.md', raw)).toThrow(/does not match filename/);
  });

  // Round 3 (r3-01-schema-icons-content): techTags, links[].icon, and
  // links[].primary are shared validation (src/data/shared.ts) exercised
  // in depth against parseProject in src/data/shared.test.ts — these are a
  // lighter symmetry check that parseResearch wires the same helpers up
  // the same way.
  it('defaults techTags to [] when absent, and captures it verbatim when present', () => {
    const withoutTechTags = `---\nslug: example\ntitle: Example Research\ndescription: D\nimage: /x.png\ntags: [Other]\nlinks: []\ndate: "2024-01-01"\n---\n`;
    expect(parseResearch('/src/content/research/example.md', withoutTechTags).techTags).toEqual([]);

    const withTechTags = `---\nslug: example\ntitle: Example Research\ndescription: D\nimage: /x.png\ntags: [Other]\ntechTags: [Python, BERT]\nlinks: []\ndate: "2024-01-01"\n---\n`;
    expect(parseResearch('/src/content/research/example.md', withTechTags).techTags).toEqual(['Python', 'BERT']);
  });

  it('throws, naming the file, for an unrecognized links[].icon name', () => {
    const raw = `---\nslug: example\ntitle: Example Research\ndescription: D\nimage: /x.png\ntags: [Other]\nlinks: [{label: "Paper", href: "https://x.com", icon: "not-a-real-icon"}]\ndate: "2024-01-01"\n---\n`;
    expect(() => parseResearch('/src/content/research/example.md', raw)).toThrow(/example\.md.*is not a recognized icon name/is);
  });

  it('throws when more than one links[] entry is marked primary', () => {
    const raw = `---\nslug: example\ntitle: Example Research\ndescription: D\nimage: /x.png\ntags: [Other]\nlinks: [{label: "A", href: "https://a.com", primary: true}, {label: "B", href: "https://b.com", primary: true}]\ndate: "2024-01-01"\n---\n`;
    expect(() => parseResearch('/src/content/research/example.md', raw)).toThrow(/example\.md.*more than one link has "primary: true"/is);
  });

  // Round 3.1 (/live subsystem restoration): full assertOptionalLive
  // coverage lives in src/data/shared.live.test.ts — this is a lighter
  // symmetry check that parseResearch wires "live" through the same as
  // parseProject does (src/data/shared.test.ts's own "live" describe
  // block).
  it('wires "live" through, recognizing it as an allowed field and defaulting label/icon', () => {
    const raw = `---\nslug: example\ntitle: Example Research\ndescription: D\nimage: /x.png\ntags: [Other]\nlinks: []\ndate: "2024-01-01"\nlive:\n  type: external\n  href: https://example.com\n---\n`;
    const result = parseResearch('/src/content/research/example.md', raw);
    expect(result.live).toEqual({ type: 'external', href: 'https://example.com', label: 'Live', icon: 'globe' });
  });
});

describe('migrated research corpus', () => {
  it('keeps the abstract in description without duplicating it in body', () => {
    expect(research).toHaveLength(5);
    for (const entry of research) {
      expect(entry.description.trim()).not.toBe('');
      expect(entry.body).toBe('');
    }
  });
});

// Coverage-audit gap F: research.ts's module-scope duplicate-slug guard
// (lines ~59-65) was never exercised. See src/data/projects.test.ts's
// identical "duplicate slug guard" describe block for the full rationale
// (why a real fixture pair can never collide without bypassing
// assertSlugMatchesFilename, and why that bypass must run in a genuinely
// fresh OS process rather than a same-process dynamic re-import).
describe('duplicate slug guard', () => {
  const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
  const VITEST_BIN = path.join(REPO_ROOT, 'node_modules/.bin/vitest');
  const CONTENT_DIR = path.resolve(import.meta.dirname, '../content/research');
  const fixtureA = path.join(CONTENT_DIR, '__dup-slug-fixture-a__.md');
  const fixtureB = path.join(CONTENT_DIR, '__dup-slug-fixture-b__.md');
  // Distinct filename from projects.test.ts's identical block — Vitest runs
  // different test files in parallel workers, so a shared filename here
  // risks both suites writing/deleting the same path concurrently.
  const helperFile = path.join(import.meta.dirname, '__dup-slug-nested-check-research__.test.ts');

  function makeFixture(slug: string) {
    return `---\nslug: ${slug}\ntitle: Dup\ndescription: d\nimage: /x.png\ntags: [Other]\nlinks: []\ndate: "2024-01-01"\n---\nbody\n`;
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
          `    await expect(import('./research')).rejects.toThrow(/Duplicate slug "${slug}"/);`,
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

      expect(result.output).toContain('1 passed');
      expect(result.status).toBe(0);
    },
    30_000,
  );
});
