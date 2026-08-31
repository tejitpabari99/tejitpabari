# Tasks: CI & Deploy Pipeline (SP08)

Source of truth: `/root/projects/tejitpabari/.dev/website-revamp/08-ci-deploy-pipeline/PRD.md`. Every task below cites the PRD §4 subsection it implements. This sub-project is Phase 6 — **last**. It assumes every npm script the two workflows invoke (`typecheck`, `check:no-forms`, `check:launch`, `prebuild`, `build`) already exists in the repo from SP01/SP02/SP04/SP06, except the two small `package.json` gaps this PRD's own design surfaced and closes directly (Task 1). This sub-project's on-disk footprint is exactly two new workflow files and one small `package.json` addition (PRD §4.1) — no `src/` file, route, component, or content file changes anywhere.

**Toolchain/state assumption, confirmed from the PRD, not re-derived here:** as of this PRD's writing there is zero CI on the repo — no `.github/workflows/` on any branch, no `FIREBASE_SERVICE_ACCOUNT_*` secret, no repository variables, no CI-shaped service account in `tejitpabari-99`'s IAM (PRD §1). Both workflow files are hand-authored from nothing, not edited from a `firebase init hosting:github` scaffold. Node v20.20.1, `gh` (scopes `repo`, `workflow`), `gcloud`, and `firebase` are all authenticated on this machine per the PRD header.

**Ordering note:** Tasks 1–3 (repo file changes) and Tasks 4–5 (external GCP/GitHub provisioning) are independent of each other and can run in either order, but both must land before Task 6 (verification) and Task 7 (the first real PR run). Task 8 (the merge to `main`) is last by construction — it is the production cutover (PRD §4.4/§4.12) and depends on everything before it.

---

### Task 1 — `package.json` reconciliation: `typecheck` script and `tsx` devDependency
   - Status: Complete
   - Files: `package.json` (modify — SP01-owned file, additive only)
   - Changes: Per PRD §4.10. Two real gaps this PRD's own design surfaced while tracing exactly which npm scripts the workflows below invoke: (1) no standalone `typecheck` script exists — `tsc --noEmit` is only ever bundled inside `build`, with no way to name it as its own CI step; (2) `tsx` (the runner `check:launch` invokes) is never declared as a dependency, so a clean `npm ci` on a CI runner has no global fallback and fails with `tsx: command not found`. Add exactly these two entries; do not touch any other script or dependency. (`"typecheck"`/`"build"` corrected during SP01 implementation, inherited here: the root `tsconfig.json` is solution-style (`"files": []` + `references`), so a plain `tsc --noEmit` checks zero files and always exits 0 — a silent no-op that would make this sub-project's own CI gate gate on nothing. `tsc -b --noEmit` walks the project references and actually typechecks; see SP01 Task 3.)

