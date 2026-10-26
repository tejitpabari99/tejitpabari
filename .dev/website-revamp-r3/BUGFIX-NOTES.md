# Bugfix Notes - r3-04-prod-bugfixes

Fixes for the four bugs documented in `BUG-DIAGNOSIS.md`. File-ownership
constraint for this pass: `firebase.json`, `scripts/inject-csp-hashes.mjs`,
`src/components/RouteMeta.tsx` / `.test.tsx`, `src/config/site.ts` /
`.test.ts`, `index.html`, `tailwind.config.ts`, this notes file. No other
file was touched.

All verification below used real command output from this machine: a real
`npm run build`, a real Firebase Hosting emulator, and a Python script that
independently recomputes sha256 hashes from the built HTML (not trusting the
injector script's own math). Isolated verification runs used a scratch copy
of the working tree under `/tmp/.../scratchpad` (rsync, with `node_modules`
symlinked) rather than a git worktree, so no build was ever run against the
real `dist/` in a way that could interfere with the concurrent agent's
in-flight edits to files outside this list. The scratch copies were deleted
after use.

---

## Bug 1: CSP blocks hydration (tag pills / search don't work)

**Status: Fixed (hardening) and verified.**

The diagnosis found the actual root cause was already correctly handled by
`scripts/inject-csp-hashes.mjs` when invoked via the real `npm run build`
pipeline; the missing piece was a safety net so a build produced any other
way could not silently ship a `firebase.json` with no hashes.

### What changed

`scripts/inject-csp-hashes.mjs`:

1. `collectInlineScriptHashes` now also returns `perFile`, a flat list of
   every inline `<script>` found (file + its sha256 source token), not just
   the deduped set used to write the header.
2. New `verifyHashesLanded(perFile)` function: after writing `firebase.json`,
   re-reads it fresh from disk (not the in-memory object the script just
   built) and asserts every entry in `perFile` has its hash present in the
   written `script-src` directive. On any miss it throws (non-zero exit)
   naming the exact offending file and hash, e.g.:
   ```
   inject-csp-hashes: verification FAILED after writing firebase.json - N inline <script> tag(s)
   in dist/**/*.html do not have a matching 'sha256-...' entry in the Content-Security-Policy script-src
   directive that was just written:
     - dist/some/page/index.html: missing 'sha256-...'
   ...
   ```
   `main()` calls this immediately after the `writeFileSync` and logs a
   success line only if it passes. This is the loud, non-zero-exit safety
   net the diagnosis said was missing; it does not just warn.

### Verification

Real `npm run build` in this repo (with the current mid-edit `src/routes.tsx`,
which has no `404` route yet) writes a fully hashed `firebase.json` for the
17 real routes that exist today, then correctly halts at the (expected,
Bug-2-related) 404 promotion step before it would otherwise reach the hash
step again on a rebuild - see Bug 2 below for why that specific halt is
correct, not a regression.

To verify the hashing + verification logic itself under the *full* pipeline
(all 18 routes including a `404` route), I built an isolated scratch copy of
the whole working tree with a single line temporarily added to *that copy's*
`src/routes.tsx` (never the real file):

```
> tejitpabari-website@0.1.0 postbuild
> node scripts/inject-csp-hashes.mjs

[inject-csp-hashes] promoted dist/404/index.html -> dist/404.html for Firebase Hosting's automatic 404 fallback.
[inject-csp-hashes] wrote 10 inline-script hash(es) into firebase.json's Content-Security-Policy script-src (scanned 19 HTML files).
[inject-csp-hashes] verified: all 38 inline <script> tag(s) across 19 HTML files have a matching sha256 source in firebase.json's script-src.
```

Independent static cross-check (Python, recomputing sha256 straight from the
built HTML, not calling the injector script's own code):

```
Inline script hashes found in dist/**/*.html: 10
sha256 sources written in firebase.json script-src: 10
Missing (should be empty): set()
```

Served that exact `dist/` + `firebase.json` through the real Firebase
Hosting emulator (`firebase emulators:start --only hosting`):

```
$ curl -sI http://127.0.0.1:5000/ | grep -i content-security
Content-Security-Policy: default-src 'self'; script-src 'self' https://www.googletagmanager.com 'sha256-...' [x10] ...

$ curl -sI http://127.0.0.1:5000/projects | grep -i content-security
Content-Security-Policy: default-src 'self'; script-src 'self' https://www.googletagmanager.com 'sha256-...' [x10] ...
```

Both routes' headers contain every hash needed for their inline scripts - a
real browser would execute both inline scripts. I also confirmed the thing
those scripts unlock actually resolves correctly through the emulator: the
`__VITE_REACT_SSG_HASH__` bootstrap value in `/projects`'s HTML was
`wun52ftq2i`, and fetching
`http://127.0.0.1:5000/static-loader-data-manifest-wun52ftq2i.json` returned
HTTP 200 with real route->data-file mappings (not a 404), which is the exact
mechanism the diagnosis identified as broken when hydration data globals are
`undefined`.

No headless browser was available in this environment (`npx playwright` has
no cached Chromium binary here and installing one is out of scope of the
files I own), so I did not capture an actual rendered screenshot or click a
tag pill. The evidence above (real emulator-served CSP headers with every
hash present, plus the manifest fetch succeeding under the exact hash the
page bootstraps with) is what the diagnosis itself used to establish the
failure mode, and it now shows the opposite result under the fixed pipeline.

### Commit note on `firebase.json`

`npm run build` cannot currently complete end-to-end in the real working
tree, because `promote404()` (Bug 2's fix, below) correctly halts before the
hash-writing step runs, since `src/routes.tsx` has no `404` route yet. That
means the real tree's `firebase.json` cannot be regenerated by the real
pipeline until the Bug 2 handoff lands. I generated a correct, fully-hashed
`firebase.json` from the isolated scratch build described above (which used
the same source content as this working tree plus a temporary `404` route
addition, so the CSP hashes reflect real current dist output including the
Bug 3/4 fixes) and copied only that file back into the real working tree.
This is committed. It will be regenerated fresh (and will need to be, since
`__VITE_REACT_SSG_HASH__` is random per build) the next time a real
`npm run build` completes in CI, once the Bug 2 route handoff lands - that
is expected and is exactly what this script is for.

---

## Bug 2: No 404 page

**Status: Partially fixed; blocked on a handoff (as instructed).**

### What changed

1. `firebase.json`: removed the catch-all `rewrites` block entirely.

   Verified safe first, from a real `npm run build` of the current
   (mid-edit) `src/routes.tsx`, before removing it:

   ```
   $ find dist -name "*.html" | sort
   dist/index.html
   dist/privacy/index.html
   dist/projects/clip-verse/index.html
   dist/projects/columbia-virtual-campus/index.html
   dist/projects/crunchy-filler/index.html
   dist/projects/index.html
   dist/projects/juno/index.html
   dist/projects/med-doc-tracker/index.html
   dist/projects/smarttest/index.html
   dist/research/dvmm-lab/index.html
   dist/research/flood-event-extraction-bangladesh/index.html
   dist/research/incite-labs/index.html
   dist/research/index.html
   dist/research/pill-recognition-prescription-extraction/index.html
   dist/research/solar-illumination-water-bottle/index.html
   dist/terms/index.html
   dist/work-experience/index.html
   ```

   Every real route currently in `src/routes.tsx` (`/`, `/projects`, all 5
   project detail slugs, `/work-experience`, `/research`, all 4 research
   detail slugs, `/privacy`, `/terms` - 17 files total, matching the
   `[vite-react-ssg] Rendering Pages... (17)` build log line) has its own
   `<path>/index.html`. `cleanUrls: true` plus `dirStyle: 'nested'` means
   Firebase serves `<dir>/index.html` for the clean path natively, with no
   dependency on the removed rewrite. Removing the catch-all breaks no real
   route.

2. `scripts/inject-csp-hashes.mjs`: added `promote404()`, called first thing
   in `main()`, before HTML scanning. Copies `dist/404/index.html` to
   `dist/404.html` (byte-identical, verified with `diff` - see Bug 1's
   verification section). If `dist/404/index.html` does not exist, it throws
   a clear, actionable error naming the missing file, the exact route entry
   to add, and pointing at this file's Handoff section, and the build stops
   there with a non-zero exit - it does not silently skip. Running before
   the hash scan means `dist/404.html` is included when CSP hashes are
   computed, with no reliance on the copy happening to produce
   already-scanned content.

I could not add the route in `src/routes.tsx` myself (out of scope for this
pass - see Handoff below), so **`npm run build` currently fails at this
exact step** in the real working tree, with this message:

```
Error: inject-csp-hashes: dist/404/index.html not found - cannot produce dist/404.html for Firebase Hosting's
automatic 404 fallback (see firebase.json, which no longer has a catch-all rewrite to fall back on). This means
src/routes.tsx is missing an enumerable 404 route, e.g.:
    { path: '404', element: <NotFoundPage /> }
added alongside the existing `{ path: '*', element: <NotFoundPage /> }` catch-all (which must stay, for
client-side navigation to unknown paths after hydration). See .dev/website-revamp-r3/BUGFIX-NOTES.md,
"Handoff" section, for the exact change. Until that route lands in src/routes.tsx, this build is expected
to fail here rather than silently ship with no 404 page.
```

This is the correct, intended behavior per the task instructions: fail
loudly rather than silently ship a site with the catch-all rewrite gone and
no 404 fallback file. Once the Handoff item below lands, the build will
proceed automatically - no further change to this script is needed.

### Verification (via isolated scratch build with the handoff applied)

Applied the exact Handoff route addition to an isolated scratch copy of the
tree (not the real `src/routes.tsx`) and ran a real `npm run build`:

```
[vite-react-ssg] Rendering Pages... (18)
...
dist/404/index.html   5.96 KiB
...
[inject-csp-hashes] promoted dist/404/index.html -> dist/404.html for Firebase Hosting's automatic 404 fallback.
```

```
$ diff dist/404.html dist/404/index.html
(no output - IDENTICAL)
```

Served through the real Firebase Hosting emulator and hit a nonexistent URL:

```
$ curl -sI http://127.0.0.1:5000/some-random-nonexistent-path
HTTP/1.1 404 Not Found
Content-Type: text/html; charset=utf-8
Content-Length: 6119
...

$ curl -s http://127.0.0.1:5000/some-random-nonexistent-path | grep -o '<title[^<]*</title>'
<title data-rh="true">Page Not Found · Tejit Pabari</title>
```

A real, unmatched URL now gets a genuine HTTP 404 status with the actual
`NotFoundPage` content (title "Page Not Found · Tejit Pabari"), not a 200
with the home page's content - confirmed against the real emulator, not just
inferred from config.

### Handoff: changes another agent must make

`src/routes.tsx` needs one new route entry, alongside (not replacing) the
existing catch-all. In the `children` array of the `/` route, add:

```tsx
{ path: '404', element: <NotFoundPage /> },
```

placed directly before the existing:

```tsx
{ path: '*', element: <NotFoundPage /> },
```

Both must be present: the new `404` entry is what `getStaticPaths`-style
enumeration (its absence, actually - no `getStaticPaths` needed here, just
a plain static path) makes vite-react-ssg prerender to
`dist/404/index.html`, which `scripts/inject-csp-hashes.mjs`'s `promote404()`
then copies to `dist/404.html` for Firebase's automatic 404 fallback. The
existing `path: '*'` entry must stay unchanged - it is what makes
client-side navigation (after hydration) to any unknown path still render
`NotFoundPage` in the browser without a full page reload.

No other file needs to change for this - `NotFoundPage.tsx` already renders
correctly standalone (it takes no route params and reads `useLocation()` for
its own path), and `scripts/inject-csp-hashes.mjs` already handles the rest
of the pipeline once this lands.

---

## Bug 3: Duplicated site name in the browser tab

**Status: Fixed and verified.**

### What changed

1. `src/components/RouteMeta.tsx`: changed

   ```ts
   const fullTitle = `${title} · ${SITE_NAME}`;
   ```

   to

   ```ts
   const fullTitle = title === SITE_NAME ? title : `${title} · ${SITE_NAME}`;
   ```

   Added a regression test to `src/components/RouteMeta.test.tsx`
   (`'does not duplicate the site name when title already equals SITE_NAME'`)
   that renders `<RouteMeta title="Tejit Pabari" ... />` and asserts
   `document.title === 'Tejit Pabari'` plus the same for `og:title` and
   `twitter:title`.

2. `index.html`: removed the static `<title>Tejit Pabari: Health-Tech
   Builder</title>` and static `<meta name="description" ...>` tags, with an
   explanatory comment left in their place. `RouteMeta`/`Head` already
   supplies both on every prerendered route (this is a fully prerendered
   site, not a client-only SPA shell), so the static tags were purely a
   redundant second `<title>` element on every built page - invalid HTML,
   and the exact defect the diagnosis flagged as making the RouteMeta fix
   alone insufficient if the static tag had ever needed to be depended on.

### Verification

`npm test`: 233/233 tests passed, including the new RouteMeta test.

Real build (isolated scratch build described in Bug 1, which includes both
of the above changes) plus real emulator responses:

```
$ curl -s http://127.0.0.1:5000/ | grep -o '<title[^<]*</title>'
<title data-rh="true">Tejit Pabari</title>

$ curl -s http://127.0.0.1:5000/projects | grep -o '<title[^<]*</title>'
<title data-rh="true">Projects · Tejit Pabari</title>
```

Home page title is exactly "Tejit Pabari" with no duplication; `/projects`
still correctly gets the " · Tejit Pabari" suffix since its title differs
from `SITE_NAME`.

Also confirmed, across all 19 pages in the isolated build's `dist/` (every
real route plus the handoff's `404` route), that each page has **exactly
one** `<title>` element, by counting literal `<title` occurrences per file
programmatically - zero mismatches. Spot-checked a detail page too:

```
$ grep -o '<title[^<]*</title>' dist/projects/juno/index.html
<title data-rh="true">Juno · Tejit Pabari</title>
```

Home = "Tejit Pabari", `/projects` = "Projects · Tejit Pabari",
`/projects/juno` = "Juno · Tejit Pabari" - all correct per spec, and no page
in the built output has zero or more than one title tag, so nothing needed
to be reverted.

---

## Bug 4: Dead Tailwind utility classes

**Status: Fixed and verified.**

### What changed

`tailwind.config.ts`: added to `theme.extend`:

```ts
spacing: {
  '4.5': '1.125rem',
  '6.5': '1.625rem',
},
lineHeight: {
  '6.5': '1.625rem',
},
```

Values follow Tailwind's own `spacing[n] = n * 0.25rem` formula (matching
the adjacent real defaults `3.5 = .875rem`, `5 = 1.25rem`) and the integer
`leading` scale's implicit `0.25rem`-per-half-step convention (matching
`leading-6 = 1.5rem`, `leading-7 = 1.75rem`).

I re-ran the repo-wide grep for decimal-valued utilities myself
(`grep -rnE '\-[0-9]+\.[0-9]+\b' src --include='*.tsx' --include='*.ts'`,
excluding test files) and cross-checked every match against Tailwind 3's
default scales. Found no additional missing values beyond the three the
diagnosis already identified - every other decimal utility in the repo
(`0.5`, `1.5`, `2.5`, `3.5`, including `hover:-translate-y-0.5`) is a real
Tailwind default.

### Verification

Real build (`dist/assets/*.css` from a real `npm run build`):

```
$ grep -o '\.p-3\\.5[^{]*{[^}]*}' dist/assets/*.css     # control - real default
.p-3\.5{padding:.875rem}

$ grep -o '\.p-4\\.5[^{]*{[^}]*}' dist/assets/*.css
.p-4\.5{padding:1.125rem}

$ grep -o '\.leading-6\\.5[^{]*{[^}]*}' dist/assets/*.css
.leading-6\.5{line-height:1.625rem}

$ grep -o '\.sm\\:px-4\\.5[^{]*{[^}]*}' dist/assets/*.css
.sm\:px-4\.5{padding-left:1.125rem;padding-right:1.125rem}
```

All three previously-dead classes (`p-4.5`, `leading-6.5`, `sm:px-4.5`) now
generate real CSS rules with the correct values. The `ContactSection.tsx`
"Connect / Profiles" card will now have real padding below the `sm`
breakpoint instead of `0`.

---

## Finishing up

- `npm run typecheck`: passes clean.
- `npm test`: 233/233 tests passed (42 test files).
- `npm run lint`: passes clean.
- `npm run check:no-em-dash`: passes clean.
- `npm run build`: **fails**, at the documented, expected point (the
  `promote404()` guard in `scripts/inject-csp-hashes.mjs`'s postbuild step),
  because `src/routes.tsx` does not yet have the `404` route from the
  Handoff section above. This is a file I am not permitted to edit, and the
  task instructions explicitly specify this exact fail-loud behavior as
  correct until that handoff lands. Every part of the pipeline before that
  point (prebuild, typecheck, `vite-react-ssg build`, CSP hash writing logic
  itself) has been verified working via the isolated scratch builds
  documented above, which include the same source content as this working
  tree plus only the one-line route addition needed to prove it end-to-end.
- Before the final scratch-build verification pass, a stray, uncommitted
  fixture pair (`src/content/research/__dup-slug-fixture-a__.md` /
  `__dup-slug-fixture-b__.md`) was caught mid-existence by an `rsync` of the
  live tree, from the concurrent agent's own in-progress work, and briefly
  broke a scratch build with an unrelated slug-mismatch error. This was not
  a real bug in the shipped tree (the files were gone from the real working
  tree moments later) and was not touched or reported as a fix - it is
  noted here only as a fact about the mechanics of testing against a
  concurrently-edited tree, resolved by re-copying once the concurrent
  agent's tree was quiescent.

Every commit below only stages files from the owned list, added by explicit
path (never `git add -A` / `git commit -a`), since the concurrent agent's
work lives in the same tree.
