# PRD — Round 2, Sub-project R3: Content Data

**Project:** tejitpabari.com revision round 2
**Repo / branch:** `/root/projects/tejitpabari`, branch `website-revamp` (already checked out; do not switch)
**Round:** 2026-09-01, owner feedback round 2 (see `REVISION-BRIEF.md`)
**Owns:** `src/content/**`, `src/config/featured.ts`, `src/pages/live/**` (including the `sample-project`
deletion and its registry), and the `scripts/`/`src/pages/*.test.tsx` tests that reference the slugs
deleted this round.
**Does NOT own (hard boundaries — cross-notes only, see §9):** `src/layout/*` (R1), `src/sections/*`
(R2), `src/components/*` / `src/data/{ContentBody,markdownComponents}.tsx` (R4), the legal pages (R5).
`src/config/links.ts` (`RESUME_URL`) is R1's file — not touched here even though locked decision 6
depends on it.
**Source of truth for facts:** `RESUME-EXTRACT.md` (the owner's real resume, transcribed 2026-09-01).
No claim in this document goes beyond what that file states.
**Prior planning referenced:** `.dev/website-revamp/02-content-pipeline/PRD.md` (the content contract
this PRD stays inside — no schema changes), `.dev/website-revamp/06-sharing-seo-sample-project/PRD.md`
§8 (the original, incomplete 3-item deletion checklist), `.dev/website-revamp/review-2026-08-31-1000.md`
(the rehearsal that found the two real build breaks from following that incomplete checklist).

---

## 1. Problem

Three unrelated pieces of `src/content/**` are stale or wrong relative to what the owner actually
wants live:

1. **Work experience is thin and one entry is factually wrong.** `src/content/work-experience/` has
   two files. `microsoft-fabric-maps.md` collapses two real, distinct Microsoft levels (Software
   Engineer, June 2021 – March 2024, and Software Engineer II, March 2024 – Present) into one entry
   with an approximate body that doesn't trace to the resume at all (mentions of a "15% latency
   regression cut" and "shadow PM" work appear nowhere in `RESUME-EXTRACT.md`), and carries two links
   the owner explicitly wants removed. `jio-reliance-industries.md` is correct and stays, but because
   the landing timeline currently only has 2 entries total, it wrongly occupies a landing-page slot
   (owner feedback #9: "the second role must not be Computer Vision Researcher").
2. **Two projects need to disappear, and one demo project is scaffolding that was never meant to
   survive launch.** `fabric-maps-mcp-server.md` and `azure-maps-ai-assistant.md` are Microsoft
   hackathon side-projects the owner now wants folded into the Microsoft work-experience bullet
   instead of standing alone as Projects (locked decision 3). `sample-project.md` plus its `/live`
   page were always documented, deletable scaffolding (SP06 PRD §8) that a prior review already
   rehearsed deleting once — and found that the *documented* deletion checklist was incomplete
   (`review-2026-08-31-1000.md`'s Adversarial Correctness section), leaving a real build break behind.
3. **Nobody has traced what a 6→8-project, 1→0-hosted-live-page world actually looks like.**
   `src/config/featured.ts`'s backfill, `HOSTED_LIVE_PAGES` going empty, and `generate-sitemap.mjs`'s
   hosted-slug parser all have real, load-bearing behavior at these boundary conditions that has never
   been exercised with *this* round's actual before/after counts.

## 2. Goals

- Rebuild `src/content/work-experience/` from `RESUME-EXTRACT.md` only: split the combined Microsoft
  entry into two real, dated roles; keep only the Fabric Maps blog link; keep Jio unchanged as a third
  entry per locked decision 5.
- Delete `src/content/projects/fabric-maps-mcp-server.md` and `azure-maps-ai-assistant.md` outright
  (locked decision 3, no `hidden` flag), and trace every consumer of the projects collection so the
  landing page's featured list, the sitemap, the OG-card generator, and every test that names either
  slug are all accounted for.
- Delete the entire `sample-project` demo — content file, hosted `/live` page, its test, and its
  registry entry — using the **complete**, four-item checklist the round-1 rehearsal proved correct,
  not the three-item version that broke the build twice.
- Trace what an empty `HOSTED_LIVE_PAGES` means for every function and script that reads it, and
  confirm `npm run check:launch` goes green.
- State the exact `firebase.json` `hosting.redirects` content this round's deletions leave behind.

## 3. Non-Goals

- Adding Crontick, Hospital-Bill-Checker, or NGO Auto-Mailer as new Project content files — the resume
  lists them, but the owner did not ask for them this round (§9, `[DEFERRED]`).
- Any change to `src/sections/WorkExperienceSection.tsx`'s copy, layout, or the "Where I've worked and
  what I've built." headline — R2's scope. This PRD only changes what content that section *renders*,
  never the section component itself.
- Any change to `src/components/*` (`ProjectCard`, `TagPill`, a status-badge component, etc.) or
  `src/data/{ContentBody,markdownComponents}.tsx` — R4's scope.
- Updating `RESUME_URL` in `src/config/links.ts` — R1's file (locked decision 6 is implemented there,
  not here).
- Re-litigating the four SP07 low-confidence project dates (Juno, Med-Doc Tracker, Crunchy Filler,
  Clip-Verse) — a pre-existing, unrelated open item from round 1; this round's featured-list recompute
  (§4.2) only re-sorts around them, it doesn't change their date confidence.
- Any change to the content-collection *schema* (`ALLOWED_KEYS`, `Project`/`WorkExperience` types in
  `src/data/{projects,workExperience}.ts`) — every file this PRD adds or edits fits the existing
  contract exactly (SP02, `02-content-pipeline/PRD.md`).

---

## 4. Architecture Decisions

### 4.1 Work-experience rebuild

**Current state (2 files):**

| File | company | role | startDate | endDate | links |
|---|---|---|---|---|---|
| `microsoft-fabric-maps.md` | Microsoft Fabric Maps | Software Engineer II | 2021-06-01 | Present | Fabric Maps blog, QGIS Plugin, Creator Onboarding Tool |
| `jio-reliance-industries.md` | Jio, Reliance Industries | Computer Vision Researcher | 2019-06-01 | 2019-08-01 | (none) |

**New state (3 files):** the single Microsoft file is deleted and replaced by two files, one per
resume-stated level; Jio is untouched.

| File | company | role | startDate | endDate | links |
|---|---|---|---|---|---|
| `microsoft-fabric-maps-swe-ii.md` (NEW) | Microsoft Fabric Maps | Software Engineer II | 2024-03-01 | Present | Fabric Maps blog only |
| `microsoft-fabric-maps-swe.md` (NEW) | Microsoft Fabric Maps | Software Engineer | 2021-06-01 | 2024-03-01 | (none) |
| `microsoft-fabric-maps.md` (DELETED) | — | — | — | — | — |
| `jio-reliance-industries.md` (unchanged) | Jio, Reliance Industries | Computer Vision Researcher | 2019-06-01 | 2019-08-01 | (none) |

**Why these two filenames.** The existing naming convention is `<company-slug>.md` (one file per
company). With two entries at the same company, `<company-slug>-<level-slug>.md` extends that
convention with the minimum information needed to keep both filenames unique and self-describing
(`assertNoUnknownKeys`/`assertRequiredString` don't validate filenames beyond uniqueness, but a human
skimming `ls src/content/work-experience/` should be able to tell the two apart without opening
either file).

**Why the transition date is `2024-03-01` on both sides.** The resume gives "March 2024" with no day.
Every existing date field in this collection normalizes to the 1st of the month (see
`normalizeDateField`, `src/data/shared.ts:69-77`, and every current file's `YYYY-MM-01` values) — this
follows that existing convention, not a resume-stated day. `[RESOLVED]` in §9 by orchestrator decision
(it cannot silently break anything: `formatWorkDate`, `src/components/timeline/formatWorkDate.ts`,
only ever renders month + year, never the day).

**The bullet-to-level split — a judgment call, not a resume fact.** The resume lists five bullets under
one combined "Microsoft Fabric Maps" heading, not per level:

1. Lead engineer for disaster recovery: failover impact analysis, platform-aligned mitigations,
   pre-production ring validation, expanded production metrics/telemetry.
2. Led OAP, a cross-team security initiative: customer data-boundary requirements → technical scope,
   design/implementation with platform and dependent workloads.
3. Led the Tileset Job API: owned architecture, .NET backend, frontend integration, validation,
   testing, telemetry, iteration from stakeholder feedback.
4. Delivered security/reliability work: Dev-Ops YAML pipeline migration, PowerBI-driven load-testing
   system.
5. AI champ: Fabric Maps MCP server, Azure Maps NL-to-map assistant, agentic repo onboarding, reusable
   plugins/skills, AI knowledge-sharing sessions.

Assigned as follows, and reasoned explicitly so the owner could check the reasoning, not just the
result — **confirmed as proposed by the owner (2026-09-01), `[RESOLVED]` in §9**:

- **Bullets 1, 2, 5 → Software Engineer II (current, Mar 2024–Present).** Bullets 1 and 2 are both
  framed as "lead"/"led" ownership of cross-team initiatives (disaster recovery across the whole
  product, a security initiative spanning platform + other workloads) — the kind of scope increase
  that typically accompanies a level-up, not a first-role assignment. Bullet 5's specific
  deliverables — an MCP server and "agentic" repository onboarding — use vocabulary (Model Context
  Protocol, agentic workflows) that only became mainstream industry terminology from late 2024
  onward, which points at the current role's timeframe over the 2021–2024 one. This is also the
  resume's own `fabric-maps-mcp-server`/`azure-maps-ai-assistant` substance, which locked decision 3
  says now "lives as a bullet on the Microsoft work-experience entry" — placed on the *current* entry.
- **Bullets 3, 4 → Software Engineer (Jun 2021–Mar 2024).** Bullet 3 reads as foundational,
  first-build ownership of a system "from the ground up" (architecture through delivery), the kind of
  scoped, single-system project typical of an individual contributor's early tenure rather than a
  cross-team leadership bullet. Bullet 4's infrastructure/tooling work (pipeline migration,
  load-testing framework) reads the same way — foundational plumbing rather than a leadership
  initiative.

**Owner instruction: keep only the Fabric Maps blog link.** Both `QGIS Plugin`
(`https://plugins.qgis.org/plugins/AzureMapsCreator/`) and `Creator Onboarding Tool`
(`https://azure.github.io/azure-maps-creator-onboarding-tool/`) links are dropped from the
work-experience entry (they remain live, unrelated Project pages —
`src/content/projects/qgis-plugin-azure-maps-creator.md` and `creator-onboarding-tool.md` — this PRD
does not touch either of those files or delete either project). The Fabric Maps blog link
(`https://blog.fabric.microsoft.com/en-us/blog/introducing-maps-in-fabric-geospatial-insights-for-everyone/`)
is placed on the **Software Engineer II** (current) entry — it's a general team-context link, and the
current-role entry is the one the landing page shows first. `[RESOLVED]`, restated in §9.

**Full proposed content, both new files:**

```markdown
<!-- src/content/work-experience/microsoft-fabric-maps-swe-ii.md -->
---
company: Microsoft Fabric Maps
role: Software Engineer II
startDate: "2024-03-01"
endDate: "Present"
links:
  - label: Fabric Maps blog
    href: https://blog.fabric.microsoft.com/en-us/blog/introducing-maps-in-fabric-geospatial-insights-for-everyone/
---
I lead disaster recovery for Fabric Maps. That means analyzing how a failover would ripple across every workstream, building mitigations that match the wider platform's approach, validating resilience in pre-production rings, and expanding the metrics and telemetry we track once something ships to production. I also led OAP, a cross-team security initiative that started with a customer's data-boundary requirements and turned them into concrete technical scope, then drove the design and build together with the platform team and every other dependent workload involved. On top of that, I've become the team's go-to person for AI: I built a Fabric Maps MCP server, an Azure Maps assistant that turns natural-language prompts into map visualizations, tools for agentic repository onboarding, and a set of reusable plugins and skills, and I run sessions to share what I'm learning with the rest of the team.
```

```markdown
<!-- src/content/work-experience/microsoft-fabric-maps-swe.md -->
---
company: Microsoft Fabric Maps
role: Software Engineer
startDate: "2021-06-01"
endDate: "2024-03-01"
links: []
---
I owned the Tileset Job API from the ground up, the system Fabric Maps relies on for large-scale geospatial ingestion and map-tile generation. That meant designing the architecture, building the .NET backend and its frontend integration, and handling validation, testing, and telemetry myself, then iterating as real feedback came in from stakeholders. I also picked up a good share of the team's security and reliability work during this period, including migrating our Dev-Ops pipelines to YAML and building a PowerBI-driven load-testing system.
```

Both bodies are checked against `RESUME-EXTRACT.md` line by line; no fact appears that isn't stated
there. Neither body uses an em dash (locked decision 7a). `jio-reliance-industries.md` needs no edit —
its existing body already has no em dashes and every claim traces to `RESUME-EXTRACT.md`'s explicit
note that it's real history the owner wants kept.

**Ordering and landing-page consequence, confirmed by reading the real code (not assumed):**

- `src/data/workExperience.ts:44`: `workExperience` is sorted `.sort((a, b) => b.startDate.localeCompare(a.startDate))` —
  descending by ISO date string. With the three real `startDate` values (`2024-03-01`, `2021-06-01`,
  `2019-06-01`), the sorted order is **[Software Engineer II, Software Engineer, Jio]** — string
  comparison and calendar order agree here, no edge case.
- `src/sections/WorkExperienceSection.tsx:9` (`LANDING_TIMELINE_LIMIT = 2`) and
  `WorkExperienceSection.tsx:14-19` (`computeLandingTimelineState`): `entries = all.slice(0, 2)` →
  the two Microsoft roles; `hasMore = all.length > limit` → `3 > 2` → **`true`, for the first time
  ever** (today's 2-entry content makes this `false`; this round's 3rd entry is what flips it).
  Jio is pushed out of `entries` and is visible only on `/work-experience`
  (`src/pages/WorkExperiencePage.tsx:20`, which renders `<Timeline entries={workExperience} />` with
  no limit). This is exactly locked decision 5 and owner feedback #9's intent.
- `src/components/timeline/Timeline.tsx:16-25`: `showSeeAll={hasMore}` now renders `true` on the
  landing page for the first time, which mounts `TimelineSeeAllStub`
  (`src/components/timeline/TimelineSeeAllStub.tsx`) — a `role="listitem"` link to `/work-experience`
  reading "See all experience" with an arrow icon, styled with the same border-left spine as a real
  entry so the timeline visually continues rather than terminating. Traced end to end: both Microsoft
  `TimelineEntry`s get `isLast={!showSeeAll && index === entries.length - 1}` → `false` for both
  (since `showSeeAll` is `true`), so both keep standard `pb-6` bottom padding and the stub renders
  immediately after the second entry with no visual gap or double-padding. **This affordance is
  already fully built and already unit-tested in isolation** (`Timeline.test.tsx`'s three `showSeeAll`
  cases, `WorkExperienceSection.test.ts`'s three `computeLandingTimelineState` boundary cases at
  `limit - 1`, `limit`, `limit + 1`) — what's never been exercised is this exact code path end to end
  against **real** content instead of synthetic fixtures. Flagged in §7 as a real, newly-reachable
  gap, not a design defect.

**Does the two-entries-same-company shape break anything? Traced, not assumed — no.**

- **Duplicate-slug guards:** `src/data/projects.ts:71-78` and `src/data/research.ts` (mirrored
  pattern, ~line 62) both throw `Duplicate slug "..."` — but that guard is keyed off a `slug`
  frontmatter field neither work-experience file has. `parseWorkExperience`
  (`src/data/workExperience.ts:20-38`) derives `id` directly from the filename
  (`workExperience.ts:21`, `path.split('/').pop()!.replace(/\.md$/, '')`) with **no explicit
  duplicate-id guard anywhere in the file**. This is safe by construction, not by luck: a flat
  directory cannot hold two files with the same filename, so `id` uniqueness is enforced by the
  filesystem itself before any JS code ever runs. Two different filenames (as designed here) simply
  never collide.
- **`parseWorkExperience` validation:** re-read line by line against both new files — `company`,
  `role`, `startDate`, `links` are all present and correctly typed; `endDate` is either `'Present'`
  (SWE II) or a valid `YYYY-MM-DD` string (SWE); no `DRAFT_DATE` key; body is non-empty on both. Both
  files parse cleanly under the existing, unmodified validator — no schema or code change needed.
- **The timeline's company-heading rendering:** `TimelineEntry.tsx:29-31` renders `entry.company` as
  plain text per entry, with no grouping, no deduplication, and no "same company as previous entry"
  special case anywhere in `Timeline.tsx` or `TimelineEntry.tsx`. Two consecutive entries both reading
  "MICROSOFT FABRIC MAPS" is the **intended** result — it's how the timeline is supposed to show a
  promotion at the same company (heading repeats, role and dates change underneath it), not a bug to
  design around.
- **`/work-experience` page grouping:** `WorkExperiencePage.tsx:14-21` passes the full, already-sorted
  `workExperience` array straight into `<Timeline entries={workExperience} />` with no grouping,
  filtering, or company-collapsing logic of any kind. All three entries render as three independent
  `TimelineEntry`s in sorted order — no code change needed there either.

### 4.2 Deleting `fabric-maps-mcp-server.md` and `azure-maps-ai-assistant.md`

Both are deleted outright, no `hidden` frontmatter flag (locked decision 3) — their substance now
lives in the Software Engineer II bullet above (§4.1).

**Consumer trace (grepped, not assumed):**

| Consumer | File | Effect |
|---|---|---|
| Featured-projects list | `src/config/featured.ts` | Owner decision (2026-09-01): `FEATURED_PROJECT_SLUGS` is pinned to an explicit, ordered six-slug list (below) — a real, deliberate edit to this file, not a side effect of the two deletions. Neither deleted slug appears in the pinned list either way. |
| `getStaticPaths` for `/projects/:slug` | `src/content/projects/index.ts` | `projectSlugs = projects.map(p => p.slug)` is fully derived from the live `projects` array — **zero code change**, the two paths simply stop being generated. |
| `firebase.json` `hosting.redirects` | `vite.config.ts`'s `liveRedirectsPlugin`/`readLiveUrls` | Neither deleted file has a `liveUrl` field — **no effect on the redirect list at all** (§4.4). |
| `public/sitemap.xml` | `scripts/generate-sitemap.mjs` | `collectionSlugs()` reads the real `src/content/projects/` directory — **zero code change**, URL count drops by 2 (§4.3's count table folds this in). |
| OG cards | `scripts/generate-og-cards.mjs` | `readCollection('projects')` reads the same real directory — **zero code change**, 2 fewer PNGs generated under `public/og/projects/`. |
| Tests | grepped for `fabric-maps-mcp-server`, `azure-maps-ai-assistant`, `Fabric Maps MCP Server`, `Azure Maps AI Assistant` across every `*.test.ts(x)` in the repo | **Zero hits.** No test hardcodes either slug or title — confirmed by `grep -rln` returning nothing. Nothing to edit. |

**The featured-projects list — pinned explicitly by owner decision (2026-09-01), not backfilled.**
The owner reviewed the previously-proposed backfill result (`juno, smarttest, med-doc-tracker,
clip-verse, creator-onboarding-tool, qgis-plugin-azure-maps-creator`, computed by
`computeFeatured`'s date-descending backfill over the post-deletion corpus) and rejected the
"whatever ranks highest by date" mechanism in favor of an explicit, hand-picked list. This is a
design change to `src/config/featured.ts`, not a status flip:

```ts
export const FEATURED_PROJECT_SLUGS: string[] = [
  'juno',
  'smarttest',
  'med-doc-tracker',
  'clip-verse',
  'columbia-virtual-campus',
  'crunchy-filler',
];
```

**`computeFeatured`'s guards, re-verified against this exact input (read directly from
`src/config/featured.ts`, reproduced in full below):**

```ts
export const MAX_FEATURED = 6;

export function computeFeatured(all: Project[], slugs: string[]): Project[] {
  if (slugs.length > MAX_FEATURED) {
    throw new Error(`... FEATURED_PROJECT_SLUGS has ${slugs.length} entries, max is ${MAX_FEATURED}.`);
  }
  const uniqueSlugs = [...new Set(slugs)];
  if (uniqueSlugs.length !== slugs.length) {
    throw new Error(`... FEATURED_PROJECT_SLUGS contains a duplicate slug.`);
  }
  const featured: Project[] = [];
  for (const slug of uniqueSlugs) {
    const project = all.find((p) => p.slug === slug);
    if (!project) {
      throw new Error(`... unknown project slug "${slug}" — no file at src/content/projects/${slug}.md.`);
    }
    featured.push(project);
  }
  const remainingSlots = MAX_FEATURED - featured.length;
  if (remainingSlots > 0) {
    const backfill = all
      .filter((p) => !uniqueSlugs.includes(p.slug))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, remainingSlots);
    featured.push(...backfill);
  }
  return featured;
}
```

- **`slugs.length > MAX_FEATURED` throw:** `slugs.length` is 6, `MAX_FEATURED` is 6 — `6 > 6` is
  `false`. Does not fire.
- **Duplicate guard:** `juno`, `smarttest`, `med-doc-tracker`, `clip-verse`, `columbia-virtual-campus`,
  `crunchy-filler` are six distinct strings — `uniqueSlugs.length === slugs.length` holds, no throw.
- **Unknown-slug guard:** all six have a matching `src/content/projects/<slug>.md` file, confirmed by
  reading the real directory listing on this branch — `juno.md`, `smarttest.md`, `med-doc-tracker.md`,
  `clip-verse.md`, `columbia-virtual-campus.md`, `crunchy-filler.md` are all present, and none of them
  is one of this round's three deletions (`fabric-maps-mcp-server.md`, `azure-maps-ai-assistant.md`,
  `sample-project.md`). No throw.
- **`remainingSlots`:** `MAX_FEATURED - featured.length` = `6 - 6` = `0`. `remainingSlots > 0` is
  `false` — **the backfill branch does not execute at all.** `computeFeatured` returns exactly the six
  pinned projects, in the order given.

**Resulting `featuredProjects`, in order, after this round's changes:**

```
juno, smarttest, med-doc-tracker, clip-verse, columbia-virtual-campus, crunchy-filler
```

This is now fully deterministic: the landing page's featured set no longer reshuffles when a project
is added, removed, or re-dated, because the backfill code path that used to cause that is
unreachable with six pinned slugs against `MAX_FEATURED = 6`.

**`creator-onboarding-tool` and `qgis-plugin-azure-maps-creator` stay reachable at `/projects`.**
Neither is deleted by this round (§4.1 confirms neither of their two links, which move to the
work-experience entry, touches the Project content files themselves) — they keep their
`src/content/projects/*.md` files and their `getStaticPaths`-generated detail pages
(`/projects/creator-onboarding-tool`, `/projects/qgis-plugin-azure-maps-creator`). They are simply no
longer in `FEATURED_PROJECT_SLUGS`, so they don't appear in the landing page's Featured Projects
section — they remain listed on `/projects` like every other non-featured project.

### 4.3 Deleting the `sample-project` demo

**The complete deletion checklist — four items, matching the round-1 rehearsal's proven-correct list,
not the three-item list that broke the build twice** (`review-2026-08-31-1000.md`'s Adversarial
Correctness section, findings 1–2):

1. `src/content/projects/sample-project.md` — delete.
2. `src/pages/live/sample-project.tsx` — delete.
3. `src/pages/live/sample-project.test.tsx` — delete. **This is the item the original SP06 PRD §8 and
   `sample-project.md`'s own header comment both omitted**, which is exactly why following the
   originally-documented checklist left a dangling `import SampleProjectLive from './sample-project';`
   in the orphaned test file and failed `npm run typecheck` (finding 1). Only `TASKS.md`'s Task 7
   precondition block had the correct four-item version at the time. This PRD's checklist is
   authoritative going forward — deleting only items 1, 2, and 4 (skipping this item) reproduces a
   real, previously-observed build break.
4. `src/pages/live/registry.ts` — remove the `import SampleProjectLive from './sample-project';` line
   and the `'sample-project': SampleProjectLive,` entry, leaving:

   ```ts
   export const HOSTED_LIVE_PAGES: Record<string, ComponentType> = {};
   ```

**Tracing what an empty `HOSTED_LIVE_PAGES` actually does to every downstream consumer — this is the
part the round-1 rehearsal exercised and this PRD carries forward, verified against the *current*
code on this branch, not re-derived from scratch:**

- **`validateLiveRegistry`** (`registry.ts:19-31`): `HOSTED_SLUGS = Object.keys({})` = `[]`. The
  `for (const slug of hostedSlugs)` loop body never executes. No throw, regardless of the real
  `projects` array's contents — this function degrades to a no-op, safely, on an empty registry.
- **`computeProjectLiveSlugs`** (`registry.ts:34-36`): `allProjects.filter(p => p.liveUrl || [].includes(p.slug))`
  reduces to `allProjects.filter(p => p.liveUrl)` — i.e. **exactly the 6 redirect-mode projects**
  (§4.4). Not empty. This is the load-bearing detail: `getStaticPaths` for `/projects/:slug/live`
  (`src/routes.tsx:29`, `projectLiveSlugs.map(slug => \`projects/${slug}/live\`)`) still returns 6
  paths, not 0, after this deletion — the route is not dead, it just no longer has any *hosted*-mode
  member.
- **`hasLiveRoute`** (`registry.ts:53-55`): `projectLiveSlugs.includes(slug)` — same 6-slug set, used
  by `LinksRow` (R4-owned component, not touched here) to decide whether to show "Open Live" on a
  project detail page. Unaffected by the `sample-project` deletion specifically (that project's own
  detail page simply stops existing, per §4.2's pattern).
- **`ProjectLivePage.tsx`** (`src/pages/ProjectLivePage.tsx:9-27`): for any of the 6 remaining
  `/projects/:slug/live` paths, `HOSTED_LIVE_PAGES[slug]` is now always `undefined` (the object is
  empty), so every one of them falls through to the `project?.liveUrl` branch and renders
  `LiveRedirectFallback` — never the removed hosted-dispatch branch. Confirmed by reading the function
  top to bottom: no code path assumes `HOSTED_LIVE_PAGES` is non-empty.
- **`scripts/generate-sitemap.mjs`'s `hostedLiveSlugs()`** (lines ~44–68): **the Prettier-`{}`-collapse
  fix (round-1 rehearsal finding 2, commit `fa36cee`) is already present on this branch** — the regex
  `/HOSTED_LIVE_PAGES\s*:\s*Record<[^>]*>\s*=\s*\{([\s\S]*?)\}\s*;?/` and its accompanying comment
  ("This deliberately tolerates every Prettier-legal rendering of an empty object... `{}`, `{\n}`,
  with or without a trailing `;`") are already in the file, and `generate-sitemap.test.ts` already has
  the four regression cases (`{}` on one line, `{\n}` two-line, populated multi-line, missing-file
  throw) proving it. **Verified, not re-designed — carry forward as-is, this is not new work.** Given
  an empty `HOSTED_LIVE_PAGES`, `hostedLiveSlugs()` correctly returns `[]`.
- **`scripts/check-no-forms.sh`**: greps `src/pages/live/` for `<(input|form|textarea)[\s/>]`. After
  this deletion, that directory contains only `registry.ts` and `registry.test.ts` — zero `.tsx`
  files, zero matches, `grep -RPzl` finds nothing and exits 1, the `if` block is skipped, and the
  script prints its pass message and exits 0. **The script does not assume at least one hosted page
  exists** — it's a pure content-absence check, not a presence check, so an empty `src/pages/live/`
  directory (content-file-wise) is exactly as clean a pass as a populated one.

**`npm run check:launch` — confirmed to go green.** The gate
(`scripts/check-launch-content.test.ts`, run via `CHECK_LAUNCH=1 vitest run
scripts/check-launch-content.test.ts && npm run check:no-forms`) checks two things against the real,
loaded `projects`/`workExperience` arrays: no `WorkExperience` with `draftDate: true`, and no `Project`
with `demo: true`. Today it is **RED on purpose**: `sample-project.md` is the one project with
`demo: true`, so `checkLaunchContent`'s second test fails by design, reporting exactly that file.
After this deletion, `projects` contains zero `demo: true` entries and `workExperience` contains zero
`DRAFT_DATE`/`draftDate: true` entries (neither new Microsoft file nor the untouched Jio file sets
`DRAFT_DATE`) — both `check:launch` assertions pass, and `check:no-forms` (chained after it) passes
independently as traced above. **Confirmed green**, not just "should be."

**Build-artifact count changes — computed exactly against the real current corpus, cross-checked
against `review-2026-08-31-1000.md`'s own historical numbers where the two runs overlap:**

| Artifact | Before this round | After this round | Formula |
|---|---|---|---|
| `public/sitemap.xml` `<loc>` entries | 23 (matches the currently-committed file's real `grep -c '<loc>'` count) | 19 | 6 static + 8 projects + 5 research + 0 hosted-live (was 1) |
| Prerendered `index.html` pages | 29 (matches `review-2026-08-31-1000.md`'s independently-observed number for the *prior* round's corpus) | 25 | 6 static + 8 project-detail + 5 research-detail + 6 `/live` (union of liveUrl-bearing ∪ hosted; was 7 = 6 liveUrl + 1 hosted) |
| OG-card PNGs under `public/og/` | 17 (11 projects + 5 research + 1 default; matches the review's number) | 14 | 8 projects + 5 research + 1 default |

(11 projects and 1 hosted-live before this round; 8 projects and 0 hosted-live after — the 29→25 and
23→19 deltas both equal 4 and 4 respectively: 3 fewer project-detail pages, 1 fewer `/live` page, and
correspondingly 3 fewer project sitemap entries + 1 fewer hosted-live sitemap entry.)

### 4.4 `liveUrl` / redirect audit

`vite.config.ts`'s `readLiveUrls()` (lines ~30–46) scans every `src/content/projects/*.md` file
directly via `gray-matter`, independent of `src/data/projects.ts` and independent of
`HOSTED_LIVE_PAGES` — it only cares whether a file's frontmatter has a `liveUrl` string. None of the
three files this round deletes (`fabric-maps-mcp-server.md`, `azure-maps-ai-assistant.md`,
`sample-project.md`) has a `liveUrl` field — confirmed by reading all three files' frontmatter
directly. **The redirect list this round produces is therefore identical, entry-for-entry, to what it
was before this round.** The 6 surviving `liveUrl`-bearing projects and the `firebase.json`
`hosting.redirects` block `liveRedirectsPlugin` writes at build time:

```json
[
  { "source": "/projects/clip-verse/live", "destination": "https://clipverse-five.vercel.app/", "type": 302 },
  { "source": "/projects/creator-onboarding-tool/live", "destination": "https://azure.github.io/azure-maps-creator-onboarding-tool/", "type": 302 },
  { "source": "/projects/crunchy-filler/live", "destination": "https://chromewebstore.google.com/detail/crunchy-filler/djbcknbbfoldifpllefimnnkfaogcnid", "type": 302 },
  { "source": "/projects/juno/live", "destination": "https://app.meetjuno.health/", "type": 302 },
  { "source": "/projects/med-doc-tracker/live", "destination": "https://tejitpabari.short.gy/med-doc-tracker", "type": 302 },
  { "source": "/projects/qgis-plugin-azure-maps-creator/live", "destination": "https://plugins.qgis.org/plugins/AzureMapsCreator/", "type": 302 }
]
```

Whether `firebase.json` staying git-dirty after every build is committed or ignored is R6's decision
(SHARED-CONTEXT.md, "Verified environment facts") — this section only states the *content* that block
should have; it does not touch `firebase.json` or R6's tracking decision.

---

## 5. API Change Summary

N/A — static, prerendered site, no runtime API. The closest analog is the shape of build-time
generated artifacts, fully covered by §4.2's and §4.3's count tables and §4.4's redirect-block content.

---

## 6. Frontend Change Summary

(Content-driven only — no component code in this PRD's scope. Rendering/layout consequences are
called out for R2/R4 to consume, not designed here.)

| Route | Before | After |
|---|---|---|
| `/` (landing, `WorkExperienceSection`) | 2 timeline entries (SWE II Microsoft, Computer Vision Researcher Jio), no "See all" stub | 2 timeline entries (Software Engineer II, Software Engineer — both Microsoft), **"See all experience" stub now renders for the first time** |
| `/work-experience` | 2 entries | 3 entries (Software Engineer II, Software Engineer, Jio — in that order) |
| `/` (landing, `FeaturedProjectsSection`) | `juno, smarttest, med-doc-tracker, fabric-maps-mcp-server, azure-maps-ai-assistant, clip-verse` (backfill computed pre-deletion, for reference) | `juno, smarttest, med-doc-tracker, clip-verse, columbia-virtual-campus, crunchy-filler` (owner-pinned explicit list, no backfill) |
| `/projects` | 11 cards | 8 cards |
| `/projects/fabric-maps-mcp-server`, `/projects/azure-maps-ai-assistant`, `/projects/sample-project` | Live | 404 (paths no longer generated by `getStaticPaths`) |
| `/projects/sample-project/live` | Live (hosted, ticking clock demo) | 404 |
| `/projects/<the 6 liveUrl projects>/live` | Redirect-fallback page | Unchanged — still redirect-fallback pages |

---

## 7. Testing

**Tests that literally break if the deletion is done incompletely (i.e., what this PRD's four-item
checklist in §4.3 exists to prevent):**

- Skipping `sample-project.test.tsx` in the deletion → its `import SampleProjectLive from
  './sample-project';` dangles → `npm run typecheck` fails, `npm test` fails to even collect that
  file. This is finding 1 from `review-2026-08-31-1000.md`, already fixed once in that rehearsal;
  this PRD's checklist exists specifically so it isn't re-broken.

**Tests confirmed to keep passing with zero code changes, verified by tracing (not assumed —
this were the ones the task's own "quick scan" flagged for a closer look):**

- `src/pages/live/registry.test.ts` — every assertion uses the exported, parameterized
  `validateLiveRegistry`/`computeProjectLiveSlugs`/`hasLiveRoute` against **fixture** `Project[]`
  arrays it constructs itself, never the real `HOSTED_LIVE_PAGES`. The one place it touches real state
  (`hasLiveRoute('definitely-not-a-real-project-slug')` returning `false`) is true regardless of
  registry contents. No edit required for the tests to pass; **its header comment is stale** (see
  cleanup list below).
- `src/pages/ProjectDetailPage.test.tsx` — mocks `@/data`'s `projects` to
  `[FIXTURE_PROJECT, ...hostedRealProjects]` where `hostedRealProjects =
  actual.projects.filter(p => p.slug === 'sample-project')`. After deletion, `actual.projects` (the
  real, unmocked content) has no `sample-project` entry, so `hostedRealProjects` evaluates to `[]` and
  the mock becomes `[FIXTURE_PROJECT]` — still valid, `registry.ts`'s eager
  `validateLiveRegistry(HOSTED_SLUGS, projects)` loop is a no-op regardless (its own `HOSTED_SLUGS` is
  now `[]`, from the real, unmocked `registry.ts` after §4.3's edit). **Passes unedited**, but the
  `hostedRealProjects` line is now dead-weight scaffolding for a case that can't occur — cleanup
  recommended, not required (below).
- `src/pages/ProjectLivePage.test.tsx` — fully mocks `./live/registry`'s `HOSTED_LIVE_PAGES` itself
  (`vi.mock('./live/registry', () => ({ HOSTED_LIVE_PAGES: { 'sample-project': ... } }))`), so it
  never touches the real (now-empty) registry at all. `'sample-project'` here is only ever an
  arbitrary fixture slug name, not a reference to the real deleted content. **Passes unedited.**
- `src/config/site.test.ts`, `src/components/RouteMeta.test.tsx` — grepped directly for
  `sample-project`: **zero occurrences in either file's body**, only in the original task brief's
  "quick scan" list. Confirmed false positives — no change needed.
- `scripts/check-launch-content.test.ts`, `scripts/check-no-forms.test.ts`,
  `scripts/generate-og-cards.test.ts`, `scripts/generate-sitemap.test.ts` — all compute their
  expectations from the real filesystem/real arrays at test time (`readdirSync`, `checkLaunchContent`
  against the real loaded `projects`/`workExperience`, `expectedCount += items.length` from a real
  directory read) or from caller-supplied fixture arrays, never a hardcoded item count or a hardcoded
  reference to either deleted project slug. **No change needed for any of these four files to keep
  passing.**

**Recommended, non-blocking cleanup (stale comments only — none of these affect pass/fail):**

- `src/pages/live/registry.test.ts`'s header comment (currently: "safe today because SP06 populated
  the real HOSTED_LIVE_PAGES registry with a matching, non-conflicting `sample-project` entry, so that
  loop iterates without throwing") should be updated to state that `HOSTED_LIVE_PAGES` is empty after
  this round's deletion, so the loop never iterates and can't throw — for the same reason, trivially,
  rather than by non-conflicting construction.
- `src/pages/ProjectDetailPage.test.tsx`'s `hostedRealProjects` line and its explanatory comment can be
  simplified to `projects: [FIXTURE_PROJECT]` directly, since there is no longer any real hosted
  project whose presence the mock needs to preserve.
- `scripts/check-no-forms.test.ts`'s last test's comment ("registry.ts, sample-project.tsx, and their
  tests") names a file that will no longer exist; harmless (the test only checks exit code and output
  text, not directory contents), but worth a wording pass.
- `src/pages/ProjectLivePage.test.tsx`'s use of the literal string `'sample-project'` as an arbitrary
  hosted-mode fixture slug is optional to rename (e.g. to `'hosted-fixture'`) — purely for readability,
  since a reader could otherwise wrongly infer this test depends on the real (now-deleted) demo
  project. Not required; the test is self-contained either way.

**Real gap — a test that must be added, not just a comment fix:**

- **The "See all experience" affordance (§4.1) has never been exercised against real content.**
  `Timeline.test.tsx` and `WorkExperienceSection.test.ts` both only ever use synthetic fixture arrays
  to hit the `showSeeAll`/`hasMore` boundary; nothing today renders the real `workExperience` array
  (3 entries, `LANDING_TIMELINE_LIMIT = 2`) and asserts the stub actually appears. **Resolved (§9):
  R2 owns this test**, added to `src/sections/WorkExperienceSection.test.ts` — asserting exactly 2
  timeline entries render on the landing page (Software Engineer II and Software Engineer, not Jio)
  and a "See all experience" link to `/work-experience` is present, plus a real rendered check that
  the stub looks right. Not added by this PRD.
- **`src/pages/WorkExperiencePage.tsx` has no dedicated test file at all today** (`grep` for
  `WorkExperiencePage` under `*.test.*` returns only its own two consumers,
  `WorkExperienceSection.test.ts` — which tests a different component — never a `WorkExperiencePage`
  test). With 3 real entries now the only place Jio is visible, worth adding a small
  `src/pages/WorkExperiencePage.test.tsx` asserting all 3 entries render, in descending-date order,
  with no "See all" stub (`Timeline` is called there without `showSeeAll`).

**Gate-level verification this design keeps green (traced, not run — this task is planning-only):**

| Gate | Before this round | After this round |
|---|---|---|
| `npm run check:launch` | RED (1 project with `demo: true`) | GREEN (0 `demo: true`, 0 `draftDate: true`) |
| `npm run check:no-forms` | GREEN | GREEN (empty `src/pages/live/*.tsx` set still passes — no presence requirement) |
| `npm run typecheck` | GREEN | GREEN, contingent on the full 4-item deletion checklist (§4.3) |
| `npm test` | 40 files / 199 tests (per `review-2026-08-31-1000.md`'s last real run) | 39 files (net: `sample-project.test.tsx` removed, no test file added by this design alone unless §7's recommended new test lands) / fewer tests by `sample-project.test.tsx`'s 3 tests, before accounting for any newly-added test |

---

## 8. Manual Intervention Required From You

1. **Bullet-to-level split (§4.1) — CONFIRMED AS PROPOSED by the owner (2026-09-01).** No further
   action: Software Engineer II (Mar 2024–Present) keeps bullets 1, 2, and 5 (disaster recovery, OAP
   security, the AI/MCP bullet) plus the Fabric Maps blog link; Software Engineer (Jun 2021–Mar 2024)
   keeps bullets 3 and 4 (Tileset Job API, Dev-Ops YAML + PowerBI load-testing), no links. §4.1's full
   markdown ships unchanged.
2. ~~Confirm the Fabric Maps blog link placement~~ — resolved by the same owner confirmation above
   (item 1): the link stays on the Software Engineer II entry.
3. ~~Confirm the `2024-03-01` transition-date assumption~~ — resolved by orchestrator decision
   (2026-09-01): `2024-03-01`, matching the collection's existing normalize-to-the-1st convention. No
   longer owner-blocked.
4. **Nothing in this sub-project remains owner-blocked.** The two project deletions, the sample-project
   deletion, the featured-list (now an owner-pinned explicit six-slug list, §4.2), and the
   redirect-block content are all specified precisely enough for implementation to proceed without
   further input from you.

---

## 9. Open Questions & Decisions

- `[RESOLVED: two new work-experience files, microsoft-fabric-maps-swe-ii.md and
  microsoft-fabric-maps-swe.md, replace the single microsoft-fabric-maps.md]` — see §4.1's full
  markdown.
- `[RESOLVED: the bullet-to-level split proposed in §4.1 is confirmed as proposed, unchanged]` — owner
  decision (2026-09-01): Software Engineer II keeps bullets 1, 2, 5 (disaster recovery, OAP, the
  AI/MCP bullet) plus the Fabric Maps blog link; Software Engineer keeps bullets 3, 4 (Tileset Job
  API, Dev-Ops YAML + PowerBI load-testing), no links. §8 item 1.
- `[RESOLVED: the day-of-month for the March 2024 level transition is 2024-03-01]` — orchestrator
  decision (2026-09-01), matching the collection's existing normalize-to-the-1st convention. Zero
  rendering impact either way (`formatWorkDate` never shows the day). §4.1 already used this date;
  §8 item 3 is no longer owner-blocked.
- `[RESOLVED: the Fabric Maps blog link is kept on the Software Engineer II (current) entry only; QGIS
  Plugin and Creator Onboarding Tool links are dropped entirely per owner instruction]` — §8 item 2
  flags this specific placement as confirmable but not blocking.
- `[RESOLVED: jio-reliance-industries.md is unchanged]` — locked decision 5, confirmed by tracing that
  no code path groups, dedupes, or otherwise treats same-company entries specially (§4.1).
- `[RESOLVED: fabric-maps-mcp-server.md and azure-maps-ai-assistant.md are deleted outright, no
  hidden flag, zero test hardcodes either slug]` — locked decision 3, §4.2.
- `[RESOLVED: FEATURED_PROJECT_SLUGS is pinned to an explicit, ordered six-slug list — juno,
  smarttest, med-doc-tracker, clip-verse, columbia-virtual-campus, crunchy-filler]` — owner decision
  (2026-09-01), §4.2. With six pinned slugs against `MAX_FEATURED = 6`, `computeFeatured`'s
  date-sorted backfill branch never runs — the landing page's featured set is now fully
  deterministic. This supersedes the previously-computed backfill result (`... clip-verse,
  creator-onboarding-tool, qgis-plugin-azure-maps-creator`), which no longer applies anywhere.
  **Cross-note for R2 (inverted from the prior draft of this note):** `columbia-virtual-campus` and
  `crunchy-filler` do **not** drop off the landing page — they are now explicitly pinned and stay on
  it. `creator-onboarding-tool` and `qgis-plugin-azure-maps-creator` are the two that lose their
  Featured-section placement (they remain reachable at `/projects`, §4.2). R2 doesn't need to change
  any code — `FeaturedProjectsSection.tsx` still just renders whatever `featuredProjects` computes to
  — but should render/verify against this final six-slug set, not the earlier backfilled one.
- `[RESOLVED: sample-project deletion uses the complete 4-item checklist — content file, live page,
  live page's test, and the registry entry]` — not the 3-item checklist that caused two real build
  breaks in the round-1 rehearsal. §4.3.
- `[RESOLVED: the Prettier-{}-collapse fix in generate-sitemap.mjs's hostedLiveSlugs() is already
  present on this branch]` — verified by reading the current file and its test suite directly; not
  new work, just confirmed still in place. §4.3.
- `[RESOLVED: the firebase.json hosting.redirects block is unaffected by this round's deletions — still
  exactly the same 6 entries (clip-verse, creator-onboarding-tool, crunchy-filler, juno,
  med-doc-tracker, qgis-plugin-azure-maps-creator)]` — none of the three deleted files ever had a
  liveUrl field. §4.4.
- `[RESOLVED: R2 owns the "See all experience" test]` — orchestrator decision (2026-09-01): R2 adds
  it to `src/sections/WorkExperienceSection.test.ts` (not `HomePage.test.tsx`), asserting exactly 2
  timeline entries render on the landing page (Software Engineer II and Software Engineer, not Jio)
  and a "See all experience" link to `/work-experience` is present, plus a real rendered check that
  the stub looks right now that it's reachable for the first time. R3 does not add this test — see §7
  for the underlying gap this closes.
- `[DEFERRED: Crontick, Hospital-Bill-Checker, NGO Auto-Mailer]` — all three appear on the resume under
  "Leadership and Projects" with no matching `src/content/projects/*.md` file. The owner did not ask
  for them to be added this round; `RESUME-EXTRACT.md`'s own header flags this explicitly ("OPEN
  (flag, do not act)"). Not touched by this PRD.
- `[DEFERRED: RESUME_URL update in src/config/links.ts]` — locked decision 6 is real but the file is
  R1-owned; noted here only so the dependency is visible, not implemented in this PRD.
  `RESUME-EXTRACT.md`'s Drive file id confirms the new URL R1 should use:
  `https://drive.google.com/file/d/1pTIyviXM0fCCkXeX6LveYXvr7QD2TD0j/view?usp=sharing`.
  `1pTIyviXM0fCCkXeX6LveYXvr7QD2TD0j` is also, incidentally, this document's own source-of-truth
  resume file.
- `[DEFERRED: the four SP07 low-confidence project dates — Juno, Med-Doc Tracker, Crunchy Filler,
  Clip-Verse]` — pre-existing round-1 open item, unrelated to this round's changes. **Now lower-stakes
  than before**: with `FEATURED_PROJECT_SLUGS` pinned to an explicit six-slug list (§4.2, owner
  decision 2026-09-01) rather than date-sorted backfill, none of these four dates affects *whether*
  a project is featured or in what order — `computeFeatured` pushes the pinned list verbatim,
  unsorted. The four dates still affect each project's ordering on `/projects` (which sorts by
  `date`) and its position among any *other* project's card, but no longer risk silently reshuffling
  the featured landing-page set the way an unresolved date confidence issue could have under the old
  backfill design.
