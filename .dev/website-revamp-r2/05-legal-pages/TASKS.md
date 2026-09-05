# Tasks: Legal Pages

Source of truth: `/root/projects/tejitpabari/.dev/website-revamp-r2/05-legal-pages/PRD.md`. Every task
below cites the PRD §4 subsection it implements.

**Repo state assumption:** repo is `/root/projects/tejitpabari`, on branch `website-revamp`. This is a
Phase 3 sub-project (per `../README.md`) — it depends on R1 (`01-shell-nav-chrome`) having already
landed `src/layout/PageContainer.tsx` and `src/layout/chromeMode.ts` (Task 13/Task 4 of R1's own task
list). Tasks 4 and 5 below import `PageContainer` from `@/layout/PageContainer` and assume that file
already exists in the tree, exporting exactly the signature R1's Task 13 specifies:

```tsx
interface PageContainerProps {
  /** @default 'div' — pass 'article' for the two markdown detail pages. */
  as?: ElementType;
  chrome: ChromeMode;
  className?: string;
  children: ReactNode;
}
export function PageContainer({ as: Tag = 'div', chrome, className = '', children }: PageContainerProps)
```

`<PageContainer chrome="full">` renders `<div class="mx-auto w-full max-w-content px-6 pb-20 pt-28
sm:pt-32 sm:px-8 md:px-10 lg:px-12">`. Both `/privacy` and `/terms` keep the navbar (SHARED-CONTEXT
locked decision 2), so every use below is `chrome="full"`, never `"back-only"`, and never passes `as`
(both pages already render a `<div>` root, which is `PageContainer`'s default).

**Files this round owns, not touched by any other R1–R5 sub-project:** `src/pages/PrivacyPage.tsx`,
`src/pages/TermsPage.tsx`, `src/context/ConsentContext.tsx`, `src/components/ConsentBanner.tsx`,
`src/lib/analytics.ts`, `src/lib/analytics.test.ts` (PRD §9 item 4 — orchestrator-resolved ownership
gap), and each file's own test file.

**Test command note:** `npm test` runs `vitest run` (the full suite). `npm run typecheck` runs `tsc -b
--noEmit`. A single file can be run directly, e.g. `npx vitest run src/lib/analytics.test.ts`.

**Task ordering / independence (PRD's three concerns, kept separable and revertible):**

- Concern (a) — `PageContainer` adoption / top-padding fix: **Tasks 4, 5**.
- Concern (b) — "Clear my choice" behavior fix + GA teardown: **Tasks 2, 3, 6**.
- Concern (c) — copy rewrites: **Tasks 7, 8**.
- Task 1 (the `ConsentBanner.tsx` em-dash fix, PRD §4.4) is a small, fully independent fourth item —
  it is not part of any of the three named concerns, it is just already in R5's owned file list and
  cheap to fix now rather than leave for R6's sweep (PRD §9 item 6).

Dependency graph:

```
Task 1 (ConsentBanner)         — standalone
Task 2 (analytics.ts)          — standalone
Task 3 (ConsentContext.tsx)    — depends on Task 2
Task 4 (PrivacyPage: container)— standalone (needs R1's PageContainer to exist in the tree)
Task 5 (TermsPage: container)  — standalone (needs R1's PageContainer to exist in the tree)
Task 6 (PrivacyPage: button)   — depends on Task 3, Task 4
Task 7 (PrivacyPage: copy)     — depends on Task 6
Task 8 (TermsPage: copy)       — depends on Task 5
```

Tasks 1, 2, 4, 5 can each start immediately and in any order. Task 3 needs Task 2. Task 6 needs both
Task 3 and Task 4 (it edits the same file Task 4 already restructured, and calls into the `disableGa()`
path Task 3 wires up). Task 7 continues directly from Task 6's file state. Task 8 continues directly
from Task 5's file state and has no dependency on the Privacy-side tasks at all.

---

### Task 1 — `ConsentBanner.tsx` em-dash fix
   - Files: `src/components/ConsentBanner.tsx`
   - Changes: Per PRD §4.4. One clause, no behavioral change. Read in full; the banner's render guard
     (`if (!hydrated || consent !== 'unset') return null;`) and its `Accept`/`Decline` click handlers
     are untouched.

     Before:
     ```tsx
     <p className="text-sm text-body">
       I use Google Analytics to see whether people find this site — for example, from a
       LinkedIn post. It only runs, and only sets cookies, if you accept. See the{' '}
       <Link to="/privacy" className="underline hover:text-teal-secondary">Privacy Policy</Link>.
     </p>
     ```

     After:
     ```tsx
     <p className="text-sm text-body">
       I use Google Analytics to see whether people find this site, for example from a
       LinkedIn post. It only runs, and only sets cookies, if you accept. See the{' '}
       <Link to="/privacy" className="underline hover:text-teal-secondary">Privacy Policy</Link>.
     </p>
     ```
   - Acceptance criteria:
     1. `grep -c '—' src/components/ConsentBanner.tsx` → `0`.
     2. `grep -c 'for example from a' src/components/ConsentBanner.tsx` → `1`.
     3. `npm run typecheck` passes.
     4. `npm test` passes in full — no test file asserts on this paragraph's exact text (confirmed by
        reading `src/context/ConsentContext.test.tsx`, the only file that renders `<ConsentBanner />`
        in tests; it asserts only on the `Accept`/`Decline` buttons by role and name, never on this
        `<p>`'s text), so this task needs no test-file change.

---

### Task 2 — `src/lib/analytics.ts`: split `gaLoaded` into `gaScriptInjected`/`gaEnabled`, add `disableGa()`
   - Files: `src/lib/analytics.ts`, `src/lib/analytics.test.ts`
   - Changes: Per PRD §4.2. This is the correctness-critical half of concern (b) — see the note at the
     end of this task on one detail the PRD's own §4.2 code excerpt leaves implicit.

     Full replacement file:
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
       | 'section_view';

     export function trackEvent(
       name: AnalyticsEventName,
       params: Record<string, string | number | boolean> = {},
     ): void {
       if (!gaEnabled || typeof window.gtag !== 'function') return;
       window.gtag('event', name, params);
     }
     ```

     **One detail PRD §4.2's own code excerpt leaves implicit, filled in above:** the PRD's §4.2 block
     shows `loadGa()`, `isGaLoaded()`, `deleteGaCookies()`, and `disableGa()`, but not `trackPageView`/
     `trackEvent` — and the current file's versions of those two functions guard on the raw module
     variable `if (!gaLoaded || ...)`. Once `gaLoaded` is split into `gaScriptInjected`/`gaEnabled`,
     that identifier no longer exists, so both guards must move to `gaEnabled` (not a call to
     `isGaLoaded()` — same value, but these two functions already live inside `analytics.ts` itself and
     read the module-scope variable directly, matching the file's existing style). This is the only
     change needed to make the rest of the file compile against the new two-flag design; it does not
     change either function's externally observed behavior in any test that existed before this task
     (both still gate on "should hits be sent right now," exactly what `gaLoaded` meant before the
     split).

     Test file changes — append these new cases to the existing `describe('analytics.ts', ...)` block
     in `src/lib/analytics.test.ts` (the eight existing `it(...)` cases in that file are listed in this
     task's acceptance criteria below and all still pass unmodified against the file above; add the new
     cases after them, and extend the shared `afterEach` to also clear the opt-out flag):

     ```ts
     // extend the existing afterEach(() => { ... }) with one more line:
     delete (window as unknown as Record<string, boolean>)['ga-disable-G-VALID123'];
     ```

     ```ts
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
     ```
   - Acceptance criteria:
     1. `src/lib/analytics.ts` matches the full-replacement block above exactly.
     2. `npm run typecheck` passes — confirms no remaining reference to the removed `gaLoaded`
        identifier anywhere in the file (`grep -n '\bgaLoaded\b' src/lib/analytics.ts` → zero matches).
     3. `grep -c 'export function disableGa' src/lib/analytics.ts` → `1`.
     4. All eight pre-existing `it(...)` cases in `src/lib/analytics.test.ts` (`guard 1 alone...`,
        `guard 2 alone...`, `DEV=false + valid ID: loadGa injects...`, `loadGa is idempotent...`,
        `trackEvent never calls window.gtag when GA is not loaded...`, `trackEvent('outbound_click',
        ...) with GA loaded...`, `trackPageView never calls window.gtag when GA is not loaded`,
        `trackPageView calls window.gtag with a page_view event when GA is loaded`) still pass
        unmodified.
     5. The three new cases above pass: `disableGa` sets the window opt-out flag and flips
        `isGaLoaded()`; `disableGa` removes pre-set `_ga`/`_gid` cookies (assert via
        `document.cookie`); calling `loadGa()` again after `disableGa()` brings `isGaLoaded()` back to
        `true` while `scriptCount()` (the existing helper counting
        `script[src*="googletagmanager"]` elements) stays `1`.
     6. `npm test` passes in full.

---

### Task 3 — `src/context/ConsentContext.tsx`: `clearConsent()` calls `disableGa()`
   - Files: `src/context/ConsentContext.tsx`, `src/context/ConsentContext.test.tsx`
   - Changes: Per PRD §4.3. Depends on Task 2. No other change to this file — `grant()`, `decline()`,
     the mount effect, and `readStoredConsent()` are untouched (none of them were implicated in either
     bug per PRD §4.1).

     Before (current `clearConsent`):
     ```tsx
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
     ```

     After — add the import, replace `clearConsent`:
     ```tsx
     // top-of-file import, alongside the existing loadGa import:
     import { loadGa, disableGa } from '@/lib/analytics';
     ```
     ```tsx
     function clearConsent(): void {
       // Implements the "Clear my choice" affordance on /privacy. Beyond
       // resetting the stored choice and in-memory state (which is all this used
       // to do), this must also stop Google Analytics from sending further hits
       // this session and remove any analytics cookies already on the device —
       // see analytics.ts's disableGa() and PRD 05 (R5) §4.1/§4.2 for why the
       // old version of this function was an incomplete fix, not a broken one.
       try {
         localStorage.removeItem(STORAGE_KEY);
       } catch {
         /* best-effort */
       }
       disableGa();
       setConsent('unset');
     }
     ```

     Test file change — add one new test to `src/context/ConsentContext.test.tsx`'s existing
     `describe('ConsentContext / ConsentBanner', ...)` block (the existing `'clearConsent resets
     storage and consent to unset, and the banner reappears without a reload'` test stays unmodified —
     it uses `decline()`, which never loads GA, so it has nothing to assert about `disableGa()`'s
     effects; this is a genuinely new scenario, not an edit to that one). Also extend the shared
     `afterEach` with one more cleanup line:

     ```ts
     // extend the existing afterEach(() => { ... }) with one more line:
     delete (window as unknown as { [k: string]: unknown })['ga-disable-G-TEST123'];
     ```

     ```tsx
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
     ```
   - Acceptance criteria:
     1. `src/context/ConsentContext.tsx`'s `clearConsent` matches the "after" block exactly; the new
        import line is present; no other function in the file changed
        (`git diff src/context/ConsentContext.tsx` touches only the import line and `clearConsent`'s
        body).
     2. `npm run typecheck` passes.
     3. The pre-existing `'clearConsent resets storage and consent to unset, and the banner reappears
        without a reload'` test in `ConsentContext.test.tsx` still passes unmodified.
     4. The new `'clearConsent after granting also disables GA and removes GA cookies...'` test passes:
        after `grant()` then a manually-set `_ga` cookie then `clearConsent()`, `isGaLoaded()` is
        `false`, `window['ga-disable-G-TEST123']` is `true`, the `_ga` cookie is gone from
        `document.cookie`, and `localStorage.getItem('tejitpabari:consent')` is `null`.
     5. `npm test` passes in full.

---

### Task 4 — `src/pages/PrivacyPage.tsx`: adopt `PageContainer` (padding fix only)
   - Files: `src/pages/PrivacyPage.tsx`
   - Changes: Per PRD §4.5 (padding-fix portion only — button gating is Task 6, copy is Task 7).
     Requires `src/layout/PageContainer.tsx` to already exist in the tree (R1). Only the import list and
     the outer container's opening/closing tags change; every `Section`, every paragraph, the button,
     and `RouteMeta`'s props are byte-for-byte unchanged in this task.

     Before (relevant lines — current file, in full apart from the body between `<div ...>` and its
     matching close, which is every `Section` and paragraph, untouched by this task):
     ```tsx
     // src/pages/PrivacyPage.tsx
     import type { ReactNode } from 'react';
     import { RouteMeta } from '@/components/RouteMeta';
     import { CONTACT_EMAIL_DISPLAY } from '@/config/contact';
     import { useContactMailto } from '@/hooks/useContactMailto';
     import { useConsent } from '@/context/ConsentContext';

     const LAST_UPDATED = '2026-08-30'; // placeholder — owner confirms the real ship date

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
             {/* ...every Section, unchanged by this task... */}
           </div>
         </div>
       );
     }
     ```

     After:
     ```tsx
     // src/pages/PrivacyPage.tsx
     import type { ReactNode } from 'react';
     import { PageContainer } from '@/layout/PageContainer';
     import { RouteMeta } from '@/components/RouteMeta';
     import { CONTACT_EMAIL_DISPLAY } from '@/config/contact';
     import { useContactMailto } from '@/hooks/useContactMailto';
     import { useConsent } from '@/context/ConsentContext';

     const LAST_UPDATED = '2026-08-30'; // placeholder — owner confirms the real ship date

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
         <PageContainer chrome="full">
           <RouteMeta
             title="Privacy Policy"
             description="This is Tejit Pabari's personal portfolio — no company, no accounts, no forms today. Here is what this site (and everything hosted under it) collects, and what your choices are."
             path="/privacy"
           />
           <div className="mx-auto max-w-2xl space-y-8">
             {/* ...every Section, unchanged by this task... */}
           </div>
         </PageContainer>
       );
     }
     ```
   - Acceptance criteria:
     1. `grep -c '<PageContainer chrome="full">' src/pages/PrivacyPage.tsx` → `1`.
     2. `grep -c 'mx-auto max-w-content px-4 py-16' src/pages/PrivacyPage.tsx` → `0` (old inline
        container class fully gone).
     3. `grep -c "import { PageContainer } from '@/layout/PageContainer';" src/pages/PrivacyPage.tsx` →
        `1`.
     4. `npm run typecheck` passes.
     5. `npx vitest run src/pages/PrivacyPage.test.tsx` passes unmodified — that file makes no
        assertion on the outer container's className (confirmed by reading it), so this task needs no
        test-file change.
     6. `npm test` passes in full.

---

### Task 5 — `src/pages/TermsPage.tsx`: adopt `PageContainer` (padding fix only)
   - Files: `src/pages/TermsPage.tsx`
   - Changes: Per PRD §4.6 (padding-fix portion only — copy is Task 8). Same pattern as Task 4; no
     other line in the file changes.

     Before (relevant lines):
     ```tsx
     // src/pages/TermsPage.tsx
     import type { ReactNode } from 'react';
     import { RouteMeta } from '@/components/RouteMeta';
     import { CONTACT_EMAIL_DISPLAY } from '@/config/contact';
     import { useContactMailto } from '@/hooks/useContactMailto';

     const LAST_UPDATED = '2026-08-30'; // placeholder — owner confirms the real ship date

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
             {/* ...every Section, unchanged by this task... */}
           </div>
         </div>
       );
     }
     ```

     After:
     ```tsx
     // src/pages/TermsPage.tsx
     import type { ReactNode } from 'react';
     import { PageContainer } from '@/layout/PageContainer';
     import { RouteMeta } from '@/components/RouteMeta';
     import { CONTACT_EMAIL_DISPLAY } from '@/config/contact';
     import { useContactMailto } from '@/hooks/useContactMailto';

     const LAST_UPDATED = '2026-08-30'; // placeholder — owner confirms the real ship date

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
         <PageContainer chrome="full">
           <RouteMeta
             title="Terms of Use"
             description="Terms governing use of tejitpabari.com, a personal portfolio — no company, no warranty, and how hosted projects and outbound links are treated."
             path="/terms"
           />
           <div className="mx-auto max-w-2xl space-y-8">
             {/* ...every Section, unchanged by this task... */}
           </div>
         </PageContainer>
       );
     }
     ```
   - Acceptance criteria:
     1. `grep -c '<PageContainer chrome="full">' src/pages/TermsPage.tsx` → `1`.
     2. `grep -c 'mx-auto max-w-content px-4 py-16' src/pages/TermsPage.tsx` → `0`.
     3. `grep -c "import { PageContainer } from '@/layout/PageContainer';" src/pages/TermsPage.tsx` →
        `1`.
     4. `npm run typecheck` passes.
     5. `npx vitest run src/pages/TermsPage.test.tsx` passes unmodified — no assertion on the outer
        container's className.
     6. `npm test` passes in full.

---

### Task 6 — `src/pages/PrivacyPage.tsx`: "Clear my choice" button-gating + confirmation (`ConsentStatus`)
   - Files: `src/pages/PrivacyPage.tsx`, `src/pages/PrivacyPage.test.tsx`, `src/context/ConsentContext.test.tsx`
   - Changes: Per PRD §4.1/§4.5's `ConsentStatus` component. Depends on Task 3 (`disableGa()` wired into
     `clearConsent()`) and Task 4 (this task edits the file Task 4 already restructured). Root-cause fix
     for "Clear my choice doesn't work" (§4.1 Hypothesis 1): the old button rendered unconditionally,
     including when `consent === 'unset'`, so clicking it called `localStorage.removeItem` on a key that
     was never set and `setConsent('unset')` on a value already `'unset'` — nothing observable happened.
     This task only touches the `useConsent`-related pieces (imports, the function's own destructuring,
     the "Your consent choice" `Section`'s second paragraph + button). The plain-prose paragraph above it
     in that same `Section`, `RouteMeta`'s description, and every other `Section` in the file are
     untouched here — their copy changes in Task 7.

     Before (state after Task 4 — only the relevant pieces shown; everything else in the file is as
     Task 4 left it):
     ```tsx
     import type { ReactNode } from 'react';
     import { PageContainer } from '@/layout/PageContainer';
     import { RouteMeta } from '@/components/RouteMeta';
     import { CONTACT_EMAIL_DISPLAY } from '@/config/contact';
     import { useContactMailto } from '@/hooks/useContactMailto';
     import { useConsent } from '@/context/ConsentContext';

     // ...LAST_UPDATED, Section — unchanged...

     export function PrivacyPage() {
       const { consent, clearConsent } = useConsent();
       const emailHref = useContactMailto();

       return (
         <PageContainer chrome="full">
           {/* ...RouteMeta, header, intro paragraph, all Sections up through
               "What this site does collect" — unchanged... */}

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

           {/* ...remaining Sections — unchanged... */}
         </PageContainer>
       );
     }
     ```

     After:
     ```tsx
     import { useEffect, useState, type ReactNode } from 'react';
     import { PageContainer } from '@/layout/PageContainer';
     import { RouteMeta } from '@/components/RouteMeta';
     import { CONTACT_EMAIL_DISPLAY } from '@/config/contact';
     import { useContactMailto } from '@/hooks/useContactMailto';
     import { useConsent } from '@/context/ConsentContext';

     // ...LAST_UPDATED, Section — unchanged...

     /**
      * The "Your consent choice" status line + Clear control. Root-cause fix for
      * "Clear my choice doesn't work" (PRD 05 §4.1): the old button rendered
      * unconditionally, including when consent was already 'unset': clicking it
      * then called localStorage.removeItem on a key that was never set and
      * setConsent('unset') on a value already 'unset', so nothing observable
      * happened; the status line read the same before and after. Fixed by (1)
      * only rendering the button when there's something to clear
      * (consent !== 'unset'), and (2) showing an explicit on-page confirmation
      * when it's clicked, rather than relying on a status line whose text may
      * already have read the same way pre-click.
      */
     function ConsentStatus() {
       const { consent, clearConsent } = useConsent();
       const [justCleared, setJustCleared] = useState(false);

       // A fresh Accept/Decline (from the banner shown immediately below, which
       // reappears the instant consent becomes 'unset') supersedes the "Cleared"
       // confirmation.
       useEffect(() => {
         if (consent !== 'unset') setJustCleared(false);
       }, [consent]);

       function handleClear() {
         clearConsent();
         setJustCleared(true);
       }

       return (
         <>
           <p>
             Your saved analytics choice is currently{' '}
             <strong>{consent === 'unset' ? 'not set' : consent}</strong>.{' '}
             {consent === 'unset'
               ? 'There is nothing to clear yet. You will see the banner below the first time it has something to ask.'
               : 'You can clear this choice at any time. Clearing turns off Google Analytics for the rest of this visit, removes any analytics cookies already set on this device, and shows the banner again so you can decide again.'}
           </p>
           {consent !== 'unset' && (
             <button
               type="button"
               onClick={handleClear}
               className="rounded-full border border-teal-secondary/20 px-4 py-2 text-sm font-semibold text-teal-secondary hover:bg-teal-secondary/8"
             >
               Clear my choice
             </button>
           )}
           {justCleared && (
             <p role="status" className="text-sm font-semibold text-teal-secondary">
               Cleared. Your analytics choice has been reset, and Google Analytics is now off for the
               rest of this visit.
             </p>
           )}
           <p className="text-xs text-slate">
             Clearing your choice does not, and cannot, recall analytics data already sent to Google
             before you clear it. No website can undo that after the fact; this only changes what
             happens from this point forward.
           </p>
         </>
       );
     }

     export function PrivacyPage() {
       const emailHref = useContactMailto();

       return (
         <PageContainer chrome="full">
           {/* ...RouteMeta, header, intro paragraph, all Sections up through
               "What this site does collect" — unchanged... */}

           <Section title="Your consent choice">
             <p>
               When you accept or decline the analytics banner, that choice is saved in your
               browser's local storage — a small piece of on-device storage, not a cookie sent to
               any server — so you're not asked again on every visit.
             </p>
             <ConsentStatus />
           </Section>

           {/* ...remaining Sections — unchanged... */}
         </PageContainer>
       );
     }
     ```

     Note: the em dash in `ConsentStatus`'s own JSDoc comment above has been written as a colon here
     (`already 'unset': clicking it`, not `already 'unset' — clicking it`) precisely so this comment
     does not conflict with the file-wide zero-em-dash property Task 7 (copy rewrite) checks for —
     Task 7 carries this component forward byte-for-byte, comments included.

     `PrivacyPage.test.tsx` — replace the single `'"Clear my choice" calls the mocked clearConsent()'`
     test with two scenarios:

     ```tsx
     it('with consent unset, "Clear my choice" is not rendered and the status says there is nothing to clear', () => {
       renderPrivacyPage();
       expect(screen.queryByRole('button', { name: 'Clear my choice' })).toBeNull();
       expect(screen.getByText(/There is nothing to clear yet/)).toBeInTheDocument();
     });

     it('with consent granted, "Clear my choice" calls the mocked clearConsent() and shows the Cleared confirmation', () => {
       vi.mocked(useConsent).mockReturnValue({
         consent: 'granted',
         hydrated: true,
         grant: vi.fn(),
         decline: vi.fn(),
         clearConsent: clearConsentMock,
       });
       renderPrivacyPage();
       fireEvent.click(screen.getByRole('button', { name: 'Clear my choice' }));
       expect(clearConsentMock).toHaveBeenCalledTimes(1);
       expect(screen.getByRole('status')).toHaveTextContent('Cleared.');
     });
     ```

     `src/context/ConsentContext.test.tsx` — the one integration test that proves the GA-teardown fix
     end to end through the *real* button, not a mock. Extend `freshModules()` to also dynamically
     import the real `PrivacyPage` (dynamic, like `ConsentBanner`, so it binds to the freshly reset
     module graph — a static top-of-file import would bind to a stale `analytics.ts`/`ConsentContext.tsx`
     instance from before `vi.resetModules()`):

     ```tsx
     // freshModules(), extended:
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
     ```

     ```tsx
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
     ```
   - Acceptance criteria:
     1. `src/pages/PrivacyPage.tsx` matches the "after" block above (`ConsentStatus` defined verbatim,
        `PrivacyPage` no longer destructures `consent`/`clearConsent` directly — only `ConsentStatus`
        calls `useConsent()`).
     2. With `consent === 'unset'`, `screen.queryByRole('button', { name: 'Clear my choice' })` is
        `null` and the status text contains "There is nothing to clear yet" — asserted in
        `PrivacyPage.test.tsx`.
     3. With `consent === 'granted'`, the button renders with the accessible name `'Clear my choice'`;
        clicking it calls the mocked `clearConsent` exactly once and reveals a `role="status"` element
        whose text starts with "Cleared." — asserted in `PrivacyPage.test.tsx`.
     4. `npm run typecheck` passes.
     5. The new end-to-end `ConsentContext.test.tsx` case passes, proving (through the real button,
        not a mock): `localStorage` cleared, the `_ga` cookie removed from `document.cookie`,
        `window['ga-disable-G-TEST123']` set to `true`, the button gone, and the confirmation visible —
        all from one real click.
     6. `npm test` passes in full.

---

### Task 7 — `src/pages/PrivacyPage.tsx`: full copy rewrite
   - Files: `src/pages/PrivacyPage.tsx`, `src/pages/PrivacyPage.test.tsx`
   - Changes: Per PRD §4.5/§4.7. Depends on Task 6. Full replacement file below (copy reproduced
     verbatim from PRD §4.5 — checked, zero em dashes, zero contractions). `ConsentStatus` and the
     `PageContainer` wrapper are unchanged from Task 6; every `Section`'s prose, `RouteMeta`'s
     description, and the intro paragraph change. **`LAST_UPDATED` stays `'2026-08-30'` — do not
     change it.** That value is a deliberate placeholder; R6 (`06-voice-sweep-and-ship` PRD §4.7 "Step
     2") sets the real ship date as the very last step before the PR to `main` opens (PRD §8 item 2,
     §9 item 5). Changing it here would go stale between this review and R6's own ship sequence.

     ```tsx
     // src/pages/PrivacyPage.tsx
     import { useEffect, useState, type ReactNode } from 'react';
     import { PageContainer } from '@/layout/PageContainer';
     import { RouteMeta } from '@/components/RouteMeta';
     import { CONTACT_EMAIL_DISPLAY } from '@/config/contact';
     import { useContactMailto } from '@/hooks/useContactMailto';
     import { useConsent } from '@/context/ConsentContext';

     const LAST_UPDATED = '2026-08-30'; // placeholder — owner confirms the real ship date, see PRD §8

     function Section({ title, children }: { title: string; children: ReactNode }) {
       return (
         <section className="space-y-3">
           <h2 className="text-xl font-semibold text-ink">{title}</h2>
           <div className="space-y-3 text-sm leading-6 text-body">{children}</div>
         </section>
       );
     }

     /**
      * The "Your consent choice" status line + Clear control. Root-cause fix for
      * "Clear my choice doesn't work" (PRD 05 §4.1): the old button rendered
      * unconditionally, including when consent was already 'unset': clicking it
      * then called localStorage.removeItem on a key that was never set and
      * setConsent('unset') on a value already 'unset', so nothing observable
      * happened; the status line read the same before and after. Fixed by (1)
      * only rendering the button when there's something to clear
      * (consent !== 'unset'), and (2) showing an explicit on-page confirmation
      * when it's clicked, rather than relying on a status line whose text may
      * already have read the same way pre-click.
      */
     function ConsentStatus() {
       const { consent, clearConsent } = useConsent();
       const [justCleared, setJustCleared] = useState(false);

       // A fresh Accept/Decline (from the banner shown immediately below, which
       // reappears the instant consent becomes 'unset') supersedes the "Cleared"
       // confirmation.
       useEffect(() => {
         if (consent !== 'unset') setJustCleared(false);
       }, [consent]);

       function handleClear() {
         clearConsent();
         setJustCleared(true);
       }

       return (
         <>
           <p>
             Your saved analytics choice is currently{' '}
             <strong>{consent === 'unset' ? 'not set' : consent}</strong>.{' '}
             {consent === 'unset'
               ? 'There is nothing to clear yet. You will see the banner below the first time it has something to ask.'
               : 'You can clear this choice at any time. Clearing turns off Google Analytics for the rest of this visit, removes any analytics cookies already set on this device, and shows the banner again so you can decide again.'}
           </p>
           {consent !== 'unset' && (
             <button
               type="button"
               onClick={handleClear}
               className="rounded-full border border-teal-secondary/20 px-4 py-2 text-sm font-semibold text-teal-secondary hover:bg-teal-secondary/8"
             >
               Clear my choice
             </button>
           )}
           {justCleared && (
             <p role="status" className="text-sm font-semibold text-teal-secondary">
               Cleared. Your analytics choice has been reset, and Google Analytics is now off for the
               rest of this visit.
             </p>
           )}
           <p className="text-xs text-slate">
             Clearing your choice does not, and cannot, recall analytics data already sent to Google
             before you clear it. No website can undo that after the fact; this only changes what
             happens from this point forward.
           </p>
         </>
       );
     }

     export function PrivacyPage() {
       const emailHref = useContactMailto();

       return (
         <PageContainer chrome="full">
           <RouteMeta
             title="Privacy Policy"
             description="This is Tejit Pabari's personal portfolio: no company, no accounts, and no forms today. Here is what this site, and everything hosted under it, collects, and what your choices are."
             path="/privacy"
           />
           <div className="mx-auto max-w-2xl space-y-8">
             <header className="space-y-1">
               <h1 className="text-3xl font-semibold text-ink">Privacy Policy</h1>
               <p className="text-sm text-slate">Last updated: {LAST_UPDATED}</p>
             </header>

             <p className="text-sm leading-6 text-body">
               This is Tejit Pabari's personal portfolio site. There is no company behind it: it is not
               a registered business, and there is no "we." This policy explains, in plain language,
               what this site (and everything hosted directly under it) collects when you visit, and
               what your choices are.
             </p>

             <Section title="The short version">
               <p>
                 This site has no accounts, no sign-up, and no login. As of the date above, it has no
                 forms anywhere: there is nowhere on this site to type something and submit it to me.
                 Two things are involved: optional analytics, through Google Analytics, which runs only
                 if you accept the banner shown on your first visit; and basic web server logs that
                 Firebase (my hosting provider, part of Google) generates automatically for every
                 request. I do not access, analyze, or build anything on top of those logs.
               </p>
             </Section>

             <Section title="What this covers">
               <p>
                 This policy covers tejitpabari.com and everything hosted directly under this domain,
                 including project pages I have built and hosted myself at addresses such as{' '}
                 <code>/projects/&lt;name&gt;/live</code>. If a project of mine lives on its own
                 domain, such as meetjuno.health for Juno, that project has its own privacy policy, and
                 this page does not speak for it. Where that applies, I link to the project's own
                 policy from its page here.
               </p>
               <p>
                 <strong>This is a standing commitment, not a one-time fact.</strong> As I add new
                 hosted projects under <code>/projects/*/live</code>, one of them may eventually need
                 to collect something this page does not currently describe, for example an input
                 field. If that happens, I will update this page, and that project's own writeup,
                 before the project goes live, not after. If you are reading this and a project you are
                 using appears to ask for something this page does not describe, that is a gap in this
                 page, not a hidden feature. Please email me (see Contact, below).
               </p>
             </Section>

             <Section title="What this site does not do">
               <ul className="list-disc space-y-1 pl-5">
                 <li>No user accounts or login</li>
                 <li>
                   No forms of any kind, anywhere on the domain, as of the date above: nothing here to
                   type into and submit
                 </li>
                 <li>No comments, uploads, or user-generated content</li>
                 <li>No database that stores anything about you</li>
                 <li>
                   No sale of data, and no sharing of data with third parties for their own purposes
                   (Google Analytics, described below, acts only as a service provider processing this
                   site's own analytics)
                 </li>
                 <li>No advertising, ad tracking, or retargeting</li>
               </ul>
             </Section>

             <Section title="What this site does collect">
               <h3 className="text-base font-semibold text-ink">Google Analytics (optional)</h3>
               <p>
                 I use Google Analytics 4 to see whether people find this site, for example whether a
                 post I share on LinkedIn brings visitors here, and which projects people look at once
                 they arrive. That is the only reason it is here.
               </p>
               <p>
                 Google Analytics runs only if you select "Accept" on the banner. If you select
                 "Decline," or do not respond, Google Analytics does not load, and no analytics cookies
                 are set on your device.
               </p>
               <p>
                 If you accept, Google Analytics collects information such as: which pages you view and
                 how long you spend on them; an approximate location, estimated from your IP address
                 (Google Analytics does not retain your full IP address); the type of device and
                 browser you are using; and how you arrived at the site. It also records a small number
                 of specific interactions I have chosen to track because they tell me something useful:
                 which project or research card you click, which outbound link you follow (a live
                 project, a paper, a GitHub repository, LinkedIn), whether you click through to my
                 résumé, and, if you use the search box on <code>/projects</code> or{' '}
                 <code>/research</code>, what you typed. I use this information to understand what
                 visitors are looking for, not to identify who is looking. Google processes and stores
                 this data as described in its own privacy policy (policies.google.com/privacy). I only
                 ever see aggregated reports, never an individual visitor's browsing history.
               </p>
               <p>
                 <strong>A note on the search box:</strong> it is not a form. What you type is used
                 locally, in your browser, to filter the list as you type, and is not sent to a server
                 or stored by me directly. If you have accepted analytics, the text you search for is
                 also sent to Google Analytics as an event, so I can see what visitors are looking for.
                 Please avoid typing anything personal into it: it is the one place on this site where
                 typed text can be logged.
               </p>
               <p>
                 You can withdraw consent at any time. See "Your consent choice," below, or clear this
                 site's browsing data in your own browser; either resets your choice and shows the
                 banner again.
               </p>
               <h3 className="text-base font-semibold text-ink">Hosting logs</h3>
               <p>
                 This site is hosted on Firebase Hosting, a Google product. Like most website hosts,
                 Firebase Hosting automatically generates basic server logs for each request, typically
                 including the requester's IP address, the page requested, the time of the request, and
                 the browser's user agent. This is standard web infrastructure, not something built or
                 configured specifically for this site, and I do not run any separate tracking,
                 profiling, or analysis on top of it.
               </p>
             </Section>

             <Section title="Your consent choice">
               <p>
                 When you accept or decline the analytics banner, that choice is saved in your
                 browser's local storage (on-device storage that is not sent to any server), so you are
                 not asked again on every visit.
               </p>
               <ConsentStatus />
             </Section>

             <Section title="Cookies, in full">
               <p>
                 The only cookies this site can set are Google Analytics cookies, and only after you
                 select "Accept." Your consent choice itself is stored in local storage, not a cookie.
                 If you decline, this site sets no cookies at all. Clearing your choice (above) removes
                 any Google Analytics cookies already on this device.
               </p>
             </Section>

             <Section title="Outbound links">
               <p>
                 This site links to other things: GitHub, LinkedIn, project repositories, papers, and
                 other sites I have built, including Juno (meetjuno.health), which has its own separate
                 privacy policy and terms. Once you follow a link elsewhere, you are on someone else's
                 site, governed by their practices, not this one.
               </p>
             </Section>

             <Section title="Children">
               <p>
                 This site is not directed at children and is not designed to knowingly collect
                 information from anyone, of any age.
               </p>
             </Section>

             <Section title="Changes to this policy">
               <p>
                 If what this site collects ever changes, including because a new hosted project needs
                 something this page does not describe today, I will update this page and the date
                 above before that change ships.
               </p>
             </Section>

             <Section title="Contact">
               <p>
                 For questions about this policy, or about what is collected, contact me directly:{' '}
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
         </PageContainer>
       );
     }
     ```

     `PrivacyPage.test.tsx` — update the `'reflects the page title and description...'` test's expected
     `description` string (only that one string changes):
     ```tsx
     expect(description?.getAttribute('content')).toBe(
       "This is Tejit Pabari's personal portfolio: no company, no accounts, and no forms today. " +
         'Here is what this site, and everything hosted under it, collects, and what your choices are.',
     );
     ```
   - Acceptance criteria:
     1. `src/pages/PrivacyPage.tsx` matches the block above exactly.
     2. `grep -v 'LAST_UPDATED' src/pages/PrivacyPage.tsx | grep -c '—'` → `0` — zero em dashes
        anywhere in the file's rendered copy. (The `LAST_UPDATED` line's own trailing comment is
        excluded from this check: it is pre-existing, non-user-visible source-code prose, explicitly
        left untouched per criterion 7 below, not "copy" in the sense locked decision 7 governs.)
     3. `grep -Ec "\b(it's|isn't|doesn't|don't|you're|I'll|can't|won't|didn't)\b" src/pages/PrivacyPage.tsx`
        → `0` (no contractions in the rendered copy).
     4. `EXPECTED_HEADINGS` in `PrivacyPage.test.tsx` needs **no change** — every `<h2>` title in the
        rewrite above is identical to what the test already expects (`'The short version'`, `'What
        this covers'`, `'What this site does not do'`, `'What this site does collect'`, `'Cookies, in
        full'`, `'Outbound links'`, `'Children'`, `'Changes to this policy'`, `'Contact'`); confirm
        `npx vitest run src/pages/PrivacyPage.test.tsx` still passes the heading-order test unmodified.
     5. The `'the "What this site does not do" section body actually states there are no forms'` test
        passes unmodified — the exact substring `'No forms of any kind, anywhere on the domain, as of
        the date above'` is preserved verbatim in the rewrite's bullet list.
     6. The updated `'reflects the page title and description...'` test passes with the new
        `description` string above.
     7. `grep -c "LAST_UPDATED = '2026-08-30'" src/pages/PrivacyPage.tsx` → `1` (placeholder
        unchanged — do not touch it; see the note above the code block).
     8. `npm run typecheck` passes.
     9. `npm test` passes in full.

