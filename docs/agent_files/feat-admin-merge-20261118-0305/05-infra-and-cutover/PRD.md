---
status: approved
summary: Agent-run infra via firebase-tools/Google REST APIs (Firestore nam5, auth, web app config, API key, App Check/AI Logic, CI IAM), data migration, admin./go. domains + Cloudflare DNS, smoke tests, go. flip, cc. retirement, old repo archive, docs/DEPLOY.md.
date: 2026-11-18
---
# PRD: SP05 infra-and-cutover
Repo/branch: tejitpabari · `feat/admin-merge` · Depends on: SP01-SP04 (Phase A can start after SP01) · Owns: `docs/DEPLOY.md` (runbook, new), `scripts/infra/**` (token + REST helpers, no secrets), real values in `admin/src/lib/firebase-config.js` and `hosting/go/go.js` (`API_KEY`), `migration/cc-content/**` (refresh, later removal), CLAUDE.md "Deploy" section (append only), `/root/projects/README.md` rows (outside repo)

## TL;DR
Turn the code into live sites with agents doing the console work through APIs, owner only where an API can't (Google OAuth client, Gemini provisioning click, VPS export, Cloudflare if no token). Order: infra + config + IAM + rules → data → merge (CI deploys) → smoke on `*.web.app` → custom domains + DNS → smoke on domains → 7-day rollback window → retirement (cc. record, old VPS, old repo archive, content removal, README rows). Old cc-gateway SP06 runbook is the base; deltas below.

## Problem
Nothing for admin/go is provisioned: Firestore API disabled [verified: 403 on `firestore:databases:list`], only one web app `tejitpabari-website` [verified: `apps:list`], sites exist [verified: `hosting:sites:list` shows all 5], no `gcloud` on box [verified]. CI service account can deploy hosting but not rules. `go.` still serves from the old VPS.

## Goals / Non-Goals
- Goals: zero data loss; every step has a verify command; agents use APIs with the owner's firebase-tools login; secrets only under `~/.secrets/` (chmod 600), deleted when done; rollback = DNS-only change.
- Non-goals: code changes in SP01-04 (defects go back there); CSP on admin; Workload Identity Federation; scheduled Firestore backups.

## Requirements
- `docs/DEPLOY.md` covers phases A-G below with commands and verify steps, plus the owner fallback for each agent step.
- No secret, token, or key file in the repo or in logs. Public values (web config, reCAPTCHA site key) are committed / set as repo vars.
- Old VPS + `cc.` record stay untouched until retirement so rollback works.

## Architecture
**Auth for agents** (`scripts/infra/token.mjs`): mints a short-lived OAuth access token from the refresh token firebase-tools stores (`~/.config/configstore/firebase-tools.json`) using firebase-tools' public client id/secret; prints it to stdout for `curl -H "Authorization: Bearer $(…)"` only. For the migration, the same refresh token is written as an `authorized_user` ADC file to `~/.secrets/adc-owner.json` and deleted after. Fallback: owner creates a service-account key at `~/.secrets/tejitpabari-99.json`.

