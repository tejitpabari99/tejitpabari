---
status: draft
summary: Ten tasks to add the SITE switch (main, healthtech, nonprofit) to build, routes, layout, scripts, firebase.json and CI.
date: 2026-11-18
---
# Tasks: SP01 multi-site-build
Source of truth: docs/agent_files/feat-subsites-20261118-0723/01-multi-site-build/PRD.md. One `SITE` env value picks routes, nav, footer, SEO files, outDir and firebase.json target. Main output stays unchanged; subsite pages are placeholders (03 and 04 fill them). Builds are always serial because every writer rewrites `firebase.json`.

| # | Task | Depends on | Status |
|---|---|---|---|
| 1 | Capture main baseline | none | todo |
| 2 | Site config and Vite SITE switch | 1 | todo |
| 3 | Per-site route tables and placeholder pages | 2 | todo |
| 4 | Per-site nav, footer, meta URL | 2 | todo |
| 5 | Site-aware build scripts | 2 | todo |
| 6 | firebase.json entries and static dir removal | 5 | todo |
| 7 | Extend check:launch to dist-* | 5 | todo |
| 8 | CI and PR preview for all targets | 6, 7 | todo |
| 9 | Docs, ignores and cleanup | 6, 8 | todo |
| 10 | End-to-end build:all verification | 3, 4, 8, 9 | todo |

## Task 1: Capture main baseline
What it is / what it means: Before any refactor, record what main produces today so "main unchanged" is provable (Decision 8, resolved CSP risk).
What changes at a high level: Build main on the untouched tree. Commit a manifest of concrete static paths (getStaticPaths expanded) and note the main CSP hash set and where `.vite/manifest.json` and the SSG temp output land. Add the manifest-comparison test, passing against current code.
Done when: manifest file is committed; a "main route set unchanged" test passes and fails if a path is added or removed; baseline CSP hashes are noted in the commit for later diffing.

## Task 2: Site config and Vite SITE switch
What it is / what it means: The single seam for "current site" (Decisions 1, 3, 9). `sites.json` holds per-site data; `site-target.ts` exposes `SITE` and `SITE_CONFIG`.
What changes at a high level: Add `sites.json` and `site-target.ts`, enable JSON imports in the tsconfigs. `vite.config.ts` reads and validates `process.env.SITE`, sets `VITE_SITE`, sets `build.outDir`, and registers live redirects only for main. `site.ts` derives URL, name, description from config (main strings identical). Add the new npm scripts with `SITE=x` syntax; `build:all` is sequential. Import `SiteId` from `@/data`; add the temporary shim only if 02 has not landed.
Done when: vite config test covers valid, invalid and default SITE, outDir, and no live-redirect plugin on subsites; a test asserts `sites.json` keys equal `SITE_IDS`; Task 1 manifest test still passes.

## Task 3: Per-site route tables and placeholder pages
What it is / what it means: Each site gets its own route set (Decision 2) with tree-shaking of main-only pages.
What changes at a high level: Split into `routes/{main,healthtech,nonprofit}.tsx`. `routes.tsx` keeps exporting `routes` via a static `import.meta.env.VITE_SITE` ternary and adds `routesBySite`. Subsites get `/`, `projects/:slug` (no `/live`), `404`, `*`; nonprofit adds `/projects`, `/schedule`. Static paths use `projectsForSite(SITE)`. Add title-only placeholder pages.
Done when: `routes.smoke.test.tsx` runs per site over its path list and asserts research, work-experience, privacy, terms and `/live` are not routed on subsites; main manifest test passes.

