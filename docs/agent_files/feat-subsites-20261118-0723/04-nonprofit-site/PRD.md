---
status: draft
summary: Nonprofit Home (hero, booking button, consultation statement, 4 accordion services, full project list), Projects page, and a live Schedule page that fetches the published Google Sheet CSV in the browser, parses it with an in-repo RFC4180 parser, and renders pastel status cards.
date: 2026-11-18
---
# PRD: SP04 nonprofit-site
Repo/branch: tejitpabari · `feat/subsites` (stacked on `feat/admin-merge`) · Depends on: 01-multi-site-build, 02-project-content, 03-healthtech-site (`ProjectListSection`) · Owns: `src/pages/nonprofit/{NonprofitHomePage,NonprofitProjectsPage,SchedulePage}.tsx` (+ tests), `src/sections/nonprofit/*` (+ tests), `src/config/nonprofit.ts`, `src/lib/schedule/{parseCsv,schedule,useSchedule}.ts` (+ tests), `src/lib/analytics.ts` (event-name union, additive only)

## TL;DR
Replace SP01's three nonprofit placeholders. Home: hero, "Book a consultation" button, consultation statement, 4 accessible accordion service cards, then the full list via SP03's `ProjectListSection` fed by `projectsForSite('nonprofit')` (3 cards). Projects: same list. Schedule: client-side CSV fetch, parse, map, sort, render. All copy lives in one config file.

## Problem
The nonprofit site needs to convert small-nonprofit visitors into consultation bookings, show relevant work, and publicly show ongoing nonprofit projects without a backend. The owner edits a Google Sheet; the site must reflect it within minutes. Only five columns may ever reach the page; the sheet has private data elsewhere. Verified 2026-11-18: the published CSV (SP01 CSP allows its host) returns headers `Name,Project,Public Blurb,Date Added,Status`, 10 rows, blurbs empty, statuses seen: In review, To do, Waiting, In progress, Done.

## Goals / Non-Goals
- Goals: verbatim approved copy; one clear booking CTA; accessible, mobile-first accordion; robust Schedule that degrades to a friendly message; zero new runtime dependencies; analytics parity with consent rules.
- Non-goals: routes, nav, footer, CSP (SP01); card data (SP02); list component (SP03 owns `ProjectListSection`); admin editing of status; sheet or tab setup (owner); a Public Name column; upcoming dates, contacts, notes on Schedule.

