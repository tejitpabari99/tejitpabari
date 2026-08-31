// src/lib/analytics.ts
//
// GA4 loader/tracker. Must be importable during vite-react-ssg's build-time
// Node render without touching `window`/`document` at module scope — all such
// access lives inside functions only ever called from event handlers and
// effects, never from module top level.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

let gaLoaded = false;

function shouldLoadGa(): boolean {
  if (import.meta.env.DEV) return false; // never in dev, regardless of config — guard 1
  if (!GA_MEASUREMENT_ID) return false;  // never without a configured ID — guard 2
  return true;
}

/** Idempotent: calling this more than once injects exactly one <script> tag
 *  and issues exactly one 'config' call. */
export function loadGa(): void {
  if (gaLoaded) return;
  if (!shouldLoadGa()) return;

  window.dataLayer = window.dataLayer ?? [];
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  // send_page_view: false is load-bearing — GA4's automatic page view fires
  // once on this config call; AnalyticsListener sends every page view
  // manually (including the first), so leaving the automatic one on would
  // double-count the landing page.
  gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  gaLoaded = true;
}

export function isGaLoaded(): boolean {
  return gaLoaded;
}

export function trackPageView(path: string): void {
  if (!gaLoaded || typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

/**
 * The one function SP03/SP04 call for every event beyond pageviews. Silently
 * a no-op whenever GA isn't loaded — dev mode, no measurement ID configured,
 * or the visitor declined/hasn't yet accepted analytics — so call sites never
 * need to check `useConsent()` themselves before calling this.
 */
export type AnalyticsEventName =
  | 'outbound_click'
  | 'project_card_click'
  | 'resume_click'
  | 'search_query'
  | 'section_view';

export function trackEvent(
  name: AnalyticsEventName,
  params: Record<string, string | number | boolean> = {},
): void {
  if (!gaLoaded || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
