# DEPLOY runbook (tejitpabari-99)

Source plan: `docs/agent_files/feat-admin-merge-20261118-0305/05-infra-and-cutover/PRD.md`.
Secrets only under `~/.secrets/` (chmod 600), never in repo/logs. Rollback = DNS-only change.

## CLAUDE.md Deploy section (to merge)

> ## Deploy
> Runbook: `docs/DEPLOY.md` (phases A-G, owner fallbacks, recorded cloud state). Agents call Google REST APIs with
> `Authorization: Bearer $(node scripts/infra/token.mjs)` (token minted from the firebase-tools login; never print the
> refresh token). Merge to main = CI deploys hosting + rules. Never deploy hosting by hand.

## Agent API access

```bash
T=$(node scripts/infra/token.mjs)             # short-lived access token, stdout only
curl -s -H "Authorization: Bearer $T" "https://serviceusage.googleapis.com/v1/projects/tejitpabari-99/services?filter=state:ENABLED&pageSize=200"
node scripts/infra/token.mjs --adc            # writes ~/.secrets/adc-owner.json (authorized_user, 0600) for migration; delete afterwards
```
Fallback: owner creates a service-account key at `~/.secrets/tejitpabari-99.json`.
If an API returns 403 insufficient scopes: record as owner step, do not work around.

## Phase A - pre-merge infra (must finish before the PR merges; merge = deploy)
| # | Step | How | Owner fallback |
|---|---|---|---|
| A1 | Snapshot state | `firebase hosting:sites:list`; firebasehosting v1beta1 `sites/<s>/customDomains`; serviceusage `services?filter=state:ENABLED` | - |
| A2 | Enable APIs (firestore, firebaserules, identitytoolkit, firebaseappcheck, recaptchaenterprise, firebasevertexai, generativelanguage, apikeys) | serviceusage `services:batchEnable` | console |
| A3 | Firestore `(default)` native `nam5` | `firebase firestore:databases:create "(default)" --location nam5` | console |
| A4 | Auth: Google provider + authorized domains (add-only) | identitytoolkit admin v2 `PATCH config?updateMask=authorizedDomains` | Console > Authentication > Sign-in method > Google > Enable |
| A5 | Web app `tejitpabari-admin` + config committed | `firebase apps:create WEB`, `apps:sdkconfig`; `npm run test:go` | - |
| A6 | Browser API key referrers (add-only) | apikeys v2 get/patch | console |
| A7 | reCAPTCHA Enterprise key, App Check, AI Logic enforce, debug token, repo var `VITE_RECAPTCHA_SITE_KEY` | recaptchaenterprise / firebaseappcheck APIs | Console AI Logic "Get started > Gemini Developer API"; quota ~10 RPM |
| A8 | CI SA roles `roles/firebaserules.admin`, `roles/datastore.indexAdmin`, `roles/serviceusage.serviceUsageConsumer` | cloudresourcemanager v1 getIamPolicy -> setIamPolicy (etag) | console IAM |
| A9 | Rules + indexes live | `npx firebase deploy --only firestore --project tejitpabari-99` | - |
| A10 | Gemini smoke (rank 1 throwaway idea via `dev:admin` + debug token) | manual | - |

## Phase B - data
Owner exports `content/` from old VPS (`tar czf`); agent diffs vs `migration/cc-content/`, replaces, commits `chore: sync content from production`. Soft freeze on old site. `GOOGLE_APPLICATION_CREDENTIALS=~/.secrets/adc-owner.json npm run migrate -- --dry-run`, then `-- --yes`; expect `OK ideas N/N, links M/M, settings 1/1`. Never rerun after DNS flip without `--force-overwrite` intent.

## Phase C - deploy + smoke on web.app
Owner squash-merges (rebased after PR #5); CI deploys. Smoke on `tejitpabari-admin.web.app` and `tejitpabari-go.web.app/<slug>`: auth as owner, guest read-only, CRUD, rank, go. live/missing/expired/`/`, deep-link refresh; admin HTML `cache-control: no-cache`, `/assets/*` immutable; main site unchanged; `grep -rn "127.0.0.1:9099\|127.0.0.1:8080" dist-admin` = 0; `go.js` API_KEY == `firebase-config.js` apiKey; nonprofit/healthtech 200.

## Phase D - custom domains + DNS
POST Hosting REST `sites/tejitpabari-admin/customDomains?customDomainId=admin.tejitpabari.com` (and `go.` on `tejitpabari-go`); read `requiredDnsUpdates`. Cloudflare (token at `~/.secrets/cloudflare-dns.token`, else owner adds printed table): record current `go`/`cc` values here first, TXT/ACME, `admin` A, flip `go` A, grey cloud, TTL 300, remove stale `go` AAAA. Verify `dig +short @1.1.1.1`, cert `ACTIVE`, `openssl s_client`. Re-run smoke; owner checks GA4 realtime `go_click`.

## Phase E - 7-day window
Old VPS + `cc.` record untouched. Log window start date here.

## Phase F - rollback
Restore recorded `go` A values (orange, Flexible), delete `admin` record. Firestore edits during window re-entered manually.

## Phase G - retirement (after 7 clean days)
Delete `cc` record (token or owner); owner stops old VPS; delete `~/.secrets/adc-owner.json`/SA key; `git rm -r migration/cc-content`; `gh repo archive tejitpabari99/tejitpabari-gateway --yes`; update `/root/projects/README.md` rows; owner OK then remove `/root/projects/cc-gateway`.

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
