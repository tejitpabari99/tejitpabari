---
status: approved
summary: One CI/CD pipeline for all targets — Node 22, unit + emulator (JDK) test jobs, merge deploys all 5 hosting targets + Firestore rules/indexes via firebase-tools CLI, PR previews for main and admin.
date: 2026-11-18
---
# PRD: SP04 ci-cd
Repo/branch: tejitpabari · `feat/admin-merge` · Depends on: SP01 (scripts, firebase.json), SP02 (`build:all`, `test:admin`), SP03 (recaptcha var) · Owns: `.github/workflows/ci.yml`, `.github/workflows/firebase-hosting-merge.yml`, `.github/workflows/firebase-hosting-pull-request.yml`, `scripts/check-admin-build.mjs` (+ test), `package.json` (`check:admin-build` script only), CLAUDE.md "CI/CD" section (append only)

## TL;DR
Keep the three existing workflows and their style (pinned action SHAs, explicit least-privilege `permissions`, fork guard, GA var guard). Switch to Node 22. `ci.yml` gains an emulator job with a pinned JDK and becomes reusable. The merge workflow runs CI first, builds main + admin, then one `firebase deploy --only hosting,firestore` with the existing service account. PR previews deploy `main` and `admin` channels.

## Problem
Today CI runs vitest + lint on Node 20 [verified: `ci.yml`]; deploys use `action-hosting-deploy` with no `target` [verified: merge/PR workflows], which only covers single-site hosting and cannot deploy Firestore rules. After SP01 the config has 5 targets + rules, and emulator suites need Java.

## Goals / Non-Goals
- Goals: every merge to `main` deploys all 5 sites + rules + indexes only after all tests pass; PRs get `main` and `admin` previews; no secret ever written to the repo or logs; workflows stay pinned and least-privilege.
- Non-goals: IAM changes (SP05 does them via API), custom domains, preview channels for go/nonprofit/healthtech, Workload Identity Federation (DEFERRED).

## Requirements
- PR and push: unit job (typecheck, lint, `npm test`, `test:admin`, `test:node`, `build:all`, `check:admin-build`) and emulator job (`test:emulator`: rules, migrate, data, go) both required.
- Merge: deploy job `needs` CI; keeps `check:no-forms`, `check:launch`, `VITE_GA_MEASUREMENT_ID` guard; adds `VITE_RECAPTCHA_SITE_KEY` guard (fail loudly if empty, same style).
- PR from same repo: preview channels for `main` and `admin`, URLs commented; fork PRs skip deploy silently (existing guard).
- `VITE_USE_EMULATORS` never set in any workflow.

## Architecture
| Workflow | Trigger | Jobs / key steps | permissions |
|---|---|---|---|
| `ci.yml` | push main, pull_request, `workflow_call` | `unit`: checkout, setup-node (`node-version-file: .nvmrc`, npm cache), `npm ci`, typecheck, lint, test, test:admin, test:node, build:all, check:admin-build. `emulator`: + `actions/setup-java` (temurin 21, pinned SHA), `actions/cache` (pinned) on `~/.cache/firebase/emulators` keyed by firebase-tools version, `npm run test:emulator` | `contents: read` |
| `firebase-hosting-merge.yml` | push main | `ci` = `uses: ./.github/workflows/ci.yml`; `deploy` (`needs: ci`): checks + var guards, `npm run build:all` with `VITE_GA_MEASUREMENT_ID`, `VITE_RECAPTCHA_SITE_KEY` from `vars`; write `secrets.FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99` to `$RUNNER_TEMP/sa.json` (umask 077, via env var, never echoed); `GOOGLE_APPLICATION_CREDENTIALS` → `npx firebase deploy --only hosting,firestore --project tejitpabari-99 --non-interactive --message "$GITHUB_SHA"`; `if: always()` step deletes the file | `contents: read` |
| `firebase-hosting-pull-request.yml` | pull_request | checks, `build:all` (GA var unguarded as today), two `action-hosting-deploy@500ac62…` steps with `target: main` and `target: admin`, `expires: 7d`, fork guard on both | `contents: read`, `pull-requests: write`, `checks: write` (unchanged) |

