# PRD — Round 2, Sub-project R6: Voice Sweep & Ship

**Repo:** `tejitpabari/tejitpabari`, branch `website-revamp`
**Depends on:** R1, R2, R3, R4, R5 — all five must have landed (implemented and merged into
`website-revamp`) before this sub-project's own work is executed. Phase 4, runs last.
**Consumed by:** nobody downstream — this is the terminal sub-project of round 2, same role SP08
played in round 1.
**Owns:** No file exclusively. This PRD sweeps across every file in the repo that carries
user-visible copy and that R1–R5 do not already own outright, plus the repo-wide finishing
mechanics: a permanent em-dash guard, the `firebase.json` build-dirty resolution, the full
verification gate, and the preview-deploy/PR ship steps.
**Source of truth:**
`/tmp/claude-0/-root/2ed387a6-87d8-4b62-a3b8-639e867ccc94/scratchpad/SHARED-CONTEXT.md` (repo facts,
tokens, this round's locked decisions) and `REVISION-BRIEF.md` (owner feedback verbatim) in the same
scratchpad — every decision cited below as "SHARED-CONTEXT §N" or "brief #N" is settled there and not
re-opened here. `.dev/website-revamp-r2/{01-shell-nav-chrome,02-landing-sections,03-content-data,
04-component-polish,05-legal-pages}/PRD.md` (all five read in full before writing this document) are
binding for what each already fixes; this PRD does not re-design anything they settled — see §9 for
the one place this PRD resolves an open cross-note one of them left for R6, and the one place it
corrects a stale assumption in its own original task brief now that R5 has landed since that brief was
written. `.dev/website-revamp/README.md`, `.dev/website-revamp/08-ci-deploy-pipeline/PRD.md` §4.4, and
`.dev/website-revamp/review-2026-08-31-1000.md` (round 1's final review, whose verification numbers
this PRD's `dist/` audit is built against) are all read and cited directly.

**Important framing, stated once up front:** every grep/count in this document was run against the
repo's *current* state on `website-revamp` — i.e., round 1's shipped code, with **none of round 2's
R1–R5 changes implemented yet** (round 2 is still in the design/PRD-writing phase; `dev-code` has not
run). This PRD is therefore written prospectively: it inventories what exists today, states which
round-2 sub-project's PRD already fixes each item, and designs the sweep an implementer runs **after**
R1–R5's code has actually landed, to catch whatever is left. Every count and file list below is
real, not estimated — reproduced by the exact commands in §4.1, runnable again post-implementation to
confirm nothing regressed and nothing new appeared.

---

## 1. Problem

Four unrelated pieces of repo-wide finishing work, none of which any single R1–R5 sub-project can
own, because each spans files multiple sub-projects touch or files nobody this round claims:

1. **Em dashes are still reachable after R1–R5 land, and nothing stops them from coming back.**
   R2 rewrites `Hero.tsx`/`AboutSection.tsx`/`ContactSection.tsx`'s em dashes (5 `&mdash;` instances,
   confirmed by `grep`, §4.1) and R5 rewrites both legal pages plus `ConsentBanner.tsx`'s one stray
   em dash (`05-legal-pages/PRD.md` §4.4, §9 item 6). Neither R1, R2, R3, R4, nor R5 owns
   `index.html`, `src/config/site.ts`, `src/pages/NotFoundPage.tsx`, or four of the surviving
   `src/content/{projects,research}/*.md` bodies/descriptions — all of which have real em dashes
   today, verified below. And even once every one of those is fixed once, nothing in the repo stops
   the next content edit or the next AI-assisted commit from reintroducing one — the owner's
   complaint is exactly the kind of regression that creeps back in silently unless a gate catches it.
2. **The "de-AI voice pass" the owner asked for ("the whole site feels written by AI") only reaches
   the sections and pages R1–R5 individually rewrote.** `src/content/projects/*.md` and
   `src/content/research/*.md` bodies (SP07's round-1 drafts, untouched by any round-2 PRD except
   R3's project *deletions*, which don't touch surviving bodies), `RouteMeta`/`src/config/site.ts`
   default descriptions, `EmptyState`, `SearchFilter` placeholders, `Footer`, and
   `scripts/generate-og-cards.mjs`'s rendered card text are all still exactly what SP07/SP01/SP06
   originally shipped in round 1 — nobody in round 2 has looked at them.
3. **`firebase.json` is permanently git-dirty the moment anyone builds, and the committed content is
   stale the instant that happens.** `scripts/inject-csp-hashes.mjs` (postbuild) and
   `vite.config.ts`'s `liveRedirectsPlugin` (closeBundle) both rewrite the tracked `firebase.json` in
   place with per-build CSP hashes and the current `liveUrl` redirect list. Verified directly: `git
   status --porcelain` on this branch right now shows `M firebase.json` from a prior local build, and
   `git diff firebase.json` (reproduced in §4.3) shows exactly the mutation both scripts perform —
   reformatted JSON (a side effect of `JSON.stringify(config, null, 2)` re-serializing a file that was
   originally hand-formatted more compactly), a 6-entry `hosting.redirects` block, and ten
   build-specific `sha256-` hashes appended to `script-src`. This isn't a one-time nuisance: the
   `__VITE_REACT_SSG_HASH__` bootstrap script `vite-react-ssg` injects into every prerendered page
   embeds a fresh `Math.random()` string on every single build (confirmed by reading
   `inject-csp-hashes.mjs`'s own header comment), so the hash set — and therefore the file — changes
   on every build, forever. Committing the generated output would never converge to a stable, clean
   `git status`.
4. **Nobody has run the full verification gate against what R1–R5 will actually produce, and nobody
   has taken the ship steps.** `npm run check:launch` is red today on purpose (`sample-project.md`
   still has `demo: true` — R3 fixes this). The `dist/` build has never been audited for this round's
   owner-visible claims (no em dashes in rendered HTML, the deleted projects and sample-project gone
   from the sitemap/OG output, CSP hashes matching the actual build). No preview deploy exists for
   this round's changes, and no PR from `website-revamp` to `main` has been opened — the same
   validation-PR step SP08 Task 7 left for the owner in round 1 (`.dev/website-revamp/README.md`,
   "Still requires the owner") is still outstanding, and this round's changes need the identical
   preview-then-PR treatment before anyone considers merging to `main`.

## 2. Goals

- A repo-wide em-dash inventory, run for real against the actual repo (not estimated), separating
  "already fixed by R2/R5" from "R6 must fix" from "already clean, verified."
- Every remaining em dash (in both its literal `—` and `&mdash;`/`&#8212;` entity forms) rewritten
  with a real, sentence-level rewrite — never a mechanical comma swap — preserving every factual
  claim, following the round's voice rules (SHARED-CONTEXT decision 7).
- A permanent, automated guard wired into `npm run check:launch` that fails the build the moment an
  em dash reappears in user-visible copy, scoped precisely enough that it never fires on a code
  comment, a `.dev/**` planning document, this PRD itself, or a legitimate en-dash numeric range.
- The de-AI voice pass extended to every remaining file R1–R5 don't already own: surviving project/
  research bodies and descriptions, `RouteMeta`/`site.ts` defaults, `EmptyState`, `SearchFilter`
  placeholders, `Footer`, `NotFoundPage`, `ConsentBanner` (verified, not re-touched — see §9), and
  `generate-og-cards.mjs`'s rendered card text.
- A resolved, justified decision on `firebase.json`'s build-dirty problem, with the currently
  uncommitted diff's fate stated explicitly.
- A run, in order, of every quality gate this project has (`format`, `lint`, `typecheck`, `test`,
  `check:no-forms`, `check:launch`, `build`), plus a `dist/`-level audit of this round's specific
  owner-visible claims, with an explicit definition of "green."
- Designed (not executed) preview-channel deploy and PR-to-`main` steps, doubling as SP08 Task 7's
  long-outstanding validation PR — explicitly stopping short of the merge-to-`main` cutover, which is
  owner-only (SP08 PRD §4.4).
- A designed `.dev/website-revamp-r2/README.md` index consolidating every `[OPEN]` item and every §8
  owner action across all six round-2 PRDs, so nothing from this round gets lost the way nothing from
  round 1 was (round 1's own `README.md` already does this successfully — this is the same pattern).

## 3. Non-Goals

- Re-designing anything R1–R5 already settled. Where this PRD disagrees with a sibling decision, it
  is recorded in §9 as a disagreement, not silently overridden — there is exactly one such case (the
  Nav/Footer new-tab cross-note R4 left open, §9).
- Touching `src/sections/*` (R2), `src/content/**`'s deletions or the work-experience rebuild (R3),
  `src/components/*`/`src/data/*` (R4), or `src/pages/{Privacy,Terms}Page.tsx`/`ConsentContext.tsx`/
  `ConsentBanner.tsx`'s substance (R5) — this PRD only touches what those five explicitly leave
  behind, verified file by file in §4.1/§4.2, not assumed.
- The merge of `website-revamp` into `main`. Designing the PR is in scope; merging it is not — see
  §8, restated from `08-ci-deploy-pipeline/PRD.md` §4.4's operational-consequence framing.
- Any new runtime dependency. The em-dash guard is a plain Node script using the TypeScript compiler
  API, already a `devDependency` (`typescript ~6.0.2`) — no package addition.
- Rewriting the OG-card generator's own layout or introducing new copy into it. §4.2 verifies its
  only hardcoded rendered string (`'tejitpabari.com'`) has no em dash and needs no change; every other
  piece of text on a card is data-driven from content already covered by the content-file sweep.
- Deciding the real value for `LAST_UPDATED` on `/privacy`/`/terms` beyond "the date this PR is
  opened" — R5 §9 item 5 hands this exact one-line-times-two edit to R6 as part of the ship sequence;
  §4.5 designs it as a mechanical step, not a new content decision.

---

## 4. Architecture Decisions

### 4.1 Em-dash inventory — exact commands, exact counts, exact disposition

**The three forms searched for, everywhere:** the literal em dash character `—` (U+2014), the HTML
entity `&mdash;`, and the numeric entity `&#8212;`. Confirmed by direct inspection that this
codebase actually uses two different forms depending on context (not a hypothetical to guard against
either way): JSX text nodes subject to ESLint's `react/no-unescaped-entities` rule use `&mdash;`
(e.g. `AboutSection.tsx`); JSX attribute string literals (e.g. `description="..."`) use the literal
`—` character directly, since that rule doesn't apply to attribute strings; markdown content uses the
literal character throughout. `&#8212;` (the numeric form) has zero occurrences anywhere in the repo
today — included in the guard anyway since it's trivial to check and is a real, valid alternate
encoding of the same character a future edit (hand-typed or copy-pasted from elsewhere) could
introduce.

**Commands run, verbatim, against the actual repo:**

```bash
# 1. Literal em dash in .tsx/.ts, excluding lines that are entirely a // comment
#    (a rough filter — inline trailing comments still need manual triage, done below)
grep -rn "—" src --include="*.tsx" --include="*.ts" | grep -v '^\S*: *//' | grep -vE ':\s*//'

# 2. &mdash; entity anywhere in .tsx/.ts
grep -rn "&mdash;" src --include="*.tsx" --include="*.ts"

# 3. &#8212; entity anywhere in src
grep -rn "&#8212;" src

# 4. Literal em dash in every content markdown file
grep -rln "—" src/content --include="*.md"

# 5. index.html
grep -n "—\|&mdash;\|&#8212;" index.html

# 6. scripts/ — anything that emits rendered text
grep -rn "—\|&mdash;\|&#8212;" scripts/
```

**Result of command 2 — the 5 `&mdash;` hits, all already fixed by R2:**

| File | Line | R2 disposition |
|---|---|---|
| `src/sections/ContactSection.tsx` | 27 | Rewritten, R2 PRD §4.3 — hiring statement and the em dash both removed. |
| `src/sections/Hero.tsx` | 25 | Rewritten, R2 PRD §4.4 — Juno-first opening and the em dash both removed. |
| `src/sections/AboutSection.tsx` | 13, 23, 30 | Rewritten, R2 PRD §4.2 — all three em dashes removed in the four-paragraph rewrite. |

**Result of command 1 — 81 non-trivially-excluded hits, triaged by hand (every one read in
context):** the overwhelming majority (≈65) are code comments that survived the rough `// `-line
filter because they're *trailing* comments (`const x = 1; // note — detail`) rather than
comment-only lines — confirmed by reading every file's hit list directly. The genuine, non-comment
hits, by file:

| File | Real (non-comment) em-dash hits | Disposition |
|---|---|---|
| `src/pages/PrivacyPage.tsx` | 26 | R5-owned. Fully rewritten, zero em dashes in the replacement (R5 PRD §4.5/§4.7 rule 1). Not R6's file. |
| `src/pages/TermsPage.tsx` | 13 | R5-owned. Same as above (R5 PRD §4.6/§4.7). |
| `src/components/ConsentBanner.tsx` | 1 (line 16, JSX text) | R5-owned this round; R5 PRD §4.4 fixes this exact line directly (its own owned file, one clause). **Not R6's to re-touch — see §9.** |
| `src/pages/NotFoundPage.tsx` | 1 (line 30, `description=` string) | **R6.** `RouteMeta` description, unowned by R1–R5 for copy (R1 PRD §3: "Copy/voice cleanup anywhere... — R6"). |
| `src/config/site.ts` | 1 (`DEFAULT_DESCRIPTION`, line 6) | **R6.** Not `.tsx`, but explicitly named in this PRD's own task scope; rendered into every route's `<meta name="description">` via `RouteMeta` when a page doesn't supply its own. |
| Every other file in the 81-hit list (`src/lib/analytics.ts`, `*.test.tsx`/`*.test.ts`, `src/config/{contact,featured}.ts`, `src/data/shared.ts`, `src/hooks/useContactMailto.ts`, `src/layout/Nav.tsx`, `src/components/timeline/*.tsx`, `src/components/LinksRow.tsx`, `src/context/ConsentContext.tsx`, `src/sections/{Hero,HeroPortrait}.tsx`, `src/pages/live/{registry.ts,sample-project.tsx}`, `src/pages/{ProjectsPage,ProjectDetailPage,ResearchDetailPage}.tsx`) | 0 real hits | Every one of these, read individually, is a JSDoc/block comment, a JSX comment (`{/* ... */}`), an inline trailing `//` comment, or a `throw new Error(...)` build-time message never rendered to a visitor. None is user-visible copy. **No action.** |

**Result of command 4 — literal em dash in content markdown, 5 files, one moot:**

| File | Count | Disposition |
|---|---|---|
| `src/content/projects/sample-project.md` | 11 | **Moot.** Deleted outright by R3 this round (SHARED-CONTEXT locked decision 4) — not part of the post-R3 corpus at all. |
| `src/content/projects/juno.md` | 3 | **R6.** Untouched by any round-2 PRD (R3 only deletes and rebuilds other files; this one survives as-is). Rewrite in §4.4. |
| `src/content/projects/smarttest.md` | 3 | **R6.** Same. Rewrite in §4.4. |
| `src/content/projects/med-doc-tracker.md` | 1 | **R6.** Same. Rewrite in §4.4. |
| `src/content/research/flood-event-extraction-bangladesh.md` | 2 | **R6.** Same. Rewrite in §4.4. |

**Result of command 5 — `index.html`, 2 hits, both R6:** the static `<title>` and `<meta
name="description">` tags — see §4.4 for the rewrite. Not owned by any R1–R5 sub-project (none of
the five lists `index.html` in its file map).

**Result of command 6 — zero real hits.** Every `—` in `scripts/` is inside a `//` comment or a
`.md` provenance document (`scripts/assets/fonts/PROVENANCE.md`, a dev-facing document, not rendered
to any visitor, out of scope by the same reasoning as `.dev/**`). `scripts/generate-og-cards.mjs`'s
only hardcoded *rendered* string, verified by reading `cardJsx()` in full, is the literal
`'tejitpabari.com'` footer text on every OG card — zero em dashes, no change needed. Every other
piece of card text (`title`, `status`, `tags`) is passed in from content already covered by the
`src/content/**/*.md` sweep above; fixing the source content transitively fixes what renders on the
card.

**Complete inventory table — every file containing user-visible copy that R1–R5 do not own, em-dash
count, and disposition (the "quality bar" deliverable this PRD's task requires):**

| File | Em dashes today | R6 action |
|---|---:|---|
| `index.html` | 2 | Rewrite (§4.4) |
| `src/config/site.ts` (`DEFAULT_DESCRIPTION`) | 1 | Rewrite (§4.4) |
| `src/pages/NotFoundPage.tsx` (`RouteMeta description`) | 1 | Rewrite (§4.4) |
| `src/pages/ProjectsPage.tsx` (`RouteMeta description`) | 0 | Verified clean, no change |
| `src/pages/ResearchPage.tsx` (`RouteMeta description`) | 0 | Verified clean, no change |
| `src/pages/WorkExperiencePage.tsx` (`RouteMeta description`) | 0 | Verified clean, no change |
| `src/components/EmptyState.tsx` | 0 | Verified clean, no change |
| `src/components/SearchFilter.tsx` (placeholders, passed by callers) | 0 | Verified clean, no change |
| `src/layout/Footer.tsx` | 0 | Verified clean, no change |
| `scripts/generate-og-cards.mjs` (hardcoded card text) | 0 | Verified clean, no change |
| `src/content/projects/juno.md` | 3 | Rewrite (§4.4) |
| `src/content/projects/smarttest.md` | 3 | Rewrite (§4.4) |
| `src/content/projects/med-doc-tracker.md` | 1 | Rewrite (§4.4) |
| `src/content/projects/clip-verse.md` | 0 | Verified clean, no change |
| `src/content/projects/columbia-virtual-campus.md` | 0 | Verified clean, no change |
| `src/content/projects/creator-onboarding-tool.md` | 0 | Verified clean, no change |
| `src/content/projects/crunchy-filler.md` | 0 | Verified clean, no change |
| `src/content/projects/qgis-plugin-azure-maps-creator.md` | 0 | Verified clean, no change |
| `src/content/research/flood-event-extraction-bangladesh.md` | 2 | Rewrite (§4.4) |
| `src/content/research/dvmm-lab.md` | 0 | Verified clean, no change |
| `src/content/research/incite-labs.md` | 0 | Verified clean, no change |
| `src/content/research/pill-recognition-prescription-extraction.md` | 0 | Verified clean, no change |
| `src/content/research/solar-illumination-water-bottle.md` | 0 | Verified clean, no change |
| `src/content/work-experience/*.md` (post-R3, new 3-file corpus) | 0 (per R3 PRD §4.1's full text, checked directly) | Verified clean at design time; re-verify post-implementation via the guard, no R6 authoring needed |

**Scope decisions, stated and justified (the task's explicit "decide and justify" ask):**

- **En dashes (`–`, U+2013) are OUT of scope for the ban.** Searched the same way (`grep -rn "–" src
  --include="*.tsx" --include="*.ts"`, plus a content-file pass): exactly 3 real hits, all in
  `src/data/workExperience.ts`/`workExperience.test.ts`, all reading `"the 2–3 line blurb"` — the
  standard, correct typographic use of an en dash for a numeric range, not a substitute for an em
  dash in prose, and not even user-visible copy (a dev-facing error message). The owner's complaint
  was specifically "long dashes" (brief #12) — an en dash is a visibly shorter, different character
  serving a different grammatical role (ranges: "2021–2024", "pages 4–8") that this codebase doesn't
  currently misuse anywhere. Banning it would force awkward rewrites of legitimate future range
  expressions (a work-experience date range, a page-count) with no stated complaint driving that
  scope. **Recommendation: leave en dashes alone entirely, including in the guard.**
- **The existing `&rsquo;`/`&ldquo;`/`&rdquo;` entity-encoding convention (21 occurrences of
  `&rsquo;` alone, e.g. every `I&rsquo;m`, `doesn&rsquo;t`) stays exactly as-is.** This is an
  unrelated ESLint (`react/no-unescaped-entities`) requirement for encoding apostrophes and curly
  quotes inside JSX text — a punctuation *encoding* convention, not the em-dash *content* the owner
  complained about. Nothing in brief #12 or SHARED-CONTEXT decision 7 touches apostrophe/quote
  styling, and the guard (§4.5) is deliberately scoped to only the three em-dash forms, never
  flagging `&rsquo;`/`&ldquo;`/`&rdquo;`.

### 4.2 The de-AI voice pass — inventory and disposition, beyond em dashes alone

Every file in §4.1's "0 em dashes, verified clean" rows was also read in full for the AI-essay tics
SHARED-CONTEXT decision 7 and this round's specific bans target (tricolon lists, "not X, but Y",
"passionate about", sentence-initial "Whether", hedge-then-reveal constructions) — not just grepped
for a dash:

- **The five zero-em-dash project files** (`clip-verse.md`, `columbia-virtual-campus.md`,
  `creator-onboarding-tool.md`, `crunchy-filler.md`, `qgis-plugin-azure-maps-creator.md`) and **four
  zero-em-dash research files** (`dvmm-lab.md`, `incite-labs.md`,
  `pill-recognition-prescription-extraction.md`, `solar-illumination-water-bottle.md`) have **no
  body content at all** (empty after frontmatter) and plain, factual, declarative-sentence
  descriptions ("A web tool that extracts location information from YouTube videos...", "Built a
  phrase-grounding pipeline using YOLOv3 and BERT..."). None of SP07's original round-1 drafting
  introduced any of the flagged AI-tics into these nine files. **No rewrite needed** — verified by
  reading every word, not assumed clean because the em-dash grep was clean.
- **`EmptyState.tsx`, `SearchFilter.tsx`'s two placeholder strings, `Footer.tsx`, `ProjectsPage.tsx`/
  `ResearchPage.tsx`/`WorkExperiencePage.tsx`'s `RouteMeta` descriptions** — all read in full. Short,
  functional, factual UI copy ("No projects match…", "Search projects by name, description, or tag",
  "Visual design adapted from Brittne Valdivia's techfolio", "Health-tech and developer-tools
  projects, from Juno to a decade of shipped side projects"). None carries an AI-essay tic. **No
  rewrite needed.**
- **The four files needing an em-dash rewrite** (`juno.md`, `smarttest.md`, `med-doc-tracker.md`,
  `flood-event-extraction-bangladesh.md`) are otherwise already in the plain, factual register this
  round wants — the em dash is each file's only real defect. §4.4's rewrites therefore fix the dash
  and leave everything else untouched, rather than rewriting prose that was never broken.
- **`index.html`'s title/description and `site.ts`'s `DEFAULT_DESCRIPTION`** are also otherwise
  clean prose; only the em dash needs fixing (§4.4).

**Conclusion: the de-AI voice pass, for every file this PRD owns, reduces exactly to the em-dash
rewrites in §4.4.** No file in R6's scope has an AI-tic that survives independent of its em dash —
stated explicitly rather than silently assumed, since the task calls for inventorying the pass
properly, not just running a dash-grep and calling it done.

### 4.3 The `firebase.json` build-dirty resolution

**The problem, reproduced exactly.** `git status --porcelain` on this branch right now:

```
 M firebase.json
?? .dev/website-revamp-r2/
```

`git diff firebase.json` shows three independent kinds of change, all traced to their source:

1. **Pure reformatting noise.** The committed file uses compact single-line objects
   (`{ "key": "X", "value": "Y" }`); both `inject-csp-hashes.mjs` and `liveRedirectsPlugin` write via
   `JSON.stringify(config, null, 2)`, which always fully expands every nested object — this alone
   produces most of the diff's line count, with zero semantic change.
2. **A 6-entry `hosting.redirects` block**, written by `vite.config.ts`'s `liveRedirectsPlugin`
   (`closeBundle`, `apply: 'build'`) — absent from the committed file, present after any real build.
3. **Ten `sha256-` hashes appended to `script-src`**, written by `scripts/inject-csp-hashes.mjs`
   (`postbuild`) — these are *guaranteed* to differ on every single build, not just today's: the file
   's own header comment states `vite-react-ssg` embeds a fresh `Math.random()` string
   (`window.__VITE_REACT_SSG_HASH__`) into a prerendered `<script>` on every build, so the exact
   `sha256-` value covering that script's body is different every time, forever.

**Three options evaluated, per the task:**

**(a) Commit the generated output, accept the churn.** Rejected outright, not just as the weaker
option — it cannot work at all as a steady state. Because the `__VITE_REACT_SSG_HASH__` bootstrap
script's content differs on every build, `firebase.json` would show a diff after *every single build
forever*, including a build that changed zero application code. `git status` would never be clean on
a machine that just ran `npm run build`, which is exactly today's actual symptom — this option is
"keep doing what's already broken," not a fix.

**(b) A tracked `firebase.template.json`; `firebase.json` becomes build-generated and gitignored.**
Both build scripts already read-modify-write a JSON config at build time (`liveRedirectsPlugin`
already does exactly this pattern) — the only change is *which* file they read their base
configuration from (a stable template) versus which file they write their computed output to
(`firebase.json`, now untracked). This is also not a new convention for this repo: `.gitignore`
already treats other `prebuild`-regenerated hosting-adjacent artifacts this exact way (`public/og/`,
`public/sitemap.xml`, `public/robots.txt`, with the comment "Build-time generated output... same
'regenerated every build, nothing to commit' status as `dist/` itself, just staged one directory
earlier") — `firebase.json` is the same shape of artifact, generated fresh from source data on every
build, that simply hadn't been given the same treatment yet.

**(c) Move CSP hashing into a `<meta http-equiv="Content-Security-Policy">` tag in the prerendered
HTML instead of a `firebase.json` HTTP header.** Rejected: a `<meta http-equiv>` CSP cannot express
`frame-ancestors` (the HTML spec explicitly disallows it in a meta-delivered policy — only an HTTP
header can set it), and this project's committed CSP sets `frame-ancestors 'none'`, a real security
control (round-1's Deep Security review flagged missing security headers as a genuine, if
non-blocking, gap that was since closed — losing `frame-ancestors` to "fix" the git-dirty problem
would reopen a closed security item to solve an unrelated build-hygiene one). It would also still
leave the `hosting.redirects` block's own mutation of `firebase.json` unaddressed — option (c) only
ever solves the CSP-hash third of the problem, not the whole thing.

**Recommendation: option (b).** It fully eliminates the git-dirty state (a fresh build produces the
same `firebase.json` bytes it always would, and that file is never staged for commit because it's
gitignored), it's the smallest change (two scripts already do read-modify-write; only the *source*
of "modify" changes), and it matches an established convention already in this exact `.gitignore`
file for the exact same class of artifact.

**The exact change, file by file:**

1. **Discard the currently-uncommitted diff, then rename.**

   ```bash
   git checkout -- firebase.json   # back to the clean, committed pre-build baseline
   git mv firebase.json firebase.template.json
   ```

   `firebase.template.json`'s content is therefore *exactly* today's committed `firebase.json` —
   `"public": "dist"`, the three static header rules (`X-Content-Type-Options`,
   `Referrer-Policy`, `Strict-Transport-Security`, and the base `Content-Security-Policy` with no
   build-specific hashes), the `rewrites` block, and **no** `hosting.redirects` key at all (it's
   added fresh by `liveRedirectsPlugin` on every build; a template with a stale or empty `redirects:
   []` would be actively misleading about what the file's real, generated shape looks like).

2. **`vite.config.ts`'s `liveRedirectsPlugin` reads the template, writes the generated file:**

   ```ts
   // before
   closeBundle() {
     const entries = readLiveUrls(PROJECTS_DIR);
     const firebaseJsonPath = path.resolve(__dirname, 'firebase.json');
     const config = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'));
     config.hosting.redirects = entries.map(({ slug, liveUrl }) => ({
       source: `/projects/${slug}/live`,
       destination: liveUrl,
       type: 302,
     }));
     writeFileSync(firebaseJsonPath, JSON.stringify(config, null, 2) + '\n');
   },
   ```

   ```ts
   // after
   closeBundle() {
     const entries = readLiveUrls(PROJECTS_DIR);
     // Always sourced fresh from the tracked template, never from a
     // previous build's own generated output — this makes every build
     // idempotent regardless of what firebase.json (gitignored, may or may
     // not already exist on disk) currently contains. See PRD 06 §4.3.
     const templatePath = path.resolve(__dirname, 'firebase.template.json');
     const firebaseJsonPath = path.resolve(__dirname, 'firebase.json');
     const config = JSON.parse(readFileSync(templatePath, 'utf-8'));
     config.hosting.redirects = entries.map(({ slug, liveUrl }) => ({
       source: `/projects/${slug}/live`,
       destination: liveUrl,
       type: 302,
     }));
     writeFileSync(firebaseJsonPath, JSON.stringify(config, null, 2) + '\n');
   },
   ```

   `scripts/inject-csp-hashes.mjs` needs **no change** — it already reads and writes
   `firebase.json` (not the template), and by the time it runs (postbuild, after `vite-react-ssg
   build` has already triggered `closeBundle` above), `firebase.json` reliably exists with the
   fresh redirects block already in place. Its own idempotent-`baseSources`-filtering logic (already
   present, stripping any pre-existing `'sha256-...'` entries before appending fresh ones) continues
   to work exactly as before; it now simply never has stale hashes to strip in practice, since the
   file it's reading was itself freshly generated from a hash-free template moments earlier in the
   same build.

3. **`.gitignore`** — one line added to the existing "build-time generated output" block, extending
   its own comment rather than starting a new one:

   ```diff
    # Build-time generated output (SP06 `prebuild`: scripts/generate-og-cards.mjs,
    # scripts/generate-sitemap.mjs). `public/` is copied verbatim into `dist/` by
    # `vite-react-ssg build`, and `prebuild` always regenerates these before that
    # copy happens — same "regenerated every build, nothing to commit" status as
    # `dist/` itself, just staged one directory earlier.
    public/og/
    public/sitemap.xml
    public/robots.txt
   +
   +# Same status as the three lines above, one layer up: firebase.json is
   +# rewritten on every build by vite.config.ts's liveRedirectsPlugin
   +# (closeBundle) and scripts/inject-csp-hashes.mjs (postbuild), sourced from
   +# the tracked firebase.template.json. Never commit the generated file — a
   +# fresh `npm run build` always reproduces it from the template plus the
   +# current content corpus. See .dev/website-revamp-r2/06-voice-sweep-and-ship/
   +# PRD.md §4.3.
   +firebase.json
   ```

**What this changes about a hand-run `firebase deploy` — the actual risk, addressed directly.** CI
never needed the committed file to be current (it always runs `npm run build` in the same job,
immediately before the deploy step, per `08-ci-deploy-pipeline/PRD.md` §4.2 step 5–6) — this was
already true before this change and remains true after. The real risk the task flags is a **hand-run
`firebase deploy` without a fresh build**: today, that would silently deploy whatever stale
`firebase.json` happened to be sitting in the working tree (possibly last week's redirects, possibly
missing this week's CSP hashes entirely, which would either break analytics/rendering under a
too-strict served CSP or, worse, silently deploy with a *previous* build's hashes that don't match
the *currently-committed* `dist/`). **Under option (b), that same hand-run `firebase deploy` on a
fresh clone (or after `firebase.json` is deleted/never built) fails loudly instead** — the file
simply doesn't exist, and `firebase-tools` errors immediately with a missing-config-file message
rather than silently deploying a stale artifact. This converts a silent correctness risk into a loud,
immediately-obvious one, which is the property this option is chosen for.

**What happens to the currently-uncommitted diff, stated plainly:** it is discarded. Step 1's `git
checkout -- firebase.json` reverts the working tree to the clean, committed baseline before the
rename — none of the locally-generated redirects or hashes currently sitting in the working tree are
carried forward into `firebase.template.json`; the template is byte-for-byte today's *committed*
`firebase.json`, not today's *locally built* one.

### 4.4 The rewrites — real code, worked examples covering every substitution pattern

**Rewrite policy, stated once, applied throughout §4.4:** an em dash is never mechanically replaced
with a comma. Each occurrence is read for what grammatical job it's actually doing, and rewritten
with the punctuation (or sentence break) that actually does that job:

| The dash is doing... | Replace with | Worked example below |
|---|---|---|
| Joining two independent clauses that could each stand alone | A period — split into two sentences | `juno.md` body para 1 |
| Introducing an elaboration, a list, or "here's what that means" | A colon | `juno.md` frontmatter description |
| Setting off a true aside — parenthetical, could be deleted without losing the main clause's meaning | Parentheses | `smarttest.md` body para 2, `flood-event-extraction-bangladesh.md` |
| A short appositive naming/restating the subject, no full clause on either side | A colon (for a name/role pairing) | `index.html` `<title>` |

**`index.html`:**

```diff
-    <title>Tejit Pabari — Health-Tech Builder</title>
+    <title>Tejit Pabari: Health-Tech Builder</title>
     <meta
       name="description"
-      content="Tejit Pabari — software engineer and founder building health-tech products, including Juno, an AI companion for medical appointments."
+      content="Tejit Pabari is a software engineer and founder building health-tech products, including Juno, an AI companion for medical appointments."
     />
```

The `<title>` fix is a colon (a name/role appositive — same job the dash was doing, correctly). The
description fix adds the linking verb ("is a") the dash was standing in for and drops the dash
entirely — a full sentence needed a verb, not a substitute for one. R2 PRD §9's Hero-eyebrow question
is now resolved (owner decision, 2026-09-01: keep "Health Tech Builder" as-is) — this title already
matches, no revisit needed; see §9.

**`src/config/site.ts`:**

```diff
 export const DEFAULT_DESCRIPTION =
-  'Health-tech builder and software engineer — building Juno, an AI companion ' +
+  'Health-tech builder and software engineer. Building Juno, an AI companion ' +
   'for medical appointments, while working full-time on Microsoft Fabric Maps.';
```

Period split — two short declarative sentences read as punchier and more human than one long
dash-joined one, and the second sentence's fragment ("Building Juno...") matches the deliberately
short-sentence register R2's own `AboutSection` rewrite uses ("It's early." / "I'm still validating
the idea with patients and clinicians.").

**`src/pages/NotFoundPage.tsx`:**

```diff
       <RouteMeta
         title="Page Not Found"
-        description="That page doesn't exist — head back to the homepage."
+        description="That page doesn't exist. Head back to the homepage."
         path={location.pathname}
       />
```

Simple period split — the dash was joining two complete, unrelated instructions.

**`src/content/projects/juno.md`** — frontmatter description (colon: what follows is a list
elaborating on "AI companion"):

```diff
 description: >-
-  An AI companion for medical appointments — live note-taking, real-time
+  An AI companion for medical appointments: live note-taking, real-time
   question prompts, and a clear summary of what to do next. Built with
   neurologists and researchers, and validated with 200+ patients and 30+
   doctors so far.
```

Body, paragraph 1 (period — two independent clauses; "It" carries the subject forward):

```diff
-Juno helps patients get more out of every doctor's visit. During an appointment, it takes structured notes in real time and prompts context-aware questions a patient might not think to ask in the moment — then turns the conversation into a clear summary with concrete follow-ups, instead of a page of hurried handwriting.
+Juno helps patients get more out of every doctor's visit. During an appointment, it takes structured notes in real time and prompts context-aware questions a patient might not think to ask in the moment. It turns the conversation into a clear summary with concrete follow-ups, instead of a page of hurried handwriting.
```

Body, paragraph 3 (colon — "the current focus is..." elaborates on "pre-launch"):

```diff
-So far: 200+ patients surveyed, 30+ doctors consulted, and 70 patients on the beta waitlist. Juno is still pre-launch — the current focus is validating the clinical workflow before scaling it.
+So far: 200+ patients surveyed, 30+ doctors consulted, and 70 patients on the beta waitlist. Juno is still pre-launch: the current focus is validating the clinical workflow before scaling it.
```

**`src/content/projects/smarttest.md`** — frontmatter description (colon, restructured into a
complete independent clause rather than a dangling participle — the participle "walking users
through..." only worked grammatically *because* the dash let it trail off the main clause; a colon
needs a real clause after it):

```diff
 description: >-
-  A smartphone app that makes HIV and syphilis self-testing more accessible —
-  walking users through the test, helping interpret results, and linking them
-  to follow-up care. Downloaded 1,000+ times.
+  A smartphone app that makes HIV and syphilis self-testing more accessible.
+  It walks users through the test, helps interpret results, and links them
+  to follow-up care. Downloaded 1,000+ times.
```

(Note: chosen as a period here, not a colon, even though the same grammatical job as the description
above — deliberately varied from the frontmatter description's colon a few lines later in the same
file, since two colon-introduced clauses back to back inside the same short file reads mechanically.
The rewrite policy is "pick the punctuation that fits," not "pick one substitution and apply it
everywhere.")

Body, paragraph 1 (same construction, same fix):

```diff
-SMARTtest is a smartphone app that makes HIV and syphilis self-testing more accessible — walking a user through the test itself, helping interpret the result, and linking them to follow-up care, all from a phone. Built with React Native and Firebase, with Twilio and SendGrid handling secure result-sharing, and deployed and tested through Expo.
+SMARTtest is a smartphone app that makes HIV and syphilis self-testing more accessible. It walks a user through the test itself, helps interpret the result, and links them to follow-up care, all from a phone. Built with React Native and Firebase, with Twilio and SendGrid handling secure result-sharing, and deployed and tested through Expo.
```

Body, paragraph 2 (parentheses — a genuine, droppable aside about personal significance, not a claim
load-bearing to the sentence's main point):

```diff
-The app has been downloaded 1,000+ times and received national news coverage. The underlying research was published in the journal *AIDS and Behavior* — one of the earliest projects that pointed me toward health tech, years before Juno.
+The app has been downloaded 1,000+ times and received national news coverage. The underlying research was published in the journal *AIDS and Behavior* (one of the earliest projects that pointed me toward health tech, years before Juno).
```

**`src/content/projects/med-doc-tracker.md`** (period — the second clause is a short, deliberate
fragment describing purpose, matching the "Built to..." fragment style already used elsewhere in this
round's rewrites):

```diff
 description: >-
   A personal tool for storing, organizing, and searching all your medical
-  documents in one place — built to make the fragmented world of medical
-  records simpler to navigate.
+  documents in one place. Built to make the fragmented world of medical
+  records simpler to navigate.
```

**`src/content/research/flood-event-extraction-bangladesh.md`** (parentheses — a textbook
double-em-dash aside, converts directly to a single parenthetical):

```diff
 description: >-
   Built a BERT-based classifier to extract flood events from 40,000+ tagged
-  Bangladeshi news articles, then used the resulting time-series — validated
-  against Sentinel satellite data — to help the Bangladesh government
+  Bangladeshi news articles, then used the resulting time-series (validated
+  against Sentinel satellite data) to help the Bangladesh government
   develop a flood-index insurance product. Presented at AGU; published as a
   pre-print.
```

**Fact-check, all four content files:** every rewrite above changes punctuation and, where a dash
becomes a colon requiring a restructured clause, verb form only — no fact, number, name, or claim is
added, removed, or altered. Cross-checked against the pre-existing (unchanged) versions line by line.

### 4.5 The permanent guard — `scripts/check-no-em-dash.mjs`

**Why an AST-based checker, not a plain `grep`.** A blanket `grep -r "—" src` returns 181 hits in
`.tsx`/`.ts` files alone (§4.1) — the overwhelming majority are code comments, which this codebase's
own established style uses em dashes in constantly and legitimately (visible throughout every file
read for this PRD). A guard that fires on comments would be immediately, permanently red and would
train exactly the wrong reflex (disable the check, or start avoiding em dashes in comments too,
neither of which is what the owner asked for). The TypeScript compiler API parses source into an AST
whose nodes never include comments as a walkable node kind (comments are lexer trivia, attached to
tokens, not part of the syntax tree `ts.forEachChild` traverses) — checking only `JsxText` nodes and
a curated set of copy-bearing string/attribute nodes is therefore both precise (never a
false-positive on a comment) and correct by construction, not by a fragile regex trying to
approximate "this isn't a comment."

**Scope — exact include/exclude rules:**

- **Included:** every `src/**/*.tsx` file except `*.test.tsx` (JSX text nodes, plus string/template
  literal values on a fixed attribute allowlist: `title`, `description`, `placeholder`,
  `aria-label`, `alt`, `label`); `src/config/site.ts`'s `DEFAULT_DESCRIPTION` export specifically
  (not a whole-file `.ts` sweep — every other string in that file, and in every other `.ts` file in
  `src/`, is a URL, a code identifier, or a build-time-only error message, never rendered to a
  visitor); every `src/content/**/*.md` file, whole-file; `index.html`, whole-file.
- **Excluded, by construction (never walked, not filtered after the fact):** every code comment in
  every `.tsx`/`.ts` file (comments are not AST nodes — see above); every `*.test.tsx`/`*.test.ts`
  file (test descriptions and fixture strings are developer-facing, not rendered copy); every file
  under `.dev/**` (never scanned — this script never reads that directory); this PRD itself (a `.md`
  file, but outside `src/content/**`, the only markdown directory scanned); every other `.ts` file in
  `src/` (`data/shared.ts`, `config/{contact,featured}.ts`, `hooks/*.ts`, `lib/analytics.ts`) —
  deliberately not swept, since every string literal in them verified in §4.1 is a build-time error
  message or a non-rendered value, and a blanket `.ts` sweep would need to start flagging those too;
  `scripts/**` (dev tooling, its own comments and error messages, not user-visible — its one real
  rendered string, `generate-og-cards.mjs`'s `'tejitpabari.com'`, is verified clean and hand-audited
  in §4.1/§4.2 rather than swept automatically, since a general `scripts/` sweep would otherwise also
  need to exclude every dev-facing string in that directory one by one).

**`scripts/check-no-em-dash.mjs` — complete, real code:**

```js
#!/usr/bin/env node
// scripts/check-no-em-dash.mjs
//
// Guard for SHARED-CONTEXT locked decision 7a / brief #12: no long em
// dashes (—), the HTML entity &mdash;, or the numeric entity &#8212;
// anywhere in USER-VISIBLE copy. Wired into `npm run check:launch`
// (package.json) so this can't silently regress once R6 lands. See PRD
// 06 §4.5 for the full scope reasoning.
//
// Deliberately does NOT flag: en dashes (a different character serving a
// different, legitimate role — numeric ranges — never banned by the
// owner's feedback, PRD 06 §4.1); &rsquo;/&ldquo;/&rdquo; (an unrelated
// apostrophe/quote-encoding convention); code comments (never part of the
// AST this script walks — comments are lexer trivia, not syntax-tree
// nodes); *.test.ts(x) (developer-facing test descriptions/fixtures, not
// rendered copy); anything outside the four scanned roots below.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ROOT = path.resolve(import.meta.dirname, '..');

const PATTERNS = [
  { name: 'em dash (—)', test: (s) => s.includes('—') },
  { name: '&mdash; entity', test: (s) => s.includes('&mdash;') },
  { name: '&#8212; entity', test: (s) => s.includes('&#8212;') },
];

export function findMatches(text) {
  return PATTERNS.filter((p) => p.test(text)).map((p) => p.name);
}

const failures = []; // { file, line, snippet, kinds }

function report(file, line, text) {
  const kinds = findMatches(text);
  if (kinds.length === 0) return;
  failures.push({ file: path.relative(ROOT, file), line, snippet: text.trim().slice(0, 90), kinds });
}

const COPY_ATTRS = new Set(['title', 'description', 'placeholder', 'aria-label', 'alt', 'label']);

/** Exported for the companion unit test — takes already-read source text so
 *  the test can exercise this against fixtures with no real filesystem I/O. */
export function scanTsxSource(file, source) {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found = [];

  function at(node) {
    return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  }

  function visit(node) {
    if (ts.isJsxText(node)) {
      if (findMatches(node.text).length > 0) found.push({ line: at(node), text: node.text });
    } else if (ts.isJsxAttribute(node) && node.name && COPY_ATTRS.has(node.name.getText(sourceFile))) {
      const init = node.initializer;
      if (init && ts.isStringLiteral(init)) {
        if (findMatches(init.text).length > 0) found.push({ line: at(init), text: init.text });
      } else if (init && ts.isJsxExpression(init) && init.expression) {
        const expr = init.expression;
        if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
          if (findMatches(expr.text).length > 0) found.push({ line: at(expr), text: expr.text });
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return found;
}

export function scanSiteConfigSource(file, source) {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const found = [];

  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(sourceFile) === 'DEFAULT_DESCRIPTION' && node.initializer) {
      const text = node.initializer.getText(sourceFile);
      const line = sourceFile.getLineAndCharacterOfPosition(node.initializer.getStart(sourceFile)).line + 1;
      if (findMatches(text).length > 0) found.push({ line, text });
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return found;
}

function walkDir(dir, exts, fn) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkDir(full, exts, fn);
    else if (exts.some((e) => entry.endsWith(e))) fn(full);
  }
}

function main() {
  // 1. src/**/*.tsx, excluding *.test.tsx
  walkDir(path.join(ROOT, 'src'), ['.tsx'], (file) => {
    if (file.endsWith('.test.tsx')) return;
    const source = readFileSync(file, 'utf-8');
    for (const { line, text } of scanTsxSource(file, source)) report(file, line, text);
  });

  // 2. src/config/site.ts — DEFAULT_DESCRIPTION only
  const siteFile = path.join(ROOT, 'src/config/site.ts');
  for (const { line, text } of scanSiteConfigSource(siteFile, readFileSync(siteFile, 'utf-8'))) {
    report(siteFile, line, text);
  }

  // 3. src/content/**/*.md — whole file, line by line
  walkDir(path.join(ROOT, 'src/content'), ['.md'], (file) => {
    readFileSync(file, 'utf-8').split('\n').forEach((line, i) => report(file, i + 1, line));
  });

  // 4. index.html — whole file, line by line
  const htmlFile = path.join(ROOT, 'index.html');
  readFileSync(htmlFile, 'utf-8').split('\n').forEach((line, i) => report(htmlFile, i + 1, line));

  if (failures.length > 0) {
    console.error(`check-no-em-dash: found ${failures.length} offending line(s):\n`);
    for (const f of failures) {
      console.error(`  ${f.file}:${f.line}  [${f.kinds.join(', ')}]\n    ${f.snippet}`);
    }
    console.error(
      '\nRewrite with a period, colon, or parentheses instead — never a mechanical comma swap. ' +
        'See .dev/website-revamp-r2/06-voice-sweep-and-ship/PRD.md §4.4 for worked examples.',
    );
    process.exit(1);
  }

  console.log('check-no-em-dash passed — no em dashes found in user-visible copy.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

**Wiring — `package.json`:**

```diff
   "scripts": {
     "dev": "vite-react-ssg dev",
     "typecheck": "tsc -b --noEmit",
     "prebuild": "node scripts/generate-og-cards.mjs && node scripts/generate-sitemap.mjs",
     "build": "npm run typecheck && vite-react-ssg build",
     "postbuild": "node scripts/inject-csp-hashes.mjs",
     "preview": "vite preview",
     "lint": "eslint .",
     "test": "vitest run",
-    "check:launch": "CHECK_LAUNCH=1 vitest run scripts/check-launch-content.test.ts && npm run check:no-forms",
+    "check:launch": "CHECK_LAUNCH=1 vitest run scripts/check-launch-content.test.ts && npm run check:no-forms && npm run check:no-em-dash",
     "check:no-forms": "bash scripts/check-no-forms.sh",
+    "check:no-em-dash": "node scripts/check-no-em-dash.mjs",
     "format": "prettier --write \"**/*.{ts,tsx,json,md,css}\""
   },
```

Matches the existing `check:launch` → `check:no-forms` composition pattern exactly: `check:no-em-dash`
is both independently runnable and chained into `check:launch`, same as `check:no-forms` already is.

**Companion unit test — `scripts/check-no-em-dash.test.ts`** (same `scripts/**`-exclusion pattern as
`generate-sitemap.test.ts`/`check-no-forms.test.ts`; run via `CHECK_LAUNCH=1 npx vitest run
scripts/check-no-em-dash.test.ts`, not part of the `check:launch` chain itself — a dev-only
regression suite for the guard's own logic, exercising `scanTsxSource`/`scanSiteConfigSource`/
`findMatches` directly against fixture strings, no real filesystem I/O):

- `findMatches` returns all three pattern names for a string containing all three forms; returns `[]`
  for a clean string; returns `[]` for a string containing only an en dash.
- `scanTsxSource` flags a `JsxText` node containing `&mdash;` between two tags; flags a
  `description="..."` attribute string literal containing a literal `—`; flags a `title={"..."}`
  JSX-expression string containing `&#8212;`; does **not** flag a `className="a—b"` attribute (not on
  `COPY_ATTRS`); does **not** flag a `// comment — with a dash` anywhere in the fixture source (proves
  the AST-only approach — a naive regex-based reimplementation of this test would fail here).
- `scanSiteConfigSource` flags `DEFAULT_DESCRIPTION` when it contains a dash; does not flag some other
  unrelated exported constant in the same fixture file, even if that constant also contains a dash
  (pins the "only this one named export" scope decision, §4.5).

### 4.6 `.dev/website-revamp-r2/README.md` — designed contents

The orchestrator may write this file directly rather than delegating it; its contents are designed
here in full either way, so nothing from this round is lost the way round 1's own `README.md`
successfully aggregated everything from its eight PRDs. Structure, mirroring
`.dev/website-revamp/README.md`'s proven shape:

1. **One-paragraph intro** — this is round 2, owner feedback dated 2026-09-01, source documents
   `SHARED-CONTEXT.md`/`REVISION-BRIEF.md`.
2. **Sub-project table** (six rows: R1–R6), columns Folder / Title / Scope / Depends on / Status —
   populated from each PRD's own header block, status set to whatever `dev-code`/`dev-review` has
   actually completed by the time the README is written (not pre-filled here, since this PRD is
   written before any round-2 implementation has happened).
3. **Dependency graph / phase ordering**, reproduced from SHARED-CONTEXT and each PRD's own
   `Depends on` line:
   - **Phase 1:** R1 (`01-shell-nav-chrome`) and R3 (`03-content-data`) in parallel — both depend on
     nothing this round, disjoint files.
   - **Phase 2:** R2 (`02-landing-sections`) and R4 (`04-component-polish`) in parallel — R4 depends
     on R1's `BackButton` `to` prop; R2 has no hard code dependency on R1, only a convention
     cross-note (R1's `PageContainer` width convention, R2 PRD §9).
   - **Phase 3:** R5 (`05-legal-pages`) — depends on R1's `PageContainer`.
   - **Phase 4 (last):** R6 (`06-voice-sweep-and-ship`) — depends on all five; sweeps whatever they
     leave behind and runs the ship sequence.
4. **This round's locked decisions**, reproduced verbatim from `SHARED-CONTEXT.md`'s own numbered
   list (items 1–8) — the same "don't re-derive, just point at the source" pattern round 1's README
   uses for `BRIEF.md`.
5. **Status as of the post-decision-round pass (2026-09-01): every item originally listed here is now
   `[RESOLVED]` or `[DEFERRED]` in its source PRD except the two genuinely owner-only reads.** This
   list is retained for provenance (what was open when this PRD was first drafted) but should not be
   read as the current gate state — see `.dev/website-revamp-r2/README.md`'s "locked decisions" and
   "requires the owner" sections for the authoritative, current picture:
   - R1 §9 item 5: back-only top padding (`pt-12 sm:pt-16`) is a taste call, adjustable post-launch.
     Still open in the trivial "not load-bearing" sense; not owner-blocking.
   - R2 §9: the Hero eyebrow-label change — **resolved, owner-decided (2026-09-01): keep "Health Tech
     Builder" exactly as it is today.** R2's proposed swap to "Software Engineer" is rejected and
     removed from R2's own PRD.
   - R2 §9: the one-line headline floor (640px, ~7.5% headroom) is computed from an estimated glyph
     width — **resolved as a verification task, not a design question**: implement exactly as
     designed, verify in a real browser during this PRD's own §7 gate (added as an explicit named
     check there).
   - R3 §9: the bullet-to-level split for the two new Microsoft work-experience entries — **resolved,
     owner-decided (2026-09-01): confirmed as proposed**, no changes to §4.1's markdown.
   - R3 §9: the exact day-of-month for the March 2024 level transition — **resolved, orchestrator
     decision: `2024-03-01`**, matching the collection's normalize-to-the-1st convention.
   - R4 §9 item 10: `ProjectLivePage.tsx`'s `backTo` one-line addition, handed to R1 — **resolved**:
     R1's PRD now carries this addition explicitly in its own §4.9/§9 item 6, in the same pass as R1's
     hosted-branch `BackButton` addition.
   - R4 §9 item 14: whether "all links open in a new tab" should extend to `Nav`/`Footer` — **resolved
     by this PRD, §9 below** (no, they stay same-tab) — R4's own PRD §9 item 14 now records the same
     answer in writing.
   - R5 §9 item 4: `src/lib/analytics.ts`'s ownership gap — **resolved, orchestrator decision: R5 owns
     `src/lib/analytics.ts` and `src/lib/analytics.test.ts` for this round**, added to R5's §3/§4
     owned-file list.
   - R5 §9 item 7: no lawyer review of either legal page — still deferred, genuinely owner-only; see
     §8 item 6 below (unchanged) and R5's own §8.
6. **Consolidated §8 owner actions across all six PRDs** — see §8 below, the authoritative version of
   this list; the README reproduces it rather than re-deriving it.

---

## 5. API Change Summary

N/A — static, prerendered site, no runtime API. `scripts/check-no-em-dash.mjs` and the
`firebase.template.json` rename are build-time/CI-adjacent tooling, not application code.

## 6. Frontend Change Summary

| File | Change |
|---|---|
| `index.html` | `<title>`/`<meta name="description">` rewritten, em dash removed (§4.4). |
| `src/config/site.ts` | `DEFAULT_DESCRIPTION` rewritten, em dash removed (§4.4). |
| `src/pages/NotFoundPage.tsx` | `RouteMeta description` rewritten, em dash removed (§4.4). |
| `src/content/projects/juno.md` | Frontmatter description + two body paragraphs rewritten, 3 em dashes removed (§4.4). |
| `src/content/projects/smarttest.md` | Frontmatter description + two body paragraphs rewritten, 3 em dashes removed (§4.4). |
| `src/content/projects/med-doc-tracker.md` | Frontmatter description rewritten, 1 em dash removed (§4.4). |
| `src/content/research/flood-event-extraction-bangladesh.md` | Frontmatter description rewritten, 2 em dashes removed (§4.4). |
| `scripts/check-no-em-dash.mjs` | **New.** The permanent guard (§4.5). |
| `scripts/check-no-em-dash.test.ts` | **New.** Unit tests for the guard's own logic (§4.5). |
| `package.json` | `check:launch` chain gains `&& npm run check:no-em-dash`; new `check:no-em-dash` script (§4.5). |
| `firebase.json` → `firebase.template.json` | Renamed; becomes the tracked source, `firebase.json` becomes build-generated (§4.3). |
| `vite.config.ts` | `liveRedirectsPlugin` reads `firebase.template.json` instead of `firebase.json` (§4.3). |
| `.gitignore` | `firebase.json` added to the existing generated-output block (§4.3). |
| `src/pages/PrivacyPage.tsx`, `src/pages/TermsPage.tsx` | `LAST_UPDATED` set to the real ship date, as the last step before opening the PR (§4.7, R5 PRD §9 item 5's hand-off). |

No file in this table is one R1–R5 already claims for substantive content — verified against every
sibling PRD's own file map before listing it here.

## 7. Testing

**The guard itself:** `scripts/check-no-em-dash.test.ts` (§4.5) — unit-level, run via
`CHECK_LAUNCH=1 npx vitest run scripts/check-no-em-dash.test.ts`, same convention as
`generate-sitemap.test.ts`/`check-no-forms.test.ts`.

**Full verification gate, run in this exact order, once R1–R5 have all landed:**

```bash
npm run format          # Prettier — must produce zero diff on a second run (idempotent)
npm run lint             # ESLint — zero errors, zero warnings
npm run typecheck        # tsc -b --noEmit — exit 0
npm test                 # vitest run — every test passes
npm run check:no-forms   # zero input-accepting markup under src/pages/live/
npm run check:launch     # content gate + check:no-forms + check:no-em-dash, chained — exit 0
npm run build            # prebuild (OG cards + sitemap) -> typecheck -> vite-react-ssg build -> postbuild (CSP hashes)
```

**What "green" means for each, stated explicitly (not just "it passed"):**

- `format`: re-running it a second time in a row produces no file changes (idempotent — proves the
  repo is actually formatted, not just that the command exited 0).
- `lint`: zero errors *and* zero warnings — this project's ESLint config has none configured as
  warning-only that are acceptable to leave unresolved.
- `typecheck`: exit 0 with no output beyond the script's own header (matches round 1's own recorded
  baseline, `review-2026-08-31-1000.md`).
- `test`: every test file collected, zero failures, zero skipped. The real count will differ from
  round 1's recorded 40 files / 199 tests (R1–R5 each add and remove test files) — record the actual
  new count in the run's own commit/PR description rather than asserting a specific number here,
  since this PRD is written before those changes land.
- `check:no-forms`: exit 0, "no input-accepting markup under src/pages/live/" — expected to pass
  trivially post-R3 (that directory holds only `registry.ts` and its test after the `sample-project`
  deletion).
- `check:launch`: **must be green.** This is the one gate explicitly red today on purpose
  (`sample-project.md`'s `demo: true`) — R3's deletion is what flips it, confirmed by R3 PRD §4.3's
  own traced-through analysis ("0 `demo: true`, 0 `draftDate: true`" post-deletion) and by this PRD's
  own new `check:no-em-dash` sub-step passing against the rewrites in §4.4.
- `build`: succeeds with no thrown error from any of the four chained scripts (`generate-og-cards.mjs`,
  `generate-sitemap.mjs`, `tsc -b --noEmit`, `vite-react-ssg build`, `inject-csp-hashes.mjs`); produces
  a `dist/` directory to audit next.

**`dist/`-level audit — this round's owner-visible claims, checked against the real build output:**

```bash
# 1. No em dashes anywhere in rendered HTML (the raw character is the only
#    form that can appear here — React resolves &mdash;/&#8212; JSX-text
#    entities into the literal glyph at render time, confirmed by reading
#    every relevant component; checked for both forms anyway, defensively).
! grep -rlP '—|&mdash;|&#8212;' dist --include='*.html'

# 2. sample-project, fabric-maps-mcp-server, and azure-maps-ai-assistant are
#    fully gone from the build output.
! grep -rl 'sample-project\|fabric-maps-mcp-server\|azure-maps-ai-assistant' dist
test ! -e dist/projects/sample-project
test ! -e dist/projects/fabric-maps-mcp-server
test ! -e dist/projects/azure-maps-ai-assistant

# 3. Prerendered page count matches R3 PRD §4.3's computed post-deletion total.
[ "$(find dist -name index.html | wc -l)" -eq 25 ]

# 4. sitemap.xml <loc> count matches R3's computed total; neither deleted
#    project appears in it.
[ "$(grep -c '<loc>' public/sitemap.xml)" -eq 19 ]
! grep -l 'sample-project\|fabric-maps-mcp-server\|azure-maps-ai-assistant' public/sitemap.xml

# 5. OG-card PNG count matches R3's computed total; neither deleted project
#    has a leftover PNG under dist/og/.
[ "$(find dist/og -name '*.png' | wc -l)" -eq 14 ]
test ! -e dist/og/projects/sample-project.png
test ! -e dist/og/projects/fabric-maps-mcp-server.png
test ! -e dist/og/projects/azure-maps-ai-assistant.png

# 6. firebase.json's freshly-generated CSP hashes actually match the built
#    HTML — a spot check against inject-csp-hashes.mjs's own algorithm
#    (sha256, base64 digest of each inline <script>'s literal body).
node -e "
  const { readFileSync, readdirSync, statSync } = require('node:fs');
  const { createHash } = require('node:crypto');
  const path = require('node:path');
  function walk(d) { let out = []; for (const e of readdirSync(d)) { const f = path.join(d, e); if (statSync(f).isDirectory()) out.push(...walk(f)); else if (e.endsWith('.html')) out.push(f); } return out; }
  const cfg = JSON.parse(readFileSync('firebase.json', 'utf-8'));
  const csp = cfg.hosting.headers.find(h => h.source === '**').headers.find(h => h.key === 'Content-Security-Policy').value;
  const hashesInCsp = new Set((csp.match(/'sha256-[^']+'/g) || []));
  const hashesInBuild = new Set();
  for (const f of walk('dist')) {
    const html = readFileSync(f, 'utf-8');
    for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (/\bsrc\s*=/.test(m[1]) || m[2].trim() === '') continue;
      hashesInBuild.add(\`'sha256-\${createHash('sha256').update(m[2], 'utf-8').digest('base64')}'\`);
    }
  }
  const missing = [...hashesInBuild].filter(h => !hashesInCsp.has(h));
  if (missing.length) { console.error('CSP mismatch:', missing); process.exit(1); }
  console.log('CSP hashes match built HTML.');
"
```

Every count above (25 pages, 19 sitemap entries, 14 OG PNGs) is R3 PRD §4.3's own computed "after this
round" total — reused here rather than re-derived, since R3 already traced it exactly against the
real corpus. If R3's implementation ends up with different real numbers (e.g., a content date changes
the featured-list backfill order but not the *count*), update these three literals to match the
actual post-implementation `dist/`, don't treat a mismatch as automatically this PRD's bug.

**Manual QA, once implemented:** open a handful of rewritten pages (`/`, a project detail page for
one of `juno`/`smarttest`/`med-doc-tracker`, `/research/flood-event-extraction-bangladesh`, `/404`)
and read the actual rendered text once, human eyes, not just grep — confirms the rewrites in §4.4
read naturally in context, not just that the dash is gone.

**Manual QA — R2's 640px one-line-headline floor (orchestrator decision, R2 PRD §9): implement exactly
as designed, verify here, not redesigned.** Open `/` in a real browser (or devtools' responsive mode)
at exactly 640px viewport width and confirm both landing headlines (Hero and the "Where I've worked
and what I've built." work-experience heading, per R2 PRD §4) render on one line, not wrapped. R2's
`clamp()` floor is computed from an *estimated* glyph width, not measured in a real renderer — this is
the first real-browser check of that estimate. If either headline wraps at 640px, the fix is a small
adjustment to R2's `clamp()` floor value, not a redesign — apply it here as part of this PRD's own
sweep rather than kicking it back to R2.

## 8. Manual Intervention Required From You

Consolidated across all six round-2 PRDs (per §4.6's README design), with this PRD's own items listed
first since they're the ones this document adds:

1. **Read and approve every rewritten copy block in this PRD** (§4.4: `index.html`, `site.ts`,
   `NotFoundPage.tsx`, and the four content-file rewrites) — same standard R2's PRD applied to its
   own copy: this is about your site, it should not ship on an agent's say-so alone.
2. **Confirm the `firebase.json` → `firebase.template.json` resolution (§4.3)** before it's
   implemented — this changes what `git status`/`git diff` show after every future build and changes
   the failure mode of a hand-run `firebase deploy` without a fresh build (from "silently stale" to
   "fails loudly, missing file"). Flagged as a real behavior change to a workflow you may already have
   muscle memory for.
3. **Open the preview-channel deploy and the PR to `main` yourself, or authorize an agent to run the
   exact commands in §4.7** — this PRD designs but does not execute either step.
4. **Do NOT merge the PR to `main` without reading this section again first.** Per
   `08-ci-deploy-pipeline/PRD.md` §4.4: once SP08's merge workflow exists (it does, confirmed —
   `.github/workflows/firebase-hosting-merge.yml` is present on this branch), a push to `main` *is*
   the production cutover — there is no separate "deploy" button, and it overwrites whatever
   `tejitpabari.com` currently serves. This is explicitly your call, not this PRD's or any agent's.
5. **Confirm the real `LAST_UPDATED` date on `/privacy` and `/terms` before the PR opens** (§4.7) —
   R5's placeholder (`'2026-08-30'`) needs to become the actual date you're shipping this round, not
   an agent-guessed one.
6. **The one item still genuinely carried from R1–R5's own §8 sections** (R2's eyebrow-label question
   and R3's bullet-to-level split are now resolved — owner decisions recorded 2026-09-01, see each
   PRD's own §8/§9; the 640px headline check is now this PRD's own §7 verification item, not an owner
   action): **R5's full read-through of both legal pages**, including the narrowed "no sale or sharing
   of data" claim, a substantive correction that ships as drafted but still needs your (or a lawyer's)
   specific read-and-approve before the merge-to-`main` cutover.
7. **Nothing else in this sub-project is owner-blocked.** The em-dash inventory, every rewrite, the
   guard, and the `firebase.json` resolution are all specified precisely enough for an implementer to
   proceed without further input, contingent on items 1–2 above.

### 4.7 Preview deploy + PR — designed steps, not executed

**Step 1 — preview-channel deploy**, for a real-domain-adjacent look at this round's changes before
opening the PR:

```bash
firebase hosting:channel:deploy website-revamp-r2 --project tejitpabari-99 --expires 7d
```

The two "Unable to add channel domain to Firebase Auth" / "Unable to sync Firebase Auth state"
warnings this command prints are **benign and expected** — Firebase Authentication isn't enabled on
this project, so there's no authorized-domain list to sync (SHARED-CONTEXT "Verified environment
facts"). Not a failure, not worth investigating further.

**Step 2 — set `LAST_UPDATED`** on both `src/pages/PrivacyPage.tsx` and `src/pages/TermsPage.tsx`
(R5 PRD §9 item 5's hand-off, §4.6/§8 above) to the actual date this step is run, replacing R5's
`'2026-08-30'` placeholder — a one-line-times-two edit, committed alongside R6's own changes.

**Step 3 — open the PR:**

```bash
gh pr create --repo tejitpabari99/tejitpabari --base main --head website-revamp \
  --title "Round 2: navigation, copy, and content cleanup ahead of launch" \
  --body "$(cat <<'EOF'
## Summary

This PR carries round 2 of the tejitpabari.com rewrite: owner-reported fixes to navigation, layout,
copy, and content, plus the pre-launch content cleanup and finishing sweep. It also serves as the
validation PR that exercises the PR-preview CI workflow (`.github/workflows/firebase-hosting-pull-request.yml`)
end to end — the same step `08-ci-deploy-pipeline/PRD.md` Task 7 left outstanding after round 1.

- **R1 — Shell, nav & chrome:** sticky footer on short pages; `Home` added to the navbar; the navbar
  hides on `/projects`, `/projects/:slug`, and `/projects/:slug/live` in favor of a Back-only header;
  one shared page-container convention (width, padding, chrome-aware top gutter) across all six
  sub-pages; `RESUME_URL` updated.
- **R2 — Landing sections:** `About`/`Work Experience` now share the same content width as
  `Projects`/`Contact`; the two landing headlines render on one line from 640px viewport width up;
  the Hero/About/Contact copy rewritten (drops the Juno-first opening, removes every AI-essay tic and
  hiring statement).
- **R3 — Content data:** work experience rebuilt into three real, dated entries from the actual
  resume (two Microsoft levels split out, Jio unchanged); `fabric-maps-mcp-server` and
  `azure-maps-ai-assistant` folded into a Microsoft work-experience bullet and deleted as standalone
  projects; the `sample-project` demo fully removed (content, hosted page, test, registry entry).
- **R4 — Component polish:** project/research status renders as a colored box, not an
  undifferentiated pill; markdown body spacing/sizing fixed relative to the page's own type scale;
  GFM task lists render one checkbox, not a checkbox plus a bullet; "Open Live" and internal markdown
  links open in a new tab; the Connect panel's aside is profile-only.
- **R5 — Legal pages:** `/privacy` and `/terms` clear the navbar correctly; "Clear my choice" is
  gated on there actually being something to clear, shows a real confirmation, and now actually stops
  Google Analytics and removes its cookies (a real bug fix, not just copy); both pages rewritten in a
  plainer, more professional register.
- **R6 — Voice sweep & ship:** every remaining em dash removed from user-visible copy (content
  bodies/descriptions, `RouteMeta`/`site.ts` defaults, `index.html`), a permanent automated guard
  wired into `npm run check:launch` so they can't come back, and the `firebase.json` build-dirty
  problem resolved (a tracked `firebase.template.json`, `firebase.json` now build-generated and
  gitignored).

## What to review

- **Read every rewritten copy block** — Hero/About/Contact (R2), both legal pages in full (R5), and
  the content-file rewrites (R6, §4.4 of its own PRD) — none of this should ship on an agent's
  say-so alone.
- **Open the preview channel URL this PR's CI run posts as a comment** and click through: the navbar
  behavior on `/projects` vs. everywhere else, the landing section widths, a project detail page's
  markdown rendering, `/privacy`'s "Clear my choice" flow, and `/404`'s sticky footer.
- **`View Source`** (not DevTools) on a project detail page to confirm the prerendered `<head>` (title,
  description, og:image) is correct in the raw HTTP response.

## What is still open

- R5: the narrowed "no sale or sharing of data" claim on `/privacy` is a substantive correction, not
  just a voice change — flagged for your (or a lawyer's) specific re-check before this ships.
- Everything else this round previously flagged for confirmation (the Hero eyebrow label, the
  Microsoft bullet-to-level split) is now decided — see `.dev/website-revamp-r2/README.md`'s locked
  decisions for the full record.

## Not in this PR

Merging this branch into `main`. That is the production cutover (no separate deploy step exists once
this merges) and is explicitly your call, not something this PR or any agent decides.

🤖 Generated as part of the tejitpabari.com round-2 revision. See `.dev/website-revamp-r2/` for every
sub-project's full design.
EOF
)"
```

**Explicitly not designed here:** the merge of this PR into `main`. See §8 item 4.

---

## 9. Open Questions & Decisions

1. **`[RESOLVED: em-dash guard is AST-based (TypeScript compiler API), not regex]`** — a blanket
   grep returns 181 hits in `.tsx`/`.ts` alone, almost all legitimate code comments; AST traversal
   never includes comments as walkable nodes, so it's precise by construction. See §4.5.
2. **`[RESOLVED: en dashes are out of scope for the guard]`** — the owner's complaint was specifically
   "long dashes"; the only 3 real en-dash occurrences in the repo are a correct, unrelated numeric-range
   convention in a dev-facing error message. See §4.1.
3. **`[RESOLVED: the existing &rsquo;/&ldquo;/&rdquo; entity-encoding convention is untouched]`** — an
   unrelated ESLint-driven punctuation-encoding rule, not the em-dash content the owner flagged. See
   §4.1.
4. **`[RESOLVED: firebase.json build-dirty problem, option (b) — a tracked firebase.template.json,
   firebase.json becomes build-generated and gitignored]`** — matches an existing `.gitignore`
   convention for exactly this class of artifact (`public/og/`, `public/sitemap.xml`,
   `public/robots.txt`); converts a hand-run `firebase deploy` without a fresh build from a silent
   stale-deploy risk into a loud missing-file failure. See §4.3. The currently-uncommitted diff is
   discarded (`git checkout -- firebase.json`) before the rename, not carried forward.
5. **`[RESOLVED, correcting this PRD's own original task brief now that R5 has landed:
   ConsentBanner.tsx's one em dash is R5's fix, not R6's]`** — R5's PRD (`05-legal-pages/PRD.md`
   §4.4) fixes this exact line directly, in R5's own owned file, reasoning explicitly that "leaving a
   known violation in an owned file for R6's later sweep to catch is strictly worse than fixing it
   now." This PRD's original task brief listed `ConsentBanner` among R6's targets because it was
   written before R5's own PRD existed; §4.1's inventory table reflects the corrected, current state
   rather than silently re-doing R5's fix or leaving a stale instruction unaddressed.
6. **`[RESOLVED — cross-project, answering R4 PRD §9 item 14]`** R4 left open whether "all links open
   in a new tab" (brief #18) should extend to `Nav`/`Footer`'s internal links, flagging it for R1 or
   R6 to weigh in on. **Resolved: no, they stay same-tab.** Same reasoning R4 already applied to
   `ProjectCard`'s own grid-navigation link (R4 PRD §4.6): `Nav`'s five links and `Footer`'s internal
   links are primary site chrome/navigation, not content or CTA links in the sense the owner's
   feedback item groups this under ("Components / detail pages," listed alongside the concrete "Open
   Live" example) — a portfolio's own header/footer spawning a new tab for every internal navigation
   click is a genuinely bad, non-standard pattern, and nobody expects it. `Footer`'s one *external*
   link (the résumé, if hosted off-domain, and the techfolio attribution link) is already
   `target="_blank"` today and stays that way — this only concerns `Footer`'s/`Nav`'s internal,
   same-site links, which stay same-tab.
7. **`[RESOLVED]`** The index.html title rewrite (§4.4) keeps "Health-Tech Builder" (dash fixed,
   wording unchanged). R2 PRD §9's Hero-eyebrow-label question is now resolved — owner decision
   (2026-09-01): keep "Health Tech Builder" exactly as it is today, the proposed swap to "Software
   Engineer" is rejected. `index.html`'s title and the Hero eyebrow therefore already agree; no
   revisit needed.
8. **`[DEFERRED]`** No disagreement found with any R1–R5 architecture decision after reading all five
   PRDs in full — the one place this PRD's own original task brief was stale (item 5 above) is a
   timing correction, not a disagreement with R5's design.
9. **`[RESOLVED: the four rewritten content files (juno.md, smarttest.md, med-doc-tracker.md,
   flood-event-extraction-bangladesh.md) needed only their em dash fixed, not a broader rewrite]`** —
   every other sentence in all four was read directly and carries no AI-essay tic; §4.2 states this
   conclusion explicitly rather than leaving it implicit in "the diff only touches the dash."
