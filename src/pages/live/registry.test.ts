// src/pages/live/registry.test.ts
//
// Task 21 per .dev/website-revamp/04-projects-research-pages/TASKS.md.
// Exercises `validateLiveRegistry`, `computeProjectLiveSlugs`, and
// `hasLiveRoute` with fixture Project[] arrays — no module mocking needed,
// per Task 8's testability deviation (these functions are exported and
// parameterized specifically for this). Importing this module also runs
// its own eager, real-content validation (`validateLiveRegistry(HOSTED_SLUGS,
// projects)` against the REAL `projects` array) — safe today because the
// real `HOSTED_LIVE_PAGES` registry is empty, so that loop never iterates.
import { describe, expect, it } from 'vitest';
import type { Project } from '@/data';
import { computeProjectLiveSlugs, hasLiveRoute, validateLiveRegistry } from './registry';

function proj(slug: string, overrides: Partial<Project> = {}): Project {
  return {
    slug,
    title: slug,
    description: 'd',
    image: '/x.png',
    tags: ['Others'],
    links: [],
    date: '2024-01-01',
    body: '',
    ...overrides,
  };
}

describe('validateLiveRegistry', () => {
  it('throws, naming the slug, when a hostedSlugs entry has no matching project', () => {
    const fixtureProjects = [proj('juno')];
    expect(() => validateLiveRegistry(['sample-project'], fixtureProjects)).toThrow(/sample-project/);
  });

  it('throws, naming the conflicting slug, when a hostedSlugs entry\'s project also has liveUrl set', () => {
    const fixtureProjects = [proj('juno', { liveUrl: 'https://app.meetjuno.health' })];
    expect(() => validateLiveRegistry(['juno'], fixtureProjects)).toThrow(/juno/);
  });

  it('does not throw when hostedSlugs entries all have a matching project with no liveUrl', () => {
    const fixtureProjects = [proj('sample-project'), proj('juno', { liveUrl: 'https://app.meetjuno.health' })];
    expect(() => validateLiveRegistry(['sample-project'], fixtureProjects)).not.toThrow();
  });
});

describe('computeProjectLiveSlugs', () => {
  it('unions liveUrl-bearing and hosted-registered slugs with no duplicates', () => {
    const fixtureProjects = [
      proj('juno', { liveUrl: 'https://app.meetjuno.health' }),
      proj('sample-project'),
      proj('med-doc-tracker'), // neither liveUrl nor hosted — excluded
    ];
    const result = computeProjectLiveSlugs(['sample-project'], fixtureProjects);
    expect(result.sort()).toEqual(['juno', 'sample-project']);
  });

  it('returns an empty array when no project has liveUrl and hostedSlugs is empty', () => {
    const fixtureProjects = [proj('a'), proj('b')];
    expect(computeProjectLiveSlugs([], fixtureProjects)).toEqual([]);
  });
});

describe('hasLiveRoute (reconstructed from computeProjectLiveSlugs output)', () => {
  const fixtureProjects = [
    proj('juno', { liveUrl: 'https://app.meetjuno.health' }),
    proj('sample-project'),
    proj('med-doc-tracker'),
  ];
  const fixtureLiveSlugs = computeProjectLiveSlugs(['sample-project'], fixtureProjects);

  function fixtureHasLiveRoute(slug: string): boolean {
    return fixtureLiveSlugs.includes(slug);
  }

  it('returns true for a liveUrl-bearing slug', () => {
    expect(fixtureHasLiveRoute('juno')).toBe(true);
  });

  it('returns true for a hosted-registered slug', () => {
    expect(fixtureHasLiveRoute('sample-project')).toBe(true);
  });

  it('returns false for a slug with neither liveUrl nor a hosted registration', () => {
    expect(fixtureHasLiveRoute('med-doc-tracker')).toBe(false);
  });

  it('returns false for a slug not present in the fixture list at all', () => {
    expect(fixtureHasLiveRoute('nonexistent')).toBe(false);
  });
});

// The real, exported hasLiveRoute — checked directly against whatever the
// real, currently-empty HOSTED_LIVE_PAGES registry + real content computed
// projectLiveSlugs to be. Not a fixture test; a light sanity check that the
// exported function's own logic (membership check) works as documented.
describe('hasLiveRoute (the real exported function)', () => {
  it('returns false for a slug that is certainly not a real project', () => {
    expect(hasLiveRoute('definitely-not-a-real-project-slug')).toBe(false);
  });
});
