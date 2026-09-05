import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useSectionScrollDepth } from './useSectionScrollDepth';
import * as analytics from '@/lib/analytics';

let observedCallback: IntersectionObserverCallback;

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    observedCallback = callback;
  }

  observe() {}

  disconnect() {}
}

function TestComponent({ ids }: { ids: string[] }) {
  useSectionScrollDepth(ids);
  return (
    <>
      {ids.map((id) => (
        <div key={id} id={id} />
      ))}
    </>
  );
}

describe('useSectionScrollDepth', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.spyOn(analytics, 'trackEvent').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('fires section_view exactly once per section even if the observer callback repeats for the same element', () => {
    render(<TestComponent ids={['projects']} />);
    const target = document.getElementById('projects')!;
    const fakeEntry = { target, isIntersecting: true } as unknown as IntersectionObserverEntry;

    observedCallback([fakeEntry], {} as IntersectionObserver);
    observedCallback([fakeEntry], {} as IntersectionObserver);
    observedCallback([fakeEntry], {} as IntersectionObserver);

    expect(analytics.trackEvent).toHaveBeenCalledTimes(1);
    expect(analytics.trackEvent).toHaveBeenCalledWith('section_view', { section: 'projects' });
  });

  it('does not fire for an entry that is not yet intersecting', () => {
    render(<TestComponent ids={['about']} />);
    const target = document.getElementById('about')!;
    observedCallback(
      [{ target, isIntersecting: false } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(analytics.trackEvent).not.toHaveBeenCalled();
  });
});
