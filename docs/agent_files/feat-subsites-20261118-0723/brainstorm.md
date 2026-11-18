---
status: approved
summary: Turn healthtech. and nonprofit. coming-soon pages into real sites built from the main site's code, with a live Google-Sheet-driven nonprofit schedule.
date: 2026-11-18
---

# Brainstorm: healthtech + nonprofit subsites

## TL;DR
Build healthtech.tejitpabari.com and nonprofit.tejitpabari.com as two extra builds of the existing vite-react-ssg site (one codebase, a SITE switch), so they reuse the same project cards, search and tag filter. Projects stay one markdown file each with a new `sites:` field. The nonprofit Schedule page reads a published Google Sheet tab live in the browser, so editing the sheet updates the site within about 5 minutes. Stacked on feat/admin-merge (which adds the hosting targets).

## Problem
The owner wants focused sites for two audiences. Health tech: show the journey and health projects, ending at the current venture, Onolys. Nonprofit: present the owner as a free, volunteer nonprofit AI consultant, with services, a booking button, projects (Sparehand plugin skills and automations), and a public view of ongoing nonprofit work. Today both subdomains are static "Coming soon" pages in hosting/healthtech and hosting/nonprofit.

## Decision log
| Decision | Alternative rejected | Why |
|---|---|---|
| One codebase, SITE=main/healthtech/nonprofit builds to dist/, dist-healthtech/, dist-nonprofit/ (owner approved) | Separate React apps; hand-written HTML | Same look and search with no duplicated components |
| Projects filtered by `sites:` frontmatter field, one file per project (orchestrator, owner agreed) | Copies per site | No drift |
| Main site keeps all projects; adds Onolys, Juno app, Juno website, Juno ChatGPT plugin, Hospital Bill Checker, and the 3 Sparehand cards (owner) | Main unchanged | Owner: main site has all projects |
| Existing single Juno card is replaced by 3 cards on both sites: Juno app, Juno website, Juno ChatGPT plugin (owner) | Keep one card | Owner request |
| Healthtech projects: Onolys, Juno app, Juno website, Juno ChatGPT plugin, Hospital Bill Checker, Med-Doc Tracker (existing med-doc-tracker), SMARTtest (owner) | Leave SMARTtest off | Owner added it |
| Keep juno.md stats as-is (owner) | Reconcile with business plan's 175-survey number | Not asked to change |
| Healthtech hero = draft 1 "builder" (owner) | Patient-first, journey drafts | Owner pick |
| Nonprofit hero = pain-led, broad automations, audit + efficient AI use, free (owner, revised) | Mission-led | Pairs with Book button |
| Schedule data = browser fetch of published-to-web CSV of a `Public` tab only (owner) | Scheduled sync job; admin editing | Live, no backend; private columns never published |
| No throwaway CSP spike; build it directly (owner) | Spike first | Owner call; fallback = scheduled sync job if CSV fetch fails |
| Schedule shows: org name, project, Public Blurb, status, date added. No upcoming date, contacts, notes, next action, folders (owner) | Show description | Descriptions name contact people |
| Org names shown for now (owner, "a for now") | Public Name column | Can revisit |
| Status mapping: In progress/In review/Waiting -> In progress; To do; Done (owner) | Show raw statuses | Owner |
| Order: open rows oldest first (newest at bottom), then Done section at bottom also oldest first (owner) | Newest first | Owner |
| Colors light and gentle pastel: Done green, In progress soft blue, To do soft grey (owner + orchestrator) | Strong colors | Owner |
| Status editing in admin dropped (orchestrator, follows from live sheet) | Admin editor | Sheet is the source of truth |
| Plugin skill cards link to GitHub Pages of sparehand-plugin; enable Pages there and remove docs/nonprofit-guide.pdf + README link, in a separate PR in that repo (owner) | Link markdown on GitHub | Owner |
| Automation cards link to https://tejitpabari99.github.io/sparehand-auto/ (exists) | | Verified live |
| Nonprofit cards: Partner Event Finder, Install Automation, Auto Emailer; skip start + share-feedback; one card per future skill/automation (owner) | | |
| Book a consultation -> go.tejitpabari.com/meet-ngo (owner's cal.com link) | Google Calendar | Owner |
| Services: 4 tap-to-expand (accordion) cards in order AI evaluation, Automation & AI workflows, AI adoption (includes workshops, efficient AI use), Student & career mentoring (owner order; accordion = orchestrator, mobile-friendly) | Popup modal; separate workshops card | Owner merged workshops into adoption |
| Both subdomains: "Website" button top right -> tejitpabari.com; footer with main site Privacy + Terms, GitHub, LinkedIn, obfuscated email (owner) | | |
| Both subdomains indexable: remove noindex, add sitemap/robots (owner) | Keep noindex | |
| Same GA + consent banner as main (orchestrator) | No analytics | Policies then apply as written |
| Branch stacks on feat/admin-merge (orchestrator) | Off origin/main | Hosting targets exist only there |

## Design
### Build
- `SITE` env selects: routes, nav, hero/home content, project filter, RouteMeta base URL, sitemap/OG output. Default SITE=main keeps today's build byte-for-byte equivalent in behavior.
- firebase.json: nonprofit and healthtech targets switch `public` from hosting/<site> to dist-<site>; CSP per target updated (connect-src for docs.google.com and any googleusercontent redirect host for the CSV). build:all and CI build all three; merge deploys all.
- hosting/healthtech and hosting/nonprofit static files retired.

### Sites
| Site | Nav | Pages |
|---|---|---|
| healthtech | Home, Website button (top right) | Home = hero + projects list (search, tag filter, same ProjectListCard), project detail pages as on main |
| nonprofit | Home, Projects, Schedule, Website button | Home = hero, Book a consultation button, "what a consultation is" statement, 4 accordion service cards, projects list. Projects = full list sorted newest first, search + tags. Schedule = live sheet view |
Both share the footer.

### Schedule data
- Owner creates column `Public Blurb` on tab "Project Priority" and a tab `Public` using a QUERY formula selecting only Name, Project, Public Blurb, Date Added, Status from "Project Priority"; then File > Share > Publish to web > tab Public > CSV. Owner pastes the CSV URL; it becomes a config constant.
- Page fetches CSV client-side, parses (handle quoted commas/newlines), maps status, sorts, renders. Prerender shows a placeholder. Fetch failure shows "Schedule unavailable, check back soon". Empty blurb -> title only.

### Copy (approved direction; final text reviewed in PR)
- Healthtech hero: "I build tools that make healthcare easier to understand, from a self-testing app to an AI companion for doctor visits and plain-language care plans. Today I'm building Onolys, AI that helps check the quality of clinical assessments." Onolys card says early stage, no customer claims.
- Nonprofit hero: "Small nonprofit teams lose hours every week to work a machine could handle: intake and sign-ups, donor and volunteer follow-ups, event and calendar upkeep, grant and impact reporting, records, and inboxes that never empty. I help you get that time back. I audit how your organization works and where AI fits, build automations and agentic AI workflows that run the busywork end to end, and teach your team to use AI tools efficiently and safely. Free consultations, no obligation."
- Consultation statement: "A consultation is a friendly, no-cost conversation about how your team works today and where AI could help. We look at real tasks, pick one or two worth improving, and agree on a small next step. The aim is practical help you can use right away, and nothing you don't need."
- Service cards (teaser / expanded):
  - AI evaluation: "Find where AI helps, and where it doesn't." Review how the team works and current tools incl. AI; list repetitive tasks and judge fit; flag privacy/accuracy risks; leave with a plain list of what to try first and skip.
  - Automation & AI workflows: "Hand off the repetitive work." Design automations and agentic workflows for recurring tasks (emails, event details, personal outreach, reports, records); a person approves key steps; build first version together with a guide.
  - AI adoption: "Help your team feel confident with AI tools." Workshops on what AI can and can't do with hands-on practice; coaching on existing tools (chat assistants, Copilot); efficient, safe everyday use with rules for sensitive info.
  - Student & career mentoring: "Practical guidance for the next generation." Mentoring students and early-career technologists, esp. underserved; university-to-career, projects, independent building; hackathon mentoring/judging; one-off, group or ongoing.

### Project cards (new)
| Title | Link | Date | Sites |
|---|---|---|---|
| Onolys | https://onolys.com | 2026-09-01 | main, healthtech |
| Juno app | https://app.meetjuno.health (repo simplify-med) | 2026-09-07 | main, healthtech |
| Juno website | https://meetjuno.health (repo juno-landing-page) | 2026-08-30 | main, healthtech |
| Juno ChatGPT plugin | https://github.com/tejitpabari99/simplify-med-plugin | 2026-09-22 | main, healthtech |
| Hospital Bill Checker | https://github.com/tejitpabari99/hospital-bill-checker | 2026-03-30 | main, healthtech |
| Med-Doc Tracker, SMARTtest | existing | existing | add healthtech |
| Partner Event Finder | sparehand-plugin Pages skill URL (path set when Pages is enabled) | from git | main, nonprofit |
| Install Automation | same | from git | main, nonprofit |
| Auto Emailer | https://tejitpabari99.github.io/sparehand-auto/ | from git log of its folder | main, nonprofit |
Descriptions/tags: from the research drafts (Onolys: AI quality control for clinician-rated assessments, early stage; Juno app: upload a clinical note, get a plain summary and next steps; Juno website: showcase of Juno projects; plugin: prep, simplify, health-literacy skills inside ChatGPT, no stored data; Bill Checker: finds upcoding, unbundling, markups, writes dispute letter, free, nothing stored). Images: reuse existing pattern (Unsplash or repo assets).

## Goals, non-goals, anti-goals
- Goals: both subdomains live with the shared look; search and tags work; Schedule reflects sheet edits within minutes; main site unchanged except the requested project additions/Juno split.
- Non-goals: admin status editing; per-site legal pages; changing juno.md stats; upcoming dates on Schedule.
- Anti-goals: any private sheet column (contacts, notes, folders, next action) reaching the web; main site regressions; em dashes in copy; customer or validation claims for Onolys.

## Open risks
- CSV fetch blocked by CSP or redirect host: verify in preview; fallback = scheduled sync job writing JSON at build.
- Published CSV is public by URL: only the Public tab is published; test asserts parser ignores unknown columns.
- app.meetjuno.health mapping to simplify-med not confirmed: confirm link resolves before publish.
- Org names public without consent: owner accepted "for now"; Public Name column is the later fix.
- Owner tasks: create Public Blurb column, Public tab + publish CSV, enable Pages approval in sparehand-plugin PR, DNS for subdomains (already pending from admin-merge).
