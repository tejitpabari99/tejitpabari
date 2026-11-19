import { describe, it, expect } from 'vitest';
import { projectsForSite } from './projects';

const JARGON = /apps script|google apps|\bapi\b|plugin|skill|agent|script|json|github|llm/i;

describe('nonprofit projects (real content)', () => {
  const list = projectsForSite('nonprofit');

  it('are Completed', () => {
    expect(list.map((p) => p.status)).toEqual(['Completed', 'Completed']);
  });

  it('have plain-language descriptions and tags', () => {
    for (const p of list) {
      expect(p.description).not.toMatch(JARGON);
      expect(p.techTags.join(' ')).not.toMatch(JARGON);
    }
  });

  it('use real local images, not the placeholder', () => {
    for (const p of list) {
      expect(p.image).toBe(`/projects/${p.slug}.webp`);
    }
  });
});
