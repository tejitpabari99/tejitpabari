# PRD — Sub-project 08: CI & Deploy Pipeline

**Repo:** `tejitpabari/tejitpabari` (branch `website-revamp`)
**Depends on:** SP01 (`firebase.json`, `package.json` scripts, `dist` build output, the Firebase project `tejitpabari-99`) — binding. SP02 (`check:launch`) — binding. SP04 (`check:no-forms`) — binding. SP06 (`prebuild` OG-card + sitemap generation, invoked automatically by `npm run build`) — binding. This is the **last** sub-project in the initiative: every npm script the two workflows below invoke must already exist in the repo before this PRD's design does anything useful, which is exactly why it can't build sooner.
**Consumed by:** nobody downstream — this is the terminal sub-project. Its output (two workflow files, a service account, one secret, one repository variable) is infrastructure the other six sub-projects' work runs through, not a contract any of them import.
**Also resolves:** SP01 §4.9/§9's "Deploy pipeline (GitHub Actions)" sketch, which assumed a Firebase-scaffolded integration was already installed on the repo — verified false (§1) — and left the concrete workflow design as future work; SP02 §9's `[DEFERRED: the gate stays a manually-run npm run check:launch script; CI is out of scope...]` item; SP05 §9's parallel framing of `check:no-forms` as "still a manually-run command, not a build gate."
**Source of truth:** `/root/projects/tejitpabari/.dev/website-revamp/BRIEF.md` — every decision cited as "brief §N" is settled there and not re-opened here. Brief §4's original "no CI/CD" non-goal is struck through and amended (2026-08-31) to reflect the owner's decision to adopt CI; this PRD is the design that amendment points to.

---

## 1. Problem

**Zero CI exists on this repo today, and the belief that it did was wrong.** Verified directly, three independent ways, on every branch present:

- `git ls-tree -r <branch> --name-only | grep '^\.github/workflows'` returns nothing on `main`, `website-revamp`, or either of the two other remote branches (`blog-markdown-setup`, `deploy`).
- `gh secret list --repo tejitpabari99/tejitpabari` and `gh variable list --repo tejitpabari99/tejitpabari` both return empty — no `FIREBASE_SERVICE_ACCOUNT_*` secret, no repository variables of any kind.
- `gcloud iam service-accounts list --project=tejitpabari-99` shows exactly the two Firebase-created default accounts (`firebase-adminsdk-fbsvc@…`, the App Hosting compute account) plus the GCP default compute account — no service account resembling a GitHub Actions deploy identity exists.

This corrects the record left by SP01 §4.9/§9 and by `BRIEF.md`'s own §4 amendment note, both of which state that "the owner installed the Firebase Hosting GitHub Action integration" and describe this PRD's job as *reconciling* an already-scaffolded pair of workflows. That belief was mistaken — the integration was never actually run against this repo (it may have been run against a different one, or abandoned mid-flow). There is nothing to reconcile. **This PRD hand-authors both workflow files from scratch.** §9 and the sibling-reconciliation notes below correct SP01's and `BRIEF.md`'s language to match this.

That correction aside, the owner's underlying decision stands and this PRD implements it: brief §4's original non-goal — "CI/CD (manual `firebase deploy` only)" — is struck through and superseded. The case for adopting CI here is specific to this project, not generic best practice:

1. **The single highest-value reason is preview-channel verification of prerendered `<head>` output.** The entire architecture of this rewrite — `vite-react-ssg` prerendering every route to static HTML, `RouteMeta` (SP06 §4.2), the OG-card generator (SP06 §4.3) — exists because LinkedIn/Facebook crawlers don't execute JavaScript (brief §1: "server-rendered share-preview correctness... is a functional requirement, not polish"). Until now, the only way to check that output was `vite preview` on a laptop, or waiting for a real deploy. A PR-preview channel gives a real, publicly-reachable Firebase Hosting URL — the actual server response, actual `<head>`, actual redirect behavior — to check *before* merging, not after. Note the limit on this, stated plainly rather than oversold: SP06 §8 item 1 already flags that LinkedIn's Post Inspector and Facebook's Sharing Debugger both cache aggressively per-URL and need the real, final `tejitpabari.com` domain for a *fully* trustworthy crawler-side check — a preview channel's `*.web.app` URL doesn't substitute for that. What it does substitute for, precisely: confirming with `View Source` that the raw HTTP response (not DevTools' rendered DOM) actually contains the right `<title>`, `og:image`, canonical link, and that Firebase's redirect/rewrite evaluation order (SP04 §4.6) behaves as designed — on a real Hosting deployment, not a local dev server that never touches `firebase.json` at all. That's a real, load-bearing check this project didn't have before.
2. **It mechanizes two gates that both sibling PRDs already flagged as the wrong shape.** SP02 §9 shipped `check:launch` explicitly `[DEFERRED]`, naming the residual risk in its own words: "manual and easy to forget." SP05 §8 item 6 said the same thing about `check:no-forms`: "it only catches a violation if you... actually run it before shipping." Both scripts already exist, are already correct, and already compose (`check:launch` internally calls `check:no-forms`, SP04 §4.8) — the only gap was that nothing forced them to run. CI closes that gap without touching either script's logic.
3. **It's cheap relative to the alternative it replaces.** The previous plan was `firebase deploy` run by hand from whatever local checkout happened to be current — no record of what was actually built, no verification step between "code compiles on my machine" and "it's live," and (per SP04 §4.6) a generated `firebase.json` `redirects` block that a manual flow would leave sitting as an uncommitted, easy-to-forget local diff. A four-step CI job (checkout, install, gate, build, deploy) removes all of that for a single-maintainer repo at zero recurring cost beyond GitHub Actions' free tier for a public/personal repo.

The owner-visible cost of this decision, stated once and up front because it changes how the rest of the rewrite gets shipped: **merging `website-revamp` into `main` stops being a routine git operation and becomes the literal production cutover** (§4.5). There is no longer a separate "build it, look at it, then decide to deploy" step once the merge workflow is live — the deploy *is* the merge. §4.12 covers the one concrete, immediate consequence of this: the very first successful run of that workflow overwrites the hand-deployed holding page currently serving `tejitpabari-99`'s live channel.

---

## 2. Goals

- Two GitHub Actions workflow files, hand-authored (not scaffolded), that build this project correctly — `npm run build`, `dist` output, Node 20 — reusing exactly the toolchain SP01 already defined, with no Gatsby-era assumptions to strip out (unlike the integration flow this PRD replaces, which would have scaffolded against whatever was live on `main` at install time).
- A PR-preview-channel workflow that runs SP02's and SP04's mechanical gates, builds, and deploys to a time-limited Firebase Hosting preview channel, with the deploy action's own PR-comment behavior surfacing the preview URL directly in the PR.
- A merge-to-`main` workflow that runs the identical gates, builds, and deploys to the live channel — stated plainly as the project's production cutover, not a routine deploy.
- A minimum-privilege, auditable authentication path: a dedicated GCP service account (not a reused default), scoped to exactly the two roles the deploy action needs, with the exact command sequence to create it, key it, and store the key as a GitHub secret.
- A `VITE_GA_MEASUREMENT_ID` passthrough that fails the *production* build loudly when the variable is missing — closing SP05 §4.3's own named risk ("a silently-missing analytics ID is exactly the kind of gap that goes unnoticed for months") — while deliberately not failing preview builds, which shouldn't be sending analytics regardless.
- A concurrency policy that cancels a stale, in-flight deploy the moment a newer push/PR-update supersedes it, per workflow, keyed on ref.
- An explicit, narrow scope statement for what this pipeline does *not* attempt — no test suite (none exists), no performance budgets, no dependency scanning, no link-rot/uptime automation — so the pipeline doesn't quietly grow into something nobody asked for.
- Every sibling PRD's now-stale "no CI" / "manually-run" language corrected in the same pass this PRD lands, so no two documents in this planning folder disagree about whether CI exists (§9's cross-reference list, and the reconciliation performed directly in SP01/SP02/SP04/SP05/SP06/`README.md`/`BRIEF.md`).

## 3. Non-Goals

