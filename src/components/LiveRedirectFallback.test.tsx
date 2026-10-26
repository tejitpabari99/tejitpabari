// src/components/LiveRedirectFallback.test.tsx
//
// Round 3.1 restoration of the /live subsystem. Mocks trackEvent and
// window.location.replace; renders with fixture to/label props; asserts
// both are called (or, for an internal `to`, that trackEvent is NOT
// called) exactly as documented, and that the tracking call — when it
// fires — is not skipped or deferred past the navigation call (asserted
// via call order, not just call count).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveRedirectFallback } from './LiveRedirectFallback';
import { trackEvent } from '@/lib/analytics';

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

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

  it('fires trackEvent exactly once with the correct outbound_click/live_redirect args when "to" is an external URL', () => {
    render(<LiveRedirectFallback to="https://app.meetjuno.health" label="Juno" />);

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('outbound_click', {
      url: 'https://app.meetjuno.health',
      context: 'live_redirect',
      label: 'Juno',
    });
  });

  it('does NOT call trackEvent when "to" is an internal path (the no-live-field detail-page fallback)', () => {
    render(<LiveRedirectFallback to="/projects/juno" label="Juno" />);

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('calls window.location.replace exactly once with the same `to` value, for an external URL', () => {
    render(<LiveRedirectFallback to="https://app.meetjuno.health" label="Juno" />);

    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledWith('https://app.meetjuno.health');
  });

  it('calls window.location.replace exactly once for an internal path too', () => {
    render(<LiveRedirectFallback to="/projects/juno" label="Juno" />);

    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledWith('/projects/juno');
  });

  it('fires the tracking call before (not after) the navigation call — call order matters, not just count', () => {
    const order: string[] = [];
    vi.mocked(trackEvent).mockImplementation(() => {
      order.push('track');
    });
    replaceSpy.mockImplementation(() => {
      order.push('navigate');
    });

    render(<LiveRedirectFallback to="https://app.meetjuno.health" label="Juno" />);

    expect(order).toEqual(['track', 'navigate']);
  });

  it('renders the fallback copy naming the label and a manual link to `to`, for the case navigation does not fire', () => {
    render(<LiveRedirectFallback to="https://app.meetjuno.health" label="Juno" />);

    expect(screen.getByText(/Redirecting you to Juno/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /click here/i })).toHaveAttribute('href', 'https://app.meetjuno.health');
  });
});
