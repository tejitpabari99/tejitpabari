# Deep Review (Correctness/Security/Integration) — 2026-09-03 01:34

## Verdict: PASS

No findings met the 90% confidence bar. This review focused on cross-sub-project seams,
deleted-content fallout, the content-validation layer, the GA consent security fix, and test
theater, per the assignment. I ran the real test suite, typecheck, lint, the launch-content
gate, and a full production build (see below for what that means for `firebase.json`).

## Findings (>=90% confidence)

None.

## What I verified and found clean

**R1/R4 seam — BackButton `to` prop and the ProjectLivePage/LiveRedirectFallback split
(README decision 12):**
- `src/pages/ProjectLivePage.tsx` (hosted-mode branch) renders its own `BackButton
  to={`/projects/${project.slug}`}` directly; the redirect-mode branch passes
  `backTo={`/projects/${project.slug}`}` into `LiveRedirectFallback`
  (`src/pages/ProjectLivePage.tsx:36`), which threads it into its own internal `BackButton`
  (`src/components/LiveRedirectFallback.tsx:32`). Both branches land on the same Back target.
  Verified via `src/components/LiveRedirectFallback.test.tsx` (`backTo` passthrough and
  fallback-to-default cases) and `src/pages/ProjectLivePage.test.tsx` (dispatch across all three
  branches: hosted, redirect, neither-mode/unknown-slug).
- Every sub-page's `BackButton` target checked by hand against its expected destination:
  `ProjectsPage` → default `/`; `ProjectDetailPage` → `/projects`; `ResearchPage`/
  `ResearchDetailPage`/`WorkExperiencePage`/`NotFoundPage` → default `/`. All correct.
- Chrome mode (`src/layout/chromeMode.ts`, `src/layout/PageShell.tsx`) is driven by
  `routes.tsx`'s route `handle`, independent of whether a page uses `PageContainer` — confirmed
  `/projects`, `/projects/:slug`, `/projects/:slug/live` are the only three routes tagged
  `back-only` in `src/routes.tsx`, matching decision 2 exactly.

**R1/R5 seam — `PageContainer`:**
- `PrivacyPage.tsx`/`TermsPage.tsx` both use `PageContainer chrome="full"` with an inner
  `max-w-2xl` reading-width wrapper, consistent with the "wide outer bound, readable-measure
  inner block" convention (decision 14). `WorkExperiencePage.tsx` uses the same pattern with its
  own `max-w-[45rem]` inner wrapper.

**R2/R3 seam — landing sections rendering real data:**
- Ran a full `npm run build`. `dist/index.html`'s Featured Projects section renders exactly the
  6 pinned slugs (`juno`, `smarttest`, `med-doc-tracker`, `clip-verse`,
  `columbia-virtual-campus`, `crunchy-filler`) in that order — confirms `computeFeatured`'s
  backfill branch is genuinely dead against the real `FEATURED_PROJECT_SLUGS`/`MAX_FEATURED = 6`,
  not just asserted in a comment.
- `dist/index.html`'s Work Experience section renders only "Software Engineer II" and "Software
  Engineer" (the two Microsoft roles); `dist/work-experience/index.html` renders all three
  including "Computer Vision Researcher" (Jio). Confirms the landing 2-entry limit naturally
  drops Jio per decision 5, verified in real build output, not just the unit test.

**Deleted-content fallout (R3's 4-item `sample-project` checklist + the two folded project
files):**
- `src/pages/live/` contains only `registry.ts`/`registry.test.ts` — `sample-project.tsx` and
  its test are gone; `HOSTED_LIVE_PAGES` is now `{}`.
- `src/content/projects/` no longer has `sample-project.md`, `fabric-maps-mcp-server.md`, or
  `azure-maps-ai-assistant.md`.
- Grepped the whole `src/`/`scripts/` tree for `sample-project`, `fabric-maps-mcp-server`,
  `azure-maps-ai-assistant` outside test fixtures: every hit is a self-contained test fixture
  (mocked `@/data`/`./live/registry` module, or a `proj('sample-project')` helper) that never
  touches the real registry/content — not a dangling reference.