```json
{
  "scripts": {
    "typecheck": "tsc -b --noEmit"
  },
  "devDependencies": {
    "tsx": "^4.19.2"
  }
}
```

     After editing, run `npm install` so `tsx` is actually present in `node_modules` and `package-lock.json` is updated. The reconciled scripts block should read (SP01/SP02/SP04/SP06 entries unchanged, `typecheck` added):

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
    "check:launch": "CHECK_LAUNCH=1 vitest run scripts/check-launch-content.test.ts && npm run check:no-forms"
  }
}
```
(`check:launch`'s right-hand side corrected from SP02 Task 10's originally-planned `"tsx scripts/check-launch-content.ts"` during that task's implementation: `scripts/check-launch-content.ts`'s import of `src/data` pulls in loaders that call `import.meta.glob`, a Vite-only build-time macro with no runtime implementation, so bare `tsx` throws unconditionally. The gate now runs as `scripts/check-launch-content.test.ts` under `vitest run`, reusing Vite's own transform — see SP02 `02-content-pipeline/TASKS.md` Task 10 for the full explanation. Because `check:launch` no longer invokes a `tsx` binary, this task's own rationale below for adding `"tsx"` to `devDependencies` (Gap 2) no longer applies to `check:launch` specifically — flagged here, not resolved, since redesigning that gap-fix is this sub-project's own call, not SP02's.)

     **Deliberately not fixed here:** `build`'s own typecheck prefix (`npm run typecheck`, i.e. `tsc -b --noEmit`) stays — trimming it would change `npm run build`'s existing, already-documented local-dev meaning for reasons that have nothing to do with CI. The resulting double-run of the typecheck per CI job (once as `Typecheck`, again inside `Build`) is accepted, not a bug (PRD §4.10).
   - Acceptance criteria:
     1. `cat package.json | grep -A1 '"typecheck"'` shows `"typecheck": "tsc -b --noEmit"`.
     2. `npm ls tsx` shows it installed at `^4.19.2`; `package-lock.json`'s diff includes the new entry.
     3. `npm run typecheck` runs standalone and exits 0 (or fails with real type errors, not a "script not found" error).
     4. Every pre-existing script (`build`, `dev`, `test`, `check:no-forms`, `check:launch`, `prebuild`, etc.) is byte-for-byte unchanged except for the new `typecheck` line.

---

### Task 2 — `firebase-hosting-pull-request.yml` — preview-channel workflow
   - Status: Complete
   - Files: `.github/workflows/firebase-hosting-pull-request.yml` (new)
   - Changes: Per PRD §4.2/§4.3/§4.7/§4.8/§4.9 exactly. One job, sequential steps through the build, diverging only at the deploy step; fork-PR guard on the deploy step alone; `concurrency` keyed on `github.workflow`+`github.ref` with `cancel-in-progress: true`; `expires: 7d`; no `VITE_GA_MEASUREMENT_ID` failure guard (deliberate asymmetry, §4.6). Complete file content:

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
   - Acceptance criteria:
     1. File exists at exactly `.github/workflows/firebase-hosting-pull-request.yml`, content matches the above byte-for-byte.
     2. `gh workflow list --repo tejitpabari99/tejitpabari` (once pushed) shows `Deploy to Firebase Hosting on PR` as an active workflow.
     3. No `channelId` input is set on the deploy step (left to the action's own per-PR default, per §4.3).
     4. `on:` has no explicit `types:` list (left at GitHub's default `opened`/`synchronize`/`reopened`, per §4.3's reasoning).

---

### Task 3 — `firebase-hosting-merge.yml` — live-channel workflow
   - Status: Complete
   - Files: `.github/workflows/firebase-hosting-merge.yml` (new)
   - Changes: Per PRD §4.2/§4.4/§4.6/§4.8 exactly. Same shared shape as Task 2 through the build, plus the one step unique to this workflow — the loud `VITE_GA_MEASUREMENT_ID` guard — and `channelId: live` instead of a preview channel. No fork-PR guard needed (a `push` to `main` never runs against a fork). Complete file content:

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
   - Acceptance criteria:
     1. File exists at exactly `.github/workflows/firebase-hosting-merge.yml`, content matches the above byte-for-byte.
     2. `gh workflow list --repo tejitpabari99/tejitpabari` (once pushed) shows `Deploy to Firebase Hosting on merge` as an active workflow.
     3. `on:` triggers only on `push` to `branches: [main]` — never on `pull_request` and never on any other branch.
     4. `channelId: live` is explicit (not inferred) on the deploy step.
     5. `permissions:` is exactly `contents: read` — no `pull-requests` or `checks` scope (this workflow never comments on a PR).

---

### Task 4 — Provision the dedicated GCP service account, roles, and key; upload the deploy secret
   - Status: Partial — `.gitignore` hardening done; the six `gcloud`/`gh` provisioning commands below were NOT run (out of scope for this implementation pass per its explicit SCOPE BOUNDARY — this machine's session has no authorization to mutate the `tejitpabari-99` GCP project or the `tejitpabari99/tejitpabari` GitHub repo's secret store in this context). Owner action required; see run report.
   - Files: none (this task mutates GCP IAM and the GitHub repo's secret store — no repository file changes); `.gitignore` (modify — one defensive addition, see below)
   - Changes: Per PRD §4.5. **Requires `gcloud`/`gh` credentials with write access to the `tejitpabari-99` GCP project and the `tejitpabari99/tejitpabari` GitHub repo** — this machine's standing setup has both (per the PRD header), but flag before running if that access is not actually present in the executing environment; if it isn't, this becomes a human-run task instead. Run in order:

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
#    Written OUTSIDE the repo working tree deliberately (the home directory,
#    not any path under /root/projects/tejitpabari) so it is never even
#    momentarily inside a git-tracked directory.
gcloud iam service-accounts keys create ~/tejitpabari-99-github-actions-key.json \
  --iam-account=github-actions-deploy@tejitpabari-99.iam.gserviceaccount.com

# 5. Upload the key as the GitHub repository secret the workflows reference —
#    piping the file directly, never pasting its contents anywhere else (a
#    shell history, a chat message, a second file).
gh secret set FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99 \
  --repo tejitpabari99/tejitpabari \
  < ~/tejitpabari-99-github-actions-key.json

# 6. Delete the local copy immediately once step 5 succeeds.
rm ~/tejitpabari-99-github-actions-key.json
```

     **Defensive `.gitignore` addition** — the six commands above never write the key inside the repo tree, but add a narrow pattern as defense-in-depth against a future accidental `keys create` targeting a repo-local path. Add this line under the existing `# dotenv environment variable files` block in `.gitignore` (the file already excludes `.env*`; nothing currently excludes a stray service-account key):

