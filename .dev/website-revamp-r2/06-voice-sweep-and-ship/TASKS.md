# Tasks: Voice Sweep & Ship

Source of truth: `/root/projects/tejitpabari/.dev/website-revamp-r2/06-voice-sweep-and-ship/PRD.md`. Every task below cites the PRD §4 subsection it implements. This is the terminal, **Phase 4** sub-project (per `../README.md`) — it runs only after R1 (`01-shell-nav-chrome`), R2 (`02-landing-sections`), R3 (`03-content-data`), R4 (`04-component-polish`), and R5 (`05-legal-pages`) have all landed on `website-revamp`. Every task below is written against the tree those five leave behind, **not against today's tree**.

**Confirmed directly, not assumed: as of this task-generation pass, none of R1–R5 has landed yet.** `git status --porcelain` on `website-revamp` shows a clean tree except the untracked `.dev/website-revamp-r2/` folder; `src/layout/PageContainer.tsx`, `src/layout/chromeMode.ts`, `src/components/StatusBadge.tsx` do not exist yet; `src/content/work-experience/` still holds the single combined `microsoft-fabric-maps.md` file, not the two-file split; `firebase.json` is currently git-clean (not the `M firebase.json` PRD §4.3 describes from "a prior local build" — that local build artifact is not present in this checkout, though the resolution in Task 11 below is written to be safe either way). Where a "before" block below quotes a file R1–R5 will change before R6 runs, it is quoted from that sibling sub-project's own `TASKS.md` "after" block (cited by file/task number) — every such citation is to a real, already-written sibling `TASKS.md`. **`05-legal-pages/TASKS.md` did not exist at the time this file was first generated; it has since been written (8 tasks) and reconciled against this file (orchestrator pass, 2026-09-01).** The two places this file depends on R5's specific output are now cited directly from `05-legal-pages/TASKS.md`'s own task numbers, re-confirmed against R5's real task file rather than the PRD line numbers originally cited: the `ConsentBanner.tsx` em-dash fix is R5's Task 1 (see the baseline table below), and the `LAST_UPDATED` line/file is set by R5's Tasks 7 and 8 (see Task 13 below).

**Test/build count caveat, stated once here rather than per task (PRD §7):** R3's `TASKS.md` Task 5 computes the post-R3 baseline as 39 test files / 196 tests, 25 prerendered pages, 19 sitemap entries, 14 OG PNGs. R1/R2/R4/R5 each add test files of their own on top of that baseline (R1 adds `chromeMode.test.ts`, `PageShell.test.tsx`, `BackButton.test.tsx`, plus new cases in existing files; R2 adds a `WorkExperienceSection.test.ts` `describe` block; R4 adds `StatusBadge.test.tsx`, `ContentBody.test.tsx`, `markdownComponents.test.tsx`, plus new cases in `LinksRow.test.tsx`/`LiveRedirectFallback.test.tsx`; R5's own file count is unknown pending its `TASKS.md`). **No task below asserts a specific final `npm test` file/test count** — Task 14's acceptance criterion is "every test passes, zero failures, zero skipped," with the actual count recorded in that task's own commit message, exactly as PRD §7 instructs. The `dist/`/sitemap/OG counts (25/19/14) **are** asserted as fixed numbers in Task 15, because R3's own `TASKS.md` Task 5 already computed and verified them as this round's real final totals — nothing after R3 changes route count, sitemap entries, or OG cards.

**Ordering rationale:** Tasks 1–8 (em-dash inventory + rewrites) touch disjoint files from Tasks 9–13 (guard, `firebase.json`, `LAST_UPDATED`) and could run in either order; they're sequenced content-first so the guard (Task 9) can be dropped in against an already-clean tree and pass immediately, proving it, rather than being added first and immediately failing its own checks. Tasks 14–17 (gate, audit, manual QA) must run after every prior task. Tasks 18–19 (ship steps) are last by construction.

**Test command note:** `npm test` runs `vitest run` (the full suite, `scripts/**` excluded per `vite.config.ts`). `npm run check:launch` sets `CHECK_LAUNCH=1` to lift that exclusion for one named file. A single file can be run directly, e.g. `npx vitest run src/config/site.test.ts`.

---

