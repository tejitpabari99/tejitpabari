---
status: approved
summary: 14 tasks — runbook + token helper, state snapshot, APIs/Firestore, auth, web app config, API key, App Check/AI Logic, CI IAM, rules, data migration, smoke on web.app, domains+DNS, post-flip smoke, retirement.
date: 2026-11-18
---
# Tasks: SP05 infra-and-cutover
Source of truth: /root/projects/tejitpabari/.worktrees/feat/admin-merge/docs/agent_files/feat-admin-merge-20261118-0305/05-infra-and-cutover/PRD.md (base: old SP06 PRD at /root/projects/cc-gateway/.worktrees/feat/firebase-static/docs/agent_files/feat-firebase-static-20261026-1647/06-deploy-cutover/PRD.md). Tasks 1-9 run before the PR merges; 10+ follow. Every task records what it did and its verify output in `docs/DEPLOY.md`. Secrets only in `~/.secrets/` (chmod 600), never printed.

| # | Task | Depends on | Status |
|---|---|---|---|
| 1 | DEPLOY.md skeleton + token helper | SP01 | done |
| 2 | State snapshot (sites, domains, apps, services) | 1 | done |
| 3 | Enable APIs + create Firestore nam5 | 2 | done |
| 4 | Auth: authorized domains + Google provider | 3 | blocked (owner: enable Google provider) |
| 5 | Web app + real config committed | 3 | done |
| 6 | Browser API key referrers (add-only) | 5 | done |
| 7 | reCAPTCHA key, App Check, AI Logic, debug token, repo var | 5, SP03 | done (owner: AI Logic Get started + quota) |
| 8 | CI service-account IAM roles | 3 | done |
| 9 | Rules + indexes deploy, Gemini smoke | 3, 4 (or emulator-auth path), 7, SP01 | done |
| 10 | Data export sync + migration run | 9 | todo |
| 11 | Post-merge smoke on *.web.app | 10, SP04, PR merged | todo |
| 12 | Custom domains admin./go. + Cloudflare DNS | 11 | todo |
| 13 | Post-flip smoke on custom domains | 12 | todo |
| 14 | Retirement (day 7+) | 13 | todo |

## Task 1 — DEPLOY.md skeleton + token helper
What it is: the runbook and the agents' API credential path (PRD Decision 1, 10).
What changes at a high level: `docs/DEPLOY.md` with phases A-G and fallbacks; `scripts/infra/token.mjs` that mints an access token from the firebase-tools login and prints only the token; option to write the `authorized_user` ADC file to `~/.secrets/`. CLAUDE.md gets a Deploy section linking the runbook.
Done when: node:test in `tests/unit` proves the helper fails cleanly with no login file and never prints the refresh token (fixture); `curl` with the token to `serviceusage …/services` returns 200.

## Task 2 — State snapshot
What it is: know what the parallel agent already did (PRD A1).
What changes at a high level: list sites, each site's custom domains (status, required DNS), web apps, enabled services; record in DEPLOY.md.
Done when: snapshot table in DEPLOY.md, incl. nonprofit/np/healthtech/htech domain states.

## Task 3 — Enable APIs + create Firestore nam5
What it is: PRD A2-A3.
What changes at a high level: batch-enable the eight APIs; create `(default)` Firestore in `nam5`, native mode.
Done when: `firebase firestore:databases:list` shows `(default)` / `nam5`; services list includes all eight.

## Task 4 — Auth: authorized domains + Google provider
What it is: PRD A4.
What changes at a high level: add authorized domains via Identity Toolkit admin API (keep existing); enable Google IdP via API if an OAuth client is available, else record the one-click owner step.
Done when: `GET config` lists the domains; Google IdP `enabled: true` (or owner step logged as pending).

## Task 5 — Web app + real config committed
What it is: PRD A5.
What changes at a high level: create web app `tejitpabari-admin`, fetch SDK config, replace placeholders in `admin/src/lib/firebase-config.js` and `hosting/go/go.js` `API_KEY`; commit `chore: real Firebase web config`.
Done when: `npm run test:go` (API key drift) and `test:admin` green; no `PLACEHOLDER` left.

## Task 6 — Browser API key referrers (add-only)
What it is: PRD A6.
What changes at a high level: read the key used in the config, record before-state, patch referrer list adding admin/go hosts and localhost; keep API restrictions as listed.
Done when: `GET` after patch is a superset of before; go. REST lookup from `tejitpabari-go.web.app` origin works (checked in Task 11).

## Task 7 — reCAPTCHA key, App Check, AI Logic, debug token, repo var
What it is: PRD A7.
What changes at a high level: create reCAPTCHA Enterprise key (admin domains), register with App Check, enforce on AI Logic only, create a debug token (stored in `~/.secrets/`), set repo var `VITE_RECAPTCHA_SITE_KEY`; Gemini Developer API provisioning and per-user quota via API if possible, else owner step logged.
Done when: App Check service config shows AI Logic `ENFORCED`, Firestore not enforced; `gh variable list` has the site key.

