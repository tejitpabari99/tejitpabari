---
status: draft
summary: Add validated `sites:` frontmatter and `projectsForSite` seam, split Juno into three cards, add new cards, tag every card by site.
date: 2026-11-18
---
# Tasks: SP02 project-content
Source of truth: /root/projects/tejitpabari/.worktrees/feat/subsites/docs/agent_files/feat-subsites-20261118-0723/02-project-content/PRD.md. Content and schema only: no page, route or build-script code changes. CI (`ci.yml`) already runs tests on push and PR, so no CI task is needed.

| # | Task | Depends on | Status |
|---|---|---|---|
| 1 | `sites` schema, `SiteId`, new tag | none | done |
| 2 | `projectsForSite` seam | 1 | done |
| 3 | Juno split and slug reference sweep | 1 | done |
| 4 | New cards and site tagging of existing cards | 1, 3 | done |
| 5 | Seam membership tests and launch checks | 2, 3, 4 | done |

## Task 1: `sites` schema, `SiteId`, new tag
What it is / what it means: Cards get an optional `sites` list saying which site(s) show them. `SITE_IDS` and `SiteId` are defined here so SP01 imports them (Decision 4). `Project.sites` is always filled, so consumers never default it (Decision 1).
What changes at a high level: Allow `sites` as a frontmatter key. Validate it as a non-empty array of `main|healthtech|nonprofit` with no duplicates, defaulting to `['main']`, throwing with the file path on bad input. Make `Project.sites` required. Add `'Nonprofit'` to `ProjectTag`. Export `SITE_IDS` and `SiteId` from `@/data`.
Done when: new `projects.test.ts` cases pass: `sites: [healthtech]` accepted, omitted gives `['main']`, and `[foo]`, `[]` and duplicates throw with the file path. `npm run typecheck` passes after fixing any typed `Project` literal that now needs `sites`.

## Task 2: `projectsForSite` seam
What it is / what it means: One shared, tested filter and sort that SP01, SP03 and SP04 use instead of filtering in pages (Decisions 2, 3).
What changes at a high level: Add `projectsForSite(site)` to `src/data/projects.ts`, re-exported by `@/data`. It filters by `sites`, sorts by `date` descending with ties by `title`, and returns a fresh array each call. The existing `projects` export stays the full list, unchanged.
Done when: tests using fixture projects prove correct filtering per site, newest-first order, title tie-break, and that mutating the returned array does not affect later calls or `projects`.

## Task 3: Juno split and slug reference sweep
What it is / what it means: Juno becomes separate cards, and the old `juno` slug disappears with no redirect (Decision 5, owner override of date in Decision 8).
What changes at a high level: `git mv` `juno.md` to `juno-app.md`, set slug `juno-app`, title "Juno app", keep body and stats, primary link App, website kept as a secondary link, date kept 2025-06-01, `sites: [main, healthtech]`. Fix every reference: `FEATURED_PROJECT_SLUGS` to `juno-app`, the `featured.test.ts` mock slug and its `proj()` helper (add `sites: ['main']`), the `projects.test.ts` Juno Website assertion retargeted to `juno-website`, and delete the `/projects/juno/live` entry from `firebase.json` (committing the plugin-regenerated entries, Decision 6).
Done when: `juno.md` is gone, `firebase.json` has no `/projects/juno/live`, and `featured.test.ts` and the updated `projects.test.ts` pass. Note the `juno-website` card is created in Task 4, so that retargeted assertion goes green there.

## Task 4: New cards and site tagging of existing cards
What it is / what it means: One file per project with correct site membership (Decisions 7, 9, 10).
What changes at a high level: Add `onolys`, `juno-website`, `juno-chatgpt-plugin`, `hospital-bill-checker`, `partner-event-finder`, `install-automation`, `auto-emailer` and `thepass` per the PRD card table: title, date, status, tags, primary link, `sites`, Unsplash image pattern, short one-paragraph body, no `live`. thepass is main only with tag Developer Tools. Sparehand cards link GitHub markdown or Pages as listed and use tag Nonprofit only. Onolys copy states early stage with no customer or validation claims. No em dashes or form markup. Builder re-checks the partner-event-finder date with `git log --follow`. Tag `med-doc-tracker` and `smarttest` as `[main, healthtech]`; leave `clip-verse`, `columbia-virtual-campus`, `crunchy-filler` default.
Done when: every new file parses via the loader tests, the retargeted `juno-website` assertion in `projects.test.ts` (primary link, globe icon) passes, and `npm run check:no-em-dash` passes.

## Task 5: Seam membership tests and launch checks
What it is / what it means: Proof the real content matches the PRD acceptance criteria and main-site output is unaffected.
What changes at a high level: Add content-level tests asserting exact membership of the real parsed data. Run the affected checks only.
Done when: tests assert `projectsForSite('healthtech')` is exactly onolys, juno-app, juno-website, juno-chatgpt-plugin, hospital-bill-checker, med-doc-tracker, smarttest, newest first; `'nonprofit'` is exactly the three Sparehand cards; `'main'` returns all 14 projects. `projects.test.ts`, `featured.test.ts`, `npm run typecheck` and `npm run check:launch` pass. OG card and sitemap generation include each new slug and exclude `juno`. Full suite is left to dev-ship.

## Manual steps
- Owner confirms `app.meetjuno.health` is the simplify-med deployment before publish.
- Owner reviews card copy in the PR.
- Deferred to SP05: swapping Sparehand hrefs to Pages URLs. Risk to watch in SP01: `liveRedirectsPlugin` must stay main-only.
