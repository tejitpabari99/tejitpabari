---
status: approved
summary: One package.json and one root firebase.json (5 hosting targets + Firestore), static sites under hosting/, ported rules/migration/go/data-layer code and tests, main site build unchanged.
date: 2026-11-18
---
# PRD: SP01 repo-merge-foundation
Repo/branch: tejitpabari · `feat/admin-merge` (stacked on `feat/nav-subdomains`) · Depends on: none · Owns: `package.json`, `package-lock.json`, `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, `.gitignore`, `.nvmrc`, `vite.config.ts` (test excludes + main-entry selection), `vite.config.test.ts`, `scripts/inject-csp-hashes.mjs` (+ new test), `scripts/migrate-to-firestore.js`, `scripts/lib/migrate-transform.js`, `hosting/**`, `migration/cc-content/**`, `admin/src/lib/{slug,config,firebase-config,firebase,ideas,links,settings,access,ai}.js`, `tests/**`, `docs/firestore-schema.md`, `src/config/subdomains.test.ts` (rewritten as `src/config/hosting.test.ts`); deletes `subdomains/`

## TL;DR
Lay the shared ground: merged deps/scripts, a root `firebase.json` with an array of 5 hosting targets + Firestore + emulators, PR #5's static pages and the go. page under `hosting/`, and every framework-agnostic cc-gateway file copied with its tests green. Fix the two build scripts that write `firebase.json` so they touch only the `main` entry. The main site's `dist/` and its `firebase.json` entry must come out identical.

## Problem
`hosting` is an object today and two build steps mutate it in place [verified: `vite.config.ts` `config.hosting.redirects = …`; `scripts/inject-csp-hashes.mjs` `config.hosting?.headers?.find(…)`]. Turning it into an array breaks both. The reviewed cc-gateway code lives in another repo with its own `package.json`/`firebase.json`. PR #5 added a second Firebase config in `subdomains/`.

## Goals / Non-Goals
- Goals: one config deploys all 5 sites + rules; ported suites pass here unchanged except paths; main build byte-identical; vitest `npm test` still only sees site tests.
- Non-goals: React admin UI and React auth (SP02), App Check/Gemini (SP03), workflows (SP04), real web config values, console/DNS (SP05).

## Requirements
- `npm run build` (main) behaves exactly as today: same `dist/`, same CSP hash set, same redirects, now written into the `target: "main"` entry.
- `firebase deploy --only hosting:nonprofit,hosting:healthtech` from repo root replaces `cd subdomains && firebase deploy`.
- Ported suites run from root: `npm run test:rules`, `test:migrate`, `test:data`, `test:go`, `test:node`, and `test:emulator` (all emulator suites in one `emulators:exec`).
- `npm test` (vitest) does not collect `tests/**`, `admin/**`, `hosting/**`, `migration/**`.

## Architecture
**Layout after SP01**
| Path | Content | Source |
|---|---|---|
| `firebase.json` | `hosting: [main, admin, go, nonprofit, healthtech]`, `firestore`, `emulators` | merged |
| `hosting/go/` | `index.html`, `go.js`, `go-core.js`, `go.css` | cc-gateway `go/` |
| `hosting/nonprofit/`, `hosting/healthtech/` | `index.html`, `style.css` | PR #5 `subdomains/*` (git mv) |
| `admin/src/lib/*.js` | slug, config, firebase-config, firebase, ideas, links, settings, access, ai (stub) | cc-gateway `src/lib` (not auth/session/layout-load/SignInGate/page-loaders/anthropic) |
| `scripts/migrate-to-firestore.js`, `scripts/lib/migrate-transform.js` | migration, `DEFAULT_CONTENT_DIR` → `migration/cc-content` | cc-gateway `scripts/` |
| `migration/cc-content/` | 61 ideas, links.json, settings.json | cc-gateway `content/` |
| `tests/{rules,migrate,go,data,unit}/` | node:test suites; `tests/data` = old `tests/spa` (helpers + `__setDb` pattern) | cc-gateway `tests/` |
| `docs/firestore-schema.md` | schema (path refs updated) | cc-gateway |

**firebase.json targets** (all keep the baseline nosniff / Referrer-Policy / HSTS block)
| Target | `public` | Rewrites | Cache / CSP |
|---|---|---|---|
| `main` | `dist` | none (cleanUrls, trailingSlash false, `/live` redirects) | exactly today's object + `"target":"main"` |
| `admin` | `dist-admin` | `**`→`/index.html` | `**` no-cache, then `/assets/**` immutable LAST (later same-key wins; header `source` matches request path) — Vite emits `assets/`, not `_app/immutable/` |
| `go` | `hosting/go` | `**`→`/index.html` | unchanged from cc-gateway (no-cache, noindex, strict CSP) |
| `nonprofit`, `healthtech` | `hosting/<name>` | `**`→`/index.html` | unchanged from PR #5 |
`firestore: {rules, indexes}`; `emulators: {auth 9099, firestore 8080, hosting 5000, ui off}`. `.firebaserc` `targets.tejitpabari-99.hosting` maps all five.

**Build-script fix**: both writers locate `config.hosting.find(h => h.target === 'main')` and throw a clear error if absent; never touch other entries. The JSON is still rewritten with `JSON.stringify(…, 2)`, so the committed file is stored in that format to keep diffs stable. `normalize-ssg-build-id.mjs` mentions firebase.json only in comments [verified: grep] — unchanged.

**package.json**: add deps `firebase ^12.19.0`; devDeps `firebase-tools ^15.36.0`, `@firebase/rules-unit-testing ^5.0.2`, `firebase-admin ^13.10.0` (gray-matter already a dep). No Svelte/adapter/Anthropic/dotenv. Scripts (prefix `--project tejitpabari-99` everywhere): `emulators`, `test:rules`, `test:migrate`, `test:data` (`--test-concurrency=1`), `test:go`, `test:node` (`node --test tests/unit/*.test.js`), `test:emulator`, `migrate`, `deploy:static` (`firebase deploy --only hosting:go,hosting:nonprofit,hosting:healthtech`). Glob form `tests/x/*.test.js` (Node 22).

**Path edits in ported tests only**: firebase.json readers select by target and use new `public` values; drift test imports `admin/src/lib/config.js`; go-guards reads `admin/src/lib/firebase-config.js` and `hosting/go/`; migrate tests read `migration/cc-content`. `tests/unit/hosting-headers.test.js` asserts the admin `/assets/**` rule instead of `_app/immutable/**`, and adds `main` checks (index.html no-cache, `**/assets/**` immutable). `tests/unit/firebase-init.test.js` and `auth.test.js`/`session.test.js`/`layout-load.test.js` are not ported here (SP02 re-creates React-era equivalents).

## Decisions
| # | Decision | Choice | Alternatives considered | Why |
|---|---|---|---|---|
| 1 | Ported module language | JS kept (D1) | Convert to TS now | Zero-change port; node:test runs JS natively |
| 2 | Where data-layer files live | `admin/src/lib/` | Root `src/lib/` (site), `packages/` | Outside site `src/` so `check:no-em-dash`, tailwind content, vitest and tsconfig.app stay untouched |
| 3 | Static sites dir | `hosting/<target>/` | keep `subdomains/` | Owner-suggested; one place |
| 4 | Content dir | `migration/cc-content/` | root `content/` | Unambiguous vs `src/content/`; removed post-cutover |
| 5 | Main entry selection | by `target === 'main'` | by index 0; by `public === 'dist'` | Explicit, order-independent |
| 6 | Test runner split | node:test for `tests/**`, vitest for site + admin UI | All vitest | Port, not rewrite |
| 7 | Subdomain config test | Rewrite PR #5 `subdomains.test.ts` as `src/config/hosting.test.ts` reading root config, all 5 targets + `.firebaserc` map | Delete it | Keeps the safety net |
| 8 | Node | `.nvmrc` = 22 | stay 20 | firebase-tools 15, box parity (CI switch in SP04) |
| 9 | Composite indexes | none (`indexes: []`) | — | Carried from cc-gateway SP01 |

## Manual steps
None (JDK 21 already on box [verified: `java -version`]).

## Risks / Open Questions
- [RESOLVED: target-based lookup + tests] Build writers on an array `hosting`.
- [RESOLVED: emulator suites need JDK; box has OpenJDK 21] CI JDK is SP04.
- [RESOLVED: placeholders stay] `firebase-config.js`/`go.js` keep `PLACEHOLDER_API_KEY` until SP05 fills them; go-guards drift test keeps them equal.
- [RESOLVED: stacked branch] After PR #5 squash-merges, rebase `feat/admin-merge` onto `origin/main`; the `git mv subdomains/* hosting/*` may need re-applying.
- [RESOLVED: test counts per cc-gateway handoff — rules 58, migrate 68, go 28 — not re-run during planning] SP01 re-runs them; counts must match minus none.
- [DEFERRED] Removing `migration/cc-content/` (SP05 retirement).

## Acceptance Criteria
- Baseline captured before changes: `npm run build` on the branch base; after SP01, `diff -r` of `dist/` = empty and the `main` entry equals the old top-level `hosting` object plus `target`.
- New vitest test proves `inject-csp-hashes` and the live-redirects write only the `main` entry (fixture with 5 entries; others deep-equal before/after) and throw when `main` is missing.
- `npm test`, `npm run lint`, `npm run typecheck` green; vitest file list contains nothing under `tests/`, `admin/`, `hosting/`, `migration/`.
- `npm run test:emulator` green with rules 58, migrate 68, go 28 tests plus data and unit suites.
- `subdomains/` absent; `src/config/hosting.test.ts` green; `firebase emulators:start --only hosting` serves `nonprofit` and `go` (`/anything` → index.html).
