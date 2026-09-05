# Tasks: Content Data

Source of truth: `/root/projects/tejitpabari/.dev/website-revamp-r2/03-content-data/PRD.md`. Every task below cites the PRD §4 subsection it implements. This sub-project owns `src/content/**`, `src/config/featured.ts`, `src/pages/live/**` (including the `sample-project` deletion and its registry), and the `scripts/`/`src/pages/*.test.tsx` tests that reference the slugs deleted this round — **not** `src/layout/*` (R1), `src/sections/*` (R2), `src/components/*`/`src/data/{ContentBody,markdownComponents}.tsx` (R4), or the legal pages (R5). `src/config/links.ts` is R1's file and is not touched here.

**Toolchain / baseline, confirmed by running the real commands on this branch before writing any task below (not assumed):** `npm test` currently passes **40 test files / 199 tests**; `npm run build` currently produces **29** prerendered `dist/**/index.html` pages, **17** OG-card PNGs under `public/og/`, and **23** `<loc>` entries in `public/sitemap.xml` — all three numbers match the PRD's own stated "before" counts exactly, so the PRD's count table (§4.3) is verified accurate, not just asserted. `npm run check:launch` is currently **RED** (`sample-project.md` still has `demo: true`) — by design, per the PRD.

**Ordering constraint (why the tasks below are sequenced this way), reasoned against the real code in `src/config/featured.ts`, `src/pages/live/registry.ts`, and `src/data/workExperience.ts`:**