```gitignore
# GCP service-account keys — never committed, see SP08 PRD §4.5
*-github-actions-key.json
*.serviceaccount.json
```
   - Acceptance criteria:
     1. `gcloud iam service-accounts list --project=tejitpabari-99` shows `github-actions-deploy@tejitpabari-99.iam.gserviceaccount.com`.
     2. `gcloud projects get-iam-policy tejitpabari-99 --flatten="bindings[].members" --filter="bindings.members:github-actions-deploy@tejitpabari-99.iam.gserviceaccount.com" --format="table(bindings.role)"` shows exactly two rows: `roles/firebasehosting.admin`, `roles/firebase.viewer` — no more, no fewer.
     3. `gh secret list --repo tejitpabari99/tejitpabari` shows `FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99` with a recent updated-at date (the value itself is never shown — that's `gh secret list`'s own by-design behavior).
     4. **Safety criterion:** `find /root/projects/tejitpabari -iname '*.json' | xargs grep -l '"type": "service_account"' 2>/dev/null` (or equivalent) returns nothing — no service-account JSON key file exists anywhere in the working tree. `git -C /root/projects/tejitpabari status --short` shows nothing staged matching a key filename. `~/tejitpabari-99-github-actions-key.json` no longer exists on disk (`ls ~/tejitpabari-99-github-actions-key.json` reports "No such file or directory").
     5. `git -C /root/projects/tejitpabari diff .gitignore` shows only the two added lines above; `.gitignore` now contains a pattern that would catch a `*-github-actions-key.json` or `*.serviceaccount.json` file if one were ever created inside the repo.

---

