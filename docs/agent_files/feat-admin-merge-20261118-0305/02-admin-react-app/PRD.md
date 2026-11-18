---
status: approved
summary: React + Vite + Tailwind + TS client-rendered admin SPA (admin.tejitpabari.com) built to dist-admin/, using the ported Firestore data layer, React auth context, route gate with guest read-only mode, emulator dev workflow, CLAUDE.md.
date: 2026-11-18
---
# PRD: SP02 admin-react-app
Repo/branch: tejitpabari · `feat/admin-merge` · Depends on: SP01 · Owns: `admin/**` (except files SP01 ported into `admin/src/lib/`, which SP02 may edit only as listed below), `vite.admin.config.ts`, `tsconfig.admin.json`, `tsconfig.json` (add reference), `package.json` (admin deps + `dev:admin`/`build:admin`/`build:all`/`test:admin` scripts only), `CLAUDE.md` (new), `README.md` (admin section), `.env.example` (comment only, if needed)

## TL;DR
Re-implement the six cc-gateway pages in React as a client-side SPA under `admin/`, built by its own Vite config into `dist-admin/`. Auth becomes a React context (`user`, `authReady`, `role` via the ported pure `roleFor`); a layout route waits for auth + settings, applies `canView`, and renders either the page or a sign-in gate. Pages call the ported `admin/src/lib` data layer unchanged. Guests get read-only UI; rules (SP01) enforce. AI buttons call the `ai.js` stub (SP03 fills it).

## Problem
The cc-gateway UI is SvelteKit (`+layout.js`, Svelte stores, `{#if}` guards) [verified: `src/routes/**` at 2d95cfe, ~2.8k lines of `.svelte`]. The site is React. Only the UI and the store-based glue need replacing; the data layer is framework-free.

## Goals / Non-Goals
- Goals: feature parity with the cc-gateway SP03 PRD (routes, gating, read-only guest, links rename/expiry/QR, ideas add/edit/enhance/rank/reset, settings); no admin/guest flash; zero impact on the main site build; emulator dev loop.
- Non-goals: Gemini/App Check (SP03), workflows (SP04), console/DNS (SP05), admin CSP (DEFERRED, old D8), SSR/prerender, realtime listeners, dark mode.

## Requirements
- Routes: `/`, `/ideas`, `/ideas/:slug`, `/ideas/rank`, `/links`, `/settings`, `/login`; deep-link refresh works (hosting rewrite from SP01).
- Role: signed-in, `emailVerified`, email in `ADMIN_EMAILS` → `admin`; anyone else → `guest`. Nothing role-dependent renders before `authReady`.
- Gate: `canView(pathname, role, guestVisibility)` (ported, same semantics: exact or prefix + `/`; `/settings`, `/ideas/rank` admin-only; `/login` public). Denied → `SignInGate` in place, URL unchanged, no Firestore query for that page. Non-owner Google user sees "Signed in as X (not authorised)" + Sign out.
- Header: brand `admin.tejitpabari.com`; guest → "Admin" link to `/login`; admin → settings cog + Logout. Sign-in/out re-renders gate and pages without reload.
- Guest on a visible page: no Add/Edit/Delete/Save/AI/status/tag/title/link/github/Rank/Bulk controls.
- Home: Ideas + Links cards only. Links: no Clicks/Last Hit columns or redirect toggle; expiry, tags, QR, copy, expired badge kept; URLs show the real slash slug (`go.tejitpabari.com/juno/pitch-deck`).
- Ideas: list (excerpt, tags, score via `computeScore`, sort as before), Add Idea (`ai.parseIdea` → `slugifyTitle` → `createIdea`, collision suffix, `rank` reserved), bulk reset (`resetAllRankings`), bulk rank concurrency 3; detail edits via `saveIdeaMeta`, delete → `/ideas`, enhance preview via `renderMarkdown` then `saveIdeaContent`; rank page lists `!ranked && status==='new'` sorted by title.
- Settings: guest-visibility toggles (`/`, `/ideas`, `/links`) and ranking criteria with existing validation messages; copy "without signing in".
- AI errors show the message thrown by `ai.js` (stub: "AI is not configured yet").

