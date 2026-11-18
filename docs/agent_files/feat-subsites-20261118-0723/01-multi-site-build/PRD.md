---
status: approved
summary: One SITE switch builds main, healthtech and nonprofit from the same code into dist/, dist-healthtech/, dist-nonprofit/, each with its own routes, nav, footer, SEO files and CSP, built and deployed by CI. Main output stays unchanged.
date: 2026-11-18
---
# PRD: SP01 multi-site-build
Repo/branch: tejitpabari · `feat/subsites` (stacked on `feat/admin-merge`) · Depends on: none · Owns: `vite.config.ts` (+ test), `package.json` scripts, `src/main.tsx`, `src/routes.tsx` (+ `src/routes/*`, smoke test), `src/config/{site.ts,sites.json,site-target.ts,links.ts}`, `src/layout/*`, `src/components/RouteMeta.tsx` (site URL only), `scripts/{generate-og-cards,generate-sitemap,inject-csp-hashes,normalize-ssg-build-id}.mjs` (+ tests), `scripts/check-*`, `firebase.json` (nonprofit/healthtech entries), `.github/workflows/*`, `.gitignore`, `eslint.config.js`, `src/config/hosting.test.ts`, `CLAUDE.md`, `README.md`, `docs/DEPLOY.md`; deletes `hosting/healthtech/`, `hosting/nonprofit/`

## TL;DR
Add `SITE=main|healthtech|nonprofit`. It picks the route table, nav, footer, meta base URL, SEO files, outDir and which `firebase.json` target the postbuild scripts touch. Subsite pages are placeholders here (03 and 04 fill them). CI builds all three plus admin; merge deploys them all.

## Problem
The two subdomains serve static coming-soon pages from `hosting/` with noindex [verified: `hosting/nonprofit/index.html:7`]. Everything the real sites need is hardcoded to main: `routes.tsx` is one table, `NAV_LINKS`/`FOOTER_LINKS` are single arrays [verified: `src/config/links.ts`], `SITE_URL` is a constant [verified: `src/config/site.ts:2`, `scripts/generate-sitemap.mjs:5`], and the build scripts read `dist/` and write the `main` entry of `firebase.json` [verified: `inject-csp-hashes.mjs:8,69`, `normalize-ssg-build-id.mjs:7`, `vite.config.ts` live-redirects]. Prebuild writes into the shared `public/` (gitignored), which is copied into every dist.

## Goals / Non-Goals
- Goals: three builds from one codebase; subsites indexable with sitemap, robots, OG and a working CSP; main site's route set and behavior unchanged; CI and previews cover all three.
- Non-goals: page content (03, 04), `sites:` schema and project cards (02), Sparehand links (05), per-site legal pages, a Vite multi-site refactor of admin.

## Requirements
- `npm run build` is main, unchanged. New: `build:healthtech`, `build:nonprofit`, `dev:healthtech`, `dev:nonprofit`. `build:all` = main, healthtech, nonprofit, admin, strictly sequential.
- Subsite routes: `/`, `projects/:slug` (no `/live`), `404`, `*`; nonprofit adds `/projects`, `/schedule`. No research, work-experience, privacy, terms routes.
- Nav: per-site links; subsites show a top-right "Website" button to `https://tejitpabari.com`, same tab, visible at mobile width. Footer: Privacy and Terms absolute to main, GitHub, LinkedIn, obfuscated email (`contact.ts`/`useContactMailto`), techfolio credit; no Research or Résumé. GA and consent banner reused unchanged via `PageShell`.
- Per-site `<title>`, description, canonical, default OG image, `sitemap.xml`, `robots.txt` (Allow, Sitemap line, no noindex).
- Postbuild writes only its own `firebase.json` target; live-redirects only for main (the `liveRedirectsPlugin` in `vite.config.ts` rewrites `firebase.json` every build, so it is registered only when `SITE=main`; subsite builds never touch the main entry).
- nonprofit CSP = main's plus `connect-src https://docs.google.com https://*.googleusercontent.com`; healthtech CSP = main's. No `X-Robots-Tag`/noindex. np./htech. behavior untouched (domain-level, not in `firebase.json`).

## Architecture
**Seam: current site.** `src/config/sites.json` is the single source of per-site data (`id`, `url`, `name`, `description`, `outDir`, `target`, `hasLiveRoutes`, `staticRoutes`). Scripts read it with `readFileSync`; TS imports it (needs `resolveJsonModule` in tsconfig.app/node). `src/config/site-target.ts` exports `SITE` (from `import.meta.env.VITE_SITE`, default `main`) and `SITE_CONFIG`. `vite.config.ts` reads `process.env.SITE`, validates it, sets `process.env.VITE_SITE` (so SSR and client agree), `build.outDir`, and registers live-redirects only for main. `site.ts` `SITE_URL`/`SITE_NAME`/`DEFAULT_DESCRIPTION` derive from `SITE_CONFIG`; main values are identical strings.

