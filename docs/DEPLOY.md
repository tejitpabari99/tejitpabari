# DEPLOY runbook (tejitpabari-99)

Source plan: `docs/agent_files/feat-admin-merge-20261118-0305/05-infra-and-cutover/PRD.md`.
Secrets only under `~/.secrets/` (chmod 600), never in repo/logs. Rollback = DNS-only change.

## Agent API access

```bash
T=$(node scripts/infra/token.mjs)             # short-lived access token, stdout only
curl -s -H "Authorization: Bearer $T" "https://serviceusage.googleapis.com/v1/projects/tejitpabari-99/services?filter=state:ENABLED&pageSize=200"
node scripts/infra/token.mjs --adc            # writes ~/.secrets/adc-owner.json (authorized_user, 0600) for migration; delete afterwards
```
Fallback: owner creates a service-account key at `~/.secrets/tejitpabari-99.json`.
If an API returns 403 insufficient scopes: record as owner step, do not work around.

## Phase A - pre-merge infra (must finish before the PR merges; merge = deploy)
Merging the PR is allowed with T4 (Google provider) and T9 (Gemini billing) blocked: the deploy works, but sign-in and AI stay unavailable until those owner steps are done.
Owner steps REQUIRED for live sign-in and AI: (a) enable the Google sign-in provider at https://console.firebase.google.com/project/tejitpabari-99/authentication/providers (API path failed: "client_id cannot be empty"); (b) Gemini billing/prepay credits for the AI Logic Gemini Developer API project at https://ai.studio/projects (429 "prepayment credits are depleted"), and confirm AI Logic setup + ~10 RPM per-user limit at https://console.firebase.google.com/project/tejitpabari-99/ailogic.

| # | Step | How | Owner fallback |
|---|---|---|---|
| A1 | Snapshot state | `firebase hosting:sites:list`; firebasehosting v1beta1 `sites/<s>/customDomains`; serviceusage `services?filter=state:ENABLED` | - |
| A2 | Enable APIs (firestore, firebaserules, identitytoolkit, firebaseappcheck, recaptchaenterprise, firebasevertexai, generativelanguage, apikeys) | serviceusage `services:batchEnable` | console |
| A3 | Firestore `(default)` native `nam5` | `firebase firestore:databases:create "(default)" --location nam5` | console |
| A4 | Auth: Google provider + authorized domains (add-only) [VERIFIED 2026-11-18] | identitytoolkit admin v2 `PATCH config?updateMask=authorizedDomains` | Console > Authentication > Sign-in method > Google > Enable |
| A5 | Web app `tejitpabari-admin` + config committed | `firebase apps:create WEB`, `apps:sdkconfig`; `npm run test:go` | - |
| A6 | Browser API key referrers (add-only) | apikeys v2 get/patch | console |
| A7 | reCAPTCHA Enterprise key, App Check, AI Logic enforce, debug token, repo var `VITE_RECAPTCHA_SITE_KEY` | recaptchaenterprise / firebaseappcheck APIs | Console AI Logic "Get started > Gemini Developer API"; quota ~10 RPM |
| A8 | CI SA roles `roles/firebaserules.admin`, `roles/datastore.indexAdmin`, `roles/serviceusage.serviceUsageConsumer` | cloudresourcemanager v1 getIamPolicy -> setIamPolicy (etag) | console IAM |
| A9 | Rules + indexes live | `npx firebase deploy --only firestore --project tejitpabari-99` | - |
| A10 | Gemini smoke (rank 1 throwaway idea via `dev:admin` + debug token) | manual | - |

## Phase B - data
Owner exports `content/` from old VPS (`tar czf`); agent extracts it to a scratch dir (no commit to main; a content refresh, if desired, goes in the retirement PR). Soft freeze on old site. `GOOGLE_APPLICATION_CREDENTIALS=~/.secrets/adc-owner.json npm run migrate -- --content-dir <extracted dir> --dry-run`, then `--yes` (same args); expect `OK ideas N/N, links M/M, settings 1/1`. Never rerun after DNS flip without `--force-overwrite` intent.