- `src/config/featured.ts` runs `computeFeatured(projects, FEATURED_PROJECT_SLUGS)` **at module-load time** (`export const featuredProjects = computeFeatured(...)`), and throws if any listed slug has no matching `src/content/projects/<slug>.md` file. Neither project this round deletes (`fabric-maps-mcp-server`, `azure-maps-ai-assistant`) is in the *old* 3-slug list (`juno`, `smarttest`, `med-doc-tracker`) or the *new* 6-slug pinned list — so deleting those two project files and pinning the new `FEATURED_PROJECT_SLUGS` list are **order-independent** with respect to each other and with respect to everything else in this file.
- `src/pages/live/registry.ts` runs `validateLiveRegistry(HOSTED_SLUGS, projects)` **at module-load time**, where `HOSTED_SLUGS = Object.keys(HOSTED_LIVE_PAGES)`. Today `HOSTED_LIVE_PAGES = { 'sample-project': SampleProjectLive }`, so `HOSTED_SLUGS = ['sample-project']`, and the validator requires a `src/content/projects/sample-project.md` file to exist. **This is the one real trap:** deleting `src/content/projects/sample-project.md` *before* emptying `HOSTED_LIVE_PAGES` would make that loop fail to find a matching project and throw at the next import (`npm run typecheck`/`npm test`/`npm run build` would all break). The safe fix is to treat the sample-project deletion as **one atomic change** — content file, live page, its test, and the registry entry all removed together, in the same task/commit — which is also exactly the four-item checklist `review-2026-08-31-1000.md`'s rehearsal proved correct (see Task 4 below). Doing it any other way (e.g. deleting the content file in an earlier task, or emptying the registry in a later one) reopens a window where the tree is red.
- `src/data/workExperience.ts` has **no cross-file validation at all** (no duplicate-slug guard — `id` is derived from the filename, and a flat directory can't hold two files with the same name) — the work-experience rebuild (Task 1) has no ordering dependency on anything else in this file and can run first, last, or anywhere in between with no risk.
- Net ordering used below: **Task 1 (work-experience) → Task 2 (delete the two hackathon projects) → Task 3 (pin `FEATURED_PROJECT_SLUGS`) → Task 4 (the atomic sample-project deletion) → Task 5 (verification only, no files changed).** Tasks 1–3 are mutually order-independent per the reasoning above; they're listed in the PRD's own §4.1/§4.2 order for readability. Task 4 must not be split across commits. Task 5 must run last.

**`npm run check:launch` flips from RED to GREEN at Task 4, specifically.** It is RED through Tasks 1–3 (unchanged: `sample-project.md` still has `demo: true` the whole time) and GREEN starting at Task 4, the moment `src/content/projects/sample-project.md` is deleted (zero `demo: true` projects) — `draftDate: true` was already zero before this round and stays zero throughout (neither new work-experience file sets `DRAFT_DATE`).

**Source note:** `RESUME-EXTRACT.md`/`SHARED-CONTEXT.md`/`REVISION-BRIEF.md`, which the PRD cites as its source-of-truth files, do not exist anywhere in this repo (checked via `find`) — the PRD's own §4.1 gives the complete, final markdown for both new work-experience files, reproduced verbatim below without independent access to the underlying resume transcription.

---

### Task 1 — Work-experience rebuild: split Microsoft into two dated roles
   - Files:
     - `src/content/work-experience/microsoft-fabric-maps.md` (delete)
     - `src/content/work-experience/microsoft-fabric-maps-swe-ii.md` (new)
     - `src/content/work-experience/microsoft-fabric-maps-swe.md` (new)
   - Changes: Per PRD §4.1. Delete the single combined file and replace it with two files, one per resume-stated level. `jio-reliance-industries.md` is not touched. Both new bodies are checked against the PRD's own line-by-line resume trace and contain zero em dashes.

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

   - Acceptance criteria:
     1. `ls src/content/work-experience/` lists exactly three files: `jio-reliance-industries.md`, `microsoft-fabric-maps-swe-ii.md`, `microsoft-fabric-maps-swe.md`. `microsoft-fabric-maps.md` is gone.
     2. `git diff -- src/content/work-experience/jio-reliance-industries.md` shows no changes — this file is untouched (locked decision 5).
     3. `npm run typecheck` passes and `npm run build` succeeds — both new files parse cleanly through the real, unmodified `parseWorkExperience` (`company`/`role`/`startDate`/`links` present and correctly typed; `endDate` is `'Present'` on the SWE II file and a valid `YYYY-MM-DD` string on the SWE file; neither sets `DRAFT_DATE`; neither body is empty).
     4. `grep -P '\x{2014}' src/content/work-experience/microsoft-fabric-maps-swe-ii.md src/content/work-experience/microsoft-fabric-maps-swe.md` finds no matches (zero em dashes in either body) — exit code 1, no output.
     5. The real, loaded `workExperience` array (sorted descending by `startDate` at `src/data/workExperience.ts`'s own `.sort((a, b) => b.startDate.localeCompare(a.startDate))`, unmodified by this task) now orders as `[Software Engineer II (2024-03-01), Software Engineer (2021-06-01), Jio (2019-06-01)]` — spot-check by temporarily logging `workExperience.map(w => w.role)` in a scratch script run via `vitest run`, or trust the string-comparison argument in PRD §4.1 (all three ISO dates compare identically under string and calendar ordering, no edge case) and confirm only that the build didn't throw.
     6. `npm run check:launch` is still RED at this point (unchanged — `sample-project.md` still has `demo: true`; this task doesn't touch it).

---

### Task 2 — Delete the two Microsoft hackathon side-project files
   - Files:
     - `src/content/projects/fabric-maps-mcp-server.md` (delete)
     - `src/content/projects/azure-maps-ai-assistant.md` (delete)
   - Changes: Per PRD §4.2. Delete both outright, no `hidden` frontmatter flag — their substance now lives in Task 1's Software Engineer II bullet. No other file needs to change: `getStaticPaths` (`src/content/projects/index.ts`), `scripts/generate-sitemap.mjs`, and `scripts/generate-og-cards.mjs` all derive their slug lists from a live directory read of `src/content/projects/`, and confirmed by grep (see below) that no test hardcodes either slug or title.

   - Acceptance criteria:
     1. `ls src/content/projects/` no longer lists `fabric-maps-mcp-server.md` or `azure-maps-ai-assistant.md` — 9 files remain (`sample-project.md` is still present; it's Task 4's job).
     2. `grep -rln "fabric-maps-mcp-server\|azure-maps-ai-assistant\|Fabric Maps MCP Server\|Azure Maps AI Assistant" --include='*.ts' --include='*.tsx' --include='*.mjs' --include='*.sh' --include='*.json' src scripts` returns nothing, both before and after this deletion (confirmed: zero hits in either state — no test or script hardcodes either slug or title).
     3. `npm run typecheck` passes; `npm run build` succeeds. `find dist -name index.html | wc -l` is **27** (29 baseline − 2 detail pages; neither deleted project had a `liveUrl` or a `HOSTED_LIVE_PAGES` entry, so no `/live` page disappears here). `find public/og -name '*.png' | wc -l` is **15** (17 − 2 OG cards). `grep -c '<loc>' public/sitemap.xml` is **21** (23 − 2 sitemap entries).
     4. `npm run check:launch` is still RED at this point (unchanged).

---

### Task 3 — Pin `FEATURED_PROJECT_SLUGS` to the explicit six-slug list
   - Files: `src/config/featured.ts` (modify)
   - Changes: Per PRD §4.2's "owner decision (2026-09-01)" — replace the array and its now-stale surrounding comment (which described a bootstrap situation from before real content existed and would otherwise read "the three slugs below" against a six-slug list). `computeFeatured` itself is unchanged.

Replace:
```ts
// Ordered, up to 6 slugs — the single source of truth for the landing
// page's featured Projects section. Author edits this array directly;
// nothing else controls what's featured or in what order.
//
// Ordering-dependency note: SP02 authors this pipeline before SP07 authors
// the real content, so src/content/projects/ is currently empty. The three
// slugs below are unknown against zero real projects, which means any
// import of this module (and therefore of featuredProjects below) throws
// until SP07's matching project files land. This is expected and
// intentional — see 02-content-pipeline TASKS.md Task 9 / PRD §4.6 — and is
// harmless today because nothing yet imports this module (SP03, which
// consumes featuredProjects on the landing page, hasn't wired it up yet).
export const FEATURED_PROJECT_SLUGS: string[] = [
  'juno',
  'smarttest',
  'med-doc-tracker',
];
```

With:
```ts
// Ordered, exactly 6 slugs — the single source of truth for the landing
// page's featured Projects section. Author edits this array directly;
// nothing else controls what's featured or in what order.
//
// Pinned explicitly by owner decision (2026-09-01, round 2 R3 PRD §4.2),
// not date-sorted backfill. With exactly 6 slugs against MAX_FEATURED = 6,
// computeFeatured's date-descending backfill branch below can never run
// (remainingSlots = 6 - 6 = 0) — this list is the complete, final featured
// set. The landing page's featured section no longer reshuffles when a
// project is added, removed, or re-dated.
export const FEATURED_PROJECT_SLUGS: string[] = [
  'juno',
  'smarttest',
  'med-doc-tracker',
  'clip-verse',
  'columbia-virtual-campus',
  'crunchy-filler',
];
```

   - Acceptance criteria:
     1. `grep -A9 "FEATURED_PROJECT_SLUGS: string\[\]" src/config/featured.ts` shows exactly the six slugs above, in that order.
     2. `npm run build` succeeds. All six slugs match a real `src/content/projects/<slug>.md` file (confirmed present on this branch: `juno.md`, `smarttest.md`, `med-doc-tracker.md`, `clip-verse.md`, `columbia-virtual-campus.md`, `crunchy-filler.md` — none of them is one of Task 2's or Task 4's deletions), so `computeFeatured`'s unknown-slug guard never fires; the six strings are distinct, so the duplicate guard never fires; `6 > MAX_FEATURED (6)` is false, so the length guard never fires.
     3. `npm test` — `src/config/featured.test.ts`'s existing 7 cases still pass unmodified (they call `computeFeatured` directly against an in-memory fixture array and never import the real `FEATURED_PROJECT_SLUGS`/`featuredProjects`, so this edit doesn't touch them).
     4. `npm run check:launch` is still RED at this point (unchanged — this task never touches `sample-project.md`).

---

### Task 4 — Delete the `sample-project` demo (the complete 4-item checklist, one commit)
   - Files:
     - `src/content/projects/sample-project.md` (delete)
     - `src/pages/live/sample-project.tsx` (delete)
     - `src/pages/live/sample-project.test.tsx` (delete)
     - `src/pages/live/registry.ts` (modify)
   - Changes: Per PRD §4.3 — the four-item checklist the round-1 rehearsal (`review-2026-08-31-1000.md`, Adversarial Correctness finding 1) proved correct, **not** the three-item version that broke `npm run typecheck` by leaving `sample-project.test.tsx`'s dangling `import SampleProjectLive from './sample-project';` behind. All four changes land in this single task/commit — see this file's header "Ordering constraint" section for why splitting them across commits reopens a build break.

   In `src/pages/live/registry.ts`, remove the import line and the `HOSTED_LIVE_PAGES` entry:

```ts
// Remove this line entirely:
import SampleProjectLive from './sample-project';

// Change this:
export const HOSTED_LIVE_PAGES: Record<string, ComponentType> = {
  'sample-project': SampleProjectLive,
};

// To this:
export const HOSTED_LIVE_PAGES: Record<string, ComponentType> = {};
```

   Nothing else in `registry.ts` changes — `validateLiveRegistry`, `computeProjectLiveSlugs`, `hasLiveRoute`, the `HOSTED_SLUGS`/`projectLiveSlugs` module-scope constants, and the top-of-file convention comment are all untouched.

   - Acceptance criteria:
     1. `ls src/pages/live/` lists exactly two files: `registry.ts`, `registry.test.ts`.
     2. `npm run typecheck` passes — no dangling import (this is the exact check that broke in the round-1 rehearsal when the test-file deletion was skipped).
     3. `npm run build` succeeds. `find dist -name index.html | wc -l` is **25** (27 from Task 2 − 2: the sample-project detail page and its `/live` page). `find public/og -name '*.png' | wc -l` is **14** (15 − 1: only the detail page had an OG card; `/live` pages don't get one). `grep -c '<loc>' public/sitemap.xml` is **19** (21 − 2: the detail-page sitemap entry and the hosted-`/live` sitemap entry).
     4. `npm run check:no-forms` exits 0, printing `check:no-forms passed — no input-accepting markup under src/pages/live/.` (the directory contains zero `.tsx` files after this deletion — `check-no-forms.sh`'s grep is a pure content-absence check, not a presence check, so an empty directory is exactly as clean a pass as before).
     5. **`npm run check:launch` exits 0 — the flip point.** Before this task it was RED (`sample-project.md` had `demo: true`); after this task, `projects` contains zero `demo: true` entries and `workExperience` contains zero `draftDate: true` entries, so both `checkLaunchContent` assertions in `scripts/check-launch-content.test.ts` pass, and the chained `check:no-forms` passes independently per criterion 4.
     6. `npm test` reports **39 test files / 196 tests** (40/199 baseline minus `sample-project.test.tsx`'s one file / three tests; no other test file is added or removed by this task).
     7. `grep -rl "sample-project" --include='*.md' src/content` and `grep -rl "sample-project" src/pages/live/registry.ts` both return nothing.

---

### Task 5 — Full verification (no files modified)
   - Files: none — this is a verification-only task confirming Tasks 1–4 together produce the state PRD §4/§6/§7 describes, run once after Task 4 lands.
   - Changes: none. Run the commands below against the real repo and confirm every result.

```bash
npm run typecheck            # expect: exit 0
npm test                     # expect: 39 test files, 196 tests, all passed
npm run check:launch         # expect: exit 0 (RED → GREEN happened at Task 4)
npm run build                # expect: exit 0
find dist -name index.html | wc -l      # expect: 25
find public/og -name '*.png' | wc -l    # expect: 14
grep -c '<loc>' public/sitemap.xml      # expect: 19
git checkout -- firebase.json           # revert liveRedirectsPlugin's build-time rewrite; R6 owns whether this stays tracked or gitignored, not this task
```

   Also confirm the redirect content PRD §4.4 states is unaffected by this round's deletions — none of the three files this round deletes ever had a `liveUrl` field, so the block should be byte-for-byte the same 6 entries as before this round (`clip-verse`, `creator-onboarding-tool`, `crunchy-filler`, `juno`, `med-doc-tracker`, `qgis-plugin-azure-maps-creator`):

```bash
npm run build
grep -A2 '"source": "/projects/' firebase.json    # expect exactly 6 blocks, matching PRD §4.4
git checkout -- firebase.json
```

   Finally, confirm the remaining `sample-project` string occurrences repo-wide are **all** legitimate fixture data or historical comments, none of them real references needing an edit — this is the "did the grep find anything the PRD missed" check:

```bash
grep -rln "sample-project" --include='*.ts' --include='*.tsx' --include='*.mjs' --include='*.sh' --include='*.json' --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.dev .
```
   Expected surviving hits, each verified by direct inspection during task derivation to be an arbitrary in-memory fixture slug or a comment naming the `06-sharing-seo-sample-project` folder (not a reference to the now-deleted real content), so none require an edit for this sub-project's tasks to be complete: `vite.config.test.ts` (temp-directory fixture files), `src/pages/ProjectDetailPage.test.tsx` (`hostedRealProjects` mock-narrowing line — filters to `[]` after this round, mock still valid), `src/pages/ProjectLivePage.test.tsx` (fully self-mocked `HOSTED_LIVE_PAGES` fixture), `src/pages/live/registry.test.ts` (fixture `proj('sample-project')` calls, plus one now-stale header-comment sentence describing the old non-empty registry — cosmetic only, doesn't affect pass/fail), `scripts/generate-sitemap.test.ts` (fixture slug in `buildSitemapUrls` test cases, plus historical merge-note comments), `scripts/generate-sitemap.mjs` (one comment citing `sample-project.test.tsx` as an example filename), `scripts/check-launch-content.test.ts` (fixture `demoProject` slug), `scripts/check-no-forms.test.ts` (one comment naming files that no longer exist, wording-only), `src/config/site.test.ts` and `src/components/RouteMeta.test.tsx` (both only reference the SP06 folder name `06-sharing-seo-sample-project` in a header comment, zero occurrences in the test bodies themselves).

   - Acceptance criteria: every command above produces exactly the stated result; the final grep's hit list matches the expected-surviving-hits list exactly (no new file, and no fewer files, than enumerated above). If any command's output differs from what's stated, Tasks 1–4 are not actually complete — do not mark this task done until every one matches.

---

## Summary of what requires you (not a dev agent)

Nothing in this sub-project's own scope is owner-blocked. Per PRD §8: the bullet-to-level split (Task 1) was confirmed as proposed by the owner on 2026-09-01, the March 2024 transition date and the Fabric Maps blog link placement were both resolved without further owner input, and the featured-projects pin (Task 3) is a direct owner decision already made, not a proposal awaiting approval. The two project deletions and the sample-project deletion are specified precisely enough to implement without further input.

The only genuinely owner-only items touching this sub-project's output, both deferred to other rounds, not blocking any task above:
1. **`RESUME_URL` in `src/config/links.ts`** (locked decision 6) is real but is R1's file — not implemented here, and R1's own PRD/tasks are where the owner's approval (if any is needed) applies.
2. **Reading and approving rewritten copy blocks** that touch this round's content more broadly (Hero/About/Contact paragraphs, and the four rewritten project content files `juno.md`/`smarttest.md`/`med-doc-tracker.md`/`flood-event-extraction-bangladesh.md`) is R2's and R6's concern (README "Still requires the owner"), not this sub-project's — none of those files are touched by any task above.