- Built `dist/` contains zero references to any of the three deleted slugs (`grep -rn` came back
  empty). `dist/sitemap.xml` lists exactly the 8 real projects + 5 research entries + 6 static
  routes (19 URLs), matching the build's own "19 URLs" log line.
- The rebuilt Microsoft SWE II work-experience bullet
  (`src/content/work-experience/microsoft-fabric-maps-swe-ii.md`) mentions the Fabric Maps MCP
  server and Azure Maps assistant only as prose, with no hyperlinks to the now-deleted project
  pages — the old `microsoft-fabric-maps.md` did link to a QGIS-plugin page and a
  creator-onboarding-tool page it no longer needs to.

**Content-validation layer:**
- `npm run typecheck`, `npm run build`, and `npm run check:launch` (which runs
  `check-launch-content.test.ts` with `CHECK_LAUNCH=1`, `check:no-forms`, and `check:no-em-dash`)
  all pass cleanly against the real repo state.
- Manually confirmed all 6 `FEATURED_PROJECT_SLUGS` resolve to real files under
  `src/content/projects/`.
- `src/data/workExperience.ts` sorts by `startDate` descending; the SWE II (`2024-03-01`) / SWE
  (ends `2024-03-01`) split matches decision 16 exactly and produces the correct landing-page
  ordering (verified in the built HTML, above).
- `src/config/featured.ts`'s `computeFeatured` unit tests
  (`src/config/featured.test.ts`) exercise the real function against independent fixtures
  (backfill, no-backfill-at-6, over-limit throw, unknown-slug throw, duplicate throw,
  double-count guard, under-6-total case) — not theater, and cross-checked against the real data
  via the build output above.

