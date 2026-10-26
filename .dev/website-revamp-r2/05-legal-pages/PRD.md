# PRD — R5: Legal Pages

**Repo:** `tejitpabari/tejitpabari` (branch `website-revamp`)
**Files owned this round:** `src/pages/PrivacyPage.tsx`, `src/pages/TermsPage.tsx`,
`src/context/ConsentContext.tsx`, `src/components/ConsentBanner.tsx`, `src/lib/analytics.ts`,
`src/lib/analytics.test.ts`, and their tests. `src/lib/analytics.ts`/`src/lib/analytics.test.ts` were
originally unowned by any R1–R5 sub-project this round (the GA-teardown fix below can't be built
without a small, additive change there) — orchestrator decision (2026-09-01) resolves the gap by
assigning both files to R5 outright for this round; see §9 item 4.
**Depends on:** R1 (`01-shell-nav-chrome`) for `src/layout/PageContainer.tsx`, whose `chrome="full"`
variant this PRD adopts directly rather than hand-rolling a third copy of the same top-padding fix.
**Source of truth:** `SHARED-CONTEXT.md` (repo facts, tokens, this round's locked decisions) and
`REVISION-BRIEF.md` (owner feedback verbatim) in the scratchpad this PRD was written from; original
design reasoning in `.dev/website-revamp/05-legal-analytics/PRD.md` §4.2/§4.5 (consent model,
drafted copy) is read and cited, not re-derived from scratch.
**Status:** Draft, awaiting owner approval. **All legal copy in §4.4/§4.5 is proposed text, not
final.** It has not been reviewed by a lawyer and must not ship without the owner reading every
word — carried forward from round 1 as a still-open item, not resolved here (§8).

---

## 1. Problem

Three complaints from the owner, all against both `/privacy` and `/terms`:

1. **No top padding; the page collides with the navbar.** Both pages render a bare
   `<div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:px-8">` as their outer container.
   `py-16` is 4rem (64px) of padding on *both* top and bottom — `Nav.tsx` is a `fixed inset-x-0
   top-0` floating pill header, not part of document flow, and every other full-chrome page in this
   round's R1 PRD needed `pt-28 sm:pt-32` (112–128px) to clear it. `/privacy` and `/terms` never got
   that fix in round 1 because they weren't in scope for R1's PRD; they are two more instances of
   exactly the bug R1 fixed everywhere else, not a new bug shape.

2. **"Clear my choice" doesn't work.** `ConsentContext.clearConsent()` looks correct on inspection —
   it removes the localStorage key and calls `setConsent('unset')` — and a passing integration test
   (`ConsentContext.test.tsx`) already exercises exactly this path end to end (decline → clear →
   banner reappears). Investigated below (§4.1); the real defect is not in `clearConsent()`'s logic,
   it's in `PrivacyPage.tsx`'s button, plus one real, separate correctness gap in how "clear" handles
   Google Analytics once it has actually loaded.

3. **Both pages should sound more professional.** Current copy is chatty, first-person-casual, and
   uses em dashes throughout ("To be completely explicit:", "a small piece of on-device storage, not
   a cookie sent to any server," "This isn't professional or medical advice"). The whole site carries
   this same complaint (owner: "the whole site feels written by AI" — SHARED-CONTEXT locked decision
   7), and `/privacy`/`/terms` are two of the pages named directly.

## 2. Goals

- Both pages clear the navbar correctly, via R1's `PageContainer` (`chrome="full"`) — no new padding
  convention invented.
- "Clear my choice" produces a visible, correct effect every time it's clickable, and is not shown
  at all when there is nothing to clear.
- Clearing consent actually stops Google Analytics from sending further hits for the rest of the
  visit and removes analytics cookies already on the device — not just the UI's own state.
- Both pages read as a plainer, more formal, first-person register: no em dashes, no contractions,
  no casual asides — while preserving every factual claim byte-for-byte against what the code
  actually does.
- Every claim in the rewritten copy is checked against `src/lib/analytics.ts`,
  `src/context/ConsentContext.tsx`, and `scripts/check-no-forms.sh` as it's written, not assumed
  correct because round 1 already shipped it.

## 3. Non-Goals

- Actual legal review. Neither the owner nor any agent on this project is a lawyer; §8 restates this
  as an unresolved, must-read-before-launch item, exactly as round 1 left it.
- A cookie-preference management panel, a third-party CMP, or per-category consent. Round 1's
  PRD (`05-legal-analytics/PRD.md` §4.2) already rejected this for a single-tracker, two-outcome
  site, and nothing in this round's feedback reopens it.
- Redesigning the consent *model* (`unset`/`granted`/`denied`, banner-driven, localStorage-backed).
  It stays; only the "clear" path's completeness and the button's visibility logic change.
- Touching `src/layout/*`, `src/sections/*`, `src/content/**`, other `src/components/*`/`src/data/*`
  — R1/R2/R3/R4 territory respectively. `src/lib/analytics.ts` is the one deliberate exception, owned
  by R5 outright this round (orchestrator decision, 2026-09-01, §9 item 4) because nothing else needs
  it and this PRD can't ship a real fix without it.
- Changing `LAST_UPDATED`'s value to a real date. That decision needs the owner's actual ship date;
  this PRD only decides the mechanism (§8).

## 4. Architecture Decisions

### 4.1 Root cause of "Clear my choice doesn't work" — investigated, not assumed

Three hypotheses were checked directly against the real code
(`src/context/ConsentContext.tsx`, `src/components/ConsentBanner.tsx`, `src/pages/PrivacyPage.tsx`,
`src/lib/analytics.ts`, and the existing `ConsentContext.test.tsx`):

**Hypothesis 1 — the button renders unconditionally and does nothing observable when there's
nothing to clear. CONFIRMED — this is the actual bug.**

`PrivacyPage.tsx` (current, line 153–159) renders:

```tsx
<button type="button" onClick={clearConsent} className="...">
  Clear my choice
</button>
```

unconditionally, with no guard on `consent`. When a visitor has never answered the banner (or has
already cleared once), `consent === 'unset'`. Clicking the button calls `clearConsent()`, which does:

```tsx
function clearConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY); // key was never set — no-op
  } catch { /* ... */ }
  setConsent('unset'); // state is already 'unset' — React bails out, no re-render at all
}
```

`localStorage.removeItem` on a key that was never written is a silent no-op. `setState` called with
a value `Object.is`-equal to the current value is a documented React no-op — it doesn't even
re-render. The status line directly above the button already read "Your saved choice about
analytics is **not yet set**" before the click, and reads exactly the same after. Nothing on the
page changes: no re-render, no visual change, no confirmation. This is indistinguishable from a
broken button, because in the one case that matters most (a first-time visitor, or anyone who
already cleared once, trying the button out of curiosity) it functionally is one.

**Hypothesis 2 — the banner's render guard prevents it from reappearing. INVESTIGATED, NOT THE BUG.**

`ConsentBanner.tsx`'s guard is `if (!hydrated || consent !== 'unset') return null;` — no dismissed-
this-session flag, no other suppression exists anywhere in the file (read in full). When `consent`
does transition to `'unset'` (i.e., there *was* something to clear), this guard correctly re-shows
the banner on the very next render. The banner is also `fixed inset-x-0 bottom-0`, so it reappears
in the viewport immediately, with no scrolling required. This is independently confirmed by the
already-passing `ConsentContext.test.tsx` test *"clearConsent resets storage and consent to unset,
and the banner reappears without a reload"* — real assertions against the real `ConsentBanner`, not
a mock. **The banner's reappearance was never broken.**

**Hypothesis 3 — GA keeps running after "clearing." CONFIRMED — a real, separate correctness bug,
distinct from the perception bug above.**

If consent was `granted`, `loadGa()` already injected the `gtag.js` `<script>` and issued a `config`
call; GA may already have set `_ga`/`_gid` cookies. `clearConsent()` (current code) resets local
storage and React state only — it never touches `window.gtag`, the injected script, or any cookie.
`trackEvent`/`trackPageView` both guard on `gaLoaded` (a module-level flag that, once `true`, never
goes back to `false`), so **every subsequent `trackEvent`/`AnalyticsListener` pageview call for the
rest of the page session keeps firing to Google, even though the UI now claims the choice is
"cleared."** On a page whose entire text explicitly promises "Google Analytics does not load and no
analytics cookies are set on your device" once you decline/clear, this is not cosmetic — it's the
one claim on the page that was false the moment a visitor accepted, then cleared, in the same visit.

**Verdict:** the owner's reported symptom is Hypothesis 1 (a visitor with nothing to clear gets zero
feedback from the button). Hypothesis 3 is a real bug this investigation surfaced independently —
worth fixing in the same pass, not deferred, precisely because this is the one page on the site that
makes an explicit, falsifiable promise about it. Hypothesis 2 required no fix.

### 4.2 `src/lib/analytics.ts` — `disableGa()` (owned by R5 this round)

`SHARED-CONTEXT.md`'s original file-ownership table didn't list `src/lib/analytics.ts` under any
R1–R5 sub-project. The GA-teardown fix (§4.1 Hypothesis 3) cannot be built without it:
`ConsentContext.clearConsent()` needs one real function to call that actually stops GA and removes
its cookies. Orchestrator decision (2026-09-01, §9 item 4) resolves the gap: R5 owns
`src/lib/analytics.ts` and `src/lib/analytics.test.ts` outright for this round.

**Design.** The existing single `gaLoaded` flag conflates two different questions: "has the
`gtag.js` script ever been injected" (should only ever happen once — `loadGa()`'s own doc comment
already calls this out as load-bearing) and "should hits be sent right now" (this is what actually
needs to flip off on clear, and back on if the visitor re-accepts later in the same session). Split
it into two internal flags so both stay correct:

