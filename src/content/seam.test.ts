import { describe, it, expect } from 'vitest';
import { projectSlugs } from './projects';
import { researchSlugs } from './research';

describe('content seam placeholders', () => {
  it('exports an array from projects/index.ts', () => {
    expect(Array.isArray(projectSlugs)).toBe(true);
  });
  it('exports an array from research/index.ts', () => {
    expect(Array.isArray(researchSlugs)).toBe(true);
  });
});