`concurrency` blocks kept. `firebase-tools` comes from the lockfile (devDependency from SP01), not a floating install. Build rewrites `firebase.json` (CSP hashes, main entry) before deploy — same as today's action flow.

**check-admin-build**: node script failing if `dist-admin/` contains `127.0.0.1`, `localhost:9099`, `localhost:8080`, or `FIREBASE_APPCHECK_DEBUG_TOKEN` assignment, or if `dist-admin/index.html` is missing.

**Service-account IAM needed** (SP05 grants; documented here): existing deploys prove Hosting Admin. Add `roles/firebaserules.admin` (rules release), `roles/datastore.indexAdmin` (indexes), `roles/serviceusage.serviceUsageConsumer` (firebase-tools API checks). APIs (`firestore`, `firebaserules`) must already be enabled (SP05) so the SA never needs Service Usage Admin.

**Repo variables** (public values, set with `gh variable set`): `VITE_GA_MEASUREMENT_ID` (exists), `VITE_RECAPTCHA_SITE_KEY` (new, value from SP05).

## Decisions
| # | Decision | Choice | Alternatives considered | Why |
|---|---|---|---|---|
| 1 | Merge deploy tool | firebase-tools CLI, one command for hosting + firestore | action per target + separate rules step | Action can't deploy rules; one command keeps all targets in sync |
| 2 | PR previews | pinned action, `target: main` and `target: admin` | CLI `hosting:channel:deploy` | Keeps PR comment with URLs; existing pattern |
| 3 | Test gating for deploy | Reusable `ci.yml` via `workflow_call` + `needs` | Duplicate test steps | One definition |
| 4 | Node | 22 via `.nvmrc` | 20 | firebase-tools 15; box parity; `node --test` globs |
| 5 | JDK | temurin 21 via pinned `setup-java` | ubuntu image default Java | Explicit, matches box |
| 6 | Credentials | Existing JSON key secret, temp file, deleted | Workload Identity Federation | No new GCP setup now; WIF DEFERRED |
| 7 | Preview scope | main + admin only | all 5 | Owner minimum; static sites trivial |
| 8 | Admin previews auth | Guest-mode only (channel hosts not authorized for Google sign-in or reCAPTCHA) | Add each channel host | Hosts change per PR |

## Manual steps
None (repo variable set by agent with `gh`; IAM by SP05 via API).

## Risks / Open Questions
- [RESOLVED: merge = deploy] First merge of this branch deploys admin/go/rules to `*.web.app` and rules to the project; SP05 Phase A (Firestore DB, real web config, IAM) must finish before the PR merges. `go.tejitpabari.com` keeps pointing at the old VPS until the SP05 DNS flip, so no user impact.
- [RESOLVED: action `target` input supports multi-site configs] Verified at implementation against the pinned action's `action.yml`; fall back to CLI channel deploy if not.
- [RESOLVED: pinned SHAs] New actions (`setup-java`, `cache`) pinned to full commit SHAs with version comments, resolved via `gh api repos/<owner>/<repo>/git/ref/tags/<tag>`.
- [DEFERRED] Workload Identity Federation; previews for static targets.

## Acceptance Criteria
- All workflow files parse (js-yaml) and every `uses:` is a 40-char SHA with a version comment; every job has explicit `permissions`.
- `check:admin-build` test: fixture with `127.0.0.1:9099` fails, clean fixture passes.
- On the shipped PR: `unit` and `emulator` jobs green; two preview comments (main, admin) with working URLs.
- After merge (verified in SP05): deploy job green; `firebase hosting:channel:list --site tejitpabari-admin` shows a live release at the merge SHA; rules release time updated.
- No step echoes the secret; `sa.json` removed in an `always()` step.
