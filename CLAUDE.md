# tejitpabari

Two builds in one repo: the public site (`vite-react-ssg`, output `dist/`) and the admin SPA (`admin/`, output `dist-admin/`). Static subdomains live in `hosting/`. Firebase project `tejitpabari-99`.

## Site build

```bash
npm run dev          # site dev server
npm run build        # typecheck + prerender site to dist/ (prebuild: OG cards + sitemap; postbuild: CSP hashes)
npm test             # site vitest suite
npm run lint
```

## Admin (React SPA, Firebase Auth + Firestore)

Source `admin/src`, own Vite config `vite.admin.config.ts`, own tsconfig `tsconfig.admin.json`. It shares nothing with the site build.

```bash
npm run emulators      # auth :9099, firestore :8080, hosting :5000 (project tejitpabari-99)
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/migrate-to-firestore.js --yes   # seed emulator from migration/cc-content
VITE_USE_EMULATORS=true npm run dev:admin                                          # dev server against emulators
npm run test:admin     # admin vitest (jsdom, data layer mocked)
npm run build:admin    # typecheck + build to dist-admin/ (must contain no 127.0.0.1)
npm run test:rules     # Firestore rules tests (emulator)
```

Without `VITE_USE_EMULATORS=true` the dev server talks to the real project. Delete `dist-admin/` after local builds.

## Guest / read-only mode

Every admin page must support a guest read-only mode.

- **Role**: `admin` = signed-in, `emailVerified`, email in `ADMIN_EMAILS`. Everyone else is `guest`. Nothing role-dependent renders before `authReady`.
- **Gate**: `RequireView` uses `canView(pathname, role, guestVisibility)`. Denied pages show `SignInGate` in place and must not query Firestore (loaders run through `useLoader`, which waits for `allowed`). `/settings` and `/ideas/rank` are admin-only; `/login` is public.
- **UI**: hide every write control (Add, Edit, Delete, Save, status/tag/title/link/github edits, Rank, bulk actions, AI) when `role !== 'admin'`. Test it per page.
- **Rules are the enforcement**: the UI gate is only UX. `firestore.rules` decides what a guest can read and only the admin can write. Never rely on a hidden button.
- **Settings `pages`**: guest visibility is edited at `/settings` (Guest Visibility). A new guest-visible page must be added to the pages list in `admin/src/pages/Settings.tsx` AND, if its data needs guest reads, to `firestore.rules` (`visible('/path')`) plus the rules tests. The `/` toggle is UI-only.
- **Admin email drift**: `ADMIN_EMAILS` in `admin/src/lib/config.js` is duplicated in `firestore.rules`; a rules test asserts they match. Change both together.

## Static subdomains and CSP

`hosting/go`, `hosting/nonprofit`, `hosting/healthtech` are plain static sites. Their Content-Security-Policy is set per target in `firebase.json` headers, not by the site build. Any new third-party origin (script, connect, frame) needs a CSP edit there, and `go.js` must keep its `API_KEY` equal to `admin/src/lib/firebase-config.js` (`npm run test:go` checks). The admin site has no CSP yet (deferred).

## Deploy

Runbook: `docs/DEPLOY.md` (phases A-G, owner fallbacks, recorded cloud state). Agents call Google REST APIs with
`Authorization: Bearer $(node scripts/infra/token.mjs)` (token minted from the firebase-tools login; never print the
refresh token). Merge to main = CI deploys everything (all hosting targets + Firestore rules). Manual deploys are allowed only for the static targets via `npm run deploy:static` (`firebase deploy --only hosting:go,hosting:nonprofit,hosting:healthtech --project tejitpabari-99`); never deploy main or admin by hand.

### CI deploy workflows (SP04)

Workflows (`.github/workflows/`):
- `ci.yml` (CI): push to main, PRs, reusable. Jobs `unit` (typecheck, lint, tests, build:all, check:admin-build) and `emulator`.
- `firebase-hosting-merge.yml`: push to main. Runs CI, builds all targets, verifies the admin build, then `firebase deploy --only hosting,firestore`. **Merge = deploy all hosting targets + Firestore rules/indexes.**
- `firebase-hosting-pull-request.yml`: PR preview channels (same-repo PRs only; forks have no secret).

Required repo config (`gh variable list` / `gh secret list`):
- Variables: `VITE_GA_MEASUREMENT_ID`, `VITE_RECAPTCHA_SITE_KEY` (the merge workflow fails loudly if either is empty).
- Secret: `FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99` (SA JSON, written to a temp file and removed after deploy).

Deploy service account `github-actions-deploy@tejitpabari-99.iam.gserviceaccount.com` roles: `roles/firebase.viewer`, `roles/firebasehosting.admin`, `roles/firebaserules.admin`, `roles/datastore.indexAdmin`, `roles/serviceusage.serviceUsageConsumer`. APIs `firestore` and `firebaserules` must stay enabled (the SA cannot enable them).

### Hosting targets and cutover (SP05)

Target -> site -> domain (project `tejitpabari-99`):

| Target | Site | Domain |
|---|---|---|
| main | tejitpabari-99 | tejitpabari.com |
| admin | tejitpabari-admin | admin.tejitpabari.com |
| go | tejitpabari-go | go.tejitpabari.com |
| nonprofit | tejitpabari-nonprofit | nonprofit.tejitpabari.com (+ np. redirect) |
| healthtech | tejitpabari-healthtech | healthtech.tejitpabari.com (+ htech. redirect) |

App Check:
- Enforced ONLY on `firebaseml.googleapis.com` (AI Logic). App Check rejects `firebasevertexai.googleapis.com` ("Service not supported").
- Firestore must stay UNenforced: go. reads links via unauthenticated REST with no App Check token.
- reCAPTCHA Enterprise key domains: `admin.tejitpabari.com` + `tejitpabari-admin.web.app` only. Only localhost (`dev:admin`) uses the debug token from `~/.secrets/appcheck-debug-token` via `VITE_APPCHECK_DEBUG_TOKEN` (dev builds only). Preview channels are prod builds, guest-only: sign-in and AI aren't available there.

Runbook: `docs/DEPLOY.md`.

## AI

Admin idea parse/enhance/rank runs client-side on Gemini via `firebase/ai` (GoogleAIBackend), in `admin/src/lib/ai.js` (prompts `ai-prompts.js`, output shaping `ai-shape.js`, error mapping `ai-errors.js`). No API keys in the repo or bundle.

- Model: `GEMINI_MODEL` constant in `admin/src/lib/ai.js` (change it there only).
- Env: `VITE_RECAPTCHA_SITE_KEY` (App Check reCAPTCHA key; empty skips App Check with a warning), `VITE_APPCHECK_DEBUG_TOKEN` (dev only; unset uses an auto-generated token printed in the console, register it in Firebase console App Check).
- App Check: initialized in `admin/src/lib/firebase.js`; AI calls use limited-use tokens. Admin role only (guests get "Admin only", no SDK call).
- Tests: `admin/src/lib/ai.test.ts` (mocked `firebase/ai`); rank schema excludes `interest`.
