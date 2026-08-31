# Tasks: Legal Pages & Analytics (SP05)

Source of truth: `/root/projects/tejitpabari/.dev/website-revamp/05-legal-analytics/PRD.md`. Every task below cites the PRD §4 subsection it implements. This sub-project builds contact/email obfuscation, the consent system, the GA4 analytics layer and event catalogue, and the `/privacy`/`/terms` pages — **not** `PageShell`/`Footer`/`routes.tsx`/`RouteMeta`/`src/config/links.ts` themselves (SP01/SP06-owned; SP05 makes narrow, named edits to three of SP01's files only), and **not** the `SearchFilter`/card components that call `trackEvent` (SP03/SP04's scope — this PRD specifies the exact call, not the component).

**Toolchain assumption, confirmed from sibling PRDs' task lists, not re-derived here:** `vitest` (`npm test` → `vitest run`) and `@testing-library/react` are already installed and configured by SP01. No task below installs a dependency.

**Cross-sub-project sequencing this task list assumes but does not build:**
- SP01 lands `PageShell.tsx`, `Footer.tsx` (already data-driven via `FOOTER_LINKS`, already carrying Research/Privacy/Terms/Résumé entries per SP01 §4.6/§9), `routes.tsx` (with `/privacy`, `/terms`, and `/projects/:slug/live` placeholder entries already registered), and the Tailwind tokens `ConsentBanner` re-skins to (`teal-secondary`, `cream`, `body`, `ink`, `teal`, plus `maxWidth.content`). If any of these token names differ from what SP01 actually ships, `ConsentBanner`'s `className` strings need a one-line find/replace, not a redesign.
- SP06 lands `RouteMeta` (`@/components/RouteMeta`), assumed shape `<RouteMeta title description path image? />`. Both legal pages call it with no `image` prop. If SP06's actual signature differs, only that one line per page needs updating (PRD §3 non-goal, §9 resolved entry).
- SP04 lands `scripts/check-no-forms.sh` / `npm run check:no-forms` and the `src/pages/live/registry.ts` convention (PRD §4.7, §9). Task 11 below writes a code comment that *names* this command — the comment is valid and useful before that script exists (SP05 is Phase 2, parallel with SP02; SP04 lands later), but the command itself won't run successfully until SP04's task lands. This is a documentation forward-reference, not a build-breaking dependency.
- SP03 and SP04 are the main callers of `trackEvent` — they compile against the exact `AnalyticsEventName` union and the exact `'content_external_link'` context string this sub-project ships (Task 3). Changing either after SP03/SP04 land breaks their call sites; do not rename either casually.

---