### Task 5 — Set the `VITE_GA_MEASUREMENT_ID` repository variable
   - Status: Blocked — owner-only. `gh variable set` mutates the real `tejitpabari99/tejitpabari` GitHub repo and is out of scope for this implementation pass (SCOPE BOUNDARY). Not attempted. Exact command recorded in the run report for the owner to execute.
   - Files: none (mutates the GitHub repo's variable store only)
   - Changes: Per PRD §4.6. A repository **variable**, not a secret — a GA4 measurement ID is emitted in plaintext in every page's own HTML, so storing it as a secret would misrepresent its sensitivity and make it harder to inspect (`gh variable list` shows the value; `gh secret list` never does, by design).

```bash
gh variable set VITE_GA_MEASUREMENT_ID \
  --repo tejitpabari99/tejitpabari \
  --body "G-9NLS3NG63M"
```
   - Acceptance criteria:
     1. `gh variable list --repo tejitpabari99/tejitpabari` shows `VITE_GA_MEASUREMENT_ID   G-9NLS3NG63M   <updated-at date>` — the actual value visible, confirming it's a variable, not a secret.
     2. The value is exactly `G-9NLS3NG63M` (SP05 §4.3's confirmed real measurement ID) — no leading/trailing whitespace, no quotes baked into the stored value.

---

### Task 6 — Verify provisioning end-to-end (read-only)
   - Status: Partial — only the fourth (pure local `git ls-tree`) command was run; the three `gh`/`gcloud` commands authenticate to the real remote GitHub repo/GCP project and are out of scope for this implementation pass (SCOPE BOUNDARY treats any authenticating gh/gcloud call as off-limits, even read-only ones). Local check result: `git ls-tree -r website-revamp --name-only | grep '^\.github/workflows'` → "none yet" (Tasks 2/3's workflow files live on branch `sp08-b1`, not yet merged into `website-revamp`); the same check against `sp08-b1` itself shows both files present. Remote verification (secret, variable, IAM roles) not attempted — genuinely not provable from this session; see run report.
   - Files: none — read-only verification task
   - Changes: Per PRD §4.13. Run once Tasks 1–5 have landed, as the mechanical proof the setup actually happened and matches the PRD's design, rather than trusting it from memory. All four commands are read-only/safe to run any time, including months later as a standing sanity check:

```bash
# Confirm the secret exists (value never shown).
gh secret list --repo tejitpabari99/tejitpabari
# Expect: FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99   <updated-at date>

# Confirm the variable exists AND shows its actual value.
gh variable list --repo tejitpabari99/tejitpabari
# Expect: VITE_GA_MEASUREMENT_ID   G-9NLS3NG63M   <updated-at date>

# Confirm the service account carries exactly the two roles §4.5 grants.
gcloud projects get-iam-policy tejitpabari-99 \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions-deploy@tejitpabari-99.iam.gserviceaccount.com" \
  --format="table(bindings.role)"
# Expect exactly two rows: roles/firebasehosting.admin, roles/firebase.viewer

# Confirm the two workflow files are on the branch that will become main,
# byte-for-byte matching Tasks 2/3.
git -C /root/projects/tejitpabari ls-tree -r website-revamp --name-only | grep '^\.github/workflows'
# Expect: .github/workflows/firebase-hosting-merge.yml
#         .github/workflows/firebase-hosting-pull-request.yml
```
   - Acceptance criteria:
     1. All four commands above run clean and match their "Expect" lines exactly.
     2. `gh workflow list --repo tejitpabari99/tejitpabari` shows both `Deploy to Firebase Hosting on PR` and `Deploy to Firebase Hosting on merge`.
     3. None of the four commands mutate any state — re-running this task later (e.g. as a standing monthly check) is always safe.

---

### Task 7 — Open a validation PR and confirm the preview workflow end to end
   - Status: Blocked — owner-only. Requires Tasks 4/5's real GCP/GitHub provisioning to exist first (neither was run, see Tasks 4/5), and requires pushing a real branch/PR to `tejitpabari99/tejitpabari` and observing live GitHub Actions runs — nothing here is simulable locally, and mutating the real repo is out of scope for this implementation pass (SCOPE BOUNDARY). Not attempted.
   - Files: none — this task exercises the pipeline against a real, trivial, reviewable PR (e.g. a comment or whitespace tweak on a non-critical file); revert or keep the PR open per the outcome, do not merge it as part of this task
   - Changes: Per PRD §7's manual-QA checklist, items 1–4 and 6. This is the first real proof the two workflow files (Tasks 2–3) and the provisioned secret/variable (Tasks 4–5) actually compose correctly — nothing in GitHub Actions' secret-scoping, concurrency, or PR-comment behavior can be faithfully simulated locally.
     1. Push a trivial, reviewable commit to a feature branch off `website-revamp` and open a PR. Confirm `Deploy to Firebase Hosting on PR` fires automatically.
     2. In the PR's checks list, confirm `Typecheck`, `Check — no forms in hosted /live pages`, `Check — pre-launch content gate`, and `Build` each appear as **separately named** steps and each passes (green) individually — not one combined step.
     3. Confirm the `Deploy preview channel` step runs (same-repo PR, fork guard evaluates true) and that `action-hosting-deploy@v0` posts a PR comment containing a working `*.web.app`-style preview URL.
     4. Open that preview URL and `View Source` (the raw HTTP response, not DevTools) on a page with `RouteMeta` wired — confirm `<title>`, `og:image`, and the canonical `<link>` are present in the literal HTML response.
     5. Push a second trivial commit to the same PR within a few seconds of the first run starting. Confirm the Actions UI shows the first run cancelled (concurrency, §4.8), not both runs completing.
     6. Confirm the preview channel's expiry shows as 7 days from deploy time in the Firebase Hosting console (§4.9).
   - Acceptance criteria:
     1. The PR's checks list shows all four gate/build steps passing by name (observable directly in the GitHub PR UI or via `gh pr checks <number>`).
     2. The PR has exactly one bot-posted comment containing a preview URL (updated in place on the second push, not duplicated).
     3. `View Source` on the preview URL shows the expected `<title>`/`og:image`/canonical values, sourced from the raw response.
     4. The Actions tab shows the first of the two pushed runs with status "cancelled," the second with status "success."
     5. The Firebase Hosting console (or `firebase hosting:channel:list --project tejitpabari-99`) shows the preview channel's expiry ~7 days out.

---

### Task 8 — Merge to `main`: first live deploy (production cutover), watched
   - Status: Blocked — owner-only, explicitly. This is the production cutover: merging `website-revamp` into `main` is explicitly forbidden for this implementation pass (SCOPE BOUNDARY: "do NOT merge `website-revamp` into `main` [...] which would deploy live"). Requires Tasks 1–7 complete first per the task's own precondition, and requires the owner's explicit go-ahead per PRD §8 item 5 before it can happen at all. Not attempted.
   - Files: none — this task is the act of merging `website-revamp` into `main` and observing the resulting workflow run
   - Changes: Per PRD §4.4/§4.12 and §7's manual-QA checklist items 7–9. **State plainly: this merge is the production cutover, not a routine git operation.** The moment it lands, `Deploy to Firebase Hosting on merge` runs the full gate sequence and, if every gate passes, deploys straight to `tejitpabari-99`'s live Hosting channel — overwriting the hand-built holding page currently serving it (§4.12), and, once DNS propagation is complete, becoming what `tejitpabari.com` itself serves. This is the intended, designed outcome of this pipeline's first successful run, not an incident to review afterward — nobody should attempt to restore the holding page once this happens.
     1. Confirm Tasks 1–7 have all passed before proceeding — merging with an unverified pipeline turns this from a controlled cutover into a live experiment.
     2. Merge the PR (or push directly to `main`, per however `website-revamp` lands).
     3. **Do not fire-and-forget this run.** Watch it directly:
```bash
gh run watch --repo tejitpabari99/tejitpabari
```
     4. Confirm the run's steps match Task 7's gate/build step names, plus the additional `Verify VITE_GA_MEASUREMENT_ID is set` step (unique to this workflow), all passing.
     5. Confirm the `Deploy to live channel` step succeeds and reports the live Hosting URL.
     6. Visit `tejitpabari-99`'s live Hosting URL (and `tejitpabari.com`, once DNS has propagated) and confirm it now serves the real rewritten site — not the prior holding page.
   - Acceptance criteria:
     1. `gh run list --repo tejitpabari99/tejitpabari --workflow="Deploy to Firebase Hosting on merge" --limit 1` shows the run with conclusion `success`.
     2. The run's logs show `Typecheck`, `Check — no forms in hosted /live pages`, `Check — pre-launch content gate`, `Verify VITE_GA_MEASUREMENT_ID is set`, `Build`, and `Deploy to live channel` each passing by name, in that order.
     3. `firebase hosting:releases:list --project tejitpabari-99` (or the Hosting console) shows a new release on the `live` channel, timestamped at or after this run.
     4. The live URL, loaded directly, no longer shows the holding page — it shows the real site's landing page.
     5. If a second commit is pushed to `main` in quick succession afterward, the Actions UI shows the first of the two runs cancelled and the second completing (§4.8), matching Task 7 item 4's pattern on the merge workflow specifically.

---

## Summary of what requires you (not a dev agent)

1. **Task 4's provisioning commands (service account creation, role grants, key minting, secret upload) require real `gcloud`/`gh` write access to the `tejitpabari-99` GCP project and the `tejitpabari99/tejitpabari` GitHub repo.** This machine's standing setup has both per the PRD header, so a dev agent can run Task 4 directly — but if the executing environment lacks that access, this becomes a task only you (or someone with that access) can run. The alternative path, `firebase init hosting:github`, is genuinely the better choice for a human running it interactively at a keyboard (PRD §4.5) — either path is fine, but `firebase init hosting:github` is unavoidably interactive and is not something these tasks script.
2. **Task 5's `gh variable set` is likewise a real mutation** — agent-runnable given the same access as Task 4, flagged here because it's the kind of one-line command worth confirming was actually run correctly (Task 6 verifies it).
3. **Task 8 — merging `website-revamp` into `main` — is the actual production cutover and is the one step in this list that most needs your explicit go-ahead before it happens**, even though the mechanics (`gh run watch`, checking the live URL) are agent-runnable. Read PRD §4.4's "operational consequence" framing and §4.12 (the holding page it replaces) before authorizing this merge — once it succeeds, there's no git-revert-alone path back to "what was live a moment ago." Confirm you're ready for `tejitpabari.com` to start serving the rewrite before Task 8 runs.
4. **Deciding whether to add branch protection on `main`** requiring these workflows' gates to pass before a merge is even possible (PRD §4.11/§9, `[DEFERRED]`) — a cheap, valuable follow-up this PRD flags but deliberately doesn't configure; it's a repo setting (`gh api repos/tejitpabari99/tejitpabari/branches/main/protection` or the GitHub UI), not a workflow file any task above produces.
5. **Rotating the service-account key if it's ever suspected to have leaked, or if the repo gains a second collaborator with write access** (PRD §9's explicit trigger for reopening the `[DEFERRED]` Workload Identity Federation decision) — the rotation procedure itself (create a new key, `gh secret set` to overwrite, delete the old key) is agent-runnable with access, but the judgment call of *when* to rotate, and whether to finally adopt WIF instead of a rotatable JSON key, is yours.
6. **Nothing else in this sub-project is owner-blocked.** The workflow design, the role scoping, the fork-PR guard, and the `VITE_GA_MEASUREMENT_ID` fail-loud/fail-quiet split are all specified precisely enough (PRD §8, item 6) for Tasks 1–7 to proceed without further input from you.
