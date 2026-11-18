---
status: approved
summary: 9 tasks — admin build scaffold, auth core + context, gate/shell/login, home+links, ideas list/add, idea detail, rank+settings, firebase init emulator guard, CLAUDE.md/README.
date: 2026-11-18
---
# Tasks: SP02 admin-react-app
Source of truth: /root/projects/tejitpabari/.worktrees/feat/admin-merge/docs/agent_files/feat-admin-merge-20261118-0305/02-admin-react-app/PRD.md. Behavior reference: cc-gateway Svelte pages at `git show 2d95cfe:src/routes/<path>` in /root/projects/cc-gateway/.worktrees/feat/firebase-static, and the old SP03 PRD there (`docs/agent_files/feat-firebase-static-20261026-1647/03-cc-spa-port/PRD.md`). Do not edit site `src/` files.

| # | Task | Depends on | Status |
|---|---|---|---|
| 1 | Admin build scaffold | SP01 | in-progress |
| 2 | Firebase init emulator guard + test | 1 | in-progress |
| 3 | Auth core + AuthProvider | 1 | in-progress |
| 4 | Shell, RequireView gate, SignInGate, login | 3 | todo |
| 5 | Home and links pages | 4 | todo |
| 6 | Ideas list and add-idea flow | 4 | todo |
| 7 | Idea detail page | 4 | todo |
| 8 | Rank and settings pages | 4 | todo |
| 9 | CLAUDE.md + README admin section | 5, 6, 7, 8 | todo |

## Task 1 — Admin build scaffold
What it is: the second Vite entry (PRD Decision 1).
What changes at a high level: add `admin/index.html`, `admin/src/main.tsx`, router skeleton, `vite.admin.config.ts` (root admin, envDir repo root, outDir dist-admin, react plugin only, aliases, vitest block), `tsconfig.admin.json` with allowJs referenced from `tsconfig.json`, admin Tailwind config using the site config as preset, postcss config, CSS entry, `admin/src/types.ts`. Add deps `marked`, `qrcode` and scripts `dev:admin`, `build:admin`, `build:all`, `test:admin`.
Done when: `npm run build:admin` emits `dist-admin/index.html` and hashed `assets/`; a smoke vitest test renders the app root; `npm run build` dist diff vs SP01 baseline empty; typecheck and lint green.

## Task 2 — Firebase init emulator guard + test
What it is: make prod builds free of emulator hosts (PRD Decision 9).
What changes at a high level: edit only the emulator branch of the ported `admin/src/lib/firebase.js` to an inline `import.meta.env.VITE_USE_EMULATORS === 'true'` check; keep idempotent init and SP03 marker comments. Port the old `firebase-init` test cases to vitest.
Done when: vitest covers single init, reuse on re-import, emulator connect only when flag is `'true'`; `npm run build:admin` then `grep -rn "127.0.0.1" dist-admin` returns nothing; `npm run test:data` still green.

## Task 3 — Auth core + AuthProvider
What it is: React replacement for the Svelte auth stores (PRD Auth table).
What changes at a high level: add framework-free `auth-core.js` (verbatim `roleFor`, popup sign-in, sign-out, injectable `onAuth`, `currentRole()`), `AuthProvider` context and `useAuth()`.
Done when: vitest tests: `roleFor` matrix (verified owner, unverified owner, other user, null, case-insensitive email); provider has `authReady` false before the first callback and true after; role flips on simulated sign-in/out; `currentRole()` tracks it.

## Task 4 — Shell, RequireView gate, SignInGate, login
What it is: layout, gate and header (Requirements: gate, header).
What changes at a high level: layout route that awaits auth + `getSettings()`, applies ported `canView`, renders page or `SignInGate`; header with brand, guest Admin link, admin cog + Logout; `/login` page with Google button that returns to `/` once admin; `useLoader` hook that skips when not allowed.
Done when: vitest: guest on hidden page, `/settings`, `/ideas/rank` sees gate and the page loader is never called; admin sees page; non-owner sees "not authorised" + Sign out; nothing role-dependent renders before `authReady`.

## Task 5 — Home and links pages
What it is: simplest pages first (Requirements: home, links).
What changes at a high level: home with Ideas and Links cards only. Links page: list via `listLinks`, add/edit/rename/delete via `saveLink`/`deleteLink`, expiry + expired badge, tags, copy, QR (dynamic `qrcode`), real slash slug in URLs; no Clicks/Last Hit/redirect-type UI; write controls admin-only.
Done when: vitest with mocked data layer: guest sees no write controls; admin save/rename/delete call the right functions with the right args; URL text shows `go.tejitpabari.com/juno/pitch-deck` for slug `juno/pitch-deck`; no Clicks column.

## Task 6 — Ideas list and add-idea flow
What it is: `/ideas` (Requirements: ideas).
What changes at a high level: list via `listIdeas` + `getCriteria` with excerpt, tags, computed score, existing sort and filters; Add Idea calls `ai.parseIdea`, `slugifyTitle`, `createIdea`; bulk reset via `resetAllRankings` then reload; bulk rank uses `ai.rankIdea` + `setRanking` with concurrency 3. Guest has no Add/Rank/Bulk.
Done when: vitest: stub error "AI is not configured yet" shown on Add; concurrency never exceeds 3 (fake rankIdea); guest read-only; list order matches old sort for a fixture.

## Task 7 — Idea detail page
What it is: `/ideas/:slug` (Requirements: ideas detail).
What changes at a high level: load `getIdea` + `getCriteria`, not-found view when missing; status/tags/title/link/github edits via `saveIdeaMeta`; delete then navigate to `/ideas`; enhance preview with `renderMarkdown` then `saveIdeaContent`; single rank/reset via `setRanking`/`resetRanking`; body rendered through the `Markdown` component.
Done when: vitest: each admin edit calls `saveIdeaMeta` with the right partial; delete navigates; guest has no write controls; not-found renders; markdown HTML for a fixture equals `renderMarkdown` output.

## Task 8 — Rank and settings pages
What it is: the two admin-only pages.
What changes at a high level: rank page lists unranked `status==='new'` ideas by title with auto-rank and save-and-next; settings page saves guest visibility (`/`, `/ideas`, `/links` pages array) and criteria with the existing validation messages, "without signing in" copy.
Done when: vitest: guest and non-owner see the gate on both; invalid criteria show the old messages; save calls `saveGuestVisibility`/`saveCriteria`; rank surfaces the AI stub error.

## Task 9 — CLAUDE.md + README admin section
What it is: repo instructions (PRD CLAUDE.md paragraph; required by the plan).
What changes at a high level: new root `CLAUDE.md` with site build notes, admin dev/emulator/build commands, guest read-only rules, rules-as-enforcement, settings `pages` + rules update requirement, admin email drift, static subdomain CSP note, deploy summary placeholder sections for SP04/SP05. README gets a short Admin + hosting targets section.
Done when: both files present; grep finds no pm2, nginx, `/api`, `/linkedin`, `GATEWAY_PASSWORD`, `cc.tejitpabari.com`; manual emulator walkthrough (PRD Acceptance) recorded in the code artifact.

## Owner-only steps
None.
