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
});
