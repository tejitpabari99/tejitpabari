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
| Privacy page left unchanged despite Schedule's Google Sheets fetch (owner) | Add a Google Sheets line | Owner call |
| No redirect for removed /projects/juno (owner) | Redirect to juno-app | Owner |
| Subsite Home shows all projects, newest first (owner) | Latest 6 + All projects link | Owner |

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

## Builder check resolutions (orchestrator calls unless marked)
- SITE switch: env var `SITE` read in vite.config.ts and via import.meta.env; per-site outDir dist-<site>/; new scripts build:healthtech, build:nonprofit; build:all builds main, healthtech, nonprofit, admin. Prebuild (OG cards, sitemap) and postbuild (build-id normalize, CSP hash injection) are parameterized per site; CSP hashes and live-redirects write only the matching firebase.json target; live-redirects runs only for SITE=main.
- Subsite CSP: copy main's (GA, fonts, images.unsplash.com) plus connect-src docs.google.com and *.googleusercontent.com (CSV redirect host).
- `sites:` frontmatter: optional array of main|healthtech|nonprofit, default [main]; added to ALLOWED_KEYS. clip-verse, columbia-virtual-campus, crunchy-filler stay main-only.
- Tags: add 'Nonprofit' to ProjectTag. Health cards use 'Health Tech'. Per-card techTags from the research drafts; builder picks sensible ones where absent.
- Status per new card from repo state: Onolys Building, Juno app Building, Juno website Completed, Juno ChatGPT plugin Building, Hospital Bill Checker Completed, Sparehand cards Building.
- Links: one primary link per card (the URLs in the card table); plugin card primary = GitHub repo. No `live` entries for new cards.
- Juno split: juno.md becomes juno-app (body and stats kept as-is); new juno-website and juno-chatgpt-plugin files. Old /projects/juno and /projects/juno/live are removed with no redirect (owner); remove the firebase.json /projects/juno/live redirect entry. FEATURED_PROJECT_SLUGS swaps 'juno' for 'juno-app' (owner: yes for now); no other featured changes. site.ts DEFAULT_DESCRIPTION untouched.
- Images: Unsplash, same pattern as existing cards; body markdown is a short paragraph per card from its description.
- Sparehand card dates: first commit touching the skill doc (sparehand-plugin) or the automation folder (sparehand-auto), via gh API. Until the sparehand-plugin Pages PR lands, plugin cards link to the GitHub markdown of the skill; switch to Pages URL after.
- Nonprofit Home and healthtech Home both show the full site-filtered project list with search and tags, same display as the healthtech page (owner). All project lists on both subsites sort by date (created), newest first. Nonprofit Projects tab stays in nav with the same full list.
- Nav: per-site NAV_LINKS; "Website" button top right, same tab, visible on mobile.
- Subsite footer: Privacy and Terms absolute to tejitpabari.com, GitHub, LinkedIn, obfuscated email via existing contact.ts/useContactMailto; drop Research and Résumé; keep the techfolio credit line.
- Subsite routes: home, project detail (no /live), nonprofit /projects and /schedule, NotFound. No research, work-experience, privacy, terms routes.
- Schedule: CSV URL constant = https://docs.google.com/spreadsheets/d/e/2PACX-1vRdHGSY4cKp-FFggDBhAkUqhNSSRRdn-MyBJFg170EUUssuupWVItLHs7JxbdvMN5QMWatrxwmeQNJN/pub?gid=779051931&single=true&output=csv (verified 2026-11-18: 307 redirect to doc-*-sheets.googleusercontent.com, access-control-allow-origin *, headers Name,Project,Public Blurb,Date Added,Status; blurbs currently empty). Expected headers: Name, Project, Public Blurb, Date Added, Status; parser matches headers by name and ignores unknown columns. Dates parsed as YYYY-MM-DD, shown as "Mon YYYY"; ties sorted by project name; unknown statuses map to To do. Tests use a fixture CSV.
- SEO: per-site title, description, default OG image, sitemap and robots.txt; Schedule in sitemap.
- Gates: routes smoke, check:no-em-dash, check:no-forms, check:launch extended to cover the new builds. hosting/healthtech and hosting/nonprofit removed; deploy:static reduced to go only.

## Goals, non-goals, anti-goals
- Goals: both subdomains live with the shared look; search and tags work; Schedule reflects sheet edits within minutes; main site unchanged except the requested project additions/Juno split.
- Non-goals: admin status editing; per-site legal pages; changing juno.md stats; upcoming dates on Schedule.
- Anti-goals: any private sheet column (contacts, notes, folders, next action) reaching the web; main site regressions; em dashes in copy; customer or validation claims for Onolys.

## Open risks
- CSV fetch: verified reachable with CORS; CSP connect-src must include docs.google.com and https://*.googleusercontent.com; fallback = scheduled sync job.
- Published CSV is public by URL: only the Public tab is published; test asserts parser ignores unknown columns.
- app.meetjuno.health mapping to simplify-med not confirmed: confirm link resolves before publish.
- Org names public without consent: owner accepted "for now"; Public Name column is the later fix.
- Owner tasks: create Public Blurb column, Public tab + publish CSV, enable Pages approval in sparehand-plugin PR, DNS for subdomains (already pending from admin-merge).
