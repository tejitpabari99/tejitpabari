import { describe, expect, it } from 'vitest';
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