**Security — `disableGa()`/`clearConsent()` (R5's real bug fix):**
- `disableGa()` (`src/lib/analytics.ts:106`) sets `gaEnabled = false` (blocks all future
  `trackEvent`/`trackPageView` calls, checked at the top of each), sets
  `window['ga-disable-<ID>'] = true` (gtag.js's documented opt-out flag), and deletes matching
  cookies.
- Cookie deletion (`deleteGaCookies`, `src/lib/analytics.ts:67`) matches on the real GA4 cookie
  prefixes (`_ga`, `_gid`, `_gat`) actually present in `document.cookie`, and clears each across
  three domain variants (no domain attribute, exact hostname, and a computed
  apex/`www`-stripped registrable domain) — redundant-but-harmless for non-apex/www hosts (e.g.
  a Firebase preview subdomain), since the exact-hostname attempt in the same loop always covers
  the real cookie regardless of what the heuristic domain guess computes.
- `src/lib/analytics.test.ts` genuinely sets real cookies via `document.cookie` and asserts they
  are gone after `disableGa()` — not mocked away.
- Traced the only two call sites of `decline()` (only reachable while `consent === 'unset'`,
  since `ConsentBanner` unmounts once consent is set) and `clearConsent()`
  (`localStorage.removeItem` + `disableGa()` + `setConsent('unset')`) — found no path where
  `consent` state and GA's enabled/cookie state can desync: a full reload re-derives `gaEnabled`
  from module-scope `let` (starts `false`) and `consent` from `localStorage` in lockstep; within
  an SPA session, `loadGa()` explicitly clears the `ga-disable-<ID>` flag before re-enabling, so
  re-accepting after clearing genuinely resumes hits rather than leaving the opt-out flag stuck.
- `scripts/inject-csp-hashes.mjs` and `scripts/check-no-em-dash.mjs` operate only on hardcoded,
  repo-relative paths (`dist/`, `firebase.json`, `src/`, `index.html`) with no user- or
  network-supplied input — no path-traversal or injection surface.

**Tests — count and theater check:**
- `npx vitest run` (default config, `scripts/**` excluded per `vite.config.ts`'s `test.exclude`)
  reports **45 test files, 254 tests, all passed, zero skipped** — resolves the "44 vs 45 files"
  discrepancy a prior reviewer flagged: 45 is correct for the default `npm test` run;
  `scripts/*.test.ts` files (`check-launch-content.test.ts`, `check-no-em-dash.test.ts`,
  `generate-sitemap.test.ts`, `generate-og-cards.test.ts`, `check-no-forms.test.ts`) are
  deliberately excluded from that count by design, and run separately via `check:launch`/manual
  invocation.
- Hand-read `BackButton.test.tsx`, `LiveRedirectFallback.test.tsx`, `ProjectLivePage.test.tsx`,
  `analytics.test.ts`, `featured.test.ts`, and `WorkExperienceSection.test.ts` in full: all
  assert on real rendered output (`href` attributes, cookie state, script injection count, call
  order) or the real exported function, not on their own mocked fixtures re-asserting themselves.

**Other:**
- `npx eslint .` — clean, zero output.
- Build succeeds end to end (`typecheck` → `vite-react-ssg build` → `postbuild`
  `inject-csp-hashes.mjs`), producing 25 prerendered pages with no console errors beyond known,
  pre-existing warnings (Vite's `configLoader: 'native'` deprecation notice, a `gray-matter`
  direct-`eval` warning from a third-party dependency, and a chunk-size-over-500kB advisory) —
  none introduced by this round and none related to its scope.

## Dropped below the confidence bar

- **`deleteGaCookies`'s registrable-domain heuristic** (`src/lib/analytics.ts:79`) computes a
  wrong `registrableDomain` for a host with exactly 3 dot-separated labels that isn't
  `www.<apex>.<tld>` (e.g. a Firebase preview channel host shaped like
  `<project>--<channel>.web.app`, 3 labels). In isolation this looks like a bug, but the
  surrounding loop always also tries the exact `hostname` and no-domain variants, and a browser
  silently no-ops a `document.cookie` clear attempt for an invalid/public-suffix domain rather
  than erroring — so the real cookie (scoped to the real hostname) still gets cleared by the
  other two attempts in the same loop. Could not construct a scenario where this heuristic
  actually leaves a cookie behind. Dropped.
- **`ProjectLivePage.tsx`'s hosted-mode `BackButton` wrapper** uses a raw `<div className="...
  pt-8 ...">` rather than `PageContainer chrome="back-only"` (which would produce `pt-12
  sm:pt-16`). This is a real inconsistency in top-padding value, but it's a visual/spacing
  question I cannot verify without a browser (explicitly an accepted deferral), and `HostedComponent`
  is never populated today (`HOSTED_LIVE_PAGES` is `{}`), so this code path is currently
  unreachable in production regardless. Dropped — no live user-facing consequence to point to
  right now.
- **`check-no-em-dash.mjs`'s scan scope** covers `.tsx` JSX text/specific attributes, `site.ts`'s
  `DEFAULT_DESCRIPTION`, `.md` content, and `index.html`, but not arbitrary string constants
  defined in plain `.ts` files and referenced by identifier in JSX (which the AST walk wouldn't
  see). Checked the actual `.ts` files most likely to hold such copy
  (`src/config/contact.ts`, `src/hooks/useContactMailto.ts`, `src/config/links.ts`) for em dashes
  outside comments/error-throw strings and found none — this is a real scope limitation of the
  guard but I could not find any live copy it currently misses. Dropped as unconfirmed.
- **`WorkExperiencePage.tsx`'s `RESUME_URL`/résumé link is unrelated to this round's Back-target
  wiring** — checked it resolves to the real Drive link (decision 6) and is unaffected by the
  Nav/PageContainer changes; not a finding, just ruled out while tracing `links.ts`.

## Build/test artifacts note

Per the task's read-mostly constraint, I ran `npm run build`, which invoked the postbuild step
(`scripts/inject-csp-hashes.mjs`) and rewrote `firebase.json` in place (reformatted to 2-space
indent and injected 10 fresh `sha256-` script-src hashes, as designed). I did **not** run
`git checkout` on it — it is left as the build produced it, since another agent may be
mid-run in this tree and `git stash@{0}` (the deliberately-held `firebase.json` →
`firebase.template.json` resolution) was left untouched throughout. No other files were
modified; `git status --porcelain` before my build showed only four other reviewers' untracked
`review-*.md` files, which I did not touch.
