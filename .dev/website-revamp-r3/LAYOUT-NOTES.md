# Layout notes - r3-02-index-page-layout

Scope for this sub-project: `src/pages/ProjectsPage.tsx`, `ResearchPage.tsx`,
`ProjectDetailPage.tsx`, `ResearchDetailPage.tsx`, `WorkExperiencePage.tsx`,
`NotFoundPage.tsx`, `PrivacyPage.tsx`, `TermsPage.tsx`;
`src/components/SearchFilter.tsx`, `TagPill.tsx`, `EmptyState.tsx`,
`DetailHeader.tsx`, `LinksRow.tsx`, `BackButton.tsx` (deleted),
`icons/**`, plus new components; `src/routes.tsx`,
`src/layout/PageContainer.tsx`, `chromeMode.ts` (deleted), `PageShell.tsx`;
`src/hooks/useCollectionFilter.ts`; this file.

All eight items below are implemented on `website-revamp`.
`npm run typecheck`, `npm test` (242/242, 41 files), `npm run lint`,
`npm run check:no-em-dash`, and `npm run build` (end to end, including the
previously-blocked postbuild CSP/404 step) all pass. Verification evidence
per item is below, including real screenshots from a real Chromium
(Playwright, freshly installed in this environment) against both
`vite preview` and the real Firebase Hosting emulator.

## 1. Horizontal list cards replacing the 3-across grid

New component `src/components/ProjectListCard.tsx`: one full-width row per
item, image on the left (`sm:w-[220px] sm:h-[154px]`, `lg:w-[240px]
lg:h-[180px]`, a clean 4:3 frame, `rounded-xl2`/`bg-placeholder` matching
the rest of the design system) stacking to image-on-top at mobile widths
(base styles have no `sm:` width, so the image div stretches to the
article's full cross-axis width via flex-col's default `align-items:
stretch`, then `sm:flex-row` on the `<article>` switches to the side-by-side
layout). Content column, in order: title (`<Link>` with the
`after:absolute after:inset-0` full-card click overlay), `StatusBadge` if a
status exists, description, category tags (`TagPill`), tech tags
(`TechTagList`, see below), then link buttons.

`ProjectCard.tsx` is untouched - still used verbatim by the home page's
featured-projects section (owned by the concurrent sections sub-project).

**Two visually distinct tag rows.** Category `tags` render as the existing
`TagPill` (bold, colored). `techTags` render in a new shared
`src/components/TechTagList.tsx` (small `text-slate`, subtle
`border-teal-secondary/10` outline chips, no fill) - deliberately subtler.
Neither row has an `onClick`, so neither is clickable. `TechTagList` is
also used by `DetailHeader.tsx` (item 7).

**Small link buttons, shared logic.** Extracted `src/components/
LinkButtons.tsx` (a `size: 'sm' | 'md'` prop) out of what was duplicated
render logic in `LinksRow.tsx`; `LinksRow` now just wraps `<LinkButtons
size="md">` in its existing container div, and `ProjectListCard` uses
`size="sm"`. The primary link (`primary: true`) gets `bg-teal text-white`;
the rest are outlined. Each renders `DynamicIcon` when `icon` is set, is a
real `target="_blank" rel="noreferrer"` anchor, calls
`event.stopPropagation()` so it doesn't trigger the card-wide navigation
overlay, sits at `relative z-10`, and fires
`trackEvent('outbound_click', { url, context: 'content_external_link',
label })` - all matching `LinksRow`'s prior behavior (its existing test
suite, unchanged in assertions, still passes against the refactor).

**Mobile gutters.** Owner: cards should read as roughly 80-90% of the
viewport width with visible gutters, image not full-bleed. `PageContainer`'s
existing `px-6` (24px each side) already produces this ratio across the
realistic mobile-width range without adding any extra per-card margin (a
card/image nested *inside* an extra margin would push it visibly narrower
than intended). Verified with a pixel measurement on the real rendered
`/projects` screenshot at a 390px-wide viewport: the content area
(container inset) measured 338px wide (86.7% of 390px), squarely inside the
requested 85-90% band; the math also holds at the common 320-428px mobile
width range (85.0%-88.8%, since `48/viewport_width` lands in that range for
those widths). The image itself sits inset a further 14px (`m-3.5`) inside
the card on top of that, so it visibly reads as "not full-bleed" rather
than edge-to-edge with the card's own boundary.

