# HELD: `firebase.json` → `firebase.template.json` resolution (R6 Tasks 11–12)

**Status: DONE-BUT-HELD, not committed.** Per the round README's "Still requires the owner" table
(item: "Confirm the `firebase.json` → `firebase.template.json` resolution before it's implemented")
and PRD §8 item 2, this specific change was flagged as requiring the owner's explicit confirmation
before landing, because it changes what `git status`/`git diff` show after every future build and
changes a hand-run `firebase deploy` without a fresh build from "silently stale" to "fails loudly,
missing file." That confirmation has not been given as of this run. The work is fully implemented and
verified end-to-end (Task 12, in full) but deliberately not committed.

## Where the change lives right now

Stashed in the repo's stash list:

```
stash@{0}: On website-revamp: R6 Tasks 11-12: firebase.json -> firebase.template.json resolution (HELD, owner confirmation pending)
```

A plain-text copy of the same diff is also saved alongside this file, in case the stash is ever
dropped or the working tree changes enough that the stash no longer applies cleanly:

```
.dev/website-revamp-r2/06-voice-sweep-and-ship/HELD-firebase-template-resolution.patch
```

## What the change does (implemented exactly per PRD §4.3 / TASKS.md Task 11)

1. `git mv firebase.json firebase.template.json` — renames the tracked file, preserving git history
   as a rename. `firebase.template.json`'s content is byte-for-byte the pre-change committed
   `firebase.json` (confirmed: `diff <(git show HEAD:firebase.json) firebase.template.json` produced
   no output).
2. `vite.config.ts`'s `liveRedirectsPlugin` now reads `firebase.template.json` (not `firebase.json`)
   as its base config, and still writes the computed result to `firebase.json`.
3. `.gitignore` gains one new entry, `firebase.json`, appended to the existing "build-time generated
   output" comment block (same treatment already given to `public/og/`, `public/sitemap.xml`,
   `public/robots.txt`).
4. Root `README.md`'s `## Deploy` section is updated to point at `firebase.template.json` and to
   explain the new fail-loudly-if-missing behavior.

`scripts/inject-csp-hashes.mjs` needed no change — it already reads/writes `firebase.json` only, and
runs after `liveRedirectsPlugin` has already regenerated that file from the template.

## Verification already performed (Task 12, full)

All performed against the real repo, in this exact order, with the change applied:

1. Clean state: `firebase.json` did not exist after the rename (`ls firebase.json` → No such file).
2. `npm run build` regenerated `firebase.json` from scratch: `hosting.redirects` present (1 match for
   `"redirects"`), `sha256-` CSP hashes present (10 inline-script hashes written, confirmed by
   `inject-csp-hashes.mjs`'s own stdout: "wrote 10 inline-script hash(es)... scanned 25 HTML files").
3. `git status --porcelain firebase.json` was empty both before and after the build (gitignored, not
   `M firebase.json` — the historical symptom this change fixes).
4. Ran `npm run build` a second time back-to-back: `firebase.json` still exists, `git status
   --porcelain firebase.json` still empty — idempotent from git's point of view even though the
   file's own bytes differ build-to-build (the `__VITE_REACT_SSG_HASH__`-derived script hash changes
   every build, as documented in PRD §4.3 — expected, no longer visible to git).
5. **The actual risk this resolves, proven directly:** deleted `firebase.json`, then ran `firebase
   deploy --project tejitpabari-99 --only hosting`. Result: immediate failure, `Error: Not in a
   Firebase app directory (could not locate firebase.json)`, exit code 1 — no network call, no
   deploy attempted. Confirms the "silently stale" → "fails loudly, missing file" behavior change
   the PRD promises. `npm run build` was run again immediately after to restore `firebase.json` and
   leave the tree buildable.
6. Confirmed by direct read that CI is unaffected: both
   `.github/workflows/firebase-hosting-pull-request.yml` and
   `.github/workflows/firebase-hosting-merge.yml` run their `Build` step before their respective
   `Deploy preview channel` / `Deploy to live channel` step, so both workflows always have a
   freshly-built `firebase.json` on disk before any deploy action runs. Neither workflow file needed
   or received any change.

All of Task 11's and Task 12's acceptance criteria passed. This is implementation-complete, not a
partial attempt.

## How to apply this once the owner confirms

**Option A — from the stash (preferred, if it's still present):**

```bash
cd /root/projects/tejitpabari
git stash list                       # confirm the R6 Tasks 11-12 entry is still there
git stash apply stash@{0}            # or the correct index if other stashes have since been pushed
# review the result:
git status
git diff --stat
# then stage and commit, e.g.:
git add firebase.json firebase.template.json .gitignore README.md vite.config.ts
git stash drop stash@{0}             # only after confirming the apply succeeded and was committed
```

Note `firebase.json` itself will show as deleted from git's index (it's being un-tracked, not
edited) and `firebase.template.json` as a new file — this is correct; git may not preserve the
rename detection through a stash apply the way `git mv` did originally, but the end state (tracked
`firebase.template.json` with the original content, `firebase.json` untracked and gitignored) is
identical either way.

**Option B — from the patch file, if the stash is gone:**

```bash
cd /root/projects/tejitpabari
git apply .dev/website-revamp-r2/06-voice-sweep-and-ship/HELD-firebase-template-resolution.patch
git status   # verify it applied as expected
```

**After applying, by either method:**

```bash
npm run build            # regenerates firebase.json fresh from the new template
npm run typecheck        # sanity check
git add firebase.template.json .gitignore README.md vite.config.ts
# firebase.json itself is now gitignored — do NOT git add it
git commit -m "06-voice-sweep-and-ship: Task 11 — firebase.json -> firebase.template.json resolution

<cite the owner's confirmation here, e.g. date/channel it was given in>

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

Then re-run Task 12's verification steps once more against the freshly committed state, since a
different working tree at commit time could in principle behave differently than the one this
document was verified against.