**Seam: routes.** `src/routes.tsx` keeps exporting `routes` (smoke test and `main.tsx` import path unchanged) and picks from `src/routes/{main,healthtech,nonprofit}.tsx` via a static `import.meta.env.VITE_SITE` ternary so Rollup tree-shakes research/legal pages out of subsite bundles. It also exports `routesBySite` for tests. 01 adds placeholder pages `src/pages/healthtech/HealthtechHomePage.tsx`, `src/pages/nonprofit/{NonprofitHomePage,NonprofitProjectsPage,SchedulePage}.tsx` (title only); 03 and 04 replace their bodies without touching routes.

**Seam: project filter.** 02 owns and exports from `@/data`: `SITE_IDS`, `SiteId` and `projectsForSite(site: SiteId): Project[]` (newest first, ties by title). 01 imports `SiteId` from `@/data` and defines no site-id type of its own; a test asserts the `sites.json` keys equal `SITE_IDS`. Route `getStaticPaths` use `projectsForSite(SITE).map((p) => p.slug)`. Both SPs have no dependency, so if 01 lands first it ships a temporary shim in `src/data` with the exact `projectsForSite` and `SiteId`/`SITE_IDS` signatures (returns all projects) that 02 replaces; if 02 lands first there is no shim. `generate-sitemap.mjs` and `generate-og-cards.mjs` parse `sites:` from frontmatter themselves (missing = `['main']`), the duplicated-by-design pattern they use today.

**Layout.** `Nav.tsx` and `Footer.tsx` read `NAV_LINKS_BY_SITE[SITE]` / `FOOTER_LINKS_BY_SITE[SITE]` and render the Website button when `SITE !== 'main'`; Nav's scroll-spy list is built from the active site's links. `LinksRow` hides its synthetic internal `/projects/<slug>/live` button when `!hasLiveRoutes` [verified: injected by `LinkButtons.tsx`/`LinksRow.tsx`]; detail pages still show `links[]`.

**Scripts.** All four take the site from `process.env.SITE` (default main) and use `dist` or `dist-<site>`. Prebuild first deletes `public/og`, `public/sitemap.xml`, `public/robots.txt`, then regenerates for the site, so a subsite never ships main's cards (public/ is copied into each dist). Sitemap: `staticRoutes` per site plus that site's project slugs; `/live` paths only for main. OG: default card titled with the site name, per-project cards only for that site's projects. `inject-csp-hashes` finds `target === SITE_CONFIG.target`, hashes inline scripts in `dist-<site>` only, promotes `404/index.html` to `404.html` there.

**firebase.json concurrency/idempotence.** Each writer reads, edits one entry, rewrites the whole file with `JSON.stringify(...,2)`. Builds therefore must never run in parallel (CI and `build:all` are serial; documented). Each run overwrites only its entry's hash set, so reruns converge and entries do not affect each other. Committed `firebase.json` holds the last generated hash sets for all three (as main does today), so local builds produce diffs on that file; same rule as today.

**firebase.json entries.** nonprofit/healthtech: `public` -> `dist-nonprofit`/`dist-healthtech`; drop the `**`->`/index.html` rewrite (prerendered routes plus `404.html`, like main; `cleanUrls` kept); headers copied from main (nosniff, Referrer-Policy, HSTS, CSP script-src seeded with GTM then hash-injected, `**/assets/**` immutable, `**/index.html` no-cache).

**CI.** `ci.yml` unit job: `build:all` already used, so it picks up the new builds; add a per-site smoke run and the main-route-set test. Merge workflow: `build:all` unchanged in form; its final `firebase deploy --only hosting,firestore` deploys all targets. PR workflow: add two `action-hosting-deploy` steps (`target: nonprofit`, `target: healthtech`) after main and admin, same fork guard, so each target gets its own channel URL. Removed: `hosting/{nonprofit,healthtech}`; `deploy:static` -> `hosting:go` only; mentions in `CLAUDE.md:42,48`, `README.md:31`, `docs/DEPLOY.md`; `src/config/hosting.test.ts` assertions that read `hosting/<name>/index.html` [verified: grep above, only hits besides `package.json:41` and `firebase.json:209,243`]; `.gitignore` and `eslint.config.js` ignore `dist-*`.