`src/components/ProjectListCard.test.tsx` (new) covers: title/description/
image render; category and tech tags render in two separate, differently-
styled groups; the `primary: true` link gets the filled treatment and
others render outlined; `icon` renders the right `DynamicIcon`; clicking an
external link button does not call `onCardClick` (stopPropagation) and
does fire `outbound_click`; an empty `links` array renders no link buttons;
an empty/omitted `techTags` renders no tech-tag group.

**Verification:** real Chromium screenshots (desktop 1440px and mobile
390px) of `/projects`, `/research`, and `/projects/juno` all show the
intended layout - see the Visual verification section below.

## 2. Full-width, bigger search bar

`src/components/SearchFilter.tsx`: removed `sm:w-72`; input is now `w-full`
at every breakpoint, `px-5 py-3.5 text-base sm:text-lg` (up from `px-4 py-2
text-sm`). The result-count span moved out of the input's row entirely -
it's now on its own row below the input, `ml-auto` next to the filter
pills (or alone, right-aligned, when there are no tags). `aria-label`
(=`placeholder`) and `aria-live="polite"` on the count are unchanged.

Regression tests added to `SearchFilter.test.tsx`: input is `w-full` with
no `sm:w-\d` class; input has the larger `py-3.5`/`text-base` classes; the
result count's parent element is not the same element as the input's
parent (no longer sharing a row).

## 3. Filter pills stay category-only; techTags searchable at low weight

Verified `useCollectionFilter`'s `allTags` (`items.flatMap(i => i.tags)`)
already never touched `techTags` - unchanged by this round, and now has an
explicit regression test (`useCollectionFilter.test.ts`, new `describe
('techTags', ...)` block) asserting `allTags` never contains a techTags
value, using a fixture where `tags` and `techTags` overlap in spirit but
not value.

Decided **yes** on making `techTags` searchable (owner's stated
preference: "searching 'React' should find React projects"). Added
`techTags` to the Fuse.js `keys` in `useCollectionFilter.ts` at
**weight 0.1** - the lowest of all five keys (title 0.4, description 0.3,
tags 0.2, techTags 0.1, body 0.1), so a techTags match can surface a
result but never out-ranks a title/description/category match. New tests
confirm both: a query matching only a `techTags` value finds the right
item, and doing so still never puts that value into `allTags`.

## 4. Back button removed everywhere; chrome machinery simplified away

- Deleted `src/components/BackButton.tsx` and `.test.tsx`.
- Removed every `<BackButton />` usage (ProjectsPage, ResearchPage,
  WorkExperiencePage, ProjectDetailPage, ResearchDetailPage,
  PrivacyPage/TermsPage never had one). On `NotFoundPage`, replaced with a
  plain `<Link to="/">Go to homepage</Link>` (a destination, not a "back").
- `src/routes.tsx`: removed both `handle: { chrome: 'back-only' }` entries
  (on `projects` and `projects/:slug`) and the `RouteHandle` import.
- `PageShell.tsx`: always renders `<Nav />` now; removed
  `chromeModeFromHandle`/`useMatches` entirely.
- `PageContainer.tsx`: dropped the `chrome` prop; always uses
  `pt-28 sm:pt-32` (the one-time "full" value; there's no route left
  needing the smaller "back-only" gutter).
- Deleted `src/layout/chromeMode.ts` and `chromeMode.test.ts`.
- Updated `PageShell.test.tsx` (drops the `RouteHandle`-based test, adds
  "Nav is always rendered" instead) and `src/routes.smoke.test.tsx` (drops
  the `BACK_ONLY_PATHS` split, asserts Nav renders on every route
  including the new `/404`).
- Every `PageContainer` call site I own had its `chrome="..."` prop
  removed.

Repo-wide grep confirms nothing survives:
`grep -rn "chromeMode\|ChromeMode\|RouteHandle\|chrome=\"\|chrome: 'back-only'\|BackButton" src` -> **no matches**.

## 5. Work experience page width

`WorkExperiencePage.tsx`'s `<div className="max-w-[45rem]">` wrapper is
gone; the page now uses `PageContainer`'s standard `max-w-content` width,
left-aligned, matching every other page. (This is the same handoff item
`.dev/website-revamp-r3/SECTIONS-NOTES.md` independently asked for from
its own side - already done here.)

## 6. Pending 404 handoff applied; build unblocked

Applied exactly the documented handoff in `src/routes.tsx`'s `/` route
`children` array:

```tsx
{ path: '404', element: <NotFoundPage /> },
{ path: '*', element: <NotFoundPage /> },
```

(the `404` entry immediately before the existing, unchanged `*` catch-all).

**`npm run build` now succeeds end to end**, including the postbuild step:

