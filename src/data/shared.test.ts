import { describe, it, expect } from 'vitest';
import { parseProject } from './projects';

describe('parseProject', () => {
  it('throws naming the file and field on a missing required field', () => {
    const raw = `---\nslug: foo\ntitle: Foo\nimage: /x.png\ntags: [Health Tech]\nlinks: []\ndate: "2024-01-01"\n---\n`;
    expect(() => parseProject('/src/content/projects/foo.md', raw)).toThrow(/foo\.md.*description/is);
  });

  it('throws on an invalid status enum value', () => {
    const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nstatus: Shipped\nlinks: []\ndate: "2024-01-01"\n---\n`;
    expect(() => parseProject('/src/content/projects/foo.md', raw)).toThrow(/status/i);
  });

  it('does NOT throw when status is entirely absent', () => {
    const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nlinks: []\ndate: "2024-01-01"\n---\n`;
    const result = parseProject('/src/content/projects/foo.md', raw);
    expect(result.status).toBeUndefined();
  });

  it('throws on an unknown frontmatter key', () => {
    const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nlinks: []\ndate: "2024-01-01"\ndescrption: typo\n---\n`;
    expect(() => parseProject('/src/content/projects/foo.md', raw)).toThrow(/descrption/);
  });

  it('throws on a slug/filename mismatch', () => {
    const raw = `---\nslug: bar\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nlinks: []\ndate: "2024-01-01"\n---\n`;
    expect(() => parseProject('/src/content/projects/foo.md', raw)).toThrow(/does not match filename/);
  });

  it('normalizes an unquoted date parsed as a Date object', () => {
    const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nlinks: []\ndate: 2024-01-01\n---\n`;
    const result = parseProject('/src/content/projects/foo.md', raw);
    expect(result.date).toBe('2024-01-01');
  });

  it('throws on a links entry missing href', () => {
    const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nlinks: [{label: "x"}]\ndate: "2024-01-01"\n---\n`;
    expect(() => parseProject('/src/content/projects/foo.md', raw)).toThrow(/links\[0\]\.href/);
  });

  // Coverage-audit gap C: assertImagePath's and assertAbsoluteUrl's throw
  // paths (src/data/shared.ts) were never exercised — only their
  // pass-through behavior was, via every real content file's valid
  // "/images/..." image and absolute liveUrl. Exercised here through
  // parseProject since that's the only real loader that calls both
  // validators (parseResearch only calls assertImagePath).
  it('throws on an "image" missing its leading slash (not root-relative, not absolute)', () => {
    const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: images/no-leading-slash.png\ntags: [Health Tech]\nlinks: []\ndate: "2024-01-01"\n---\n`;
    expect(() => parseProject('/src/content/projects/foo.md', raw)).toThrow(
      /foo\.md.*"image" must be a root-relative path/is,
    );
  });

  // Round 3 (r3-01-schema-icons-content): "liveUrl" is no longer a
  // recognized frontmatter field at all (the /live subsystem was removed),
  // so it now falls under the plain "unknown frontmatter key" guard rather
  // than getting its own URL-shape validation.
  it('throws on a "liveUrl" key at all, as an unrecognized frontmatter field', () => {
    const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nliveUrl: https://example.com\nlinks: []\ndate: "2024-01-01"\n---\n`;
    expect(() => parseProject('/src/content/projects/foo.md', raw)).toThrow(/foo\.md.*unrecognized frontmatter field "liveUrl"/is);
  });

  describe('techTags', () => {
    it('defaults to [] when absent', () => {
      const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nlinks: []\ndate: "2024-01-01"\n---\n`;
      expect(parseProject('/src/content/projects/foo.md', raw).techTags).toEqual([]);
    });

    it('is captured verbatim when present', () => {
      const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\ntechTags: [TypeScript, React]\nlinks: []\ndate: "2024-01-01"\n---\n`;
      expect(parseProject('/src/content/projects/foo.md', raw).techTags).toEqual(['TypeScript', 'React']);
    });

    it('throws, naming the file and field, when techTags contains a non-string entry', () => {
      const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\ntechTags: [TypeScript, 42]\nlinks: []\ndate: "2024-01-01"\n---\n`;
      expect(() => parseProject('/src/content/projects/foo.md', raw)).toThrow(/foo\.md.*"techTags"/is);
    });
  });

  describe('links[].icon', () => {
    it('accepts a recognized icon name', () => {
      const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nlinks: [{label: "Site", href: "https://x.com", icon: "globe"}]\ndate: "2024-01-01"\n---\n`;
      expect(parseProject('/src/content/projects/foo.md', raw).links[0].icon).toBe('globe');
    });

    it('throws, naming the file and the bad value, for an unrecognized icon name', () => {
      const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nlinks: [{label: "Site", href: "https://x.com", icon: "not-a-real-icon"}]\ndate: "2024-01-01"\n---\n`;
      expect(() => parseProject('/src/content/projects/foo.md', raw)).toThrow(
        /foo\.md.*"links\[0\]\.icon: not-a-real-icon" is not a recognized icon name/is,
      );
    });
  });

  describe('links[].primary', () => {
    it('accepts exactly one primary link', () => {
      const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nlinks: [{label: "Site", href: "https://x.com", primary: true}, {label: "Other", href: "https://y.com"}]\ndate: "2024-01-01"\n---\n`;
      const result = parseProject('/src/content/projects/foo.md', raw);
      expect(result.links[0].primary).toBe(true);
      expect(result.links[1].primary).toBeUndefined();
    });

    it('throws when more than one link is marked primary', () => {
      const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nlinks: [{label: "A", href: "https://a.com", primary: true}, {label: "B", href: "https://b.com", primary: true}]\ndate: "2024-01-01"\n---\n`;
      expect(() => parseProject('/src/content/projects/foo.md', raw)).toThrow(/foo\.md.*more than one link has "primary: true"/is);
    });

    it('throws when "primary" is present but not exactly `true`', () => {
      const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nlinks: [{label: "A", href: "https://a.com", primary: false}]\ndate: "2024-01-01"\n---\n`;
      expect(() => parseProject('/src/content/projects/foo.md', raw)).toThrow(/foo\.md.*"links\[0\]\.primary" must be exactly `true`/is);
    });
  });
});