## Architecture
**Build**: `admin/index.html` (no inline scripts/styles) → `admin/src/main.tsx`. `vite.admin.config.ts`: `root: 'admin'`, `envDir` = repo root, `build.outDir: '../dist-admin'`, `emptyOutDir`, plugin `@vitejs/plugin-react` only (never `liveRedirectsPlugin`), aliases `@admin` → `admin/src`, `@site` → `src` (shared components). `test` block: jsdom, `admin/src/setupTests.ts`, include `admin/src/**/*.test.{ts,tsx}`. Scripts: `dev:admin` (`vite -c vite.admin.config.ts`), `build:admin` (`tsc -p tsconfig.admin.json --noEmit && vite build -c vite.admin.config.ts`), `build:all` (`npm run build && npm run build:admin`), `test:admin` (`vitest run -c vite.admin.config.ts`). npm `prebuild`/`postbuild` hooks bind to `build` only, so CSP-hash scripts never see admin output.

**TypeScript**: `tsconfig.admin.json` mirrors `tsconfig.app.json` (non-strict, `jsx: react-jsx`, `noEmit`) + `allowJs: true`, `checkJs: false`, include `admin/src`; referenced from `tsconfig.json` so `npm run typecheck` covers it. Small `admin/src/types.ts` declares `Idea`, `Link`, `Settings`, `Criterion` shapes from `docs/firestore-schema.md` for TS callers.

**Styling**: `admin/tailwind.config.ts` uses the site config as a `preset` (colors cream/sage/teal/ink…, Montserrat, radii, shadows) with content `admin/**/*.{html,ts,tsx}` plus any shared `src/components` files imported; `admin/postcss.config.js`; `admin/src/index.css` with Tailwind layers. Reuse site `Button`, `TagPill`, `EmptyState` where they fit without changes to them; otherwise local admin components. Montserrat via the same Google Fonts link as site `index.html`.

**Auth (replaces Svelte stores)**
| Piece | Contract |
|---|---|
| `admin/src/lib/auth-core.js` (new, framework-free) | `roleFor(user)` (moved verbatim from old auth.js), `signInWithGoogle()` (popup), `signOutUser()`, `onAuth(cb, authInst?, onChange?)` injectable, `currentRole()` last-known role (used by SP03 `ai.js` guard) |
| `admin/src/auth/AuthProvider.tsx` | subscribes once; context `{ user, authReady, role }`; `useAuth()` hook |
| `admin/src/auth/RequireView.tsx` | layout route: waits `authReady` and `getSettings()`; computes `allowed = canView(...)`; renders `<Outlet/>` or `<SignInGate/>`; exposes `guestVisibility` via context |
| `admin/src/auth/SignInGate.tsx` | three states as old Svelte gate (signing in / not authorised + sign out / sign-in button, popup-closed ignored) |
Role change → context update → `RequireView` and pages re-render; replaces old `invalidateAll()`.

**Data loading**: pages use a small `useLoader(fn, deps)` hook (`{data, error, loading, reload}`) that does not run when `allowed` is false; after a write the page calls `reload()`. Loader `permission-denied` → error panel; missing idea → "Not found" view. `settings.js` memo cleared on writes (ported behavior). One-shot reads only.

**Firebase init**: `admin/src/lib/firebase.js` (ported) changed only so the emulator branch reads `import.meta.env.VITE_USE_EMULATORS === 'true'` (no optional chaining) wrapping the `connect*Emulator` calls inline, so prod builds drop the `127.0.0.1` literals by dead-code elimination; SP03 marker comments kept. Its test moves to vitest (`import.meta.env` exists there).

**Markdown/QR**: `marked` (render, owner-only content, old D7: no sanitizer) via `dangerouslySetInnerHTML` in one `Markdown` component; `qrcode` dynamic import on the links page.

**Dev workflow**: `npm run emulators` (auth + firestore + hosting) in one shell, `VITE_USE_EMULATORS=true npm run dev:admin` in another; seed with `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run migrate -- --yes`. Documented in CLAUDE.md.