## Requirements
**Home.** Order: hero, consultation statement, Services, "All projects" list.
- Hero text, verbatim: "Small nonprofit teams lose hours every week to work a machine could handle: intake and sign-ups, donor and volunteer follow-ups, event and calendar upkeep, grant and impact reporting, records, and inboxes that never empty. I help you get that time back. I audit how your organization works and where AI fits, build automations and agentic AI workflows that run the busywork end to end, and teach your team to use AI tools efficiently and safely. Free consultations, no obligation." Eyebrow "Nonprofit AI Consulting", H1 "Tejit Pabari" (my call, mirrors SP03).
- Primary button "Book a consultation" to `https://go.tejitpabari.com/meet-ngo`, `target="_blank" rel="noreferrer"` (my call: it is a third-party scheduler, keeps the visitor's place on the site). Repeated once after Services (end-of-section CTA).
- Statement (H2 "What a consultation is"), verbatim: "A consultation is a friendly, no-cost conversation about how your team works today and where AI could help. We look at real tasks, pick one or two worth improving, and agree on a small next step. The aim is practical help you can use right away, and nothing you don't need."
- Services: 4 accordion cards in order below. Closed by default; multiple may be open (no auto-collapse, so a reader can compare).
- List: `ProjectListSection` with `projectsForSite('nonprofit')`, H2 "All projects", `id="projects"`.

**Final service copy (teaser shown closed; paragraph on expand).**
1. AI evaluation. Teaser: "Find where AI helps, and where it doesn't." Body: "I review how your team works today, including the tools you already use and any AI already in the mix. Together we list the repetitive tasks and judge which ones are a real fit for AI and which are better left alone. I flag privacy and accuracy risks in plain language so nothing surprises you later. You leave with a short, clear list of what to try first and what to skip."
2. Automation & AI workflows. Teaser: "Hand off the repetitive work." Body: "I design automations and agentic AI workflows for tasks that come around again and again, such as emails, event details, personal outreach, reports, and record keeping. A person approves the important steps, so you stay in control of what goes out. We build a first working version together, and you get a simple guide so your team can run and adjust it without me. Start with one task and grow from there."
3. AI adoption. Teaser: "Help your team feel confident with AI tools." Body: "I run workshops on what AI can and can't do, with hands-on practice using real examples from your work. I also coach your team on tools you already have, like chat assistants and Copilot, so they get more out of them. We cover efficient everyday use and clear rules for handling sensitive information. The goal is a team that uses AI safely and gets time back."
4. Student & career mentoring. Teaser: "Practical guidance for the next generation." Body: "I mentor students and early-career technologists, especially those from underserved communities. Topics include moving from university to a first job, choosing and finishing projects, and building things on your own. I am also available to mentor or judge at hackathons. Sessions can be one-off, for a group, or ongoing, whichever fits your program."

**Accordion a11y.** Each header is a `<button type="button">` inside an `<h3>`, with `aria-expanded`, `aria-controls` to the panel id; panel is `role="region"` with `aria-labelledby`. Native Enter/Space toggling (no custom key handling beyond focus-visible ring); full-width 44px+ tap target; panel hidden via `hidden` attribute when closed (works prerendered, readable without JS). Fires `service_toggle` on open only.

**Projects page.** H1 "Projects" plus the same `ProjectListSection`. `RouteMeta` below.

**Schedule page.**
- Fetch `NONPROFIT_SCHEDULE_CSV_URL` (from `src/config/nonprofit.ts`, value as in the brief) in `useEffect` only, `fetch(url, { cache: 'no-store' })` with a 10 s `AbortController` timeout, no credentials, no custom headers (keeps it a simple CORS request). Prerender and first client paint render the skeleton, so SSR/hydration match.
- Parser `parseCsv(text): string[][]`: RFC4180 (quoted fields, `""` escape, commas and CR/LF/CRLF inside quotes, trailing newline, BOM stripped). No dependency (about 40 lines; Papa Parse is overkill for one file).
- `toScheduleItems(rows)`: map header row by lowercase trimmed name to the five known columns; any other column is dropped at this step so it can never reach a component (types expose only the five fields). Missing required column (Project or Status or Date Added) throws, giving the error state. Rows with blank Project are skipped.
- Status map: In progress, In review, Waiting -> "In progress"; To do -> "To do"; Done -> "Done"; anything else -> "To do". Case-insensitive, trimmed.
- Order: non-Done rows by Date Added ascending (oldest first, newest at bottom), ties by project name (locale compare); then a "Done" section under its own H2, same ordering. Date parsed as `YYYY-MM-DD` by string split (no `Date` timezone drift); an unparseable date sorts last in its group and shows no date.
- Row display: org name, project (title), Public Blurb only if non-empty, status pill, date "Mon YYYY" (e.g. "Oct 2026").
- Layout (my call): stacked cards on all widths (single column, two columns at `md`), not a table. Blurbs are free text of unknown length and a table forces horizontal scroll at 375px.
- Colors (pill and card accent): Done `bg-green-100 text-green-900`, In progress `bg-blue-100 text-blue-900`, To do `bg-gray-100 text-gray-800`; text on pill must be at least 4.5:1 (tests assert against fixed token pairs). Status also appears as text, never color alone.
- States: loading skeleton (`aria-busy`), error, or zero rows: "Schedule unavailable, check back soon" (one message, `role="status"`). Heading and intro line "What I'm working on with nonprofit partners" always render. A `<noscript>` shows the same message.
- Never render other columns; no raw status string, no notes, contacts or links.

**SEO / RouteMeta (SP01 supplies site URL and OG).** Home: title "Tejit Pabari | Nonprofit AI Consulting", description "Free AI consultations, automations and workshops for small nonprofit teams." (under 160). Projects: "Projects | Nonprofit AI Consulting", description "Automations and AI skills built for nonprofit teams." Schedule: "Schedule | Nonprofit AI Consulting", description "What I am currently working on with nonprofit partners." (no JS-dependent text in descriptions).

**Analytics** (via `trackEvent`, so consent gating and dev/no-ID no-ops come for free). New union members (additive, coordinate with SP03 which also may edit the union): `book_consultation_click` {source: 'hero'|'services'}, `service_toggle` {service: slug, expanded: true}, `schedule_load` {state: 'ok'|'error'|'empty', row_count}. Existing `project_card_click`, `search_query`, `outbound_click` used by the list. The sheet fetch itself is not an analytics event and sends no visitor data to Google beyond a normal HTTPS request (privacy page left unchanged by owner decision).

## Architecture
Copy and URLs live in `src/config/nonprofit.ts` (hero, statement, `SERVICES[]` {slug, title, teaser, body}, `BOOKING_URL`, `NONPROFIT_SCHEDULE_CSV_URL`, status map, status colors), so the PR review of copy is one file.

| Component | Path | Notes |
|---|---|---|
| `NonprofitHero` | `src/sections/nonprofit/` | Heading, hero text, booking button |
| `ConsultationStatement` | same | Presentational |
| `ServicesAccordion` + `ServiceItem` | same | Local `useState<Set<string>>`; no library |
| `ProjectListSection` | SP03 | Reused, not redefined |
| `ScheduleList`, `ScheduleCard`, `StatusPill`, `ScheduleSkeleton` | same | Pure, props only |
| `parseCsv`, `toScheduleItems`, `groupSchedule` | `src/lib/schedule/` | Pure, no React, unit-tested |
| `useSchedule()` | same | `{state: 'loading'|'ok'|'error', items}`; aborts on unmount |

Pages compose these inside `PageContainer`/`RouteMeta`. Booking button uses existing `Button`. No `<form>` or input markup is added except the list's search box, which already exists on main and is not a form element; `check:no-forms` only guards `src/pages/live/`, which does not exist [verified: `scripts/check-no-forms.sh`], so it passes. Em-dash scan covers the new config and content.

## Decisions
| # | Decision | Choice | Alternatives considered | Why |
|---|---|---|---|---|
| 1 | Booking link target | New tab, `rel=noreferrer` | Same tab | Third-party scheduler; visitor keeps their place |
| 2 | CSV parsing | Own RFC4180 parser | Papa Parse | One small file, no new dependency or bundle cost |
| 3 | Schedule layout | Cards, 1 col mobile, 2 col md | Table | Free-text blurbs; no horizontal scroll at 375px |
| 4 | Accordion | Hand-built buttons, multi-open | Radix/headless lib; `<details>` | No dependency; explicit ARIA; `<details>` styling and analytics are awkward |
| 5 | Data fetch timing | Client only, after hydrate | Build-time fetch | Live edits within minutes (brief) |
| 6 | Column safety | Allowlist at mapping step | Filter at render | Private data cannot leak to components or tests |
| 7 | Date handling | String split, "Mon YYYY" | `new Date()` | No timezone shift on 1st of month |
| 8 | Fetch options | Plain GET, no headers | Custom headers | Avoids CORS preflight |
| 9 | Copy home | `src/config/nonprofit.ts` | Inline JSX; markdown | One review point, importable by tests |

## Manual steps (owner)
- Create `Public Blurb` column and `Public` tab; publish CSV (per brief); blurbs are empty today, so cards show title only until filled.
- Review service paragraphs, H1 and eyebrow, button label in the PR.
- Confirm `go.tejitpabari.com/meet-ngo` resolves.

## Risks / Open Questions
- [OPEN] Hero eyebrow "Nonprofit AI Consulting" and H1 "Tejit Pabari" are my call; owner to confirm.
- [OPEN] Which of SP03 or SP04 lands `ProjectListSection` (default: SP03; SP04 blocks on it).
- [OPEN] Shared `AnalyticsEventName` union edited by SP03 and SP04; merge order resolves trivially.
- [OPEN] Sheet CSV is edge-cached (about 5 min); acceptable per brief, no cache-busting param added (it would defeat Google's cache and may break the published URL).
- [OPEN] Org names are public "for now" (owner accepted); Public Name column is the later fix.
- [RESOLVED: verified] CSV is reachable, redirects to googleusercontent with `access-control-allow-origin: *`, headers as expected.
- [RESOLVED: brief] No Done-item pruning; Done rows stay forever, oldest first.
- [DEFERRED] Fallback scheduled sync job if browser fetch fails in production.
- [DEFERRED] Row-count cap or "show more" for long Done lists.

## Acceptance Criteria
- Home test: hero and statement text equal the config strings (no em dash); booking link href, `target="_blank"`, `rel` contains noreferrer, fires `book_consultation_click`; 3 project cards in `projectsForSite('nonprofit')` order; no card for main-only or healthtech-only slugs.
- Accordion test: 4 buttons in the stated order, all `aria-expanded="false"` initially, `aria-controls` resolves to a region; click and keyboard (Tab, Enter, Space) toggle; closed panels `hidden`; multi-open works; expanded text equals config.
- Parser fixtures: quoted comma, escaped quote, newline inside quotes, CRLF, BOM, trailing blank line; header order shuffled; unknown/extra private columns (e.g. "Contact", "Notes") present in input and absent from output and from rendered DOM; missing blurb omitted; unknown status -> To do; missing required column -> error state.
- Ordering tests: non-Done oldest first; ties by project name; Done section last and oldest first; unparseable date last; mapping of In review/Waiting/In progress to In progress.
- Render tests: date shows "Oct 2026"; pill colors per status; skeleton during prerender and loading; fetch reject, non-200, empty body, and header-only CSV each show "Schedule unavailable, check back soon"; hook aborts on unmount; success fires `schedule_load` ok.
- RouteMeta titles and descriptions present for the three pages in `dist-nonprofit/*.html`, no noindex; `/schedule` HTML contains the skeleton, not sheet data.
- Layout checked at 375px: no horizontal scroll, accordion and button tap targets at least 44px; contrast of pill pairs at least 4.5:1.
- `npm run check:launch` and nonprofit `routes.smoke` pass; only affected tests run; no new entry in `package.json` dependencies.