## Phase C - deploy + smoke on web.app
Owner squash-merges (rebased after PR #5); CI deploys. Smoke on `tejitpabari-admin.web.app` and `tejitpabari-go.web.app/<slug>`: auth as owner, guest read-only, CRUD, rank, go. live/missing/expired/`/`, deep-link refresh; admin HTML `cache-control: no-cache`, `/assets/*` immutable; main site unchanged; `grep -rn "127.0.0.1:9099\|127.0.0.1:8080" dist-admin` = 0; `go.js` API_KEY == `firebase-config.js` apiKey; nonprofit/healthtech 200.

## Phase D - custom domains + DNS
POST Hosting REST `sites/tejitpabari-admin/customDomains?customDomainId=admin.tejitpabari.com` (and `go.` on `tejitpabari-go`); read `requiredDnsUpdates`. Cloudflare (token at `~/.secrets/cloudflare-dns.token`, else owner adds printed table): record current `go`/`cc` values here first, TXT/ACME, `admin` A, flip `go` A, grey cloud, TTL 300, remove stale `go` AAAA. Verify `dig +short @1.1.1.1`, cert `ACTIVE`, `openssl s_client`. Re-run smoke; owner checks GA4 realtime `go_click`.

## Phase E - 7-day window
Old VPS + `cc.` record untouched. Log window start date here.

## Phase F - rollback
Restore recorded `go` A values (orange, Flexible), delete `admin` record. Firestore edits during window re-entered manually.

## Phase G - retirement (after 7 clean days)
Done on a branch + PR that the owner merges (owner-only step; never push to main). Delete `cc` record (token or owner); owner stops old VPS; delete `~/.secrets/adc-owner.json`/SA key; in the PR `git rm -r migration/cc-content` (tests use `tests/fixtures/cc-content`, so no other code change); `gh repo archive tejitpabari99/tejitpabari-gateway --yes`; update `/root/projects/README.md` rows; owner OK then remove `/root/projects/cc-gateway`.

---
# Recorded state / evidence (append-only log)

## A1 State snapshot (2026-11-18, before changes)
Sites: `tejitpabari-99` (main), `-nonprofit`, `-healthtech`, `-admin`, `-go` (all `<site>.web.app`).

| Site | Custom domain | hostState | ownership | cert | Redirect | Required DNS |
|---|---|---|---|---|---|---|
| tejitpabari-99 | tejitpabari.com | HOST_ACTIVE | ACTIVE | CERT_ACTIVE | - | live |
| tejitpabari-nonprofit | nonprofit.tejitpabari.com | HOST_UNHOSTED | MISSING | CERT_VALIDATING | - | CNAME `tejitpabari-nonprofit.web.app` |
| tejitpabari-nonprofit | np.tejitpabari.com | HOST_UNHOSTED | MISSING | CERT_VALIDATING | -> nonprofit. | CNAME `tejitpabari-nonprofit.web.app` |
| tejitpabari-healthtech | healthtech.tejitpabari.com | HOST_UNHOSTED | MISSING | CERT_VALIDATING | - | CNAME `tejitpabari-healthtech.web.app` |
| tejitpabari-healthtech | htech.tejitpabari.com | HOST_UNHOSTED | MISSING | CERT_VALIDATING | -> healthtech. | CNAME `tejitpabari-healthtech.web.app` |
| tejitpabari-admin | (none) | | | | | |
| tejitpabari-go | (none) | | | | | |

Nonprofit/np/healthtech/htech DNS pending (Cloudflare, owner; Task 12 finishes).
Web apps: 1 - `tejitpabari-website` (`1:869772411310:web:ce899107a79838ba5b483f`, WEB).
Enabled services (48): includes firebase, firebasehosting, firebaserules, identitytoolkit, securetoken, datastore, iam, iamcredentials, cloudresourcemanager, serviceusage, storage*, run, cloudbuild, secretmanager, etc. NOT enabled: firestore, firebaseappcheck, recaptchaenterprise, firebasevertexai, generativelanguage, apikeys.

## A2/A3 APIs + Firestore (2026-11-18)
- Before: firestore, firebaseappcheck, recaptchaenterprise, firebasevertexai, generativelanguage, apikeys disabled (firebaserules, identitytoolkit were already enabled).
- `services:batchEnable` of all eight: operation done, no error. After: all eight ENABLED.
- Firestore: before `firebase firestore:databases:list` = "No databases found". `firebase firestore:databases:create "(default)" --location nam5` -> after: `(default)`, FIRESTORE_NATIVE, locationId `nam5`.
- Rules check: new DB is created with CLOSED rules (CLI says so; `firebaserules releases` list empty; anonymous REST read of `links` -> 403). Not open test-mode, so no emergency rules deploy; real rules go live in A9 (Task 9).

## A4 Auth (2026-11-18)
- Before: `GET admin/v2/.../config` -> 404 CONFIGURATION_NOT_FOUND (auth never initialized). `POST v2/projects/tejitpabari-99/identityPlatform:initializeAuth {}` -> `{}`; config now exists.
- authorizedDomains before: `tejitpabari-99.firebaseapp.com`, `tejitpabari-99.web.app`. After (add-only PATCH, updateMask=authorizedDomains): those two + `admin.tejitpabari.com`, `tejitpabari-admin.web.app`, `tejitpabari-admin.firebaseapp.com`, `localhost`.
- Google IdP: NOT enabled. `POST defaultSupportedIdpConfigs?idpId=google.com {"enabled":true}` -> 400 "client_id cannot be empty"; no API mints the web OAuth client. **OWNER STEP (pending):** Firebase console > Authentication > Sign-in method > Google > Enable (set support email) - https://console.firebase.google.com/project/tejitpabari-99/authentication/providers . The console auto-creates the OAuth client. Then verify: `GET .../defaultSupportedIdpConfigs/google.com` -> `enabled: true`.

## A5 Web app + config (2026-11-18)
- Before: 1 web app (`tejitpabari-website`). Created `tejitpabari-admin` = `1:869772411310:web:67131c4a32f7e55c5b483f` (`firebase apps:create WEB`).
- SDK config apiKey is the SAME browser key as `tejitpabari-website` (shared key; Task 6 referrers add-only). Committed into `admin/src/lib/firebase-config.js` (apiKey, appId) and `hosting/go/go.js` API_KEY. No `PLACEHOLDER` left in admin/ or hosting/.
- `npm run test:go`: 28 pass / 0 fail (incl. API key drift). `npm run test:node`: 23/0. `test:admin` script does not exist in this branch yet (SP02/03); run once present.

## A6 Browser API key referrers (2026-11-18) - NO CHANGE MADE (by design)
- Only key in project: `projects/869772411310/locations/global/keys/6fc09029-694c-4980-9b74-ec7c5e201141` "Browser key (auto created by Firebase)"; `keyString` equals the apiKey in `firebase-config.js`/`go.js` (verified).
- Before-state: `browserKeyRestrictions: {}` (NO referrer restrictions = unrestricted by origin). apiTargets (27): firebasedatabase, firebasehosting, firebaserules, sqladmin, cloudconfig, datastore, fcmregistrations, firebase, firebaseappcheck, firebaseappdistribution, firebaseapphosting, firebaseapptesters, firebasedataconnect, firebaseinappmessaging, firebaseinstallations, firebaseml, firebaseremoteconfig, firebaseremoteconfigrealtime, firebasestorage, firebasevertexai, firestore, identitytoolkit, logging, mlkit, play, securetoken, fpnv. etag `DgNn0JZCOpbh8MjZ+BA2Cw==`.
- Why no patch: adding a referrer list to an unrestricted key would RESTRICT it and could break any other client of the key (the `tejitpabari-website` app shares it). Main site source has no Firebase JS/apiKey (grep of `src`, `index.html`: none), but add-only semantics don't allow turning "any origin" into an allowlist without owner sign-off. API restrictions already cover Identity Toolkit, Token Service (securetoken), Firestore, AI Logic (firebasevertexai), App Check.
- Effect: admin/go origins already work (no referrer check). **OWNER DECISION (optional hardening):** to restrict, PATCH `restrictions.browserKeyRestrictions.allowedReferrers` with `admin.tejitpabari.com/*`, `go.tejitpabari.com/*`, `tejitpabari-admin.web.app/*`, `tejitpabari-go.web.app/*`, `tejitpabari-99.web.app/*`, `tejitpabari-99.firebaseapp.com/*`, `localhost:*/*` (and `tejitpabari.com/*` if the main site ever uses it). Say "restrict key" and an agent will apply it.

## A8 CI service-account IAM (2026-11-18)
- SA: `github-actions-deploy@tejitpabari-99.iam.gserviceaccount.com`. Before: `roles/firebase.viewer`, `roles/firebasehosting.admin` only.
- `getIamPolicy` (v3, etag `BwZghNBeOo4=`) -> add-only -> `setIamPolicy` with same etag. After (etag `BwZghNapdr0=`): + `roles/firebaserules.admin`, `roles/datastore.indexAdmin`, `roles/serviceusage.serviceUsageConsumer`. Verified after-policy is a strict superset of before (all other bindings incl. the conditional secretmanager.admin untouched).
- Rules-deploy authorization is confirmed on first CI run (Task 11).

## A7 App Check + reCAPTCHA + AI Logic (2026-11-18)
- Before: no reCAPTCHA Enterprise keys; App Check `services` list empty (nothing enforced); admin app `recaptchaEnterpriseConfig` had no siteKey (default `minValidScore` 0.5, ttl 3600s); no debug tokens; AI Logic `locations/global/config` -> 404 "genai config not found".
- Created reCAPTCHA Enterprise key `projects/869772411310/keys/6Lc94yUuAAAAABhH-JAa0yNyj265NRa67Y4jHor7` ("tejitpabari-admin app-check", WEB, SCORE, allowAllDomains=false, domains `admin.tejitpabari.com`, `tejitpabari-admin.web.app`; no localhost). Site key is public.
- Registered on App Check for `tejitpabari-admin` (`1:869772411310:web:67131c4a32f7e55c5b483f`): `recaptchaEnterpriseConfig` patch siteKey; verified siteKey now set.
- Enforcement: App Check does NOT support service id `firebasevertexai.googleapis.com` (400 "Service not supported"). Firebase AI Logic is enforced via `firebaseml.googleapis.com` -> set `enforcementMode: ENFORCED` (etag `IqC_f-wqhI-jK6k=`). Services list after: only `firebaseml.googleapis.com` ENFORCED. Firestore (`firestore.googleapis.com`) has no enforcement set (UNENFORCED default) - go. REST stays tokenless.
- Debug token created (displayName "local dev", id `MjM0YmMyZjItZGUwYy00ZTE2LWE3MDgtZjFjZGUxYzhiZDc4`); value generated locally, stored only in `~/.secrets/appcheck-debug-token` (600). (An earlier token from a first attempt whose value was not captured was deleted.)
- Repo variable `VITE_RECAPTCHA_SITE_KEY` set on tejitpabari99/tejitpabari (`gh variable list` confirms).
- AI Logic / Gemini Developer API: discovery doc has `projects.locations.updateConfig` with `generativeLanguageConfig` (apiKey deprecated, no longer needed). `PATCH v1beta/projects/tejitpabari-99/locations/global/config?updateMask=generativeLanguageConfig` with `{}` -> 200; config now exists (was 404). Could not confirm the Gemini Developer API is fully provisioned (GET does not echo the field; token lacks generativelanguage scope).
  **OWNER STEP (verify, likely 1 click):** open https://console.firebase.google.com/project/tejitpabari-99/ailogic ; if it shows "Get started", choose "Gemini Developer API" and finish.
- Per-user quota (~10 RPM): no public API for the AI Logic per-user rate limit. **OWNER STEP:** Firebase console > AI Logic > Settings (https://console.firebase.google.com/project/tejitpabari-99/ailogic) > per-user rate limit -> ~10 RPM (if absent, GCP console > APIs & Services > Quotas for Firebase AI Logic).

## A9/A10 Rules + indexes deploy and Gemini smoke (2026-11-18)
- `npx firebase deploy --only firestore --project tejitpabari-99`: rules compiled, indexes deployed, `released rules firestore.rules to cloud.firestore`. Hosting untouched.
- Release visible: `GET firebaserules v1/projects/tejitpabari-99/releases` -> `releases/cloud.firestore`, updateTime 2026-11-18T04:10:19Z (was empty before).
- Anon REST (no auth): `GET documents/ideas` -> 403 (denied, no `settings/main`); `GET documents/links/x` -> 404 NOT_FOUND (allowed read of nonexistent doc, not 403); `GET documents/settings/main` -> 404 (DB empty).
- Endpoint (from `@firebase/ai` GoogleAIBackend): `POST https://firebasevertexai.googleapis.com/v1beta/projects/tejitpabari-99/models/<GEMINI_MODEL>:generateContent`, headers `x-goog-api-key` (web apiKey), `X-Firebase-Appid`, `X-Firebase-AppCheck`.
- NEGATIVE: no App Check header -> 401 "Firebase App Check token is invalid."; invalid token -> 401 same. Enforcement via `firebaseml.googleapis.com` covers AI Logic. PASS.
- Debug token exchange (`firebaseappcheck v1 ...:exchangeDebugToken`) -> 200, 3600s token. Request with valid App Check token passes App Check and reaches Gemini Developer API (so AI Logic config is provisioned), but returns **429 RESOURCE_EXHAUSTED: "Your prepayment credits are depleted. Please go to AI Studio at https://ai.studio/projects to manage your project and billing."** Same for `gemini-3.8-flash`, `gemini-2.5-flash` and a bogus model name (billing check precedes model resolution).
- POSITIVE rank: NOT MET. No valid scores yet; `validateRank` not exercised. **OWNER STEP:** add prepay credits / billing on the Gemini project linked to tejitpabari-99 at https://ai.studio/projects (Gemini Developer API key project), then rerun the positive call.
- `GEMINI_MODEL` (`gemini-3.8-flash`) existence UNVERIFIED: ListModels needs a generativelanguage scope the owner token lacks (403 ACCESS_TOKEN_SCOPE_INSUFFICIENT) and billing 429 masks 404. Recheck after billing is fixed; a 404 would be a real finding.

## A4 re-verify + A10 Gemini investigation (2026-11-18, Task 4)
- A4 VERIFIED: `defaultSupportedIdpConfigs/google.com` -> `enabled: true`. `config.authorizedDomains` = tejitpabari-99.firebaseapp.com, tejitpabari-99.web.app, admin.tejitpabari.com, tejitpabari-admin.web.app, tejitpabari-admin.firebaseapp.com, localhost.
- API keys in tejitpabari-99 (apikeys v2): only "Browser key (auto created by Firebase)"; browserKeyRestrictions empty (no referrer list), apiTargets include firebasevertexai.googleapis.com, firebaseml.googleapis.com, identitytoolkit, firestore, etc. No separate "Gemini Developer API key" exists (docs: since mid-2026 AI Logic does not use a standard Gemini key; it uses the Firebase key + Google-managed P4SA).
- `generativelanguage.googleapis.com` is ENABLED in the project.
- Billing: `cloudbilling v1 projects/tejitpabari-99/billingInfo` -> `billingEnabled: true`, account `billingAccounts/016F25-85CB54-995B5B` (open, USD). (Works without the x-goog-user-project header; with it the Cloud Billing API is disabled on the project.) So the project is ALREADY on Blaze; Spark->Blaze is not a pending change.
- Diagnosis: the 429 "prepayment credits are depleted" is a Gemini API (AI Studio) billing state, not a missing link. Per AI Studio docs, new users default to Prepay; when the prepay wallet is $0 all keys/projects on that billing account fail until credits are added (switching prepay->postpay unsupported by docs; staff: disabling billing / new project under same account does not reset). Fixes: (1) add funds (min ~$5-10) to the AI Studio prepay wallet at https://aistudio.google.com/projects, or (2) link the project to a standard postpay Cloud Billing account. Free tier: only for projects with NO billing account linked; linking billing moves it to paid Tier 1 inheriting the account's prepay state.
- AI Studio "no project" listing: AI Studio lists only projects imported into it. Owner: https://aistudio.google.com/projects -> Import project -> pick tejitpabari-99 (docs give no detailed steps; exact UI label unverified). Spend cap (experimental): https://aistudio.google.com/spend. Budget alert: GCP console > Billing > Budgets & alerts (https://console.cloud.google.com/billing/016F25-85CB54-995B5B/budgets).
- Smoke re-run (same A10 path, gemini-3.8-flash, valid App Check token): still **429 RESOURCE_EXHAUSTED, "Your prepayment credits are depleted..."**. Unchanged. validateRank not exercised.
- Sources: https://aistudio.google.com/docs/billing ; https://firebase.google.com/docs/ai-logic/faq-and-troubleshooting ; https://discuss.ai.google.dev/t/prepayment-credits-depleted-error-persists-on-brand-new-project-with-no-billing-account-linked/179109

## A10 positive re-run (2026-11-18, Task 9 verified)
- 2026-11-18 positive re-run: owner imported tejitpabari-99 into AI Studio, added prepay credits + spend cap. gemini-3.8-flash exists (generateContent 200). Rank prompt 200, valid JSON scores. Negative (no App Check header) still 401.
