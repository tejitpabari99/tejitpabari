import { describe, expect, it } from 'vitest';
import { computeLandingTimelineState, LANDING_TIMELINE_LIMIT } from './WorkExperienceSection';
import type { WorkExperience } from '@/data';

function entry(id: string): WorkExperience {
  return {
    id,
    company: 'C',
    role: 'R',
    startDate: '2024-01-01',
    endDate: 'Present',
    links: [],
    draftDate: false,
    body: 'b',
  };
}

describe('computeLandingTimelineState', () => {
  it('hasMore is false at exactly the limit', () => {
    const all = Array.from({ length: LANDING_TIMELINE_LIMIT }, (_, i) => entry(String(i)));
    const { hasMore, entries } = computeLandingTimelineState(all);
    expect(hasMore).toBe(false);
    expect(entries).toHaveLength(LANDING_TIMELINE_LIMIT);
  });

  it('hasMore is false one below the limit', () => {
    const all = Array.from({ length: LANDING_TIMELINE_LIMIT - 1 }, (_, i) => entry(String(i)));
    const { hasMore } = computeLandingTimelineState(all);
    expect(hasMore).toBe(false);
  });

  it('hasMore is true one above the limit, and entries is still capped at the limit', () => {
    const all = Array.from({ length: LANDING_TIMELINE_LIMIT + 1 }, (_, i) => entry(String(i)));
    const { hasMore, entries } = computeLandingTimelineState(all);
    expect(hasMore).toBe(true);
    expect(entries).toHaveLength(LANDING_TIMELINE_LIMIT);
  });
});