**CLAUDE.md (new, repo root)**: site build notes (`npm run build` with prebuild/postbuild, CSP hashes rewrite `firebase.json` main entry — commit it; no inline styles/scripts on static subdomains); admin build/dev/emulator commands; deploy summary (CI on merge; manual `firebase deploy --only hosting:<target>`); guest read-only rules carried from old CLAUDE.md, rewritten: every admin page must support guest read-only; gate via `canView` + settings `pages` list; hide write UI unless `role === 'admin'`; Firestore rules are the real enforcement; a new guest-visible page needs an entry in the settings `pages` array AND a `firestore.rules` update + rules test; `/settings`, `/ideas/rank` admin-only; admin email lives in `config.js` and `firestore.rules` (drift test); no `cc.` references. SP04/SP05 append their own sections only.

## Decisions
| # | Decision | Choice | Alternatives considered | Why |
|---|---|---|---|---|
| 1 | Admin build | Separate `vite.admin.config.ts`, root `admin/`, outDir `dist-admin/` | Second input in site Vite config; vite-react-ssg | Site config carries the firebase.json-writing plugin + SSG; isolation keeps main untouched |
| 2 | Router | react-router-dom 6 (already a dep), `createBrowserRouter` with a layout route | TanStack Router | No new dep |
| 3 | Auth state | Context + framework-free `auth-core.js` | Zustand store | No new dep; core stays node-testable |
| 4 | Gate | In-place `SignInGate` | Redirect to `/login` | Parity with old D2; deep link survives sign-in |
| 5 | Ported JS | Imported as-is via `allowJs` | Rewrite in TS | Owner O3 + D1 |
| 6 | Styling | Site Tailwind preset; old dark toggle dropped | Port old CSS + theme toggle | Owner: share tokens; site has no dark palette |
| 7 | Markdown | `marked` + innerHTML (old D7) | site's `react-markdown` | Byte-parity with migrated bodies; owner-only writes |
| 8 | Test split | vitest + RTL for admin UI/auth/firebase-init; data layer stays on SP01 emulator suites | Emulator-backed UI tests | Fast, no JDK for UI tests |
| 9 | Emulator literals | Inline `if (import.meta.env.VITE_USE_EMULATORS === 'true')` | Helper with `?.` | Guaranteed DCE; SP04 greps `dist-admin/` |
| 10 | Admin CSP | Not added | Strict CSP now | Old D8 holds; feasible later (no inline scripts) |

## Manual steps
None (real web config arrives in SP05).

## Risks / Open Questions
- [RESOLVED: shared site components imported read-only] If a site component needs a change to fit admin, copy it into `admin/src/components/` instead of editing `src/`.
- [RESOLVED: placeholder web config] Until SP05, sign-in only works against the auth emulator.
- [RESOLVED: Tailwind preset import] Admin config imports `../tailwind.config.ts` as preset; content globs are admin-only, so site CSS output is unchanged.
- [RESOLVED: `currentRole()` lives in auth-core] SP03 guard reads it; no React import in `ai.js`.
- [DEFERRED] Admin CSP; `/ideas` list dropping `body` field.
- Risk: `signInWithPopup` on preview channels fails (domain not authorized); previews are guest-mode only (SP04).

## Acceptance Criteria
- `npm run build:admin` emits `dist-admin/index.html` + `dist-admin/assets/*`; `npm run build` output unchanged vs SP01 baseline; `grep -rn "127.0.0.1" dist-admin` → 0.
- `npm run test:admin` green: `roleFor` matrix; AuthProvider (`authReady` false until first callback, role flips on sign-in/out); RequireView (guest on hidden page / `/settings` / `/ideas/rank` → gate and loader not called; admin → page); SignInGate three states; per page: guest render has no write controls, admin actions call the right data-layer function (data layer mocked); links page shows real slash slug and no Clicks column; AI error message surfaces.
- Manual emulator run: admin adds/edits/deletes idea and link (rename keeps `created`, collision rejected), edits settings; guest with `/links` off sees gate; hard refresh on `/ideas/<slug>` shows no flash.
- `CLAUDE.md` exists with guest-mode rules and build/dev commands; no pm2, nginx, `/api`, `/linkedin`, `GATEWAY_PASSWORD`, `cc.tejitpabari.com`.
- `npm test`, lint, typecheck green.
