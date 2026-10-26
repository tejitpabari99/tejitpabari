# tejitpabari.com Round 2 — Planning Folder

This folder plans round 2 of the `tejitpabari.com` revision: a set of owner-reported fixes and
content corrections layered on top of the already-shipped round-1 rewrite (`.dev/website-revamp/`).
Round 2 does not touch the app's architecture — it corrects navigation/chrome behavior the owner
found confusing (no way back to `/`, an unpinned footer), fixes real content (a wrong, collapsed
work-experience entry; two side-projects that should fold into a work-experience bullet instead of
standing alone; a scaffolding demo that was never meant to survive launch), polishes several
components (status pills, markdown rendering, link behavior), fixes `/privacy`/`/terms`'s layout and
a real consent-clearing bug, and finishes with a repo-wide "this reads like it was written by AI"
voice pass plus the actual ship steps. `SHARED-CONTEXT.md` (repo facts, design tokens, this round's
locked decisions) and `REVISION-BRIEF.md` (the owner's feedback, verbatim) are the source of truth
every sub-project PRD below cites directly; none of the six re-litigates what those two files settle.
As of 2026-09-01, every cross-project open question raised while these six PRDs were drafted has been
resolved (see "Locked decisions for this round" below) — the round is design-complete and ready for
task generation.

## Source-of-truth documents

Copied verbatim into this folder from the orchestrator's scratchpad so the planning folder is
self-contained (no dependency on files outside the repo):

- `SHARED-CONTEXT.md` — repo facts, design tokens, and this round's locked owner decisions (1-8);
  every sub-project PRD cites this directly.
- `RESUME-EXTRACT.md` — the authoritative transcription of the owner's real resume PDF; the source
  R3's work-experience content is built from and must be checkable against.
- `REVISION-BRIEF.md` — the owner's feedback list, verbatim, that this round's six PRDs decompose.

## Sub-projects

| Folder | Title | Scope | Depends on | Phase | Status |
|---|---|---|---|---|---|
| `01-shell-nav-chrome` | Shell, Nav & Chrome | Sticky footer on short pages; `Home` added to `Nav.tsx`; navbar hides (back-only chrome) on `/projects`, `/projects/:slug`, `/projects/:slug/live`; new shared `PageContainer` (width/padding/chrome-aware top gutter) across all six sub-page routes; `BackButton`'s new `to` prop; `RESUME_URL` updated. | None | 1 | PRD complete, decisions locked 2026-09-01 — implementation not started |
| `02-landing-sections` | Landing Sections (layout + copy) | `About`/`Work Experience` widened to the same `max-w-content` bound as `Projects`/`Contact`, reading width kept inside via an inner block; both landing headlines render on one line from 640px up; Hero paragraph reordered to lead with the Microsoft role; About/Contact copy rewritten (drops AI-essay tics, removes the hiring statement per locked decision 8). | R1 (width/padding convention — matched, not code-coupled), R3 (renders `featuredProjects`/`workExperience` as data) | 2 | PRD complete, decisions locked 2026-09-01 — implementation not started |
| `03-content-data` | Content Data | Work experience rebuilt from the real resume into 3 dated entries (Microsoft split into SWE II / SWE, Jio unchanged); `fabric-maps-mcp-server.md` and `azure-maps-ai-assistant.md` deleted (folded into a Microsoft work-experience bullet); the `sample-project` demo fully deleted (4-item checklist: content, hosted page, its test, registry entry); `FEATURED_PROJECT_SLUGS` pinned to an explicit, owner-picked 6-slug list. | None | 1 | PRD complete, decisions locked 2026-09-01 — implementation not started |
| `04-component-polish` | Component & Detail-Page Polish | Project/research status renders as a colored box (`StatusBadge`), not an undifferentiated pill; markdown body spacing/type-scale fixed; GFM task-list checkbox rendering fixed; "Open Live" and internal markdown links open in a new tab; `LiveRedirectFallback` threads a real Back target; Connect-panel rebuild handed off to R2. | R1 (`BackButton`'s new `to` prop) | 2 | PRD complete, decisions locked 2026-09-01 — implementation not started |
| `05-legal-pages` | Legal Pages | `/privacy`/`/terms` clear the navbar correctly; "Clear my choice" gated on there being something to clear, with a real confirmation step; the button now actually disables GA and deletes its cookies (a real bug fix, not just copy — required claiming `src/lib/analytics.ts`); both pages rewritten in a plainer register; the "no sale or sharing of data" claim narrowed to what's actually true. | R1 (`PageContainer`) | 3 | PRD complete, decisions locked 2026-09-01 — implementation not started |
| `06-voice-sweep-and-ship` | Voice Sweep & Ship | Repo-wide em-dash inventory and rewrite over whatever R1–R5 leave behind (content bodies, `index.html`, `site.ts`, `NotFoundPage`), plus a permanent AST-based `check:no-em-dash` guard wired into `check:launch`; `firebase.json` build-dirty problem resolved (tracked `firebase.template.json`, generated `firebase.json` gitignored); full quality-gate run + `dist/`-level audit of this round's claims; designed (not executed) preview-channel deploy and PR-to-`main` steps. | R1, R2, R3, R4, R5 (all must land first) | 4 | PRD complete, decisions locked 2026-09-01 — implementation not started |

## Dependency graph / phase ordering

Matches this round's parallelism cap (max 2 concurrent sub-projects):

- **Phase 1:** R1 (`01-shell-nav-chrome`) and R3 (`03-content-data`) in parallel — both depend on
  nothing this round, and touch disjoint files (`src/layout/*`/`src/config/links.ts`/
  `src/components/BackButton.tsx` vs. `src/content/**`/`src/config/featured.ts`/`src/pages/live/**`).
- **Phase 2:** R2 (`02-landing-sections`) and R4 (`04-component-polish`) in parallel — R4 has a real
  code dependency on R1's `BackButton` `to` prop; R2's relationship to R1 is a matched convention
  (`max-w-content` + the same padding ramp), not a code coupling, and R2's relationship to R3 is a
  rendering-input change (`featuredProjects`, `workExperience`), not a shared file. R2 and R4 touch
  disjoint files (`src/sections/*` vs. `src/components/*`/`src/data/*`).
- **Phase 3:** R5 (`05-legal-pages`) — depends on R1's `PageContainer`.
- **Phase 4 (last):** R6 (`06-voice-sweep-and-ship`) — depends on all five; sweeps whatever they leave
  behind, resolves the `firebase.json` build-dirty problem, runs the full gate, and designs (but does
  not execute) the ship steps.

## Locked decisions for this round

**Reproduced from `SHARED-CONTEXT.md` (owner-approved 2026-09-01):**

1. Navbar gets a `Home` entry — `Nav.tsx`'s `sectionIdOf` and the build-time nav-href validator are
   both updated deliberately for a plain `/` href, not patched around (R1).
2. Back-only chrome (navbar hidden) on exactly `/projects`, `/projects/:slug`, `/projects/:slug/live`;
   every other route keeps the navbar, now including Home (R1).
3. `fabric-maps-mcp-server.md` and `azure-maps-ai-assistant.md` are deleted outright, substance folded
   into a Microsoft work-experience bullet, no `hidden` flag (R3).
4. The `sample-project` demo is deleted this round, using the complete 4-item checklist the round-1
   rehearsal proved correct (R3).
5. Work-experience content is rebuilt from the real resume; Jio stays as a third entry, so the landing
   timeline's 2-entry limit now naturally shows only the two Microsoft roles (R3, R2).
6. `RESUME_URL` in `src/config/links.ts` updated to the real resume's Drive link (R1).
7. Copy voice: no em dashes anywhere in user-visible copy; rewrite so it reads like a person wrote it,
   preserving every factual claim (R2, R3 bodies, R5, R6's repo-wide sweep).
8. No statement, either direction, about whether the owner is looking to be hired — Contact copy is
   about health tech and reaching out, nothing about hiring (R2).

**Owner decisions made directly on this round's drafted PRDs (2026-09-01):**

9. **Microsoft bullet-to-level split — confirmed as proposed.** Software Engineer II (Mar 2024–
   Present) keeps disaster recovery, OAP, and the AI/MCP bullet plus the Fabric Maps blog link;
   Software Engineer (Jun 2021–Mar 2024) keeps the Tileset Job API and the DevOps YAML + PowerBI
   load-testing bullet, no links (R3 §4.1/§8).
10. **Hero eyebrow label — kept exactly as it is today, "Health Tech Builder".** The proposed swap to
    "Software Engineer" (reasoned from the paragraph's new Microsoft-first lead) was rejected (R2
    §4.4).
11. **Featured projects — pinned to an explicit, ordered list**, not date-sorted backfill:
    `FEATURED_PROJECT_SLUGS = ['juno', 'smarttest', 'med-doc-tracker', 'clip-verse',
    'columbia-virtual-campus', 'crunchy-filler']`. Six slugs against `MAX_FEATURED = 6` means
    `computeFeatured`'s backfill branch never runs — the landing page's featured set is now fully
    deterministic and stops reshuffling when a project is added, removed, or re-dated.
    `creator-onboarding-tool` and `qgis-plugin-azure-maps-creator` lose their Featured-section
    placement but stay reachable at `/projects` (R3 §4.2).

**Orchestrator decisions (cross-project routing, not owner calls):**

12. The `LiveRedirectFallback`/`ProjectLivePage` Back-target pair is split by file ownership: R4 owns
    `LiveRedirectFallback.tsx` and adds the optional `backTo` prop (threaded into `BackButton`); R1
    owns `ProjectLivePage.tsx` and supplies `backTo={`/projects/${project.slug}`}` at the redirect-mode
    call site (R1 §4.9/§9, R4 §9 items 10–11).
13. R1's `PageContainer` convention (`max-w-content` + `px-6 sm:px-8 md:px-10 lg:px-12`) and R2's
    inline landing-section width system are confirmed to already match — R1's component is canonical
    for sub-page routes, R2's sections use the same scale inline because they're full-bleed colored
    bands that can't adopt `PageContainer` directly (R1 §9, R2 header/§9).
14. `WorkExperiencePage.tsx`'s inner `max-w-[45rem]` reading-width wrapper (R1) is not an
    inconsistency with R2's new width system — same "wide outer bound, readable-measure inner block"
    pattern, applied by R1 to a sub-page instead of a landing section (R2 §9).
15. The 640px one-line-headline floor implements exactly as designed; the estimated glyph width is
    verified in a real browser during R6's own verification gate (added as an explicit named check in
    R6 §7), not redesigned. If it clips, the fix is a small `clamp()` adjustment made in R6's sweep
    (R2 §8/§9, R6 §7).
16. The March-2024 Microsoft level-transition date is `2024-03-01`, matching the work-experience
    collection's existing normalize-to-the-1st convention (R3 §4.1/§9).
17. The "See all experience" real-content test belongs to R2, added to
    `src/sections/WorkExperienceSection.test.ts`, alongside a real rendered check that the newly-
    reachable stub looks right (R2 §7, R3 §9).
18. `src/lib/analytics.ts` and `src/lib/analytics.test.ts` — previously unowned by any R1–R5
    sub-project — are owned by R5 for this round (R5 header/§3/§4.2/§9 item 4).
19. R6 sets both legal pages' `LAST_UPDATED` to the real ship date as an explicit numbered step
    (§4.7 "Step 2") immediately before opening the PR to `main` (R5 §8/§9 item 5, R6 §4.7).
20. The legal copy and the narrowed "no sale or sharing of data" claim ship as drafted; the owner
    reads and approves both pages before the merge-to-`main` cutover (R5 §8 item 1, R6 §8 item 6 —
    see "Still requires the owner" below).
21. Internal `Nav`/`Footer` links stay same-tab — they're primary site chrome, not the content/CTA
    links the owner's "all links open in a new tab" feedback was about. `Footer`'s one external link
    (résumé/attribution) is already `target="_blank"` and unaffected (R4 §9 item 14, R6 §9 item 6 —
    both PRDs now agree in writing).

## Still requires the owner

Every genuinely owner-only item across all six PRDs' own `§8`, deduplicated:

| Item | From |
|---|---|
| **Read and approve every rewritten copy block** — Hero/About/Contact paragraphs (R2 §4.2/§4.3/§4.4), and `index.html`/`site.ts`/`NotFoundPage.tsx`/the four rewritten content files (`juno.md`, `smarttest.md`, `med-doc-tracker.md`, `flood-event-extraction-bangladesh.md`) (R6 §4.4). This copy is about the owner personally; none of it should ship on an agent's say-so alone. | R2 §8 item 1, R6 §8 item 1 |
| **Read every word of both `/privacy` and `/terms` before they ship**, including the narrowed "no sale or sharing of data" claim (a substantive correction, not just a voice change) and the "This isn't professional or medical advice" framing. Ships as drafted; this read-through is the gate before the merge-to-`main` cutover, not before implementation. | R5 §8 item 1, R6 §8 item 6 |
| **Eyeball the three `StatusBadge` colors on real project photos** — the contrast math is a worst-case mathematical bound, not a substitute for looking at the badge on the actual Unsplash placeholder images in use. | R4 §8 |
| **Confirm the new-tab link scope decision** ("Open Live" + internal markdown links new-tab, `ProjectCard`'s own grid-navigation link stays same-tab) matches intent — the owner's original wording was broader than this carve-out. | R4 §8 |
| **Confirm the `firebase.json` → `firebase.template.json` resolution** before it's implemented — changes what `git status`/`git diff` show after every future build, and changes a hand-run `firebase deploy` without a fresh build from "silently stale" to "fails loudly, missing file." | R6 §8 item 2 |
| **Open the preview-channel deploy and the PR to `main` yourself, or authorize an agent to run the exact commands R6 designs** (§4.7) — designed, not executed, by this round's planning. | R6 §8 item 3 |
| **Do not merge the PR to `main` without reading R6's ship-consequence framing again first.** Once SP08's merge workflow runs, a push to `main` is the production cutover with no separate deploy step — explicitly the owner's call, not any PRD's or agent's. | R6 §8 item 4 |
| **Confirm the real ship date** that R6's own §4.7 "Step 2" uses for both legal pages' `LAST_UPDATED` — the step itself just stamps the date it's run on, but that date is only correct if it's actually run at real ship time, not speculatively. | R5 §8 item 2, R6 §8 item 5 |

Two items originally on this list from earlier drafts of these PRDs — the Hero eyebrow label
confirm/reject, and the Microsoft bullet-to-level split confirm/correct — are **no longer owner
actions**: the owner has already decided both directly (see locked decisions 9–10 above).