```ts
// src/lib/analytics.ts — changed
let gaScriptInjected = false; // has the gtag.js <script> ever been appended — true forever once set
let gaEnabled = false;        // should hits be sent right now — this is what clear/re-accept toggles

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
```

**Why not remove the injected `<script>` element too.** The `ga-disable-<ID>` flag is checked by
`gtag.js`'s own runtime before it sends anything — leaving the tag in the DOM but flagged off is the
documented, supported way to disable it, and keeps `loadGa()`'s re-enable path (a same-session
Accept after a Clear) a cheap flag flip instead of a second network fetch of the same script.

**Why `isGaLoaded()`'s signature is untouched.** `AnalyticsListener.tsx` and `trackEvent`/
`trackPageView` (all outside this round's file ownership, all in `src/lib/analytics.ts` itself or
consuming it) already gate on `isGaLoaded()` returning a boolean meaning "should this event actually
be sent." Redefining what the underlying flag *tracks* (enabled-right-now vs. ever-injected) without
touching the function's name or return type means none of those call sites need to change — verified
against `AnalyticsListener.tsx` (§7).

### 4.3 `ConsentContext.tsx` — `clearConsent()` calls `disableGa()`

```tsx
// src/context/ConsentContext.tsx — changed
import { loadGa, disableGa } from '@/lib/analytics';

// ...

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

No other change to `ConsentContext.tsx`. `grant()`/`decline()`/the mount effect/`readStoredConsent()`
are unchanged — they were never implicated in either bug.

### 4.4 `src/components/ConsentBanner.tsx` — one em-dash fix, no behavioral change

Read in full; its render guard and click handlers are correct (§4.1, Hypothesis 2) and untouched.
The banner's own copy has one em dash, which the "sound more professional" / "no em dashes anywhere"
mandate (SHARED-CONTEXT locked decision 7) reaches even though the owner's specific complaint named
only `/privacy` and `/terms` — this file is already in R5's owned list, the fix is one clause, and
leaving a known violation in an owned file for R6's later sweep to catch is strictly worse than
fixing it now:

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

### 4.5 `src/pages/PrivacyPage.tsx` — `PageContainer`, button gating, confirmation, full copy rewrite

**Padding fix.** Adopts R1's `PageContainer` directly (`chrome="full"` — this route keeps the
navbar, it is not one of the three back-only routes per SHARED-CONTEXT locked decision 2), per R1
PRD §9 item 8's explicit hand-off note: *"R5 should adopt `PageContainer` directly (`chrome="full"`
— both pages keep the navbar) rather than hand-rolling the same `pt-28 sm:pt-32` value a third
time."* This also picks up the same horizontal padding ramp (`px-6 sm:px-8 md:px-10 lg:px-12`) every
other full-chrome page now uses, replacing the old, narrower `px-4 sm:px-6 lg:px-8`, and moves from
a symmetric `py-16` (64px top **and** bottom) to `pt-28 sm:pt-32` top (112–128px, enough to clear
`Nav`'s fixed pill) / `pb-20` bottom (80px) — a small, deliberate widening of the bottom gap that
matches every other page's rhythm rather than something specific to legal pages.

**Button-gating and confirmation fix (§4.1).** The "Clear my choice" status/button block is pulled
into a small local component, `ConsentStatus`, defined in this file only — not a new file, `Section`
is already a same-file local helper with the identical shape, and this component exists purely to
scope one piece of click-confirmation UI state to the one Section that needs it:

```tsx
/**
 * The "Your consent choice" status line + Clear control. Root-cause fix for
 * "Clear my choice doesn't work" (PRD 05 §4.1): the old button rendered
 * unconditionally, including when consent was already 'unset' — clicking it
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
  // reappears the instant consent becomes 'unset' — see §4.1 Hypothesis 2)
  // supersedes the "Cleared" confirmation.
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
```

**Copy rewrite (§4.6 explains the register/accuracy rules applied).** Full replacement file below,
ready to paste:

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

function ConsentStatus() {
  const { consent, clearConsent } = useConsent();
  const [justCleared, setJustCleared] = useState(false);

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

### 4.6 `src/pages/TermsPage.tsx` — `PageContainer` + full copy rewrite

Same padding fix as `PrivacyPage.tsx` (`PageContainer chrome="full"`, §4.5). No consent UI on this
page — its only other change is the copy rewrite. Full replacement file, ready to paste:

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

*(No "Governing Law" clause — same reasoning round 1 recorded and the owner already accepted: no
commercial relationship or dispute exposure to allocate for a personal, non-commercial site. Carried
forward, not re-litigated.)*

### 4.7 Copy rules applied, and an accuracy audit against the code

**Register rules applied uniformly, both pages:**

1. Zero em dashes (SHARED-CONTEXT locked decision 7a). Every em dash in the round-1 copy is replaced
   with a comma, colon, semicolon, or parenthetical, chosen per sentence rather than one mechanical
   substitution.
2. No contractions ("it's" → "it is," "doesn't" → "does not," "I'll" → "I will," "isn't" → "is not,"
   and so on throughout). This is the single most consistent, checkable marker separating the old
   casual register from the new one, and was applied as a hard rule, not case by case.
3. The three phrases the owner's feedback named directly are gone: "To be completely explicit:" (the
   sentence it introduced is now plain, unflagged prose), "a small piece of on-device storage, not a
   cookie sent to any server" (now "on-device storage that is not sent to any server," same fact,
   shorter), and "This isn't professional or medical advice" (now the `/terms` heading "Not medical
   or professional advice," same meaning, no contraction).
4. No legalese theatre added ("heretofore," "shall," "the Company," "the User"). Sentences stay short
   and direct; the register moved from a personal blog toward a plain, well-written product privacy
   page, not toward a contract.

**Every substantive claim was checked against the code while rewriting, not assumed:**

| Claim in copy | Verified against |
|---|---|
| "No forms... nothing here to type into and submit" (with the search-box carve-out) | `scripts/check-no-forms.sh` scopes its `<input\|form\|textarea>` grep to `src/pages/live/` only — the site does have an `<input>` on `/projects`/`/research` (the search box), which is why the copy explicitly carves it out rather than claiming zero inputs site-wide. Confirmed this carve-out, not removed. |
| "Google Analytics runs only if you select Accept... no exceptions" | `ConsentContext.tsx`: `loadGa()` is called from exactly two places — the mount effect, gated on `stored === 'granted'` (i.e., only for a returning visitor who already accepted), and `grant()`. `decline()` never calls it. Confirmed. |
| "If you decline, this site sets no cookies at all" | Same as above: `decline()` only writes `localStorage`, never touches `document.cookie`, never calls `loadGa()`. Confirmed. |
| "Your consent choice itself is stored in local storage, not a cookie" | `STORAGE_KEY` is read/written exclusively via `localStorage.getItem`/`setItem`/`removeItem`; no `document.cookie` write for the choice itself anywhere in `ConsentContext.tsx`. Confirmed. |
| Clearing "turns off Google Analytics for the rest of this visit, removes any analytics cookies already set" | This is the fix this PRD adds (§4.2/§4.3) — true only once `disableGa()` ships. Flagged as a dependency, not a pre-existing fact: this sentence must not go live before `disableGa()` does. |
| "No sale of data, and no sharing of data with third parties for their own purposes" | **Finding, corrected below**, not a pass-through of the old claim. |

**Finding — the old blanket claim was too broad; corrected.** The round-1 copy stated flatly: "No
selling or sharing of data with anyone, ever." That is not quite accurate: once a visitor accepts,
their interaction data (page views, click events, the literal text of anything typed into search) is
sent to Google and processed on Google's infrastructure, as the very next section of the same page
already discloses in detail. "Sharing" in the ordinary sense of that word does happen, with one
recipient, for one stated purpose. The rewritten bullet (§4.5, "What this site does not do") narrows
the claim to what's actually being promised, and states the reason it's still true in the sense that
matters: *"No sale of data, and no sharing of data with third parties for their own purposes (Google
Analytics, described below, acts only as a service provider processing this site's own analytics)."*
This is the standard distinction between a data processor acting on the site owner's instructions
(what Google Analytics is here) and sharing with a third party for that party's own use (which this
site does not do) — a real distinction, not a hedge, but one the old blanket wording erased. Flagged
prominently here and again in §9; **this is exactly the kind of correction the owner, or a lawyer,
should specifically re-check before launch**, since it's a substantive narrowing of a claim, not a
voice change.

**Not changed, and why:** "Google Analytics does not retain your full IP address" is a claim about
Google's own product behavior, not this site's code, and isn't independently verifiable from this
repository. It reflects Google's own current, published GA4 documentation and was left as stated in
round 1's copy (which the owner already accepted once); it is not re-verified here beyond noting
explicitly that it rests on Google's representation, not this repo's code.

## 5. API Change Summary

N/A — no backend/API surface in this project. Every change is client-side: page markup, one context
method, and one analytics-module function.

## 6. Frontend Change Summary

| File | Change |
|---|---|
| `src/pages/PrivacyPage.tsx` | Converts to `<PageContainer chrome="full">` (§4.5); "Clear my choice" gated on `consent !== 'unset'`, with a `ConsentStatus` local component adding click confirmation and an explicit "cannot be undone" note; full copy rewrite (§4.5/§4.7). |
| `src/pages/TermsPage.tsx` | Converts to `<PageContainer chrome="full">`; full copy rewrite, no behavioral change (§4.6/§4.7). |
| `src/context/ConsentContext.tsx` | `clearConsent()` now also calls `disableGa()` (§4.3). No other change. |
| `src/components/ConsentBanner.tsx` | One em-dash removed from the banner's own copy; no behavioral change (§4.4). |
| `src/lib/analytics.ts` **(owned by R5 this round — §9 item 4)** | `gaLoaded` split into `gaScriptInjected`/`gaEnabled`; new exported `disableGa()`; `isGaLoaded()`'s return semantics change (now "enabled right now," not "ever injected") with its call signature and callers unchanged (§4.2). |

## 7. Testing

**Existing tests this PRD breaks, and how each is fixed:**

- **`src/pages/PrivacyPage.test.tsx`**
  - *`"Clear my choice" calls the mocked clearConsent()`* — breaks: the `beforeEach` mocks
    `consent: 'unset'`, and under the new gating the button no longer renders in that state. Fix:
    split into two scenarios — `consent: 'unset'` asserts `screen.queryByRole('button', { name:
    'Clear my choice' })` is `null` and the status text reads "There is nothing to clear yet";
    `consent: 'granted'` asserts the button exists, click it, assert the mocked `clearConsent` was
    called once, and assert the "Cleared." confirmation text appears (this works even against a
    fully mocked `useConsent`, since `justCleared` is `ConsentStatus`'s own local state, set
    directly in the click handler — it doesn't depend on the mock's return value changing).
  - *`reflects the page title and description...`* — breaks: the `RouteMeta` `description` string
    changes (em dash removed). Fix: update the expected string to `"This is Tejit Pabari's personal
    portfolio: no company, no accounts, and no forms today. Here is what this site, and everything
    hosted under it, collects, and what your choices are."`
  - Heading-order test and the "no forms" substring test are **unaffected** — every `EXPECTED_HEADINGS`
    string and the checked "No forms of any kind, anywhere on the domain, as of the date above"
    substring are preserved verbatim in the rewrite (§4.5 keeps identical `<h2>` titles; only prose
    and one `<h3>` sub-heading wording changed).
- **`src/pages/TermsPage.test.tsx`**
  - *Heading-order test* — breaks: `EXPECTED_HEADINGS[0]` changes from `"This isn't professional or
    medical advice"` to `"Not medical or professional advice"` (§4.7). Fix: update that one array
    entry; every other heading string is unchanged.
  - *`reflects the page title and description...`* — breaks: same em-dash removal as Privacy. Fix:
    update the expected string to `"Terms governing use of tejitpabari.com, a personal portfolio: no
    company, no warranty, and information on how hosted projects and outbound links are treated."`
  - The "no forms, today" substring test is **unaffected** (§4.6 keeps the exact checked substring).
- **`src/context/ConsentContext.test.tsx`** — the existing `"clearConsent resets storage and consent
  to unset, and the banner reappears without a reload"` test **still passes unchanged**: it never
  asserts anything about GA state, so adding a `disableGa()` call inside `clearConsent()` doesn't
  touch what it checks. It is extended (not broken) with new assertions — see below.
- **`src/lib/AnalyticsListener.test.tsx`** — **unaffected**. It mocks `isGaLoaded`/`trackPageView`
  directly (`vi.mock('@/lib/analytics', ...)`), so `analytics.ts`'s internal flag split (§4.2) is
  invisible to it; the function's name and return type are unchanged.
- **`src/lib/analytics.test.ts`** — the six existing tests all still pass: `shouldLoadGa()`'s two
  guards are untouched, `loadGa()`'s idempotency (`gaScriptInjected` still only flips to `true`
  once) is preserved, and `isGaLoaded()` still returns `true`/`false` at the same points the old
  `gaLoaded` flag did for every scenario those tests cover (none of them call `disableGa()`).

**New tests:**

- `PrivacyPage.test.tsx` — the two `ConsentStatus` scenarios above (button absent + correct copy
  when `consent: 'unset'`; button present, click, mocked `clearConsent` called, confirmation text
  appears when `consent: 'granted'`).
- A new integration test (in `PrivacyPage.test.tsx` or a small addition alongside
  `ConsentContext.test.tsx`'s existing harness pattern) that renders `PrivacyPage` inside a **real**
  `ConsentProvider` (not mocked), pre-seeds `localStorage` with `'granted'` and a fake `_ga=GA1.2.x`
  cookie, clicks "Clear my choice," and asserts all of: `localStorage.getItem('tejitpabari:consent')`
  is `null`; `document.cookie` no longer contains a `_ga`-prefixed cookie; `window['ga-disable-
  G-TEST123']` is `true`; the button is gone (`queryByRole` returns `null`); the confirmation text
  is visible. This is the one test that actually proves the GA-teardown fix end to end, not just
  that `disableGa()` was called.
- `src/lib/analytics.test.ts` — new cases: `disableGa()` sets the `ga-disable-<ID>` window flag and
  flips `isGaLoaded()` to `false`; `disableGa()` deletes a pre-set `_ga`/`_gid` cookie (assert via
  `document.cookie`); calling `loadGa()` again after `disableGa()` re-enables (`isGaLoaded()` back to
  `true`) **without** injecting a second `<script src*="googletagmanager">` element (`scriptCount()`
  stays `1`) — the re-enable path this PRD's split-flag design exists to support.
- `ConsentContext.test.tsx` — extend the existing clear-consent test (or add one alongside it) to
  assert `disableGa()`'s effects reach through `clearConsent()`: after granting then clearing, the
  `ga-disable-<ID>` window flag is set and any GA cookie set during the granted phase is gone.

**Manual QA** (once implemented): visit `/privacy` and `/terms` fresh, confirm the heading clears the
navbar pill at both mobile and desktop widths; accept the consent banner, reload, confirm the status
reads "granted" and clicking "Clear my choice" immediately shows the confirmation, the button
disappears, and the banner reappears at the bottom of the viewport without scrolling.

## 8. Manual Intervention Required From You

1. **Read every word of both rewritten pages before this ships.** Neither the owner nor any agent
   working on this project is a lawyer. This was already an open item after round 1
   (`.dev/website-revamp/README.md`'s "Still requires the owner" section) and is **not resolved by
   this PRD** — it is carried forward unchanged. Pay particular attention to §4.7's finding on the
   "no selling or sharing" bullet, since that's a substantive narrowing of a claim, not just a voice
   change, and to the "This isn't professional or medical advice" → "Not medical or professional
   advice" heading, since that section matters given the health-tech work this portfolio links to.
2. **Confirm the real value for `LAST_UPDATED` on both pages.** Both files currently carry the same
   placeholder, `'2026-08-30'`, inherited unchanged from round 1 (it was never a real date to begin
   with). This PRD does not set a real date — that requires knowing the actual day this revision
   ships, which only you can confirm. **Resolved (§9 item 5):** leave the placeholder as-is through
   implementation and review — R6 (`06-voice-sweep-and-ship` PRD §4.7 "Step 2") now owns setting both
   files' `LAST_UPDATED` to the real merge/ship date as an explicit numbered step, the very last one
   before opening the PR to `main`, so the date doesn't go stale between review
   and launch. Flagged as a cross-round note in §9.

## 9. Open Questions & Decisions

1. **`[RESOLVED: root cause of "Clear my choice doesn't work" is the button's missing `consent !==
   'unset'` guard, not `clearConsent()`'s logic]`** — verified against the real code and the
   already-passing `ConsentContext.test.tsx` integration test, not assumed. See §4.1.
2. **`[RESOLVED: GA teardown via gtag's own `ga-disable-<ID>` opt-out flag + cookie deletion, no
   reload]`** — a reload was considered and rejected: the flag-and-cookie-sweep approach stops all
   future hits and removes existing cookies immediately, which is everything a reload could
   accomplish here, without the UX cost of losing scroll position/page state on a page the visitor
   is actively reading. See §4.2.
3. **`[RESOLVED: "No selling or sharing of data with anyone, ever" narrowed to "no sale... no
   sharing... for their own purposes"]`** — the old blanket claim didn't hold up against the site's
   own Google Analytics disclosure two paragraphs later. Narrowed to the accurate
   processor-vs-third-party distinction. **Flagged prominently for owner/lawyer review per §8**,
   since this is a substantive correction, not a style pass. See §4.7.
4. **`[RESOLVED — orchestrator decision, 2026-09-01]`** `src/lib/analytics.ts` and
   `src/lib/analytics.test.ts` were unowned by any R1–R5 sub-project in `SHARED-CONTEXT.md`'s original
   table; the GA-teardown fix (§4.2, §7) can't exist without them. R5 now owns both files outright for
   this round — added to R5's own file-ownership header and §3/§4/§6 explicitly. Implemented as part
   of the same commit/PR as the rest of R5, no separate follow-up needed.
5. **`[RESOLVED — cross-round, R6]`** `LAST_UPDATED` on both pages needs a real date, set as the last
   step before the PR to `main` opens (§8). R6 (`06-voice-sweep-and-ship`) owns this: its own PRD
   (§4.7 "Step 2 — set `LAST_UPDATED`") now carries it as an explicit numbered step in the ship
   sequence, not just a note, replacing R5's `'2026-08-30'` placeholder with the real ship date. Not
   blocking R5's own implementation or review.
6. **`[RESOLVED: ConsentBanner.tsx's stray em dash fixed in this PRD, not deferred to R6]`** — it's
   already in R5's owned file list, the fix is a single clause, and R6's "repo-wide... sweep over
   whatever R1–R5 leave behind" is meant to catch what owned rounds miss, not substitute for an
   owned round fixing what it can see. See §4.4.
7. **`[DEFERRED — legal review]`** No governing-law clause, no lawyer review of either page's
   substance. Both are round-1 decisions this PRD doesn't reopen (no new commercial exposure this
   round changes that calculus) and both remain open pending the owner's own read-through (§8).
8. **`[RESOLVED: "Google Analytics does not retain your full IP address" left as-is]`** — this is a
   claim about Google's product behavior, not this site's code, and isn't independently verifiable
   from the repository. Already accepted once in round 1; not re-litigated here beyond noting its
   basis explicitly in §4.7.