- **A test suite.** None of the six sibling PRDs' `npm run test` scripts amount to a CI-gateable suite yet (each sub-project's own `§7 Testing` section describes tests to be written alongside implementation, not a command this pipeline can assume exists and trust today). Wiring `npm test` into CI is a natural, cheap future addition once real test files exist — not designed here, and not a launch blocker, since the four gates this PRD does wire (typecheck, no-forms, launch-content, build) already catch the failure modes this project has actually named as risks.
- **Lighthouse or any performance budget.** Never named as a goal anywhere in the brief or any sibling PRD; adding one now would be scope invented by this sub-project, not asked for.
- **Dependency/vulnerability scanning** (Dependabot, `npm audit` as a gate, Snyk, etc.). A reasonable thing to turn on for any repo, but orthogonal to "build and deploy correctly," which is this PRD's actual mandate — bundling it in here would make a future decision to add or decline it look like it was already litigated when it wasn't.
- **Automated external-link-rot checking.** Brief §3 (Validation & failure) states this explicitly: "External link rot checked by hand." CI adoption doesn't reopen that decision — nothing here changes the brief's own resolution of it.
- **Uptime monitoring for hosted `/live` projects.** Brief §4's non-goal, unchanged. A `/live` page returning a 500 in production is not something this pipeline detects — it only proves the build succeeded at merge time, not that the deployed artifact keeps working afterward.
- **Branch protection rules requiring CI to pass before merge.** A real, cheap, valuable follow-up (`gh api repos/.../branches/main/protection` or the GitHub UI), but it's a repo *setting*, not a workflow file, and it's the kind of one-click owner action this PRD flags in §8 rather than designs — nothing about the two workflows below depends on it existing.
- **Rewriting or replacing `check:launch`, `check:no-forms`, or the `prebuild` OG/sitemap generators.** This PRD invokes them exactly as SP02/SP04/SP06 built them. The one exception, called out explicitly and not silently: SP01's `package.json` is missing a standalone `typecheck` script and a `tsx` devDependency that `check:launch` already depends on — both real, narrow gaps this PRD's own design surfaces and closes in SP01 directly (§4.10), not a redesign of anything either script does.
- **True Workload Identity Federation.** The strictly better long-term credential story for GCP↔GitHub auth; deliberately deferred (§4.6, §9) in favor of a rotatable JSON key, given this is a single-maintainer personal portfolio today.

---

## 4. Architecture Decisions

### 4.1 File map

```
.github/
└── workflows/
    ├── firebase-hosting-pull-request.yml   # NEW — preview channel on every PR
    └── firebase-hosting-merge.yml          # NEW — live channel on push to main

package.json                                 # MODIFIED (SP01-owned file) — §4.10
```

Nothing else in the repo changes. No application code, no new `src/` files, no new content. The two workflow files and the small `package.json` addition are the entirety of this sub-project's on-disk footprint; the rest of its surface (the service account, the secret, the repository variable) lives in GCP/GitHub, not in the repo, and is provisioned via the commands in §4.6/§4.7.

### 4.2 Shared job shape

Both workflows run one job each, and both jobs run the identical sequence of steps through the build — they diverge only at the deploy step (preview channel vs. live channel) and in one extra guard step the merge workflow alone carries (§4.7). Stating the shared shape once here rather than per-workflow, since it's the same reasoning in both places:

1. `actions/checkout@v4` — the only way any later step sees the repo's actual content.
2. `actions/setup-node@v4` with `node-version: 20` (matching the build machine's installed `v20.20.1`, SP01's own stated target) and `cache: npm` (keys off `package-lock.json` automatically — a `npm ci`-based workflow gets this for free with no extra cache-action wiring).
3. `npm ci` — not `npm install`. `npm ci` requires and trusts `package-lock.json` exactly, deletes `node_modules` first, and fails outright if the lockfile and `package.json` disagree — the correct, deterministic install command for a CI runner that must reproduce the same dependency tree every time, versus a developer's local `npm install`, which is allowed to update the lockfile.
4. **Three quality gates, as separate named steps — deliberately not chained with `&&` into one shell line.** The task's own reasoning is worth restating because it drove the choice directly: a failure in a chained `&&` command shows up in the Actions UI as one red step with a wall of combined output to scroll through to find which command actually failed; a separate named step fails with its own name lit up red in the job summary — `Typecheck`, `Check — no forms in hosted /live pages`, `Check — pre-launch content gate` are each immediately identifiable without opening logs.
   - `npm run typecheck` (`tsc -b --noEmit` — §4.10 adds this as its own script; SP01's existing `build` script already runs this too, so the redundancy is deliberate and cheap, see §4.10. `-b` is required: the root `tsconfig.json` is solution-style, and a plain `tsc --noEmit` against it checks zero files and always exits 0 — see SP01 Task 3.).
   - `npm run check:no-forms` (SP04 §4.8 — scoped grep against `src/pages/live/`).
   - `npm run check:launch` (SP02 §4.9 — `DRAFT_DATE`/`demo: true` gate; per SP04 §4.8's own composition, this already runs `check:no-forms` a second time internally — accepted, not fixed, see §4.10's note on why).
5. `npm run build` (`npm run typecheck && vite-react-ssg build`, per SP01 §4.2 — this is also where SP06's `prebuild` lifecycle hook fires automatically and regenerates every OG card and the sitemap before Vite's own build step runs, per npm's own `pre<script>` convention, SP06 §4.3).
6. `FirebaseExtended/action-hosting-deploy@v0` — the official Firebase-maintained deploy action; it reads `dist/` (via `firebase.json`'s `public: "dist"`, confirmed matching in §4.1's cross-check below) and pushes it to a preview channel or the live channel depending on the inputs each workflow supplies.

**Why one job with sequential steps, not several parallel jobs (a `typecheck` job, a `content-checks` job, a `build` job that both depend on, etc.).** GitHub Actions supports fanning independent steps out into parallel jobs precisely to shorten wall-clock time on larger pipelines — genuinely worth doing once a pipeline's steps take minutes each and run on independent inputs. Neither condition holds here: `tsc --noEmit`, the two content-gate scripts, and `vite-react-ssg build` each run in low single-digit seconds to (at the outside) low tens of seconds on a project this size, and — the more binding reason — `check:launch` and `check:no-forms` both need `node_modules` from the same `npm ci` and read the same `src/` checkout `Build` also needs, so splitting them into separate jobs would mean either re-running `checkout`/`setup-node`/`npm ci` per job (paying the fixed per-job startup cost three or four times over, easily dwarfing the seconds actually saved) or wiring up `actions/upload-artifact`/`download-artifact` to share a single install across jobs — real added complexity (a second YAML mechanism, artifact retention to think about) to shave a handful of seconds off a pipeline that already finishes in well under two minutes end to end. One job, sequential steps, stays the simpler design for a pipeline this size — revisit only if `npm run build` itself grows heavy enough (real end-to-end/browser tests, a genuinely slow OG-card render pass at a much larger content scale) that parallelizing actually pays for its own overhead.

This shape is intentionally the same shape `firebase init hosting:github` would have scaffolded (§4.6 discusses that alternative directly) — the point of hand-authoring instead isn't to invent a different pipeline, it's to get one that's actually correct for this project's real build command and real output directory from the first commit, rather than generated against Gatsby and needing the exact edits SP01 §4.9 had already anticipated would be necessary.

**Cross-check: `firebase.json`'s `public: "dist"` (SP01 §4.9) matches both workflows.** `action-hosting-deploy@v0` doesn't take an explicit "public directory" input — it reads `firebase.json` from the checkout directly, the same file SP01 already ships with `"public": "dist"`. Confirmed no divergence: neither workflow below overrides or duplicates that value; both rely on the committed `firebase.json` being correct, which is SP01's contract, not this PRD's.

**A gate failing stops the job — this is GitHub Actions' own default, not something either workflow configures explicitly.** Every step in a job runs sequentially, and unless a step is marked `continue-on-error: true` (neither workflow uses it, anywhere), the first step to exit non-zero halts the job immediately — every step after it, including `Build` and the deploy step, is skipped outright and shown as "skipped" rather than "failed" in the Actions UI. Concretely: a `check:no-forms` violation means the job never reaches `Build`, which means `dist/` is never produced, which means the deploy step never runs — there is no code path in either workflow where a failing gate still results in a deploy. This is worth stating explicitly rather than leaving implicit, since it's the entire mechanism by which "the gates are enforced" is actually true — nothing about `FirebaseExtended/action-hosting-deploy@v0` itself checks whether the earlier steps passed; it simply never executes if they didn't.

**`permissions:` blocks are scoped per job, least-privilege, not left at the repository's default.** GitHub issues each workflow run its own short-lived `GITHUB_TOKEN` (distinct from, and unrelated to, the long-lived `FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99` secret §4.5 provisions) — by default, on a repo without an explicit workflow-level `permissions:` block, that token can carry broad read/write access across many GitHub API surfaces the job never touches. Both workflows below declare their own minimal `permissions:` instead: the merge workflow needs only `contents: read` (to check out the repo — it never writes anything back to GitHub); the PR workflow additionally needs `pull-requests: write` (so `action-hosting-deploy@v0` can post/update its preview-URL comment) and `checks: write` (the action's own documented requirement for reporting deploy status back to the PR's checks list). Neither ever needs `contents: write`, `issues: write`, or any of the token's other possible scopes — declaring the narrow set explicitly means a workflow-definition bug (a typo'd step, an unexpected third-party action added later) inherits a smaller blast radius by construction, the same reasoning §4.5 applies to the Firebase service account's own two-role scope.

### 4.3 `firebase-hosting-pull-request.yml` — preview channel

```yaml
name: Deploy to Firebase Hosting on PR

on:
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build_and_preview:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      checks: write
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Check — no forms in hosted /live pages
        run: npm run check:no-forms

      - name: Check — pre-launch content gate
        run: npm run check:launch

      - name: Build
        run: npm run build
        env:
          # Deliberately no failure guard here (unlike the merge workflow,
          # §4.5) — preview builds should not be sending analytics at all,
          # so an empty value is the CORRECT state for a PR build, not a
          # misconfiguration to catch. See §4.7 for the full asymmetry.
          VITE_GA_MEASUREMENT_ID: ${{ vars.VITE_GA_MEASUREMENT_ID }}

      - name: Deploy preview channel
        # Repository secrets are never exposed to a workflow run triggered by
        # a pull_request from a fork — GitHub's own security boundary, not a
        # bug. Without this guard, a fork PR would reach this step, find
        # `secrets.FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99` empty, and fail
        # with a raw "invalid credentials" error from the deploy action —
        # confusing for anyone who didn't already know why. This is a
        # personal portfolio repo; a fork PR from a stranger is unlikely, but
        # the guard costs one line and turns a baffling failure into a clean,
        # silent skip. See §4.8.
        if: github.event.pull_request.head.repo.full_name == github.repository
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99 }}'
          projectId: tejitpabari-99
          expires: 7d
```

**How the preview URL reaches the PR.** `action-hosting-deploy@v0` handles this itself — given `pull_request` context, `pull-requests: write` permission, and a `repoToken`, it posts (and updates, on re-runs) a single PR comment containing the deployed preview URL and its expiry. No extra step or third-party comment action is needed; this is the action's own documented `pull_request`-triggered behavior, which is the entire reason to use the official action rather than hand-rolling `firebase hosting:channel:deploy` plus a separate comment step.

**Channel ID and lifetime.** No explicit `channelId` input — left to the action's own default, which derives a stable per-PR channel name so pushing new commits to the same PR updates the *same* preview channel/URL rather than creating a new one each time (matching what `firebase init hosting:github`'s own scaffold produces, and the behavior described in §4.6). `expires: 7d` (§4.9) means an abandoned or long-stale PR's preview channel self-deletes rather than accumulating indefinitely.

**Trigger scope — `on: pull_request` with no explicit `types:` list, deliberately.** Left at GitHub's own default set (`opened`, `synchronize`, `reopened`) rather than pinned explicitly. `synchronize` is the one that matters most in practice — it's what fires on every subsequent push to an already-open PR's branch, which is exactly what makes "push a second commit, watch the first run cancel via concurrency" (§4.8, and Testing item 3) a real, everyday behavior rather than a one-time-only trigger on PR creation. Not included: `edited` (a PR's title/description changing doesn't warrant a rebuild) and `ready_for_review` (this repo has no draft-PR convention established anywhere in the six sibling PRDs, so there's no "don't preview a draft" distinction to encode). Narrowing the default further isn't warranted — a solo maintainer's own PRs don't need protection against a noisy default trigger set the way a large team's repo might.

### 4.4 `firebase-hosting-merge.yml` — live channel

```yaml
name: Deploy to Firebase Hosting on merge

on:
  push:
    branches:
      - main

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Check — no forms in hosted /live pages
        run: npm run check:no-forms

      - name: Check — pre-launch content gate
        run: npm run check:launch

      - name: Verify VITE_GA_MEASUREMENT_ID is set
        # Fails LOUDLY here, unlike the PR workflow (§4.3) — see §4.7 for the
        # full reasoning. This is the one step that exists only in this
        # workflow, not the preview one.
        run: |
          if [ -z "${{ vars.VITE_GA_MEASUREMENT_ID }}" ]; then
            echo "::error::VITE_GA_MEASUREMENT_ID repository variable is empty or unset."
            echo "::error::A production build with no measurement ID does NOT fail — loadGa()'s"
            echo "::error::missing-ID guard (SP05 SS4.3) makes it a silent, working no-op instead."
            echo "::error::That is exactly the failure mode this check exists to catch loudly,"
            echo "::error::here, instead of quietly, in GA4, a month from now. Set it with:"
            echo "::error::  gh variable set VITE_GA_MEASUREMENT_ID --body \"G-9NLS3NG63M\""
            exit 1
          fi
          echo "VITE_GA_MEASUREMENT_ID is set."

      - name: Build
        run: npm run build
        env:
          VITE_GA_MEASUREMENT_ID: ${{ vars.VITE_GA_MEASUREMENT_ID }}

      - name: Deploy to live channel
        # No fork-PR guard needed here — this workflow triggers only on
        # `push` to `main`, which by definition never runs against a fork's
        # copy of the repo. See §4.8.
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99 }}'
          projectId: tejitpabari-99
          channelId: live
```

**The operational consequence, stated as plainly as it can be stated: merging `website-revamp` into `main` IS the production cutover.** There is no separate "deploy" step or button anywhere in this design — the moment a push lands on `main` (whether by merging this branch, or any future commit), this workflow runs the full gate sequence and, if every gate passes, deploys straight to the live channel at `tejitpabari-99`'s production Hosting site (and, once DNS finishes propagating per SP01 §4.9, `tejitpabari.com` itself). Before merging `website-revamp`, that means: every gate genuinely passing is necessary but not sufficient to merge — the owner still has to *want* what's on the branch to go live at that moment, because there's no reviewable staging step between "the merge completes" and "the internet sees it." The PR-preview workflow (§4.3) is what fills that gap in practice: check the preview channel first, merge only once it looks right.

**Why `channelId: live` and not the action's other, undocumented default.** Firebase Hosting's model is: exactly one channel, `live`, is the one your custom domain (`tejitpabari.com`) and default `*.web.app` URL actually serve; every other channel is a preview, invisible to normal visitors. Naming it explicitly here (`channelId: live`) rather than relying on the action inferring it from a non-`pull_request` trigger removes any ambiguity about which channel a `main`-branch deploy targets — matching exactly what `firebase init hosting:github`'s own scaffold generates for its merge workflow (§4.6).

**A residual risk worth naming directly: a failed merge-workflow run does not undo the git merge that triggered it.** If every gate on a PR's preview run passed, the PR merged, and then the *merge* workflow's own build somehow fails anyway (a flaky dependency install, a transient `npm ci` network error, a difference in the `VITE_GA_MEASUREMENT_ID` check specifically since the preview workflow never runs that guard — §4.6) — `main`'s git history now contains that commit regardless of whether the workflow succeeded. The live channel simply stays on whatever it was already serving (the previous successful deploy, or, on the very first run, the holding page, §4.12) — Hosting is never left in a half-deployed state, since the deploy step never starts unless every gate before it (§4.2's fail-fast behavior) already passed. The actual residual risk is narrower than "a broken site goes live": it's "`main` can end up ahead of what's actually deployed," discoverable by comparing the latest commit on `main` against the Firebase Hosting console's release history (below) — not automatically reconciled by anything in this pipeline, and not worth building automatic reconciliation for at this project's scale (a solo maintainer noticing a red run on their own recent merge is a sufficient detection mechanism here).

