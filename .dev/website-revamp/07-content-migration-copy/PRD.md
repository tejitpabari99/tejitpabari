# PRD — Sub-project 07: Content Migration & Copy

**Project:** tejitpabari.com rewrite (`vite-react-ssg` + Tailwind, static-prerendered, Firebase Hosting)
**Depends on:** SP02 (Content pipeline) — this PRD authors every file against SP02's frontmatter contracts (`src/data/projects.ts`, `research.ts`, `workExperience.ts`) verbatim. Nothing here redefines a field, a type, or a validator; every table below cites the exact SP02 section it satisfies.
**Feeds:** SP03 (landing hero/About/Contact copy, timeline data), SP04 (project/research detail pages, card blurbs), SP06 (link/date data for OG cards — not the sample-project, which is SP06's own content).
**Reference brief:** `/root/projects/tejitpabari/.dev/website-revamp/BRIEF.md` §2 (Copy, Content model), §3 (Copy, Content model), §6 (the complete content inventory this PRD migrates). Nothing in the brief is re-litigated here.

---

## 1. Problem

Every piece of real content on tejitpabari.com — 10 projects, 5 research entries (after the SMARTtest dedup), and (after the owner's decision to drop the Programming for Entrepreneurs and Social Good role, §4.3/§9) 2 work-experience roles, plus the hero/About/Contact copy — currently exists as either an inline JS array baked into a Gatsby page component, or as a stale, geospatial-only framing in `IntroSection.js` ("I'm a Software Engineer at Azure Maps, Microsoft... passionate about... the geospatial field"). None of it satisfies SP02's frontmatter contract, none of it repositions Tejit toward health tech, and several fields the contract requires — `date` on every project and research item, `startDate`/`endDate` on every work-experience role — don't exist anywhere in the source at all.

SP02 built the pipe; this sub-project is what runs through it. Two problems compound here, not one:

1. **Pure migration** — turning the source's 18 loosely-shaped JS objects into 17 markdown files (10 projects, 5 research, 2 work-experience — one of the 3 work-experience objects, Programming for Entrepreneurs and Social Good, is dropped rather than migrated, §4.3/§9) with exact, validated frontmatter, without silently dropping a link, softening a real number, or carrying forward the one confirmed copy-paste bug (INCITE Labs' "News Coverage" link, which actually points at the SMARTtest/labiotech article).
2. **Drafting, not just moving, copy** — the brief is explicit that shipping this rewrite with placeholder or lorem copy is exactly how it stalls at 90%. Every card blurb, every abstract, every blurb, the hero, and About need a full first draft written *for* the owner to edit, in a voice that leads with health tech without overstating Juno's stage (still pre-launch, in early conversations, not a signed partnership) or hiding that Tejit is, today, a full-time Microsoft engineer.

The two problems interact on exactly one field: `date`. SP02 flagged, correctly, that no `date` exists anywhere in the source for any of the 10 projects or 5 research entries, and that a wrong one silently reorders the site (`featured.ts` backfill, listing order, and the "most recent" framing of Juno as the flagship all depend on it). This PRD resolves that by mining the résumé — which turns out to yield genuine, high-confidence dates for most of these items, better than SP02's own note anticipated — and is explicit about the handful that remain honest guesses.

## 2. Goals

- Produce a complete, field-by-field migration plan for all 10 project files, 5 research files, and 2 work-experience files: destination path, slug, and every SP02-required frontmatter value, with its source cited.
- Resolve the `date` problem for all 15 project/research items with a stated derivation and an explicit confidence level per item, so SP04/SP06 (and the owner) know exactly which dates are sourced fact versus reasoned estimate versus guess.
- Mine `tejitpabari_resume.pdf` for work-experience `startDate`/`endDate`, and report exactly what it does and doesn't yield — this turns out to resolve 2 of SP02's original 3 `DRAFT_DATE` placeholders with real dates; the third role (no dateable source anywhere) is dropped from the site rather than shipped on a placeholder (§4.3/§9), leaving zero `DRAFT_DATE: true` entries at launch.
- Draft complete first-pass copy for the hero, About, Contact, all 10 project card blurbs (plus body writeups where warranted), all 5 research abstracts, and both work-experience blurbs — with a stated tone, length target, and health-tech throughline per field, and real drafted samples in this document (not "TBD, see spreadsheet").
- Specify the placeholder-image reference pattern precisely enough that swapping it for real photos later is a single grep-and-replace, not a file-by-file hunt.
- Carry over every existing external link, fix the one confirmed mis-paste, and produce the full external-link liveness-check list SP07 hands to the owner pre-launch.

## 3. Non-Goals

- Redefining any SP02 frontmatter field, type, enum, or validator. Where this PRD makes a judgment call SP02 left open (a tag, a status, a `liveUrl` decision, a date), it's flagged as this PRD's call, not a schema change.
- Writing SP06's `sample-project.md` — that file is explicitly SP06's demo content, exercising the full markdown feature set; it is out of scope here even though it lives in the same `src/content/projects/` directory.
- Building any component, page, or loader. This PRD's only artifact SP07 itself produces is markdown content files (post-approval, in the follow-on tasks phase) — no `.tsx`, no `.ts`.
- Legal copy (`/privacy`, `/terms`) — SP05's job.
- Verifying the ~24 external URLs are actually still live. This PRD produces the checklist (§7); running it is a manual, owner/task-phase step, not something resolved inside this design document.
- Deciding the real Firebase project ID, DNS, or real project photography — owner-only, tracked in §8, not solved here. (The contact location string is resolved, not owner-blocked: the Contact aside ships with no location line at all, owner decision — see SP03 §9.)
- A final, locked copy pass. Every piece of drafted copy in this PRD is exactly that: a draft, sized and toned per the rules in §4.5, explicitly for the owner to edit. Shipping it unedited is acceptable (better than a blank page) but not the assumed outcome.

---

## 4. Architecture Decisions

### 4.1 Projects — per-file migration table (10 files, `src/content/projects/*.md`)

Source: `src/pages/projects.js` (confirmed 10 objects, each `{title, subtitle, description, links[{title,link}]}` — no `tags`, `status`, `date`, or `image` anywhere in the source; all four are this PRD's additions, per brief §6 where proposed, else this PRD's judgment call as flagged).

Every file's frontmatter shape, per SP02 §4.4.2: `slug, title, description, image, tags[], status?, liveUrl?, links[{label,href}], date, body`. `image` is the Unsplash placeholder for all 10 (§4.6). `liveUrl` decisions are this PRD's proposal per §8's item 3 (owner can override any of them without touching anything else in the file).

| # | Slug (filename) | Title | Tags | Status | `date` (confidence) | `liveUrl`? | `links[]` (label → href) | Body? |
|---|---|---|---|---|---|---|---|---|
| 1 | `juno` | Juno | `Health Tech` | `Building` | `2025-06-01` (**estimate** — no source date exists; Juno postdates the résumé entirely. Picked so it sorts as the single most-recent project, matching its role as the flagship/first `FEATURED_PROJECT_SLUGS` entry. See §4.4 item 1.) | `https://app.meetjuno.health/` (the app, not the marketing site — the thing a visitor would actually "try") | App → `https://app.meetjuno.health/`; Website → `http://meetjuno.health/` | **Yes** — flagship writeup, drafted in §4.5.3 |
| 2 | `med-doc-tracker` | Med-Doc Tracker | `Health Tech` | *(none — owner-decided, brief §6)* | `2024-06-01` (**estimate**, low confidence — no source date; placed after the Microsoft-tenure projects and before Juno as a plausible "personal health-tech tool built while pivoting toward Juno" position. Flagged for owner override, §8.) | `https://tejitpabari.short.gy/med-doc-tracker` | Website → (same, short.gy) | No |
| 3 | `crunchy-filler` | Crunchy Filler | `Developer Tools` | `Completed` | `2022-01-01` (**guess**, low confidence — a hobby Chrome extension with no dateable anchor anywhere in source or résumé. Placed in the Microsoft-tenure window purely because it's a small side project of the kind built between larger commitments. Owner should correct if remembered.) | `https://chromewebstore.google.com/detail/crunchy-filler/djbcknbbfoldifpllefimnnkfaogcnid` | Chrome Web Store → (same) | No |
| 4 | `clip-verse` | Clip-Verse | `Developer Tools` | *(none — owner-decided, brief §6)* | `2023-06-01` (**guess**, low confidence — Vercel-hosted, no other anchor. Placed after Crunchy Filler as a slightly more recent-feeling tool. Owner should correct if remembered.) | `https://clipverse-five.vercel.app/` | Website → (same, Vercel) | No |
| 5 | `fabric-maps-mcp-server` | Fabric Maps MCP Server | `Developer Tools` | `Completed` | `2025-01-01` (**high confidence** — the hackathon's own URL is `MRTAthon-2025`, an explicit year. Month is a guess; year is not.) | *(none — hackathon submission page is informational, not a "try it" destination; stays in `links[]` only)* | Hackathon Project → `https://innovationstudio.microsoft.com/hackathons/MRTAthon-2025/project/112785` | No |
| 6 | `azure-maps-ai-assistant` | Azure Maps AI Assistant | `Developer Tools` | `Completed` | `2023-06-01` (**medium confidence** — same "MRTAthon" hackathon series as #5, but hosted on the older `hackbox.microsoft.com` platform rather than 2025's `innovationstudio.microsoft.com`, and the project predates the Creator→Fabric Maps rebrand referenced in the work-experience source. Reads as an earlier MRTAthon than the 2025 one; exact year not recoverable from the URL alone.) | *(none — same reasoning as #5)* | Hackathon Project → `https://hackbox.microsoft.com/hackathons/MRTAthon/project/85641` | No |
| 7 | `qgis-plugin-azure-maps-creator` | QGIS Plugin for Azure Maps Creator | `Developer Tools` | `Completed` | `2022-06-01` (**medium confidence** — résumé explicitly attributes this to the Microsoft role, "Spearheaded creation of Azure Maps Creator QGIS plugin," within a June 2021–Present tenure; placed roughly a year in, since "1,000+ downloads" and a full feature/UI history implies it wasn't a first-month deliverable. Month is a guess; the ~1-year-into-role placement is a reasoned estimate, not a source fact.) | `https://plugins.qgis.org/plugins/AzureMapsCreator/` (a genuine "go install it" destination — recommend `liveUrl`) | QGIS Plugin Store → (same) | No |
| 8 | `creator-onboarding-tool` | Creator Onboarding Tool | `Developer Tools` | `Completed` | `2022-09-01` (**medium confidence** — same résumé bullet block as #7, "Shadow Project Manager, drove product development for Azure Maps Creator Onboarding tool." Placed slightly after the QGIS plugin since the résumé lists it as the next bullet. Month is a guess.) | `https://azure.github.io/azure-maps-creator-onboarding-tool/` | Website → (same) | No |
| 9 | `columbia-virtual-campus` | Columbia Virtual Campus | `Others` | `Completed` | `2020-05-01` (**high confidence** — résumé: "Co-Founder and CTO \| Columbia Virtual Campus \| May 2020 - May 2021." Using the founding date, not the wind-down date, since `date` reads more naturally as "when this started" for a defunct project.) | *(none — defunct, pandemic-era, wound down; no live tool to send anyone to)* | Website → `https://columbiavirtualcampus.com/`; Facebook → `https://www.facebook.com/columbiavirtualcampus/`; Instagram → `https://www.instagram.com/columbiavirtualcampus/` | No |
| 10 | `smarttest` | SMARTtest: HIV & Syphilis Self-Testing App | `Health Tech` | `Completed` | `2019-01-01` (**high confidence** — résumé: "Full Stack Developer \| SMARTest, Columbia University \| March 2018 - January 2019." Using the end date, since that's when the shipped, downloadable state described in the card ("1,000+ downloads") was reached.) | *(none — no standalone live tool link exists distinct from the App Store/Play Store, neither of which is in the source; stays link-only)* | AIDS and Behaviour Paper → `https://doi.org/10.1007/s10461-019-02718-y`; News Coverage → `https://www.labiotech.eu/best-biotech/hiv-test-app-home/#:~:text=SMARTtest,and%20syphilis%20in%20the%20blood.` | **Yes** — second flagship writeup, health-tech proof point (§4.5.3) |

**Which projects get a `body` writeup, and why most don't.** Per the task's own framing, most of the 10 are card-blurb-and-links only — this isn't an oversight, it's the correct call: Crunchy Filler, Clip-Verse, the two Azure/MRTAthon hackathon entries, the QGIS plugin, the Creator Onboarding Tool, Columbia Virtual Campus, and Med-Doc Tracker are each fully explained by a 1–2 sentence description plus their existing external link — a longer write-up would be padding, not information, for a tool whose entire story is "I built X, here's the link." **Juno and SMARTtest are the two exceptions**, and for the same reason: they're the two genuine health-tech proof points the whole rewrite's repositioning leans on — Juno as the current thing, SMARTtest as the historical credential that shows the interest predates Juno by six years. Those two earn the deeper writeup; everything else doesn't need one to do its job on the page (brief §2/§3: "a project/research page with no body still renders correctly from `description` + `links` alone" — this is the intended, not degraded, state for 8 of the 10).

**`ALLOWED_KEYS` compliance check:** every row above uses only `slug, title, description, image, tags, status, liveUrl, links, date, body` (SP02 §4.4.2) — no extra keys. Two rows (`med-doc-tracker`, `clip-verse`) omit `status` entirely, matching the brief's explicit no-pill decision — SP02's `assertOptionalStatus` accepts this by construction.

### 4.2 Research — per-file migration table (5 files, `src/content/research/*.md`)

Source: `src/pages/research.js` (confirmed 6 raw objects; SMARTtest — object #3 in that file — is deduplicated out per the brief's settled decision, leaving 5). Frontmatter shape per SP02 §4.4.3: `slug, title, description, image, tags[], status?, links[], date, body` — **no `liveUrl`** (SP02 dropped it for Research entirely; none of these 5 items would ever populate it anyway, since none has a hosted "try it" tool).

Every one of these 5 items has an explicit résumé date, which is a materially better outcome than SP02's own §8/§9 framing anticipated ("no `date` values exist... resolving that is largely your problem" — true for Projects, not for Research, as it turns out).

| # | Slug (filename) | Title (site) | Tags | Status | `date` (confidence) | `links[]` (label → href) | Body |
|---|---|---|---|---|---|---|---|
| 1 | `flood-event-extraction-bangladesh` | Flood Event Extraction from News Media (Bangladesh) | `Machine Learning` | `Completed` | `2020-12-01` (**high confidence** — résumé role "NLP Researcher \| Earth Institute \| May 2020 - June 2021"; publications list cites "AGU Fall Meeting Abstracts, vol. 2020" — AGU Fall Meeting runs in December, which anchors the date more precisely than the role's own May–June span.) | Pre-print paper → `https://bit.ly/tejit-flood-research`; AGU Abstract Presentation → `https://agu.confex.com/agu/fm20/meetingapp.cgi/Paper/766342` | Abstract only, drafted §4.5.4 |
| 2 | `dvmm-lab` | DVMM Lab | `Machine Learning` | `Completed` | `2020-08-01` (**high confidence** — résumé: "Computer Vision Researcher \| DMVV Lab \| May 2020 - August 2020"; using the end date. Note: résumé spells it "DMVV," the site's `research.js` spells it "DVMM" — see §4.4 note on this naming conflict.) | Project Report → `https://bit.ly/tejit-dvmm-lab-research-2020` | Abstract only |
| 3 | `incite-labs` | INCITE Labs | `Machine Learning` | `Completed` | `2020-05-01` (**high confidence** — résumé: "Data Science Researcher \| INCITE Labs \| October 2019 - May 2020"; using the end date.) | Website → `https://incite.columbia.edu/measuring-liberal-arts` **only** — News Coverage link **dropped**, see §7 | Abstract only |
| 4 | `pill-recognition-prescription-extraction` | Pill Recognition & Prescription Extraction | `Health`, `Machine Learning` | `Completed` | `2019-05-01` (**high confidence** — résumé: "Machine Learning Researcher \| Columbia University \| February 2019 - May 2019"; using the end date.) | Project Report → `https://www.researchgate.net/publication/340528010_Pill_Detection_Prescription_Analysis` | Abstract only |
| 5 | `solar-illumination-water-bottle` | A Study on the Solar Illumination Provided by a Water Bottle | `Other` | `Completed` | `2017-05-01` (**high confidence** — résumé: "Researcher \| The Doon School \| January 2016 - May 2017"; using the end date, matching "Published and presented" as the culminating event.) | JBAER Paper → `https://doi.org/10.7916/D8Q24BQ9`; Google Science Fair coverage → `https://www.hindustantimes.com/education/google-science-fair-two-indian-teens-among-global-finalists/story-B3iDwvHtxLngSz21egVOYJ.html`; Times of India → `https://timesofindia.indiatimes.com/education/news/two-indian-teens-among-global-finalists-at-google-science-fair/articleshow/53736020.cms` | Abstract only |

**All 5 research bodies stay abstract-only** — each is a completed, closed-out academic/research engagement fully described by a 2–3 sentence abstract plus its report/paper link; unlike Juno/SMARTtest there's no live-product story to expand into a longer narrative, and none of these needs to carry the health-tech repositioning weight the two flagship projects do (Pill Recognition already carries a `Health` tag on its own merits).

### 4.3 Work Experience — per-file migration table (2 files, `src/content/work-experience/*.md`)

Source: `src/pages/work-experience.js` (confirmed 3 objects, `{title, subtitle, description, links?}` — no dates anywhere). Frontmatter shape per SP02 §4.4.4: `company, role, startDate, endDate|"Present", links[], DRAFT_DATE?` + body = the 2–3 line blurb. **No `slug`/filename-agreement check** on this collection (SP02 §4.2 — no route ever addresses a role by identity string).

**Résumé mining result — better than SP02 assumed, and it resolves the launch-blocker outright.** SP02's §4.9 pinned all three then-in-scope roles to placeholder dates on the (correct, at the time) assumption that *no* dates existed in any source. The résumé, read directly for this sub-project, yields **real, explicit dates for 2 of the 3 roles**. The third — Programming for Entrepreneurs and Social Good, Head Teaching Assistant — isn't in the résumé at all: it doesn't appear anywhere in the résumé's Work/Research/Leadership sections, and no dateable source exists for it anywhere (not the résumé, not the current site, not any external link). **Owner decision: drop this role from the site entirely rather than ship it on a placeholder date.** It was also the weakest of the three entries for the brief's health-tech repositioning (§1) — a teaching-assistant role with no clear health-tech angle, unlike Microsoft Fabric Maps (the day job, named directly in the hero/About copy) or a role that would at least carry research credibility. Dropping it removes the initiative's only launch-blocking content gate: Work Experience now ships **two** roles, both with real, résumé-sourced dates, and the `DRAFT_DATE` pre-launch gate (SP02 §4.9) clears with zero remaining placeholders — not one.

| # | Filename | Company | Role | `startDate` / `endDate` | Source & confidence | `DRAFT_DATE`? | Links | Body (blurb, drafted §4.5.5) |
|---|---|---|---|---|---|---|---|---|
| 1 | `microsoft-fabric-maps.md` | Microsoft Fabric Maps | Software Engineer II | `2021-06-01` / `Present` | **Résumé, high confidence.** "Software Engineer \| Microsoft, Redmond \| June 2021 - Present." Team name and title have since evolved on-site (résumé says "Software Engineer," current site says "Software Engineer II"; résumé's team framing is "Azure Maps Creator," current site says "Fabric Maps" — the same team, since rebranded — see brief's Fabric Maps blog link, which itself announces the "Maps in Fabric" rename). Keep the site's current, more accurate title/team name; the *dates* are what the résumé actually confirms and what this PRD is sourcing. | **Removed** — real date, not a placeholder | Fabric Maps blog → `https://blog.fabric.microsoft.com/en-us/blog/introducing-maps-in-fabric-geospatial-insights-for-everyone/`; QGIS Plugin → `https://plugins.qgis.org/plugins/AzureMapsCreator/`; Creator Onboarding Tool → `https://azure.github.io/azure-maps-creator-onboarding-tool/` | Drafted below |
| 2 | `jio-reliance-industries.md` | Jio, Reliance Industries | Computer Vision Researcher | `2019-06-01` / `2019-08-01` | **Résumé, high confidence.** Résumé lists this as "Machine Learning Intern \| Jio - Reliance Industries, India \| June 2019 - August 2019," with the identical bullet content (license-plate recognition, BERT for legal documents) as the site's "Computer Vision Researcher" entry — same role, two different titles for it. See §4.4's note on the title discrepancy; dates are unambiguous either way. | **Removed** — real date, not a placeholder | *(none in source)* | Drafted below |
| ~~3~~ | ~~`programming-for-entrepreneurs.md`~~ | ~~Programming for Entrepreneurs and Social Good~~ | ~~Head Teaching Assistant~~ | ~~dropped, not migrated~~ | **Dropped from the site (owner decision, see above) — not in the résumé, no dateable source anywhere.** | — | — | — |

**Ordering check — simplified to two real dates, no placeholder involved.** With role 3 dropped, ordering no longer depends on a placeholder sorting correctly against anything — it's two roles, both with real `startDate` values, sorted the ordinary way. Final order by `startDate` descending: Microsoft Fabric Maps (`2021-06-01`) → Jio, Reliance Industries (`2019-06-01`) — matching the brief's required interim order (Fabric Maps most recent), now satisfied entirely by real dates with zero placeholders anywhere in the collection.

### 4.4 The `date` problem — methodology, stated once

Every `date`/`startDate`/`endDate` value above falls into exactly one of three buckets, and every table cites which:

1. **High confidence — résumé- or URL-sourced fact.** The résumé gives an explicit month/year range for a role, or an external URL contains an explicit year (`MRTAthon-2025`). These are not guesses; they're read directly off a primary source. This covers all 5 research entries, 2 of 10 projects outright (Columbia Virtual Campus, SMARTtest) plus the 1 project with a year in its own URL (Fabric Maps MCP Server), and both of the 2 work-experience roles that ship (the third, with no dateable source anywhere, is dropped from the site rather than migrated — §4.3/§9).
2. **Medium confidence — reasoned estimate from an adjacent fact.** No exact date exists, but a nearby fact constrains it enough to place a defensible date: the QGIS plugin and Creator Onboarding Tool are explicitly résumé bullets under the June-2021–Present Microsoft role, so they're placed within that window, offset by a judgment call about how far into the role each shipped; Azure Maps AI Assistant is placed before the 2025-dated Fabric Maps MCP Server because it sits on an older hackathon platform under the pre-rebrand "Azure Maps Creator" name. This covers 3 of 10 projects.
3. **Low confidence — genuine guess, no anchor at all.** Juno, Med-Doc Tracker, Crunchy Filler, and Clip-Verse have no dateable fact anywhere in the source or résumé (Juno postdates the résumé entirely; the other three are undated hobby/personal tools). These 4 dates are placed in a plausible relative order (oldest hobby project → most recent, Juno last) purely so the site's date-derived sort/backfill behaves sensibly, and are flagged in §8 as the ones most worth the owner's five minutes to correct — a wrong guess here doesn't break the build (unlike `DRAFT_DATE`, nothing gates on these), but it can silently reorder the `/projects` grid and change what `featured.ts` backfills.

**One naming conflict surfaced, not a date issue:** the résumé spells the computer-vision lab "DMVV Lab"; the current site's `research.js` spells it "DVMM Lab." "DVMM" (Digital Video and Multimedia Lab) is Columbia's actual, publicly known lab name — the résumé's spelling reads as a typo. **Recommendation: keep the site's "DVMM Lab" spelling** in the migrated title; flagged in §9, not treated as an open question that blocks anything, since it's a one-word correction either way.

**Another naming conflict, work experience:** the résumé calls the Jio role "Machine Learning Intern"; the site calls it "Computer Vision Researcher." Both describe the identical bullet content. **Recommendation: keep the site's "Computer Vision Researcher"** — it's the framing already public on the live site, and it reads better next to "Software Engineer II" and "Head Teaching Assistant" as a consistent researcher/engineer register, whereas "Intern" undersells a role whose actual work (a TensorFlow model, a fine-tuned BERT model) wasn't intern-shaped in the site's own telling. Flagged in §9 as a judgment call, not a blocker.

### 4.5 Copy drafting plan

**Health-tech repositioning throughline, stated once, applied everywhere:** Tejit is, today, a full-time SWE II on Microsoft's Fabric Maps team — that's true, current, and not hidden anywhere in this copy. Juno is real, unlaunched, and validated only through surveys/consultations/a beta waitlist — not "co-founded a health-tech company serving patients" and not "in partnership with the National MS Society," but "building," "in early conversations with," "validating with." Every draft below is checked against both halves of that sentence: does it lead with health tech, and does it avoid overstating either side.

#### 4.5.1 Hero

**Fields:** eyebrow label, greeting, one health-tech-centric paragraph, per brief §3 (Hero: "eyebrow label, greeting, one health-tech-centric paragraph, 'Download Resume' + 'Contact Me' buttons, social icon row"). Replaces `IntroSection.js`'s current "I'm a Software Engineer at Azure Maps, Microsoft... passionate about... the geospatial field" framing entirely.

**Tone:** first-person, direct, confident without oversell. **Length targets:** eyebrow ≤ 4 words; greeting ≤ 6 words; paragraph 35–55 words (two sentences) — long enough to name both halves of the repositioning, short enough that it reads in the "under ten seconds" the house-format reference (`juno-landing-page` PRD §1) treats as the hero's actual budget.

**Drafted sample:**

> **Eyebrow:** Health Tech Builder
> **Greeting:** Hi, I'm Tejit.
> **Paragraph:** I'm building Juno, an AI companion that helps patients get more out of every medical appointment — while working full-time as a Software Engineer II on Microsoft's Fabric Maps team. Health tech is where most of my energy outside of work goes, and where I'm headed next.

Checked against the throughline: "building" (not "founded and shipped"), "while working full-time" (the day job stated plainly, not buried or apologized for), "where I'm headed next" (signals direction without claiming Juno is already the day job).

#### 4.5.2 About

**Tone:** personal register, plain prose — per brief §3, explicitly *not* the card format used everywhere else on the site; this is the one section that should read like Tejit talking, not a résumé bullet list. **Length target:** 3–4 short paragraphs, ~120–180 words total — enough to cover the day job, Juno, and the "this isn't a pivot" evidence, short enough to stay a single scroll's worth of prose.

**Drafted sample (full — this is one of the "actual drafted samples" requested):**

> I'm a software engineer who ends up building things end to end — backend systems at Microsoft during the day, and a health-tech startup nights and weekends.
>
> At Microsoft, I'm a Software Engineer II on the Fabric Maps team, where I work on the infrastructure and developer tools behind large-scale geospatial data.
>
> Outside of that, I'm building Juno — an AI companion that helps patients walk into a doctor's appointment prepared, and walk out with a clear record of what was said and what to do next. It's early: I'm validating the idea directly with patients and clinicians before scaling anything.
>
> Health tech isn't really a pivot for me — some of my first research, in college, was a self-testing app for HIV and syphilis and a pill-identification tool built from photos. Juno is the same instinct, aimed at a bigger problem.

Checked against the throughline: names the Microsoft role factually and without either inflating or downplaying it; states Juno's actual stage ("early," "validating," not "scaling" or "growing users"); the SMARTtest/Pill-Recognition callback is factually supportable (§4.2) and does real work — it's the evidence that health tech predates Juno by six years, not an assertion.

#### 4.5.3 Project descriptions and body writeups

**Card `description` — tone/length rule for all 10:** one to two sentences, 20–40 words, present tense, leads with *what it does* before *who it was built for/why*. No new claims beyond what the source already states (downloads, accuracy numbers, "1,000+" stay exact). Nine of the 10 are single-sentence-plus-fragment condensations of the existing Gatsby copy; SMARTtest and Juno additionally get the longer `body` writeup described in §4.1.

**Drafted samples — one card description already used as the §4.5.1-adjacent flagship, plus a second for contrast (a routine, non-health-tech entry, to show the same voice applied to a purely technical project):**

> **Juno** (card `description`): An AI companion for medical appointments — live note-taking, real-time question prompts, and a clear summary of what to do next. Built with neurologists and researchers, and validated with 200+ patients and 30+ doctors so far.

> **QGIS Plugin for Azure Maps Creator** (card `description`, no health-tech framing needed or forced onto it): A QGIS plugin that brings Azure Maps Creator's APIs directly into the QGIS environment, with parallelized data loading and full debugging support. Downloaded 1,000+ times from the official plugin store.

**Juno `body` (full drafted writeup, the flagship long-form sample):**

> Juno helps patients get more out of every doctor's visit. During an appointment, it takes structured notes in real time and prompts context-aware questions a patient might not think to ask in the moment — then turns the conversation into a clear summary with concrete follow-ups, instead of a page of hurried handwriting.
>
> It's being built in collaboration with neurologists and researchers, with an early focus on complex, recurring conditions like MS, where patients see specialists repeatedly and small details compound over time. The team is in early conversations with the National MS Society and Columbia University about clinical validation and funding.
>
> So far: 200+ patients surveyed, 30+ doctors consulted, and 70 patients on the beta waitlist. Juno is still pre-launch — the current focus is validating the clinical workflow before scaling it.

**SMARTtest `body` (full drafted writeup, the second flagship):**

> SMARTtest is a smartphone app that makes HIV and syphilis self-testing more accessible — walking a user through the test itself, helping interpret the result, and linking them to follow-up care, all from a phone. Built with React Native and Firebase, with Twilio and SendGrid handling secure result-sharing, and deployed and tested through Expo.
>
> The app has been downloaded 1,000+ times and received national news coverage. The underlying research was published in the journal *AIDS and Behavior* — one of the earliest projects that pointed me toward health tech, years before Juno.

The remaining 8 project descriptions (Med-Doc Tracker, Crunchy Filler, Clip-Verse, Fabric Maps MCP Server, Azure Maps AI Assistant, Creator Onboarding Tool, Columbia Virtual Campus) follow the identical rule and tone; they are condensations of the existing `projects.js` prose (already fairly tight source material) rather than new claims, and are listed as a drafting task for the tasks phase, not reproduced in full here — the two flagships above and the one contrast example establish the voice; the rest is mechanical application of the same rule, not a second creative pass.

#### 4.5.4 Research abstracts

**Tone/length rule, all 5:** 2–3 sentences, 30–50 words, past tense (these are all closed-out academic engagements) — method, headline result/number, and outcome (publication, presentation, or downstream impact), in that order.

**Drafted sample (the one required by the task, doubling as the Flood Event Extraction abstract):**

> Built a BERT-based classifier to extract flood events from 40,000+ tagged Bangladeshi news articles, then used the resulting time-series — validated against Sentinel satellite data — to help the Bangladesh government develop a flood-index insurance product. Presented at AGU; published as a pre-print.

The remaining 4 abstracts (DVMM Lab, INCITE Labs, Pill Recognition & Prescription Extraction, Solar Illumination) follow the identical structure and are a drafting task for the tasks phase.

#### 4.5.5 Work-experience blurbs (2–3 lines each, per SP02 §4.4.4's body requirement)

**Tone/length rule:** 2–3 lines of prose (not bullets — brief §2 is explicit the blurb is markdown prose, not gbose's dense bullet-list style), condensed from the existing single-paragraph descriptions, leading with the single most concrete outcome (a number, a named deliverable) rather than a title recap.

**Drafted, both (short enough to include in full — these are a required migration artifact, not optional samples):**

> **Microsoft Fabric Maps:** Lead engineer for the Tileset Job API, taking it from design through delivery to support large-scale geospatial data ingestion and map-tile generation. Built a performance-testing framework that cut latency regressions by 15% ahead of releases, and served as shadow PM, using competitive analysis that helped shape the 2025 roadmap.

> **Jio, Reliance Industries:** Built a TensorFlow-based license-plate recognition model for a campus security system, hand-annotating 1,000 training images to reach 65% accuracy. Also fine-tuned a BERT model to process and query legal documents.

No third blurb — the Programming for Entrepreneurs and Social Good role is dropped from the site entirely (§4.3/§9), not migrated with a drafted blurb.

#### 4.5.6 Contact section

**Fields (brief §3): heading + one paragraph**, left column, above the "Email Me" button. **Tone:** direct, low-friction, addressed to the brief's stated audience (recruiters, collaborators, clinicians/researchers evaluating Juno).

**Drafted sample:**

> **Heading:** Get in Touch
> **Paragraph:** Whether you're hiring, working on something in health tech, or want to talk through Juno with a clinician's or researcher's eye — I'd like to hear from you.

### 4.6 Images — placeholder reference pattern

Per SP02 §4.4.2/§4.3, `image` is a plain string field, one value per file — there is no shared constant module a future swap can edit once. To make a later global swap mechanical rather than a hunt, this PRD imposes one authoring rule beyond what SP02 requires:

**Rule: every one of the 10 project files' `image` frontmatter value must be the exact, byte-identical placeholder URL** — `https://images.unsplash.com/photo-1572177812156-58036aae439c` — with no query-string variation (no `?w=...`, no `&fit=...` appended by different authors at different times). Research entries have no `image` field per SP02's schema (§4.4.3 lists `image` for Research too — confirmed: it does carry `image`, same as Projects — so this rule applies to all 5 research files as well, 15 files total).

**Why this makes the future swap mechanical:** because the string is guaranteed identical everywhere, the swap-to-real-photos task (when it happens, project by project) is either:
- **All at once, before any real photos exist for anything:** `grep -rl 'images.unsplash.com/photo-1572177812156-58036aae439c' src/content/{projects,research}/` lists every file still on the placeholder, in one command, with no risk of missing one because its URL had a stray parameter.
- **One project at a time, as real photos arrive:** the owner (or a future task) edits exactly one file's `image` line to the new URL; every other file's `image` line is untouched and still greppable by the same command above to see what's left.

This is a content-authoring discipline this PRD enforces on itself (and on whoever authors the actual files in the tasks phase), not a new frontmatter field — SP02's schema is unchanged.

---

## 5. API Change Summary

N/A. This sub-project produces markdown content files and a copy-drafting plan only. There is no backend, database, or API surface anywhere in this project (per brief non-goals), and this PRD doesn't touch SP02's loaders, validators, or types — it authors *against* them.

## 6. Frontend Change Summary

N/A in the literal sense — this PRD authors no components, pages, or `.ts`/`.tsx` files. The closest thing to a "frontend change" this sub-project produces is content:

| Type | Count | Path pattern | Contract satisfied |
|---|---|---|---|
| Project markdown files (planned, not yet written — see scope note below) | 10 | `src/content/projects/*.md` | SP02 §4.4.2 |
| Research markdown files (planned) | 5 | `src/content/research/*.md` | SP02 §4.4.3 |
| Work-experience markdown files (planned) | 2 | `src/content/work-experience/*.md` | SP02 §4.4.4 |
| Hero/About/Contact copy (planned, consumed by SP03's components) | 3 sections | N/A — copy handed to SP03, not a file this sub-project owns | Brief §3 (Hero, About, Contact copy) |

**Scope note, restated from §3:** this PRD is the design document — the *plan* for what every file's frontmatter and body will contain, with two full drafted samples per field type. Writing the actual 17 markdown files is the follow-on tasks-phase work (`dev-tasks`/`dev-code`), executed against the tables in §4.1–§4.3 and the copy rules in §4.5, not part of this PRD's own deliverable. (The source has 18 raw JS objects; one work-experience role — Programming for Entrepreneurs and Social Good — is dropped rather than migrated, §4.3/§9.)

## 7. Testing

Content migration correctness and link liveness aren't unit-testable in the way SP02's validators are (SP02 §7 already covers frontmatter-shape testing) — this section covers what specifically needs manual verification once the 17 files exist, and hands over the exact list to check.

**Migration correctness, once files are authored (tasks phase, not this PRD):**
- Every SP02 build-time validator (§4.5 of SP02's PRD) fires for free the moment these files are dropped into `src/content/` and anything imports `@/data` — a typo'd tag, a missing required field, or a `slug`/filename mismatch fails `npm run build` with a file-and-field-specific error, per SP02's existing contract. No new validation logic is proposed here.
- Manual content diff against this PRD's tables: for each of the 17 files, confirm `title`, every `links[].href`, and every numeric claim (download counts, accuracy percentages, patient/doctor counts) matches its source exactly — §4.1–§4.3's tables are the checklist.
- Confirm the ordering check in §4.3 holds once real files exist: `microsoft-fabric-maps` → `jio-reliance-industries` by `startDate` descending (both real dates; no third, placeholder-carrying file exists).
- Confirm SP02's `check-launch-content.ts` (SP02 §4.9) reports **zero** remaining `DRAFT_DATE: true` entries (the Programming for Entrepreneurs role that would have carried one is dropped, not migrated — §4.3/§9) and zero `demo: true` projects (since `sample-project.md` is SP06's, added later) — any nonzero `DRAFT_DATE` count means something in §4.3 wasn't followed.

**External link liveness — the full list, ~23 unique URLs across all three collections** (more than the brief's own rough "~15" estimate, once work-experience's links are counted alongside projects' and research's — restated here in full since an accurate count matters more than matching the brief's estimate; one fewer than an earlier draft of this list, since `coursicle.com` — the Programming for Entrepreneurs course link — no longer ships now that role is dropped):

*Projects (15 link entries, 13 unique — 2 also appear under Microsoft Fabric Maps' work-experience links):*
`app.meetjuno.health`, `meetjuno.health`, `tejitpabari.short.gy/med-doc-tracker`, `chromewebstore.google.com/.../crunchy-filler/...`, `clipverse-five.vercel.app`, `innovationstudio.microsoft.com/.../MRTAthon-2025/project/112785`, `hackbox.microsoft.com/.../MRTAthon/project/85641`, `plugins.qgis.org/plugins/AzureMapsCreator` (shared with work experience), `azure.github.io/azure-maps-creator-onboarding-tool` (shared with work experience), `columbiavirtualcampus.com`, `facebook.com/columbiavirtualcampus`, `instagram.com/columbiavirtualcampus`, `doi.org/10.1007/s10461-019-02718-y`, `labiotech.eu/best-biotech/hiv-test-app-home` (SMARTtest's own, legitimate use of this URL — kept).

*Research (7 link entries, all unique):* `bit.ly/tejit-flood-research`, `agu.confex.com/agu/fm20/meetingapp.cgi/Paper/766342`, `bit.ly/tejit-dvmm-lab-research-2020`, `incite.columbia.edu/measuring-liberal-arts`, `researchgate.net/publication/340528010_...`, `doi.org/10.7916/D8Q24BQ9`, `hindustantimes.com/education/google-science-fair-...`, `timesofindia.indiatimes.com/education/news/...`. (The INCITE Labs "News Coverage" `labiotech.eu` link is **dropped**, not carried forward — see below.)

*Work Experience (3 link entries, 1 new + 2 shared with Projects):* `blog.fabric.microsoft.com/.../introducing-maps-in-fabric-...` (new), plus the 2 shared QGIS/Creator-Onboarding links above. Jio, Reliance Industries carries no links. (`coursicle.com/columbia/courses/INAF/U6004` — the Programming for Entrepreneurs course link — is no longer part of this list; that role is dropped, not migrated, §4.3/§9.)

**Flagged as most likely to have rotted — shorteners, checked first:** `bit.ly/tejit-flood-research`, `bit.ly/tejit-dvmm-lab-research-2020`, `tejitpabari.short.gy/med-doc-tracker` — all three are owner-controlled or third-party shorteners with no guaranteed persistence, unlike DOIs (`doi.org/...`, permanent by design) or Microsoft/Columbia-hosted URLs (institutionally stable, though Azure/hackathon URLs can still rot if the hackathon platform is retired — `hackbox.microsoft.com` in particular reads like an older, possibly-deprecated internal tool given `innovationstudio.microsoft.com` is what 2025's hackathon uses instead).

**INCITE Labs mis-paste — resolved, not carried forward.** The current `research.js` INCITE Labs entry's "News Coverage" link is `labiotech.eu/best-biotech/hiv-test-app-home/...` — the identical URL used (correctly) by SMARTtest, and has nothing to do with INCITE Labs (a Columbia liberal-arts-measurement project, not a health app). **This PRD's decision: drop the link entirely rather than invent a replacement citation.** INCITE Labs' `links[]` carries only its Website link (`https://incite.columbia.edu/measuring-liberal-arts`). Fabricating a plausible-looking "real" news citation would be worse than having one fewer link — the brief's own instruction is "drop it or replace it with a real INCITE Labs citation," and no real one is discoverable from the résumé, the site, or the current research description, so dropping it is the only defensible option available at design time. Flagged in §8 in case the owner does have a real citation to add back.

**Not worth automating:** a build-time or CI link-checker. Consistent with the brief's own explicit non-goal ("external link rot checked by hand, not automated") — 24 URLs is a five-minute manual pass, not a tooling problem.

---

## 8. Manual Intervention Required From You

1. **The 4 low-confidence project dates** (Juno `2025-06-01`, Med-Doc Tracker `2024-06-01`, Crunchy Filler `2022-01-01`, Clip-Verse `2023-06-01`) are genuine guesses with no source anchor — correct any you actually remember. None of these gates the build (unlike `DRAFT_DATE`), but a wrong one silently reorders `/projects` and can change what `featured.ts` backfills.
2. **Per-project `liveUrl` calls** — §4.1 proposes `liveUrl` for Juno (the app, not the marketing site) and the QGIS plugin (its plugin-store page), and proposes *no* `liveUrl` for everything else (hackathon submissions, Columbia Virtual Campus, SMARTtest — informational links only, no "try it now" destination). Override any of these; nothing else in the file changes if you do.
3. **Two title/naming judgment calls, low-stakes:** (a) keeping the site's "Computer Vision Researcher" over the résumé's "Machine Learning Intern" for the Jio role — same underlying work, different title; (b) keeping the site's "DVMM Lab" spelling over the résumé's "DMVV Lab" typo. Flag if you'd rather go the other way on either.
4. **Every drafted copy field is a first draft, not a final one** — the hero paragraph, the About prose, both flagship body writeups (Juno, SMARTtest), all 5 blurbs/abstracts referenced but not fully drafted in §4.5.3/§4.5.4 (8 more project descriptions, 4 more research abstracts), and the Contact copy all need your read-through and edit pass before launch. This is expected, not a gap — the brief's own stated goal is "a full first draft the owner only needs to edit," not locked final copy.
5. **The ~23-URL link-liveness checklist in §7** — a five-minute manual click-through, prioritizing the 3 shorteners flagged as most likely to have rotted.
6. **Confirm the INCITE Labs "News Coverage" link should simply be dropped** (this PRD's default) rather than replaced — supply a real citation if you have one; otherwise no action needed, the link is just absent from that file.
7. Nothing else in this sub-project is owner-blocked in a way that stops file authoring from proceeding — every table in §4.1–§4.3 is complete and usable as-is if none of the above gets a response before the tasks phase starts. (The Programming for Entrepreneurs and Social Good TA-ship dates, previously tracked here as an outstanding `DRAFT_DATE` placeholder needing your semester range, are no longer relevant — that role is dropped from the site entirely, not migrated. See §4.3/§9.)

---

## 9. Open Questions & Decisions

- `[RESOLVED: Work-experience dates for both remaining roles — Microsoft Fabric Maps and Jio, Reliance Industries — are sourced from the résumé, not placeholders]` — `2021-06-01`/`Present` and `2019-06-01`/`2019-08-01` respectively, both explicit résumé date ranges. No `DRAFT_DATE` placeholder survives to launch: the one role that would have needed one, Programming for Entrepreneurs and Social Good, is dropped from the site entirely rather than shipped on a placeholder (see the entry directly below). See §4.3.
- `[RESOLVED: the Programming for Entrepreneurs and Social Good TA-ship is dropped from the site — owner decision, 2026-08-31]` — supersedes this PRD's earlier entry about SP02's `2019-01-01` placeholder for that role "still producing correct ordering" against Jio's real date, which is now moot: there is no file for that role at all, so there's no placeholder to sort against anything. Rationale: it isn't listed anywhere in the résumé's Work/Research/Leadership sections, no dateable source exists for it anywhere, it's the weakest of the three work-experience entries for the brief's health-tech repositioning (§1), and dropping it removes the initiative's only launch-blocking `DRAFT_DATE` gate. See §4.3, SP02 §4.9/§9.
- `[RESOLVED: date-confidence tiering — high/medium/low, stated per item in §4.1/§4.2, methodology in §4.4]` — resolves SP02's own previously open item ("Exact date values for all 10 projects and 5 research entries") for 11 of the 15 items at high or medium confidence; the remaining 4 (all Projects) are explicit low-confidence guesses, flagged for owner correction in §8 rather than left ambiguous.
- `[RESOLVED: Juno and SMARTtest are the only two projects getting a `body` writeup; the other 8 projects and all 5 research entries ship `description`/abstract + links only]` — justified per-item in §4.1's note: the other 8 are each fully explained by a short blurb and their existing link; a longer writeup would pad, not inform. See §4.1.
- `[RESOLVED: INCITE Labs' mis-pasted News Coverage link is dropped, not replaced with a fabricated citation]` — no real INCITE Labs press citation is discoverable from any available source at design time; inventing one would be worse than omitting it. Owner can supply a real one later. See §7.
- `[RESOLVED: image placeholder discipline — byte-identical URL across all 15 project/research files, no query-string variation]` — makes a future global or per-file swap a single grep away rather than a hunt. See §4.6.
- `[RESOLVED: Jio role keeps the site's "Computer Vision Researcher" title over the résumé's "Machine Learning Intern"]` — same work, judged to read better next to the site's other role titles; flagged as overridable in §8, not treated as a hard fact to preserve.
- `[RESOLVED: research lab keeps the site's "DVMM Lab" spelling over the résumé's apparent "DMVV Lab" typo]` — DVMM (Digital Video and Multimedia Lab) is Columbia's actual, publicly documented lab name. See §4.4.
- `[DEFERRED: owner-only — confirm or correct the four low-confidence dates]` — the drafted values (Juno `2025-06-01`, Med-Doc Tracker `2024-06-01`, Crunchy Filler `2022-01-01`, Clip-Verse `2023-06-01`) are internally consistent and produce a sensible `/projects` ordering, so nothing is blocked from being built; only the owner can supply the real dates. A wrong guess silently reorders `/projects` and changes what `featured.ts` backfills, with no build-time signal — unlike `DRAFT_DATE`, nothing gates on these. Stays listed in §8, item 1.
- `[DEFERRED: owner-only — the default is "no body", per §4.1]` — brief §2 settles that a project with no `body` renders correctly from `description` + `links` alone, so the site is complete either way; adding a body is an editorial choice the owner makes after reading the drafted card blurbs. No build or design work is contingent on it.
- `[DEFERRED] The 8 remaining project descriptions and 4 remaining research abstracts not fully drafted in this PRD (§4.5.3/§4.5.4 name the rule and give two/one worked example each) are a mechanical drafting task for the tasks phase, not a second design pass]` — the voice, length, and throughline are established by the worked examples; writing the rest doesn't require further design decisions.
