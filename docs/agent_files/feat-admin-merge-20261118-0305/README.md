---
status: approved
summary: Plan index — merge cc-gateway into the site repo (5 hosting targets + Firestore from one config, React admin app, one CI/CD).
date: 2026-11-18
---
# feat/admin-merge — cc-gateway merged into tejitpabari

Brief + decision log: [brainstorm.md](brainstorm.md). Branch `feat/admin-merge`, stacked on `feat/nav-subdomains` (PR #5). Supersedes the cc-gateway plan at `/root/projects/cc-gateway/.worktrees/feat/firebase-static/docs/agent_files/feat-firebase-static-20261026-1647/` (its SP01/02/04 code is ported; its SP03 Svelte UI is dropped; SP05 → our 03; SP06 → our 05).

## Sub-projects

| # | Sub-project | Phase | Depends on | Tasks | Docs |
|---|---|---|---|---|---|
| 01 | repo-merge-foundation — one package.json, root firebase.json/.firebaserc (main/admin/go/nonprofit/healthtech + firestore), `hosting/`, ported rules/migrate/go/data layer + tests, main build byte-identical | 1 | — | 7 | [PRD](01-repo-merge-foundation/PRD.md) · [TASKS](01-repo-merge-foundation/TASKS.md) |
| 02 | admin-react-app — React CSR admin in `admin/` → `dist-admin/`, auth context, gate, pages, CLAUDE.md | 2 | 01 | 9 | [PRD](02-admin-react-app/PRD.md) · [TASKS](02-admin-react-app/TASKS.md) |
| 03 | ai-rank-gemini — `ai.js` via Firebase AI Logic + App Check (old SP05) | 3 | 01, 02 | 5 | [PRD](03-ai-rank-gemini/PRD.md) · [TASKS](03-ai-rank-gemini/TASKS.md) |
| 04 | ci-cd — Node 22, unit + emulator jobs, merge deploys all targets + firestore, PR previews main/admin | 3 | 01, 02 (03 for recaptcha guard) | 5 | [PRD](04-ci-cd/PRD.md) · [TASKS](04-ci-cd/TASKS.md) |
| 05 | infra-and-cutover — API/CLI infra, migration, domains, DNS, smoke, retirement, `docs/DEPLOY.md` | 2 (T1-9) / 4 (T10-14) | 01 (T1-9); all + PR merge (T10+) | 14 | [PRD](05-infra-and-cutover/PRD.md) · [TASKS](05-infra-and-cutover/TASKS.md) |

```
01 ─┬─> 02 ─┬─> 03 ─┐
    │       └─> 04 ─┼─> [PR merge = deploy] ─> 05 T10-14
    └─> 05 T1-9 ────┘        (05 T1-9 must finish before merge)
```
Parallel (cap 2): 02 ∥ 05 T1-9 after 01; then 03 ∥ 04.

## Locked decisions

Owner, 2026-11-18 (full rows in brainstorm.md O1-O7):
1. One repo, one `package.json`, one root `firebase.json`/`.firebaserc`; targets `main`→`tejitpabari-99`, `admin`→`tejitpabari-admin`, `go`→`tejitpabari-go`, `nonprofit`→`tejitpabari-nonprofit` (np. redirects), `healthtech`→`tejitpabari-healthtech` (htech. redirects); PR #5 `subdomains/` folded into root, static pages under `hosting/`.
2. Admin rewritten in React + Vite + Tailwind + TS + vitest, CSR, separate Vite build → `dist-admin/`; SvelteKit dropped; main site and its CSP-hash postbuild unchanged and main-only.
3. Port (copy) reviewed framework-agnostic work from cc-gateway `feat/firebase-static@2d95cfe`; Svelte-store glue becomes React auth context/gate/guard.
4. All prior cc-gateway decisions hold (Spark, no Functions, Google sign-in, admin `tejitpabari99@gmail.com` + drift test, guest gating via `settings/main.guestVisibility`, slug rules, go. JS redirect + GA4 `go_click` 1500 ms, caching, `VITE_USE_EMULATORS`, Gemini via AI Logic + App Check, no LinkedIn, no cc. redirect, firebase `^12`).
5. Fresh port; archive `tejitpabari-gateway` at cutover; local cc-gateway stays until verified.
6. Infra by agents via CLI/API; Cloudflare via owner token or owner manual.
7. CI/CD from this repo: merge deploys all hosting targets + rules; PR previews ≥ main + admin; pinned SHAs, least-privilege permissions.

Orchestrator defaults (brainstorm.md D1-D12): ported modules stay JS (`allowJs`), new code TS; admin in `admin/` with `vite.admin.config.ts`; `hosting/<target>/`; `migration/cc-content/`; node:test for ported suites, vitest for UI; Node 22; merge deploy via firebase-tools CLI, previews via pinned action with `target`; site palette, no dark mode; admin CSP still deferred; new web app `tejitpabari-admin`; migration via owner OAuth ADC.

## Shared-file ownership

| File | Owner | Others may |
|---|---|---|
| `package.json` / lockfile | 01 | 02 admin deps + `dev:admin`/`build:admin`/`build:all`/`test:admin`; 04 `check:admin-build` |
| `firebase.json`, `.firebaserc` | 01 | build scripts rewrite only the `main` entry at build time |
| `vite.config.ts`, `scripts/inject-csp-hashes.mjs` | 01 | — |
| `admin/src/lib/firebase.js` | 01 (port) | 02 emulator guard; 03 App Check marker |
| `admin/src/lib/ai.js` | 01 (stub) | 03 implements |
| `admin/src/lib/firebase-config.js`, `hosting/go/go.js` `API_KEY` | 01 (placeholders) | 05 T5 real values |
| `admin/src/lib/auth-core.js` | 02 | 03 reads `currentRole()` |
| `.github/workflows/*` | 04 | — |
| `CLAUDE.md` | 02 (creates) | 03 AI, 04 CI/CD, 05 Deploy sections, append only |
| `docs/DEPLOY.md`, `scripts/infra/**` | 05 | — |
| `migration/cc-content/**` | 01 | 05 refresh + removal |
| `.env.example` | site | 03 adds two admin vars |

## Cross-cutting risks

- **Build scripts mutate `firebase.json` assuming object `hosting`** (`vite.config.ts` live-redirects, `inject-csp-hashes.mjs`) — 01 T1 fixes before the array conversion.
- **Merge = deploy.** First merge deploys admin/go/rules; 05 T1-9 (Firestore DB, real config, IAM, recaptcha var) must be done before the owner merges, or the deploy job fails / admin ships broken.
- **Stacked on PR #5.** After #5 squash-merges, rebase onto `origin/main` (owner memory rule); the `subdomains/` → `hosting/` move may need redoing.
- **Single PR spans all sub-projects**: between 01 and 04 the old PR-preview workflow would deploy every target and fail on missing `dist-admin/`; don't push until 04 is done (dev-ship at the end).
- **Emulator literals in prod**: 02 inlines the flag check; 04 `check:admin-build` greps `dist-admin/`.
- **App Check on AI Logic mandatory since 2026-11-02**: 05 T7 before admin use.
- **Google provider / Gemini provisioning may need owner clicks** (no API to mint OAuth client) — logged as owner fallbacks.
- **Content is public** (already public in `tejitpabari-gateway`); removed after cutover.
- No `[OPEN]` items in any PRD.

## Owner-only (collected)

VPS `content/` export; squash-merge the PR; Cloudflare token or manual DNS; Google provider / AI Logic / quota clicks only if APIs fail; GA4 realtime check; VPS shutdown; OK to delete `/root/projects/cc-gateway`.

## Not verified during planning

- Ported test counts (rules 58, migrate 68, go 28) taken from the cc-gateway handoff, not re-run here.
- Whether `nonprofit.`/`np.`/`healthtech.`/`htech.` custom domains finished (parallel agent) — 05 T2.
- CI service-account name and current roles (no IAM read done) — 05 T8.
- `action-hosting-deploy@500ac62` `target` input behavior with this config — 04 T4.
- Whether Identity Toolkit API can enable the Google provider without a console-created OAuth client — 05 T4.
