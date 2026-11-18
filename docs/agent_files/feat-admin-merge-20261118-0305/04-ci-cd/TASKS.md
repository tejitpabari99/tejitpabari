---
status: approved
summary: 5 tasks — admin build guard script, CI split with emulator/JDK job, merge deploy via CLI, PR previews for main+admin, repo variable + docs.
date: 2026-11-18
---
# Tasks: SP04 ci-cd
Source of truth: /root/projects/tejitpabari/.worktrees/feat/admin-merge/docs/agent_files/feat-admin-merge-20261118-0305/04-ci-cd/PRD.md. Keep the existing workflows' comments, pinned SHAs, concurrency and fork guard; edit, don't rewrite from scratch.

| # | Task | Depends on | Status |
|---|---|---|---|
| 1 | check-admin-build script + test | SP02 T2 | done |
| 2 | ci.yml: Node 22, unit + emulator jobs, workflow_call | SP01, SP02 T1, 1 | done |
| 3 | Merge workflow: CI gate + CLI deploy of all targets + firestore | 2, SP03 T3 | in-progress |
| 4 | PR workflow: build all + main/admin previews | 2 | done |
| 5 | Repo variable + CLAUDE.md CI/CD section | 3, 4 | todo |

## Task 1 — check-admin-build script + test
What it is: build-artifact guard (PRD check-admin-build).
What changes at a high level: node script scanning `dist-admin/` for emulator hosts and debug-token assignment and requiring `index.html`; npm script `check:admin-build`.
Done when: vitest (scripts test, run via the CHECK pattern or a node:test in `tests/unit`) proves a dirty fixture fails with the offending file named and a clean fixture passes.

## Task 2 — ci.yml: Node 22, unit + emulator jobs, workflow_call
What it is: tests for everything on every push/PR (Decisions 3-5).
What changes at a high level: `node-version-file: .nvmrc`; `unit` job runs typecheck, lint, test, test:admin, test:node, build:all, check:admin-build; `emulator` job adds pinned setup-java (temurin 21) and pinned cache of the emulator jar dir, runs test:emulator; add `workflow_call` trigger; `permissions: contents: read`.
Done when: YAML parses, all `uses:` are SHAs with version comments; locally the same command list passes in order (record output in the code artifact); green on the shipped PR.

## Task 3 — Merge workflow: CI gate + CLI deploy of all targets + firestore
What it is: one deploy path for 5 sites + rules + indexes (Decisions 1, 6).
What changes at a high level: add a `ci` job calling the reusable workflow and make deploy `needs` it; Node 22; keep checks and GA guard; add RECAPTCHA var guard; `build:all`; write the service-account secret to a runner-temp file through an env var, deploy with `firebase deploy --only hosting,firestore --project tejitpabari-99 --non-interactive`, delete the file in an always step. Remove the action step for live deploy.
Done when: YAML parses; a dry local run of the deploy command with `--only firestore:rules --dry-run` (owner login) succeeds; secret never appears in a `run:` line directly.

## Task 4 — PR workflow: build all + main/admin previews
What it is: previews for the two built apps (Decisions 2, 7, 8).
What changes at a high level: Node 22, `build:all`, two pinned action steps with `target: main` and `target: admin`, both behind the fork guard, `expires: 7d`. Confirm the pinned action supports `target` by reading its `action.yml` at that SHA; if not, use the CLI channel deploy and post URLs via `gh pr comment`.
Done when: YAML parses; on the shipped PR both preview URLs appear and load (admin in guest mode).

## Task 5 — Repo variable + CLAUDE.md CI/CD section
What it is: make the pipeline reproducible.
What changes at a high level: set `VITE_RECAPTCHA_SITE_KEY` with `gh variable set` once SP05 has the key (until then the guard keeps merge deploys failing loudly — so this must be done before merging); append CLAUDE.md section: workflows, required repo vars/secret, SA roles list from PRD, "merge = deploy all targets + rules".
Done when: `gh variable list` shows both vars; CLAUDE.md section present.

## Owner-only steps
None. (IAM grants are SP05 agent tasks with owner fallback.)