```
[vite-react-ssg] Rendering Pages... (18)
...
dist/404/index.html   5.75 KiB
...
[inject-csp-hashes] promoted dist/404/index.html -> dist/404.html for Firebase Hosting's automatic 404 fallback.
[inject-csp-hashes] wrote 10 inline-script hash(es) into firebase.json's Content-Security-Policy script-src (scanned 19 HTML files).
[inject-csp-hashes] verified: all 38 inline <script> tag(s) across 19 HTML files have a matching sha256 source in firebase.json's script-src.
```

`dist/404.html` exists with `<title data-rh="true">Page Not Found · Tejit
Pabari</title>`.

Went one step further than static output and verified through the **real
Firebase Hosting emulator** (`firebase emulators:start --only hosting`
against the real `dist/`), since a headless-browser environment was
available this round (Playwright's Chromium was not cached, so I
downloaded it - `npx playwright install chromium` - to actually render and
screenshot, not just curl):

```
$ curl -sI http://127.0.0.1:5000/this-does-not-exist
HTTP/1.1 404 Not Found
...
$ curl -s http://127.0.0.1:5000/this-does-not-exist | grep -o '<title[^<]*</title>'
<title data-rh="true">Page Not Found · Tejit Pabari</title>
```

A real, unmatched URL gets a genuine HTTP 404 with the real `NotFoundPage`
content - see the screenshot in the Visual verification section (Nav
visible, "Page not found", "Go to homepage" link, footer).

(Note: `vite preview`, unlike the real Firebase emulator, serves an
unmatched path like `/this-does-not-exist` as a `200` with the **home**
page's static HTML - `vite preview`'s own SPA-fallback behavior, not
Firebase's `cleanUrls`/404-fallback mechanism. This is a limitation of that
particular local test server, not a site bug; the real emulator above is
the authoritative check and confirms the correct behavior.)

## 7. Detail pages get techTags

`DetailHeader.tsx` takes a new optional `techTags?: string[]` prop
(default `[]`) and renders `<TechTagList techTags={techTags} className="mt-2" />`
directly below the category tags row - the same subtler component
`ProjectListCard` uses, so the detail view and index view are visually
consistent. `ProjectDetailPage.tsx` and `ResearchDetailPage.tsx` both now
pass `techTags={project.techTags}` / `techTags={item.techTags}`.

New `DetailHeader.test.tsx` cases: techTags render when non-empty; no
techTags group renders when empty/omitted; techTags render in a visually
distinct (non-`TagPill`) treatment from category tags.

## 8. Brand icon gap (github, linkedin, chrome)

Registered the existing hand-rolled `GitHubIcon.tsx` / `LinkedInIcon.tsx`
under `github` / `linkedin` in `src/components/icons/iconRegistry.ts`, and
added a new hand-rolled `src/components/icons/ChromeIcon.tsx` (same
monochrome-svg style as the other two - a simplified circular
three-spoke silhouette, not a reproduction of the exact brand mark)
registered as `chrome`.

