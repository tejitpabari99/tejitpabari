import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ConsentContext.tsx reads GA_MEASUREMENT_ID at analytics.ts's module scope,
// so each test gets a fresh module graph with DEV=false + a valid ID stubbed
// — the *permissive* guard state. This makes the decline test meaningful: if
// decline() ever accidentally called loadGa(), it would actually succeed and
// inject a script, so "no script exists" is real proof decline() never calls
// it, not an artifact of the dev guard blocking everything anyway.
async function freshModules() {
  vi.resetModules();
  vi.stubEnv('DEV', false);
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
  const analytics = await import('@/lib/analytics');
  const { ConsentProvider, useConsent } = await import('@/context/ConsentContext');
  const { ConsentBanner } = await import('@/components/ConsentBanner');
  const { PrivacyPage } = await import('@/pages/PrivacyPage');
  return { analytics, ConsentProvider, useConsent, ConsentBanner, PrivacyPage };
}

function ConsentReader({
  useConsent,
}: {
  useConsent: () => { consent: string };
}) {
  const { consent } = useConsent();
  return <div data-testid="consent-value">{consent}</div>;
}

describe('ConsentContext / ConsentBanner', () => {
  afterEach(() => {
    localStorage.clear();
    document.head.querySelectorAll('script[src*="googletagmanager"]').forEach((el) => el.remove());
    delete (window as unknown as { gtag?: unknown }).gtag;
    delete (window as unknown as { dataLayer?: unknown }).dataLayer;
    delete (window as unknown as { [k: string]: unknown })['ga-disable-G-TEST123'];
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('clicking Decline sets denied in storage, keeps GA unloaded, and injects no GA script — the zero-cookies proof', async () => {
    const { ConsentProvider, ConsentBanner, analytics } = await freshModules();
    localStorage.clear();

    render(
      <MemoryRouter>
        <ConsentProvider>
          <ConsentBanner />
        </ConsentProvider>
      </MemoryRouter>,
    );

    const declineButton = await screen.findByRole('button', { name: 'Decline' });
    fireEvent.click(declineButton);

    expect(localStorage.getItem('tejitpabari:consent')).toBe('denied');
    expect(analytics.isGaLoaded()).toBe(false);
    // The actual proof, not an inference from the flag: no GA script element
    // exists anywhere in document.head, and no cookie was set either.
    expect(document.head.querySelector('script[src*="googletagmanager"]')).toBeNull();
    expect(document.cookie).toBe('');
  });

  it('clicking Accept calls loadGa exactly once', async () => {
    const { ConsentProvider, ConsentBanner, analytics } = await freshModules();
    localStorage.clear();
    const loadGaSpy = vi.spyOn(analytics, 'loadGa');

    render(
      <MemoryRouter>
        <ConsentProvider>
          <ConsentBanner />
        </ConsentProvider>
      </MemoryRouter>,
    );

    const acceptButton = await screen.findByRole('button', { name: 'Accept' });
    fireEvent.click(acceptButton);

    expect(loadGaSpy).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('tejitpabari:consent')).toBe('granted');
    expect(analytics.isGaLoaded()).toBe(true);
  });

  it('a returning visitor with granted consent pre-seeded gets GA loaded on mount, with no click required', async () => {
    localStorage.setItem('tejitpabari:consent', 'granted');
    const { ConsentProvider, ConsentBanner, analytics } = await freshModules();

    render(
      <MemoryRouter>
        <ConsentProvider>
          <ConsentBanner />
        </ConsentProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(analytics.isGaLoaded()).toBe(true));
    // Returning visitor already decided — banner must not reappear.
    expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull();
  });

  it('clearConsent resets storage and consent to unset, and the banner reappears without a reload', async () => {
    localStorage.clear();
    const { ConsentProvider, useConsent, ConsentBanner } = await freshModules();

    function Harness() {
      const { decline } = useConsent();
      return (
        <>
          <ConsentReader useConsent={useConsent} />
          <button type="button" onClick={decline}>
            test-decline
          </button>
        </>
      );
    }

    function ClearButton() {
      const { clearConsent } = useConsent();
      return (
        <button type="button" onClick={clearConsent}>
          test-clear
        </button>
      );
    }

    render(
      <MemoryRouter>
        <ConsentProvider>
          <Harness />
          <ClearButton />
          <ConsentBanner />
        </ConsentProvider>
      </MemoryRouter>,
    );

    // Settle into a non-'unset' state first, so clearConsent's effect is observable.
    fireEvent.click(screen.getByText('test-decline'));
    await waitFor(() => expect(screen.getByTestId('consent-value').textContent).toBe('denied'));
    expect(localStorage.getItem('tejitpabari:consent')).toBe('denied');
    expect(screen.queryByRole('button', { name: 'Decline' })).toBeNull(); // banner hidden once decided

    fireEvent.click(screen.getByText('test-clear'));

    expect(localStorage.getItem('tejitpabari:consent')).toBeNull();
    await waitFor(() => expect(screen.getByTestId('consent-value').textContent).toBe('unset'));
    expect(await screen.findByRole('button', { name: 'Decline' })).toBeInTheDocument();
  });

  it('clearConsent after granting also disables GA and removes GA cookies (the teardown fix, PRD 05 §4.1 Hypothesis 3)', async () => {
    localStorage.clear();
    const { ConsentProvider, useConsent, analytics } = await freshModules();

    function Harness() {
      const { consent, grant, clearConsent } = useConsent();
      return (
        <>
          <div data-testid="consent-value">{consent}</div>
          <button type="button" onClick={grant}>test-grant</button>
          <button type="button" onClick={clearConsent}>test-clear</button>
        </>
      );
    }

    render(
      <MemoryRouter>
        <ConsentProvider>
          <Harness />
        </ConsentProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('test-grant'));
    await waitFor(() => expect(analytics.isGaLoaded()).toBe(true));

    // Simulate GA having actually set a cookie during the granted phase.
    document.cookie = '_ga=GA1.2.123456789.987654321; path=/';
    expect(document.cookie).toContain('_ga=');

    fireEvent.click(screen.getByText('test-clear'));

    expect(analytics.isGaLoaded()).toBe(false);
    expect((window as unknown as { [k: string]: unknown })['ga-disable-G-TEST123']).toBe(true);
    expect(document.cookie).not.toContain('_ga=');
    expect(localStorage.getItem('tejitpabari:consent')).toBeNull();
  });

  it('the real "Clear my choice" button on PrivacyPage disables GA and removes GA cookies end to end', async () => {
    localStorage.setItem('tejitpabari:consent', 'granted');
    document.cookie = '_ga=GA1.2.123456789.987654321; path=/';
    const { ConsentProvider, ConsentBanner, PrivacyPage } = await freshModules();

    render(
      <MemoryRouter>
        <ConsentProvider>
          <PrivacyPage />
          <ConsentBanner />
        </ConsentProvider>
      </MemoryRouter>,
    );

    const clearButton = await screen.findByRole('button', { name: 'Clear my choice' });
    fireEvent.click(clearButton);

    expect(localStorage.getItem('tejitpabari:consent')).toBeNull();
    expect(document.cookie).not.toContain('_ga=');
    expect((window as unknown as { [k: string]: unknown })['ga-disable-G-TEST123']).toBe(true);
    expect(screen.queryByRole('button', { name: 'Clear my choice' })).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Cleared.');
  });
});
