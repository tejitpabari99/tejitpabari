import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSectionViewTracking } from './useSectionViewTracking';
import { trackEvent } from './analytics';

vi.mock('./analytics', () => ({
  trackEvent: vi.fn(),
}));

type FakeEntry = { isIntersecting: boolean; target: { id: string } };

let observerCallback: (entries: FakeEntry[]) => void;

class FakeIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  constructor(callback: (entries: FakeEntry[]) => void) {
    observerCallback = callback;
  }
}

describe('useSectionViewTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      const el = document.createElement('div');
      el.id = id;
      return el;
    });
  });

  it('dedupes: triggering two intersecting entries for the same id fires section_view exactly once', () => {
    renderHook(() => useSectionViewTracking());

    observerCallback([{ isIntersecting: true, target: { id: 'projects' } }]);
    observerCallback([{ isIntersecting: true, target: { id: 'projects' } }]);

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('section_view', { section: 'projects' });
  });

  it('fires its own section_view once per distinct id', () => {
    renderHook(() => useSectionViewTracking());

    observerCallback([{ isIntersecting: true, target: { id: 'projects' } }]);
    observerCallback([{ isIntersecting: true, target: { id: 'about' } }]);

    expect(trackEvent).toHaveBeenCalledTimes(2);
    expect(trackEvent).toHaveBeenNthCalledWith(1, 'section_view', { section: 'projects' });
    expect(trackEvent).toHaveBeenNthCalledWith(2, 'section_view', { section: 'about' });
  });

  it('never fires for a non-intersecting entry', () => {
    renderHook(() => useSectionViewTracking());

    observerCallback([{ isIntersecting: false, target: { id: 'contact' } }]);

    expect(trackEvent).not.toHaveBeenCalled();
  });
});
