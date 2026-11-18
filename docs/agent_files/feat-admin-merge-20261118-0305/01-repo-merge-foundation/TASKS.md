---
status: approved
summary: 7 tasks — baseline, merged deps/config, build-script main-entry fix, static sites move, port rules/data layer, port migration, port go.
date: 2026-11-18
---
# Tasks: SP01 repo-merge-foundation
Source of truth: /root/projects/tejitpabari/.worktrees/feat/admin-merge/docs/agent_files/feat-admin-merge-20261118-0305/01-repo-merge-foundation/PRD.md. Port source: /root/projects/cc-gateway/.worktrees/feat/firebase-static at commit `2d95cfe` (use `git show 2d95cfe:<path>`; ignore that worktree's uncommitted Svelte edits). Main site must stay byte-identical.

| # | Task | Depends on | Status |
|---|---|---|---|
| 1 | Main-build baseline + firebase.json writer fix | none | done |
| 2 | Merged package.json, root firebase.json/.firebaserc, ignores | 1 | done |
| 3 | Move static sites to hosting/ + hosting config test | 2 | done |
| 4 | Port rules, indexes, schema doc, data-layer modules + tests | 2 | done |
| 5 | Port migration script, content, tests | 4 | done |
| 6 | Port go. page + tests | 3, 4 | done |
| 7 | Foundation verification pass | 1-6 | done |

## Task 1 — Main-build baseline + firebase.json writer fix
What it is: protect the main site before anything else changes (PRD Decision 5).
What changes at a high level: run `npm run build` on the untouched branch, save `dist/` and `firebase.json` to a scratch location outside the repo. Change the live-redirects plugin in `vite.config.ts` and `scripts/inject-csp-hashes.mjs` (both main and its verify step) to find the hosting entry with `target: "main"`, throwing a named error when missing; tolerate the current object form only until Task 2 converts it (or convert both in one commit).
Done when: new vitest test (e.g. `scripts/inject-csp-hashes.test.ts`, plus a case in `vite.config.test.ts`) with a 5-entry fixture proves only `main` changes and a missing `main` throws; existing `vite.config.test.ts` green.

## Task 2 — Merged package.json, root firebase.json/.firebaserc, ignores
What it is: one package, one Firebase config (PRD Architecture tables).
What changes at a high level: add `firebase`, `firebase-tools`, `@firebase/rules-unit-testing`, `firebase-admin` and the scripts listed in the PRD; `.nvmrc` 22. Rewrite `firebase.json` as `hosting` array (main = old object + `target`; admin, go, nonprofit, healthtech per PRD table) plus `firestore` and `emulators`; `.firebaserc` gains the 5-target map. `.gitignore` adds `dist-admin/`; eslint `globalIgnores` adds `dist-admin`. Root vitest `test.exclude` adds `tests/**`, `admin/**`, `hosting/**`, `migration/**`.
Done when: `npm ci` clean; `npm test`, lint, typecheck green; `npm run build` then `diff -r` vs Task 1 baseline is empty and the main entry deep-equals the baseline object plus `target`.

## Task 3 — Move static sites to hosting/ + hosting config test
What it is: fold PR #5's separate config into the root (owner decision O1).
What changes at a high level: `git mv` `subdomains/nonprofit` and `subdomains/healthtech` to `hosting/`; delete `subdomains/firebase.json`, `.firebaserc`, `README.md` (fold its owner notes into the SP02 CLAUDE.md task's input; keep text in commit message). Replace `src/config/subdomains.test.ts` with `src/config/hosting.test.ts` reading the root config: `.firebaserc` maps all 5 targets; nonprofit/healthtech entries keep public dir, rewrite, baseline headers, CSP; files exist.
Done when: `hosting.test.ts` green; `subdomains/` gone; `firebase emulators:start --only hosting` serves nonprofit `/x` as its index.

## Task 4 — Port rules, indexes, schema doc, data-layer modules + tests
What it is: copy reviewed Firestore pieces (owner decision O3, PRD layout).
What changes at a high level: copy `firestore.rules`, `firestore.indexes.json`, `docs/firestore-schema.md` (path refs updated), the nine `src/lib` modules into `admin/src/lib/`, `tests/rules`, `tests/spa` → `tests/data`, and the pure `tests/unit` files (slug, access, ai stub, hosting-headers). Update only import paths and the hosting-headers assertions (admin `/assets/**` immutable last; main index/assets checks). Do not port auth.js, session.js, layout-load.js, SignInGate, page-loaders, anthropic.js or their tests.
Done when: `npm run test:rules` (58 incl. email drift test), `test:data`, and `test:node` pass.

## Task 5 — Port migration script, content, tests
What it is: one-time importer and its source data (PRD Decision 4).
What changes at a high level: copy `scripts/migrate-to-firestore.js`, `scripts/lib/migrate-transform.js`, `tests/migrate`, and `content/` → `migration/cc-content/`; default content dir points there. Script stays node-only, outside vitest and the site's lint guards.
Done when: `npm run test:migrate` passes 68 tests; `npm run migrate -- --dry-run` against the emulator prints 61 ideas / 8 links / 1 settings (or current counts).

## Task 6 — Port go. page + tests
What it is: static go. redirector into `hosting/go/` (owner decision O4).
What changes at a high level: copy `go/*` to `hosting/go/` and `tests/go`; update test paths to `hosting/go/`, root `firebase.json` go entry, and `admin/src/lib/firebase-config.js` for the API-key drift check. GA id, 1500 ms cap, CSP and noindex unchanged.
Done when: `npm run test:go` passes 28 tests.

## Task 7 — Foundation verification pass
What it is: prove the merge left the site untouched and all suites run from root.
What changes at a high level: no new code; fix only regressions found. Run `npm test`, lint, typecheck, `npm run build` + baseline diff, `npm run test:emulator`, `test:node`.
Done when: all green, `dist/` diff empty, counts recorded in the code artifact.

## Owner-only steps
None.