**Phase A — pre-merge infra (agent; must finish before the PR merges, because merge = deploy, SP04)**
| # | Step | How (API / CLI) | Owner fallback |
|---|---|---|---|
| A1 | Snapshot state: sites, custom domains on all 5 sites (incl. `nonprofit.`/`np.`/`healthtech.`/`htech.` from the parallel agent), apps, enabled services | `firebase hosting:sites:list`; `GET firebasehosting v1beta1 …/sites/<site>/customDomains`; `GET serviceusage v1 …/services?filter=state:ENABLED` | — |
| A2 | Enable APIs: firestore, firebaserules, identitytoolkit, firebaseappcheck, recaptchaenterprise, firebasevertexai, generativelanguage, apikeys | `POST serviceusage v1 projects/tejitpabari-99/services:batchEnable` | console |
| A3 | Firestore `(default)`, native, `nam5` (permanent) | `firebase firestore:databases:create "(default)" --location nam5` | console |
| A4 | Auth: Google provider on; authorized domains add `admin.tejitpabari.com`, `tejitpabari-admin.web.app` (keep existing) | Identity Toolkit admin v2: `PATCH config?updateMask=authorizedDomains`; Google IdP needs an OAuth client id/secret — use the auto-created web client if `GET …/defaultSupportedIdpConfigs` / OAuth listing exposes one | Console → Authentication → Sign-in method → Google → Enable (1 click) |
| A5 | Web app `tejitpabari-admin`; fetch config | `firebase apps:create WEB tejitpabari-admin`; `firebase apps:sdkconfig WEB <appId>` → commit into `firebase-config.js` and `go.js` `API_KEY`; `npm run test:go` (drift) | — |
| A6 | Browser API key referrers: ADD `admin.tejitpabari.com/*`, `go.tejitpabari.com/*`, `tejitpabari-admin.web.app/*`, `tejitpabari-go.web.app/*`, `localhost:*/*`; never remove existing entries; API restrictions keep Identity Toolkit, Token Service, Firestore, AI Logic, App Check | `apikeys v2 keys.get/patch` (read first, record before-state in DEPLOY.md) | console |
| A7 | AI Logic + App Check: reCAPTCHA Enterprise score key for `admin.tejitpabari.com` + `tejitpabari-admin.web.app` (no localhost); register on App Check for the admin app; enforce on `firebaseml.googleapis.com` only [RESOLVED: 2026-11-18 — App Check rejects firebasevertexai.googleapis.com ("Service not supported"); AI Logic is covered by firebaseml.googleapis.com; verified by negative test in T9] (NOT Firestore — go. REST has no token); create a debug token (value in `~/.secrets/appcheck-debug-token`); `gh variable set VITE_RECAPTCHA_SITE_KEY` | `recaptchaenterprise v1 keys.create`; `firebaseappcheck v1 apps/<app>/recaptchaEnterpriseConfig` patch, `services/firebaseml.googleapis.com` patch `enforcementMode: ENFORCED`, `apps/<app>/debugTokens` create | Console AI Logic "Get started → Gemini Developer API" (provisions Gemini key — expected owner click); per-user quota → ~10 RPM in GCP console |
| A8 | CI SA roles: `firebaserules.admin`, `datastore.indexAdmin`, `serviceusage.serviceUsageConsumer` (SA found in IAM policy; created by `firebase init hosting:github`) | `cloudresourcemanager v1 getIamPolicy` → add bindings → `setIamPolicy` (etag) | console IAM |
| A9 | Rules + indexes live | `firebase deploy --only firestore --project tejitpabari-99` | — |
| A10 | Gemini smoke: 10-line call with debug token from `dev:admin` (rank 1 throwaway idea) | manual run by agent | — |

**Phase B — data**: B1 owner exports `content/` from the old VPS (other machine; `tar czf`), hands the tarball over; agent diffs vs `migration/cc-content/`, replaces, commits `chore: sync content from production`. B2 soft freeze (no edits on old site). B3 `GOOGLE_APPLICATION_CREDENTIALS=~/.secrets/adc-owner.json npm run migrate -- --dry-run`, then `-- --yes`; expect `OK ideas N/N, links M/M, settings 1/1`. Never rerun after DNS flip without `--force-overwrite` intent.

