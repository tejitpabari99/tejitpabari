# Deep Review (Requirement Fidelity / Content) — 2026-09-03-0132

Scope: `d50ce88..HEAD` on branch `website-revamp`. Read-only review; no files modified other than
this artifact. Focus: did this round deliver what the owner's `REVISION-BRIEF.md` asked for,
factually and in substance, not code correctness (covered by a sibling reviewer).

## Verdict: PASS

No finding at or above the 90% confidence bar was found. Every item in `REVISION-BRIEF.md`, all 21
README.md locked decisions, and all 8 SHARED-CONTEXT.md decisions were independently verified
against the actual code and pass. One near-miss (`src/config/site.ts`'s `DEFAULT_DESCRIPTION`
retaining the pre-revision Juno-first framing) was investigated in depth and dropped below the bar
because it is explicitly surfaced, verbatim, in `TASK16-COPY-FOR-REVIEW.md` for the owner's
pending copy read-through — an already-accepted deferral, not a silently dropped requirement. See
"Dropped below the confidence bar" for the full reasoning.

## Brief-to-implementation traceability

| # | Brief item (verbatim intent) | Status | Evidence |
|---|---|---|---|
| 1 | Sticky footer on short pages | **Delivered** | `src/layout/PageShell.tsx`: `<div className="flex min-h-screen flex-col">` with `<main className="flex-1">` and `Footer` (`shrink-0`) as a flex sibling — standard sticky-footer pattern. |
| 2 | Add "Home" to navbar | **Delivered** | `src/config/links.ts` `NAV_LINKS` starts with `{ label: 'Home', href: '/' }`; `Nav.tsx`'s `sectionIdOf`/`SECTION_LINKS` logic reworked to filter on a `sectionId` field rather than parsing every href, exactly per locked decision 1. `Nav.test.tsx` pins 5 links including `/`. |
| 3 | Hide navbar when Back is shown, on `/projects` and project pages | **Delivered** | `src/routes.tsx`: `handle: { chrome: 'back-only' }` set on exactly `projects`, `projects/:slug`, `projects/:slug/live`. `chromeMode.ts` + `PageShell.tsx` hide `<Nav/>` when mode is `back-only`. Matches locked decision 2 exactly (including `/privacy`/`/terms` keeping the navbar, which decision 2 explicitly requires). |
| 4 | Projects section width inconsistency — make all sections wider/consistent | **Delivered** | All landing sections (`Hero`, `FeaturedProjectsSection`, `WorkExperienceSection`, `AboutSection`, `ContactSection`) use `mx-auto w-full max-w-content` with the same `px-6 sm:px-8 md:px-10 lg:px-12` ramp; sub-pages use the new shared `PageContainer` with the identical `max-w-content` bound (`src/layout/PageContainer.tsx`). |
| 5 | `/privacy`/`/terms` top padding collides with navbar | **Delivered** | Both pages now render via `<PageContainer chrome="full">`, which applies `pt-28 sm:pt-32` for full-chrome routes (`PageContainer.tsx`'s `TOP_PADDING` map). |
| 6 | Drop Juno-first hero/about opening; new Microsoft-first shape | **Delivered** | `Hero.tsx`: "I'm a full-time Software Engineer II at Microsoft, on the Fabric Maps team. On the side, I build in health tech. Right now that means Juno..." `AboutSection.tsx` leads the same way across its 4 paragraphs. Matches the brief's requested shape closely. (See "Dropped below the confidence bar" for the one file, `site.ts`'s meta description, that keeps the old order — already flagged for owner review.) |
| 7 | "Selected work, in health tech and beyond." on one line | **Delivered (design), verification owner-only** | `FeaturedProjectsSection.tsx`: `sm:whitespace-nowrap sm:text-[clamp(1.4rem,3.2vw,2.5rem)]` from 640px up, per locked decision 15. Real-browser check is an accepted deferral (no browser on this machine). |
| 8 | "Where I've worked and what I've built." on one line | **Delivered (design), verification owner-only** | Identical pattern in `WorkExperienceSection.tsx`. Same deferral as #7. |
| 9 | Remove QGIS/Creator-Onboarding links from work experience; keep Fabric Maps blog link; add more experience; second role isn't "Computer Vision Researcher" | **Delivered** | New 3-file work-experience corpus (`microsoft-fabric-maps-swe-ii.md`, `microsoft-fabric-maps-swe.md`, `jio-reliance-industries.md`). SWE II carries only the Fabric Maps blog link; SWE carries no links. Landing timeline (`LANDING_TIMELINE_LIMIT = 2`, sorted by `startDate` descending) now shows the two Microsoft roles, not Jio/"Computer Vision Researcher". Matches locked decisions 5, 9, 16 and README decision 9's exact bullet-to-level split. |
| 10 | Don't show "Fabric Maps MCP Server" / "Azure Maps AI Assistant" as projects | **Delivered** | Both `.md` files deleted (`git log --diff-filter=D`), no `hidden` flag used (locked decision 3). Substance verified preserved in the SWE II bullet ("I built a Fabric Maps MCP server, an Azure Maps assistant that turns natural-language prompts into map visualizations..."), matching `RESUME-EXTRACT.md`'s AI-champ bullet. The two hackathon-link URLs the deleted files carried are not reproduced — but README decision 9 (an owner decision, not an agent call) explicitly scopes the SWE II bullet to keep only the Fabric Maps blog link, so this is a decided trade, not a silent loss. |
| 11 | Contact/Connect: no hiring statement | **Delivered** | `ContactSection.tsx`'s copy: "I'm always glad to hear from people working in health tech, especially if you want to talk through Juno from a clinical or research angle." No mention of hiring/being hired anywhere in the section or elsewhere in the diff. |
| 12 | Site reads AI-written; remove em dashes; rewrite human | **Delivered** | `scripts/check-no-em-dash.mjs` (AST-based, wired into `check:launch`) passes clean; independently re-verified with `grep -rn "—\|&mdash;\|&#8212;"` across `src/**`/`index.html` — zero hits in JSX text, attribute copy, or content markdown (all remaining literal em dashes are in `//` code comments / test descriptions, out of scope by design and by the owner's actual complaint, which was about visible copy). Read the rewritten Hero/About/Contact/work-experience/legal copy directly for AI-essay tics (tricolons, "not just X but Y", "It's not about X, it's about Y", hedge-then-reveal) — none found at the 90% bar. |
| 13 | `/privacy`/`/terms` should sound more professional | **Delivered** | Both pages fully rewritten in plain, declarative register; `PrivacyPage.tsx`'s "no sale or sharing of data" claim is narrowed to accurately describe GA's role as a service processor, matching R5's stated scope. |
| 14 | Update `RESUME_URL` | **Delivered** | `src/config/links.ts`: `RESUME_URL = 'https://drive.google.com/file/d/1pTIyviXM0fCCkXeX6LveYXvr7QD2TD0j/view?usp=sharing'` — exact match to locked decision 6/SHARED-CONTEXT. |
| 15 | Status renders as a colored box, not undifferentiated pill | **Delivered** | New `StatusBadge.tsx`: `rounded-md` (box, not `rounded-full`), 3 distinct colors (`teal`/`status-building`/`slate-dark`) keyed by status, consumed by both `DetailHeader.tsx` and `ProjectCard.tsx`, replacing the old identical-pill markup. Contrast eyeballing against real photos is an explicit, accepted owner-only deferral. |
| 16 | Connect: left = email button, right = profiles only | **Delivered** | `ContactSection.tsx` left column already renders `<Button href={emailHref}>Email Me</Button>` (or the hydration-safe fallback); right `<aside>` now renders only the "Profiles" block (GitHub/LinkedIn) — the old Email block + divider removed. `ContactSection.test.tsx` updated accordingly (single `CONTACT_EMAIL_DISPLAY` node, not two). |
| 17 | Markdown rendering spacing/sizing off | **Delivered** | `tailwind.config.ts`'s `typography` block rewritten: explicit `fontSize`/`lineHeight`, full `h1`-`h4` ramp sized below the page's own `<h1>`, `p`/`ul,ol`/`li` spacing. `ContentBody.tsx` wrapper gets `mt-6`, closing the 0px `LinksRow`→body gap. |
| 18 | All external links open in new tab, including "Open Live" | **Delivered** | `LinksRow.tsx`'s "Open Live" CTA is now a plain `<a target="_blank" rel="noreferrer">` (was a same-tab react-router `<Link>`). `markdownComponents.tsx`'s `a()` renderer now opens every link (external and internal) in a new tab. Scope of "all links" deliberately excludes `Nav`/`Footer`/`ProjectCard`'s grid-navigation link — see README locked decision 21, checked against the brief below. |
| 19 | GFM task list: checkbox only, no bullet dot | **Delivered** | `tailwind.config.ts`: `li.task-list-item { list-style-type: none }` + `ul.contains-task-list { padding-inline-start: 0 }`, keyed on the real classes `mdast-util-to-hast` emits (verified against `node_modules` source in the PRD, not guessed). |
| 20 | Delete `sample-project` demo (4-item checklist) | **Delivered** | `git diff --stat` confirms `sample-project.md`, `src/pages/live/sample-project.{tsx,test.tsx}` deleted, and the `HOSTED_LIVE_PAGES` registry entry removed. `npm run check:launch` passes green (was red on purpose before this fix, per R6 PRD). Remaining `"sample-project"` string hits in the tree are all test-fixture slugs, not real content — verified by reading each hit. |
| 21 | Open PR from `website-revamp` to `main`, do not merge | **Designed, not executed** | `06-voice-sweep-and-ship/SHIP-STEPS.md` designs the preview-deploy + PR steps; explicitly not run, per this round's own scope and the "Still requires the owner" table. Accepted deferral, not a gap. |

## Locked-decision compliance

**README.md's 21 locked decisions:**

1. Home nav entry, `sectionIdOf`/validator updated deliberately — **Honored** (`Nav.tsx`, `links.ts`).
2. Back-only chrome on exactly `/projects`, `/projects/:slug`, `/projects/:slug/live` — **Honored** (`routes.tsx`).
3. `fabric-maps-mcp-server.md`/`azure-maps-ai-assistant.md` deleted, no `hidden` flag — **Honored**.
4. `sample-project` deleted per the 4-item checklist — **Honored**, `check:launch` green.
5. Work experience rebuilt from resume; Jio kept as 3rd entry — **Honored**.
6. `RESUME_URL` updated to the exact Drive link — **Honored**, exact string match.
7. No em dashes anywhere in user-visible copy; reads human — **Honored**, guard passes, spot-read for AI tics clean.
8. No hiring statement either direction — **Honored**, verified across Contact/About/Hero/legal pages.
9. Microsoft bullet-to-level split as specified — **Honored**, exact bullet assignment matches (SWE II: disaster recovery, OAP, AI/MCP + blog link; SWE: Tileset Job API, DevOps YAML + PowerBI load-testing, no links).
10. Hero eyebrow stays "Health Tech Builder" — **Honored** (`Hero.tsx` line, `index.html` `<title>`).
11. `FEATURED_PROJECT_SLUGS` pinned to the exact 6-slug ordered list — **Honored**, byte-exact match: `['juno','smarttest','med-doc-tracker','clip-verse','columbia-virtual-campus','crunchy-filler']`.
12. `LiveRedirectFallback`/`ProjectLivePage` backTo split by file ownership — **Honored** (`LiveRedirectFallback.tsx`'s `backTo` prop; `ProjectLivePage.tsx`'s call site passes `backTo={`/projects/${project.slug}`}`).
13. `PageContainer` and R2's inline width system match — **Honored**, both use `max-w-content` + the same padding ramp.
14. `WorkExperiencePage`'s `max-w-[45rem]` inner wrapper is consistent, not a bug — **Honored**, confirmed present and intentional.
15. 640px one-line-headline floor implemented as designed — **Honored** (design); real-browser verification is an accepted owner-only deferral.
16. Level-transition date `2024-03-01` — **Honored**, exact match in `microsoft-fabric-maps-swe-ii.md`'s `startDate` / `microsoft-fabric-maps-swe.md`'s `endDate`.
17. "See all experience" real-content test in `WorkExperienceSection.test.ts` — **Honored**, test present and exercises the real `workExperience` data (3 entries > limit of 2).
18. `analytics.ts`/`analytics.test.ts` owned by R5 — **Honored**, real `disableGa()`/cookie-deletion logic present.
19. R6 sets `LAST_UPDATED` immediately before the PR — **Not yet executed**, correctly deferred (both pages still carry a placeholder date with an explicit PRD-referencing comment); matches the "known, accepted deferral" list.
20. Legal copy ships as drafted, owner reads before merge — **Honored as designed**; not yet read by owner (expected, pre-ship).
21. Nav/Footer links stay same-tab, narrowing the "all links" scope — **Honored in code**; checked against the brief below.

**On decision 21 specifically (the requested check against the brief's actual words):** brief item #18 says "All external links must open in a new tab, including 'Open live'." The literal word "external" is present in the owner's own phrasing — Nav/Footer's internal same-site links were never unambiguously "external" to begin with, so narrowing "all links" to exclude same-site chrome navigation (Nav, Footer, `ProjectCard`'s grid link) while extending it to internal markdown body content links is a defensible reading, not a quiet under-delivery. This exact carve-out is also explicitly flagged as an owner-confirmation item in the "Still requires the owner" table (R4 PRD §8, R6 PRD §9 item 6), so it isn't being shipped as a silent reinterpretation — the owner is asked to confirm it.

**SHARED-CONTEXT.md's 8 locked decisions:** all 8 are duplicates of README items 1, 2, 3, 4, 5, 6, 7, 8 above — same verification, same result (Honored).

## Resume factual cross-check

Checked `src/content/work-experience/*.md`, `Hero.tsx`, `AboutSection.tsx` line by line against `RESUME-EXTRACT.md`:

- **Microsoft Fabric Maps, Software Engineer II** (`microsoft-fabric-maps-swe-ii.md`): company, role, `startDate: 2024-03-01`, `endDate: Present`, and all 4 bullets (disaster recovery, OAP, AI/MCP work, Fabric Maps blog link) match the resume's bullets and link verbatim in substance.
- **Microsoft Fabric Maps, Software Engineer** (`microsoft-fabric-maps-swe.md`): `startDate: 2021-06-01`, `endDate: 2024-03-01`, Tileset Job API + DevOps YAML/PowerBI load-testing bullets match the resume exactly, no links (matches decision 9).
- **Jio, Reliance Industries** (`jio-reliance-industries.md`): unchanged from the pre-existing file, matches `RESUME-EXTRACT.md`'s note verbatim (title "Computer Vision Researcher" correctly retained here — the brief's complaint about that title was about the *landing timeline's second slot*, not this page, and the timeline no longer shows it, per decision 5/9 and the `LANDING_TIMELINE_LIMIT` fix).
- **Hero/About Microsoft framing**: "Software Engineer II at Microsoft, on the Fabric Maps team," "infrastructure behind how geospatial data gets visualized and analyzed in Microsoft Fabric and Power BI" — matches the resume's own team description ("Fabric Maps enables visualization and analysis of geographical data in Microsoft Fabric and PowerBI").
- No invented facts, no wrong dates, no misattributed bullets found anywhere in the rebuilt corpus.

## Findings (>=90% confidence)

None. Every brief item, every locked decision, and every resume-derived factual claim in the
in-scope files checks out.

## Dropped below the confidence bar

- **`src/config/site.ts`'s `DEFAULT_DESCRIPTION` (the homepage `<meta name="description">`) still
  reads "Health-tech builder and software engineer. Building Juno, an AI companion for medical
  appointments, while working full-time on Microsoft Fabric Maps."** — the same Juno-first framing
  order that brief #6 explicitly asked to drop from the Hero/About paragraphs (which were correctly
  reordered). R6's PRD deliberately scoped this file to an em-dash-only fix (turning the dash into a
  period) and did not re-order it to match Hero's new Microsoft-first shape, reasoning that brief #6
  named "the hero/about line" specifically. This is a real, defensible inconsistency between what
  shows up in a Google search snippet or social preview for the homepage and what the page itself
  now says. **Not reported as a finding** because this exact string is listed verbatim in
  `06-voice-sweep-and-ship/TASK16-COPY-FOR-REVIEW.md` under the owner's pending copy read-through —
  one of this review's explicitly pre-accepted deferrals ("Owner copy read-through pending in
  TASK16-COPY-FOR-REVIEW.md"). The owner will see this exact text before ship and can request the
  reorder there if they want it; it was not silently missed by the round, only left for that gate.
