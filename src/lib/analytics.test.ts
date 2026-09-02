import { describe, it, expect, vi, afterEach } from 'vitest';

// analytics.ts reads `import.meta.env.DEV` / `VITE_GA_MEASUREMENT_ID` and its
// own `gaLoaded` state at module scope, so each scenario below needs a fresh
// module instance imported *after* the relevant env vars are stubbed.
async function freshAnalytics(dev: boolean, gaId: string | undefined) {
  vi.resetModules();
  vi.stubEnv('DEV', dev);
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', gaId ?? '');
  return import('./analytics');
}

function scriptCount() {
  return document.head.querySelectorAll('script[src*="googletagmanager"]').length;
}

describe('analytics.ts', () => {
  afterEach(() => {
    document.head.querySelectorAll('script[src*="googletagmanager"]').forEach((el) => el.remove());
    delete (window as unknown as { gtag?: unknown }).gtag;
    delete (window as unknown as { dataLayer?: unknown }).dataLayer;
    delete (window as unknown as Record<string, boolean>)['ga-disable-G-VALID123'];
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('guard 1 alone (DEV=true) blocks loadGa even with a valid measurement ID', async () => {
    const { loadGa, isGaLoaded } = await freshAnalytics(true, 'G-VALID123');
    loadGa();
    expect(scriptCount()).toBe(0);
    expect(isGaLoaded()).toBe(false);
  });

  it('guard 2 alone (no measurement ID) blocks loadGa even with DEV=false', async () => {
    const { loadGa, isGaLoaded } = await freshAnalytics(false, undefined);
    loadGa();
    expect(scriptCount()).toBe(0);
    expect(isGaLoaded()).toBe(false);
  });

  it('DEV=false + valid ID: loadGa injects exactly one script, configs gtag, and sets isGaLoaded true', async () => {
    const { loadGa, isGaLoaded } = await freshAnalytics(false, 'G-VALID123');
    loadGa();
    expect(scriptCount()).toBe(1);
    const script = document.head.querySelector('script[src*="googletagmanager"]') as HTMLScriptElement;
    expect(script.src).toContain('G-VALID123');
    expect(window.dataLayer).toBeDefined();
    // The internal gtag pushes each call's args onto dataLayer.
    const configCall = window.dataLayer!.find(
      (entry) => Array.isArray(entry) && entry[0] === 'config',
    ) as unknown[] | undefined;
    expect(configCall).toEqual(['config', 'G-VALID123', { send_page_view: false }]);
    expect(isGaLoaded()).toBe(true);
  });

  it('loadGa is idempotent: a second call injects zero additional scripts and issues zero additional config calls', async () => {
    const { loadGa } = await freshAnalytics(false, 'G-VALID123');
    loadGa();
    expect(scriptCount()).toBe(1);
    const gtagSpy = vi.spyOn(window, 'gtag');
    loadGa();
    expect(scriptCount()).toBe(1);
    expect(gtagSpy).not.toHaveBeenCalled();
  });

  it('trackEvent never calls window.gtag when GA is not loaded (checked for two event names)', async () => {
    const { trackEvent } = await freshAnalytics(true, 'G-VALID123'); // DEV=true => gaLoaded stays false
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;
    trackEvent('outbound_click', { url: 'https://example.com', context: 'content_external_link', label: 'x' });
    trackEvent('resume_click', { source: 'hero', url: 'https://example.com/resume.pdf' });
    expect(gtagSpy).not.toHaveBeenCalled();
  });

  it("trackEvent('outbound_click', ...) with GA loaded calls window.gtag with the exact renamed context string", async () => {
    const { loadGa, trackEvent } = await freshAnalytics(false, 'G-VALID123');
    loadGa();
    const gtagSpy = vi.spyOn(window, 'gtag');
    trackEvent('outbound_click', {
      url: 'https://example.com',
      context: 'content_external_link',
      label: 'example',
    });
    expect(gtagSpy).toHaveBeenCalledWith('event', 'outbound_click', {
      url: 'https://example.com',
      context: 'content_external_link',
      label: 'example',
    });
  });

  it('trackPageView never calls window.gtag when GA is not loaded', async () => {
    const { trackPageView } = await freshAnalytics(true, 'G-VALID123'); // DEV=true => gaLoaded stays false
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;
    trackPageView('/privacy');
    expect(gtagSpy).not.toHaveBeenCalled();
  });

  it('trackPageView calls window.gtag with a page_view event when GA is loaded', async () => {
    const { loadGa, trackPageView } = await freshAnalytics(false, 'G-VALID123');
    loadGa();
    const gtagSpy = vi.spyOn(window, 'gtag');
    trackPageView('/privacy');
    expect(gtagSpy).toHaveBeenCalledWith('event', 'page_view', {
      page_path: '/privacy',
      page_location: window.location.href,
      page_title: document.title,
    });
  });

  it('disableGa sets the ga-disable-<ID> window flag and flips isGaLoaded to false', async () => {
    const { loadGa, disableGa, isGaLoaded } = await freshAnalytics(false, 'G-VALID123');
    loadGa();
    expect(isGaLoaded()).toBe(true);
    disableGa();
    expect(isGaLoaded()).toBe(false);
    expect((window as unknown as Record<string, boolean>)['ga-disable-G-VALID123']).toBe(true);
  });

  it('disableGa deletes pre-set _ga/_gid cookies', async () => {
    const { loadGa, disableGa } = await freshAnalytics(false, 'G-VALID123');
    loadGa();
    document.cookie = '_ga=GA1.2.123456789.987654321; path=/';
    document.cookie = '_gid=GA1.2.111111111.222222222; path=/';
    expect(document.cookie).toContain('_ga=');
    expect(document.cookie).toContain('_gid=');
    disableGa();
    expect(document.cookie).not.toContain('_ga=');
    expect(document.cookie).not.toContain('_gid=');
  });

  it('loadGa after disableGa re-enables (isGaLoaded true again) without injecting a second script', async () => {
    const { loadGa, disableGa, isGaLoaded } = await freshAnalytics(false, 'G-VALID123');
    loadGa();
    expect(scriptCount()).toBe(1);
    disableGa();
    expect(isGaLoaded()).toBe(false);
    loadGa();
    expect(isGaLoaded()).toBe(true);
    expect(scriptCount()).toBe(1);
  });
});
