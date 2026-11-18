---
status: draft
summary: 8 tasks: nonprofit config and analytics events, CSV parser, schedule mapping and hook, Home sections and accordion, Schedule components, page wiring, launch verification.
date: 2026-11-18
---
# Tasks: SP04 nonprofit-site
Source of truth: /root/projects/tejitpabari/.worktrees/feat/subsites/docs/agent_files/feat-subsites-20261118-0723/04-nonprofit-site/PRD.md. Replaces SP01's three nonprofit placeholders with the real Home, Projects and live Schedule pages. Reuses SP02's `projectsForSite('nonprofit')` and SP03:T1 `ProjectListSection`; adds no runtime dependency. Cross-SP deps use "NN:TM".

| # | Task | Depends on | Status |
|---|---|---|---|
| 1 | Nonprofit config and analytics events | 01:T3, 03:T3 | todo |
| 2 | CSV parser | none | todo |
| 3 | Schedule mapping, grouping, hook | 1, 2 | todo |
| 4 | Home sections and accordion | 1 | todo |
| 5 | Schedule components | 1, 3 | todo |
| 6 | Pages, RouteMeta, wiring | 01:T3, 02:T2, 03:T1, 4, 5 | todo |
| 7 | Prerender and launch checks | 6 | todo |
| 8 | Responsive and contrast checks | 6 | todo |

## Task 1: Nonprofit config and analytics events
What it is / what it means: One config file holds all nonprofit copy and URLs so PR review of copy is a single place. Three new analytics event names let the new UI report through the existing consent-gated `trackEvent`.
What changes at a high level: Add `src/config/nonprofit.ts` with hero text, eyebrow, H1, statement, the 4 services (slug, title, teaser, body, verbatim from the PRD), booking URL, schedule CSV URL, status map and status colors. Add `book_consultation_click`, `service_toggle`, `schedule_load` to the event-name union, additive only, on top of 03's edit.
Done when: a config test asserts the four services in order, no em dash anywhere in config strings, booking URL and CSV URL values, and the status color pairs; a type-level or unit check shows the three new events accepted by `trackEvent` payloads. Only these tests run.

## Task 2: CSV parser
What it is / what it means: A small in-repo RFC4180 parser, so no Papa Parse dependency (Decision 2).
What changes at a high level: Add `src/lib/schedule/parseCsv.ts` returning `string[][]`. Handles quoted fields, escaped quotes, commas and CR/LF/CRLF inside quotes, trailing newline, and a leading BOM.
Done when: fixture tests (written first) cover quoted comma, escaped quote, newline inside quotes, CRLF, BOM, trailing blank line, and empty input.

## Task 3: Schedule mapping, grouping, hook
What it is / what it means: The safety and ordering core. Only five columns may ever leave the mapping step (Decision 6), and the data hook feeds the page.
What changes at a high level: Add `toScheduleItems(rows)` mapping headers by lowercase trimmed name to Name, Project, Public Blurb, Date Added, Status; drop all other columns; throw on missing Project, Status or Date Added; skip blank-Project rows; apply the status map (unknown to To do). Add `groupSchedule` (non-Done oldest first, ties by project name, then Done group same order, unparseable date last, `YYYY-MM-DD` string split, "Mon YYYY" label). Add `useSchedule()` returning loading, ok or error plus items; plain GET with `cache: 'no-store'`, no headers or credentials, 10 s abort timeout, abort on unmount, fetch only inside `useEffect`.
Done when: tests cover shuffled headers, extra private columns (Contact, Notes) absent from output, missing required column errors, unknown status, all ordering cases, and date label "Oct 2026". Hook tests cover fetch reject, non-200, empty body, header-only CSV (all error or empty), abort on unmount, and `schedule_load` fired with state and row_count.

## Task 4: Home sections and accordion
What it is / what it means: The conversion-focused Home content: hero with booking button, consultation statement, and 4 accessible service cards.
What changes at a high level: Add `NonprofitHero`, `ConsultationStatement`, `ServicesAccordion` and `ServiceItem` under `src/sections/nonprofit/`. Booking button uses the existing `Button`, opens a new tab with `rel=noreferrer`, fires `book_consultation_click` with source. Accordion: button inside h3, `aria-expanded`, `aria-controls`, region panel with `aria-labelledby`, `hidden` when closed, multi-open via local Set state, `service_toggle` on open only, 44px+ tap target, focus-visible ring. A second booking CTA with source `services` follows the accordion.
Done when: tests assert hero and statement text equal config, link href/target/rel, both CTA events, 4 buttons in order all collapsed at start, aria-controls resolves to a region, click plus keyboard (Tab, Enter, Space) toggling, multi-open, panels hidden when closed, and expanded text equals config.

## Task 5: Schedule components
What it is / what it means: Pure presentational pieces that render only the five allowed fields as pastel status cards.
What changes at a high level: Add `ScheduleList`, `ScheduleCard`, `StatusPill`, `ScheduleSkeleton` under `src/sections/nonprofit/`. Cards show org name, project, blurb only if non-empty, pill with status text, and date label. Single column, two at `md`. Skeleton is `aria-busy`. One "Schedule unavailable, check back soon" message with `role="status"` for error or zero rows. Done items sit under their own H2.
Done when: render tests assert pill color classes per status, status shown as text, blurb omitted when empty, Done section last, skeleton during loading, the unavailable message for error and empty states, and no private column text in the DOM.

## Task 6: Pages, RouteMeta, wiring
What it is / what it means: Replace SP01 placeholders so the nonprofit routes serve the real pages.
What changes at a high level: Implement `NonprofitHomePage` (hero, statement, Services, then `ProjectListSection` with `projectsForSite('nonprofit')`, H2 "All projects", `id="projects"`), `NonprofitProjectsPage` (H1 "Projects" plus the same list) and `SchedulePage` (heading and intro line "What I'm working on with nonprofit partners" always rendered, hook-driven states, `<noscript>` with the same message). Add RouteMeta titles and descriptions per the PRD. Keep placeholders' route paths unchanged.
Done when: page tests assert 3 project cards in `projectsForSite('nonprofit')` order with no main-only or healthtech-only slugs, correct RouteMeta per page, Schedule heading present in every state, and the noscript message. Existing SP01 route tests still pass.

## Task 7: Prerender and launch checks
What it is / what it means: Proves the static output is correct and SSR/hydration safe.
What changes at a high level: Extend or add nonprofit smoke assertions against the built nonprofit output; make no feature changes unless a check fails.
Done when: `dist-nonprofit/*.html` for the three pages has the expected title and description with no noindex; `/schedule` HTML contains the skeleton and no sheet data; `npm run check:launch` and the nonprofit `routes.smoke` pass; `check:no-forms` and the em-dash scan pass; `package.json` dependencies unchanged.

## Task 8: Responsive and contrast checks
What it is / what it means: Verifies the mobile-first and accessibility acceptance criteria.
What changes at a high level: Add an automated contrast test over the fixed status token pairs; check layout at 375px for the three pages.
Done when: pill pairs assert at least 4.5:1; at 375px there is no horizontal scroll and the accordion headers and booking buttons are at least 44px tall (browser check results recorded in the task commit message or code artifact).

## Manual steps (owner)
- Create the `Public Blurb` column and `Public` tab, and publish the CSV; blurbs are empty today so cards show titles only until filled.
- Review service paragraphs, H1, eyebrow and button label in the PR.
- Confirm `go.tejitpabari.com/meet-ngo` resolves.
- Deferred, not in scope: fallback sync job if the browser fetch fails in production; Done-list cap or "show more".
