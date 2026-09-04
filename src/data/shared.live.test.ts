// src/data/shared.live.test.ts
//
// Round 3.1 restoration of the /live subsystem (see
// .dev/website-revamp-r3/CONTENT-AUTHORING.md's "The `live` field"
// section). Exercises assertOptionalLive directly (not through
// parseProject/parseResearch, unlike shared.test.ts's other coverage) —
// `hostedPageKeys` is deliberately a parameter specifically so this
// function is testable against fixture registry contents, independent of
// whatever real src/pages/live/registry.ts happens to contain at any
// given time (it ships empty — see that file — so a "valid type: self"
// case could never be exercised through the real registry at all).
import { describe, it, expect } from 'vitest';
import { assertOptionalLive } from './shared';

const PATH = 'src/content/projects/foo.md';
const HOSTED_KEYS = ['crunchy-filler', 'other-page'];

describe('assertOptionalLive', () => {
  it('returns undefined when "live" is entirely absent', () => {
    expect(assertOptionalLive(PATH, undefined, HOSTED_KEYS)).toBeUndefined();
  });

  describe('type: external', () => {
    it('accepts a valid external entry, defaulting label to "Live" and icon to "globe"', () => {
      const result = assertOptionalLive(PATH, { type: 'external', href: 'https://example.com' }, HOSTED_KEYS);
      expect(result).toEqual({ type: 'external', href: 'https://example.com', label: 'Live', icon: 'globe' });
    });

    it('accepts an explicit label and icon, overriding the defaults', () => {
      const result = assertOptionalLive(
        PATH,
        { type: 'external', href: 'https://example.com', label: 'Try it', icon: 'rocket' },
        HOSTED_KEYS,
      );
      expect(result).toEqual({ type: 'external', href: 'https://example.com', label: 'Try it', icon: 'rocket' });
    });

    it('throws, naming the file, when "href" is missing', () => {
      expect(() => assertOptionalLive(PATH, { type: 'external' }, HOSTED_KEYS)).toThrow(/foo\.md.*live\.href/is);
    });

    it('throws when "href" is not an absolute http(s) URL', () => {
      expect(() => assertOptionalLive(PATH, { type: 'external', href: '//evil.com/phish' }, HOSTED_KEYS)).toThrow(
        /foo\.md.*live\.href.*absolute http\(s\) URL/is,
      );
    });

    it('throws when a "page" key is also present alongside type: external', () => {
      expect(() =>
        assertOptionalLive(PATH, { type: 'external', href: 'https://example.com', page: 'crunchy-filler' }, HOSTED_KEYS),
      ).toThrow(/foo\.md.*live\.page.*type: self/is);
    });
  });

  describe('type: self', () => {
    it('accepts a valid self entry whose "page" is registered, defaulting label/icon', () => {
      const result = assertOptionalLive(PATH, { type: 'self', page: 'crunchy-filler' }, HOSTED_KEYS);
      expect(result).toEqual({ type: 'self', page: 'crunchy-filler', label: 'Live', icon: 'globe' });
    });

    it('accepts an explicit label and icon', () => {
      const result = assertOptionalLive(PATH, { type: 'self', page: 'crunchy-filler', label: 'Open app', icon: 'sparkles' }, HOSTED_KEYS);
      expect(result).toEqual({ type: 'self', page: 'crunchy-filler', label: 'Open app', icon: 'sparkles' });
    });

    it('throws, naming the file, when "page" is missing', () => {
      expect(() => assertOptionalLive(PATH, { type: 'self' }, HOSTED_KEYS)).toThrow(/foo\.md.*live\.page/is);
    });

    it('throws, naming the bad page value, when "page" is not in the registry', () => {
      expect(() => assertOptionalLive(PATH, { type: 'self', page: 'nonexistent-page' }, HOSTED_KEYS)).toThrow(
        /foo\.md.*live\.page: nonexistent-page.*not registered/is,
      );
    });

    it('throws when an "href" key is also present alongside type: self', () => {
      expect(() =>
        assertOptionalLive(PATH, { type: 'self', page: 'crunchy-filler', href: 'https://example.com' }, HOSTED_KEYS),
      ).toThrow(/foo\.md.*live\.href.*type: external/is);
    });

    it('throws, and reports "(empty)", when the registry itself is empty', () => {
      expect(() => assertOptionalLive(PATH, { type: 'self', page: 'anything' }, [])).toThrow(/\(empty\)/);
    });
  });

  describe('shared validation', () => {
    it('throws when "live" is a non-object (e.g. a bare string)', () => {
      expect(() => assertOptionalLive(PATH, 'external', HOSTED_KEYS)).toThrow(/foo\.md.*"live" must be a mapping/is);
    });

    it('throws when "live" is an array', () => {
      expect(() => assertOptionalLive(PATH, ['external'], HOSTED_KEYS)).toThrow(/foo\.md.*"live" must be a mapping/is);
    });

    it('throws, naming the type, when "type" is neither "external" nor "self"', () => {
      expect(() => assertOptionalLive(PATH, { type: 'hosted' }, HOSTED_KEYS)).toThrow(/foo\.md.*live\.type.*hosted/is);
    });

    it('throws, naming the type, when "type" is missing entirely', () => {
      expect(() => assertOptionalLive(PATH, { href: 'https://example.com' }, HOSTED_KEYS)).toThrow(/foo\.md.*live\.type/is);
    });

    it('throws, naming the bad key, on an unrecognized key inside "live"', () => {
      expect(() =>
        assertOptionalLive(PATH, { type: 'external', href: 'https://example.com', target: '_blank' }, HOSTED_KEYS),
      ).toThrow(/foo\.md.*"live" has unrecognized key\(s\): target/is);
    });

    it('throws when "label" is an empty string', () => {
      expect(() => assertOptionalLive(PATH, { type: 'external', href: 'https://example.com', label: '  ' }, HOSTED_KEYS)).toThrow(
        /foo\.md.*live\.label/is,
      );
    });

    it('throws, naming the bad value, when "icon" is not a recognized icon name', () => {
      expect(() =>
        assertOptionalLive(PATH, { type: 'external', href: 'https://example.com', icon: 'not-a-real-icon' }, HOSTED_KEYS),
      ).toThrow(/foo\.md.*live\.icon: not-a-real-icon.*not a recognized icon name/is);
    });
  });
});
