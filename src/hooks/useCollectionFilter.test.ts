// src/hooks/useCollectionFilter.test.ts
//
// Task 16 (filtering + analytics) per
// .dev/website-revamp/04-projects-research-pages/TASKS.md. Fixture data
// only — never the real loaded `projects`/`research` arrays.
//
// Kept as a .ts file (no JSX syntax) per the task's file name; router
// wrapper components are built with `createElement` instead of JSX.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useCollectionFilter } from './useCollectionFilter';
import { trackEvent } from '@/lib/analytics';

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

interface FixtureItem {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  body: string;
}

const FIXTURE_ITEMS: FixtureItem[] = [
  { slug: 'a', title: 'Juno', description: 'health app', tags: ['Health Tech'], body: '' },
  { slug: 'b', title: 'Other', description: '', tags: ['Developer Tools'], body: '' },
];

function memoryRouterWrapper(initialEntries?: string[]) {
  return ({ children }: { children: ReactNode }) =>
    createElement(MemoryRouter, initialEntries ? { initialEntries } : null, children);
}

function renderFilter(collection: 'projects' | 'research' = 'projects', initialEntries?: string[]) {
  return renderHook(() => useCollectionFilter<FixtureItem>({ items: FIXTURE_ITEMS, collection }), {
    wrapper: memoryRouterWrapper(initialEntries),
  });
}

describe('useCollectionFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('filtering', () => {
    it('tag filter alone narrows results to items with the active tag', () => {
      const { result } = renderFilter();
      act(() => {
        result.current.setActiveTag('Health Tech');
      });
      expect(result.current.results.map((i) => i.slug)).toEqual(['a']);
    });

    it('search query alone narrows results to matching items', () => {
      const { result } = renderFilter();
      act(() => {
        result.current.setQuery('juno');
      });
      act(() => {
        vi.advanceTimersByTime(200); // settle the 200ms UI-facing debounce
      });
      expect(result.current.results.map((i) => i.slug)).toEqual(['a']);
    });

    it('tag + search compose as AND — a query matching an item outside the active tag returns []', () => {
      const { result } = renderFilter();
      act(() => {
        result.current.setActiveTag('Developer Tools');
      });
      act(() => {
        result.current.setQuery('juno'); // only matches item "a", which is tagged Health Tech
      });
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(result.current.results).toEqual([]);
    });

    it('empty query and no active tag returns every item', () => {
      const { result } = renderFilter();
      expect(result.current.results.map((i) => i.slug)).toEqual(['a', 'b']);
    });

    it('allTags reflects the full item list and does not shrink as a filter narrows results', () => {
      const { result } = renderFilter();
      act(() => {
        result.current.setActiveTag('Health Tech');
      });
      act(() => {
        result.current.setQuery('juno');
      });
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(result.current.results.length).toBeLessThan(FIXTURE_ITEMS.length);
      expect(result.current.allTags).toEqual(['Developer Tools', 'Health Tech']);
    });
  });

  describe('search_query analytics', () => {
    it('fires once, 600ms after a settled non-empty query, with the correct collection/query/result_count', () => {
      const { result } = renderFilter('research');
      act(() => {
        result.current.setQuery('juno');
      });
      // Two chained real-macrotask boundaries: the 200ms UI debounce first
      // (which narrows `results` and, via that dependency, resets the
      // separate 600ms analytics timer), then the 600ms analytics timer
      // itself — staged as two advances so each gets its own React flush,
      // matching how two independent real setTimeouts actually interleave.
      act(() => {
        vi.advanceTimersByTime(200);
      });
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(trackEvent).toHaveBeenCalledTimes(1);
      expect(trackEvent).toHaveBeenCalledWith('search_query', {
        collection: 'research',
        query: 'juno',
        result_count: 1,
      });
    });

    it('does not fire once per keystroke — only once after rapid typing settles, with the final query', () => {
      const { result } = renderFilter();
      act(() => {
        result.current.setQuery('j');
      });
      act(() => {
        vi.advanceTimersByTime(100); // well within both the 200ms and 600ms windows
      });
      act(() => {
        result.current.setQuery('ju');
      });
      act(() => {
        vi.advanceTimersByTime(100);
      });
      act(() => {
        result.current.setQuery('juno');
      });
      expect(trackEvent).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(200);
      });
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(trackEvent).toHaveBeenCalledTimes(1);
      expect(trackEvent).toHaveBeenCalledWith('search_query', {
        collection: 'projects',
        query: 'juno',
        result_count: 1,
      });
    });

    it('does not fire for an empty query, even after 600ms', () => {
      const { result } = renderFilter();
      act(() => {
        result.current.setQuery('');
      });
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(trackEvent).not.toHaveBeenCalled();
    });

    it('does not fire for a whitespace-only query, even after 600ms', () => {
      const { result } = renderFilter();
      act(() => {
        result.current.setQuery('   ');
      });
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(trackEvent).not.toHaveBeenCalled();
    });
  });
});
