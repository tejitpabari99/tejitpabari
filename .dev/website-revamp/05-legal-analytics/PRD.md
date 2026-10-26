# PRD — Sub-project 05: Legal Pages & Analytics

**Repo:** `tejitpabari/tejitpabari` (branch `website-revamp`)
**Depends on:** 01 (shell, router, `PageShell`, Tailwind tokens, `.gitignore`, `Footer`, `routes.tsx`)
**Consumed by:** 03 (Contact section, résumé/social clicks, project-card clicks, landing scroll depth), 04 (search queries, card clicks, outbound clicks, the `/live` route registration this PRD's fragility guard lives near), 06 (`RouteMeta` — consumed here, not built here)
**Source of truth:** `/root/projects/tejitpabari/.dev/website-revamp/BRIEF.md` §2/§3 "Legal & analytics" and "Contact facts" — every decision cited below as "brief §N" is settled there and not re-opened here.
**Status:** Draft, awaiting owner approval. **All legal copy in §4.5 is proposed text, not final** — it has not been reviewed by a lawyer and must not ship without the owner reading every word (§8).

---

## 1. Problem

Three things are missing before any other sub-project can ship real content:

1. **Nobody can email Tejit from the site without a scrapeable address landing in prerendered HTML.** SP03's Contact section and the `/privacy`/`/terms` "Contact" sections all need a working `mailto:` link, but every route on this site is static HTML generated at build time (SP01 §1) — a plain `mailto:tejitpabari99@gmail.com` string anywhere in JSX renders straight into that HTML and is trivially scraped.
2. **There is no analytics layer, and the one the brief specifies is unusually information-dense for a portfolio site** — not just pageviews, but which live-project link gets clicked, which project card gets clicked, résumé clicks, landing-page scroll depth, and (called out as the single highest-value signal in brief §2/§3) the literal text people type into the search box on `/projects`. SP03 and SP04 both need one settled function to call for all of this, not five bespoke `gtag` call sites invented independently by two different sub-projects.
3. **`/privacy` and `/terms` are SP01 placeholders with no real text**, and the real text has a structural problem the brief calls out explicitly: this site is a **portfolio that hosts other people's — well, Tejit's own — sub-projects** under `/projects/*/live` (brief §2, "Policy scope"). A privacy/terms page for a single product (which is what `juno-landing-page`'s pages are, and the direct model for this one) can state "no forms" once and mean it forever. A page for a portfolio that will keep growing new hosted mini-projects underneath it cannot make that same claim as a one-time fact — it has to say something that stays true as `/projects/sample-project/live`, and eventually real hosted projects, land under the same domain. Getting this scope question right, in writing, is this sub-project's least copy-and-paste-able piece of work.

`juno-landing-page` already solved the *mechanism* for all three (obfuscated email, `ConsentContext`, `analytics.ts`, the `Section`-helper legal-page pattern) — confirmed by reading its actual source, not assumed from its own PRD. What's new here is: porting the mechanism with this site's real facts, extending the event catalogue for a heavier tracking spec than `juno-landing-page` needed, and writing legal copy whose central claim ("no forms," brief §2/§3) is engineered to degrade loudly rather than silently as the site grows.

## 2. Goals

- `src/config/contact.ts` + `src/hooks/useContactMailto.ts`, ported from `juno-landing-page`, holding Tejit's real email, LinkedIn, and GitHub facts (brief's "Contact facts"), with the same hydration-safe guarantee: **no plain, greppable email address ever reaches a `<script>`-disabled view of the prerendered HTML**, verified by inspecting a real `dist/` build.
- A `ConsentContext` + `ConsentBanner`, ported and re-skinned to the techfolio palette (SP01 §4.4 tokens), wired into SP01's `PageShell`. Decline means zero analytics cookies — not a documentation claim, a test that proves it (§7).
- `src/lib/analytics.ts` exposing exactly one function siblings call for everything beyond pageviews: `trackEvent(name, params)`. Pageviews (including client-side route changes) are handled automatically by a mounted listener SP03/SP04 never have to call.
- The full event catalogue from brief §2/§3 — pageviews, outbound clicks, project-card clicks, résumé clicks, search queries, section scroll depth — each with a concrete event name and parameter shape SP03/SP04 can code against without guessing.
- `VITE_GA_MEASUREMENT_ID` wired with `juno-landing-page`'s two independent dev guards, `.env.example` committed with no real value.
- `/privacy` and `/terms`, hand-written TSX, with real copy for tejitpabari.com specifically — no accounts, no login, no forms *today*, GA4-with-consent, Firebase's automatic server logs — that states the hosted-sub-project scope question head-on and is engineered so the "no forms" claim's decay is a loud, findable event, not a quiet lie.
- A code comment at the `/live` route registration site (SP01's `src/routes.tsx`) naming the exact claim that breaks the day a hosted `/live` project takes input, plus a documented (if partly manual) mechanical check.
- A recommendation resolving SP01's flagged footer gap (`/privacy`/`/terms` unreachable from the footer).

## 3. Non-Goals

- `RouteMeta` itself — SP06's component. This PRD assumes it exists as `<RouteMeta title description path />` (the exact shape both `juno-landing-page` pages already call it with) and uses it on `/privacy`/`/terms`; if SP06 lands a different signature, those two call sites need a one-line update, not a redesign here.
- The `SearchFilter` component, the project/research `Card` component, and the hero/Contact-section markup — SP03/SP04's scope. This PRD specifies the exact `trackEvent(...)` call SP03/SP04 must make at each interaction site (§4.3), not the components those calls live inside.
- Any consent category beyond "analytics" — there is nothing else on this site that sets a cookie or needs consent (no ads, no embeds, no CMP; same reasoning `juno-landing-page`'s 04 PRD already recorded, §4.8 there).
- GDPR/CCPA compliance tooling (data export/deletion flows, a DPO contact, automated cookie scanning) — disproportionate for a personal site with no accounts and no server-side storage of anything about a visitor. Honest jurisdiction assessment is recorded in §9, not built as a feature.
- A "no forms" enforcement mechanism wired directly into the `build` npm script itself — the mechanism SP04 ultimately builds (`npm run check:no-forms`, §4.7, §9) is its own standalone script, not folded into `build`. (At the time this section was first written, brief §4 excluded CI outright, so the script was manually-run only; the owner has since adopted CI, and SP08's pipeline, `08-ci-deploy-pipeline` §4.2, now runs `check:no-forms` as its own separate step on every PR/merge — still not merged into `build` itself, so a violation names itself distinctly rather than surfacing only as a sub-failure inside a build log.) That script's design is SP04's, not built here.
- Lawyer review of the drafted copy in §4.5. Explicitly out of scope and explicitly required before launch (§8).
- Sitemap/OG generation, the sample project, `VITE_SITE_URL` — SP06's scope (SP01 §3 already draws this line; `.env.example` here carries only `VITE_GA_MEASUREMENT_ID`).

---

## 4. Architecture Decisions

### 4.1 `src/config/contact.ts` + `src/hooks/useContactMailto.ts` — email obfuscation

Ported near-verbatim from `juno-landing-page/src/config/contact.ts` and `src/hooks/useContactMailto.ts` (both read in full). The address is the same real address (`tejitpabari99@gmail.com`, brief's "Contact facts"), so the display string needs no change; LinkedIn and GitHub are new exports this site needs that `juno-landing-page`'s version didn't (it has no GitHub link at all).

**`contact.ts`'s full export list, stated explicitly (binding, §9): `CONTACT_EMAIL_DISPLAY`, `getContactEmailAddress()`, `LINKEDIN_URL`, `GITHUB_USERNAME`, `GITHUB_URL`.** This is every identity constant the site has — everything that identifies the person, as opposed to `src/config/links.ts` (SP01-owned), which holds only where the site navigates (`NAV_LINKS`, `FOOTER_LINKS`, `RESUME_URL`). No `src/config/social.ts` is created; SP03's Hero and Contact section import `LINKEDIN_URL`/`GITHUB_URL` from here, not from a separate socials file. See §9.

```ts
// src/config/contact.ts
export const CONTACT_EMAIL_DISPLAY = 'tejitpabari99 _at_ gmail [dot] com';

// Deliberately two separate constants, not one CONTACT_EMAIL string, so nothing
// in this file — or anything importing it without calling the function below —
// contains a plain, greppable "user@domain.tld" pattern.
const EMAIL_USER = 'tejitpabari99';
const EMAIL_DOMAIN = 'gmail.com';

/** Real address, assembled on demand. Only ever called from client-side
 *  effects/handlers (never at render time) — see useContactMailto. */
export function getContactEmailAddress(): string {
  return `${EMAIL_USER}@${EMAIL_DOMAIN}`;
}

// LinkedIn and GitHub are deliberately NOT obfuscated (brief's "Contact facts"):
// a profile URL isn't harvested/spammed the way a mailto address is, so hiding
// it adds friction for zero benefit.
export const LINKEDIN_URL = 'https://www.linkedin.com/in/tejitpabari';
export const GITHUB_USERNAME = 'tejitpabari99';
export const GITHUB_URL = 'https://github.com/tejitpabari99';
```

```ts
// src/hooks/useContactMailto.ts — identical to juno-landing-page, unchanged
import { useEffect, useState } from 'react';
import { getContactEmailAddress } from '@/config/contact';

/**
 * Returns a real `mailto:` href, but only once this has mounted in a real
 * browser. Returns `null` on every render before that — including
 * vite-react-ssg's build-time render pass, which never runs effects. Callers
 * render the obfuscated display text as a plain, non-linked span while this
 * is `null`.
 */
export function useContactMailto(): string | null {
  const [href, setHref] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHref(`mailto:${getContactEmailAddress()}`);
  }, []);
  return href;
}
```

**Hydration-safety property, stated explicitly since SP03 depends on it:** `useContactMailto()` returns `null` on (a) the `vite-react-ssg` build-time Node render, and (b) the first client render before hydration effects run — both of which produce byte-identical output (`null`), so there is no hydration mismatch warning. The real `mailto:` href only exists after the `useEffect` fires, strictly client-side, strictly post-mount. **Consequence for every consumer (SP03's Contact section, both legal pages here):** while `emailHref` is `null`, render `CONTACT_EMAIL_DISPLAY` as a plain, non-linked `<span>` (with `select-all` so a real visitor can still copy it by hand) — never fall back to a real `mailto:` string or the assembled address in that branch, or the whole obfuscation exercise is defeated. This is not a new design decision; it's the exact pattern `juno-landing-page/src/pages/PrivacyPage.tsx` and `TermsPage.tsx` already use at their own "Contact" sections (read directly, lines 168–180 and 111–123 respectively).

**Verification, concretely:** after a `vite-react-ssg build`, `grep -rn "tejitpabari99@gmail" dist/` must return zero hits. `grep -rn "tejitpabari99 _at_ gmail" dist/` should return one hit per page that renders the Contact section (obfuscated display text is fine in static HTML — it's not a valid mailto target for a scraper regex, which is the entire point).

### 4.2 `ConsentContext` + `ConsentBanner`

**`ConsentContext`** ported verbatim in shape from `juno-landing-page/src/context/ConsentContext.tsx` (read in full), with one change: the localStorage key is namespaced to this site.

```tsx
// src/context/ConsentContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadGa } from '@/lib/analytics';

type ConsentValue = 'unset' | 'granted' | 'denied';
const STORAGE_KEY = 'tejitpabari:consent'; // namespaced — this is a different site/property than juno-landing-page's

type ConsentContextShape = {
  consent: ConsentValue;
  hydrated: boolean;
  grant: () => void;
  decline: () => void;
  clearConsent: () => void;
};

const ConsentContext = createContext<ConsentContextShape | null>(null);

function readStoredConsent(): ConsentValue {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'granted' || raw === 'denied' ? raw : 'unset';
  } catch {
    return 'unset'; // private browsing / storage disabled
  }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  // Must start at the literal 'unset' on both the build-time render and the
  // first client render — a synchronous localStorage read as the useState
  // initializer would bake a consent state into prerendered HTML and mismatch
  // on hydration for returning visitors. Resolved post-mount only, below.
  const [consent, setConsent] = useState<ConsentValue>('unset');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredConsent();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(stored);
    setHydrated(true);
    if (stored === 'granted') loadGa();
  }, []);

  function grant(): void {
    // Synchronous, in the click handler — not from an effect keyed on
    // `consent` — because React doesn't guarantee AnalyticsListener's effect
    // runs after this commit; an effect-based load could race the first
    // page_view it's supposed to enable.
    loadGa();
    try {
      localStorage.setItem(STORAGE_KEY, 'granted');
    } catch {
      /* best-effort; consent still applies for this session */
    }
    setConsent('granted');
  }

  function decline(): void {
    try {
      localStorage.setItem(STORAGE_KEY, 'denied');
    } catch {
      /* best-effort */
    }
    setConsent('denied');
  }

  function clearConsent(): void {
    // Implements the "Clear my choice" affordance the /privacy copy promises
    // (§4.5). Resets to the same 'unset' value used at first paint, so
    // ConsentBanner's `!hydrated || consent !== 'unset'` guard shows the
    // banner again on the very next render — no reload needed.
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* best-effort */
    }
    setConsent('unset');
  }

  return (
    <ConsentContext.Provider value={{ consent, hydrated, grant, decline, clearConsent }}>
      {children}
    </ConsentContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConsent(): ConsentContextShape {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}
```

**`ConsentBanner`**, re-skinned from `juno-landing-page`'s raw `border`/`paper`/`muted`/`ink`/`accent` token names to SP01's actual named tokens (`teal-secondary`, `cream`, `body`, `ink`, `teal`) — SP01 §4.4 already defines `maxWidth.content` too, so the banner's width constraint reuses that directly rather than a raw `max-w-*` value:

```tsx
// src/components/ConsentBanner.tsx
import { Link } from 'react-router-dom';
import { useConsent } from '@/context/ConsentContext';

export function ConsentBanner() {
  const { consent, hydrated, grant, decline } = useConsent();
  // `!hydrated` is required, not defensive: without it the banner renders
  // into every prerendered HTML file and flashes for visitors who already
  // decided.
  if (!hydrated || consent !== 'unset') return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-teal-secondary/15 bg-cream/97 px-4 py-4 shadow-panel backdrop-blur-sm sm:px-6">
      <div className="mx-auto flex max-w-content flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-body">
          I use Google Analytics to see whether people find this site — for example, from a
          LinkedIn post. It only runs, and only sets cookies, if you accept. See the{' '}
          <Link to="/privacy" className="underline hover:text-teal-secondary">Privacy Policy</Link>.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={decline}
            className="rounded-full border border-teal-secondary/20 px-4 py-2 text-sm font-semibold text-teal-secondary hover:bg-teal-secondary/8"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={grant}
            className="rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
```

No preference-management UI beyond Accept/Decline — one thing to consent to (analytics), so a multi-category panel would manufacture complexity for a choice that only ever has two outcomes. No third-party CMP, for the same reason `juno-landing-page`'s 04 PRD rejected one (§4.8 there, directly transferable): one tracker, one decision, and a CMP's real value — multi-vendor consent orchestration, IAB/TCF integration — solves a scale of problem this site doesn't have.

**Where it mounts** — SP05 edits SP01's `PageShell.tsx` directly, per the exact hand-off SP01's own PRD names (SP01 §4.6, "Hand-off to SP05"):

```tsx
// src/layout/PageShell.tsx — edited by SP05 (this is SP01's file; SP05 touches
// exactly this, per SP01 §4.6's own documented hand-off, and nothing else in
// SP01's territory)
import { Outlet } from 'react-router-dom';
import { ScrollManager } from '@/lib/ScrollManager';
import { AnalyticsListener } from '@/lib/AnalyticsListener';
import { ConsentProvider } from '@/context/ConsentContext';
import { ConsentBanner } from '@/components/ConsentBanner';
import { Nav } from './Nav';
import { Footer } from './Footer';

export function PageShell() {
  return (
    <ConsentProvider>
      <ScrollManager />
      <AnalyticsListener />
      <Nav />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ConsentBanner />
    </ConsentProvider>
  );
}
```

### 4.3 `src/lib/analytics.ts` — `loadGa()`, pageviews, and the `trackEvent` API

**The real measurement ID is `G-9NLS3NG63M`**, auto-created alongside the Firebase web app the owner registered under the `tejitpabari-99` project (§SP01 4.9). Concretely:

- **`.env.example` (committed)** carries:
  ```
  # GA4 measurement ID. Public identifier, not a secret — it is emitted
  # in the page's own HTML on every load (the gtag.js script URL and the
  # `gtag('config', ...)` call below both put it in plaintext), so shipping
  # it in a committed file changes nothing about its exposure.
  VITE_GA_MEASUREMENT_ID=G-9NLS3NG63M
  ```
- **`.env.local` stays gitignored**, per SP01's `.gitignore` (§4.2 there — `.env.*` ignored, `!.env.example` un-ignored), for anyone who wants to override the value locally (e.g. pointing dev builds at a separate test property) without touching the committed default.
- **The GitHub Actions build must supply this variable** (SP08's CI pipeline, `08-ci-deploy-pipeline` §4.6 — owns the concrete workflow design; SP01 §4.9 only points to it) or GA silently no-ops in production — `shouldLoadGa()` below treats a missing ID exactly like dev mode, so a CI misconfiguration produces a site that looks and works fine with zero analytics, and nothing fails loudly. That's the failure mode worth naming explicitly: a silently-missing analytics ID is exactly the kind of gap that goes unnoticed for months, not a build error someone trips over on day one. **SP08 designs against this directly**: its merge workflow (the one that deploys to the live channel) runs an explicit check step that fails the entire workflow loudly if `vars.VITE_GA_MEASUREMENT_ID` resolves empty, before the build even starts — the PR-preview workflow deliberately carries no such guard, since a preview deploy shouldn't be sending analytics in the first place (SP08 §4.6's stated asymmetry).

**Binding architect decision: no Firebase JS SDK.** Registering a Firebase web app (to get the measurement ID above) also produced a config object (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`, `measurementId`) and the standard `initializeApp`/`getAnalytics` snippet. None of it is used here. The site does not install the `firebase` npm package and does not call `initializeApp` or `getAnalytics` — only the bare `measurementId` string is consumed, loaded through `gtag.js` exactly as designed below. Two reasons, and the second is the one that matters:

1. **Bundle weight.** This site has no backend, no auth, no Firestore, and no Storage — the Firebase JS SDK exists to talk to those services. Installing it to deliver a single `gtag` call the design below already makes without it would be substantial dead weight for zero functional gain.
2. **Correctness.** `getAnalytics()` initializes GA on import/first-call, before any visitor consent exists. That bypasses `ConsentContext` (§4.2) entirely — the whole point of `loadGa()` being an explicit, manually-invoked function is that nothing reaches Google until `consent === 'granted'` (§4.2, §4.3 below). Wiring in `getAnalytics()` later, even "helpfully" to reduce the gtag boilerplate, would silently reintroduce pre-consent tracking. State it plainly here so it doesn't happen by accident.

**`loadGa()` and the two independent dev guards** — ported verbatim from `juno-landing-page/src/lib/analytics.ts` (read in full); the reasoning is not re-derived, only restated because SP03/SP04 need to trust it without reading this file themselves. With a real measurement ID now in place, these two guards are more load-bearing than they were when `GA_MEASUREMENT_ID` was hypothetical — dev traffic can now actually reach a live GA4 property if either guard were ever removed:

```ts
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
  // once on this config call; AnalyticsListener below sends every page view
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
```

**`AnalyticsListener`** — pageviews across client-side route changes, ported in shape from `juno-landing-page/src/lib/AnalyticsListener.tsx`, mirroring SP01's own `ScrollManager` pattern (`useLocation()` + an effect keyed on `pathname`/`hash`) rather than inventing a different mechanism:

```tsx
// src/lib/AnalyticsListener.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useConsent } from '@/context/ConsentContext';
import { isGaLoaded, trackPageView } from '@/lib/analytics';

/** Renders nothing. Sends a GA4 page_view on every route change (including
 *  hash-only anchor navigation), once consent is granted. */
export function AnalyticsListener() {
  const location = useLocation();
  const { consent } = useConsent();

  useEffect(() => {
    if (consent !== 'granted' || !isGaLoaded()) return;
    trackPageView(location.pathname + location.hash);
  }, [location.pathname, location.hash, consent]);

  return null;
}
```

Including `location.hash` matters specifically for this site: SP01's nav is anchor-based (`/#projects`, `/#about`, `/#contact` are all still `/`), so without the hash, every landing-page section "visit" via nav click would look identical to GA4 — the one place this site actually wants pageview granularity, hash is what carries it. `consent` is a dependency deliberately: when `grant()` fires mid-session, this effect re-runs and sends the *current* page as the first real page view, which is what makes send_page_view:false in `loadGa()` correct rather than a lost pageview.

**Consumer summary — pageviews need zero calls from SP03/SP04.** `PageShell` mounts `AnalyticsListener` once; every other event in the catalogue below is a direct `trackEvent(...)` call at the interaction site.

### 4.4 The event catalogue

Six event categories, matching brief §2/§3's list exactly ("pageviews, outbound link clicks…, project card clicks, résumé link clicks, search queries typed on `/projects`…, landing-page section scroll depth"). Pageview mechanics are §4.3 above; the remaining five all go through `trackEvent`.

| Event name | Fired when | Params | Called from |
|---|---|---|---|
| `outbound_click` | Any click that leaves tejitpabari.com: a live-project's external link/redirect, a project/research detail page's `links[]` row entry, hero/Contact social icons (LinkedIn, GitHub) | `{ url: string, context: 'content_external_link' \| 'live_redirect' \| 'hero_social' \| 'contact_social', label: string }` | SP03 (hero/Contact icons), SP04 (card external-link affordance, detail-page `links[]` row, `/live` redirects) |
| `project_card_click` | A project or research card is clicked (routes internally, per brief's "card click always routes to `/<collection>/<slug>`") | `{ slug: string, collection: 'projects' \| 'research', title: string }` | SP03 (featured cards on `/`), SP04 (`/projects`, `/research` grids) |
| `resume_click` | The "Download Resume" / footer "Résumé" link is clicked | `{ source: 'hero' \| 'footer', url: string }` | SP03 (hero CTA), SP01's `Footer` (already built — see §4.6 note below) |
| `search_query` | A settled (debounced) non-empty query on `/projects` or `/research`'s shared `SearchFilter` | `{ collection: 'projects' \| 'research', query: string, result_count: number }` | SP04 |
| `section_view` | A landing-page `<section id>` (`projects`, `work-experience`, `about`, `contact`) is scrolled into view, once per section per page load | `{ section: 'projects' \| 'work-experience' \| 'about' \| 'contact' }` | SP03, via a hook this PRD provides (below) |

**Call-site guidance for SP03/SP04** (illustrative — the actual component markup is their scope, not built here):

```tsx
// project/research card (SP03 featured cards, SP04 grid cards)
<Link
  to={`/${collection}/${slug}`}
  onClick={() => trackEvent('project_card_click', { slug, collection, title })}
>
  …
</Link>
```

```tsx
// a project's external link-row entry or /live redirect shortcut (SP04)
<a
  href={href}
  target="_blank"
  rel="noreferrer"
  onClick={() => trackEvent('outbound_click', { url: href, context: 'content_external_link', label })}
>
  …
</a>
```

```tsx
// résumé CTA (SP03 hero)
<a
  href={RESUME_URL}
  target="_blank"
  rel="noreferrer"
  onClick={() => trackEvent('resume_click', { source: 'hero', url: RESUME_URL })}
>
  Download Resume
</a>
```

```tsx
// SearchFilter (SP04) — debounced so a settled query is tracked once, not
// per keystroke; also disclosed in /privacy §4.5, since this is typed input.
useEffect(() => {
  if (!query.trim()) return;
  const handle = setTimeout(() => {
    trackEvent('search_query', {
      collection,
      query: query.trim(),
      result_count: results.length,
    });
  }, 600);
  return () => clearTimeout(handle);
}, [query, results.length, collection]);
```

**`useSectionViewTracking`** — built here (SP05), consumed by SP03 on `HomePage`. IntersectionObserver-based, dedupes per section per page load so scrolling up and down past a section doesn't refire it:

```ts
// src/lib/useSectionViewTracking.ts
import { useEffect, useRef } from 'react';
import { trackEvent } from './analytics';

const SECTION_IDS = ['projects', 'work-experience', 'about', 'contact'] as const;

/** Mount once on HomePage. Fires `section_view` the first time each of the
 *  four landing sections crosses 40% into the viewport — a reasonable proxy
 *  for "the visitor actually saw this section," which is what "scroll depth"
 *  cashes out to on a single-page landing layout like this one. */
export function useSectionViewTracking(): void {
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting && !seen.current.has(id)) {
            seen.current.add(id);
            trackEvent('section_view', { section: id });
          }
        }
      },
      { threshold: 0.4 },
    );
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);
}
```

Depends on SP01's four `<section id="…">` blocks existing on `HomePage` with those exact ids (SP01 §4.7 already establishes this — SP03 doesn't touch the ids without a reason, since `Nav`'s scroll math also depends on them, so this hook rides the same existing contract for free).

**Does search-query text raise a disclosure concern?** Yes, addressed directly rather than hand-waved: unlike a page click, a search query is freeform typed text, and while realistically it's someone typing "health" or "maps," nothing prevents a visitor from typing something personal into that box. `/privacy` (§4.5) discloses this explicitly, in its own subsection, rather than folding it silently into the generic "Analytics" section — the same "narrow and true, not broad and hedged" standard the brief holds the whole page to. The mitigation is disclosure, not redaction: this PRD does not attempt to detect/strip PII-shaped strings from `search_query`'s `query` param (a regex-based PII filter is its own unreliable, false-positive-prone feature, disproportionate for a portfolio's project-name search box) — flagged as accepted, not solved, in §9.

### 4.5 `/privacy` and `/terms` — drafted copy

Both pages are hand-written TSX (SP02 explicitly decided legal pages are not markdown), following the exact `Section({title, children})`-helper pattern `juno-landing-page`'s two pages use — duplicated across the two files rather than shared, matching that source's own choice (a two-page consumer isn't worth extracting a shared component for).

**Assumption stated, not designed here:** both pages render `<RouteMeta title description path />` at the top, matching the exact call shape `juno-landing-page`'s `PrivacyPage.tsx`/`TermsPage.tsx` already use. If SP06's actual `RouteMeta` signature differs, only that one line per page needs updating.

```tsx
// src/pages/PrivacyPage.tsx
import type { ReactNode } from 'react';
import { CONTACT_EMAIL_DISPLAY } from '@/config/contact';
import { useContactMailto } from '@/hooks/useContactMailto';
import { useConsent } from '@/context/ConsentContext';
import { RouteMeta } from '@/components/RouteMeta'; // SP06 — assumed shape, see above

const LAST_UPDATED = '2026-08-30'; // placeholder — owner confirms the real ship date, see §8

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <div className="space-y-3 text-sm leading-6 text-body">{children}</div>
    </section>
  );
}

export function PrivacyPage() {
  const { consent, clearConsent } = useConsent();
  const emailHref = useContactMailto();

  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:px-8">
      <RouteMeta
        title="Privacy Policy"
        description="This is Tejit Pabari's personal portfolio — no company, no accounts, no forms today. Here is what this site (and everything hosted under it) collects, and what your choices are."
        path="/privacy"
      />
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold text-ink">Privacy Policy</h1>
          <p className="text-sm text-slate">Last updated: {LAST_UPDATED}</p>
        </header>
        {/* ...Section blocks below, one per heading in the proposed text... */}
      </div>
    </div>
  );
}
```

`TermsPage.tsx` follows the identical shape (its own local `Section` copy, its own `LAST_UPDATED`, `useContactMailto()` for its own Contact section) — not shown a second time, only the copy differs, below.

---

#### Proposed `/privacy` text

> # Privacy Policy
> *Last updated: 2026-08-30*
>
> This is Tejit Pabari's personal portfolio site. There is no company behind it — it's not a registered business, and there's no "we." This policy explains, in plain language, what this site (and everything hosted directly under it) collects when you visit, and what your choices are.
>
> ## The short version
>
> This site has no accounts, no sign-up, no login, and — as of the date above — no forms anywhere: there's nowhere here for you to type something and submit it to me. The only data involved is: (1) optional analytics, via Google Analytics, which only runs if you accept the banner shown on your first visit, and (2) basic web server logs that Firebase (my hosting provider, part of Google) generates automatically for every request, which I don't actively access, analyze, or build anything on top of.
>
> ## What this covers
>
> This policy covers tejitpabari.com and everything hosted directly under this domain — including project pages I've built and hosted myself at addresses like `/projects/<name>/live`. If a project of mine lives somewhere else — its own domain, like meetjuno.health for Juno — that project has its own privacy policy, and this page doesn't speak for it. I'll link to a project's own policy from its page here whenever that applies.
>
> **This is a living claim, not a one-time fact.** As I add new hosted projects under `/projects/*/live`, some of them may eventually need to collect something this page doesn't currently describe — for example, an input box. If that happens, I'll update this page (and that project's own writeup) before that project goes live, not after. If you're reading this and a project you're using seems to ask for something not described here, that's a bug in this page, not a hidden feature — email me (below).
>
> ## What this site does not do
>
> - No user accounts or login
> - No forms of any kind, anywhere on the domain, as of the date above — nothing here to type into and submit
> - No comments, uploads, or user-generated content
> - No database storing anything about you
> - No selling or sharing of data with anyone, ever
> - No advertising, ad tracking, or retargeting
>
> ## What this site does collect
>
> ### Analytics (Google Analytics) — only if you accept
>
> I use Google Analytics 4 to see whether people actually find this site — for example, whether a post I share on LinkedIn brings visitors here, and which projects people look at once they arrive. That's the entire reason it's here.
>
> Google Analytics only runs if you click "Accept" on the banner. If you click "Decline," or never respond, Google Analytics does not load and no analytics cookies are set on your device — no exceptions.
>
> If you accept, Google Analytics collects things like: which pages you view, how long you spend on them, roughly which country or city you're visiting from (estimated from your IP address — Google Analytics does not retain your full IP address), the type of device and browser you're using, and how you arrived at the site. It also records a handful of specific interactions I've chosen to track because they tell me something useful: which project or research card you click, which outbound link (a live project, a paper, a GitHub repo, LinkedIn) you follow, whether you click through to my résumé, and — if you use the search box on `/projects` or `/research` — what you typed. I use this to understand what people are actually looking for on this site, not to identify who's looking. Google processes and stores this data as described in Google's own privacy policy (policies.google.com/privacy); I only ever see aggregated reports, never individual browsing history.
>
> **A note on the search box specifically:** it isn't a form. Nothing you type is sent to a server or stored by me directly — it's used locally, in your browser, to filter the list as you type. If you've accepted analytics, the text you search for is also sent to Google Analytics as an event, so I can see what visitors came looking for. Please don't type anything personal into it — it's the one place on this site where typed text can be logged.
>
> You can withdraw consent at any time by clicking "Clear my choice" below, or by clearing this site's browsing data in your browser — either resets your choice and shows the banner again on your next visit.
>
> ### Hosting logs
>
> This site is hosted on Firebase Hosting, a Google product. Like essentially every website host, Firebase Hosting automatically generates basic server logs for requests — typically including your IP address, the page requested, the time of the request, and your browser's user agent. This is standard web infrastructure, not something built or configured specifically for this site, and I don't run any separate tracking, profiling, or analysis on top of it.
>
> ### Your consent choice
>
> When you accept or decline the analytics banner, that choice is saved in your browser's local storage — a small piece of on-device storage, not a cookie sent to any server — so you're not asked again on every visit.
>
> Your saved choice about analytics is **{consent === 'unset' ? 'not yet set' : consent}**. {consent !== 'unset' && 'You can clear it — the button below resets your choice and shows the banner again next time.'}
>
> [Clear my choice] *(button, wired to `clearConsent()` — see §4.2)*
>
> ## Cookies, in full
>
> To be completely explicit: the only cookies this site can set are Google Analytics cookies, and only after you click Accept. Your consent choice itself is stored in local storage, not a cookie. If you decline, this site sets no cookies at all.
>
> ## Outbound links
>
> This site links to other things — GitHub, LinkedIn, project repositories, papers, and other sites I've built, including Juno (meetjuno.health), which has its own separate privacy policy and terms. Once you click through anywhere, you're on someone else's site, governed by their own practices, not this one.
>
> ## Children
>
> This site isn't directed at children and isn't designed to knowingly collect information from anyone, of any age.
>
> ## Changes to this policy
>
> If what this site collects ever changes — including a new hosted project needing something this page doesn't describe today — I'll update this page and the date above before that change ships.
>
> ## Contact
>
> Questions about this policy, or about what's collected? Email me directly: {CONTACT_EMAIL_DISPLAY} (a real link once this page has loaded in your browser).

---

#### Proposed `/terms` text

> # Terms of Use
> *Last updated: 2026-08-30*
>
> This site (tejitpabari.com) is run by me, Tejit Pabari, as a personal portfolio — not a company. By using it, you're agreeing to the following.
>
> ## This isn't professional or medical advice
>
> Nothing on this site — including anything about Juno, an AI companion for medical appointments that I founded and that has its own separate site and terms at meetjuno.health — is medical advice, and nothing here should be used to make a medical, treatment, engineering, or business decision. This site is a portfolio: it describes and links to things I've built. It doesn't provide any medical, clinical, or other professional service itself. If you're looking for Juno as a product, go to meetjuno.health directly — that site's own terms and privacy policy govern using it, not this page.
>
> ## What this covers
>
> These terms cover tejitpabari.com and everything hosted directly under this domain, including project pages I host myself at addresses like `/projects/<name>/live`. A project hosted elsewhere — its own domain or subdomain — is governed by that project's own terms, not this page.
>
> ## No forms, today
>
> As of the date above, this site has no forms, accounts, or logins anywhere, and doesn't accept anything you submit. If a future project I host here needs to change that, I'll update this page — and that project's own page — before it ships, not after. (See `/privacy` for the same commitment, stated in more detail.)
>
> ## No warranty
>
> This site, and every project on it, is provided "as is," without warranty of any kind. I don't promise that anything here is accurate, complete, current, uninterrupted, or error-free. These are personal projects built around a full-time job — please treat them accordingly, and don't rely on them for anything important without checking independently.
>
> ## Individual projects may carry their own licence
>
> Some projects on this site are open source and link to their own repository, which may carry its own software licence. Where that's the case, that project's own licence governs your use of its code — this page doesn't override it. Where a project doesn't state a licence, don't assume you're free to reuse its code.
>
> ## Links to other sites aren't endorsements
>
> This site links to other websites, tools, and profiles, including GitHub and LinkedIn. A link doesn't mean I endorse, vouch for, or am affiliated with the destination beyond what's explicitly stated. I'm not responsible for the content or practices of anything I link to.
>
> ## My views are my own
>
> I have a full-time job as a software engineer at Microsoft. Anything on this site — its content, opinions, and the projects it links to — reflects my own personal work and views, done on my own time; it doesn't represent Microsoft's views or work. Separately, Juno is its own company with its own site; this portfolio only links to it, it isn't where Juno operates.
>
> ## Changes
>
> I can change, update, or take down this site or any project on it at any time, without notice. I can also update these terms; the date above reflects the most recent change.
>
> ## Contact
>
> Questions about these terms? Email me: {CONTACT_EMAIL_DISPLAY} (a real link once this page has loaded in your browser).

*(No "Governing Law" clause — same reasoning `juno-landing-page`'s 04 PRD recorded and the owner already accepted there: no commercial relationship or dispute exposure to allocate for a personal, non-commercial site. Carried forward here, not re-litigated; flag to the owner if they'd rather add one.)*

### 4.6 The footer gap — resolved by SP01

SP01 §9 originally flagged this correctly as an open item: the brief's footer contents ("Research, Résumé, techfolio credit line, copyright," brief §2/§3) don't mention `/privacy`/`/terms`, even though both routes are locked in the same brief's route table and there is no nav/logo affordance to reach them any other way. **This is now resolved on SP01's side (SP01 §9/§4.6): the footer ships as Research · Privacy · Terms · Résumé**, exactly the recommendation this section originally made — a privacy policy and terms page that no in-app control links to is a real defect, not a style nit, and nothing about the brief's silence reads as a deliberate "keep legal pages unlinked" choice.

**Note on how this lands, given SP01/SP02's own resolved items:** SP01 §9/§4.6 and SP02 §9/§4.5.4 independently resolve `Footer`'s hrefs into data (`FOOTER_LINKS`, in `src/config/links.ts`) rather than JSX literals, so SP01's *own* `Footer.tsx` already ships with the Research/Privacy/Terms/Résumé links this section originally recommended — SP05 no longer adds the links themselves, only the `resume_click` tracking call, onto the now-data-driven version:

```tsx
// src/layout/Footer.tsx — edited by SP05 (this is SP01's file, already
// data-driven via FOOTER_LINKS per SP01 §4.6/§9 and SP02 §4.5.4/§9; SP05
// adds only the resume_click tracking call below, nothing else)
import { Link } from 'react-router-dom';
import { FOOTER_LINKS } from '@/config/links';
import { isExternalUrl } from '@/lib/isExternalUrl';
import { trackEvent } from '@/lib/analytics';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-teal-secondary/10 bg-cream">
      <div className="mx-auto flex w-full max-w-content flex-col items-center gap-3 px-6 py-8 text-center sm:px-8 md:px-10 lg:px-12">
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-4 text-[0.78rem] font-semibold text-teal-secondary">
          {FOOTER_LINKS.map((item) =>
            isExternalUrl(item.href) ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="hover:text-teal"
                onClick={
                  item.label === 'Résumé'
                    ? () => trackEvent('resume_click', { source: 'footer', url: item.href })
                    : undefined
                }
              >
                {item.label}
              </a>
            ) : (
              <Link key={item.href} to={item.href} className="hover:text-teal">
                {item.label}
              </Link>
            ),
          )}
        </nav>
        {/* ...techfolio credit + copyright unchanged from SP01... */}
      </div>
    </footer>
  );
}
```

This is where the résumé's `resume_click` event (§4.4) actually gets wired up on the footer side — the one real content edit SP05 makes to `Footer.tsx`, now scoped to exactly the `onClick` above, since the links themselves are already SP01/SP02's resolved responsibility.

### 4.7 The "no forms" fragility guard

**The code comment**, placed at SP01's `/live` route registrations in `src/routes.tsx` — the single place both `/projects/:slug/live` routes are declared, and the first thing anyone touches when wiring up a new hosted mini-project:

```tsx
// src/routes.tsx — comment added by SP05 next to the existing route entries
// (SP01 already registers these; SP05 adds only this comment block, not new
// routing logic)
{
  path: 'projects/:slug/live',
  element: <ProjectLivePage />,
  getStaticPaths: () => projectSlugs.map((slug) => `projects/${slug}/live`),
  // FRAGILITY GUARD (see /privacy, /terms — "no forms"): every hosted (i.e.
  // non-redirect) /projects/<slug>/live page must currently accept ZERO user
  // input. Both legal pages state plainly that this domain has no forms as
  // of their last-updated date. The moment a hosted /live project adds an
  // <input>, <textarea>, <form>, a file upload, or anything else a visitor
  // can type into and submit, that claim is false and BOTH
  // src/pages/PrivacyPage.tsx and src/pages/TermsPage.tsx (their "no forms" /
  // "What this site does not do" sections, plus each page's LAST_UPDATED)
  // must be revised BEFORE that project ships, not after. SP04 built a real
  // mechanical check for this: `npm run check:no-forms`
  // (scripts/check-no-forms.sh, PRD 04 §4.8) — and SP08's CI pipeline
  // (08-ci-deploy-pipeline §4.2-§4.4) now runs it automatically as a named
  // step on every PR and every push to main, so a violation fails the build
  // rather than depending on someone running it by hand first. See PRD 05
  // §4.7, PRD 04 §4.7/§4.8, PRD 08 §4.2.
},
```

**The mechanical check — resolved, and no longer only manually-run either.** The brief's own §5 originally framed this as "grep for the claim whenever a new `/live` project ships" — a manual, pre-ship habit, since a repo-wide grep for `<input`/`<form`/`<textarea` would false-positive immediately on SP04's own `SearchFilter` (which legitimately has a search `<input>` on `/projects`/`/research`, already disclosed in §4.5's copy as "not a form"). A precise, low-noise grep target needed SP04's hosted-`/live`-project directory convention to exist first — **SP04 §4.7 now settles that convention** (`src/pages/live/<slug>.tsx` + `src/pages/live/registry.ts`, with hosted pages isolated from `SearchFilter`'s own files) **and SP04 §4.8 builds the check as `scripts/check-no-forms.sh`, exposed as `npm run check:no-forms`** — a scoped `grep -rEn '<(input|form|textarea)[ >]' src/pages/live` with zero false positives, closing the loop this PRD originally flagged as SP04-blocked. **A second gap closed since: the owner adopted CI (brief §4's amendment), and SP08 (`08-ci-deploy-pipeline` §4.2–§4.4) now runs this exact script as a separately named step on every PR and every push to `main`** — the mechanism this PRD's original §5-derived framing accepted as "manual, easy to forget" is now enforced automatically:

1. **The pre-ship checklist item is now backed by a real command, and that command now runs itself.** A hosted (non-redirect) `/projects/<slug>/live` page with input-accepting markup fails SP08's CI outright — merging or deploying it without first updating both legal pages' copy + `LAST_UPDATED` is no longer possible by accident, only by deliberately overriding a failing check.
2. **`.env.example` is unaffected; `package.json` gains the one script.** `check:no-forms` still isn't folded into `npm run build` itself (SP08 §4.2 runs it as its own separate CI step instead, precisely so a violation names itself rather than surfacing buried inside `build`'s output) — same model as SP02's `check:launch`, which it's chainable with (SP04 §4.8: `"check:launch": "tsx scripts/check-launch-content.ts && npm run check:no-forms"`).

---

## 5. API Change Summary

No backend API (locked non-goal, brief §4) — this section is the **client-side event API** every other sub-project calls instead:

```ts
// import { trackEvent } from '@/lib/analytics'

trackEvent(name: AnalyticsEventName, params?: Record<string, string | number | boolean>): void

type AnalyticsEventName =
  | 'outbound_click'      // { url, context: 'content_external_link' | 'live_redirect' | 'hero_social' | 'contact_social', label }
  | 'project_card_click'  // { slug, collection: 'projects' | 'research', title }
  | 'resume_click'        // { source: 'hero' | 'footer', url }
  | 'search_query'        // { collection: 'projects' | 'research', query, result_count }
  | 'section_view';       // { section: 'projects' | 'work-experience' | 'about' | 'contact' }
```

Contract for callers: `trackEvent` is always safe to call — it silently no-ops when GA isn't loaded (dev mode, no measurement ID, or the visitor hasn't granted consent), so SP03/SP04 never gate calls on `useConsent()` themselves. Pageviews need no call at all — `AnalyticsListener`, mounted once in `PageShell`, handles every route change automatically, including hash-only anchor navigation.

Also exported and consumed directly:
- `useContactMailto(): string | null` (§4.1) — SP03's Contact section, both legal pages.
- `CONTACT_EMAIL_DISPLAY`, `LINKEDIN_URL`, `GITHUB_URL`, `GITHUB_USERNAME` (§4.1) — SP03's hero/Contact icons and both legal pages.
- `useSectionViewTracking(): void` (§4.4) — SP03's `HomePage`, called once.
- `useConsent(): { consent, hydrated, grant, decline, clearConsent }` (§4.2) — `ConsentBanner` (built here) and `/privacy`'s consent-status section (built here); no other sub-project needs this directly.

---

## 6. Frontend Change Summary

| Type | Name | Path | Notes |
|---|---|---|---|
| Config | Contact facts + obfuscation | `src/config/contact.ts` | New file. Email (obfuscated), LinkedIn, GitHub |
| Hook | `useContactMailto` | `src/hooks/useContactMailto.ts` | New file. Hydration-safe `null`-until-mounted pattern |
| Context/Provider | `ConsentProvider`, `useConsent` | `src/context/ConsentContext.tsx` | New file. `localStorage` key `tejitpabari:consent` |
| Component | `ConsentBanner` | `src/components/ConsentBanner.tsx` | New file. Techfolio-palette-styled Accept/Decline banner |
| Utility | `loadGa`, `isGaLoaded`, `trackPageView`, `trackEvent` | `src/lib/analytics.ts` | New file. Two dev guards; `trackEvent` is the cross-sub-project API surface |
| Utility (no UI) | `AnalyticsListener` | `src/lib/AnalyticsListener.tsx` | New file. Pageviews on every route change, consent-gated |
| Hook | `useSectionViewTracking` | `src/lib/useSectionViewTracking.ts` | New file. IntersectionObserver-based `section_view` firing |
| Route (content replaced) | `/privacy` | `src/pages/PrivacyPage.tsx` | Replaces SP01 placeholder. Full copy (§4.5) + consent-status/"Clear my choice" section |
| Route (content replaced) | `/terms` | `src/pages/TermsPage.tsx` | Replaces SP01 placeholder. Full copy (§4.5) |
| Modified (SP05 edits an SP01-owned file) | `PageShell` | `src/layout/PageShell.tsx` | Adds `ConsentProvider`, `AnalyticsListener`, `ConsentBanner` — the exact hand-off SP01 §4.6 documents |
| Modified (SP05 edits an SP01-owned file) | `Footer` | `src/layout/Footer.tsx` | Adds `/privacy`/`/terms` links (§4.6) and wires `resume_click` tracking on the existing Résumé link |
| Modified (SP05 edits an SP01-owned file) | `routes.tsx` | `src/routes.tsx` | Adds the "no forms" fragility-guard comment (§4.7) next to the existing `/live` route entries — no routing logic changes |
| Config | `.env.example` | `.env.example` | New file at repo root. Documents `VITE_GA_MEASUREMENT_ID` only — `VITE_SITE_URL` is SP06's addition when it lands |
| Dependency | none added | — | GA4 loads via a plain `<script>` tag; no `react-ga4` or similar wrapper package |

---

## 7. Testing

Sized like `juno-landing-page`'s own 04 PRD sized its analytics testing — one thing actually matters, everything else is copy that gets proofread, not unit-tested.

- **Decline ⇒ zero cookies, verified by a real test — the one test that matters most here.** Render `ConsentBanner` under a fresh/mocked `localStorage`, click Decline, then assert: `localStorage.getItem('tejitpabari:consent') === 'denied'`, `isGaLoaded() === false`, and — the actual proof, not an inference from the flag — no `<script src="...googletagmanager...">` element exists anywhere in `document.head`. This directly catches the real privacy bug this whole sub-project exists to prevent (GA firing before/without consent).
- **Accept loads GA exactly once**, and a returning visitor with `tejitpabari:consent = 'granted'` already in storage gets GA loaded on mount without a fresh click (the `ConsentProvider` mount effect's `if (stored === 'granted') loadGa()` branch).
- **`AnalyticsListener` never calls `trackPageView` before consent** — render with `consent: 'unset'`/`'denied'`, simulate a route change, assert the `gtag` mock receives zero `page_view` calls.
- **`trackEvent` no-ops when GA isn't loaded** — call each of the five event names with `gaLoaded === false`; assert `window.gtag` is never invoked. This is the guarantee SP03/SP04 rely on to call `trackEvent` unconditionally.
- **`shouldLoadGa()` refuses in dev mode** even with a measurement ID present (`vi.stubEnv('DEV', true)`), and refuses with `DEV` false but no ID — both independent guards exercised separately, not just their conjunction.
- **`useContactMailto()` returns `null` on first render, a real `mailto:` string after the mount effect** — the hydration-safety property SP03 depends on, tested directly rather than only asserted in a comment.
- **A real `dist/` build audit**: after `npm run build`, `grep -rn "tejitpabari99@gmail" dist/` returns zero hits; `grep -rn "tejitpabari99 _at_ gmail" dist/` returns one hit per page rendering a Contact section (`/`, `/privacy`, `/terms`). This is the one check that actually proves the obfuscation works end-to-end, not just in isolated component tests.
- **`useSectionViewTracking` fires each section once** — mock `IntersectionObserver`, trigger two intersection callbacks for the same section id, assert `trackEvent('section_view', ...)` is called exactly once.
- **Both legal pages render without throwing**, extending SP01's existing smoke-test pattern for `/privacy`/`/terms` (already covered generically there — confirm they still pass once real content replaces the placeholder).

**Explicitly not worth it here:**
- Testing the real network call to `googletagmanager.com` — mocking `gtag`/script injection at the boundary is sufficient.
- Any snapshot/diff testing of the legal copy — it's read by a human (the owner, then real visitors), not diffed by a test.
- E2E/Playwright coverage of the consent flow — the same reasoning `juno-landing-page`'s 04 PRD already gives: the component-level tests above cover the actual risk more cheaply than standing up a browser harness would.
- A regex-based PII scanner on `search_query`'s logged text — disclosure (§4.4, §4.5) is the chosen mitigation, not detection.

---

## 8. Manual Intervention Required From You

1. ~~Create the GA4 property for tejitpabari.com... and copy the Measurement ID.~~ **Done** — the Firebase web app the owner registered under the `tejitpabari-99` project auto-created a GA4 property and measurement ID, `G-9NLS3NG63M` (§4.3, §9). No separate analytics.google.com setup needed.
2. **Run the `gh variable set VITE_GA_MEASUREMENT_ID` command SP08 specifies** (`08-ci-deploy-pipeline` §4.6) so the value actually reaches CI. The value itself is committed in `.env.example` (§4.3) — nothing local to set for a normal build; `.env.local` remains available (gitignored, SP01 §4.2) for anyone who wants a different value for local dev only. What needs owner action: SP08's CI pipeline runs `npm run build` on every PR and every push to `main`, reading `VITE_GA_MEASUREMENT_ID` from a **repository variable**, not a secret (SP08 §4.6's own reasoning — a GA4 measurement ID is a public identifier by construction). The merge workflow specifically fails loudly, before building, if that variable is empty (SP08 §4.4/§4.6) — so a missing value is now caught at merge time rather than shipping silently, closing the exact risk this item originally flagged.
3. **Read every word of the drafted copy in §4.5 yourself, and edit or approve it.** This cannot be delegated or skipped: the text is written to be accurate and honest about what this specific site does, in plain English, but it is not legal advice and its author is not a lawyer. If tejitpabari.com or any project hosted under it ever starts collecting more than described here — a form, an account, anything commercial — have an actual lawyer review both pages before that ships.
   - In particular, decide whether you want a lighter, non-clinical framing on `/terms`' "This isn't professional or medical advice" section (§9) — drafted deliberately given Juno's health-tech adjacency, but this portfolio is one level removed from Juno itself, so the section may read as more caution than the site needs.
4. **Confirm or replace `LAST_UPDATED`** (`'2026-08-30'` in both pages, §4.5) with the actual date you approve the text for launch — leaving it at a placeholder date the copy wasn't actually reviewed under is worse than an obviously-wrong one.
5. **Decide the jurisdiction question** (§9) — this PRD recommends staying jurisdiction-agnostic (no explicit GDPR/CCPA naming), matching `juno-landing-page`'s own resolved decision, but it's your call, not a default to accept blindly.
6. ~~Confirm the "no forms" fragility-guard workflow is one you'll actually follow~~ **No longer a workflow that depends on being followed.** `npm run check:no-forms` (SP04 §4.8) is a real, precise script, and SP08's CI pipeline (`08-ci-deploy-pipeline` §4.2–§4.4) now runs it automatically as a named step on every PR and every push to `main` — a violation fails the build, whether or not anyone remembered to run the script by hand first. Nothing further needed from you here beyond the general awareness that a hosted `/live` project's input markup, if it ever ships, still requires updating `/privacy`/`/terms` copy yourself (§8 item 3) — CI catches the code-level symptom, not the legal-text update itself.
7. **Optional: GA4's internal-traffic data filter**, in the GA4 admin console, if you ever find yourself browsing the live site directly for testing — not required at launch given the code-level dev-mode guard (§4.3).

---

## 9. Open Questions & Decisions

- `[RESOLVED: GA4 measurement ID is G-9NLS3NG63M, supplied via VITE_GA_MEASUREMENT_ID]` — auto-created alongside the Firebase web app the owner registered under the `tejitpabari-99` project. Committed as the default in `.env.example`; not a secret (see §4.3's reasoning), and supplied to CI as a repository *variable* for the identical reason. SP08's CI pipeline (`08-ci-deploy-pipeline` §4.6) passes it through at build time on both workflows, and its merge workflow specifically fails the build loudly if it's empty — closing this entry's original open risk ("or the shipped site silently has no analytics") mechanically rather than leaving it as a thing to remember.
- `[RESOLVED: the Firebase JS SDK is not used — only the GA4 measurement ID, loaded via gtag.js under ConsentContext gating]` — registering the Firebase web app also produced a full Firebase config object and the standard `initializeApp`/`getAnalytics` snippet; neither is used. The `firebase` npm package is not installed. Reasons: (1) this site has no backend/auth/Firestore/Storage, so the SDK would add bundle weight to deliver a call `gtag.js` already makes without it; (2) more importantly, `getAnalytics()` initializes tracking before the visitor consents, bypassing `ConsentContext`'s gating entirely — a correctness bug, not just a size one. See §4.3.
- `[RESOLVED: `outbound_click`'s context value is generalized to `'content_external_link'` to cover Research citation links as well as Project links]` — closes SP04 §9's matching resolved entry, which flagged that the original `'project_external_link'` value had no research-shaped option. Renamed here (§4.4) and in every call-site example in this PRD, before any real event has fired against the old name.
- `[RESOLVED: trackEvent(name, params) is the single event API, pageviews handled separately]` — matches the brief's request for "one settled function" while keeping pageview mechanics (which need route-awareness, not a call site) in a mounted listener instead. See §4.3/§5.
- `[RESOLVED: search-query disclosure via a dedicated /privacy subsection, not text filtering]` — a regex PII scanner on freeform search text is its own unreliable feature; disclosure ("don't type anything personal into it, it's the one place this can be logged") is the honest, low-complexity mitigation. See §4.4, §4.5.
- `[RESOLVED: conditional GA script loading, not GA4 Consent Mode]` — carried forward from `juno-landing-page`'s 04 PRD reasoning (its §4.4): Consent Mode exists to preserve ad-conversion modeling under denial, which doesn't apply to a site with no ads/remarketing. Conditional loading means zero requests reach Google before consent — a strictly stronger, easier-to-state-honestly claim for this site's own privacy copy.
- `[RESOLVED: no third-party CMP, no consent categories beyond "analytics"]` — one tracker, one decision; see §4.2.
- `[RESOLVED: consent storage key is `tejitpabari:consent`, namespaced separately from `juno-landing-page`'s `juno:consent`]` — different site, different localStorage origin anyway (browser storage is already per-origin), but an explicit distinct key avoids any confusion if code is ever compared side-by-side across the two repos.
- `[RESOLVED: footer gets /privacy + /terms links added]` — resolves SP01 §9's flagged gap. See §4.6 for the reasoning and the exact `Footer.tsx` diff.
- `[RESOLVED: identity constants (email, LinkedIn, GitHub) live in this sub-project's `src/config/contact.ts`; navigation constants live in SP01's `src/config/links.ts`; no `src/config/social.ts` is created]` — binding architect decision, resolving a `GITHUB_URL` collision surfaced by SP03's task generation (claimed by both a proposed `src/config/social.ts` and this file). Brief §2/§3 "Contact facts" already groups the email, LinkedIn, and GitHub together as one ported concern from `juno-landing-page/src/config/contact.ts`, including the "not obfuscated, and here is why" reasoning for LinkedIn/GitHub living in that same file's comments — splitting the socials into a third file would orphan that reasoning. See §4.1's full export list, SP01 §9's matching entry, and SP03 §4.2/§4.8/§9.
- `[RESOLVED: jurisdiction-agnostic, plain-English /privacy and /terms — no explicit GDPR/CCPA naming]` — same reasoning `juno-landing-page`'s 04 PRD recorded for its own site, which transfers directly: naming a compliance regime is itself a legal claim neither this PRD's author nor the owner is positioned to make. Recorded for the record, not re-derived: CCPA generally applies to for-profit businesses meeting revenue/data-volume thresholds; tejitpabari.com itself (as distinct from Juno, the company, which has its own separate site/policies) is a personal, non-commercial, non-incorporated portfolio with no accounts and no data sales — very unlikely to meet any CCPA threshold. GDPR's territorial reach can extend to a site with no EU establishment if it's seen as "targeting" EU visitors; this site's audience plausibly includes EU visitors (recruiters, researchers) but doesn't market to them specifically and collects nothing without opt-in consent already. Owner can override in §8 item 5 if their risk tolerance differs.
- `[RESOLVED: no "Governing Law" clause in /terms]` — no commercial relationship or dispute exposure to allocate for a personal, non-commercial site; a governing-law clause would assert something (which state/court) with no clear corresponding benefit. Carried forward from `juno-landing-page`'s 04 PRD, not re-litigated.
- `[RESOLVED: "Clear my choice" affordance is built, not just promised]` — the drafted `/privacy` text promises a way to reset consent beyond manually clearing all browser storage; `ConsentContext.clearConsent()` (§4.2) and the wired button in `/privacy`'s "Your consent choice" section (§4.5) implement it, matching the fix `juno-landing-page`'s own 04 PRD made for the identical gap in its first draft.
- `[RESOLVED: SP04 §4.7 settles the convention (`src/pages/live/<slug>.tsx` + `src/pages/live/registry.ts`) and SP04 §4.8 builds the check as `scripts/check-no-forms.sh`, exposed as `npm run check:no-forms`]` — closes the loop this PRD flagged, which SP04 (owning the hosted-`/live` directory) resolves. See §4.7's updated fragility guard, which now references the concrete script and npm command rather than describing it as a future possibility.
- `[RESOLVED: `check:no-forms` is enforced automatically by SP08's CI pipeline, not only a manually-run pre-ship command]` — the owner adopted CI after this PRD was first written (brief §4's amendment); SP08 (`08-ci-deploy-pipeline` §4.2–§4.4) runs it as a separate, named step on every PR and every push to `main`. See §4.7's updated prose and §8 item 6.
- `[RESOLVED: `<RouteMeta title description path image? />`]` — identical to SP04 §9's matching entry. SP06 binds it in its own PRD §4/§9. Both legal pages' `<RouteMeta title description path />` call sites need no change — the extra optional `image` prop simply goes unused on `/privacy`/`/terms`, which have no image to pass.
- `[DEFERRED: decided by whoever ships the first hosted `/live` project that accepts input]` — nothing shipping today takes input (SP06's `sample-project` demo is display-only), so forcing this call now would be deciding a question with no concrete case in front of it. The §4.7 fragility guard is already written broadly enough to cover either outcome ("must be revised BEFORE that project ships"), and `npm run check:no-forms` mechanically catches the moment the question becomes live. **The trigger is explicit: a non-zero exit from `check:no-forms` is the signal to make this call.**
- `[DEFERRED: owner-only — part of the owner's mandatory full read-through of the legal copy]` — the whole of §4.5's legal text is already gated on the owner reading every word before launch (§8 item 3, and brief §2: not lawyer-reviewed, must not ship unread). This is one paragraph inside that same read-through, not a separate blocker — the drafted text ships as-is unless the owner changes it.
- `[DEFERRED]` **A regex/heuristic PII filter on logged `search_query` text.** Disclosure is the chosen mitigation (§4.4); revisit only if real search-query data in GA4 turns out to contain something that shouldn't have been logged, which disclosure was meant to prevent in the first place.
- `[DEFERRED]` **GA4's internal-traffic data filter** — admin-console setting, not code; worth configuring once the owner is testing the live site regularly post-launch.
- `[DEFERRED]` **Multi-category consent** (separating "analytics" from some future second tracker) — not applicable today; revisit only if a second tracker is ever added.
