import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  computeLandingTimelineState,
  LANDING_TIMELINE_LIMIT,
  WorkExperienceSection,
} from './WorkExperienceSection';
import { workExperience } from '@/data';
import type { WorkExperience as WorkExperienceType } from '@/data';

// Kept as a .ts file (no JSX syntax) per PRD §7's file-name assignment;
// router wrapper is built with createElement instead of JSX — see
// src/hooks/useCollectionFilter.test.ts for the same convention and the
// reason (oxc's transform for .ts files does not parse JSX).

function entry(id: string): WorkExperienceType {
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

describe('WorkExperienceSection (real content)', () => {
  it('renders exactly LANDING_TIMELINE_LIMIT entries plus a "See all experience" link, now that real content exceeds the limit', () => {
    // Sanity check on the R3 precondition this test exists to exercise —
    // if this ever goes false again (content drops back to 2 entries),
    // the second assertion below should also flip, not silently stay
    // green.
    expect(workExperience.length).toBeGreaterThan(LANDING_TIMELINE_LIMIT);

    render(createElement(MemoryRouter, null, createElement(WorkExperienceSection)));

    // LANDING_TIMELINE_LIMIT real entries + 1 stub = 3 listitems.
    expect(screen.getAllByRole('listitem')).toHaveLength(LANDING_TIMELINE_LIMIT + 1);
    expect(screen.getByRole('link', { name: /see all experience/i })).toHaveAttribute(
      'href',
      '/work-experience',
    );
  });
});