### Task 1 — `src/config/contact.ts` — identity constants
   - Files: `src/config/contact.ts` (new)
   - Changes: Per PRD §4.1. Ported near-verbatim from `juno-landing-page/src/config/contact.ts`, with `LINKEDIN_URL`/`GITHUB_USERNAME`/`GITHUB_URL` added (new to this site). **Exactly five exports, no more, no fewer:** `CONTACT_EMAIL_DISPLAY`, `getContactEmailAddress`, `LINKEDIN_URL`, `GITHUB_USERNAME`, `GITHUB_URL`. **No `LOCATION` constant.** This file does not create or re-export anything from a `social.ts` — no such file exists in this project (PRD §9's resolved architect decision).

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

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. `grep -c "^export " src/config/contact.ts` → 5, and the five names are exactly `CONTACT_EMAIL_DISPLAY`, `getContactEmailAddress`, `LINKEDIN_URL`, `GITHUB_USERNAME`, `GITHUB_URL` — no `LOCATION`, no `SOCIAL_LINKS`, no `CONTACT_EMAIL` (a single unsplit constant).
     3. `grep -n "tejitpabari99@gmail" src/config/contact.ts` returns **zero** hits — the plain address string exists nowhere in this file, only the two-piece split plus the runtime-only assembly function.
     4. The code comment explaining *why* LinkedIn/GitHub are not obfuscated is present verbatim in the file (not paraphrased away) — this is deliberately preserved so a future edit doesn't "fix" it by obfuscating a profile URL for no benefit.

---

### Task 2 — `src/hooks/useContactMailto.ts` — hydration-safe mailto hook
   - Files: `src/hooks/useContactMailto.ts` (new)
   - Changes: Per PRD §4.1. Identical to `juno-landing-page`, unchanged. Depends on Task 1.

```ts
// src/hooks/useContactMailto.ts
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

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. Every consumer contract is documented in the file's own JSDoc (already present above) — a future consumer reading only this file's source knows the `null`-until-mounted rule without needing the PRD.
     3. Behavioral proof (null-then-real) is deferred to Task 17's test — this task's own acceptance criteria is limited to the static contract; do not add a test file here.

---

### Task 3 — `src/lib/analytics.ts` — `loadGa()`, pageview helper, `trackEvent`
   - Files: `src/lib/analytics.ts` (new)
   - Changes: Per PRD §4.3, §5, §9. Ported verbatim from `juno-landing-page/src/lib/analytics.ts`. **Two independent dev guards in `shouldLoadGa()`** — `import.meta.env.DEV` and a missing-measurement-ID check — each sufficient alone to block dev traffic. **No `firebase` npm package import anywhere in this file or this sub-project** (binding decision, PRD §4.3/§9: no `initializeApp`/`getAnalytics` — only the bare measurement-ID string, loaded through a plain `<script>` tag). `AnalyticsEventName` is a typed union, not a bare `string` parameter — this is deliberate (per the house rule that SP03/SP04's call sites should fail `tsc --noEmit` on an unknown event name rather than silently emit one) and must include `'search_query'` and support the `outbound_click` context value `'content_external_link'` (the renamed value — never `'project_external_link'`, which SP04's PRD independently confirms is stale).

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
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. `import { AnalyticsEventName } from '@/lib/analytics'` — calling `trackEvent('not_a_real_event', {})` in a scratch file fails `tsc --noEmit` (typed union, not bare string). Verify once locally, then discard the scratch file.
     3. `grep -rn "from 'firebase" src/` and `grep -n '"firebase"' package.json` both return zero hits — the Firebase JS SDK is not installed or imported anywhere in this sub-project's files.
     4. `grep -n "'content_external_link'" .dev/website-revamp/05-legal-analytics/TASKS.md` (this file) and `grep -n "project_external_link" src/lib/analytics.ts` — the second must return zero hits; the renamed value is the only one that ever appears in code.
     5. Behavioral proof of both dev guards, GA idempotency, and `trackEvent`'s no-op behavior is deferred to Task 14's test.

---

### Task 4 — `src/context/ConsentContext.tsx` — `ConsentProvider` / `useConsent`
   - Files: `src/context/ConsentContext.tsx` (new)
   - Changes: Per PRD §4.2. Depends on Task 3 (`loadGa`). Ported in shape from `juno-landing-page`, with the storage key namespaced to `'tejitpabari:consent'` (PRD §9 — deliberately distinct from `juno-landing-page`'s `'juno:consent'`).

```tsx
// src/context/ConsentContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadGa } from '@/lib/analytics';

type ConsentValue = 'unset' | 'granted' | 'denied';
const STORAGE_KEY = 'tejitpabari:consent'; // namespaced — different site/property than juno-landing-page's

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

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. `useConsent()` called outside a `ConsentProvider` throws synchronously (no silent `undefined`) — verify with a one-off render in a scratch test or note it's covered by Task 15's suite.
     3. `grant()` calls `loadGa()` synchronously in the same call stack as the click handler, not inside a `useEffect` — confirm by inspection (no `useEffect` wraps the `loadGa()` call in `grant`).
     4. Behavioral proof (decline ⇒ zero cookies, accept loads GA once, returning-visitor auto-load) is deferred to Task 15's test.

---

### Task 5 — `src/components/ConsentBanner.tsx`
   - Files: `src/components/ConsentBanner.tsx` (new)
   - Changes: Per PRD §4.2. Depends on Task 4. Re-skinned from `juno-landing-page`'s raw token names to SP01's actual Tailwind tokens. **Flag if SP01's tokens differ** (see sequencing note at top of this file) rather than guessing new names.

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

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes; `npm run build` succeeds (no unresolved Tailwind class errors).
     2. With `hydrated: false` or `consent !== 'unset'`, the component renders `null` — no DOM node at all, not a hidden one.
     3. With `hydrated: true, consent: 'unset'`, the banner renders with a "Decline" and an "Accept" button, and a `<Link to="/privacy">` inside the copy.
     4. Clicking "Accept" calls `grant()`; clicking "Decline" calls `decline()` — exactly one call each per click.
     5. No preference-management UI beyond the two buttons exists (no third category, no CMP widget) — matches PRD §4.2's explicit "two outcomes only" decision.

---

### Task 6 — `src/lib/AnalyticsListener.tsx`
   - Files: `src/lib/AnalyticsListener.tsx` (new)
   - Changes: Per PRD §4.3. Depends on Task 3, Task 4. Sends a `page_view` on every route change (including hash-only anchor navigation, load-bearing for this site's anchor-based nav) once consent is granted.

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

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. Renders `null` — confirm no DOM output.
     3. The effect's dependency array includes `location.hash` (not just `location.pathname`) — spot-check by inspection; this is the exact detail PRD §4.3 calls load-bearing for `/#projects`-style nav.
     4. Behavioral proof (never fires before consent, fires the current page as the first view when `grant()` happens mid-session) is deferred to Task 16's test.

---

### Task 7 — `src/lib/useSectionViewTracking.ts`
   - Files: `src/lib/useSectionViewTracking.ts` (new)
   - Changes: Per PRD §4.4. Depends on Task 3. IntersectionObserver-based, dedupes per section per page load. **Dependency, not built here:** SP01's `HomePage` must have four `<section id="…">` elements with exactly the ids `projects`, `work-experience`, `about`, `contact` (SP01 §4.7) — this hook only observes elements that already exist by those ids; it does not create them.

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

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. Calling `document.getElementById(id)` for an id not present in the DOM does not throw — the `if (el)` guard makes this a safe no-op (relevant since SP03 hasn't necessarily landed `HomePage`'s sections yet when this file is authored).
     3. Behavioral proof (dedupe per section) is deferred to Task 18's test.
     4. This hook is exported for SP03 to call once on `HomePage` — it is not called from anywhere within this sub-project's own files (no page here needs it).

---

### Task 8 — Edit `src/layout/PageShell.tsx` (SP01-owned file) — wire consent + analytics
   - Files: `src/layout/PageShell.tsx` (modified — SP01-owned)
   - Changes: Per PRD §4.2, the exact hand-off SP01's own PRD documents (SP01 §4.6). **This task makes exactly three additions to the existing file and touches nothing else:** (1) wrap the existing children in `<ConsentProvider>...</ConsentProvider>`, (2) mount `<AnalyticsListener />` alongside the existing `<ScrollManager />`, (3) render `<ConsentBanner />` as the last child, after `<Footer />`. Do not alter `Nav`, `Outlet`, `Footer`, `ScrollManager`, or any layout/spacing markup already in the file.

```tsx
// src/layout/PageShell.tsx — SP05 adds only the three items marked below
import { Outlet } from 'react-router-dom';
import { ScrollManager } from '@/lib/ScrollManager';
import { AnalyticsListener } from '@/lib/AnalyticsListener'; // SP05 add
import { ConsentProvider } from '@/context/ConsentContext';   // SP05 add
import { ConsentBanner } from '@/components/ConsentBanner';   // SP05 add
import { Nav } from './Nav';
import { Footer } from './Footer';

export function PageShell() {
  return (
    <ConsentProvider> {/* SP05 add: wraps everything below */}
      <ScrollManager />
      <AnalyticsListener /> {/* SP05 add */}
      <Nav />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ConsentBanner /> {/* SP05 add */}
    </ConsentProvider>
  );
}
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes; `npm run build` succeeds.
     2. `git diff` (or equivalent) on this file shows only the three additions above — no reordering of `Nav`/`Outlet`/`Footer`, no removed lines, no touched className/props on existing elements.
     3. Loading any route renders `Nav`, the route's content, and `Footer` exactly as before this change (visual regression check — nothing shifts), plus the consent banner appears at the bottom on first visit (no stored consent) and pageviews send once consent is granted (verified functionally in Task 16).

---

### Task 9 — Edit `src/layout/Footer.tsx` (SP01-owned file) — wire `resume_click` tracking
   - Files: `src/layout/Footer.tsx` (modified — SP01-owned)
   - Changes: Per PRD §4.4, §4.6. SP01/SP02 already resolved the footer gap by shipping `FOOTER_LINKS` (data-driven, including Research/Privacy/Terms/Résumé entries) — **SP05 does not add any links here.** The only change is adding an `onClick` handler on the Résumé entry that calls `trackEvent('resume_click', { source: 'footer', url: item.href })`, matching the `resume_click` row in the event catalogue (PRD §4.4).

```tsx
// src/layout/Footer.tsx — SP05 adds only the onClick prop below; FOOTER_LINKS
// itself, and the rest of the render logic, are already SP01/SP02's work
import { Link } from 'react-router-dom';
import { FOOTER_LINKS } from '@/config/links';
import { isExternalUrl } from '@/lib/isExternalUrl';
import { trackEvent } from '@/lib/analytics'; // SP05 add

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

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. `git diff` on this file shows only the `trackEvent` import and the `onClick` prop addition — `FOOTER_LINKS` itself, the map logic, and every other JSX attribute are unchanged.
     3. Clicking the footer's Résumé link fires `trackEvent('resume_click', { source: 'footer', url: <the résumé URL> })` exactly once; clicking any other footer link fires no `resume_click` event.
     4. `/privacy` and `/terms` are reachable via footer links without further edits here (SP01's `FOOTER_LINKS` already routes to them — confirm by clicking through once manually, not by adding code).

---

### Task 10 — `.env.example`
   - Files: `.env.example` (new, repo root)
   - Changes: Per PRD §4.3, §9. Committed with the real, public measurement ID and an explanatory comment. `.env.local` (gitignored per SP01's `.gitignore`) is not created or touched by this task — it's a per-developer local override, out of scope here.

```
# GA4 measurement ID. Public identifier, not a secret — it is emitted
# in the page's own HTML on every load (the gtag.js script URL and the
# `gtag('config', ...)` call below both put it in plaintext), so shipping
# it in a committed file changes nothing about its exposure.
VITE_GA_MEASUREMENT_ID=G-9NLS3NG63M
```

   - Acceptance criteria:
     1. `.env.example` exists at the repo root, is tracked (not gitignored — SP01's `.gitignore` already carries `!.env.example`, confirm this exception is in place rather than re-adding it here), and contains exactly the value `G-9NLS3NG63M` for `VITE_GA_MEASUREMENT_ID`.
     2. The file contains only this one variable — `VITE_SITE_URL` is SP06's addition and is not added here (PRD §3 non-goal).
     3. `npm run build` run with no `.env.local` present picks up this committed value (spot-check: the built `dist/` output's injected script tag/config call references `G-9NLS3NG63M`).

---

### Task 11 — Edit `src/routes.tsx` (SP01-owned file) — "no forms" fragility-guard comment
   - Files: `src/routes.tsx` (modified — SP01-owned)
   - Changes: Per PRD §4.7. **This task adds one comment block; it changes no routing logic, no `getStaticPaths`, no route entries.** Placed at the `/projects/:slug/live` route registration(s) SP01 already ships.

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
  // must be revised BEFORE that project ships, not after. `npm run
  // check:no-forms` (scripts/check-no-forms.sh, SP04's PRD 04 §4.8) is the
  // mechanical check for this — run it before adding any new
  // HOSTED_LIVE_PAGES entry. See PRD 05 §4.7, PRD 04 §4.7/§4.8.
},
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes; `npm run build` succeeds — the comment is inert.
     2. `git diff` on `src/routes.tsx` shows only comment lines added — no route path, `element`, or `getStaticPaths` value changed.
     3. `grep -n "FRAGILITY GUARD" src/routes.tsx` returns exactly one hit per `/projects/:slug/live` route entry SP01 has registered.
     4. **Sequencing note, not a failure condition:** `npm run check:no-forms` referenced in the comment will not exist as a runnable script until SP04's own tasks land (SP05 is Phase 2, SP04 is later) — this is expected; do not add a placeholder script here to make the comment "work" early.

---

### Task 12 — `src/pages/PrivacyPage.tsx`
   - Files: `src/pages/PrivacyPage.tsx` (rewritten — replaces SP01's placeholder)
   - Changes: Per PRD §4.5. Hand-written TSX (not markdown — SP02's resolved decision). Depends on Tasks 1, 2, 4 (contact constants, `useContactMailto`, `useConsent`), and SP06's `RouteMeta`. Implement the **full drafted copy from PRD §4.5 "Proposed `/privacy` text" verbatim** — every heading, paragraph, and list item, converted from the PRD's blockquoted markdown into JSX using the `Section({title, children})` helper below (duplicated locally in this file, not shared with `TermsPage.tsx` — matches `juno-landing-page`'s own choice not to extract a two-consumer component). Section headings, in order: "The short version", "What this covers", "What this site does not do", "What this site does collect" (containing sub-`Section`s or `<h3>`s for "Analytics (Google Analytics) — only if you accept", "Hosting logs", "Your consent choice"), "Cookies, in full", "Outbound links", "Children", "Changes to this policy", "Contact".

```tsx
// src/pages/PrivacyPage.tsx
import type { ReactNode } from 'react';
import { CONTACT_EMAIL_DISPLAY } from '@/config/contact';
import { useContactMailto } from '@/hooks/useContactMailto';
import { useConsent } from '@/context/ConsentContext';
import { RouteMeta } from '@/components/RouteMeta'; // SP06 — assumed shape, see top-of-file sequencing note

const LAST_UPDATED = '2026-08-30'; // placeholder — owner confirms the real ship date, see summary below

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

        {/* Intro paragraph + every Section block below, implementing the full
            drafted text from PRD §4.5 "Proposed /privacy text" verbatim. */}

        {/* ...Section blocks: "The short version", "What this covers",
            "What this site does not do" (a <ul> of the six bullets),
            "What this site does collect" (with "Analytics (Google
            Analytics) — only if you accept", "Hosting logs", and "Your
            consent choice" as nested headings)... */}

        <Section title="Your consent choice">
          <p>
            When you accept or decline the analytics banner, that choice is saved in your
            browser's local storage — a small piece of on-device storage, not a cookie sent to
            any server — so you're not asked again on every visit.
          </p>
          <p>
            Your saved choice about analytics is{' '}
            <strong>{consent === 'unset' ? 'not yet set' : consent}</strong>.{' '}
            {consent !== 'unset' &&
              "You can clear it — the button below resets your choice and shows the banner again next time."}
          </p>
          <button
            type="button"
            onClick={clearConsent}
            className="rounded-full border border-teal-secondary/20 px-4 py-2 text-sm font-semibold text-teal-secondary hover:bg-teal-secondary/8"
          >
            Clear my choice
          </button>
        </Section>

        {/* ...Section blocks: "Cookies, in full", "Outbound links",
            "Children", "Changes to this policy"... */}

        <Section title="Contact">
          <p>
            Questions about this policy, or about what's collected? Email me directly:{' '}
            {emailHref ? (
              <a href={emailHref} className="font-semibold text-teal-secondary underline">
                {CONTACT_EMAIL_DISPLAY}
              </a>
            ) : (
              <span className="select-all font-semibold">{CONTACT_EMAIL_DISPLAY}</span>
            )}
            .
          </p>
        </Section>
      </div>
    </div>
  );
}
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes; `npm run build` succeeds and `/privacy` prerenders to a real HTML file in `dist/` (e.g. `dist/privacy/index.html` or `dist/privacy.html`, matching whatever convention SP01's other static routes use).
     2. Inspecting the prerendered HTML `<head>` for `/privacy` shows `RouteMeta`'s title/description reflected (page `<title>` contains "Privacy Policy"; a meta description tag contains the description string above).
     3. `grep -o '<h2[^>]*>[^<]*</h2>' dist/privacy*/index.html` (or equivalent path) includes, in some order, "The short version", "What this covers", "What this site does not do", "What this site does collect", "Cookies, in full", "Outbound links", "Children", "Changes to this policy", "Contact" — every top-level heading named in PRD §4.5's drafted text is present in the rendered output.
     4. The Contact section's email rendering uses the exact `emailHref ? <a>...</a> : <span className="select-all">...</span>` pattern — never a bare `mailto:` string, never the assembled address, in the branch where `emailHref` is falsy. Confirm this specifically in the prerendered HTML: `grep -c "select-all" dist/privacy*/index.html` → at least 1.
     5. The "Clear my choice" button is present, wired to `clearConsent()` from `useConsent()` (not a new, separately-implemented reset).
     6. **This page's copy is drafted, not final** — implement it verbatim as given in PRD §4.5 (do not editorialize, shorten, or "improve" the wording); the owner's read-through is a separate, human-only step (see summary below). Do not mark this task's copy as done pending legal review — the code is done when it matches the draft exactly.

---

### Task 13 — `src/pages/TermsPage.tsx`
   - Files: `src/pages/TermsPage.tsx` (rewritten — replaces SP01's placeholder)
   - Changes: Per PRD §4.5. Same shape as Task 12 (its own local `Section` copy, its own `LAST_UPDATED`, its own `useContactMailto()` call for its Contact section) — not a shared component, matching `juno-landing-page`'s precedent. Implement the **full drafted copy from PRD §4.5 "Proposed `/terms` text" verbatim**. Section headings, in order: "This isn't professional or medical advice", "What this covers", "No forms, today", "No warranty", "Individual projects may carry their own licence", "Links to other sites aren't endorsements", "My views are my own", "Changes", "Contact". **No "Governing Law" clause** (PRD §4.5's explicit note, carried forward from `juno-landing-page`).

```tsx
// src/pages/TermsPage.tsx
import type { ReactNode } from 'react';
import { CONTACT_EMAIL_DISPLAY } from '@/config/contact';
import { useContactMailto } from '@/hooks/useContactMailto';
import { RouteMeta } from '@/components/RouteMeta'; // SP06

const LAST_UPDATED = '2026-08-30'; // placeholder — owner confirms the real ship date, see summary below

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <div className="space-y-3 text-sm leading-6 text-body">{children}</div>
    </section>
  );
}

export function TermsPage() {
  const emailHref = useContactMailto();

  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:px-8">
      <RouteMeta
        title="Terms of Use"
        description="Terms governing use of tejitpabari.com, a personal portfolio — no company, no warranty, and how hosted projects and outbound links are treated."
        path="/terms"
      />
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold text-ink">Terms of Use</h1>
          <p className="text-sm text-slate">Last updated: {LAST_UPDATED}</p>
        </header>

        {/* Intro paragraph + every Section block below, implementing the full
            drafted text from PRD §4.5 "Proposed /terms text" verbatim:
            "This isn't professional or medical advice", "What this covers",
            "No forms, today", "No warranty", "Individual projects may carry
            their own licence", "Links to other sites aren't endorsements",
            "My views are my own", "Changes". No "Governing Law" section. */}

        <Section title="Contact">
          <p>
            Questions about these terms? Email me:{' '}
            {emailHref ? (
              <a href={emailHref} className="font-semibold text-teal-secondary underline">
                {CONTACT_EMAIL_DISPLAY}
              </a>
            ) : (
              <span className="select-all font-semibold">{CONTACT_EMAIL_DISPLAY}</span>
            )}
            .
          </p>
        </Section>
      </div>
    </div>
  );
}
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes; `npm run build` succeeds and `/terms` prerenders to a real HTML file in `dist/`.
     2. Prerendered `<head>` reflects `RouteMeta`'s title ("Terms of Use") and description.
     3. `grep -o '<h2[^>]*>[^<]*</h2>' dist/terms*/index.html` includes "This isn't professional or medical advice", "What this covers", "No forms, today", "No warranty", "Individual projects may carry their own licence", "Links to other sites aren't endorsements", "My views are my own", "Changes", "Contact" — and does **not** include a "Governing Law" heading.
     4. Same email-rendering pattern check as Task 12 acceptance criterion 4, applied to `/terms`'s output.
     5. Same "drafted, not final, implement verbatim" note as Task 12 acceptance criterion 6 — the "not medical advice" section's exact framing is a question for the owner (see summary below), not something to soften or rewrite here.

---

## Tests

### Task 14 — `analytics.ts` unit tests
   - Files: `src/lib/analytics.test.ts` (new)
   - Changes: Per PRD §7. Mock `window.gtag`/`document.createElement`/`import.meta.env` as needed (`vi.stubEnv`). Cover, as separate `it()` blocks:
     - `shouldLoadGa()`'s behavior is exercised indirectly through `loadGa()`: with `import.meta.env.DEV = true` and a valid measurement ID present, `loadGa()` does not inject a script and `isGaLoaded()` stays `false` (guard 1, independent of guard 2).
     - With `DEV = false` and no `VITE_GA_MEASUREMENT_ID`, `loadGa()` does not inject a script and `isGaLoaded()` stays `false` (guard 2, independent of guard 1).
     - With `DEV = false` and a valid ID, `loadGa()` injects exactly one `<script>` tag into `document.head`, calls `gtag('config', ID, { send_page_view: false })`, and `isGaLoaded()` becomes `true`.
     - Calling `loadGa()` a second time after it already loaded injects zero additional `<script>` tags and issues zero additional `gtag('config', ...)` calls (idempotency).
     - `trackEvent(name, params)` with `gaLoaded === false` never calls `window.gtag` — test this for at least two of the five event names, not just one.
     - `trackEvent('outbound_click', { context: 'content_external_link', ... })` with GA loaded calls `window.gtag('event', 'outbound_click', { context: 'content_external_link', ... })` — the exact renamed context string.
     - `trackPageView(path)` with `gaLoaded === false` never calls `window.gtag`; with `gaLoaded === true`, calls `window.gtag('event', 'page_view', { page_path: path, ... })`.
   - Acceptance criteria: `npm test` passes all seven cases above, each its own `it()` block. This is the test PRD §7 calls out as exercising both dev guards "separately, not just their conjunction" — verify the two guard tests each pass with the *other* guard's condition set to the permissive value, proving each guard alone is sufficient to block loading.

---

### Task 15 — `ConsentContext` / `ConsentBanner` — decline-zero-cookies test
   - Files: `src/context/ConsentContext.test.tsx` (new)
   - Changes: Per PRD §7, the test explicitly called "the one test that matters most here." Render `ConsentProvider` wrapping `ConsentBanner` (and a way to read `useConsent()`'s state, e.g. a small test consumer component) under a fresh/mocked `localStorage`. Cover, as separate `it()` blocks:
     - Clicking "Decline" results in `localStorage.getItem('tejitpabari:consent') === 'denied'`, `isGaLoaded() === false`, and — the actual proof — `document.head.querySelector('script[src*="googletagmanager"]')` is `null` (no such script element exists anywhere in `document.head`).
     - Clicking "Accept" calls `loadGa()` exactly once (spy/mock `@/lib/analytics`'s `loadGa`, or assert on the real script-injection side effect as in Task 14).
     - A returning visitor — `localStorage` pre-seeded with `tejitpabari:consent = 'granted'` before mount — has `isGaLoaded() === true` after mount, with **no** click required (exercises `ConsentProvider`'s mount-effect `if (stored === 'granted') loadGa()` branch).
     - `clearConsent()` resets `localStorage` to have no `tejitpabari:consent` key and `consent` back to `'unset'`, causing `ConsentBanner` to reappear (not requiring a reload).
   - Acceptance criteria: `npm test` passes all four cases. The decline/zero-cookies case must assert on `document.cookie` and/or the absence of the GA script element directly — not merely on the `consent` state value — since PRD §7 frames this as "a test that proves it," not a documentation claim.

---

### Task 16 — `AnalyticsListener` consent-gating test
   - Files: `src/lib/AnalyticsListener.test.tsx` (new)
   - Changes: Per PRD §7. Render `AnalyticsListener` under a `MemoryRouter` + a mocked `useConsent`/`isGaLoaded`/`trackPageView`. Cover:
     - With `consent: 'unset'` or `consent: 'denied'`, simulating a route change results in zero calls to `trackPageView`.
     - With `consent: 'granted'` and `isGaLoaded()` mocked `true`, a route change (both a pathname change and a hash-only change, e.g. `/` → `/#projects`) calls `trackPageView` with `pathname + hash`.
     - When `consent` transitions from `'unset'`/`'denied'` to `'granted'` mid-session with no route change, the effect re-runs and calls `trackPageView` for the *current* location (proves the "first real page view is sent at grant time" behavior `send_page_view: false` depends on).
   - Acceptance criteria: `npm test` passes all three cases; the hash-only-navigation case is a distinct assertion, not folded into the pathname case.

---

### Task 17 — `useContactMailto` hydration-safety test
   - Files: `src/hooks/useContactMailto.test.ts` (new)
   - Changes: Per PRD §7. Using `renderHook`, assert:
     - On the very first render (before any effect flush), the hook returns `null`.
     - After effects flush (`act(...)` or `waitFor`), the hook returns `` `mailto:tejitpabari99@gmail.com` `` exactly.
   - Acceptance criteria: `npm test` passes both assertions as separate checks within one test (pre-effect value and post-effect value both explicitly asserted, not just the final value) — this is the exact hydration-safety property PRD §4.1/§7 says SP03 depends on and must be "tested directly rather than only asserted in a comment."

---

### Task 18 — `useSectionViewTracking` dedupe test
   - Files: `src/lib/useSectionViewTracking.test.ts` (new)
   - Changes: Per PRD §7. Mock `IntersectionObserver` (a minimal fake that captures the callback passed to its constructor and lets the test invoke it manually), mock `trackEvent`, and stub `document.getElementById` to return fake elements for the four known section ids. Cover:
     - Triggering an intersecting entry for `id: 'projects'` twice in a row calls `trackEvent('section_view', { section: 'projects' })` exactly once (dedupe).
     - Triggering intersecting entries for two different ids each fires its own `section_view` call, once per id.
     - A non-intersecting entry (`isIntersecting: false`) never fires `trackEvent`.
   - Acceptance criteria: `npm test` passes all three cases.

---

### Task 19 — Legal pages smoke test + heading/`RouteMeta` assertions
   - Files: `src/pages/PrivacyPage.test.tsx` (new), `src/pages/TermsPage.test.tsx` (new)
   - Changes: Per PRD §7's "both legal pages render without throwing" bullet, extended to also pin the structural claims Tasks 12/13 make (redundant with the `dist/` grep in Task 20, but this layer catches a regression at component-test speed rather than requiring a full build). Render each page under a `MemoryRouter` with `ConsentProvider` (Privacy only needs it; Terms doesn't use `useConsent`). Cover:
     - The page renders without throwing.
     - Every `<h2>` heading listed in Task 12/13's acceptance criteria is present in the rendered output, in the order given.
     - `/privacy`'s "Clear my choice" button, when clicked, calls the mocked `clearConsent()`.
     - Neither page ever renders a literal `mailto:tejitpabari99@gmail.com` string or the bare `tejitpabari99@gmail.com` address in the DOM when `useContactMailto` is mocked to return `null` (simulating pre-mount/build-time render) — only `CONTACT_EMAIL_DISPLAY`'s obfuscated text appears.
   - Acceptance criteria: `npm test` passes all cases above for both pages.

---

### Task 20 — `dist/` build audit — email absence and prerendered legal routes
   - Files: none (verification checkpoint only — produces no code diff to commit, per the same pattern SP02's Task 6 used for its manual QA pass)
   - Changes: Per PRD §4.1, §7's "the one check that actually proves the obfuscation works end-to-end." Run, in order, after Tasks 1–13 are all merged:
     1. `npm run build`
     2. `grep -rn "tejitpabari99@gmail" dist/` — must return **zero** hits, anywhere in the entire `dist/` tree, across every prerendered route (not just `/privacy`/`/terms`/`/` — a stray import or accidental string elsewhere would also fail this).
     3. `grep -rn "tejitpabari99 _at_ gmail" dist/` — must return **one hit per page that renders a Contact section** (expected: `/`, once SP03's homepage Contact section lands; `/privacy`; `/terms` — until SP03 lands, expect exactly 2 hits from this sub-project's own pages).
     4. `grep -rln "mailto:" dist/` — must return **zero** files. A real `mailto:` href only ever exists in a post-mount DOM mutation, never in server/build-rendered bytes.
     5. Confirm `dist/privacy*/index.html` (or whatever path convention SP01 uses for static routes) and `dist/terms*/index.html` both exist as real files with non-trivial byte size (not empty shells).
   - Acceptance criteria: All five checks above pass, run against a real `npm run build` output — not inferred from a unit test. If any check fails, the regression is almost certainly in Task 1 (a constant reassembled at module scope instead of inside `getContactEmailAddress()`) or Task 12/13 (a page rendering the address directly instead of through `useContactMailto()`/`CONTACT_EMAIL_DISPLAY`) — fix at the source, don't special-case the grep.

---

## Summary of what requires you (not a dev agent)

1. **Mandatory: read every word of the drafted legal copy before it ships (PRD §8 item 3, §4.5, brief §2).** The text in Tasks 12/13 is accurate-as-drafted and not a placeholder, but it is not lawyer-reviewed and its author is not a lawyer. This must not ship unread. If tejitpabari.com or any hosted project ever starts collecting more than described (a form, an account, anything commercial), get an actual lawyer to review both pages before that ships — not before, since nothing here needs it yet.
2. **A specific framing call inside that read-through:** decide whether `/terms`'s "This isn't professional or medical advice" section (drafted given Juno's health-tech adjacency) should be lighter — this portfolio is one level removed from Juno itself, so the section as drafted may read as more caution than the site needs (PRD §8 item 3, §9).
3. **Confirm or replace `LAST_UPDATED`** (`'2026-08-30'` in both `PrivacyPage.tsx` and `TermsPage.tsx`, Tasks 12–13) with the actual date you approve the text for launch — shipping the placeholder date under text that wasn't actually reviewed yet would misrepresent the review, which is worse than an obviously-wrong placeholder.
4. **Decide the jurisdiction question** (PRD §9): this PRD recommends staying jurisdiction-agnostic (no explicit GDPR/CCPA naming), matching `juno-landing-page`'s own resolved decision — your call to override if your risk tolerance differs, not a default to accept blindly.
5. **Run `gh variable set VITE_GA_MEASUREMENT_ID`** for SP08's CI pipeline once that sub-project's workflow exists (PRD §8 item 2) — the value itself is already committed in `.env.example` (Task 10); this is the one piece of owner action actually required to get analytics flowing in production, since CI reads it as a repository variable, not from the committed file.
6. **After launch, confirm the GA4 property is actually receiving events** (spot-check the GA4 real-time report while accepting the consent banner on the live site once) — nothing in Tasks 1–20 can verify this itself, since it depends on the real deployed site, the real measurement ID reaching CI (item 5 above), and a real visitor accepting consent. Optionally also configure GA4's internal-traffic filter in the admin console at the same time (PRD §8 item 7) so your own testing visits don't skew the data — not required at launch, just convenient once you're checking in regularly.
7. **Two cross-sub-project sequencing hazards, flagged inline in the tasks above, not owner decisions but worth tracking:** (a) `ConsentBanner`'s Tailwind class names (Task 5) assume SP01 ships tokens literally named `teal-secondary`/`cream`/`body`/`ink`/`teal`/`maxWidth.content` — confirm against SP01's actual shipped config before treating a build failure there as this sub-project's bug; (b) the "no forms" comment in `routes.tsx` (Task 11) names `npm run check:no-forms`, a command that doesn't exist until SP04's tasks land later — expected, not a defect, given SP05 (Phase 2) runs before SP04.
8. **Nothing else in this sub-project is owner-blocked.** The obfuscation mechanism, the consent flow, the event catalogue, the `.env.example` value, and both pages' structure are all specified precisely enough (PRD §8 item 4 equivalent — every other item is either already resolved in §9 or a dev-agent-executable task above) for implementation to proceed without further input from you.
