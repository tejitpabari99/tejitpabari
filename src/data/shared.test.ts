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

  it('throws on a "liveUrl" that is not a URL at all', () => {
    const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nliveUrl: not-a-url\nlinks: []\ndate: "2024-01-01"\n---\n`;
    expect(() => parseProject('/src/content/projects/foo.md', raw)).toThrow(
      /foo\.md.*"liveUrl" must be an absolute http\(s\) URL/is,
    );
  });

  it('throws on a "liveUrl" using a non-http(s) protocol', () => {
    const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nliveUrl: ftp://x\nlinks: []\ndate: "2024-01-01"\n---\n`;
    expect(() => parseProject('/src/content/projects/foo.md', raw)).toThrow(
      /foo\.md.*"liveUrl" must be an absolute http\(s\) URL/is,
    );
  });
});
