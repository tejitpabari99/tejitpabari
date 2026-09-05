// scripts/check-no-em-dash.test.ts
import { describe, expect, it } from 'vitest';
import { findMatches, scanTsxSource, scanSiteConfigSource } from './check-no-em-dash.mjs';

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