---

### Task 8 — `src/pages/TermsPage.tsx`: full copy rewrite
   - Files: `src/pages/TermsPage.tsx`, `src/pages/TermsPage.test.tsx`
   - Changes: Per PRD §4.6/§4.7. Depends on Task 5. Full replacement file below (copy reproduced
     verbatim from PRD §4.6 — checked, zero em dashes, zero contractions). No consent UI on this page;
     its only changes versus Task 5's output are copy. **`LAST_UPDATED` stays `'2026-08-30'` — do not
     change it**, for the same reason as Task 7 (R6 sets the real date, PRD §8 item 2/§9 item 5).

     **Heading-change note, corrects a gap in PRD §7:** the PRD's own testing section (§7) states that
     only `EXPECTED_HEADINGS[0]` changes ("This isn't professional or medical advice" → "Not medical or
     professional advice"). That is incomplete — comparing the current file's headings against PRD
     §4.6's actual rewritten copy shows **two more headings also change**: "Individual projects may
     carry their own licence" → "Project licences" (index 4), and "Links to other sites aren't
     endorsements" → "Links to other sites" (index 5). This task implements PRD §4.6's copy exactly as
     given (that copy is not in question — only §7's summary of what it breaks was incomplete), and
     updates all three `EXPECTED_HEADINGS` entries accordingly. See this task list's final report note
     to the orchestrator; this is not a scope change, §4.6's own heading text already decided all three.

     ```tsx
     // src/pages/TermsPage.tsx
     import type { ReactNode } from 'react';
     import { PageContainer } from '@/layout/PageContainer';
     import { RouteMeta } from '@/components/RouteMeta';
     import { CONTACT_EMAIL_DISPLAY } from '@/config/contact';
     import { useContactMailto } from '@/hooks/useContactMailto';

     const LAST_UPDATED = '2026-08-30'; // placeholder — owner confirms the real ship date, see PRD §8

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
         <PageContainer chrome="full">
           <RouteMeta
             title="Terms of Use"
             description="Terms governing use of tejitpabari.com, a personal portfolio: no company, no warranty, and information on how hosted projects and outbound links are treated."
             path="/terms"
           />
           <div className="mx-auto max-w-2xl space-y-8">
             <header className="space-y-1">
               <h1 className="text-3xl font-semibold text-ink">Terms of Use</h1>
               <p className="text-sm text-slate">Last updated: {LAST_UPDATED}</p>
             </header>

             <p className="text-sm leading-6 text-body">
               This site, tejitpabari.com, is operated by me, Tejit Pabari, as a personal portfolio,
               not a company. By using it, you agree to the following.
             </p>

             <Section title="Not medical or professional advice">
               <p>
                 Nothing on this site, including anything about Juno (an AI companion for medical
                 appointments that I founded, with its own separate site and terms at
                 meetjuno.health), constitutes medical advice. Nothing here should be used to make a
                 medical, treatment, engineering, or business decision. This site is a portfolio: it
                 describes and links to things I have built, and does not itself provide any medical,
                 clinical, or other professional service. If you are looking for Juno as a product, go
                 to meetjuno.health directly; that site's own terms and privacy policy govern its use,
                 not this page.
               </p>
             </Section>

             <Section title="What this covers">
               <p>
                 These terms cover tejitpabari.com and everything hosted directly under this domain,
                 including project pages I host myself at addresses such as{' '}
                 <code>/projects/&lt;name&gt;/live</code>. A project hosted elsewhere, on its own
                 domain or subdomain, is governed by that project's own terms, not this page.
               </p>
             </Section>

             <Section title="No forms, today">
               <p>
                 As of the date above, this site has no forms, accounts, or logins anywhere, and does
                 not accept anything you submit. If a future project hosted here needs to change that,
                 I will update this page, and that project's own page, before it ships, not after. See{' '}
                 <code>/privacy</code> for the same commitment, stated in more detail.
               </p>
             </Section>

             <Section title="No warranty">
               <p>
                 This site, and every project on it, is provided "as is," without warranty of any kind.
                 I do not represent that anything here is accurate, complete, current, uninterrupted,
                 or error-free. These are personal projects built around a full-time job; please treat
                 them accordingly, and do not rely on them for anything important without checking
                 independently.
               </p>
             </Section>

             <Section title="Project licences">
               <p>
                 Some projects on this site are open source and link to their own repository, which
                 may carry its own software licence. Where that is the case, the project's own licence
                 governs use of its code; this page does not override it. Where a project does not
                 state a licence, do not assume you are free to reuse its code.
               </p>
             </Section>

             <Section title="Links to other sites">
               <p>
                 This site links to other websites, tools, and profiles, including GitHub and
                 LinkedIn. A link does not mean I endorse, vouch for, or am affiliated with the
                 destination beyond what is explicitly stated. I am not responsible for the content or
                 practices of anything I link to.
               </p>
             </Section>

             <Section title="My views are my own">
               <p>
                 I have a full-time position as a software engineer at Microsoft. Everything on this
                 site, including its content, opinions, and the projects it links to, reflects my own
                 personal work and views, done on my own time; it does not represent Microsoft's views
                 or work. Juno is a separate company with its own site; this portfolio only links to
                 it, and is not where Juno operates.
               </p>
             </Section>

             <Section title="Changes">
               <p>
                 I may change, update, or take down this site or any project on it at any time,
                 without notice. I may also update these terms; the date above reflects the most
                 recent change.
               </p>
             </Section>

             <Section title="Contact">
               <p>
                 For questions about these terms, contact me:{' '}
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
         </PageContainer>
       );
     }
     ```

     *(No "Governing Law" clause — round-1 decision, not reopened; the existing test already asserts
     its absence.)*

     `TermsPage.test.tsx` — update `EXPECTED_HEADINGS` (three entries change, not one — see the note
     above) and the description string:
     ```tsx
     const EXPECTED_HEADINGS = [
       'Not medical or professional advice',
       'What this covers',
       'No forms, today',
       'No warranty',
       'Project licences',
       'Links to other sites',
       'My views are my own',
       'Changes',
       'Contact',
     ];
     ```
     ```tsx
     expect(description?.getAttribute('content')).toBe(
       'Terms governing use of tejitpabari.com, a personal portfolio: no company, no warranty, and ' +
         'information on how hosted projects and outbound links are treated.',
     );
     ```
   - Acceptance criteria:
     1. `src/pages/TermsPage.tsx` matches the block above exactly.
     2. `grep -v 'LAST_UPDATED' src/pages/TermsPage.tsx | grep -c '—'` → `0` (same `LAST_UPDATED`-line
        exclusion as Task 7's criterion 2, for the same reason).
     3. `grep -Ec "\b(it's|isn't|doesn't|don't|you're|I'll|I'm|can't|won't|didn't)\b" src/pages/TermsPage.tsx`
        → `0`.
     4. The heading-order test in `TermsPage.test.tsx` passes with the three-entry-updated
        `EXPECTED_HEADINGS` array above, and `'Governing Law'` still does not appear
        (`expect(allHeadings).not.toContain('Governing Law')` stays as-is).
     5. The `'the "No forms, today" section body actually states there are no forms'` test passes
        unmodified — the exact substring `'this site has no forms, accounts, or logins anywhere, and'`
        is preserved verbatim in the rewrite.
     6. The `'reflects the page title and description...'` test passes with the new `description`
        string above.
     7. `grep -c "LAST_UPDATED = '2026-08-30'" src/pages/TermsPage.tsx` → `1` (placeholder unchanged).
     8. `npm run typecheck` passes.
     9. `npm test` passes in full.

---

## Summary of what requires you

1. **Read every word of both rewritten pages before the merge-to-`main` cutover.** This copy (Tasks
   7 and 8) is not lawyer-reviewed, carried forward as an open item from round 1 (PRD §8 item 1,
   `../README.md`'s "Still requires the owner" table). No agent working on this project is qualified
   to sign off on it. This is a gate before the cutover, not before implementation — the tasks above
   can be implemented and reviewed without you, but the pages must not go live to `main` until you
   have read both in full.

2. **Specifically review the corrected data-sharing claim.** The old `/privacy` copy said, flatly, "No
   selling or sharing of data with anyone, ever." The same page discloses Google Analytics two
   sections later, which does receive data (page views, click events, the literal text typed into
   search) once a visitor accepts. Task 7's rewrite narrows that bullet to: *"No sale of data, and no
   sharing of data with third parties for their own purposes (Google Analytics, described below, acts
   only as a service provider processing this site's own analytics)."* This is the standard
   processor-vs-third-party distinction, and it is accurate, but it is a **substantive correction to
   what the page promises**, not a voice or style change like the rest of the rewrite. Please read it
   specifically, not just skim it as part of the general copy pass (PRD §4.7, §8 item 1, §9 item 3).

3. **Confirm the real ship date for `LAST_UPDATED`.** Both files carry the placeholder `'2026-08-30'`
   through every task above, deliberately unchanged (Tasks 7 and 8 both call this out explicitly).
   R6 (`06-voice-sweep-and-ship`) sets the real value as an explicit last step before opening the PR
   to `main` — this is not something this task list or its implementer should do (PRD §8 item 2, §9
   item 5).

4. **"Google Analytics does not retain your full IP address" (Task 7) is a claim about Google's own
   product behavior**, not something checkable against this repository's code. It reflects Google's
   current published GA4 documentation and was already accepted once in round 1; flagged here only so
   it isn't mistaken for a claim this task list independently verified (PRD §4.7, §9 item 8).