**How to actually roll back if a bad build *does* reach the live channel** — reachable only if a change passes every gate and still turns out wrong in some way none of the gates catch (a content typo, a real but undesired visual regression — nothing this pipeline's four gates are designed to catch, since none of them inspects rendered output). Firebase Hosting keeps every previous deploy as a numbered release, and rolling back is a platform feature this pipeline doesn't need to build any support for:

```bash
# List recent releases for the live channel, newest first.
firebase hosting:releases:list --project tejitpabari-99

# Roll back to a specific prior release (also available as a one-click
# "Rollback" button in the Firebase Hosting console next to any past
# release — the console path needs no command at all).
firebase hosting:clone tejitpabari-99:<PREVIOUS_RELEASE_ID> tejitpabari-99:live
```

Deliberately not automated into either workflow (§4.11's "what CI does not do" — no automated post-deploy smoke test exists to *trigger* an automatic rollback from, and building one would be real, unscoped new work). Both commands are read-only-adjacent (they read release history / clone a known-good prior release forward) rather than destructive, and are exactly the kind of one-off recovery action that belongs in the owner's hands at the moment it's actually needed, not pre-wired into a pipeline that otherwise has nothing to roll back from on any normal run.

### 4.5 Authentication — a dedicated service account, not a reused default

**Do not reuse `firebase-adminsdk-fbsvc@tejitpabari-99.iam.gserviceaccount.com`.** Confirmed by listing the project's service accounts directly (`gcloud iam service-accounts list --project=tejitpabari-99`): that account already exists, auto-created when the Firebase project was set up, and by convention carries the broad Firebase Admin SDK role set — far more than a Hosting-only CI deploy needs. Minting a new, purpose-built account scoped to exactly two roles is the minimum-privilege choice: if this account's key ever leaks, the blast radius is "someone can deploy to Hosting and read Hosting config," not "someone has admin access to every Firebase service on the project."

**The two roles, and why exactly these two and no more:**

| Role | Why it's needed |
|---|---|
| `roles/firebasehosting.admin` | Full read/write on Firebase Hosting resources — creating/updating preview channels, deploying to the live channel, setting the expiry on preview channels. This is the actual deploy permission `action-hosting-deploy@v0` exercises. |
| `roles/firebase.viewer` | Read-only project-level access the Firebase Hosting CLI/action machinery needs to resolve basic project metadata (confirm the project exists, read its default resources) before it can act on Hosting specifically. Confirmed as the standard minimum pairing Firebase's own documentation and the `firebase init hosting:github` flow both grant alongside `firebasehosting.admin` — `firebasehosting.admin` alone is not sufficient for the action to complete a deploy. |

No `roles/editor`, no `roles/owner`, no Firestore/Storage/Functions roles — none of which this project uses (brief §4: no backend, no database) and none of which a Hosting-only CI job has any reason to touch.

**Exact command sequence — runnable as given, in order, by whoever has `gcloud`/`gh` access to this project (owner or an agent working on their behalf, per this machine's standing access):**

```bash
# 1. Create the dedicated service account.
gcloud iam service-accounts create github-actions-deploy \
  --project=tejitpabari-99 \
  --display-name="GitHub Actions — Firebase Hosting deploy"

# 2. Grant the Hosting admin role — the actual deploy permission.
gcloud projects add-iam-policy-binding tejitpabari-99 \
  --member="serviceAccount:github-actions-deploy@tejitpabari-99.iam.gserviceaccount.com" \
  --role="roles/firebasehosting.admin"

# 3. Grant the Firebase viewer role — the minimum project-read permission
#    the deploy action needs alongside Hosting admin.
gcloud projects add-iam-policy-binding tejitpabari-99 \
  --member="serviceAccount:github-actions-deploy@tejitpabari-99.iam.gserviceaccount.com" \
  --role="roles/firebase.viewer"

# 4. Create the JSON key. This file is a long-lived credential the moment it
#    touches disk — treat it exactly like a password, not like a config file.
gcloud iam service-accounts keys create ~/tejitpabari-99-github-actions-key.json \
  --iam-account=github-actions-deploy@tejitpabari-99.iam.gserviceaccount.com

# 5. Upload the key as the GitHub repository secret the workflows above
#    reference — piping the file directly, never pasting its contents
#    anywhere else (a shell history, a chat message, a second file).
gh secret set FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99 \
  --repo tejitpabari99/tejitpabari \
  < ~/tejitpabari-99-github-actions-key.json

# 6. Delete the local copy immediately once step 5 succeeds. GitHub's secret
#    store now holds the only copy this workflow needs; a lingering local
#    file is pure downside (accidental commit, a laptop/backup compromise)
#    with zero further use.
rm ~/tejitpabari-99-github-actions-key.json
```

**State this plainly, not just imply it: the JSON key produced in step 4 is a long-lived credential.** Unlike a short-lived OAuth token, it doesn't expire on its own — it remains valid until someone explicitly deletes it (`gcloud iam service-accounts keys delete`) or deletes the service account itself. Two consequences that follow directly: it must never be committed to the repo (not even briefly, not even on a scratch branch — `git log` doesn't forget), and the local file from step 4 must be deleted the moment it's safely inside GitHub's encrypted secret store (step 6), not left sitting in a home directory indefinitely "just in case."

**Rotating or revoking the key later — the concrete procedure the `[DEFERRED]` WIF trade-off in §9 leans on.** Because the key is a static credential with no built-in expiry, "how do we get out of trouble if it leaks" needs a real answer, not just a promise. The answer is three commands, none of which touch the workflow YAML at all: `gcloud iam service-accounts keys list --iam-account=github-actions-deploy@tejitpabari-99.iam.gserviceaccount.com` (find the key's ID), `gcloud iam service-accounts keys create` a replacement (step 4 above, repeatable any time), `gh secret set FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99 < <new key file>` to overwrite the stored secret, then `gcloud iam service-accounts keys delete <old key ID> --iam-account=github-actions-deploy@tejitpabari-99.iam.gserviceaccount.com` to invalidate the old one immediately. Total downtime: zero — the next workflow run simply picks up the new secret value; nothing needs coordinating with an in-flight deploy. This is the concrete reason §9 can defer WIF rather than treat a leaked key as catastrophic: rotation is cheap and fast precisely because the credential's blast radius is already minimized to two Hosting-only roles (this section's own opening point).

**The alternative: `firebase init hosting:github`.** Firebase's CLI ships an interactive command that automates this entire flow end-to-end — it creates the service account, grants the roles, generates and uploads the key as a repository secret, and scaffolds both workflow YAML files in one guided session, no manual `gcloud`/`gh` calls needed. **This is genuinely the recommended path for a human running it interactively at a keyboard** — it's the same underlying mechanism this PRD's manual command sequence reproduces, with less room for a typo in a role name or a copy-paste key mishap. It is not what this PRD tells an agent to run, for a narrower reason: the task instructions for this PRD explicitly prohibit running any `gcloud`/`gh` command that mutates project state, and `firebase init hosting:github` is unavoidably interactive and mutating (it writes files, creates a service account, and sets a secret in the same session with no dry-run mode). The manual command sequence above exists specifically so this exact provisioning is fully specified, reviewable, and re-runnable by the owner (or an agent explicitly authorized to mutate) without needing to sit through an interactive CLI prompt flow. **Recommendation: whoever actually runs this — owner or a future authorized agent — is free to use either path; the six commands above are the manual equivalent of what `firebase init hosting:github` would do automatically, kept explicit here because that's what this PRD is allowed to specify without executing.**

### 4.6 `VITE_GA_MEASUREMENT_ID` — a repository variable, not a secret, with a deliberate fail-loud/fail-quiet asymmetry

**Why a repository *variable* (`vars.VITE_GA_MEASUREMENT_ID`), not a secret.** SP05 §4.3 already states this reasoning for `.env.example`'s committed default — it transfers directly to the CI storage choice: a GA4 measurement ID (`G-9NLS3NG63M`) is emitted in plaintext in the page's own HTML on every single load (both the `gtag.js` script-tag `src` and the `gtag('config', ...)` call embed it directly). Storing it as a GitHub *secret* — which exists specifically to keep a value out of logs and diffs — implies a confidentiality the value does not have, and actively makes it *harder* to inspect what's configured (`gh variable list` shows the value; `gh secret list` never does, by design). Using a variable is the honest storage class for a value that was never meant to be hidden.

```bash
gh variable set VITE_GA_MEASUREMENT_ID \
  --repo tejitpabari99/tejitpabari \
  --body "G-9NLS3NG63M"
```

**The failure mode this is designed against, stated exactly as SP05 §4.3 already names it: "a silently-missing analytics ID is exactly the kind of gap that goes unnoticed for months."** Trace what actually happens if this variable is empty or never set: `vite-react-ssg build` still succeeds (nothing in the app code requires a GA ID to compile or render). The deployed site still works correctly for every visitor — every route renders, every link works, nothing looks broken. `loadGa()`'s own missing-ID guard (SP05 §4.3, `if (!GA_MEASUREMENT_ID) return false;`) makes analytics collection quietly no-op instead of erroring. The only visible symptom is an empty GA4 real-time dashboard — and because nothing about the deployed site itself is wrong, there's no reason for anyone to go looking at that dashboard until, say, a monthly traffic review turns up nothing and someone finally asks why. That's the exact gap a CI *build* succeeding gives zero signal about on its own.

**Designed against directly: the merge workflow's `Verify VITE_GA_MEASUREMENT_ID is set` step (§4.4) fails the entire workflow — not the build, the earlier explicit check step — the moment `vars.VITE_GA_MEASUREMENT_ID` resolves to an empty string.** This is deliberately a *separate* step from `Build`, not a check folded into the build script itself: a standalone, named, one-line bash conditional is something anyone reading the Actions UI understands instantly ("VITE_GA_MEASUREMENT_ID is empty" is unambiguous), versus a build failing for a reason buried in `vite-react-ssg`'s own output. Note what this step does *not* do: it doesn't validate the ID's *shape* (a real `G-XXXXXXXXXX` pattern vs. some other non-empty garbage string) — that's a materially smaller, lower-value check this PRD deliberately doesn't add, since the actual named risk (§4.3's framing) is a *missing* value going unnoticed, not a malformed-but-present one.

**The deliberate asymmetry: the PR-preview workflow (§4.3) carries no such guard, and that's a design decision, not an oversight.** Two independent reasons converge on the same answer:

1. **Preview builds should not be sending analytics at all.** A visitor loading a PR preview URL is (almost always) the owner themselves, testing a not-yet-merged change — counting that as real traffic in GA4 would pollute the one signal the brief calls out as genuinely valuable (brief §2: "search queries typed on `/projects`" and section scroll depth as the highest-value analytics). An *empty* `VITE_GA_MEASUREMENT_ID` on a preview build is therefore the *correct*, wanted state, not a misconfiguration — `loadGa()`'s guard doing exactly what it's designed to do.
2. **Blocking every PR on a variable whose absence is expected there would train exactly the wrong reflex.** If the preview workflow failed loudly on a missing ID the same way the merge workflow does, the fix available to a contributor mid-PR would be to set the *repository* variable just to unblock a PR check — which would then also (correctly, but unintentionally) turn analytics on for every future preview deploy too, defeating point 1 above.

Symmetrically: because the repository variable, once set for production use, is also what the preview workflow reads (§4.3's build step passes the same `vars.VITE_GA_MEASUREMENT_ID`), a preview deploy technically *could* load real GA in practice once the variable exists for the merge workflow's sake — an accepted, minor, stated trade-off, not a contradiction of point 1: `import.meta.env.DEV` (the *other* independent guard in `shouldLoadGa()`, SP05 §4.3) doesn't help here either, since a genuine production-mode build is what both CI workflows run. The clean fix (a second, preview-only empty override) is more machinery than this asymmetry is worth for a personal-portfolio preview channel whose actual visitor is the owner checking their own change — flagged as a deliberate, low-stakes simplification in §9, not silently accepted.

### 4.7 Fork-PR guard

Repository secrets — `secrets.FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99` specifically — are never exposed to a workflow run triggered by a `pull_request` from a forked repository. This is GitHub's own platform-level security boundary (a fork's maintainer could otherwise submit a PR that exfiltrates the base repo's secrets through workflow logs or an external HTTP call), not something this project opted into or could opt out of.

**Without an explicit guard, a fork PR would run every gate step successfully — checkout, install, typecheck, both content checks, build all succeed on a fork's code using no secrets at all — and then fail at the deploy step**, where `secrets.FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99` resolves to an empty string and `action-hosting-deploy@v0` reports some flavor of "invalid credentials" or "malformed service account JSON" — a genuinely confusing failure for anyone who submitted a PR in good faith and has no way to know the *real* reason is "you're not a repo collaborator, this is by design."

**The guard, on the deploy step specifically (§4.3), not the whole job:**

```yaml
if: github.event.pull_request.head.repo.full_name == github.repository
```

Placed on the `Deploy preview channel` step alone, not as a job-level `if:`, deliberately: the quality gates (typecheck, `check:no-forms`, `check:launch`) and the build itself need no secret at all and are genuinely useful signal on a fork PR too (confirming a contribution actually compiles and passes content checks) — gating the *entire job* on same-repo-origin would throw that away for no reason, when the actual problem is narrowly "the deploy step alone needs a secret forks don't have."

**Stated plainly, since it changes how much this guard actually matters day to day: this is a personal portfolio repository, and a fork PR from an unrelated contributor is unlikely.** The guard costs exactly one line and turns a failure mode that would otherwise read as a broken pipeline into a clean, silent skip with a specific, correct explanation available in the step's own condition if anyone goes looking. Cheap enough to include unconditionally regardless of how likely the scenario is.

### 4.8 Concurrency

Both workflows declare:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

**Why this matters concretely for each workflow.** On the PR workflow, `github.ref` for a `pull_request` event resolves to `refs/pull/<number>/merge` — already unique per PR, so pushing three commits to the same PR in quick succession (a common editing pattern while iterating on a change) cancels the first two in-flight runs the moment a newer one starts, rather than racing three separate deploys to update the same preview channel out of order (where the *last one to finish*, not the last one *pushed*, could win and leave a stale preview live). On the merge workflow, `github.ref` for a `push` to `main` is always `refs/heads/main` — meaning the group is effectively a single lane for the live channel: two rapid merges to `main` in succession cancel the first deploy in favor of the second, rather than both racing to write the live channel and leaving its final state non-deterministic. `github.workflow` is included in the group key so the two workflows' concurrency groups never collide with each other (a PR-triggered run and a push-triggered run keyed on the same ref would otherwise be indistinguishable).

### 4.9 Preview channel expiry

`expires: 7d` on the PR-preview workflow's deploy step (§4.3) only — the live channel has no expiry concept (it's the one channel meant to persist indefinitely). A preview channel abandoned alongside a PR that's closed without merging, or one belonging to a PR left open for a long-running discussion, self-deletes seven days after its last deploy rather than accumulating as dead Hosting storage indefinitely. Seven days comfortably covers the realistic review cycle for a solo maintainer's own PRs (open, look at the preview, merge or iterate, typically same day) while not requiring any manual channel cleanup ever.

### 4.10 `package.json` reconciliation — the `typecheck` script and the missing `tsx` dependency

Two real gaps this PRD's own design surfaced while tracing exactly which npm scripts the workflows above call — both are one-line fixes to SP01-owned `package.json`, made directly here rather than left as a note for someone else, since "every script the workflow invokes must already exist" is this sub-project's own stated precondition (see the header block above).

**Gap 1 — no standalone `typecheck` script exists anywhere in the sibling PRDs.** SP01 §4.2's `build` script is `"build": "tsc --noEmit && vite-react-ssg build"` — type-checking already happens, but only bundled inside `build`, with no way to run it, or name it as a distinct CI step, on its own. §4.2 above explains why a separate named step is worth having regardless of that redundancy: a `Typecheck` step failing red in the Actions UI is immediately legible; a `Build` step failing could mean a type error *or* a `vite-react-ssg` bundling failure, and the UI gives no hint which without opening the log. **Fix:** add `"typecheck": "tsc --noEmit"` as its own script. **The resulting redundancy — `tsc --noEmit` running twice in a row in CI (once as `Typecheck`, again as the first half of `Build`) — is accepted deliberately, not fixed by trimming `build`'s own `tsc --noEmit`.** Trimming it would mean `npm run build` run by itself (a developer's own local pre-deploy sanity check, or any future non-CI context) stops catching type errors on its own — a behavior change to a script three other sub-projects already document and rely on (SP01 §4.2, SP06 §4.3's wiring note) for reasons having nothing to do with CI. `tsc --noEmit` on a project this size runs in low single-digit seconds; paying that twice per CI run is a trivial cost next to keeping `build`'s existing, already-documented meaning intact everywhere it's used. (Corrected during SP01 implementation, inherited here: the root `tsconfig.json` is solution-style (`"files": []` + `references`), so a plain `tsc --noEmit` checks zero files and always exits 0 — the actual scripts are `"typecheck": "tsc -b --noEmit"` and `"build": "npm run typecheck && vite-react-ssg build"`; see SP01 Task 3. Every "twice per CI run" and "low single-digit seconds" argument above still holds — `tsc -b --noEmit` is not meaningfully slower — only the exact invocation changes.)

**Gap 2 — `tsx` (the TypeScript-executing CLI `check:launch` depends on) is never declared as a dependency anywhere.** SP02 §4.9 wires `"check:launch": "tsx scripts/check-launch-content.ts"` — the command literally invokes a binary named `tsx` — but no sibling PRD's `package.json` snippet (SP01 §4.2's canonical one included) lists `tsx` under `devDependencies`. On a developer's machine this can go unnoticed (a global `tsx` install, or `npx`'s auto-install-on-demand silently reaching out to the registry) — in a CI runner built from a clean `npm ci`, there is no global anything and no implicit network fallback to paper over a missing local dependency: `npm run check:launch` would fail immediately with `sh: tsx: command not found`, on the very first CI run, for a reason having nothing to do with content correctness. **Fix:** add `"tsx": "^4.19.2"` to SP01's `devDependencies`.

**The reconciled `package.json` scripts block** (SP01's existing entries unchanged except the one addition; SP02's `check:launch`, SP04's `check:no-forms`, and SP06's `prebuild` reproduced here exactly as their own PRDs define them, to show the complete, composed picture this pipeline actually runs):

```json
{
  "scripts": {
    "dev": "vite-react-ssg dev",
    "typecheck": "tsc -b --noEmit",
    "prebuild": "node scripts/generate-og-cards.mjs && node scripts/generate-sitemap.mjs",
    "build": "npm run typecheck && vite-react-ssg build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run",
    "format": "prettier --write \"**/*.{ts,tsx,json,md,css}\"",
    "check:no-forms": "bash scripts/check-no-forms.sh",
    "check:launch": "tsx scripts/check-launch-content.ts && npm run check:no-forms"
  }
}
```

`prebuild` (SP06 §4.3) fires automatically via npm's own lifecycle convention the instant anything runs `npm run build` — including the `Build` step in both workflows above — so neither workflow file references `prebuild` directly; it's implicit in step 5 of §4.2, exactly as SP06 designed it to be. `check:launch` already internally re-runs `check:no-forms` (SP04 §4.8's own composition) — meaning the CI job's three-gate sequence runs the no-forms check twice in total (once standalone, once inside `check:launch`). Accepted for the identical reason as the `typecheck` redundancy above: the standalone step exists so a no-forms violation names itself immediately and specifically, rather than surfacing only as a sub-line inside `check:launch`'s combined output; the cost is one extra sub-second grep per CI run.

### 4.11 What CI does not do

Restated from §3 as a single scoped list, since it's worth having the negative space stated once, together, rather than only scattered across non-goal bullets — a build-and-deploy pipeline plus the three gates that already existed as scripts, nothing more:

- No test suite runs (none exists yet to run, §3).
- No Lighthouse score, bundle-size budget, or any other performance gate.
- No dependency/vulnerability scanning (`npm audit`, Dependabot, or otherwise).
- No automated external-link-rot checking — brief §3 keeps that a manual, by-hand check, unchanged by CI's existence.
- No uptime monitoring for hosted `/live` projects — brief §4's non-goal, unchanged.
- No branch-protection enforcement — whether `main` actually *requires* these workflows to pass before a merge is even possible is a repo setting this PRD flags as a cheap, valuable owner action (§8) but does not configure itself.
- No notification channel beyond GitHub's own surfaces. No Slack webhook, no email digest, no separate status dashboard — a failed run shows up exactly where GitHub already shows every workflow run (the Actions tab, and a red status inline on the PR/commit itself), and the PR-preview workflow's own PR comment (§4.3) is the one additional signal this PRD adds deliberately, because it's the one piece of information (the preview URL) that doesn't already exist anywhere else. A solo maintainer checking their own PR doesn't need a second notification surface for information already one click away.

### 4.12 The existing holding page — what the first merge-workflow run replaces

**tejitpabari-99's live Hosting channel currently serves a hand-built holding page that exists nowhere in this repo** — built by hand in a scratchpad directory and pushed with a one-off `firebase deploy`, entirely outside any of the six prior sub-projects' work. The moment this PRD's merge workflow (§4.4) runs successfully for the first time — which happens the first time anything is pushed to `main`, almost certainly the `website-revamp` merge itself — it deploys whatever `dist/` the rewrite produces straight to that same live channel, overwriting the holding page completely.

**Stated explicitly so it reads as intended behavior later, not an incident:** this is exactly the intended outcome, not an accidental clobber to be investigated or reverted. The holding page was always a placeholder occupying the live URL while the rewrite was in progress; it was never meant to persist past the rewrite's own launch, and it isn't tracked anywhere a future `git log` or `git blame` could find it to "restore." Nobody should attempt to bring it back after this pipeline's first successful run — there is nothing to restore from, and restoring it would mean deliberately reverting the actual launch this whole initiative exists to ship.

### 4.13 Verifying the provisioning — read-only commands, safe to run any time

Once §4.5's six commands and §4.6's `gh variable set` have been run by whoever has access, these confirm the result without mutating anything further — useful both as a first-time sanity check and as a standing "is this still configured correctly" check months later:

```bash
# Confirm the secret exists (never shows its value — gh secret list never
# does, by design, §4.6's own point about secrets vs. variables).
gh secret list --repo tejitpabari99/tejitpabari
# Expect: FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99   <updated-at date>

# Confirm the variable exists AND shows its actual value (the point of it
# being a variable, not a secret).
gh variable list --repo tejitpabari99/tejitpabari
# Expect: VITE_GA_MEASUREMENT_ID   G-9NLS3NG63M   <updated-at date>

# Confirm the service account carries exactly the two roles §4.5 grants —
# no more, no less.
gcloud projects get-iam-policy tejitpabari-99 \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions-deploy@tejitpabari-99.iam.gserviceaccount.com" \
  --format="table(bindings.role)"
# Expect exactly two rows: roles/firebasehosting.admin, roles/firebase.viewer

# Confirm no .github/workflows exist yet on main until item 3 of §8 is done,
# or confirm they DO exist (and match §4.3/§4.4 byte-for-byte) once it is.
git -C /root/projects/tejitpabari ls-tree -r main --name-only | grep '^\.github/workflows' || echo "none yet"
```

None of these four commands write anything — they're the direct, mechanical proof that §4.5/§4.6's provisioning actually happened and matches this PRD's design, rather than trusting the setup steps were followed correctly from memory.

### 4.14 Two decisions this PRD didn't have to make, stated anyway

Neither of these is genuinely contested — including them matches the brief's own decision-log discipline (§2 there: "every settled decision... nothing here is open for re-litigation") of writing down the alternative even when it was never seriously in the running, so a future reader doesn't wonder whether it was considered.

**Why GitHub Actions, and not a third-party CI provider (CircleCI, Travis, Buildkite, etc.).** The repo already lives on `github.com/tejitpabari99/tejitpabari`; `gh` is already authenticated against it (this machine's standing setup, confirmed §1). GitHub Actions is the only CI system that requires zero additional account, zero additional billing relationship, and zero additional place for secrets to live — the repository secret/variable store this PRD uses (§4.5/§4.6) is the same GitHub UI the owner already has access to. Nothing about this project's needs (a Node build, a Firebase deploy) benefits from any third-party CI product's specific feature set; introducing one would add an operational surface (another login, another dashboard, another place a webhook can silently break) for zero corresponding gain.

**Why `runs-on: ubuntu-latest`, left unpinned, unlike the exact-version pins SP01 §4.2 insists on for `react-router-dom`.** SP01's reasoning for pinning `react-router-dom` to `^6.14.1` specifically is that an unpinned install could silently resolve to an incompatible major version (`vite-react-ssg@0.9.2` targets React Router v6, and "latest" would grab v7). That risk doesn't transfer here: `ubuntu-latest` is a GitHub-maintained, GitHub-rotated label pointing at whichever Ubuntu LTS image GitHub currently designates default — this workflow's only OS-level dependency is "a Linux environment where Node 20 and bash exist," which every `ubuntu-latest` image satisfies regardless of which specific point release it resolves to on a given day. Pinning to an exact image version (`ubuntu-22.04`, say) would trade a real, live problem (an unpinned library grabbing a breaking major version) for a manufactured one (a workflow silently going stale against an image GitHub eventually stops updating) with no corresponding benefit — the two situations aren't actually analogous despite the surface similarity of "should this be pinned."

### 4.15 Why the official `action-hosting-deploy@v0`, not a hand-rolled `firebase deploy` step

The alternative genuinely considered: a plain shell step running `npx firebase-tools hosting:channel:deploy pr-${{ github.event.number }} --expires 7d --project tejitpabari-99` (preview) or `npx firebase-tools deploy --only hosting --project tejitpabari-99` (live), authenticated via `FIREBASE_TOKEN` or a service-account key passed to `firebase-tools` directly. Rejected in favor of the official action for three concrete reasons, not just "it's the standard choice":

1. **The PR-comment behavior (§4.3) would otherwise have to be hand-built.** A raw `firebase-tools hosting:channel:deploy` call prints the preview URL to its own stdout, in a format not meant for parsing — extracting it reliably and posting it as a PR comment would mean grepping the CLI's human-readable output (fragile against any future `firebase-tools` version bumping its own log format) or piping `--json` output through a second, hand-written comment step using `actions/github-script` or a similar action. `action-hosting-deploy@v0` already does exactly this, maintained by the same team that owns both the CLI and the Hosting product, so it can't drift out of sync with `firebase-tools`' own output format the way a hand-rolled parser could.
2. **Credential handling is the action's problem to keep correct, not this repo's.** The action accepts the service-account JSON directly via `firebaseServiceAccount` and handles authenticating `firebase-tools` internally; a hand-rolled step would need its own logic for writing the secret to a temp credentials file (or setting `GOOGLE_APPLICATION_CREDENTIALS`) and cleaning it up afterward — one more place a mistake could leave a credential written to a world-readable path on the runner's filesystem, however briefly.
3. **It's already the answer `firebase init hosting:github` (§4.6) would have scaffolded.** Since that's the reference flow this whole sub-project exists because the owner believed had already run, matching its actual output (this action, these inputs) rather than inventing a parallel hand-rolled equivalent keeps this design recognizable against Firebase's own documented pattern for exactly this integration — useful if the owner ever does run `firebase init hosting:github` later and wants to compare or merge the two.

---

## 5. API Change Summary

N/A. No backend, database, or API surface anywhere in this initiative (locked non-goal, brief §4, unchanged by this sub-project). The two GitHub Actions workflows are CI/CD configuration, not application code; the one thing resembling an "interface" this PRD defines is the `gh`/`gcloud` provisioning contract in §4.6 — a one-time, human/agent-run setup sequence, not a network boundary any other sub-project's code calls at runtime.

---

## 6. Frontend Change Summary

| Type | Name | Path | Notes |
|---|---|---|---|
| New | Preview-channel deploy workflow | `.github/workflows/firebase-hosting-pull-request.yml` | Triggers on `pull_request`; gates, builds, deploys to a 7-day preview channel; fork-PR-guarded deploy step |
| New | Live-channel deploy workflow | `.github/workflows/firebase-hosting-merge.yml` | Triggers on `push` to `main`; gates, fails loudly on a missing `VITE_GA_MEASUREMENT_ID`, builds, deploys to the live channel |
| Modified (SP01-owned file) | `package.json` | `package.json` | Adds `"typecheck": "tsc -b --noEmit"` script and `"tsx"` devDependency — §4.10 |
| New (external, not in repo) | Dedicated GCP service account | `github-actions-deploy@tejitpabari-99.iam.gserviceaccount.com` | `roles/firebasehosting.admin` + `roles/firebase.viewer` only — §4.5 |
| New (external, not in repo) | Repository secret | `FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99` | The service account's JSON key — §4.5 |
| New (external, not in repo) | Repository variable | `VITE_GA_MEASUREMENT_ID` | `G-9NLS3NG63M` — §4.6 |
| Consumed, not modified | `npm run typecheck`, `check:no-forms`, `check:launch`, `prebuild`, `build` | SP01/SP02/SP04/SP06 | Every script this pipeline invokes is owned and defined by an earlier sub-project — see §4.10 for the two small gaps closed directly in SP01's file |
| Consumed, not modified | `firebase.json`'s `"public": "dist"` | SP01 | Read directly by `action-hosting-deploy@v0`; confirmed matching, not duplicated, §4.2 |

No `src/` file, route, component, or content file changes anywhere in this sub-project — the only application-adjacent change is the two-line `package.json` addition in §4.10.

---

## 7. Testing

Sized like the sibling PRDs size theirs — this sub-project has no application logic to unit-test, so "testing" here means verifying the pipeline itself behaves as designed, once, against real GitHub Actions runs rather than a local test harness (no local tool faithfully simulates GitHub's own secret-scoping, concurrency, or fork-PR behavior):

**Walkthrough — tracing one real change end to end, since it's the clearest way to confirm every piece in §4 actually composes correctly rather than reading correctly in isolation:**

1. A content edit lands on a feature branch (say, correcting a typo in a project description) and a PR opens against `main`. `firebase-hosting-pull-request.yml` fires on `opened`. `actions/checkout@v4` pulls the branch; `setup-node@v4` provisions Node 20 with npm's cache restored from `package-lock.json`'s hash; `npm ci` installs a byte-identical `node_modules` to what the lockfile specifies, including the now-declared `tsx` (§4.10).
2. `Typecheck`, `Check — no forms in hosted /live pages`, and `Check — pre-launch content gate` run in order, each a separately named, separately pass/fail step. A typo in the edited markdown file that happened to also break frontmatter (an unrelated, contrived example) would be caught here — by `check:launch`, which imports `src/data` and inherits SP02's loader validation for free (SP02 §4.9) — before the pipeline spends any time on a build that was always going to fail anyway.
3. `Build` runs — SP06's `prebuild` hook fires first (regenerating every OG card and the sitemap, SP06 §4.3), then `npm run typecheck && vite-react-ssg build` produces `dist/`. `VITE_GA_MEASUREMENT_ID` is passed through from the repository variable; no failure guard runs here (§4.6's asymmetry) — if the variable happened to be unset, the build still succeeds, `loadGa()` silently no-ops on the preview deploy, and that's the correct, unremarkable outcome for a preview.
4. The fork-PR guard (§4.7) evaluates `github.event.pull_request.head.repo.full_name == github.repository` — true, since this PR originated from a branch on the same repo, not a fork — so the deploy step runs. `action-hosting-deploy@v0` authenticates with the service account key from `secrets.FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99`, reads `firebase.json`'s `public: "dist"`, pushes `dist/`'s contents to a new or updated preview channel, sets its expiry to 7 days out, and posts/updates a PR comment with the resulting `*.web.app`-style preview URL.
5. The owner opens that URL, confirms the typo fix rendered correctly, `View Source`s the corrected project's detail page to confirm the fix reached the prerendered `<head>` too (not just the visible body text — SP06 §4.2's `RouteMeta` drives both from the same data), and merges the PR.
6. The merge is a `push` to `main`. `firebase-hosting-merge.yml` fires. Steps 1–3 above repeat identically (checkout, install, the three gates, build) — except this time, between the gates and the build, `Verify VITE_GA_MEASUREMENT_ID is set` runs and (assuming the variable is actually set, per §8 item 2) passes silently. The deploy step runs unconditionally (no fork guard needed on a `push` trigger, §4.4) with `channelId: live` — the fix is now what `tejitpabari-99`'s live Hosting channel, and eventually `tejitpabari.com` itself, actually serves.
7. If this happened to be the very first push to `main` since the rewrite began, step 6's deploy is also the moment described in §4.12 — the hand-built holding page is gone, replaced by the real site, permanently and by design.

This trace is what the checklist items below verify piece by piece, on a real repo, rather than only in the abstract.

**Manual QA checklist (run once, after the workflows and the service account/secret/variable all exist):**

1. Open a real PR against `website-revamp` (or `main`, once merged) with a trivial, reviewable change. Confirm the preview workflow runs all three gate steps, each visible and separately named in the PR's checks list; confirm `Build` succeeds; confirm the deploy step posts a PR comment with a working preview URL.
2. `View Source` (the raw HTTP response, not DevTools) on the preview URL for a project detail page — confirm the `<title>`, `og:image`, and canonical link are present in the literal HTML response, matching SP06 §7's identical check against a real deploy.
3. Push a second, trivial commit to the same open PR within a few seconds of the first push finishing its own workflow kickoff — confirm the Actions UI shows the first run cancelled (concurrency, §4.8) rather than both running to completion.
4. Confirm the preview channel's expiry is visible as 7 days from deploy time in the Firebase Hosting console (§4.9).
5. Temporarily unset the `VITE_GA_MEASUREMENT_ID` repository variable (`gh variable delete VITE_GA_MEASUREMENT_ID`), push a trivial commit to `main` on a scratch/throwaway basis (or re-run the merge workflow manually against a past commit if the repo's history allows it without an actual new deploy), confirm the `Verify VITE_GA_MEASUREMENT_ID is set` step fails with the expected message and the workflow stops before `Build` — then restore the variable (`gh variable set VITE_GA_MEASUREMENT_ID --body "G-9NLS3NG63M"`) before doing anything that would actually deploy live.
6. Confirm the equivalent preview-workflow run with the same variable unset does **not** fail — builds and deploys the preview channel successfully with analytics silently inert, per §4.6's stated asymmetry.
7. Once `main` has a real commit history post-launch, confirm two merges pushed in quick succession behave as §4.8 describes for the live channel (the first cancelled, the second completing) rather than racing.
8. **The fork-PR guard is not practically testable without an actual external fork and contributor** — accepted as verified by direct reading of the workflow YAML and GitHub's own documented secret-scoping behavior (§4.7) rather than a live exercise, matching how SP04 §7 treats an analogous untestable-without-a-real-deploy case (its own item on Firebase's redirect-evaluation order).
9. Confirm the deployed live channel post-merge (§4.12) is the real rewritten site, not the prior hand-deployed holding page — the concrete, one-time proof that the first merge-workflow run actually replaced it as designed.

**Explicitly not worth building here:** any automated test of the workflow YAML itself (a YAML linter or `act`-based local runner is more tooling than a two-file, hand-reviewed pipeline warrants); a synthetic fork-PR test harness (§ item 8's reasoning); testing `FirebaseExtended/action-hosting-deploy@v0`'s own internal correctness (a third-party, Firebase-maintained action already exercised in production by a large number of other projects — re-verifying its behavior here would be redundant, matching the reasoning SP02 §7 already gives for not re-testing `react-markdown`/`remark-gfm`).

---

## 8. Manual Intervention Required From You

1. **Run the six-command service-account provisioning sequence in §4.5**, or run `firebase init hosting:github` interactively instead if you'd rather have the CLI walk you through the equivalent flow (§4.5 states the tradeoff; either is fine). This PRD is explicitly prohibited from running any mutating `gcloud`/`gh` command itself — someone with real access has to actually create the service account, grant its two roles, generate its key, and upload it as `FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99`.
2. **Run the `gh variable set VITE_GA_MEASUREMENT_ID` command in §4.6** — same restriction as above; the value to set is `G-9NLS3NG63M` (SP05 §4.3's already-confirmed real measurement ID).
3. **Add the two workflow files to the repo** — `.github/workflows/firebase-hosting-pull-request.yml` and `.github/workflows/firebase-hosting-merge.yml`, with the exact content in §4.3/§4.4. This PRD is a design document, not a code change — per this task's own constraints, no workflow YAML file is created on disk as part of authoring this PRD.
4. **Decide whether to add branch protection on `main`** requiring the merge workflow's gate steps to pass before a merge is even allowed (§4.11) — a cheap, valuable follow-up this PRD flags but doesn't configure, since it's a repo setting rather than a workflow file.
5. **Read §4.4's operational-consequence framing before merging `website-revamp` into `main`** — once both workflows and the secret/variable above exist, that merge is not reversible-by-git-revert-alone from a "what was live a moment ago" standpoint: it overwrites the current holding page (§4.12) and, once DNS finishes propagating (SP01 §4.9), becomes what `tejitpabari.com` itself serves.
6. **Nothing else in this sub-project is owner-blocked.** The workflow design, the role scoping, the fork-PR guard, and the `VITE_GA_MEASUREMENT_ID` fail-loud/fail-quiet split are all specified precisely enough for implementation to proceed once items 1–3 above are done.

---

## 9. Open Questions & Decisions

- `[RESOLVED: CI is adopted, superseding brief §4's no-CI non-goal]` — worth it specifically for preview-channel share-preview/prerendered-`<head>` verification (§1, point 1) and for mechanizing the two gates SP02 §9 and SP05 §8 both independently flagged as "manual and easy to forget." See §1.
- `[RESOLVED: the belief that a Firebase-scaffolded integration already existed on this repo was false — corrected here and in every sibling document that repeated it]` — verified independently three ways (§1): no `.github/workflows/` on any branch, no `FIREBASE_SERVICE_ACCOUNT_*` secret, no repository variables, and no CI-shaped service account in the project's IAM. SP01 §4.9/§9 and `BRIEF.md`'s own §4 amendment both describe this PRD's job as reconciling an existing scaffold; both are corrected directly (§1, and the sibling-reconciliation notes accompanying this PRD) to state plainly that both workflow files are hand-authored from nothing, not edited from a generated starting point.
- `[RESOLVED: auth via a dedicated service-account JSON key in `FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99`]` — a new, minimum-privilege account (`roles/firebasehosting.admin` + `roles/firebase.viewer` only), not a reuse of the project's existing, broader-scoped `firebase-adminsdk-fbsvc` account. See §4.5.
- `[RESOLVED: `VITE_GA_MEASUREMENT_ID` is a repository variable, not a secret; the merge workflow fails loudly when it is empty; the preview workflow deliberately does not]` — a GA4 measurement ID is a public identifier by construction (it's in every page's own HTML); storing it as a secret would misrepresent its sensitivity and make it harder to inspect. The fail-loud/fail-quiet asymmetry is deliberate, not an oversight: a missing ID on the live channel is a silent, months-long analytics gap worth blocking a deploy over; the identical missing ID on a preview channel is the *wanted* state, since preview traffic (almost always the owner testing their own change) shouldn't count as real analytics. See §4.6.
- `[RESOLVED: merging to `main` is the production cutover; there is no separate deploy step]` — the merge workflow (§4.4) deploys to the live channel on every push to `main`, unconditionally (past the gates). Stated prominently in §1 and §4.4 specifically so it isn't discovered by surprise at the moment `website-revamp` actually merges.
- `[RESOLVED: the fork-PR guard lives on the deploy step only, not the whole job]` — the quality gates and build need no secret and remain useful signal on a fork PR; only the deploy step needs guarding. See §4.7.
- `[RESOLVED: two small `package.json` gaps this PRD's own design surfaced — a missing standalone `typecheck` script and a missing `tsx` devDependency — are closed directly in SP01's file, not left as a follow-up]` — both are one-line, narrowly-scoped fixes required for the workflows in §4.3/§4.4 to actually succeed against a clean `npm ci` checkout; see §4.10 for why the resulting `tsc --noEmit`/`check:no-forms` redundancy in the composed script chain is accepted rather than trimmed.
- `[RESOLVED: preview builds may, in practice, load real GA if the repository variable is set for the merge workflow's sake — accepted as a minor, stated trade-off, not solved with a second preview-only override]` — the clean fix (an empty override specific to preview deploys) is more CI machinery than this asymmetry is worth for a personal-portfolio preview channel whose only realistic visitor is the owner. See §4.6's closing paragraph.
- `[RESOLVED: the first successful merge-workflow run intentionally overwrites the current hand-deployed holding page]` — the holding page isn't in the repo and was never meant to persist past launch; nobody should attempt to restore it afterward. See §4.12.
- `[RESOLVED: the official `FirebaseExtended/action-hosting-deploy@v0`, not a hand-rolled `firebase-tools` shell step]` — the action's built-in PR-comment behavior and internal credential handling would otherwise have to be reimplemented and kept in sync with `firebase-tools`' own output format by hand, for no benefit. See §4.15.
- `[RESOLVED: GitHub Actions, not a third-party CI provider]` — the repo and the owner's existing CLI auth (`gh`) are already on GitHub; nothing about this project's two-step build-and-deploy need benefits from a separate CI product's account, billing relationship, or dashboard. See §4.14.
- `[RESOLVED: `runs-on: ubuntu-latest` left unpinned]` — unlike SP01's exact-version library pins (`react-router-dom`, justified against a real breaking-major-version risk), this workflow has no OS-version-sensitive dependency; pinning would trade a real risk this project doesn't have for a manufactured one (a workflow silently going stale against an unmaintained image). See §4.14.
- `[RESOLVED: explicit, minimal `permissions:` blocks per job, not the repository's broader default]` — `contents: read` on the merge workflow; `contents: read` + `pull-requests: write` + `checks: write` on the PR workflow, matching exactly what each workflow's steps actually touch. See §4.2.
- `[RESOLVED: one job with sequential steps per workflow, not several parallel jobs]` — the gates and build all read the same checkout/install and each run in seconds; splitting them into parallel jobs would trade a real per-job startup-cost multiplier for a saving of a few seconds on a pipeline that already finishes in well under two minutes. See §4.2.
- `[RESOLVED: rollback is a manual, owner-run Firebase CLI/console action (`firebase hosting:releases:list` / `hosting:clone` / the console's one-click Rollback), not automated into either workflow]` — no automated post-deploy smoke test exists to trigger an automatic rollback from, and building one is unscoped new work relative to this PRD's mandate. See §4.4.
- `[DEFERRED: Workload Identity Federation instead of a long-lived JSON key]` — the strictly better long-term credential story (short-lived, keyless, no JSON file to rotate or leak), deliberately not adopted now: it requires materially more one-time setup (a workload identity pool, an OIDC provider binding, a trust policy referencing this specific repo) than a single-maintainer personal portfolio's CI needs justify today, and the JSON key this PRD does use is fully rotatable on demand (`gcloud iam service-accounts keys create` a new one, `keys delete` the old one, `gh secret set` the replacement — no code or workflow change required). **Explicit trigger to reopen this: the key is ever suspected to have leaked (committed by accident, exposed in a log, a compromised machine that had a copy), or the repository gains a second collaborator with write access** — either changes the risk/cost calculus enough to justify WIF's extra setup. Until then, this stays a JSON key.
- `[DEFERRED: branch protection on `main` requiring these workflows to pass before merge]` — a real, cheap, valuable follow-up (§8, item 4) that's a repository setting, not a file this PRD's own scope produces; left to the owner rather than configured here.
