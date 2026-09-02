import { describe, it, expect, vi } from 'vitest';

// featured.ts computes `featuredProjects = computeFeatured(projects, FEATURED_PROJECT_SLUGS)`
// eagerly at module-eval time (Task 9 / PRD §4.6), validating FEATURED_PROJECT_SLUGS
// (the six pinned project slugs) against the REAL `projects` array imported from
// '@/data'. The mock below supplies those slugs so the eager computation can
// succeed during module evaluation before the tests run.
//
// To exercise the real, unmodified `computeFeatured` function (Task 9's actual
// implementation, exported specifically for this purpose per PRD §7) with fully
// controlled in-memory fixtures — rather than reimplementing or copy-pasting its
// logic — '@/data' is mocked here to provide a `projects` array containing exactly
// the six slugs FEATURED_PROJECT_SLUGS names, which is enough for the module's
// own eager computation to succeed without throwing. Every test below then calls
// the real `computeFeatured` directly with its own independent fixture data (the
// `all`/`slugs` arguments), never relying on the mocked `projects` or on
// FEATURED_PROJECT_SLUGS — this mock exists solely to make the import path safe,
// not to influence any assertion.
vi.mock('@/data', async () => {
  const mkProject = (slug: string) => ({
    slug,
    title: slug,
    description: 'd',
    image: '/x.png',
    tags: ['Others'],
    links: [],
    date: '2024-01-01',
    body: '',
  });
  return {
    projects: [
      mkProject('juno'),
      mkProject('smarttest'),
      mkProject('med-doc-tracker'),
      mkProject('clip-verse'),
      mkProject('columbia-virtual-campus'),
      mkProject('crunchy-filler'),
    ],
  };
});

import { computeFeatured } from './featured';
import type { Project } from '@/data';

function proj(slug: string, date: string): Project {
  return { slug, title: slug, description: 'd', image: '/x.png', tags: ['Others'], links: [], date, body: '' };
}

const all: Project[] = [proj('a', '2024-06-01'), proj('b', '2024-05-01'), proj('c', '2024-04-01'), proj('d', '2024-03-01'), proj('e', '2024-02-01'), proj('f', '2024-01-01'), proj('g', '2023-12-01')];

describe('computeFeatured', () => {
  it('backfills remaining slots by date descending when fewer than 6 are listed', () => {
    const result = computeFeatured(all, ['g']);
    expect(result.map((p) => p.slug)).toEqual(['g', 'a', 'b', 'c', 'd', 'e']);
  });

  it('does no backfill when exactly 6 are listed', () => {
    const result = computeFeatured(all, ['a', 'b', 'c', 'd', 'e', 'f']);
    expect(result.map((p) => p.slug)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('throws when more than 6 slugs are listed', () => {
    expect(() => computeFeatured(all, ['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toThrow(/max is 6/);
  });

  it('throws naming an unknown slug', () => {
    expect(() => computeFeatured(all, ['nonexistent'])).toThrow(/nonexistent/);
  });

  it('does not double-count a listed slug that is also the most recent by date', () => {
    // 'a' is both explicitly listed AND the most recent overall — it must
    // occupy exactly one slot, not appear twice via the backfill pass.
    const result = computeFeatured(all, ['a', 'g']);
    expect(result.map((p) => p.slug)).toEqual(['a', 'g', 'b', 'c', 'd', 'e']);
  });

  it('throws on a duplicate slug within the list itself', () => {
    expect(() => computeFeatured(all, ['a', 'a'])).toThrow(/duplicate/i);
  });

  it('returns fewer than 6 with no padding when fewer than 6 total projects exist', () => {
    const small = all.slice(0, 3);
    const result = computeFeatured(small, []);
    expect(result).toHaveLength(3);
  });
});
