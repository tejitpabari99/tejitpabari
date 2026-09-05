// src/lib/resolveLiveLinks.test.ts
//
// Round 3.3: the ONE shared, unit-tested resolution helper implementing
// the /live target-resolution rules (see the source file's own header
// comment for the full contract this exercises rule-by-rule):
//   1. `live` declared -> external redirects to live.href, self renders
//      in-site.
//   2. No `live`, links[] non-empty -> redirect to the primary entry, or
//      links[0].
//   3. No `live`, no links[] -> redirect to the detail page.
import { describe, expect, it } from 'vitest';
import { resolveLiveTarget, resolveCardLinks, buildLiveHref } from './resolveLiveLinks';
import type { Link } from '@/data';

const GITHUB: Link = { label: 'GitHub', href: 'https://github.com/x' };
const WEBSITE_PRIMARY: Link = { label: 'Website', href: 'https://example.com', primary: true };
const CHROME_STORE: Link = { label: 'Chrome Web Store', href: 'https://chromewebstore.google.com/x', icon: 'puzzle' };

describe('buildLiveHref', () => {
  it('builds "/projects/<slug>/live"', () => {
    expect(buildLiveHref('projects', 'juno')).toBe('/projects/juno/live');
  });

  it('builds "/research/<slug>/live"', () => {
    expect(buildLiveHref('research', 'flood-nlp')).toBe('/research/flood-nlp/live');
  });
});

describe('resolveLiveTarget', () => {
  describe('rule 1: "live" declared', () => {
    it('type: external resolves to a redirect at live.href', () => {
      const result = resolveLiveTarget({
        live: { type: 'external', href: 'https://app.example.com' },
        links: [GITHUB],
        slug: 'foo',
        collection: 'projects',
      });
      expect(result).toEqual({ mode: 'redirect', destination: 'https://app.example.com' });
    });

    it('type: self resolves to rendering that page, ignoring links[] entirely', () => {
      const result = resolveLiveTarget({
        live: { type: 'self', page: 'crunchy-filler' },
        links: [GITHUB],
        slug: 'foo',
        collection: 'projects',
      });
      expect(result).toEqual({ mode: 'self', page: 'crunchy-filler' });
    });

    it('type: external takes priority over links[] even when a primary link exists', () => {
      const result = resolveLiveTarget({
        live: { type: 'external', href: 'https://app.example.com' },
        links: [WEBSITE_PRIMARY],
        slug: 'foo',
        collection: 'projects',
      });
      expect(result).toEqual({ mode: 'redirect', destination: 'https://app.example.com' });
    });
  });

  describe('rule 2: no "live", links[] non-empty', () => {
    it('redirects to the primary: true entry when one exists', () => {
      const result = resolveLiveTarget({
        live: undefined,
        links: [GITHUB, CHROME_STORE, WEBSITE_PRIMARY],
        slug: 'foo',
        collection: 'projects',
      });
      expect(result).toEqual({ mode: 'redirect', destination: 'https://example.com' });
    });

    it('redirects to links[0] when no entry is marked primary', () => {
      const result = resolveLiveTarget({
        live: undefined,
        links: [CHROME_STORE, GITHUB],
        slug: 'foo',
        collection: 'projects',
      });
      expect(result).toEqual({ mode: 'redirect', destination: 'https://chromewebstore.google.com/x' });
    });
  });

  describe('rule 3: no "live", no links[] at all', () => {
    it('redirects to the projects detail page', () => {
      const result = resolveLiveTarget({ live: undefined, links: [], slug: 'juno', collection: 'projects' });
      expect(result).toEqual({ mode: 'redirect', destination: '/projects/juno' });
    });

    it('redirects to the research detail page', () => {
      const result = resolveLiveTarget({ live: undefined, links: [], slug: 'flood-nlp', collection: 'research' });
      expect(result).toEqual({ mode: 'redirect', destination: '/research/flood-nlp' });
    });
  });
});

describe('resolveCardLinks', () => {
  it('returns links[] completely unchanged whenever it is non-empty, regardless of "live"', () => {
    const links = [GITHUB, WEBSITE_PRIMARY];
    const withoutLive = resolveCardLinks({ live: undefined, links, slug: 'foo', collection: 'projects' });
    const withLive = resolveCardLinks({ live: { type: 'external', href: 'https://x.com' }, links, slug: 'foo', collection: 'projects' });
    expect(withoutLive).toBe(links); // same reference — genuinely untouched
    expect(withLive).toBe(links);
  });

  it('substitutes a single live-link button, pointed at the internal /live href, when links[] is empty', () => {
    const result = resolveCardLinks({ live: undefined, links: [], slug: 'foo', collection: 'projects' });
    expect(result).toEqual([{ label: 'Live', href: '/projects/foo/live', icon: 'globe', primary: true, isLive: true }]);
  });

  it('uses live.label/live.icon for the fallback button when set', () => {
    const result = resolveCardLinks({
      live: { type: 'external', href: 'https://x.com', label: 'Try it', icon: 'rocket' },
      links: [],
      slug: 'foo',
      collection: 'projects',
    });
    expect(result).toEqual([{ label: 'Try it', href: '/projects/foo/live', icon: 'rocket', primary: true, isLive: true }]);
  });

  it('falls back to "Live"/"globe" for the fallback button when live is absent or has no label/icon', () => {
    const result = resolveCardLinks({ live: { type: 'self', page: 'p' }, links: [], slug: 'foo', collection: 'research' });
    expect(result).toEqual([{ label: 'Live', href: '/research/foo/live', icon: 'globe', primary: true, isLive: true }]);
  });

  it('uses the "research" collection to build the fallback href', () => {
    const result = resolveCardLinks({ live: undefined, links: [], slug: 'flood-nlp', collection: 'research' });
    expect(result[0].href).toBe('/research/flood-nlp/live');
  });
});
