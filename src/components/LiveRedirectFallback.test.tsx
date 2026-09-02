// src/components/LiveRedirectFallback.test.tsx
//
// Task 23 per .dev/website-revamp/04-projects-research-pages/TASKS.md —
// covers Task 11's acceptance criteria: mock trackEvent and
// window.location.replace; render with fixture to/label props; assert
// both are called exactly once with the correct arguments, and that the
// tracking call is not skipped or deferred past the navigation call
// (asserted via call order, not just call count).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LiveRedirectFallback } from './LiveRedirectFallback';
import { trackEvent } from '@/lib/analytics';

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

// LiveRedirectFallback renders a BackButton (react-router-dom <Link>), so
// every render needs a Router context, same as other component tests.
function renderFallback(props: React.ComponentProps<typeof LiveRedirectFallback>) {
  return render(
    <MemoryRouter>
      <LiveRedirectFallback {...props} />
    </MemoryRouter>,
  );
}

describe('LiveRedirectFallback', () => {
  const originalLocation = window.location;
  let replaceSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom's real window.location.replace is non-configurable (vi.spyOn
    // throws "Cannot redefine property: replace") and, if actually
    // invoked, logs "Not implemented: navigation". Swap the whole
    // `window.location` object for a stub with a mockable `replace`,
    // restored in afterEach — the same technique used to stub
    // non-configurable browser globals elsewhere in this codebase.
    replaceSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, replace: replaceSpy },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  it('fires trackEvent exactly once with the correct outbound_click/live_redirect args on mount', () => {
    renderFallback({ to: 'https://app.meetjuno.health', label: 'Juno' });

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('outbound_click', {
      url: 'https://app.meetjuno.health',
      context: 'live_redirect',
      label: 'Juno',
    });
  });

  it('calls window.location.replace exactly once with the same `to` value', () => {
    renderFallback({ to: 'https://app.meetjuno.health', label: 'Juno' });

    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledWith('https://app.meetjuno.health');
  });

  it('fires the tracking call before (not after) the navigation call — call order matters, not just count', () => {
    const order: string[] = [];
    vi.mocked(trackEvent).mockImplementation(() => {
      order.push('track');
    });
    replaceSpy.mockImplementation(() => {
      order.push('navigate');
    });

    renderFallback({ to: 'https://app.meetjuno.health', label: 'Juno' });

    expect(order).toEqual(['track', 'navigate']);
  });

  it('renders the fallback copy naming the label and a manual link to `to`, for the case navigation does not fire', () => {
    renderFallback({ to: 'https://app.meetjuno.health', label: 'Juno' });

    expect(screen.getByText(/Redirecting you to Juno/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /click here/i })).toHaveAttribute(
      'href',
      'https://app.meetjuno.health',
    );
  });

  it("passes backTo through to BackButton's `to` prop when provided", () => {
    renderFallback({ to: 'https://app.meetjuno.health', label: 'Juno', backTo: '/projects/juno' });
    expect(screen.getByRole('link', { name: /Back/i })).toHaveAttribute('href', '/projects/juno');
  });

  it("falls back to BackButton's own default ('/') when backTo is omitted", () => {
    renderFallback({ to: 'https://app.meetjuno.health', label: 'Juno' });
    expect(screen.getByRole('link', { name: /Back/i })).toHaveAttribute('href', '/');
  });
});
