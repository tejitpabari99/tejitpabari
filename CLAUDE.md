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
refresh token). Merge to main = CI deploys hosting + rules. Never deploy hosting by hand.

### CI deploy workflows (SP04)

_Placeholder: filled in by SP04 (workflow names, triggers, required secrets/vars)._

### Hosting targets and cutover (SP05)

_Placeholder: filled in by SP05 (site-to-target map, custom domains, DNS cutover status)._
