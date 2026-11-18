---
status: approved
summary: Add a validated `sites:` frontmatter field and a `projectsForSite(site)` seam (newest first), split Juno into three cards, add five new cards, and tag every card with the sites it belongs to.
date: 2026-11-18
---
# PRD: SP02 project-content
Repo/branch: tejitpabari · `feat/subsites` (stacked on `feat/admin-merge`) · Depends on: none · Owns: `src/data/projects.ts` (+ `projects.test.ts`), `src/data/shared.ts` (only if a shared `SiteId` helper lands there), `src/content/projects/*.md` (juno.md renamed, new files incl. thepass.md), `src/config/featured.ts` (+ `featured.test.ts`), the `/projects/juno/live` entry in `firebase.json`

## TL;DR
Content and schema only. Cards gain an optional `sites:` array (default `[main]`). `src/data` exports `SITE_IDS`, `SiteId` and `projectsForSite(site)`, which filters by `sites` and sorts by `date` newest first. Juno becomes three cards (`juno-app`, `juno-website`, `juno-chatgpt-plugin`) with no redirect from the old slug. Seven new cards are added (incl. thepass). No page, route or build-script code changes.

## Problem
Every project file is main-site only and the loader rejects unknown keys [verified: `ALLOWED_KEYS` + `assertNoUnknownKeys` in `src/data/projects.ts`], so the healthtech and nonprofit sites have nothing to filter on. Juno is one card covering three separate things, and five projects the owner wants shown do not exist as cards.

## Goals / Non-Goals
- Goals: one file per project; correct per-site membership; main `/projects`, Home, OG cards and sitemap work unchanged and pick up new slugs automatically; every old `juno` slug reference fixed.
- Non-goals: per-site pages, nav, routes, builds, CSP (SP01); healthtech/nonprofit Home (SP03/SP04); swapping plugin hrefs to Pages URLs (SP05); editing juno stats or `site.ts` `DEFAULT_DESCRIPTION`.

## Requirements
- `sites` optional in frontmatter: non-empty array of `main|healthtech|nonprofit`, no duplicates, default `['main']`. Bad value or empty array throws at parse with the file path.
- `Project.sites: SiteId[]` is always populated after parsing (never undefined), so consumers need no default logic.
- `ProjectTag` gains `'Nonprofit'`.
- Seam (SP01, SP03, SP04 rely on this): `projectsForSite(site: SiteId): Project[]` exported from `@/data`, returns matching projects sorted by `date` descending (ties by `title`), a fresh array each call. `SITE_IDS` / `SiteId` are defined here so SP01 imports them instead of redefining. The existing `projects` export stays the full list (main uses it unchanged, already date-desc).
- Old `/projects/juno` and `/projects/juno/live` no longer exist; no redirect added.
- No em dashes or form markup in new copy (`check:no-em-dash` scans all `src/content/**/*.md`).
- Onolys copy: early stage, no customer or validation claims.

## Architecture
Parse path: frontmatter `sites` -> `assertSites` (new, in `shared.ts` or local to `projects.ts`) -> `Project.sites`. Add `'sites'` to `ALLOWED_KEYS`. `projectsForSite` is a pure function over the parsed array, so SP01's per-site build filters at render and prerender time with no new glob.

Juno split: `git mv juno.md juno-app.md`, set `slug: juno-app`, title "Juno app", keep body and stats, primary link App (`https://app.meetjuno.health/`), website link kept as a secondary link, `date` kept at existing 2025-06-01 (owner override of brief). Two new files for the website and plugin.

Cards (all image = the existing Unsplash URL pattern; body = one short paragraph from the description; no `live`):

| Slug | Title | Date | Status | Tags | Primary link | sites |
|---|---|---|---|---|---|---|
| onolys | Onolys | 2026-09-01 | Building | Health Tech | https://onolys.com | main, healthtech |
| juno-app | Juno app | 2025-06-01 | Building | Health Tech | https://app.meetjuno.health/ | main, healthtech |
| juno-website | Juno website | 2026-08-30 | Completed | Health Tech | https://meetjuno.health/ | main, healthtech |
| juno-chatgpt-plugin | Juno ChatGPT plugin | 2026-09-22 | Building | Health Tech | https://github.com/tejitpabari99/simplify-med-plugin | main, healthtech |
| hospital-bill-checker | Hospital Bill Checker | 2026-03-30 | Completed | Health Tech | https://github.com/tejitpabari99/hospital-bill-checker | main, healthtech |
| partner-event-finder | Partner Event Finder | 2026-11-06 | Building | Nonprofit | https://github.com/tejitpabari99/sparehand-plugin/blob/main/docs/skills/partner-event-finder.md | main, nonprofit |
| install-automation | Install Automation | 2026-11-10 | Building | Nonprofit | https://github.com/tejitpabari99/sparehand-plugin/blob/main/docs/skills/install-automation.md | main, nonprofit |
| auto-emailer | Auto Emailer | 2026-11-17 | Building | Nonprofit | https://tejitpabari99.github.io/sparehand-auto/ | main, nonprofit |
| thepass | thepass | 2026-11-06 | Building | Developer Tools | https://github.com/tejitpabari99/thepass (label GitHub) | main |

thepass data: description "Shareable developer skills for AI coding tools: a full dev workflow (brainstorm, design, tasks, code, review, ship), deep research, and Google Drive index skills."; techTags e.g. Claude Code, AI Agents, Skills, Plugin Design; Unsplash image, same pattern; `sites` omitted (default `[main]`).