## Task 8 — CI service-account IAM roles
What it is: PRD A8, required by SP04 merge deploy.
What changes at a high level: find the GitHub-actions SA in the project IAM policy; add the three roles with etag-safe set.
Done when: policy shows the bindings; `firebase deploy --only firestore:rules --dry-run` with that SA would be authorized (verified on first CI run, Task 11).

## Task 9 — Rules + indexes deploy, Gemini smoke
What it is: PRD A9-A10.
What changes at a high level: `firebase deploy --only firestore`; run `dev:admin` with the debug token and rank one throwaway idea against live Gemini.
Done when: rules release visible; anon read of `ideas` without `settings/main` is denied (curl REST); one rank returns valid scores (admin role via real Google sign-in once T4 is unblocked, or auth emulator + real AI Logic + debug token); a generateContent call with no/invalid App Check token is rejected (401/403), proving `firebaseml.googleapis.com` enforcement covers AI Logic.

## Task 10 — Data export sync + migration run
What it is: PRD Phase B.
What changes at a high level: after the owner hands over the VPS tarball, extract it to a scratch dir and run `npm run migrate -- --content-dir <extracted dir>` (dry-run, then `--yes`) with the owner ADC file; no commit to main (a content refresh, if desired, goes in the retirement PR); delete the ADC file afterwards if Task 14 won't need it.
Done when: migrate prints `OK ideas N/N, links M/M, settings 1/1` matching export counts.

## Task 11 — Post-merge smoke on *.web.app
What it is: PRD Phase C (after owner merges; CI deploys).
What changes at a high level: run the smoke list (owner sign-in, CRUD, rank and re-rank rows are gated on the owner steps: Google provider enabled and Gemini billing/prepay credits; mark them blocked-on-owner until done; the rest runs regardless): auth as owner, guest read-only, toggle test, CRUD, rank, go. live/missing/expired/`/`, deep link refresh, counts, curl cache headers (admin HTML no-cache, `/assets/*` immutable; main unchanged), emulator-literal grep, API key match, 3-idea re-rank comparison, nonprofit/healthtech 200.
Done when: every row passes and is logged in DEPLOY.md.

## Task 12 — Custom domains admin./go. + Cloudflare DNS
What it is: PRD Phase D.
What changes at a high level: create custom domains via Hosting REST; with the owner's Cloudflare token, record old `go`/`cc` values, add TXT/ACME, create `admin` A, flip `go` A, grey cloud, TTL 300; without a token, print the record table for the owner. Also finish any missing nonprofit/np/healthtech/htech records from Task 2.
Done when: `dig +short @1.1.1.1` returns Firebase values; certs `ACTIVE`.

## Task 13 — Post-flip smoke on custom domains
What it is: PRD D3-D4.
What changes at a high level: rerun Task 11 checks on `admin.` and `go.`, plus `openssl s_client` cert check; owner confirms GA4 realtime `go_click`.
Done when: all pass; rollback values recorded; 7-day window start date logged.

## Task 14 — Retirement (day 7+)
What it is: PRD Phase G.
What changes at a high level: delete `cc` record (token) or ask owner; stop local `cc-gateway` pm2 if present; delete secrets files; on a branch + PR (owner merges the retirement PR; never push to main): `git rm -r migration/cc-content` (tests already use `tests/fixtures/cc-content`; optionally refresh content in the same PR first); `gh repo archive tejitpabari99/tejitpabari-gateway --yes`; update `/root/projects/README.md` rows (tejitpabari, cc-gateway, linkedin-outreach-tool flag).
Done when: `dig cc.tejitpabari.com` empty; `gh repo view … --json isArchived` true; README rows updated; content folder gone.

## Owner-only steps
1. Export `content/` from the old VPS and hand over the tarball (Task 10).
2. Squash-merge the PR (after rebasing on main once PR #5 lands) — this deploys (Task 11).
3. Create a Cloudflare API token (Zone:DNS:Edit, zone tejitpabari.com) saved to `~/.secrets/cloudflare-dns.token`, or add the printed records by hand (Tasks 12, 14).
4. REQUIRED (Tasks 4, 7, 9): (a) enable Google sign-in provider at https://console.firebase.google.com/project/tejitpabari-99/authentication/providers (API failed: "client_id cannot be empty"); (b) Gemini billing/prepay credits for the AI Logic Gemini Developer API project at https://ai.studio/projects (429 "prepayment credits are depleted"), and confirm AI Logic setup + ~10 RPM per-user limit at https://console.firebase.google.com/project/tejitpabari-99/ailogic. Merge is allowed before these (deploy works), but sign-in and AI stay unavailable until done.
5. Check GA4 realtime for `go_click` (Task 13).
6. Merge the retirement PR (Task 14).
7. Shut down the old VPS / pm2 and cancel billing; OK removal of `/root/projects/cc-gateway` (Task 14).