**Tests.** `routes.smoke.test.tsx` parametrized per site over its path list (and asserts removed paths 404 on subsites). A "main unchanged" test compares the main table's concrete static paths (`getStaticPaths` expanded) to a committed manifest captured from the pre-change tree in task 1. Per-site tests for scripts (sitemap contents, CSP entry targeting, no cross-target write) and `hosting.test.ts` for the new `public`/CSP values. `check:launch` extended to also scan `dist-*` if it enumerates dist [RESOLVED: builder verifies during implementation - extend check:launch to scan dist-*].

## Decisions
| # | Decision | Choice | Alternatives considered | Why |
|---|---|---|---|---|
| 1 | Site data source | `src/config/sites.json` read by TS and scripts | Duplicate constants in .mjs; TS-only | One edit point, scripts cannot import `@/` |
| 2 | Route registry | Static ternary in `src/routes.tsx`, per-site files | Runtime `SITE` switch in one table | Tree-shakes main-only pages; `routes` import path unchanged |
| 3 | Filter seam owner | 02 owns `projectsForSite`, `SiteId`, `SITE_IDS`; 01 shim only if it lands first | 01 owns it | Schema lives in 02 files |
| 4 | Shared `public/` | Wipe generated files at each prebuild | Per-site publicDir | Smallest change, main untouched |
| 5 | firebase.json writes | Keep in-place edits, serial builds | Generated per-site firebase config; separate hash file | Keeps proven mechanism and CI deploy as is |
| 6 | Subsite rewrites | None (prerendered + 404.html) | SPA `**` rewrite | Matches main, proper 404 status |
| 7 | `/live` on subsites | Not routed; synthetic button hidden | Route it | Brief: no `/live`; no redirects written |
| 8 | Main equivalence | Route-set manifest test plus CSP hash diff check | Byte-identical hashes | Bundler graph changes may rename assets |
| 9 | Env syntax | `SITE=x npm run ...` in scripts | cross-env | Linux dev and CI only |

## Manual steps (owner)
- Domains nonprofit/np/healthtech/htech already pending in DEPLOY.md (Cloudflare DNS-only, cert). No new owner step for this SP.
- After first deploy, owner confirms the three sites in Search Console if wanted.

## Risks / Open Questions
- [RESOLVED: builder verifies during implementation - expected unchanged] Main CSP hash set may change if SSR inline scripts differ after the routes refactor; verify against baseline in task 1 (expected unchanged).
- [RESOLVED: builder verifies during implementation - reads `build.outDir`; verify manifest location] vite-react-ssg temp output (`ssgOut`) placement with a custom `outDir`: read from `build.outDir` in its source [verified: `vite-react-ssg ... outDir = config.build.outDir`], but confirm `.vite/manifest.json` lands in `dist-<site>/` for `normalize-ssg-build-id`.
- [RESOLVED: builder verifies during implementation - works as designed; confirm in preview] Preview channels: nonprofit previews fetch the sheet from a `*.web.app` origin; CSP allows it, CORS is `*`; confirm in preview.
- [RESOLVED: builder verifies during implementation - extend `check:launch` to scan `dist-*`] Whether `check-no-forms.sh` / em-dash scan read built output or only `src`; extend if needed.
- [RESOLVED: serial builds] Parallel `build:all` would race on `firebase.json`.
- [RESOLVED: grep] Only `package.json:41`, `firebase.json:209,243`, README, CLAUDE.md, DEPLOY.md and `hosting.test.ts` reference the deleted dirs.
- [DEFERRED] Cross-domain GA linking; per-site GA properties.
- [DEFERRED] Moving hashes out of `firebase.json` to stop diff churn.

## Acceptance Criteria
- `SITE` unset or `main`: `dist/` route set equals the committed manifest; `routes.smoke` and all existing tests pass; live redirects still written to the main entry.
- `build:healthtech` and `build:nonprofit` produce `dist-<site>/` with prerendered `/`, project pages, `404.html`, `sitemap.xml`, `robots.txt` (no noindex), site-specific OG default; nonprofit also `/projects`, `/schedule`; no research/privacy/terms/`/live` output.
- Each subsite shows the Website button (mobile too) linking same-tab to `https://tejitpabari.com`, and the specified footer.
- After `build:all`, each `firebase.json` target has hashes matching only its own dist; non-target entries unchanged; second run produces no diff.
- nonprofit CSP contains docs.google.com and `*.googleusercontent.com` in `connect-src`; no entry has noindex.
- CI `build:all` green; PR workflow deploys four channels; `hosting/{nonprofit,healthtech}` gone; `deploy:static` is go only; docs updated.