Existing cards: `med-doc-tracker`, `smarttest` get `sites: [main, healthtech]`; `clip-verse`, `columbia-virtual-campus`, `crunchy-filler` stay default (main only). Icons from the registry (`github`, `globe`, `external-link`, `file-text`). techTags: builder picks sensible ones from the repo READMEs.

Sparehand dates [verified via `gh api` oldest commit touching the path]: partner-event-finder.md first touched 2026-11-06 (5c1f4fd, "First version" of the plugin); install-automation.md 2026-11-10 (4078159); `google-scripts/auto-emailer` 2026-11-17 (c594f97). The partner-event-finder date predates the file's own creation if it was renamed after the first commit; builder re-checks with `git log --follow`.

Reference sweep [verified by grep of `src scripts firebase.json tests admin hosting`]. Must change:
- `src/config/featured.ts:17` `'juno'` -> `'juno-app'` (throws on unknown slug).
- `src/config/featured.test.ts:32` mock slug `'juno'` -> `'juno-app'`; its `proj()` helper needs `sites: ['main']` since `Project.sites` is required.
- `src/data/projects.test.ts:19` asserts the juno Website link; retarget to `juno-website` (primary, globe).
- `firebase.json`: delete the `/projects/juno/live` redirect entry.
Leave alone (string fixtures only, not coupled to the real slug): `vite.config.test.ts`, `generate-sitemap.test.ts`, `RouteMeta.test.tsx`, `LiveRedirectFallback.test.tsx`, `ProjectLivePage.test.tsx` (mocked project), `resolveLiveLinks.test.ts`, `normalize-ssg-build-id.test.ts`. `migration/`, `admin/`, `tests/` hits are admin link slugs, unrelated. Any other test that builds a typed `Project` literal needs `sites` (`tsc` will flag them).

## Decisions
| # | Decision | Choice | Alternatives considered | Why |
|---|---|---|---|---|
| 1 | Where `sites` default lives | Applied at parse; `Project.sites` required | Optional field, default at each consumer | One place, no per-site `?? ['main']` bugs |
| 2 | Seam name and home | `projectsForSite(site)` in `src/data/projects.ts`, re-exported by `@/data` | Filter inside each page | 01/03/04 share one tested filter and sort |
| 3 | Sort in seam | date desc, ties by title | Rely on the pre-sorted array | Brief: all subsite lists newest first; makes it explicit |
| 4 | Where `SiteId` is defined | Here (`SITE_IDS` const) | SP01 defines it | SP02 has no dependencies; SP01 imports |
| 5 | Old juno URLs | Removed, no redirect (owner) | Redirect to juno-app | Locked in brief |
| 6 | `/live` redirects | Untouched mechanism; `vite.config.ts` plugin regenerates `firebase.json` on build, so commit the regenerated entries | Hand-edit entries | The plugin does a full replace, so a hand-edit is overwritten anyway |
| 7 | Sparehand plugin hrefs | GitHub markdown now | Wait for Pages | SP05 swaps later (in `src/content` only) |
| 8 | Juno app date | Keep existing 2025-06-01 (owner, 2026-11-18) | 2026-09-07 per brief | Owner override; body covers older validation work |
| 9 | Card tags | Juno ChatGPT plugin: Health Tech only; Sparehand cards: Nonprofit only; no Developer Tools (owner) | Add Developer Tools | Owner |
| 10 | thepass card | Main only, tag Developer Tools (owner) | Skip | Owner request |

## Manual steps
- Owner confirms `app.meetjuno.health` is the simplify-med deployment (brief's open risk) before publish.
- Owner reviews card copy in the PR.

## Risks / Open Questions
- [RESOLVED: owner chose 2025-06-01, overriding the brief's 2026-09-07] Juno app date.
- [RESOLVED: owner chose Health Tech only for the plugin and Nonprofit only for Sparehand cards; no Developer Tools] Tag choice.
- [RESOLVED: owner added thepass card, main only, Developer Tools] New card.
- [RESOLVED: grep] `check:launch` only checks work-experience `DRAFT_DATE` plus no-forms and no-em-dash, so new cards need no extra fields.
- [RESOLVED: grep] OG cards and sitemap glob `src/content/projects` and need no code change; `public/og/` is gitignored and built.
- [RESOLVED: brief] `site.ts` `DEFAULT_DESCRIPTION` still says "Building Juno"; left untouched.
- [DEFERRED] Sparehand href swap to Pages URLs (SP05). Privacy/ProjectsPage prose mentioning Juno stays.
- Risk: SP01's `liveRedirectsPlugin` must stay main-only, or subsite builds would also write these redirects into `firebase.json`.

## Acceptance Criteria
- `parseProject` accepts `sites: [healthtech]`, defaults to `['main']`, and throws on `sites: [foo]`, `sites: []` and duplicates (new tests).
- `projectsForSite('healthtech')` returns exactly onolys, juno-app, juno-website, juno-chatgpt-plugin, hospital-bill-checker, med-doc-tracker, smarttest, newest first; `'nonprofit'` returns exactly the three Sparehand cards; `'main'` returns all 14 projects (tests assert this).
- `juno.md` is gone; `/projects/juno` is not in the build output; firebase.json has no `/projects/juno/live`.
- `FEATURED_PROJECT_SLUGS` contains `juno-app`; `featured.test.ts` and `npm run typecheck` pass.
- Main `/projects` and Home render all cards; OG cards and sitemap include each new slug.
- `npm run check:launch` passes (no em dashes).
- Only the affected tests are run (`projects.test.ts`, `featured.test.ts`, content seam); full suite is dev-ship's job.