**Phase C — deploy + smoke on web.app**: owner squash-merges the PR (rebased onto main after PR #5); CI deploys all targets + rules. Smoke (old SP06 Phase E table, items 1-12) on `tejitpabari-admin.web.app` and `tejitpabari-go.web.app/<slug>`, plus: `curl -sI` admin `/ideas/<slug>` → `cache-control: no-cache`, an `/assets/*.js` → `public, max-age=31536000, immutable`; main site `/` and `/assets/*` unchanged; `grep -rn "127.0.0.1:9099\|127.0.0.1:8080" dist-admin` → 0; `go.js` `API_KEY` == `firebase-config.js` `apiKey`; 3-idea re-rank comparison (mean abs diff ≤ 1.0); nonprofit/healthtech still 200.

**Phase D — domains + DNS**: D1 Hosting REST `POST …/sites/tejitpabari-admin/customDomains?customDomainId=admin.tejitpabari.com` and same for `go.` on `tejitpabari-go`; read `requiredDnsUpdates`. D2 Cloudflare: if `~/.secrets/cloudflare-dns.token` exists (owner-created, Zone:DNS:Edit on tejitpabari.com), agent records current `go`/`cc` records into DEPLOY.md, adds TXT/ACME records, creates `admin` A and flips `go` A to Firebase values, DNS-only (grey), TTL 300, removes stale `go` AAAA; else prints the exact record table for the owner. D3 wait for cert (`GET customDomains` `cert.state`), verify `dig +short @1.1.1.1`, `curl -sI https://admin.tejitpabari.com`, `openssl s_client` issuer/dates. D4 re-run smoke on custom domains; owner checks GA4 realtime `go_click`.

**Phase F — rollback** (unchanged from old SP06): restore recorded `go` A values (orange, Flexible), delete `admin` record; window 7 days; Firestore edits during window re-entered manually.

**Phase G — retirement (after 7 clean days)**: delete `cc` record (token or owner); owner stops old VPS pm2 + cancels VPS; stop `cc-gateway` pm2 on this box if present (none running today [verified: `pm2 jlist` empty]); delete `~/.secrets/adc-owner.json` / SA key; `git rm -r migration/cc-content` (`chore: remove migrated content`); `gh repo archive tejitpabari99/tejitpabari-gateway --yes` (gh has ADMIN [verified]); update `/root/projects/README.md`: `tejitpabari` row (React/Vite site + admin + go + nonprofit + healthtech targets, Firestore), `cc-gateway` row → "merged into tejitpabari (admin./go.); repo archived", `linkedin-outreach-tool` row (no longer behind cc-gateway — flag); owner OK then remove `/root/projects/cc-gateway`.

## Decisions
| # | Decision | Choice | Alternatives considered | Why |
|---|---|---|---|---|
| 1 | Agent credentials | Owner OAuth via firebase-tools refresh token (short-lived access tokens; ADC file for migration) | Long-lived SA key | No gcloud; nothing durable to leak (owner O6) |
| 2 | Order | infra → rules → data → merge/deploy → web.app smoke → DNS | Hosting first | Never serve UI against missing rules/data (old D2) |
| 3 | Staging | live `*.web.app` before DNS | preview channels | Channel hosts not authorized (old D3) |
| 4 | Firestore location | `nam5` | other | Old D4 |
| 5 | Cloudflare | Grey cloud, TTL 300; token path or owner manual | Proxied | Old D5; owner O6 |
| 6 | App Check on Firestore | Not enforced | Enforced | go. REST tokenless (old D6) |
| 7 | Rollback window | 7 days | — | Old D7 |
| 8 | New web app | `tejitpabari-admin` | reuse `tejitpabari-website` | D11: separate App Check registration |
| 9 | Old repo | `gh repo archive` by agent at retirement | owner | gh has ADMIN |
| 10 | Runbook | `docs/DEPLOY.md` | agent_files only | Outlives branch |

## Manual steps
Owner-only: B1 VPS export; merge the PR; Cloudflare token creation (or manual records); REQUIRED Google provider click (API failed) and Gemini billing/prepay credits (https://ai.studio/projects) plus AI Logic setup and ~10 RPM per-user quota confirmation (console ailogic page); GA4 realtime check; old VPS shutdown/billing; merge the retirement PR (Phase G); OK to delete `/root/projects/cc-gateway`.

## Risks / Open Questions
- [RESOLVED: try API, owner click fallback] Google IdP needs an OAuth client; APIs can't mint one generally.
- [RESOLVED: verify A1] Whether the parallel agent finished nonprofit/np/healthtech/htech domains + DNS; A1 records state, D2 completes missing records.
- [RESOLVED: add-only] Browser API key may be shared with `tejitpabari-website` app; site uses no Firebase JS [verified: grep], so referrers only gain entries.
- [RESOLVED: owner supplies export; Phase B blocks only data, not A] Old VPS is another machine.
- [RESOLVED: refresh token never written to repo or logs; helper prints access token only] Token helper safety.
- Risk: cert provisioning hours; start D1 a day before flip.
- Risk: go. changes from 301 to JS redirect (accepted in old brief).
- [DEFERRED] Scheduled Firestore export; WIF for CI.

## Acceptance Criteria
- `docs/DEPLOY.md` exists with phases A-G, before-state of API key and DNS records, owner fallbacks.
- `firebase firestore:databases:list` shows `(default)` in `nam5`; rules release present; CI merge deploy green.
- Firestore counts equal export counts; migrate printed `OK`.
- `curl -sI https://admin.tejitpabari.com` 200 over valid cert; `https://go.tejitpabari.com/<slug>` 200 page that redirects; cache headers as specified; no CSP violations on go.; nonprofit/healthtech 200, np./htech. redirect.
- After day 7: `cc` record gone, `tejitpabari-gateway` archived, `migration/cc-content/` removed, secrets files deleted, `/root/projects/README.md` rows updated.
