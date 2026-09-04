// src/lib/resolveLiveLinks.test.ts
//
// Round 3.2: the ONE shared, unit-tested resolution helper - given a
// `live` field (or its absence) plus a `links[]` array, produces the
// final ordered list of link buttons every render site (LinksRow,
// ProjectListCard, FeaturedProjectsSection) uses. See the file's own
// header comment for the full contract this exercises rule-by-rule.
import { describe, expect, it } from 'vitest';
import { resolveLiveLinks } from './resolveLiveLinks';
import type { Link } from '@/data';

const GITHUB: Link = { label: 'GitHub', href: 'https://github.com/x' };
const WEBSITE_PRIMARY: Link = { label: 'Website', href: 'https://example.com', primary: true };
const CHROME_STORE: Link = { label: 'Chrome Web Store', href: 'https://chromewebstore.google.com/x', icon: 'puzzle' };

describe('resolveLiveLinks', () => {
  describe('rule 1: no "live" field', () => {
    it('returns links completely unchanged when live is undefined', () => {
      const links = [GITHUB, WEBSITE_PRIMARY];
      const result = resolveLiveLinks({ live: undefined, links, slug: 'foo', collection: 'projects' });
      expect(result).toBe(links); // same reference, not just deep-equal — genuinely untouched
    });

    it('returns an empty array unchanged when links is empty and live is undefined', () => {
      expect(resolveLiveLinks({ live: undefined, links: [], slug: 'foo', collection: 'projects' })).toEqual([]);
    });
  });

  describe('rule 2: the live entry is placed first', () => {
    it('prepends a live entry ahead of every links[] entry', () => {
      const result = resolveLiveLinks({
        live: { type: 'external', href: 'https://app.example.com' },
        links: [GITHUB, WEBSITE_PRIMARY],
        slug: 'foo',
        collection: 'projects',
      });
      expect(result[0].isLive).toBe(true);
      expect(result.slice(1)).toEqual([GITHUB, WEBSITE_PRIMARY]);
    });

    it('builds the internal href from slug + collection ("/projects/<slug>/live"), never live.href itself', () => {
      const result = resolveLiveLinks({
        live: { type: 'external', href: 'https://app.example.com' },
        links: [],
        slug: 'juno',
        collection: 'projects',
      });
      expect(result[0].href).toBe('/projects/juno/live');
    });

    it('uses the "research" collection to build "/research/<slug>/live"', () => {
      const result = resolveLiveLinks({
        live: { type: 'self', page: 'whatever' },
        links: [],
        slug: 'flood-nlp',
        collection: 'research',
      });
      expect(result[0].href).toBe('/research/flood-nlp/live');
    });

    it('renders a live entry even when links is entirely empty', () => {
      const result = resolveLiveLinks({ live: { type: 'external', href: 'https://x.com' }, links: [], slug: 'foo', collection: 'projects' });
      expect(result).toHaveLength(1);
      expect(result[0].isLive).toBe(true);
    });
  });

  describe('rule 3: label/icon inheritance chain', () => {
    it('uses live.label/live.icon when explicitly set, ignoring links[] entirely', () => {
      const result = resolveLiveLinks({
        live: { type: 'external', href: 'https://x.com', label: 'Try Juno', icon: 'rocket' },
        links: [WEBSITE_PRIMARY],
        slug: 'foo',
        collection: 'projects',
      });
      expect(result[0]).toMatchObject({ label: 'Try Juno', icon: 'rocket' });
    });

    it('inherits the primary links[] entry\'s label/icon when live.label/icon are unset', () => {
      const result = resolveLiveLinks({
        live: { type: 'external', href: 'https://x.com' },
        links: [GITHUB, CHROME_STORE, { ...WEBSITE_PRIMARY }],
        slug: 'foo',
        collection: 'projects',
      });
      expect(result[0]).toMatchObject({ label: 'Website' });
    });

    it('falls back to the FIRST links[] entry when none is marked primary', () => {
      const result = resolveLiveLinks({
        live: { type: 'external', href: 'https://x.com' },
        links: [CHROME_STORE, GITHUB],
        slug: 'foo',
        collection: 'projects',
      });
      expect(result[0]).toMatchObject({ label: 'Chrome Web Store', icon: 'puzzle' });
    });

    it('falls back to "Live"/"globe" only when links[] is entirely empty', () => {
      const result = resolveLiveLinks({ live: { type: 'external', href: 'https://x.com' }, links: [], slug: 'foo', collection: 'projects' });
      expect(result[0]).toMatchObject({ label: 'Live', icon: 'globe' });
    });

    it('an explicit live.label alone still leaves icon free to inherit (independent resolution per field)', () => {
      const result = resolveLiveLinks({
        live: { type: 'external', href: 'https://x.com', label: 'Custom label' },
        links: [CHROME_STORE],
        slug: 'foo',
        collection: 'projects',
      });
      expect(result[0]).toMatchObject({ label: 'Custom label', icon: 'puzzle' });
    });

    it('type: self also inherits from primary/first links[] the same way (label/icon rules are not external-only)', () => {
      const result = resolveLiveLinks({
        live: { type: 'self', page: 'crunchy-filler' },
        links: [CHROME_STORE],
        slug: 'foo',
        collection: 'projects',
      });
      expect(result[0]).toMatchObject({ label: 'Chrome Web Store', icon: 'puzzle' });
    });
  });

  describe('rule 4: dedupe (type: external only)', () => {
    it('removes a links[] entry whose href exactly matches live.href, using ITS label/icon for the live entry', () => {
      const result = resolveLiveLinks({
        live: { type: 'external', href: 'https://chromewebstore.google.com/x' },
        links: [GITHUB, CHROME_STORE],
        slug: 'foo',
        collection: 'projects',
      });
      // Exactly one "Chrome Web Store" entry (the live one) — the
      // original links[] entry with the same href is gone.
      const chromeEntries = result.filter((r) => r.label === 'Chrome Web Store');
      expect(chromeEntries).toHaveLength(1);
      expect(chromeEntries[0].href).toBe('/projects/foo/live');
      expect(result).toEqual([
        { label: 'Chrome Web Store', href: '/projects/foo/live', icon: 'puzzle', primary: true, isLive: true },
        GITHUB,
      ]);
    });

    it('an explicit live.label/icon still overrides even the deduped entry\'s own label/icon', () => {
      const result = resolveLiveLinks({
        live: { type: 'external', href: 'https://chromewebstore.google.com/x', label: 'Custom', icon: 'sparkles' },
        links: [CHROME_STORE],
        slug: 'foo',
        collection: 'projects',
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ label: 'Custom', icon: 'sparkles' });
    });

    it('never dedupes for type: self (no href to compare against links[] at all)', () => {
      const result = resolveLiveLinks({
        live: { type: 'self', page: 'crunchy-filler' },
        links: [CHROME_STORE],
        slug: 'foo',
        collection: 'projects',
      });
      // Chrome Web Store still appears twice: once inherited onto the
      // live entry, once as its own untouched links[] entry — type: self
      // has no href of its own to match against, so nothing is removed.
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual(CHROME_STORE);
    });

    it('leaves links[] untouched when no entry shares live.href', () => {
      const result = resolveLiveLinks({
        live: { type: 'external', href: 'https://not-in-links.example.com' },
        links: [GITHUB, CHROME_STORE],
        slug: 'foo',
        collection: 'projects',
      });
      expect(result.slice(1)).toEqual([GITHUB, CHROME_STORE]);
    });
  });

  describe('rule 5: primary/secondary resolution', () => {
    it('makes the live entry primary when no remaining links[] entry is marked primary', () => {
      const result = resolveLiveLinks({
        live: { type: 'external', href: 'https://x.com' },
        links: [GITHUB],
        slug: 'foo',
        collection: 'projects',
      });
      expect(result[0].primary).toBe(true);
    });

    it('keeps an existing primary links[] entry primary, rendering the live entry as secondary', () => {
      const result = resolveLiveLinks({
        live: { type: 'external', href: 'https://x.com' },
        links: [WEBSITE_PRIMARY],
        slug: 'foo',
        collection: 'projects',
      });
      expect(result[0].primary).toBeFalsy();
      expect(result[1].primary).toBe(true);
    });

    it('makes the live entry primary again when the ONLY primary entry is the one just deduped away', () => {
      const primaryDuplicate: Link = { label: 'Try it', href: 'https://x.com', primary: true };
      const result = resolveLiveLinks({
        live: { type: 'external', href: 'https://x.com' },
        links: [primaryDuplicate],
        slug: 'foo',
        collection: 'projects',
      });
      expect(result).toHaveLength(1);
      expect(result[0].primary).toBe(true);
    });
  });
});