- **`src/content/projects/columbia-virtual-campus.md`'s numbers** (40-student team, 5 projects,
  10,000+ views, 500+ unique users) **don't match `RESUME-EXTRACT.md`'s figures** for the same
  project (led 40 developers, 1,000+ daily unique visitors, a 3-day hackathon with 100 students
  across 30 projects). Not reported as a finding: this file is round-1 content, explicitly listed as
  "verified clean, no change" in R6's own inventory, was never in any round-2 sub-project's file
  ownership, and this review's factual cross-check instruction is scoped to "the rebuilt
  work-experience entries, the Hero paragraph, and the About section" — none of which this file is.
  Noted here only because the general "flag anything invented/inflated" instruction would otherwise
  miss a real, checkable discrepancy; whether it's worth a future round is the owner's call, not a
  round-2 delivery gap.
- **No `review-*.md` exists yet for `06-voice-sweep-and-ship` itself** (five exist, for R1-R5; R6 has
  none). Not reported as a finding — this is a process/traceability observation, not a requirement-
  fidelity gap, and may be produced by the concurrent sibling review pass.

## What was checked and came back clean (for completeness)

Chrome mode per route, `PageContainer` width/padding consistency, `StatusBadge` exhaustiveness and
color mapping, `ContentBody`/`markdownComponents` link and spacing fixes, `ConsentContext`/
`analytics.ts`'s real GA-disable and cookie-deletion logic, `FEATURED_PROJECT_SLUGS` exact order,
`WorkExperienceSection`'s landing-timeline slice/sort logic, the em-dash guard's actual pass/fail
output re-run independently, `git stash@{0}` (untouched, holds exactly the described HELD firebase
change), and every content markdown file's prose for AI-essay tics.
