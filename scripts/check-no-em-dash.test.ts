// scripts/check-no-em-dash.test.ts
import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { findMatches, scanTsxSource, scanSiteConfigSource, scanBuiltOutput } from './check-no-em-dash.mjs';

describe('findMatches', () => {
  it('returns all three pattern names for a string containing all three forms', () => {
    const text = 'a — b &mdash; c &#8212; d';
    expect(findMatches(text)).toEqual(['em dash (—)', '&mdash; entity', '&#8212; entity']);
  });

  it('returns [] for a clean string', () => {
    expect(findMatches('nothing to see here')).toEqual([]);
  });

  it('returns [] for a string containing only an en dash (out of scope, PRD §4.1)', () => {
    expect(findMatches('the 2–3 line blurb')).toEqual([]);
  });
});

describe('scanTsxSource', () => {
  it('flags a JsxText node containing &mdash; between two tags', () => {
    const source = `
      export function X() {
        return <div>before &mdash; after</div>;
      }
    `;
    const found = scanTsxSource('X.tsx', source);
    expect(found.some((f) => f.text.includes('&mdash;'))).toBe(true);
  });

  it('flags a description="..." attribute string literal containing a literal em dash', () => {
    const source = `
      export function X() {
        return <RouteMeta description="A page — with a dash" path="/x" />;
      }
    `;
    const found = scanTsxSource('X.tsx', source);
    expect(found.some((f) => f.text.includes('—'))).toBe(true);
  });

  it('flags a title={"..."} JSX-expression string containing &#8212;', () => {
    const source = `
      export function X() {
        return <img title={"A &#8212; B"} />;
      }
    `;
    const found = scanTsxSource('X.tsx', source);
    expect(found.some((f) => f.text.includes('&#8212;'))).toBe(true);
  });

  it('does not flag a className="a—b" attribute (not on COPY_ATTRS)', () => {
    const source = `
      export function X() {
        return <div className="a—b" />;
      }
    `;
    expect(scanTsxSource('X.tsx', source)).toEqual([]);
  });

  it('does not flag a // comment — with a dash anywhere in the fixture source', () => {
    const source = `
      // a comment — with a dash, never walked: comments are lexer trivia
      export function X() {
        return <div>clean</div>;
      }
    `;
    expect(scanTsxSource('X.tsx', source)).toEqual([]);
  });
});

describe('scanSiteConfigSource', () => {
  it('flags DEFAULT_DESCRIPTION when it contains a dash', () => {
    const source = `export const DEFAULT_DESCRIPTION = 'a — b';`;
    const found = scanSiteConfigSource('site.ts', source);
    expect(found).toHaveLength(1);
  });

  it('does not flag some other unrelated exported constant in the same fixture file, even if it also contains a dash', () => {
    const source = `
      export const DEFAULT_DESCRIPTION = 'clean, no dash here';
      export const OTHER_CONSTANT = 'a — b';
    `;
    expect(scanSiteConfigSource('site.ts', source)).toEqual([]);
  });
});

describe('scanBuiltOutput (dist-<site>)', () => {
  const dirs: string[] = [];
  afterEach(() => {
    while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
  });
  function root(files: Record<string, string>) {
    const r = mkdtempSync(path.join(tmpdir(), 'em-dash-dist-'));
    dirs.push(r);
    for (const [rel, content] of Object.entries(files)) {
      mkdirSync(path.dirname(path.join(r, rel)), { recursive: true });
      writeFileSync(path.join(r, rel), content);
    }
    return r;
  }

  it('passes on clean dist-<site> output', () => {
    const r = root({ 'dist-healthtech/index.html': '<p>clean – en dash ok</p>', 'dist-nonprofit/a/index.html': '<p>fine</p>' });
    expect(scanBuiltOutput(r)).toEqual([]);
  });

  it.each([['healthtech'], ['nonprofit']])('catches a violation planted in dist-%s', (site) => {
    const r = root({ [`dist-${site}/projects/x/index.html`]: `<html><p>before ${'a'.repeat(200)} \u2014 after</p></html>` });
    const found = scanBuiltOutput(r);
    expect(found).toHaveLength(1);
    expect(found[0].file).toBe(`dist-${site}/projects/x/index.html:1`);
    expect(found[0].kinds).toEqual(['em dash (\u2014)']);
    expect(found[0].snippet).toContain('after');
  });

  it('catches entity forms too', () => {
    const r = root({ 'dist-nonprofit/index.html': '<p>a &mdash; b &#8212; c</p>' });
    expect(scanBuiltOutput(r)[0].kinds).toEqual(['&mdash; entity', '&#8212; entity']);
  });

  it('ignores dist-admin and non-dist dirs', () => {
    const r = root({ 'dist-admin/index.html': '<p>a \u2014 b</p>', 'other/index.html': '<p>a \u2014 b</p>' });
    expect(scanBuiltOutput(r)).toEqual([]);
  });

  it('is a no-op when no dist-* exists', () => {
    expect(scanBuiltOutput(root({}))).toEqual([]);
  });
});
