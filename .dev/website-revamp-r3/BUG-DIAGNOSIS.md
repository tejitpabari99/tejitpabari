# Bug Diagnosis - website-revamp

Branch: `website-revamp`, HEAD at diagnosis time: `948efe3`.

Method note: the live domain `https://tejitpabari.com` currently serves a
temporary holding page (see "Production caveat" below), not this codebase, so
I could not do a live-production CSP/HTML diff as originally hoped. Instead I
(a) inspected the `dist/` build already present in the working tree, and (b)
built a clean, isolated copy of this exact commit in a separate git worktree
(`git worktree add /tmp/diag HEAD`, with `node_modules` symlinked in so no
`npm install` was needed) and ran the real `npm run build` there, so I could
watch the full `prebuild -> build -> postbuild` pipeline run end to end
without touching any file in the actual working tree. That worktree was
removed after use; nothing under the real working tree was modified by me.

### Production caveat (affects Bugs 1-3 confidence)

`curl -sI https://tejitpabari.com/` returns HTTP 200, but the body is a
hand-written holding page, not this codebase's SSG output:

```
<!-- TEMPORARY SCAFFOLDING: this is a holding page deployed ahead of DNS cutover
     while tejitpabari.com is being rewritten. It will be replaced wholesale
     by the real site. Do not treat this as the final design. -->
```

`content-length: 3858`, `<title>Tejit Pabari</title>` (no " · " duplication),
no `Content-Security-Policy` header at all. `curl -sI https://tejitpabari.com/projects`
returns a genuine **Firebase-native** 404 page (`<title>Page Not Found</title>`,
Firebase's own default error template) - not this repo's rewrite-to-index.html
behavior and not this repo's `NotFoundPage`. So the currently-live site cannot
be running `website-revamp`'s `firebase.json`/`dist` at all (that config
rewrites `**` to `/index.html`, which would never produce a native Firebase
404). Whatever the owner actually tested against (a local build + emulator,
or an older preview channel, or a build produced without the full `npm run
build` pipeline) is not the current production domain.

This does not change the diagnosis below - the bugs are real, reproducible
defects in this codebase's build/config, evidenced with real command output -
but I flag it because I could not do the specific "diff live CSP header vs
live HTML hashes" check the task asked for, since production isn't running
this code yet.

---

## Bug 1: Tag pills / search don't work on /projects

**Symptom:** "None of the tags are clickable in projects. They dont filter
at all. Search doesn't work as well."

**Root cause:** The CSP `script-src` that `firebase.json` ships is missing
the `'sha256-...'` hashes for this site's two required inline `<script>`
tags, when the site is built by any path that does not run the full `npm
run build` → `postbuild` lifecycle. When that happens, the browser's CSP
blocks both inline scripts, which means `window.__staticRouterHydrationData`
and `window.__VITE_REACT_SSG_HASH__` are never set, which breaks React
hydration and the client-side data-loader manifest fetch. The result is a
page that looks fully rendered (static prerendered HTML) but has no working
event handlers - exactly "looks correct, does nothing."

**Evidence:**

1. The `dist/` and `firebase.json` already sitting in the working tree when
   I started (both timestamped today) show this exact broken state.
   `firebase.json`'s CSP has zero `sha256-` sources:
   ```
   "value": "default-src 'self'; script-src 'self' https://www.googletagmanager.com; ..."
   ```
   Yet `dist/index.html` contains two inline scripts:
   ```html
   <script>window.__staticRouterHydrationData = JSON.parse("{\"loaderData\":{\"0\":null,\"0-0\":null},...}");</script>
   <script>window.__VITE_REACT_SSG_HASH__ = '1m2pait8hx'</script>
   ```
   I computed their real sha256 hashes directly from the built file
   (`sha256-3T3SNxfkVCsSXLoqWCnMnaafmqifqcz/19S077omPB0=` and
   `sha256-YGTqxdDYnbPbFbLj5hnYnS5SpwuDeXE5rE0MaT2xqC8=`) - neither appears
   anywhere in `firebase.json`.

