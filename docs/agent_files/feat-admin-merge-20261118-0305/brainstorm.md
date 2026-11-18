---
status: approved
summary: Merge cc-gateway into the personal-website repo — one package, one firebase.json with 5 hosting targets + Firestore; admin rewritten as a React CSR app; reviewed framework-agnostic cc-gateway work ported as-is.
date: 2026-11-18
---

# cc-gateway → tejitpabari repo merge — Brief + decision log

Status `approved`: every decision below is owner-made (2026-11-18) or an orchestrator default the owner delegated. No interview round was run; nothing is open.

## TL;DR

The cc-gateway Firebase rewrite (branch `feat/firebase-static`, HEAD `2d95cfe`) stops being its own repo. Everything moves into `tejitpabari99/tejitpabari`: one `package.json`, one root `firebase.json`/`.firebaserc` with hosting targets `main`, `admin`, `go`, `nonprofit`, `healthtech` plus Firestore rules. The admin UI is rewritten in React (same stack as the site) as a second Vite build into `dist-admin/`. Framework-agnostic, already-reviewed code (rules + tests, migration script + tests, go. page + tests, data-layer modules + tests, schema doc, content) is copied over, not rewritten. CI deploys every target + rules from this one repo.

## Problem

Two repos, two Firebase configs (`/firebase.json` and PR #5's `subdomains/firebase.json`), and a Svelte admin app in a React shop. Owner wants a single place that controls every `*.tejitpabari.com` deploy, one stack, one CI.

## Current state (verified 2026-11-18)

| Area | Fact | Evidence |
|---|---|---|
| Site | `vite-react-ssg` 0.9, React 19, Vite 8, Tailwind 3, TS ~6, vitest 4, react-router-dom 6 | `package.json` |
| Site Firebase | single-object `hosting` (`public: dist`), CSP with sha256 list, `**/assets/**` immutable, `**/index.html` no-cache, 11 `/live` redirects | `firebase.json` |
| Build mutates firebase.json | `vite.config.ts` `liveRedirectsPlugin.closeBundle` writes `config.hosting.redirects`; `scripts/inject-csp-hashes.mjs` reads/writes `config.hosting.headers` | both assume `hosting` is an object — breaks on array |
| PR #5 | `subdomains/firebase.json` (array, targets nonprofit/healthtech), `subdomains/.firebaserc`, `src/config/subdomains.test.ts` reads them | branch `feat/nav-subdomains` `c47d3c6` |
| Site CI | Node 20; `ci.yml` (npm test + lint, `contents: read`, pinned SHAs); merge/PR workflows use `FirebaseExtended/action-hosting-deploy@500ac62…` with `FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99`, no `target` | `.github/workflows/*` |
| Site lint scope | `check:no-em-dash` walks `src/**/*.tsx`; `check:no-forms` scans `src/pages/live` | scripts |
| Site Firebase JS | none (`grep firebase src` → 0 imports) | grep |
| Hosting sites | `tejitpabari-99`, `-admin`, `-go`, `-nonprofit`, `-healthtech` all exist | `firebase hosting:sites:list` |
| Web apps | only `tejitpabari-website` (1:869772411310:web:ce89…) | `firebase apps:list WEB` |
| Firestore | API not enabled on project (403) | `firebase firestore:databases:list` |
| Box | Node 22.23.3, OpenJDK 21, firebase-tools 15.36.0 (in cc-gateway node_modules), no `gcloud`; `gh` has ADMIN on `tejitpabari-gateway` | commands |
| Content | 61 ideas, links.json, settings.json; already public in `tejitpabari-gateway` (public repo); guestVisibility all `true` | `gh repo view`, `content/settings.json` |

## Decision log

### Owner decisions (2026-11-18)

| # | Decision | Rejected | Why |
|---|---|---|---|
| O1 | One repo, one `package.json`, one root `firebase.json`/`.firebaserc`; targets `main`→`tejitpabari-99`, `admin`→`tejitpabari-admin`, `go`→`tejitpabari-go`, `nonprofit`→`tejitpabari-nonprofit`, `healthtech`→`tejitpabari-healthtech`; PR #5 `subdomains/` config folded in | Separate cc-gateway repo; separate `subdomains/` config | Owner controls all subdomain deploys from one place |
| O2 | Admin rewritten in React + Vite + Tailwind + TS + vitest, CSR SPA, separate Vite entry → own output dir; share site tokens/components; SvelteKit UI dropped; main site behavior and CSP-hash postbuild unchanged and main-only | Keep SvelteKit; SSG admin | One stack |
| O3 | Port (copy) reviewed framework-agnostic work from `feat/firebase-static@2d95cfe`: rules+indexes+rules tests, migrate script+lib+tests, go/ + tests + headers/CSP, `src/lib/{slug,config,firebase-config,firebase,ideas,links,settings,access,ai}.js` + tests, `docs/firestore-schema.md`, `content/`. Svelte-store `auth.js`/`session.js`/`layout-load.js`/`SignInGate` → React equivalents | Rewrite everything | Already reviewed; keep risk low |
| O4 | All prior cc-gateway decisions hold (project `tejitpabari-99`, Spark, no Functions, Google sign-in, admin `tejitpabari99@gmail.com` + drift test, guest gating by `settings/main.guestVisibility`, multi-segment link slugs `juno/pitch-deck`→`juno~pitch-deck`, idea slugs `[a-z0-9-]+` with `rank` reserved, go. static JS redirect + GA4 `G-9NLS3NG63M` `go_click` 1500 ms cap, caching rules, `VITE_USE_EMULATORS`, Gemini via AI Logic + App Check, LinkedIn removed, no cc. redirect, firebase `^12`) | — | Settled earlier |
| O5 | History: fresh copy; old repo `tejitpabari-gateway` archived at cutover; `/root/projects/cc-gateway` stays until cutover verified | Subtree merge with history | Old repo keeps history |
| O6 | Infra by agents via CLI/API where possible (firebase-tools logged in as owner; Hosting REST for domains); Cloudflare DNS: owner gives a Zone:DNS:Edit token (stored outside repo) or adds records manually | Owner does console work | Less owner toil |
| O7 | CI/CD from this repo: on merge deploy all hosting targets + `firestore:rules`; PR previews at least for `main` and `admin`; pinned SHAs, least-privilege `permissions` | Manual deploys (old SP06 D9) | One pipeline |

### Orchestrator defaults (delegated; each re-stated in the owning PRD's Decisions)

| # | Decision | Choice | Why |
|---|---|---|---|
| D1 | Ported modules language | Stay JS (ESM + JSDoc), consumed from TS via `allowJs` (`checkJs: false`); new React code is TS | Reviewed code and its `node --test` suites run unchanged; site tsconfig is non-strict so JS imports type-infer fine; conversion is a later, separate change |
| D2 | Admin location | `admin/` at repo root (`admin/index.html`, `admin/src/**`), `vite.admin.config.ts` (root `admin`, outDir `dist-admin`, `envDir` repo root) | Keeps admin out of `src/` so site lint guards, vitest, tailwind content and vite-react-ssg are untouched |
| D3 | Static hosting dirs | `hosting/go/`, `hosting/nonprofit/`, `hosting/healthtech/` | Owner-suggested; one obvious place for non-built sites |
| D4 | Migration source data | `migration/cc-content/` (ideas/, links.json, settings.json); deleted after cutover | Avoids confusion with site `src/content/`; already public |
| D5 | Test runners | Emulator + pure-JS suites keep `node --test` under `tests/`; React + `import.meta.env` code tests in vitest (admin config) | Port, not rewrite; vitest owns DOM |
| D6 | Node version | 22 everywhere (`.nvmrc`, CI) | Matches box; firebase-tools 15 + `node --test` glob form |
| D7 | Merge deploy | firebase-tools CLI from lockfile, one `firebase deploy --only hosting,firestore` | One command covers 5 targets + rules + indexes; action can't deploy rules |
| D8 | PR previews | Keep pinned `action-hosting-deploy`, two steps `target: main` and `target: admin` | Comments preview URLs; matches existing pattern |
| D9 | Admin look | Site palette/fonts via Tailwind preset; old dark/light toggle dropped | Site has no dark tokens; owner asked to share tokens |
| D10 | Admin CSP | Still DEFERRED (old SP01 D8 holds); React CSR makes it feasible later | Prior decision not changed by owner |
| D11 | Web app | Register a new web app `tejitpabari-admin` (not reuse `tejitpabari-website`) | Separate App Check registration and config |
| D12 | Migration credentials | Owner OAuth via an `authorized_user` ADC file built from firebase-tools' login (outside repo, deleted after); fallback: owner-created SA key | No `gcloud` on box; avoids long-lived key |

## Non-goals

SSR/SSG for admin; Cloud Functions/Blaze; admin CSP; TS conversion of ported modules; redesigning admin UX beyond palette; keeping cc. alive; history-preserving merge.

## Open risks

| Risk | Cheapest test |
|---|---|
| Build scripts rewrite `firebase.json` and assume object `hosting` | SP01 tests: scripts target only the `main` entry; other entries byte-identical |
| PR #5 not yet merged; this branch stacks on it | Rebase onto `origin/main` after #5 squash-merge (owner memory rule) |
| Google provider needs an OAuth client the API can't create | Try API; fall back to owner console click |
| Emulator literals (`127.0.0.1:9099`) leak into prod build | CI grep of `dist-admin/` (SP04) |
| App Check enforcement on AI Logic mandatory since 2026-11-02 | Configure before admin cutover (SP05) |
