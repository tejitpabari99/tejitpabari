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
