---
status: draft
summary: Five tasks to extract the shared project list, make detail lookup site-aware, and build the healthtech hero and Home.
date: 2026-11-18
---
# Tasks: SP03 healthtech-site
Source of truth: /root/projects/tejitpabari/.worktrees/feat/subsites/docs/agent_files/feat-subsites-20261118-0723/03-healthtech-site/PRD.md. Replaces 01's placeholder healthtech Home with an approved hero plus the full health project list. No new routes, no `/live`. CI (`ci.yml`) already runs tests on push and PR, so no CI task is needed. Task 1 lands the shared `ProjectListSection` that 04 reuses; 04 edits `AnalyticsEventName` only after this SP.

| # | Task | Depends on | Status |
|---|---|---|---|
| 1 | Extract shared ProjectListSection | none | done |
| 2 | Site-aware ProjectDetailPage lookup | 01:T2, 02:T2 | done |
| 3 | HealthtechHero with Onolys CTA | none | done |
| 4 | HealthtechHomePage: hero plus list plus SEO | 1, 3, 01:T3, 02:T2, 02:T4 | done |
| 5 | Healthtech verification and launch checks | 2, 4, 01:T5 | done |

## Task 1: Extract shared ProjectListSection
What it is / what it means: Main `/projects` already has the search, tag filter, card list and empty state inline. Healthtech and nonprofit (04, twice) need the same block, so it becomes one shared component (Decision 5, resolved: SP03 extracts, SP04 reuses).
What changes at a high level: Add `ProjectListSection({ items })` wrapping `useCollectionFilter` (collection `projects`), `SearchFilter`, `ProjectListCard` (href `/projects/<slug>`, no `live`), and `EmptyState`. Switch `ProjectsPage` to it with its current global list. Behavior and markup of main stay identical.
Done when: a component test proves search narrows results and updates the count, a tag pill filters, clearing from `EmptyState` restores the list, and input order is kept with no query; the existing `ProjectsPage` test passes unchanged; `project_card_click` still fires with slug, collection and title.

## Task 2: Site-aware ProjectDetailPage lookup
What it is / what it means: Detail pages must only resolve slugs in the current site's set so nothing leaks across sites (Decision 4).
What changes at a high level: In `ProjectDetailPage`, the slug lookup changes from the global `projects` array to `projectsForSite(SITE)`. Slugs outside the site render `NotFoundPage`. Main returns all projects, so its behavior is identical. No other edits to the page.
Done when: tests show a healthtech slug renders under `SITE=healthtech`, `clip-verse` renders `NotFoundPage` there, no rendered `href` on a healthtech detail page matches `/live`, and the existing main detail test passes unchanged.

## Task 3: HealthtechHero with Onolys CTA
What it is / what it means: A small healthtech-only hero, not a parametrized main `Hero`, since main's has resume, portrait and a contact link (Decisions 1, 7, 8). Owner accepted heading, CTA label and no portrait.
What changes at a high level: Add `HealthtechHero`: eyebrow "Health Tech Builder", H1 "Tejit Pabari", sub-label "Health tech projects", the verbatim approved paragraph, and a "Visit Onolys" button to `https://onolys.com` (`target="_blank"`, `rel="noreferrer"`) firing `outbound_click` with `source: 'healthtech_hero'`. Reuse main Hero's type scale and `bg-cream`. Single column, CTA full width under 400px. Confirm `source` accepts this value in `analytics.ts`; touch the event-name union only if it does not (no new event names).
Done when: a test asserts the paragraph equals the approved copy exactly with no em dash, the link has the right href, target and rel, and a click fires `outbound_click` with `source: 'healthtech_hero'`. Typecheck passes.

## Task 4: HealthtechHomePage: hero plus list plus SEO
What it is / what it means: Replace 01's placeholder Home with hero then the full health list under an "All projects" H2 (`id="projects"`), newest first, all 7 cards, no "Latest 6".
What changes at a high level: Compose `HealthtechHero` and `ProjectListSection` fed by `projectsForSite('healthtech')`, inside `PageContainer`. Add `RouteMeta`: title "Tejit Pabari | Health Tech", description from the hero first sentence trimmed under 160 characters, path `/`. Order relies on the seam, not a hook sort option (Decision 2).
Done when: the Home test checks the hero copy, a link to `https://onolys.com`, and that 7 cards render in the exact order of `projectsForSite('healthtech')` (never a hardcoded list); a filter test covers query, tag pill, empty-state clear and newest-first order with no query; no `/live` href and no `clip-verse` or `auto-emailer` appears; `RouteMeta` title and description render; clicking a card fires `project_card_click`.

## Task 5: Healthtech verification and launch checks
What it is / what it means: Prove the acceptance criteria on the real healthtech output.
What changes at a high level: Run the affected tests only, build with `SITE=healthtech`, and inspect the result. Review the Onolys card for early-stage wording with no customer claims (SP02 owns the copy, verified here). Check layout at 375px. Fix gaps only within this SP's scope.
Done when: `routes.smoke` for healthtech and `npm run check:launch` (no em dashes) pass; `dist-healthtech/index.html` has the Home title and description and no noindex; at 375px there is no horizontal scroll, the CTA is tappable and the Website button is visible; the Onolys card copy is confirmed. Full suite is left to dev-ship.

## Manual steps (owner)
- Review hero heading and CTA label in the PR.
- Confirm `https://onolys.com` resolves before publish.