2. I served that exact `dist/` through the real Firebase Hosting emulator
   (`firebase emulators:start --only hosting`, which applies `firebase.json`
   headers exactly as production would - a plain static server would not
   have shown this):
   ```
   $ curl -sI http://localhost:5000/projects | grep -i content-security
   Content-Security-Policy: default-src 'self'; script-src 'self' https://www.googletagmanager.com; ...
   ```
   No `sha256-` sources present. A real browser hitting this would log two
   `Refused to execute inline script because it violates the following
   Content Security Policy directive: "script-src 'self'
   https://www.googletagmanager.com"` console errors, and hydration would
   proceed with `window.__staticRouterHydrationData` and
   `window.__VITE_REACT_SSG_HASH__` both `undefined`.

3. I confirmed *why* those globals matter by reading the actual hydration
   code:
   - `node_modules/react-router-dom/dist/index.js:257`:
     `let state = window?.__staticRouterHydrationData;` - optional
     chaining, so this doesn't throw, but it silently discards all SSR
     loader state, so the client re-derives the route tree from scratch
     while `data-server-rendered="true"` is still on the DOM
     (`node_modules/vite-react-ssg/dist/index.mjs`, the `isSSR` check),
     which forces React's `hydrate()` path against a client tree with no
     matching loader data - a hydration mismatch.
   - `node_modules/vite-react-ssg/dist/index.mjs:114` (inside
     `transformStaticLoaderRoute`'s loader): every prerendered route's data
     is fetched from
     `` `static-loader-data-manifest-${window.__VITE_REACT_SSG_HASH__}.json` ``.
     With the hash undefined, this becomes a request for
     `static-loader-data-manifest-undefined.json` - a guaranteed 404 that
     fails the route's data loading during hydration.

4. To confirm the *mechanism that's supposed to prevent this* actually
   works when invoked correctly, I ran the real `npm run build` (which
   npm's lifecycle runs as `prebuild` → `build` → `postbuild`
   automatically) in the isolated worktree:
   ```
   > tejitpabari-website@0.1.0 postbuild
   > node scripts/inject-csp-hashes.mjs

   [inject-csp-hashes] wrote 10 inline-script hash(es) into firebase.json's
   Content-Security-Policy script-src (scanned 25 HTML files).
   ```
   The worktree's resulting `firebase.json` did contain
   `sha256-3T3SNxfkVCsSXLoqWCnMnaafmqifqcz/19S077omPB0=` (matching my
   manually computed hash for the hydration-data script - the other hash
   naturally differs each build since `__VITE_REACT_SSG_HASH__` is a fresh
   random string per build). `npm config get ignore-scripts` returned
   `false` and there is no `.npmrc` disabling lifecycle scripts, so
   `scripts/inject-csp-hashes.mjs` (`package.json`'s `postbuild`) is
   correctly wired and *does* work when the build is invoked as `npm run
   build` - which is what both `.github/workflows/firebase-hosting-merge.yml`
   and `firebase-hosting-pull-request.yml` do.

   **So the mechanism itself is not broken** - but the working tree's own
   `dist/`+`firebase.json` prove it is trivially possible to ship a broken,
   unhashed CSP if `dist/` is ever produced by any path that doesn't run the
   full `npm run build` (e.g. running `vite-react-ssg build` directly
   during local testing/preview, or `npm run build --ignore-scripts`).
   There is currently **no safety net** anywhere in the pipeline that
   verifies, before a real `firebase deploy`, that `firebase.json`'s
   `script-src` actually contains a hash for every inline script `dist/`
   contains - `inject-csp-hashes.mjs` throws if it finds *zero* inline
   scripts, but nothing checks that its own write actually landed in the
   `firebase.json` that gets deployed, or catches a human/tooling mistake
   that bypasses `npm run build` entirely.

5. Ruled out: hydration mismatch from `useCollectionFilter` itself - it
   already renders hydration-safe empty defaults (`useState('')`,
   `useState(null)`, adopting real `searchParams` only in a post-mount
   `useEffect`/`startTransition`), so that hook is not the cause. `TagPill`
   and `SearchFilter` code is correct; `onClick` is passed through and the
   pill correctly becomes a `<button>`. This is consistent with the bug
   report's own framing: the code is fine, the build/deploy pipeline isn't.

**Exact fix:**

- No source-code fix is required in `SearchFilter.tsx` / `TagPill.tsx` /
  `useCollectionFilter.ts` - they are correct.
- The real fix is process/CI hardening, since the underlying mechanism
  (`scripts/inject-csp-hashes.mjs`, `package.json`'s `"postbuild"` line)
  already works correctly:
  1. Add a verification step (a new script, or an addition to
     `inject-csp-hashes.mjs` itself) that, after writing hashes, re-reads
     `firebase.json` and asserts `script-src` contains at least as many
     `sha256-` sources as distinct inline-script bodies found, and fails
     the build loudly if not - so a future refactor that renames/reorders
     the `build`/`postbuild` scripts, or any manual/alternate build
     invocation, cannot silently ship a broken CSP.
  2. Never build for deploy via a bare `vite-react-ssg build` - only via
     `npm run build` (which the two GitHub workflows already do correctly).
     Document this explicitly (e.g. a comment in `package.json` next to
     `"postbuild"`, or in `README.md`) since it is exactly the kind of
     "works by convention, not by enforcement" trap that produced the
     broken `dist/`/`firebase.json` pair I found sitting in the working
     tree.
  3. Optional extra safety: add a CI check (in the merge workflow, after
     `npm run build`) that greps the built `firebase.json` for `sha256-`
     inside `script-src` and fails if absent, as a second independent gate
     before the deploy step runs.

**Confidence:** High that this is *a* real, reproducible root cause
(directly demonstrated via the hosting emulator with real `firebase.json`
headers). Medium on whether this exact state is what the owner personally
observed, since I could not confirm it against the actual live domain (see
Production caveat) - but the failure mode is real, present in the working
tree as I found it, and trivially triggerable.

---

## Bug 2: No 404 page

**Symptom:** "There is no 404 - I put a random page and it put me at home
page."

**Root cause:** Two compounding issues:

1. `firebase.json`'s catch-all `rewrites: [{ source: "**", destination:
   "/index.html" }]` serves the fully prerendered **home page** (not an
   empty SPA shell) for literally any unmatched URL, with HTTP 200. Only a
   working client-side hydration swap (React Router's `path: '*'` route)
   would ever show `NotFoundPage` - and Bug 1 shows hydration is fragile
   under a realistic failure mode (missing CSP hashes), so on any build
   affected by Bug 1, unmatched paths permanently show the home page with
   no way to reach `NotFoundPage` at all, matching the report exactly.
2. Independent of Bug 1: **nothing currently produces a `dist/404.html`
   file at all**, so even a perfectly working deploy has no file for
   Firebase Hosting's automatic 404-fallback mechanism to serve once the
   catch-all rewrite is removed.

**Evidence:**

- `src/pages/NotFoundPage.tsx`'s own comment confirms: "`path: '*'` is
  never enumerated by `getStaticPaths` ... so this component is never
  itself prerendered."
- I confirmed this empirically from the real build output (both the
  pre-existing `dist/` and my clean worktree build via `npm run build`):
  `[vite-react-ssg] Rendering Pages... (25)` - 25 files listed, none named
  `404` or `*`. Full `find dist -type f` listing shows every real route
  (`/`, `/projects`, `/projects/<slug>`, `/work-experience`, `/research`,
  `/research/<slug>`, `/privacy`, `/terms`, plus the (now-removed, per a
  concurrent edit) `/projects/<slug>/live` pages) each as
  `<route>/index.html` - no `404.html` anywhere.
- `package.json`: `"vite-react-ssg": "^0.9.2"`. I read the actual installed
  build code, `node_modules/vite-react-ssg/dist/shared/vite-react-ssg.Ctg3mDmH.mjs`:
  ```js
  const relativeRouteFile = `${(path.endsWith("/") ? `${path}index` : path).replace(/^\//g, "")}.html`;
  const filename = dirStyle === "nested" ? join(path.replace(/^\//g, ""), "index.html") : relativeRouteFile;
  ```
  and the plugin default: `dirStyle = "flat"` - but this project's own
  `vite.config.ts:89` explicitly overrides it:
  ```ts
  dirStyle: 'nested', // dist/<route>/index.html - matches juno-landing-page; plays cleanly with Firebase's cleanUrls
  ```
  With `dirStyle: 'nested'`, **every** route (dynamic or not) is written as
  `<path>/index.html`, never as a bare `<path>.html`. This means the
  proposed fix ("add a route to `src/routes.tsx` that prerenders to
  `dist/404.html`") is **incomplete as literally stated**: adding
  `{ path: '404', element: <NotFoundPage /> }` to `src/routes.tsx` would
  produce `dist/404/index.html`, *not* `dist/404.html`. Firebase Hosting's
  automatic-404 mechanism specifically requires a file literally named
  `404.html` (optionally per-directory) - it does not look for
  `404/index.html`.
- `cleanUrls: true` in `firebase.json`: since `dirStyle` is `'nested'`,
  every emitted page is already `folder/index.html`, which Firebase serves
  for the clean, extension-less path (`/projects/juno`) natively, with no
  dependence on `cleanUrls` at all - Firebase always serves
  `<dir>/index.html` for a directory-style request regardless of that flag.
  `cleanUrls` only affects flat `<name>.html` files (redirecting
  `/foo.html` → `/foo`), and this build currently emits none, so the flag
  is presently inert for this site's routed pages - it neither helps nor
  hurts the 404 question, it just isn't doing anything today. It's not a
  competing/conflicting setting worth removing, just worth knowing it isn't
  the thing that will make a `404` route file get picked up automatically.
- Every real route in the (currently, mid-edit) `src/routes.tsx` - `/`,
  `projects`, `projects/:slug` (via `getStaticPaths: () =>
  projectSlugs.map(...)`), `work-experience`, `research`, `research/:slug`
  (via `getStaticPaths`), `privacy`, `terms` - has a corresponding static
  file confirmed in the `find dist -type f` listing above, so removing the
  catch-all rewrite would not break any real route; every one of them is
  independently reachable as a static file already.

**Exact fix:**

1. `firebase.json`: remove the `"rewrites"` block entirely (as proposed) -
   this is safe given every real route already has its own static file
   under `dirStyle: 'nested'`.
2. `src/routes.tsx`: add a dedicated, enumerable 404 route alongside the
   existing `{ path: '*', element: <NotFoundPage /> }` (which stays, for
   client-side nav to unknown paths after hydration):
   ```ts
   { path: '404', element: <NotFoundPage /> },
   ```
   This alone produces `dist/404/index.html`, not `dist/404.html` - see
   evidence above.
3. Add a small postbuild step (new script, e.g.
   `scripts/promote-404-page.mjs`, following the same pattern already
   established by `scripts/inject-csp-hashes.mjs`) that copies
   `dist/404/index.html` to `dist/404.html` after `vite-react-ssg build`
   runs and before (or alongside) `inject-csp-hashes.mjs`, e.g.:
   ```js
   import { copyFileSync, existsSync } from 'node:fs';
   import path from 'node:path';
   const DIST = path.resolve(import.meta.dirname, '..', 'dist');
   const src = path.join(DIST, '404', 'index.html');
   const dest = path.join(DIST, '404.html');
   if (!existsSync(src)) throw new Error('promote-404-page: dist/404/index.html not found - did the 404 route render?');
   copyFileSync(src, dest);
   ```
   and update `package.json`'s `"postbuild"` to run it:
   ```json
   "postbuild": "node scripts/promote-404-page.mjs && node scripts/inject-csp-hashes.mjs"
   ```
   Running it first ensures `inject-csp-hashes.mjs`'s recursive `dist/**/*.html`
   scan also covers `dist/404.html` (it would anyway, since the copy is
   byte-identical to the already-scanned `dist/404/index.html`, but running
   first keeps the two scripts' outputs consistent without relying on that
   coincidence).
4. Leaving `dist/404/index.html` in place alongside the new `dist/404.html`
   is harmless (it just becomes a normal, directly-reachable page at
   `/404`); deleting it instead of copying is also fine if a bare URL at
   `/404` isn't wanted.

**Confidence:** High on the mechanism (`dirStyle: 'nested'` producing
`404/index.html` not `404.html`, confirmed directly from the installed
`vite-react-ssg` source and this project's own `vite.config.ts`). High on
the catch-all rewrite being the reason unmatched paths currently 200 as the
home page. Not independently verified against production (see caveat).

---

## Bug 3: Duplicated site name in the browser tab

**Symptom:** "I see two Tejit Pabari.Tejit Pabari in my browser window
heading."

**Root cause:** Two distinct, compounding defects:

(a) `src/pages/HomePage.tsx` passes `title="Tejit Pabari"` to `RouteMeta`,
and `src/config/site.ts` defines `SITE_NAME = 'Tejit Pabari'` - the same
string. `RouteMeta.tsx` unconditionally builds
`` const fullTitle = `${title} · ${SITE_NAME}`; `` with no check for
`title === SITE_NAME`, so the home page's real, rendered `<title>` is
literally **"Tejit Pabari · Tejit Pabari"**. This is the exact string the
user is describing.

(b) Independently, the built HTML for every route contains **two** `<title>`
elements: the `Head`-injected one (from `RouteMeta`, correct per-route) and
the static one hardcoded in `index.html`
(`<title>Tejit Pabari: Health-Tech Builder</title>`). This is a real,
separate defect (invalid HTML - a document must have at most one `<title>`)
but it is not itself the cause of what the user sees: I verified from
`node_modules/vite-react-ssg/dist/shared/vite-react-ssg.Ctg3mDmH.mjs` that
vite-react-ssg's `renderHTML` does:
```js
const headStartTag = "<head>";
const metaTags = metaAttributes.join("");
indexHTML = indexHTML.replace(headStartTag, headStartTag + metaTags);
```
- it always **prepends** the `Head`/react-helmet-derived tags immediately
after `<head>`, and never removes/replaces anything already in the
template. So in tree order, the `Head`-injected `<title data-rh="true">`
comes *first*, and `index.html`'s static `<title>` comes second. Per the
WHATWG HTML spec, a document's title (and what a browser tab displays) is
taken from the **first** `title` element in tree order, so the visible tab
text is entirely explained by cause (a) alone; the stray second `<title>`
from cause (b) is dead/ignored by spec-compliant browsers but is still
invalid, redundant markup worth removing.

**Evidence:** actual built `dist/index.html` head, verbatim:
```html
<head><title data-rh="true">Tejit Pabari · Tejit Pabari</title><meta data-rh="true" name="description" content="Health-tech builder and software engineer. ..."><meta data-rh="true" property="og:title" content="Tejit Pabari · Tejit Pabari">...<link data-rh="true" rel="canonical" href="https://tejitpabari.com/">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tejit Pabari: Health-Tech Builder</title>
    <meta name="description" content="Tejit Pabari is a software engineer and founder building health-tech products, including Juno, an AI companion for medical appointments.">
    ...
```
`grep -c '<title>'` on the raw file undercounts (it only matches bare
`<title>`, missing the `data-rh="true"` one), but a manual read of the head
confirms two title elements and two `og:title`/description meta pairs. This
same pattern (`data-rh` tags prepended, static `index.html` tags left
untouched right after) is present on every prerendered route, so every page
carries a redundant, stale second `<title>`/`<meta description>` pair, not
just the home page.

**Exact fix:**

1. `src/components/RouteMeta.tsx` - don't append `· SITE_NAME` when the
   title already *is* the site name:
   ```tsx
   const fullTitle = title === SITE_NAME ? title : `${title} · ${SITE_NAME}`;
   ```
   This fixes the home page (and any future page that intentionally passes
   `title={SITE_NAME}`) without touching every other route, which already
   passes a distinct page title and is unaffected.
2. `index.html` - remove the static `<title>` and static
   `<meta name="description">` tags from the `<head>` entirely. They are
   fully redundant now: every route already renders its own correct,
   SSR'd `<title>`/description via `RouteMeta`/`Head` in the actual served
   HTML (this is a prerendered site, not a client-only SPA shell - the
   real per-route text is already present in the initial HTML response,
   with no dependency on JS execution). Keeping the static tags serves no
   purpose other than producing this duplicate-tag bug on every single
   page. There is no vite-react-ssg config flag to make it "replace
   instead of append" - it always prepends and never touches the
   template - so removing the template's own tags is the correct and only
   fix, not a workaround.

**Confidence:** High for cause (a) (directly reproduced from actual built
output, exact string match to the user's report). High for cause (b) being
real and present (verified in the actual built HTML across routes) but
Medium on it mattering to what the user visually sees, since it depends on
browsers consistently implementing "first title element wins," which I
could not test in an actual browser in this environment (no headless
browser available; reasoned from the WHATWG HTML spec's `document.title`
algorithm plus the fact that both major-engine implementations I'm aware of
follow it). Recommend fixing both regardless, since (b) is a real spec
violation independent of whether it currently causes a visible symptom.

---

## Bug 4: Invalid Tailwind utility classes producing zero padding

**Symptom:** The "Connect / Profiles" card in the contact section has text
touching its border on mobile.

**Root cause:** `p-4.5` (and other decimal utilities not in Tailwind 3's
default spacing/line-height scales) are not real Tailwind classes - Tailwind
only generates CSS for values it knows about, so these silently compile to
nothing. No error, no warning - the class just never gets a CSS rule.

**Evidence - repo-wide grep, then verified against the real generated CSS:**

```
$ grep -rnE '\b(...)-[0-9]+\.[0-9]+\b' src/ --include='*.tsx' --include='*.ts'
```
found every decimal-valued spacing/line-height/leading utility in the repo.
Cross-checking each against Tailwind 3's actual default scales
(spacing: `0.5, 1.5, 2.5, 3.5` are real defaults; `4.5, 5.5, 6.5, ...` are
not - the scale jumps from `4` straight to `5` - and `4.5` was never added to
`theme.extend.spacing` in this repo's `tailwind.config.ts`; lineHeight:
Tailwind's default `leading-*` scale is integers only -
`3,4,5,6,7,8,9,10` - there is no fractional `leading` scale at all by
default) gives:

| File:Line | Class | Real or dead | Why |
|---|---|---|---|
| `src/sections/ContactSection.tsx:40` | `p-4.5` | **Dead** | `4.5` is not in Tailwind's default spacing scale and not added in `tailwind.config.ts` |
| `src/sections/ContactSection.tsx:24` | `leading-6.5` | **Dead** | Tailwind's default `leading-*` scale is integers only; no fractional leading utility exists by default |
| `src/layout/Nav.tsx:69` | `sm:px-4.5` | **Dead** | same as `p-4.5` - `4.5` not in the spacing scale |
| `src/components/LinksRow.tsx:29,42,45` `gap-1.5`, `h-3.5 w-3.5` | Real | `1.5`, `3.5` are real Tailwind defaults |
| `src/components/SearchFilter.tsx:19` `gap-1.5` | Real | default |
| `src/components/ProjectCard.tsx:35,58,71` `p-3.5`, `h-3.5 w-3.5`, `gap-1.5` | Real | defaults |
| `src/components/timeline/TimelineSeeAllStub.tsx:12` `gap-1.5` | Real | default |
| `src/sections/ContactSection.tsx:21,28,49` `mt-3.5`, `gap-2.5` | Real | defaults |
| `src/sections/FeaturedProjectsSection.tsx:55`, `src/sections/Hero.tsx:44,50` `gap-1.5`, `py-2.5`, `gap-2.5` | Real | defaults |
| `src/components/StatusBadge.tsx:30`, `StatusBadge.test.tsx:29` `py-0.5` | Real | default |
| `src/components/timeline/TimelineEntry.tsx:43,48` `mt-0.5`, `mt-1.5` | Real | defaults |
| `src/layout/Nav.tsx:53,55,69` `p-1.5`, `gap-0.5`, `py-1.5`, `sm:py-2.5`, `lg:py-2.5` | Real | defaults |
| `src/components/Button.tsx:20` `py-2.5` | Real | default |

I then confirmed this against the actual generated CSS in the built output
(`dist/assets/app-LzfLhvP0.css`), rather than trusting the scale from
memory:
```
$ grep -o '\.p-3\\.5[^{]*{[^}]*}' dist/assets/*.css     # control case - a real default
.p-3\.5{padding:.875rem}

$ grep -o '\.p-4\\.5[^{]*{[^}]*}' dist/assets/*.css     # 0 matches - dead
$ grep -o '\.leading-6\\.5[^{]*{[^}]*}' dist/assets/*.css   # 0 matches - dead
$ grep -o '\.sm\\:px-4\\.5[^{]*{[^}]*}' dist/assets/*.css   # 0 matches - dead
```
The control case (`p-3.5`, a real default) generates a rule; all three
suspect classes generate **zero bytes of CSS**, confirmed by grepping the
real build artifact, not by memory of the Tailwind scale.

This exactly explains the reported symptom: on the "Connect / Profiles"
card (`src/sections/ContactSection.tsx:40`,
`className="rounded-panel border border-teal-secondary/12 bg-sage p-4.5 shadow-panel sm:p-5"`),
`p-4.5` produces no padding at any viewport, but `sm:p-5` **is** a real
class and does apply from the `sm` breakpoint up - so the card has zero
padding only below `sm`, i.e. on mobile, matching "text touching its
border on mobile" precisely.

**Exact fix:**

1. `tailwind.config.ts` - add the missing half-step values to
   `theme.extend.spacing` (preferred over replacing the classes, since the
   design clearly intends these half-steps - `p-3.5`/`p-5` bracket exactly
   where `p-4.5` was reached for)`:
   ```ts
   theme: {
     extend: {
       spacing: {
         '4.5': '1.125rem',
       },
       lineHeight: {
         '6.5': '1.625rem',
       },
       // ...existing extend keys...
     },
   },
   ```
   This makes `p-4.5` (`ContactSection.tsx:40`), `sm:px-4.5`
   (`Nav.tsx:69`), and `leading-6.5` (`ContactSection.tsx:24`) all
   generate real CSS without changing any class name in the source files.
2. Values chosen: `4.5` spacing = `1.125rem` (Tailwind's own linear
   `spacing[n] = n * 0.25rem` formula, consistent with how `3.5` = `.875rem`
   and `5` = `1.25rem` are already defined) - this is the value Tailwind
   would have generated had `4.5` been a default step, so it's the correct,
   non-arbitrary choice, not a guess. `leading-6.5` = `1.625rem` for the
   same reason, matching `leading-6` = `1.5rem` and `leading-7` =
   `1.75rem`'s `0.25rem`-per-half-step spacing already used by the
   integer scale (`(6+0.5) * 0.25rem = 1.625rem`).
3. After adding these, re-run the build and re-grep
   `dist/assets/*.css` for `.p-4\.5`, `.leading-6\.5`, and
   `.sm\\:px-4\.5` to confirm all three now emit real rules - I did not do
   this myself since it requires editing `tailwind.config.ts`, which is out
   of scope for this diagnosis-only pass.

**Confidence:** High. Directly confirmed against real generated CSS in the
build artifact, not inferred from the Tailwind default-scale documentation
alone (a control case with a known-real class was checked side by side with
each suspect class in the same file, using the same command).

---

## What I could not verify

- Could not confirm any of this against the *actual* live production
  response, since `tejitpabari.com` currently serves an unrelated holding
  page (see Production caveat at top). All build/CSP/CSS evidence above is
  from this repo's own `dist/` output (both the pre-existing one and a
  clean rebuild in an isolated worktree at the same commit), served through
  the real Firebase Hosting emulator to get real `firebase.json`-driven
  response headers.
- No headless browser was available in this environment, so Bug 1's
  "browser console errors verbatim" and Bug 3's "first-title-wins" claim
  are argued from the CSP mechanics / WHATWG spec and the installed
  library source rather than an actual captured console log or rendered
  screenshot.
- `src/routes.tsx`, `src/data/projects.ts`, `src/data/research.ts`,
  `src/data/shared.ts`, and a few other files changed under a concurrent
  agent's edits while I was working (visible via `git diff --stat` -
  removal of `ProjectLivePage`/live-project routes, unrelated to these four
  bugs). I did not read or rely on any of that in-flight work beyond noting
  it does not affect this diagnosis; my worktree-based build evidence used
  the frozen `HEAD` commit (`948efe3`), unaffected by those concurrent,
  uncommitted changes.
