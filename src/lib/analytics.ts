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

let gaScriptInjected = false; // has the gtag.js <script> ever been appended — true forever once set
let gaEnabled = false;        // should hits be sent right now — this is what clear/re-accept toggles

function shouldLoadGa(): boolean {
  if (import.meta.env.DEV) return false; // never in dev, regardless of config — guard 1
  if (!GA_MEASUREMENT_ID) return false;  // never without a configured ID — guard 2
  return true;
}

/** Idempotent for script injection: calling this more than once never injects
 *  a second <script> tag. Also the re-enable path after disableGa() — see
 *  below — so it must not assume it's always the first call. */
export function loadGa(): void {
  if (!shouldLoadGa()) return;

  if (GA_MEASUREMENT_ID) {
    // Clears any opt-out left by a prior disableGa() in this same session,
    // so re-accepting after clearing actually resumes sending hits.
    delete (window as unknown as Record<string, boolean>)[`ga-disable-${GA_MEASUREMENT_ID}`];
  }
  gaEnabled = true;
  if (gaScriptInjected) return; // script already exists; re-enabling only, done above

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

  gaScriptInjected = true;
}

export function isGaLoaded(): boolean {
  return gaEnabled; // unchanged signature/callers (AnalyticsListener, trackEvent, trackPageView)
}

const GA_COOKIE_PREFIXES = ['_ga', '_gid', '_gat'];

function deleteGaCookies(): void {
  const names = document.cookie
    .split(';')
    .map((entry) => entry.split('=')[0]?.trim())
    .filter((name): name is string => !!name && GA_COOKIE_PREFIXES.some((p) => name.startsWith(p)));

  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  // Covers both a bare host (localhost, a Firebase preview channel host) and
  // a real apex/www split (tejitpabari.com / www.tejitpabari.com) without
  // guessing at a public-suffix list — GA itself only ever sets cookies
  // scoped to one of these two shapes.
  const registrableDomain = parts.length > 2 ? `.${parts.slice(-2).join('.')}` : `.${hostname}`;

  for (const name of names) {
    for (const domain of [undefined, hostname, registrableDomain]) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;${
        domain ? ` domain=${domain};` : ''
      }`;
    }
  }
}

/**
 * Called from ConsentContext.clearConsent() (src/context/ConsentContext.tsx).
 * Stops Google Analytics from sending any further hits for the rest of this
 * page session, using gtag.js's own documented opt-out flag
 * (window['ga-disable-<MEASUREMENT_ID>'] = true — the same mechanism behind
 * Google's official "Google Analytics Opt-out Browser Add-on"), and removes
 * any Google Analytics cookies already set on this device. Takes effect
 * immediately; no reload needed, and none is used — a reload would not do
 * anything a plain flag-and-cookie-sweep can't already do here.
 *
 * What this does NOT, and cannot, undo: any pageview or event already sent
 * to Google before this runs. That data left the browser the moment it was
 * sent. No client-side action, reload included, can recall it — this is a
 * property of any remote analytics service, not a gap in this
 * implementation. The copy on /privacy states this plainly (PRD §4.4).
 */
export function disableGa(): void {
  gaEnabled = false;
  if (GA_MEASUREMENT_ID) {
    (window as unknown as Record<string, boolean>)[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
  }
  deleteGaCookies();
}

export function trackPageView(path: string): void {
  if (!gaEnabled || typeof window.gtag !== 'function') return;
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
  | 'section_view'
  // Round 3.1 (/live subsystem restoration): fired when a visitor clicks
  // a detail page's "Live" button. Deliberately distinct from
  // outbound_click — that internal href (/projects/<slug>/live or
  // /research/<slug>/live) is never itself the outbound destination, only
  // a stable, owner-controlled indirection to one (see
  // LiveRedirectFallback, which fires its own outbound_click/live_redirect
  // event once the actual external destination is known).
  | 'live_link_click';

export function trackEvent(
  name: AnalyticsEventName,
  params: Record<string, string | number | boolean> = {},
): void {
  if (!gaEnabled || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
