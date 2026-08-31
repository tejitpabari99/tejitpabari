import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render } from '@testing-library/react';
import { MemoryRouter, createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AnalyticsListener } from './AnalyticsListener';
import { useConsent } from '@/context/ConsentContext';
import { isGaLoaded, trackPageView } from '@/lib/analytics';

vi.mock('@/context/ConsentContext', () => ({
  useConsent: vi.fn(),
}));

vi.mock('@/lib/analytics', () => ({
  isGaLoaded: vi.fn(),
  trackPageView: vi.fn(),
}));

type ConsentValue = 'unset' | 'granted' | 'denied';

function mockConsent(consent: ConsentValue) {
  vi.mocked(useConsent).mockReturnValue({
    consent,
    hydrated: true,
    grant: vi.fn(),
    decline: vi.fn(),
    clearConsent: vi.fn(),
  });
}

describe('AnalyticsListener', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('never calls trackPageView on a route change while consent is unset or denied', async () => {
    for (const consent of ['unset', 'denied'] as const) {
      vi.clearAllMocks();
      mockConsent(consent);
      vi.mocked(isGaLoaded).mockReturnValue(false);

      const router = createMemoryRouter([{ path: '*', element: <AnalyticsListener /> }], {
        initialEntries: ['/'],
      });
      render(<RouterProvider router={router} />);

      await act(async () => {
        await router.navigate('/about');
      });

      expect(trackPageView).not.toHaveBeenCalled();
    }
  });

  it('calls trackPageView with pathname + hash on both a pathname change and a hash-only change', async () => {
    mockConsent('granted');
    vi.mocked(isGaLoaded).mockReturnValue(true);

    const router = createMemoryRouter([{ path: '*', element: <AnalyticsListener /> }], {
      initialEntries: ['/'],
    });
    render(<RouterProvider router={router} />);

    // Mount effect itself fires for the initial location — clear before the
    // two navigations we actually want to assert on.
    vi.mocked(trackPageView).mockClear();

    // Pathname change.
    await act(async () => {
      await router.navigate('/about');
    });
    expect(trackPageView).toHaveBeenLastCalledWith('/about');

    // Hash-only change (pathname stays the same).
    await act(async () => {
      await router.navigate('/about#projects');
    });
    expect(trackPageView).toHaveBeenLastCalledWith('/about#projects');
  });

  it('re-fires for the current location when consent transitions to granted mid-session with no route change', async () => {
    mockConsent('unset');
    vi.mocked(isGaLoaded).mockReturnValue(true);

    const { rerender } = render(
      <MemoryRouter initialEntries={['/privacy']}>
        <AnalyticsListener />
      </MemoryRouter>,
    );
    expect(trackPageView).not.toHaveBeenCalled();

    mockConsent('granted');
    rerender(
      <MemoryRouter initialEntries={['/privacy']}>
        <AnalyticsListener />
      </MemoryRouter>,
    );

    expect(trackPageView).toHaveBeenCalledWith('/privacy');
  });
});