## Task 4: Per-site nav, footer, meta URL
What it is / what it means: Layout follows the active site (Decision 7, Requirements).
What changes at a high level: `NAV_LINKS_BY_SITE` and `FOOTER_LINKS_BY_SITE` in `links.ts`; Nav builds scroll-spy from the active links and shows a top-right "Website" button (same tab, to https://tejitpabari.com, visible at mobile width) when `SITE !== 'main'`. Footer on subsites: absolute Privacy and Terms to main, GitHub, LinkedIn, obfuscated email, credit; no Research or Resume. `LinksRow` hides the synthetic `/live` button when `!hasLiveRoutes`. `RouteMeta` uses the site URL.
Done when: component tests per site cover link sets, Website button href and target, mobile visibility, footer contents, hidden live button, and canonical base URL; main renders as before.

## Task 5: Site-aware build scripts
What it is / what it means: All postbuild and prebuild scripts target the active site only (Decisions 4, 5, Scripts section).
What changes at a high level: Sitemap, OG, CSP hash injection and build-id normalization read `process.env.SITE` and `sites.json`, using `dist` or `dist-<site>`. Prebuild first deletes `public/og`, `public/sitemap.xml`, `public/robots.txt`. Sitemap uses site `staticRoutes` plus that site's slugs (`/live` only for main); robots has Allow and a Sitemap line, no noindex; OG default card carries the site name and per-project cards cover only that site. CSP injection edits only the matching target and promotes `404.html` in that dist. Confirm the `.vite/manifest.json` location with custom outDir.
Done when: script tests cover sitemap contents per site, robots content, OG scope, CSP writes only its own target (other entries byte-unchanged), and a second run produces no diff.

## Task 6: firebase.json entries and static dir removal
What it is / what it means: nonprofit and healthtech become built targets (Decisions 6, Requirements CSP).
What changes at a high level: Point `public` at `dist-nonprofit` and `dist-healthtech`, drop the `**` rewrite, copy main's headers (nosniff, Referrer-Policy, HSTS, GTM-seeded CSP, immutable assets, no-cache index). nonprofit `connect-src` adds `https://docs.google.com` and `https://*.googleusercontent.com`. Delete `hosting/healthtech` and `hosting/nonprofit`; `deploy:static` becomes `hosting:go` only.
Done when: `hosting.test.ts` asserts new `public` values, CSP values, no rewrite, no noindex or `X-Robots-Tag`, and no longer reads deleted index.html files; `test:go` still passes.

## Task 7: Extend check:launch to dist-*
What it is / what it means: Launch checks must also cover subsite output (resolved risk on `check-no-forms.sh` and em-dash scan).
What changes at a high level: Verify what `scripts/check-*` scan; where they enumerate dist, include every `dist-*` site directory (excluding admin as today).
Done when: a test or fixture run shows a violation planted in a `dist-<site>` dir is caught and a clean run passes.

## Task 8: CI and PR preview for all targets
What it is / what it means: CI builds and deploys all targets (CI section).
What changes at a high level: `ci.yml` unit job keeps `build:all`, adds a per-site smoke run and the main-route-set test. Merge workflow keeps `build:all` and the single deploy. PR workflow adds `action-hosting-deploy` steps for nonprofit and healthtech after main and admin, with the same fork guard. Builds stay serial.
Done when: workflow YAML lints and is validated by a workflow test or `actionlint`; a PR run shows four preview channels and green `build:all`.

## Task 9: Docs, ignores and cleanup
What it is / what it means: Remove stale references and ignore new outputs.
What changes at a high level: Update `CLAUDE.md` (lines about static subdomains and deploy), `README.md`, `docs/DEPLOY.md` (SITE builds, serial rule, firebase.json diff churn). Add `dist-*` to `.gitignore` and `eslint.config.js`.
Done when: grep finds no reference to `hosting/nonprofit` or `hosting/healthtech`; lint passes and does not scan `dist-*`; git ignores `dist-*`.

## Task 10: End-to-end build:all verification
What it is / what it means: Prove the acceptance criteria on the real build.
What changes at a high level: Run `build:all` serially and inspect outputs; fix gaps found. No new scope.
Done when: main route set matches the manifest and CSP hash diff is explained; `dist-healthtech` and `dist-nonprofit` contain prerendered pages, `404.html`, sitemap, robots and no research, privacy, terms or `/live`; each firebase.json target matches only its own dist; a second `build:all` yields no diff; all existing and new tests pass.

## Manual steps (owner)
- Domains for nonprofit, np, healthtech, htech are already pending in DEPLOY.md (Cloudflare DNS-only, cert). No new owner step.
- After first deploy, optionally confirm the three sites in Search Console.