### Task 1 — Recompute the em-dash inventory against the post-R1–R5 tree
   - Files: none — this is a discovery/verification task; its output is a delta record written into this task's own commit message (or, if no code changes result, left as a note in the PR description Task 19 opens), not a code change.
   - Changes: Per PRD §4.1's explicit instruction that its own inventory (run before any of R1–R5's code existed) is a **baseline to re-verify, not a fact to trust**. Once R1–R5 have actually landed, run the six commands below verbatim against the real tree and compare every result to the "Baseline (PRD §4.1)" table beneath them. This task's job is to produce an honest, file-by-file account of what actually still needs fixing — not to skip straight to Tasks 2–8 on the PRD's say-so.

     **Commands, run verbatim (identical to PRD §4.1):**
     ```bash
     # 1. Literal em dash in .tsx/.ts, excluding lines that are entirely a // comment
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

     **Baseline (PRD §4.1) — every file the PRD expects to still show a hit at this point, and what R6 is expected to do about each:**

     | File | Expected hits | Expected disposition |
     |---|---:|---|
     | `index.html` | 2 (title + description) | R6 fixes — Task 2 |
     | `src/config/site.ts` (`DEFAULT_DESCRIPTION`) | 1 | R6 fixes — Task 3 |
     | `src/pages/NotFoundPage.tsx` (`RouteMeta description`) | 1 | R6 fixes — Task 4 |
     | `src/content/projects/juno.md` | 3 | R6 fixes — Task 5 |
     | `src/content/projects/smarttest.md` | 3 | R6 fixes — Task 6 |
     | `src/content/projects/med-doc-tracker.md` | 1 | R6 fixes — Task 7 |
     | `src/content/research/flood-event-extraction-bangladesh.md` | 2 | R6 fixes — Task 8 |
     | `src/pages/PrivacyPage.tsx`, `src/pages/TermsPage.tsx` | 0 (was 26 + 13 pre-R5) | Already fixed by R5 (`05-legal-pages/TASKS.md` Tasks 7 and 8, the full copy rewrites) — confirm zero, no R6 action |
     | `src/components/ConsentBanner.tsx` | 0 (was 1 pre-R5) | Already fixed by R5 (`05-legal-pages/TASKS.md` Task 1) — confirm zero, no R6 action |
     | `src/sections/ContactSection.tsx`, `Hero.tsx`, `AboutSection.tsx` | 0 (was 5 `&mdash;` pre-R2) | Already fixed by R2 — confirm zero, no R6 action |
     | `src/content/projects/sample-project.md` | gone entirely | Deleted by R3 — confirm the file no longer exists |
     | Every other `.tsx`/`.ts` hit from command 1 | 0 real (non-comment) hits | Code comments / test fixtures / build-time errors only — no action, per PRD §4.1's own file-by-file triage |
     | `scripts/` (command 6) | 0 real hits | `PROVENANCE.md` and code comments only — no action |

     **What "the delta is explained" means as this task's acceptance bar:** every row above is individually confirmed (either "matches — proceeding to the cited task" or "diverges — see note"), and any *new* file appearing in the six commands' output that is **not** in the baseline table is investigated by hand before this task is considered done: read the hit in context, determine whether it's a real user-visible em dash (in which case add a Task 2–8-style fix for it, using the same never-a-comma-swap rewrite policy from PRD §4.4) or a false positive (comment, test fixture, build-time-only string — document why). A baseline row that comes back **non-zero when the table says a sibling round already fixed it** is the specific failure mode PRD §4.1's own framing calls out ("a file that unexpectedly still has an em dash means a sibling sub-project missed one") — fix it here (R6 is the last gate before ship), and note in the commit message which sibling PRD's promise it violates, so that gap can be reported back independently of this task.
   - Acceptance criteria:
     1. All six commands' real output is recorded (pasted into the task's commit message or a scratch note).
     2. Every row of the baseline table above is marked confirmed-matching or flagged-and-resolved; no baseline row is left unaccounted for.
     3. No em-dash hit appears anywhere in the six commands' real output that isn't traceable to one of: (a) a baseline row marked "R6 fixes," about to be handled by Tasks 2–8; (b) a code comment, test fixture, or build-time-only string, explicitly triaged as a false positive; (c) a newly-discovered real hit, for which a fix has been added to the relevant task (or a new task, if it's in a file no other task already touches).
     4. `src/content/projects/sample-project.md` does not exist (confirms R3 landed before this task ran).


     **Completion note:** Done. No commit (discovery-only task, no code changes of its own).
     Re-ran all six baseline commands against the real post-R1-R5 tree: every row matched the PRD
     §4.1 baseline exactly (index.html/site.ts/NotFoundPage.tsx/juno.md already show their expected
     R6-owned hits at this point; PrivacyPage/TermsPage/ConsentBanner/Hero/AboutSection/ContactSection
     confirmed at 0; sample-project.md confirmed deleted). No new file appeared in any command's
     output. Delta: none — nothing diverged from baseline.
---

### Task 2 — `index.html`: em-dash rewrite
   - Files: `index.html`
   - Changes: Per PRD §4.4. Two hits, both in `<head>` — the `<title>` and the `<meta name="description">`. The title's dash is a name/role appositive, replaced with a colon; the description's dash was standing in for a missing verb, replaced by adding "is a" and dropping the dash entirely (a full sentence needs a verb, not a substitute for one). The eyebrow-label wording ("Health Tech Builder"/"Health-Tech Builder") is otherwise unchanged — R2 PRD §9's Hero-eyebrow question is resolved (owner decision 2026-09-01: keep "Health Tech Builder" as-is); this title already matches, no further wording revisit.

     Before (current file, `<head>` only — confirmed unchanged by any R1–R5 sibling, none of which lists `index.html` in its file map):
     ```html
     <title>Tejit Pabari — Health-Tech Builder</title>
     <meta
       name="description"
       content="Tejit Pabari — software engineer and founder building health-tech products, including Juno, an AI companion for medical appointments."
     />
     ```

     After:
     ```html
     <title>Tejit Pabari: Health-Tech Builder</title>
     <meta
       name="description"
       content="Tejit Pabari is a software engineer and founder building health-tech products, including Juno, an AI companion for medical appointments."
     />
     ```
   - Acceptance criteria:
     1. `grep -c "Tejit Pabari: Health-Tech Builder" index.html` → `1`.
     2. `grep -c "Tejit Pabari is a software engineer and founder" index.html` → `1`.
     3. `grep -P '—|&mdash;|&#8212;' index.html` → no match, exit code 1.
     4. `npm test` passes (no test file asserts on `index.html`'s literal title/description text).


     **Completion note:** Done. Commit `a4c6a24` (landed before this run started).
---

### Task 3 — `src/config/site.ts`: `DEFAULT_DESCRIPTION` em-dash rewrite
   - Files: `src/config/site.ts`
   - Changes: Per PRD §4.4. Period split — two short declarative sentences, matching the deliberately short-sentence register R2's `AboutSection` rewrite uses ("It's early." / "I'm still validating the idea with patients and clinicians."). Not owned by any R1–R5 sub-project (`DEFAULT_DESCRIPTION` is untouched content, only referenced at render time via `RouteMeta`).

     Before (current file — confirmed unchanged by R1–R5, none of which lists `src/config/site.ts` in its file map):
     ```ts
     export const DEFAULT_DESCRIPTION =
       'Health-tech builder and software engineer — building Juno, an AI companion ' +
       'for medical appointments, while working full-time on Microsoft Fabric Maps.';
     ```

     After:
     ```ts
     export const DEFAULT_DESCRIPTION =
       'Health-tech builder and software engineer. Building Juno, an AI companion ' +
       'for medical appointments, while working full-time on Microsoft Fabric Maps.';
     ```
   - Acceptance criteria:
     1. `grep -c "software engineer\. Building Juno" src/config/site.ts` → `1`.
     2. `grep -P '—|&mdash;|&#8212;' src/config/site.ts` → no match, exit code 1.
     3. `npm run typecheck` passes.
     4. `npx vitest run src/config/site.test.ts` passes unmodified (no assertion on `DEFAULT_DESCRIPTION`'s literal text, per PRD §7).
     5. `npm test` passes in full.


     **Completion note:** Done. Commit `4197fba` (landed before this run started).
---

### Task 4 — `src/pages/NotFoundPage.tsx`: `RouteMeta description` em-dash rewrite
   - Files: `src/pages/NotFoundPage.tsx`
   - Changes: Per PRD §4.4. One hit, a `description="..."` attribute string on `RouteMeta`. Simple period split — the dash was joining two complete, unrelated instructions. **This task lands after R1's own `Task 20`** (`01-shell-nav-chrome/TASKS.md`), which wraps this same page in `PageContainer` — only the `description` string changes here; the container/import lines R1 already landed are untouched.

     Before (post-R1 state — R1 `TASKS.md` Task 20's own "after" block, `RouteMeta` call only):
     ```tsx
     <RouteMeta
       title="Page Not Found"
       description="That page doesn't exist — head back to the homepage."
       path={location.pathname}
     />
     ```

     After:
     ```tsx
     <RouteMeta
       title="Page Not Found"
       description="That page doesn't exist. Head back to the homepage."
       path={location.pathname}
     />
     ```
   - Acceptance criteria:
     1. `grep -c "That page doesn't exist\. Head back to the homepage\." src/pages/NotFoundPage.tsx` → `1`.
     2. `grep -P '—|&mdash;|&#8212;' src/pages/NotFoundPage.tsx` → no match, exit code 1.
     3. `npm run typecheck` passes.
     4. `npm test` passes in full (no test asserts on this literal description string, per PRD §7).


     **Completion note:** Done. Commit `1841b62` (landed before this run started).
---

### Task 5 — `src/content/projects/juno.md`: em-dash rewrite
   - Files: `src/content/projects/juno.md`
   - Changes: Per PRD §4.4. Three em dashes, three different fixes in the same file (deliberately varied, not mechanically identical): the frontmatter `description` gets a colon (what follows is a list elaborating "AI companion"); body paragraph 1 gets a period (two independent clauses, "It" carries the subject forward); body paragraph 3 gets a colon ("the current focus is..." elaborates on "pre-launch"). No fact, number, or claim changes — verified by reading the unchanged and changed versions line by line (PRD §4.4's own fact-check). Not owned by any R1–R5 sub-project — untouched content per R3 PRD (R3 only deletes/rebuilds other files).

     Before (current file, in full):
     ```markdown
     ---
     slug: juno
     title: Juno
     description: >-
       An AI companion for medical appointments — live note-taking, real-time
       question prompts, and a clear summary of what to do next. Built with
       neurologists and researchers, and validated with 200+ patients and 30+
       doctors so far.
     image: https://images.unsplash.com/photo-1572177812156-58036aae439c
     tags: [Health Tech]
     status: Building
     liveUrl: https://app.meetjuno.health/
     links:
       - label: App
         href: https://app.meetjuno.health/
       - label: Website
         href: https://meetjuno.health/
     date: "2025-06-01"
     ---
     Juno helps patients get more out of every doctor's visit. During an appointment, it takes structured notes in real time and prompts context-aware questions a patient might not think to ask in the moment — then turns the conversation into a clear summary with concrete follow-ups, instead of a page of hurried handwriting.

     It's being built in collaboration with neurologists and researchers, with an early focus on complex, recurring conditions like MS, where patients see specialists repeatedly and small details compound over time. The team is in early conversations with the National MS Society and Columbia University about clinical validation and funding.

     So far: 200+ patients surveyed, 30+ doctors consulted, and 70 patients on the beta waitlist. Juno is still pre-launch — the current focus is validating the clinical workflow before scaling it.
     ```

     After:
     ```markdown
     ---
     slug: juno
     title: Juno
     description: >-
       An AI companion for medical appointments: live note-taking, real-time
       question prompts, and a clear summary of what to do next. Built with
       neurologists and researchers, and validated with 200+ patients and 30+
       doctors so far.
     image: https://images.unsplash.com/photo-1572177812156-58036aae439c
     tags: [Health Tech]
     status: Building
     liveUrl: https://app.meetjuno.health/
     links:
       - label: App
         href: https://app.meetjuno.health/
       - label: Website
         href: https://meetjuno.health/
     date: "2025-06-01"
     ---
     Juno helps patients get more out of every doctor's visit. During an appointment, it takes structured notes in real time and prompts context-aware questions a patient might not think to ask in the moment. It turns the conversation into a clear summary with concrete follow-ups, instead of a page of hurried handwriting.

     It's being built in collaboration with neurologists and researchers, with an early focus on complex, recurring conditions like MS, where patients see specialists repeatedly and small details compound over time. The team is in early conversations with the National MS Society and Columbia University about clinical validation and funding.

     So far: 200+ patients surveyed, 30+ doctors consulted, and 70 patients on the beta waitlist. Juno is still pre-launch: the current focus is validating the clinical workflow before scaling it.
     ```
   - Acceptance criteria:
     1. `grep -c "for medical appointments: live note-taking" src/content/projects/juno.md` → `1`.
     2. `grep -c "It turns the conversation into a clear summary" src/content/projects/juno.md` → `1`.
     3. `grep -c "Juno is still pre-launch: the current focus" src/content/projects/juno.md` → `1`.
     4. `grep -P '—|&mdash;|&#8212;' src/content/projects/juno.md` → no match, exit code 1 (was 3, now 0).
     5. Every field outside the `description`/body text (`slug`, `title`, `image`, `tags`, `status`, `liveUrl`, `links`, `date`) is byte-for-byte unchanged — `git diff src/content/projects/juno.md` touches only the three sentences above.
     6. `npm run typecheck` passes; `npm run build` succeeds (confirms `parseProject`/frontmatter still parses cleanly).
     7. `npm test` passes in full.


     **Completion note:** Done. Commit `52bcabc`. The file already carried this exact rewrite
     (uncommitted) at the start of this run; verified against PRD §4.4 word-for-word and committed
     as-is.
---

### Task 6 — `src/content/projects/smarttest.md`: em-dash rewrite
   - Files: `src/content/projects/smarttest.md`
   - Changes: Per PRD §4.4. Three em dashes: frontmatter `description` gets a period (deliberately *not* a colon, even though it's the same grammatical job — varied from the body paragraph's own colon a few lines later so two colon-introduced clauses don't read mechanically back to back in the same short file), restructured from a dangling participle into a real independent clause ("It walks users through..."); body paragraph 1 gets the same period fix; body paragraph 2 gets parentheses (a genuine, droppable aside about personal significance, not load-bearing to the sentence's main point).

     Before (current file, in full):
     ```markdown
     ---
     slug: smarttest
     title: "SMARTtest: HIV & Syphilis Self-Testing App"
     description: >-
       A smartphone app that makes HIV and syphilis self-testing more accessible —
       walking users through the test, helping interpret results, and linking them
       to follow-up care. Downloaded 1,000+ times.
     image: https://images.unsplash.com/photo-1572177812156-58036aae439c
     tags: [Health Tech]
     status: Completed
     links:
       - label: AIDS and Behaviour Paper
         href: https://doi.org/10.1007/s10461-019-02718-y
       - label: News Coverage
         href: "https://www.labiotech.eu/best-biotech/hiv-test-app-home/#:~:text=SMARTtest,and%20syphilis%20in%20the%20blood."
     date: "2019-01-01"
     ---
     SMARTtest is a smartphone app that makes HIV and syphilis self-testing more accessible — walking a user through the test itself, helping interpret the result, and linking them to follow-up care, all from a phone. Built with React Native and Firebase, with Twilio and SendGrid handling secure result-sharing, and deployed and tested through Expo.

     The app has been downloaded 1,000+ times and received national news coverage. The underlying research was published in the journal *AIDS and Behavior* — one of the earliest projects that pointed me toward health tech, years before Juno.
     ```

     After:
     ```markdown
     ---
     slug: smarttest
     title: "SMARTtest: HIV & Syphilis Self-Testing App"
     description: >-
       A smartphone app that makes HIV and syphilis self-testing more accessible.
       It walks users through the test, helps interpret results, and links them
       to follow-up care. Downloaded 1,000+ times.
     image: https://images.unsplash.com/photo-1572177812156-58036aae439c
     tags: [Health Tech]
     status: Completed
     links:
       - label: AIDS and Behaviour Paper
         href: https://doi.org/10.1007/s10461-019-02718-y
       - label: News Coverage
         href: "https://www.labiotech.eu/best-biotech/hiv-test-app-home/#:~:text=SMARTtest,and%20syphilis%20in%20the%20blood."
     date: "2019-01-01"
     ---
     SMARTtest is a smartphone app that makes HIV and syphilis self-testing more accessible. It walks a user through the test itself, helps interpret the result, and links them to follow-up care, all from a phone. Built with React Native and Firebase, with Twilio and SendGrid handling secure result-sharing, and deployed and tested through Expo.

     The app has been downloaded 1,000+ times and received national news coverage. The underlying research was published in the journal *AIDS and Behavior* (one of the earliest projects that pointed me toward health tech, years before Juno).
     ```
   - Acceptance criteria:
     1. `grep -c "more accessible\.$" src/content/projects/smarttest.md` → `1` (frontmatter description's period split, line ends the sentence).
     2. `grep -c "It walks users through the test, helps interpret results" src/content/projects/smarttest.md` → `1`.
     3. `grep -c "more accessible\. It walks a user through the test itself" src/content/projects/smarttest.md` → `1` (body paragraph 1).
     4. `grep -c "(one of the earliest projects that pointed me toward health tech, years before Juno)\." src/content/projects/smarttest.md` → `1` (body paragraph 2's parenthetical).
     5. `grep -P '—|&mdash;|&#8212;' src/content/projects/smarttest.md` → no match, exit code 1 (was 3, now 0).
     6. Every field outside `description`/body text is byte-for-byte unchanged.
     7. `npm run typecheck` passes; `npm run build` succeeds.
     8. `npm test` passes in full.


     **Completion note:** Done. Commit `afc05e6`.
---

### Task 7 — `src/content/projects/med-doc-tracker.md`: em-dash rewrite
   - Files: `src/content/projects/med-doc-tracker.md`
   - Changes: Per PRD §4.4. One em dash, in the frontmatter `description` only — this file's body is empty after frontmatter (confirmed by direct read; nothing else to rewrite). Period split — the second clause is a short, deliberate fragment describing purpose ("Built to..."), matching the fragment style used elsewhere in this round's rewrites.

     Before (current file, in full):
     ```markdown
     ---
     slug: med-doc-tracker
     title: Med-Doc Tracker
     description: >-
       A personal tool for storing, organizing, and searching all your medical
       documents in one place — built to make the fragmented world of medical
       records simpler to navigate.
     image: https://images.unsplash.com/photo-1572177812156-58036aae439c
     tags: [Health Tech]
     liveUrl: https://tejitpabari.short.gy/med-doc-tracker
     links:
       - label: Website
         href: https://tejitpabari.short.gy/med-doc-tracker
     date: "2024-06-01"
     ---
     ```

     After:
     ```markdown
     ---
     slug: med-doc-tracker
     title: Med-Doc Tracker
     description: >-
       A personal tool for storing, organizing, and searching all your medical
       documents in one place. Built to make the fragmented world of medical
       records simpler to navigate.
     image: https://images.unsplash.com/photo-1572177812156-58036aae439c
     tags: [Health Tech]
     liveUrl: https://tejitpabari.short.gy/med-doc-tracker
     links:
       - label: Website
         href: https://tejitpabari.short.gy/med-doc-tracker
     date: "2024-06-01"
     ---
     ```
   - Acceptance criteria:
     1. `grep -c "documents in one place\. Built to make the fragmented" src/content/projects/med-doc-tracker.md` → `1`.
     2. `grep -P '—|&mdash;|&#8212;' src/content/projects/med-doc-tracker.md` → no match, exit code 1 (was 1, now 0).
     3. Every field outside `description` is byte-for-byte unchanged; file still has no body content after frontmatter.
     4. `npm run typecheck` passes; `npm run build` succeeds.
     5. `npm test` passes in full.


     **Completion note:** Done. Commit `5b03322`.
---

### Task 8 — `src/content/research/flood-event-extraction-bangladesh.md`: em-dash rewrite
   - Files: `src/content/research/flood-event-extraction-bangladesh.md`
   - Changes: Per PRD §4.4. Two em dashes, both in the frontmatter `description`, forming one textbook double-em-dash aside — converts directly to a single parenthetical. This file's body is also empty after frontmatter (confirmed by direct read).

     Before (current file, in full):
     ```markdown
     ---
     slug: flood-event-extraction-bangladesh
     title: Flood Event Extraction from News Media (Bangladesh)
     description: >-
       Built a BERT-based classifier to extract flood events from 40,000+ tagged
       Bangladeshi news articles, then used the resulting time-series — validated
       against Sentinel satellite data — to help the Bangladesh government
       develop a flood-index insurance product. Presented at AGU; published as a
       pre-print.
     image: https://images.unsplash.com/photo-1572177812156-58036aae439c
     tags: [Machine Learning]
     status: Completed
     links:
       - label: Pre-print paper
         href: https://bit.ly/tejit-flood-research
       - label: AGU Abstract Presentation
         href: https://agu.confex.com/agu/fm20/meetingapp.cgi/Paper/766342
     date: "2020-12-01"
     ---
     ```

     After:
     ```markdown
     ---
     slug: flood-event-extraction-bangladesh
     title: Flood Event Extraction from News Media (Bangladesh)
     description: >-
       Built a BERT-based classifier to extract flood events from 40,000+ tagged
       Bangladeshi news articles, then used the resulting time-series (validated
       against Sentinel satellite data) to help the Bangladesh government
       develop a flood-index insurance product. Presented at AGU; published as a
       pre-print.
     image: https://images.unsplash.com/photo-1572177812156-58036aae439c
     tags: [Machine Learning]
     status: Completed
     links:
       - label: Pre-print paper
         href: https://bit.ly/tejit-flood-research
       - label: AGU Abstract Presentation
         href: https://agu.confex.com/agu/fm20/meetingapp.cgi/Paper/766342
     date: "2020-12-01"
     ---
     ```
   - Acceptance criteria:
     1. `grep -c "resulting time-series (validated" src/content/research/flood-event-extraction-bangladesh.md` → `1`.
     2. `grep -c "Sentinel satellite data) to help the Bangladesh government" src/content/research/flood-event-extraction-bangladesh.md` → `1`.
     3. `grep -P '—|&mdash;|&#8212;' src/content/research/flood-event-extraction-bangladesh.md` → no match, exit code 1 (was 2, now 0).
     4. Every field outside `description` is byte-for-byte unchanged; file still has no body content after frontmatter.
     5. `npm run typecheck` passes; `npm run build` succeeds.
     6. `npm test` passes in full.


     **Completion note:** Done. Commit `94e641f`. `check-no-em-dash.mjs` (Task 9) ran clean against
     this file on the first try, confirming the rewrite.
---

### Task 9 — `scripts/check-no-em-dash.mjs` (new) + `package.json` wiring
   - Files: `scripts/check-no-em-dash.mjs` (new), `package.json`
   - Changes: Per PRD §4.5. **Depends on Tasks 1–8 landing first** — every em dash the recomputed inventory found is already fixed, so this guard is expected to pass immediately the moment it's added, proving there's nothing left in scope rather than being added first and immediately red. AST-based (TypeScript compiler API), not regex — a blanket `grep -r "—" src` returns dozens of hits in code comments alone (Task 1's own command-1 output), and comments are lexer trivia, never part of the AST `ts.forEachChild` walks, so scoping to `JsxText` nodes and a curated attribute allowlist is precise by construction. Reproduced verbatim from PRD §4.5 — no design decision left open here.

     `scripts/check-no-em-dash.mjs` — new file, complete, byte-for-byte from PRD §4.5:
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

     `package.json` — `scripts` block, two changes: `check:launch`'s chain gains a third step, and a new `check:no-em-dash` script is added (inserted after `check:no-forms`, matching that entry's own position/style):

     Before (current file's `scripts` block, in full):
     ```json
     "scripts": {
       "dev": "vite-react-ssg dev",
       "typecheck": "tsc -b --noEmit",
       "prebuild": "node scripts/generate-og-cards.mjs && node scripts/generate-sitemap.mjs",
       "build": "npm run typecheck && vite-react-ssg build",
       "postbuild": "node scripts/inject-csp-hashes.mjs",
       "preview": "vite preview",
       "lint": "eslint .",
       "test": "vitest run",
       "check:launch": "CHECK_LAUNCH=1 vitest run scripts/check-launch-content.test.ts && npm run check:no-forms",
       "check:no-forms": "bash scripts/check-no-forms.sh",
       "format": "prettier --write \"**/*.{ts,tsx,json,md,css}\""
     },
     ```

     After:
     ```json
     "scripts": {
       "dev": "vite-react-ssg dev",
       "typecheck": "tsc -b --noEmit",
       "prebuild": "node scripts/generate-og-cards.mjs && node scripts/generate-sitemap.mjs",
       "build": "npm run typecheck && vite-react-ssg build",
       "postbuild": "node scripts/inject-csp-hashes.mjs",
       "preview": "vite preview",
       "lint": "eslint .",
       "test": "vitest run",
       "check:launch": "CHECK_LAUNCH=1 vitest run scripts/check-launch-content.test.ts && npm run check:no-forms && npm run check:no-em-dash",
       "check:no-forms": "bash scripts/check-no-forms.sh",
       "check:no-em-dash": "node scripts/check-no-em-dash.mjs",
       "format": "prettier --write \"**/*.{ts,tsx,json,md,css}\""
     },
     ```

     `typescript` is already a `devDependency` (`~6.0.2`, confirmed in `package.json`) — no new package installed.
   - Acceptance criteria:
     1. `scripts/check-no-em-dash.mjs` matches the block above byte-for-byte.
     2. `node scripts/check-no-em-dash.mjs` run directly exits `0` and prints `check-no-em-dash passed — no em dashes found in user-visible copy.` (proves Tasks 1–8 actually left the tree clean, in scope).
     3. `npm run check:no-em-dash` (the new script alias) also exits `0`.
     4. `grep -c "check:no-em-dash" package.json` → `2` (once as the new script's own key, once appended into `check:launch`'s chain).
     5. `npm run check:launch` exits `0` and its output includes `check-no-em-dash passed`.
     6. `npm run typecheck` passes (the `.mjs` file itself isn't type-checked, but confirms nothing else broke).
     7. `npm test` passes in full.


     **Completion note:** Done. Commit `2a8261e`. Guard ran clean on first execution against the
     tree left by Tasks 1-8 (exit 0), proving nothing remained in scope.
---

### Task 10 — `scripts/check-no-em-dash.test.ts` (new)
   - Files: `scripts/check-no-em-dash.test.ts` (new)
   - Changes: Per PRD §4.5's companion-test description (bullet list of required cases, not given as verbatim code in the PRD — written here to satisfy every bullet exactly). Same convention as `scripts/generate-sitemap.test.ts`/`scripts/check-no-forms.test.ts`: lives under `scripts/`, excluded from the default `npm test` run by `vite.config.ts`'s `test.exclude` (lifted only when `CHECK_LAUNCH=1`), run via `CHECK_LAUNCH=1 npx vitest run scripts/check-no-em-dash.test.ts`. Not part of the `check:launch` chain itself — a dev-only regression suite for the guard's own logic, exercising `findMatches`/`scanTsxSource`/`scanSiteConfigSource` directly against fixture strings, no real filesystem I/O. Depends on Task 9.

     ```ts
     // scripts/check-no-em-dash.test.ts
     import { describe, expect, it } from 'vitest';
     import { findMatches, scanTsxSource, scanSiteConfigSource } from './check-no-em-dash.mjs';

     describe('findMatches', () => {
       it('returns all three pattern names for a string containing all three forms', () => {
         const text = 'a — b &mdash; c &#8212; d';
         expect(findMatches(text)).toEqual(['em dash (—)', '&mdash; entity', '&#8212; entity']);
       });

       it('returns [] for a clean string', () => {
         expect(findMatches('nothing to see here')).toEqual([]);
       });

       it('returns [] for a string containing only an en dash (out of scope, PRD §4.1)', () => {
         expect(findMatches('the 2–3 line blurb')).toEqual([]);
       });
     });

     describe('scanTsxSource', () => {
       it('flags a JsxText node containing &mdash; between two tags', () => {
         const source = `
           export function X() {
             return <div>before &mdash; after</div>;
           }
         `;
         const found = scanTsxSource('X.tsx', source);
         expect(found.some((f) => f.text.includes('&mdash;'))).toBe(true);
       });

       it('flags a description="..." attribute string literal containing a literal em dash', () => {
         const source = `
           export function X() {
             return <RouteMeta description="A page — with a dash" path="/x" />;
           }
         `;
         const found = scanTsxSource('X.tsx', source);
         expect(found.some((f) => f.text.includes('—'))).toBe(true);
       });

       it('flags a title={"..."} JSX-expression string containing &#8212;', () => {
         const source = `
           export function X() {
             return <img title={"A &#8212; B"} />;
           }
         `;
         const found = scanTsxSource('X.tsx', source);
         expect(found.some((f) => f.text.includes('&#8212;'))).toBe(true);
       });

       it('does not flag a className="a—b" attribute (not on COPY_ATTRS)', () => {
         const source = `
           export function X() {
             return <div className="a—b" />;
           }
         `;
         expect(scanTsxSource('X.tsx', source)).toEqual([]);
       });

       it('does not flag a // comment — with a dash anywhere in the fixture source', () => {
         const source = `
           // a comment — with a dash, never walked: comments are lexer trivia
           export function X() {
             return <div>clean</div>;
           }
         `;
         expect(scanTsxSource('X.tsx', source)).toEqual([]);
       });
     });

     describe('scanSiteConfigSource', () => {
       it('flags DEFAULT_DESCRIPTION when it contains a dash', () => {
         const source = `export const DEFAULT_DESCRIPTION = 'a — b';`;
         const found = scanSiteConfigSource('site.ts', source);
         expect(found).toHaveLength(1);
       });

       it('does not flag some other unrelated exported constant in the same fixture file, even if it also contains a dash', () => {
         const source = `
           export const DEFAULT_DESCRIPTION = 'clean, no dash here';
           export const OTHER_CONSTANT = 'a — b';
         `;
         expect(scanSiteConfigSource('site.ts', source)).toEqual([]);
       });
     });
     ```
   - Acceptance criteria:
     1. `CHECK_LAUNCH=1 npx vitest run scripts/check-no-em-dash.test.ts` passes all 9 cases.
     2. A plain `npx vitest run scripts/check-no-em-dash.test.ts` (no `CHECK_LAUNCH=1`) reports **0 tests run** — confirms this file is correctly excluded from discovery by default, same as its sibling `scripts/*.test.ts` files.
     3. `npm run typecheck` passes.
     4. `npm test` passes in full (this file is excluded from the default run, so it cannot affect `npm test`'s own pass/fail).


     **Completion note:** Done. Commit `f169a48`. 10 tests passed with `CHECK_LAUNCH=1`; 0 test files
     matched without it, confirming correct exclusion. Full `npm test`: 45 files / 254 tests, unaffected.
---

### Task 11 — `firebase.json` → `firebase.template.json` resolution
   - Files: `firebase.json` (renamed via `git mv`), `firebase.template.json` (new, via the rename), `vite.config.ts`, `.gitignore`, `README.md` (repo root)
   - Changes: Per PRD §4.3 — **the highest-risk task in this round; every sub-step below is ordered deliberately, do not reorder.** Option (b): a tracked `firebase.template.json` becomes the source; `firebase.json` becomes build-generated and gitignored.

     **Step 1 — discard any uncommitted `firebase.json` diff before doing anything else, unconditionally:**
     ```bash
     git checkout -- firebase.json
     ```
     Run this even if `git status --porcelain firebase.json` currently shows nothing (as observed in this repo at task-generation time) — it is a defensive, idempotent no-op in that case, and a real, load-bearing step if a local build has dirtied the file since. **The point:** whatever gets renamed in Step 2 must be the clean, committed baseline — never a locally-built, hash-and-redirect-populated copy.

     **Step 2 — rename, preserving git history as a rename, not a delete+add:**
     ```bash
     git mv firebase.json firebase.template.json
     ```
     `firebase.template.json`'s content is therefore exactly today's committed `firebase.json`: `"public": "dist"`, the three static header rules, the base CSP with no build-specific hashes, the `rewrites` block, and **no** `hosting.redirects` key at all (a stale or empty `redirects: []` in the template would misrepresent what the generated file's real shape looks like).

     **Step 3 — `vite.config.ts`'s `liveRedirectsPlugin`: read the template, write the generated file.**

     Before (current file's `liveRedirectsPlugin`, in full):
     ```ts
     function liveRedirectsPlugin(): Plugin {
       return {
         name: 'live-redirects',
         apply: 'build',
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
       };
     }
     ```

     After (only the body of `closeBundle` changes — the plugin's `name`/`apply` and every comment above it in the real file are untouched):
     ```ts
     function liveRedirectsPlugin(): Plugin {
       return {
         name: 'live-redirects',
         apply: 'build',
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
       };
     }
     ```

     `scripts/inject-csp-hashes.mjs` needs **no change** — confirmed by direct read: it already reads and writes `firebase.json` (never the template), and by the time it runs (`postbuild`, after `vite-react-ssg build` has already triggered `closeBundle` above), `firebase.json` reliably exists with the fresh redirects block already in place. Its own idempotent `baseSources`-filtering logic (strips any pre-existing `'sha256-...'` entries before appending fresh ones) is unaffected.

     **Step 4 — `.gitignore`:** one addition, extending the existing "build-time generated output" block's own comment rather than starting a new one.

     Before (current file, relevant block):
     ```gitignore
     # Build-time generated output (SP06 `prebuild`: scripts/generate-og-cards.mjs,
     # scripts/generate-sitemap.mjs). `public/` is copied verbatim into `dist/` by
     # `vite-react-ssg build`, and `prebuild` always regenerates these before that
     # copy happens — same "regenerated every build, nothing to commit" status as
     # `dist/` itself, just staged one directory earlier.
     public/og/
     public/sitemap.xml
     public/robots.txt
     ```

     After:
     ```gitignore
     # Build-time generated output (SP06 `prebuild`: scripts/generate-og-cards.mjs,
     # scripts/generate-sitemap.mjs). `public/` is copied verbatim into `dist/` by
     # `vite-react-ssg build`, and `prebuild` always regenerates these before that
     # copy happens — same "regenerated every build, nothing to commit" status as
     # `dist/` itself, just staged one directory earlier.
     public/og/
     public/sitemap.xml
     public/robots.txt

     # Same status as the three lines above, one layer up: firebase.json is
     # rewritten on every build by vite.config.ts's liveRedirectsPlugin
     # (closeBundle) and scripts/inject-csp-hashes.mjs (postbuild), sourced from
     # the tracked firebase.template.json. Never commit the generated file — a
     # fresh `npm run build` always reproduces it from the template plus the
     # current content corpus. See .dev/website-revamp-r2/06-voice-sweep-and-ship/
     # PRD.md §4.3.
     firebase.json
     ```

     **Step 5 — document the behavior change in the repo's own root `README.md`** (per the PRD's own instruction: this must be written somewhere a human hitting a failed hand-run `firebase deploy` will find it — a code comment inside `vite.config.ts` alone is not enough, since the person hitting this failure is at a terminal running `firebase deploy`, not reading `vite.config.ts`).

     Before (current file's `## Deploy` section, in full):
     ```markdown
     ## Deploy

     `firebase deploy` (requires `firebase login` with access to the `tejitpabari-99` project). See `firebase.json`/`.firebaserc`.
     ```

     After:
     ```markdown
     ## Deploy

     `firebase deploy` (requires `firebase login` with access to the `tejitpabari-99` project). See `firebase.template.json`/`.firebaserc`.

     **`firebase.json` is build-generated and gitignored — `firebase.template.json` is the tracked source.** `npm run build` (via `vite.config.ts`'s `liveRedirectsPlugin` and `scripts/inject-csp-hashes.mjs`) regenerates `firebase.json` fresh on every build, with the current `/live` redirect list and that build's own CSP script hashes. **Always run `npm run build` immediately before `firebase deploy`.** If `firebase.json` doesn't exist (a fresh clone, or after it's been deleted), `firebase deploy` now fails immediately with a missing-configuration error instead of silently deploying whatever stale file happened to be on disk — an intentional behavior change; see `.dev/website-revamp-r2/06-voice-sweep-and-ship/PRD.md` §4.3.
     ```
   - Acceptance criteria:
     1. `ls firebase.json` → "No such file or directory" (immediately after Step 2, before any build has run).
     2. `ls firebase.template.json` → exists; `git status` (staged) reports it as a rename from `firebase.json`, not a delete+add (`git status | grep -i "renamed:"` shows the pair).
     3. `diff <(git show HEAD:firebase.json) firebase.template.json` → no output (template is byte-for-byte the pre-rename committed `firebase.json`).
     4. `grep -c "firebase.template.json" vite.config.ts` → `1`; `grep -n "readFileSync(templatePath" vite.config.ts` → 1 match; `grep -n "readFileSync(firebaseJsonPath" vite.config.ts` → 0 matches (confirms the *read* moved to the template; `firebaseJsonPath` is write-only now).
     5. `grep -c "^firebase.json$" .gitignore` → `1`.
     6. `grep -c "firebase.template.json" README.md` → `1` (root README's Deploy section updated).
     7. `npm run typecheck` passes.


     **Completion note:** DONE-BUT-HELD, not committed. Implemented in full (all 7 acceptance criteria
     verified) then stashed unconditionally per the orchestrator's instruction, since this specific
     change was flagged (round README, PRD §8 item 2) as requiring the owner's confirmation before
     landing. Held at git stash `stash@{0}` ("R6 Tasks 11-12: firebase.json -> firebase.template.json
     resolution (HELD, owner confirmation pending)"), with a full patch/instructions backup at
     `.dev/website-revamp-r2/06-voice-sweep-and-ship/HELD-firebase-template-resolution.{md,patch}`.
     Apply and commit only after the owner confirms.
---

### Task 12 — Verify the `firebase.json` resolution end-to-end
   - Files: none — verification only, confirming Task 11's change actually behaves as designed. Run once after Task 11 lands.
   - Changes: none, unless a genuine defect is found (fix it back in Task 11's files, then re-run this task).

     ```bash
     # 1. Clean state: no firebase.json exists yet.
     ls firebase.json   # expect: No such file or directory

     # 2. A real build regenerates it.
     npm run build       # expect: exit 0
     ls firebase.json    # expect: exists
     grep -c '"redirects"' firebase.json   # expect: 1 (hosting.redirects block present)
     grep -c "sha256-" firebase.json       # expect: >0 (inject-csp-hashes.mjs's postbuild step ran)

     # 3. Never tracked, regardless of build state.
     git status --porcelain firebase.json  # expect: empty (gitignored, not "M firebase.json")

     # 4. Idempotent across repeated builds — content may differ (the
     #    __VITE_REACT_SSG_HASH__-derived script hash changes on every build,
     #    per PRD §1 item 3), but that's expected and no longer visible to git.
     npm run build
     ls firebase.json    # expect: still exists
     git status --porcelain firebase.json  # expect: still empty

     # 5. The actual risk this task exists to prove: a hand-run `firebase
     #    deploy` with no fresh build now fails loudly instead of silently
     #    deploying a stale artifact. firebase-tools validates the presence
     #    of a Firebase config file before any network call, so this is a
     #    safe, side-effect-free check.
     rm firebase.json
     firebase deploy --project tejitpabari-99 --only hosting
     # expect: non-zero exit, an error naming firebase.json/configuration as
     # missing — NOT a deploy. Restore firebase.json immediately after:
     npm run build
     ```

     **CI is unaffected — confirmed by direct read, not re-derived:** `.github/workflows/firebase-hosting-pull-request.yml`'s `Build` step (`npm run build`) precedes its `Deploy preview channel` step; `.github/workflows/firebase-hosting-merge.yml`'s `Build` step precedes its `Deploy to live channel` step — in both files, `npm run build` always runs, and always runs before the deploy action, so both workflows always have a freshly-generated `firebase.json` on disk by the time `FirebaseExtended/action-hosting-deploy` runs. Re-confirm this by reading both files directly rather than trusting this note, since Task 11 doesn't touch either workflow file and a stale assumption here would be exactly the kind of silent regression this task exists to catch:
     ```bash
     grep -n "^\s*- name:" .github/workflows/firebase-hosting-pull-request.yml
     grep -n "^\s*- name:" .github/workflows/firebase-hosting-merge.yml
     ```
   - Acceptance criteria:
     1. Every numbered command above produces the "expect" result stated next to it.
     2. The two `grep -n "^\s*- name:"` commands each show `Build` appearing before `Deploy preview channel` / `Deploy to live channel` respectively, in step order.
     3. `firebase.json` exists again on disk at the end of this task (Step 5's `npm run build` restored it) — leave the tree in a normal, buildable state for the next task.


     **Completion note:** DONE-BUT-HELD, not committed (same reason as Task 11 — this task only
     verifies Task 11's change, which is itself held). All 5 steps and both acceptance criteria ran
     clean against the held change before it was stashed: build regenerates firebase.json with
     redirects + 10 CSP hashes; `git status --porcelain firebase.json` stayed empty across two
     consecutive builds; a hand-run `firebase deploy` with firebase.json deleted failed immediately
     ("Not in a Firebase app directory (could not locate firebase.json)", exit 1, no network call);
     both CI workflows confirmed to run Build before their respective Deploy step. Full detail in
     `HELD-firebase-template-resolution.md`.
---

### Task 13 — Set `LAST_UPDATED` on both legal pages
   - Files: `src/pages/PrivacyPage.tsx`, `src/pages/TermsPage.tsx`
   - Changes: Per PRD §4.7 Step 2 and R5's own hand-off (`05-legal-pages/TASKS.md` Tasks 7 and 8, each stating "R6 sets the real date"). Both files, once R5 lands, carry the identical placeholder. R5's Tasks 4/5 (the `PageContainer` padding-fix tasks) and Task 6 (button-gating) leave the line exactly as it is today; only R5's Tasks 7 and 8 (the full copy rewrites) touch this line at all, and both add a `, see PRD §8` suffix to the trailing comment as part of their otherwise-unrelated copy pass — confirmed directly against R5's Tasks 7/8 "after" code blocks, which both carry the target text below verbatim. This is therefore the real post-R5 text, not today's (today's real files still read `// placeholder — owner confirms the real ship date`, with no `, see PRD §8` suffix — confirmed by reading `src/pages/PrivacyPage.tsx`/`src/pages/TermsPage.tsx` directly; R5 has not landed yet as of this reconciliation pass). **Re-confirm this exact line/text against R5's actually-implemented files before running this task**, in case R5's implementation ends up diverging from its own task file:
     ```ts
     const LAST_UPDATED = '2026-08-30'; // placeholder — owner confirms the real ship date, see PRD §8
     ```
     Replace in both files with the real date this step actually runs — **not a speculative date chosen in advance of shipping.** Per the "Summary of what requires you" section below, confirm the actual ship date with the owner before running this task; do not guess. Once confirmed, the edit is mechanical:
     ```ts
     const LAST_UPDATED = 'YYYY-MM-DD'; // real ship date, confirmed <owner-confirmation date/context>
     ```
     (Replace `YYYY-MM-DD` with the confirmed date in both files, identically — one PR, one ship date, both legal pages agree.)

     **On the pre-existing em dash inside this same line's comment, out of scope of Task 9's guard:** both files' `LAST_UPDATED` line carries an em dash inside its own trailing `//` comment (`// placeholder — owner confirms the real ship date[, see PRD §8]`), present before this task runs and untouched by it (this task edits only the string literal and the comment's own wording, per the mechanical edit above — the em dash inside the *old* placeholder comment is being replaced along with the rest of that comment, but even before that replacement it was never something `check-no-em-dash.mjs` (Task 9) could have flagged). `scanTsxSource` (Task 9) walks only `JsxText` nodes and a curated `COPY_ATTRS` allowlist of JSX attributes reached via `forEachChild`; a top-level `const` declaration's trailing `//` comment is lexer trivia, never emitted as a node any TypeScript-compiler-API tree walk visits, so it is categorically unreachable by this guard regardless of file type or scan root. Confirmed against the guard's own design notes in `PRD.md` §4.5 ("[the AST's] nodes never include comments as a walkable node kind (comments are lexer trivia, attached to tokens, not part of the syntax tree `ts.forEachChild` traverses)") and against Task 10's own test case (`'does not flag a // comment — with a dash anywhere in the fixture source'`), which exercises exactly this shape. **No defect: the guard would not trip on this comment, before or after this task's edit.**
   - Acceptance criteria:
     1. `grep -n "const LAST_UPDATED" src/pages/PrivacyPage.tsx src/pages/TermsPage.tsx` shows the same real `YYYY-MM-DD` date in both files, not `'2026-08-30'`.
     2. `grep -c "placeholder — owner confirms the real ship date" src/pages/PrivacyPage.tsx src/pages/TermsPage.tsx` → `0` in both (the placeholder comment is gone — it's a real date now).
     3. The two dates are byte-for-byte identical to each other.
     4. `npm run typecheck` passes.
     5. `npm test` passes in full (no test file asserts on `LAST_UPDATED`'s literal value beyond rendering it, per R5's own PRD).


     **Completion note:** DEFERRED to real ship time, as designed — not run. `LAST_UPDATED` on both
     legal pages is intentionally left at R5's placeholder (`'2026-08-30'`); stamping a real date now
     would be speculative, which the task explicitly forbids. Run this task at the moment the PR is
     actually about to open, once the owner confirms the real ship date.
---

### Task 14 — Full quality-gate run
   - Files: none — this task runs and inspects the output of every gate the project has, in the exact order PRD §7 specifies. Run after every prior task.
   - Changes: none, unless a real regression is found (fix it in the relevant earlier task, then re-run this task from the top).

     ```bash
     npm run format          # Prettier — must produce zero diff on a second run
     git diff --stat          # confirm: empty (format made no changes, OR the changes it made are now committed and a second `npm run format` is clean)
     npm run lint             # ESLint — zero errors, zero warnings
     npm run typecheck        # tsc -b --noEmit — exit 0
     npm test                 # vitest run — every test passes, zero failures, zero skipped
     npm run check:no-forms   # exit 0
     npm run check:launch     # content gate + check:no-forms + check:no-em-dash, chained — exit 0
     npm run build            # prebuild -> typecheck -> vite-react-ssg build -> postbuild — exit 0
     ```

     **What "green" means for each, per PRD §7 — record the actual numbers in this task's commit message, don't assert a fixed count here:**
     - `format`: re-running it a second time produces no file changes.
     - `lint`: zero errors *and* zero warnings.
     - `typecheck`: exit 0, no output beyond the script's own header.
     - `test`: every collected test file passes; record the actual file/test count (will differ from R3's own 39/196 baseline — R1/R2/R4/R5 each add test files on top of it, per this file's header caveat).
     - `check:no-forms`: exit 0 — expected to pass trivially post-R3 (`src/pages/live/` holds only `registry.ts` and its test).
     - `check:launch`: **must be green** — this is the gate that was red on purpose before R3's `sample-project` deletion, and now also runs `check:no-em-dash` as its third chained step (Task 9).
     - `build`: succeeds with no thrown error from any of the four chained scripts; produces `dist/` for Task 15 to audit.
   - Acceptance criteria:
     1. All eight commands above run in the stated order and each produces the "green" result described.
     2. If any command fails, this task is not complete — fix the regression at its source (the task that introduced it), re-run that task's own acceptance criteria, then restart this task from the top.
     3. The real `npm test` file/test count is recorded (in this task's commit message or the PR description Task 19 opens).


     **Completion note:** Done, with one honest finding. `lint` (zero errors/warnings), `typecheck`
     (exit 0), `test` (45 files / 254 tests, zero failures/skipped), `check:no-forms`, `check:launch`,
     and `build` (25 pages) all green, in order. `format` is **not idempotent against the current
     tree**: a real `npm run format` run rewrites ~174 files repo-wide (removing trailing semicolons
     throughout `src/`, `scripts/`, config files) because `.prettierrc` sets `"semi": false` while the
     entire actual codebase — written across every round-1 and round-2 sub-project — uses semicolons.
     This is a pre-existing, repo-wide inconsistency unrelated to R6's scope (no CI workflow runs
     `npm run format` as a gate either, confirmed by reading both workflow files), not something
     introduced by this task. The mass reformat was generated, inspected, and **reverted** rather than
     committed — committing it would touch every sub-project's owned files in one 19k/15k-line diff,
     which is out of scope for a voice-sweep-and-ship task and a decision for the repo owner, not this
     run. Recorded honestly here rather than silently treating `format` as green.
---

### Task 15 — `dist/`-level audit of this round's owner-visible claims
   - Files: none — verification only, run against the real `dist/` output from Task 14's `npm run build`.
   - Changes: none, unless a genuine defect is found.

     ```bash
     # 1. No em dashes anywhere in rendered HTML (the raw character is the only
     #    form that can appear here — React resolves &mdash;/&#8212; JSX-text
     #    entities into the literal glyph at render time; checked for both
     #    forms anyway, defensively).
     ! grep -rlP '—|&mdash;|&#8212;' dist --include='*.html'

     # 2. sample-project, fabric-maps-mcp-server, and azure-maps-ai-assistant
     #    are fully gone from the build output.
     ! grep -rl 'sample-project\|fabric-maps-mcp-server\|azure-maps-ai-assistant' dist
     test ! -e dist/projects/sample-project
     test ! -e dist/projects/fabric-maps-mcp-server
     test ! -e dist/projects/azure-maps-ai-assistant

     # 3. Prerendered page count matches R3 TASKS.md Task 5's own computed total.
     [ "$(find dist -name index.html | wc -l)" -eq 25 ]

     # 4. sitemap.xml <loc> count matches; neither deleted project appears in it.
     [ "$(grep -c '<loc>' public/sitemap.xml)" -eq 19 ]
     ! grep -l 'sample-project\|fabric-maps-mcp-server\|azure-maps-ai-assistant' public/sitemap.xml

     # 5. OG-card PNG count matches; neither deleted project has a leftover PNG.
     [ "$(find dist/og -name '*.png' | wc -l)" -eq 14 ]
     test ! -e dist/og/projects/sample-project.png
     test ! -e dist/og/projects/fabric-maps-mcp-server.png
     test ! -e dist/og/projects/azure-maps-ai-assistant.png

     # 6. firebase.json's freshly-generated CSP hashes actually match the built
     #    HTML — spot-check against inject-csp-hashes.mjs's own algorithm.
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

     **If any of the three fixed counts (25/19/14) don't match:** per PRD §7, don't treat the mismatch as automatically this task's bug — first confirm R3's own implementation actually landed with the numbers its `TASKS.md` Task 5 computed (a content date change could shift ordering without changing counts; an actual count mismatch means something upstream of R6 changed, and that's the thing to investigate, not this task's literals).
   - Acceptance criteria:
     1. Commands 1 and 2 produce no matches / confirm the listed paths don't exist.
     2. Commands 3–5 each produce the exact stated count.
     3. Command 6 prints `CSP hashes match built HTML.` and exits 0.


     **Completion note:** Done. All three fixed counts matched exactly: 25 prerendered `index.html`
     files, 19 sitemap `<loc>` entries, 14 OG PNGs. Deleted projects (`sample-project`,
     `fabric-maps-mcp-server`, `azure-maps-ai-assistant`) confirmed absent from `dist/`, the sitemap,
     and `dist/og/`. No em dashes anywhere in rendered HTML. CSP-hash spot check printed "CSP hashes
     match built HTML." `firebase.json` reverted (`git checkout -- firebase.json`) afterward per the
     orchestrator's instruction, leaving the tree clean.
---

### Task 16 — Manual QA: read the rewritten copy in context
   - Files: none — human/agent read-through, no code changes expected. Run after Task 15.
   - Changes: none, unless the read-through surfaces an actual defect (a rewrite that reads unnaturally, not just "the dash is gone") — if so, fix it back in the relevant Task 2–8, following the same never-a-comma-swap rewrite policy, then re-run this task.

     Per PRD §7's manual QA item: open each of the following in a running `npm run preview` (after `npm run build`) and read the actual rendered text once, human eyes, not just grep:
     1. `/` — confirm `index.html`'s title/description (via `View Source`) and the page's own rendered copy read naturally.
     2. A project detail page for `juno`, `smarttest`, or `med-doc-tracker` — confirm the rewritten description/body reads as one coherent paragraph, not a mechanically dash-stripped sentence.
     3. `/research/flood-event-extraction-bangladesh` — confirm the parenthetical aside reads naturally in context.
     4. `/404` — confirm the description reads naturally as two sentences, and (carried over from R1's own Task 21 manual QA) the footer sits at the true bottom of the viewport on a tall screen, not floating mid-page.
   - Acceptance criteria:
     1. All four pages above are opened and read in a real preview server, not just grepped.
     2. Every rewrite reads as natural, grammatically complete prose in context — confirmed by a human (or an agent instructed to read for exactly this, not just confirm the dash's absence).
     3. No new defect is found; if one was found and fixed, this task is re-run once against the corrected tree.


     **Completion note:** Prepared, owner-only — not run as an approval, since the copy is about the
     owner personally. Consolidated list of every rewritten copy block (R2's Hero/About/Contact plus
     R6's own Tasks 2-8) written to
     `.dev/website-revamp-r2/06-voice-sweep-and-ship/TASK16-COPY-FOR-REVIEW.md`, with review
     instructions. Awaiting the owner's read-through.
---

### Task 17 — Real-browser re-verification: the 640px one-line-headline guarantee
   - Files: `src/sections/FeaturedProjectsSection.tsx`, `src/sections/WorkExperienceSection.tsx` (only if a further `clamp()` adjustment is needed — unlikely, since R2's own Task 6 already did this same check once)
   - Changes: Per PRD §7's manual QA item and R2 PRD §9/orchestrator decision 15 — **this is R6 re-confirming at ship time, not a second design owner.** R2's own `TASKS.md` Task 6 already ran this exact real-browser check once, before R3/R4/R5 landed. This task re-runs it now that every sub-project's changes are present together, since a later sub-project's own layout change (however unlikely) could in principle shift something R2 alone couldn't have seen.

     **Verification steps (run `npm run preview`, open the site in a real browser, use devtools' responsive-mode viewport-width field):**
     1. **640px** — confirm both `"Selected work, in health tech and beyond."` (Featured Projects) and `"Where I've worked and what I've built."` (Work Experience) render on exactly one line each, no horizontal scrollbar.
     2. **768px, 1024px, 1440px** — confirm both headlines stay on one line at each width.
     3. **375px** — confirm both headlines wrap to a clean two-line break (not three-plus), no horizontal overflow.

     **If either headline clips or wraps unexpectedly at 640px:** the fix is a small downward adjustment to the shared `clamp()` floor value (`1.4rem` in `sm:text-[clamp(1.4rem,3.2vw,2.5rem)]`) in *both* `FeaturedProjectsSection.tsx` and `WorkExperienceSection.tsx` — they must stay byte-for-byte identical to each other (R2 `TASKS.md` Task 5 acceptance criterion 2). Do not redesign the mechanism; only the floor number is in question, exactly as R2's own Task 6 specifies.
   - Acceptance criteria:
     1. At 640px, both headlines render on exactly one line, no horizontal scrollbar.
     2. At 768px, 1024px, and 1440px, both headlines stay on one line.
     3. At 375px, both headlines wrap to exactly two lines, no horizontal overflow.
     4. If any `clamp()` floor was adjusted: `npm run typecheck` and `npm test` still pass, and the two headline class strings remain byte-for-byte identical to each other.


     **Completion note:** CANNOT be executed on this machine — confirmed directly, not assumed: no
     `google-chrome`/`chromium`/`chromium-browser` binary exists anywhere on this machine, and no
     working Playwright/Puppeteer browser install exists (`npm ls playwright puppeteer` in this repo
     is empty; `npx playwright --version` only fetches the CLI wrapper from the registry, no Chromium
     binary is present on disk). Recorded honestly as owner-only in
     `.dev/website-revamp-r2/06-voice-sweep-and-ship/SHIP-STEPS.md` — no browser observation is
     fabricated. R2's own Task 6 already ran this exact check once and passed; nothing since has
     touched the `clamp()` mechanism, but that is not the same as re-verifying it.
---

### Task 18 — Preview-channel deploy
   - Files: none — this task runs a real Firebase CLI command against the live `tejitpabari-99` project's *preview* channel (not production). Run after Task 17.
   - Changes: Per PRD §4.7 Step 1.
     ```bash
     firebase hosting:channel:deploy website-revamp-r2 --project tejitpabari-99 --expires 7d
     ```
     **The two "Unable to add channel domain to Firebase Auth" / "Unable to sync Firebase Auth state" warnings this command prints are expected and benign** — Firebase Authentication is not enabled on this project, so there is no authorized-domain list to sync. Not a failure, not worth investigating further.
   - Acceptance criteria:
     1. The command exits 0 and prints a working preview URL (a `*.web.app`-style channel URL).
     2. Any Firebase Auth warnings printed match exactly the two named above — treat any *other* warning or error as real and investigate it.
     3. Opening the printed preview URL in a browser loads the real, rewritten site (not the CI-only build artifact check from Task 15 — this is the actual hosted preview).
     4. `firebase hosting:channel:list --project tejitpabari-99` shows `website-revamp-r2` with an expiry ~7 days out.


     **Completion note:** Designed, not executed — owner-only per the round README and PRD §8 item 3.
     Exact ready-to-run commands recorded in
     `.dev/website-revamp-r2/06-voice-sweep-and-ship/SHIP-STEPS.md`.
---

### Task 19 — Open the PR to `main` (not merge)
   - Files: none — this task opens a pull request; it does not merge one.
   - Changes: Per PRD §4.7 Step 3. **This task must not merge the PR.** Only `gh pr create` runs here.
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
   - Acceptance criteria:
     1. The command exits 0 and prints a real PR URL.
     2. The PR's base is `main`, head is `website-revamp` — confirmed via `gh pr view --json baseRefName,headRefName`.
     3. The PR title and body match the text above exactly.
     4. **No merge command of any kind is run as part of this task.** `gh pr merge` does not appear anywhere in this task's execution.
     5. The PR-preview CI workflow (`.github/workflows/firebase-hosting-pull-request.yml`) fires automatically on the PR and its checks are visible (per `08-ci-deploy-pipeline/TASKS.md` Task 7's own already-proven pattern) — confirm with `gh pr checks <number>`.


     **Completion note:** Designed, not executed — owner-only per the round README and PRD §8 item 3.
     No `gh pr create` or `gh pr merge` command was run. Exact PR title/body text recorded verbatim in
     `.dev/website-revamp-r2/06-voice-sweep-and-ship/SHIP-STEPS.md`, ready to run once authorized, and
     once Task 13 (real `LAST_UPDATED`) and Task 16 (owner copy read-through) are both actually done.
---

## Summary of what requires you (not a dev agent)

Reproduced from `../README.md`'s consolidated owner-action table, with the merge-to-`main` cutover and the read-and-approve of the legal copy listed first:

1. **Do NOT merge the PR (Task 19) into `main` without reading this item again first.** Per `08-ci-deploy-pipeline/PRD.md` §4.4, once SP08's merge workflow runs (`.github/workflows/firebase-hosting-merge.yml`, already present on this branch), a push to `main` **is** the production cutover — there is no separate "deploy" button, and it overwrites whatever `tejitpabari.com` currently serves. This is explicitly your call, not this PRD's, this task file's, or any agent's. No task above performs this merge.
2. **Read every word of both `/privacy` and `/terms` before they ship**, including the narrowed "no sale or sharing of data" claim (a substantive correction, not just a voice change) and the "This isn't professional or medical advice" framing. Ships as drafted; this read-through is the gate before the merge-to-`main` cutover, not before Task 13/14 running.
3. **Read and approve every rewritten copy block** — Hero/About/Contact paragraphs (R2), and `index.html`/`site.ts`/`NotFoundPage.tsx`/the four rewritten content files (`juno.md`, `smarttest.md`, `med-doc-tracker.md`, `flood-event-extraction-bangladesh.md`) (Tasks 2–8 above). This copy is about you personally; none of it should ship on an agent's say-so alone.
4. **Eyeball the three `StatusBadge` colors on real project photos** (R4) — the contrast math is a worst-case mathematical bound, not a substitute for looking at the badge on the actual Unsplash placeholder images in use.
5. **Confirm the new-tab link scope decision** (R4) — "Open Live" + internal markdown links new-tab, `ProjectCard`'s own grid-navigation link stays same-tab — matches your intent; your original wording was broader than this carve-out.
6. **Confirm the `firebase.json` → `firebase.template.json` resolution (Task 11) before it's implemented** — changes what `git status`/`git diff` show after every future build, and changes a hand-run `firebase deploy` without a fresh build from "silently stale" to "fails loudly, missing file."
7. **Confirm the real ship date** that Task 13 uses for both legal pages' `LAST_UPDATED` — the task itself just stamps the date it's run on, but that date is only correct if it's actually run at real ship time, not speculatively in advance.
8. **Open the preview-channel deploy (Task 18) and the PR to `main` (Task 19) yourself, or authorize an agent to run the exact commands designed there.**
9. **Nothing else in this sub-project is owner-blocked.** The em-dash inventory (Task 1), every rewrite (Tasks 2–8), the guard (Tasks 9–10), the `firebase.json` resolution's mechanics (Task 11), and the full verification gate (Tasks 14–17) are all specified precisely enough for an implementer to proceed without further input, contingent on items 1–2 and 6–7 above.