`ICON_MAP`'s value type changed from `Record<string, LucideIcon>` to
`Record<string, IconComponent>`, where `IconComponent = ComponentType<{
className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>` - a
type both lucide-react's `LucideIcon` and the hand-rolled `{ className?
}`-typed components satisfy, so `DynamicIcon.tsx`'s single
`createElement(Icon, { className, 'aria-hidden': true })` call works for
either kind with no branching. (A raw union type of `LucideIcon | (props:
...) => JSX.Element` does not type-check through `createElement`'s
overloads - `ComponentType<P>` is what makes overload resolution work;
noted in the code as it wasn't obvious on the first attempt.)

`DynamicIcon.test.tsx` gained a case confirming `github`/`linkedin`/`chrome`
resolve to real, non-`lucide-*`-classed svgs.

Updated `.dev/website-revamp-r3/CONTENT-AUTHORING.md`'s icon list and its
`crunchy-filler` example to use `icon: chrome` instead of `icon: puzzle`,
and its "brand logos" note to say these three are now available.

**Handoff: change another agent must make** (content is out of my scope -
`src/content/**`): `src/content/projects/crunchy-filler.md`'s `icon:
puzzle` should become `icon: chrome`, matching the now-updated
`CONTENT-AUTHORING.md` example. Exact change:

```diff
-    icon: puzzle
+    icon: chrome
```

## Visual verification

`npm run dev` was not used directly (the build's own preview server plus,
for the 404 case, the real Firebase Hosting emulator, were more accurate);
instead a real Chromium was installed (`npx playwright install chromium` -
not cached in this environment, downloaded successfully) and used to
screenshot the real built `dist/` output at desktop (1440px) and mobile
(390px) widths.

- `/projects` (desktop, mobile): horizontal list cards, image left/content
  right on desktop and image-on-top on mobile, full-width search bar with
  filter pills + result count below it, category tags bold/colored, tech
  tags small/muted, primary link buttons filled dark green with icons,
  secondary links outlined, `Crunchy Filler`'s Chrome Web Store link
  showing its (pre-handoff) `puzzle` icon correctly.
- `/research` (desktop): same list-card treatment, multiple link buttons
  per card (e.g. "JBAER Paper", "Google Science Fair", "Times of India"),
  each with its own icon.
- `/projects/juno` (desktop, mobile): `DetailHeader` showing category tag
  + techTags in the subtler treatment, `App`/`Website` link buttons
  (Website primary/filled), full-width `max-w-content` body.
- `/work-experience` (desktop): timeline now spans the full page width,
  matching every other page.
- `/this-does-not-exist` via the real Firebase emulator (desktop): Nav
  visible, "Page not found", "Go to homepage" link, footer - confirmed a
  genuine HTTP 404 status, not a 200.

All screenshots were reviewed inline during this session (not saved into
the repo - ephemeral scratchpad files only).

## Pre-existing bug observed during visual verification (NOT fixed - out of my file-ownership scope)

While screenshotting, `StatusBadge`'s colored pill background does not
render anywhere on the built site (home page's `ProjectCard`, this
sub-project's new `ProjectListCard`, and `DetailHeader` all show the
status text - e.g. "BUILDING"/"COMPLETED" - in white with **no visible
background pill**, just floating text). This is **not caused by any change
in this sub-project** - `StatusBadge.tsx` and `tailwind.config.ts` are
both untouched by me and outside my file-ownership list for this pass.

Root cause, isolated with the standalone `tailwindcss` CLI against the
real `tailwind.config.ts` (bypassing Vite entirely, to rule out a
build-tool-specific cache): the **opacity-modifier suffix** (`/NN`) on a
`background-color` utility fails to generate any CSS rule for exactly
three color tokens - `bg-teal/92`, `bg-slate-dark/92`,
`bg-status-building/92` (all three of `StatusBadge.tsx`'s
`STATUS_STYLES` values) - while the same colors work fine with the
opacity modifier on `text-*`/`border-*` (`text-status-building/50` does
generate, e.g.), and other `bg-*/NN` combinations (built-in colors, and
even a freshly-added throwaway custom color) generate correctly. Base
`bg-status-building` (no modifier) also generates fine on its own. I could
not identify a single unifying cause in the time available (tested color
naming collisions with Tailwind's default palette, a `DEFAULT`-key nested
object shape, and a from-scratch custom color - none alone explains all
three symptomatic classes), so this reads as a genuine, narrow
Tailwind/JIT engine quirk specific to this exact plugin+modifier
combination in this project's Tailwind 3.4.19 install, not something in
this round's changes.

**Suggested fix for whoever owns `tailwind.config.ts`/`StatusBadge.tsx`:**
switch `StatusBadge.tsx`'s three `STATUS_STYLES` background classes from
theme-token opacity-modifier syntax (`bg-teal/92`) to Tailwind's arbitrary-
value opacity syntax instead (`bg-[#043439]/[0.92]`,
`bg-[#4D5D59]/[0.92]`, `bg-[#92400E]/[0.92]`), which bypasses the
theme-color-candidate lookup that appears to be misbehaving and should
generate reliably (confirmed base-color and arbitrary-value opacity
classes both work fine in isolated testing). This is not something I
implemented myself since `StatusBadge.tsx` is not in my owned file list
for this pass.

## Verification summary

```
npm run typecheck   -> pass
npm test             -> 242/242 passed (41 files)
npm run lint          -> pass
npm run check:no-em-dash -> pass
npm run build          -> pass end to end, dist/404.html produced
```

## Handoff summary (changes another agent must make)

1. `src/content/projects/crunchy-filler.md` - change `icon: puzzle` to
   `icon: chrome` (item 8).
2. `StatusBadge.tsx` / `tailwind.config.ts` (not owned by me) - the
   pre-existing `bg-*/92` opacity-modifier rendering bug described above.
   Not caused by this sub-project, but affects the visual result of
   `ProjectListCard` and `DetailHeader`'s status pills (and the home
   page's `ProjectCard`, unrelated to this sub-project) until fixed.

## Not done / could not verify

Nothing from this sub-project's 8 items was left undone. The one
observed gap is the pre-existing StatusBadge bug above, which is outside
this pass's file-ownership scope by design.
