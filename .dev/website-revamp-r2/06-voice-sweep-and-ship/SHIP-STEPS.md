# Ship steps — Tasks 17, 18, 19 (designed, not executed)

**Status: none of the three steps below were run.** Per the round README ("Open the preview-channel
deploy and the PR to `main` yourself, or authorize an agent to run the exact commands R6 designs")
and PRD §8 item 3, the owner has not authorized execution. This document is the exact,
copy-pasteable set of commands and text so that authorization, whenever it's given, requires no
further design work.

## Task 17 — real-browser 640px one-line-headline re-verification: CANNOT be executed here

**Confirmed directly: there is no browser on this machine.** Checked and none of the following exist:
- `google-chrome`, `chromium`, `chromium-browser` binaries anywhere on `$PATH` or the filesystem.
- A working `playwright`/`puppeteer` browser install (`npm ls playwright puppeteer` in the repo:
  empty; `npx playwright --version` succeeds only because npx fetches the *CLI wrapper* package from
  the registry, not because a Chromium binary is present — no such binary was found on disk).

This is an owner-only (or "run this from a machine with a real browser") verification, not something
this run can fake. **Do not treat this as passing.** No browser observation is reported for the
640px/768px/1024px/1440px/375px headline checks in TASKS.md Task 17 — they are simply not done.

R2's own Task 6 already ran this exact check once, before R3/R4/R5 landed, and it passed then. The
`clamp()` mechanism (`sm:text-[clamp(1.4rem,3.2vw,2.5rem)]`) is unchanged by anything in R3/R4/R5/R6,
so there's no known reason to expect a regression, but "no known reason" is not the same as
"re-verified," and this document does not claim otherwise.

**To actually run this check:** open `npm run preview`'s local URL (or Task 18's preview-channel URL,
once deployed) in a real browser, devtools' responsive-mode viewport-width field, and confirm both
`"Selected work, in health tech and beyond."` (Featured Projects) and `"Where I've worked and what
I've built."` (Work Experience) render on one line at 640/768/1024/1440px and wrap cleanly to two
lines at 375px. If either headline clips or wraps unexpectedly at 640px, adjust the shared `1.4rem`
floor in both `src/sections/FeaturedProjectsSection.tsx` and `src/sections/WorkExperienceSection.tsx`
(they must stay byte-for-byte identical to each other) — do not redesign the mechanism.

## Task 18 — preview-channel deploy (not run)

```bash
cd /root/projects/tejitpabari
npm run build   # always immediately before a hand-run firebase command — see the firebase.json note below
firebase hosting:channel:deploy website-revamp-r2 --project tejitpabari-99 --expires 7d
```

**Expected:** exit 0, a working `*.web.app`-style preview URL printed. The two warnings "Unable to
add channel domain to Firebase Auth" / "Unable to sync Firebase Auth state" are expected and benign
(Firebase Authentication isn't enabled on this project — no authorized-domain list to sync). Any
*other* warning or error should be treated as real.

**Verify after running:**
```bash
firebase hosting:channel:list --project tejitpabari-99
# expect: website-revamp-r2 listed, with an expiry ~7 days out
```

**Note on `firebase.json`:** if Tasks 11-12's held `firebase.template.json` change (see
`HELD-firebase-template-resolution.md` in this same folder) has NOT yet been applied at the time this
step runs, `firebase.json` is still the tracked file directly, and a plain `npm run build` regenerates
it in place as it always has — no special handling needed. If that held change HAS since been applied
and committed, the same `npm run build` command above still works identically (it now regenerates
`firebase.json` from `firebase.template.json` instead) — no change to this step either way.

## Task 19 — open the PR to `main` (not merge) — not run

**This must never include a merge.** Only `gh pr create` below should run; `gh pr merge` does not
appear anywhere in this document.

```bash
cd /root/projects/tejitpabari
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

**Verify after running:**
```bash
gh pr view --json baseRefName,headRefName   # base: main, head: website-revamp
gh pr checks <number>                        # PR-preview CI workflow fires and is visible
```

**Before opening this PR for real, two things still need to happen first** (both flagged separately,
not folded into this document as if already done):
1. Task 13 — `LAST_UPDATED` on both legal pages needs the real ship date, set at the moment this step
   actually runs (see `TASKS.md` Task 13's own completion note — deferred, not stamped speculatively
   here).
2. Task 16 — the owner's read-through of every rewritten copy block (`TASK16-COPY-FOR-REVIEW.md`, this
   same folder).

## Reminder: do not merge

Per `08-ci-deploy-pipeline/PRD.md` §4.4, once SP08's merge workflow runs
(`.github/workflows/firebase-hosting-merge.yml`, confirmed present on this branch), a push to `main`
**is** the production cutover — there is no separate "deploy" button, and it overwrites whatever
`tejitpabari.com` currently serves. This is explicitly the owner's call. No command in this document
performs that merge.
