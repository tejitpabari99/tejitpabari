---
status: approved
summary: 5 tasks — verbatim prompts, schemas/validators/errors + node tests, App Check init, ai.js implementation, ai.js vitest + cleanliness checks.
date: 2026-11-18
---
# Tasks: SP03 ai-rank-gemini
Source of truth: /root/projects/tejitpabari/.worktrees/feat/admin-merge/docs/agent_files/feat-admin-merge-20261118-0305/03-ai-rank-gemini/PRD.md, which inherits the old SP05 PRD at /root/projects/cc-gateway/.worktrees/feat/firebase-static/docs/agent_files/feat-firebase-static-20261026-1647/05-ai-rank-gemini/PRD.md. Original prompts: `git show 2d95cfe:src/routes/api/ideas/...` in the cc-gateway worktree.

| # | Task | Depends on | Status |
|---|---|---|---|
| 1 | Prompt builders ported verbatim | SP01 | in-progress |
| 2 | Schemas, validators, error mapping + node tests | SP01 | in-progress |
| 3 | App Check init at firebase.js marker | SP02 T2 | todo |
| 4 | Implement ai.js with Gemini | SP02 T3; 1, 2, 3 | todo |
| 5 | ai.js vitest + cleanliness checks + CLAUDE.md AI section | T4 | todo |

## Task 1 — Prompt builders ported verbatim
What it is: pure prompt functions so semantics match the old Anthropic routes (PRD Unchanged list).
What changes at a high level: add `ai-prompts.js` with parse, enhance, rank builders; text copied verbatim except the parse prompt drops its "Return ONLY JSON / no markdown" line; rank skips `interest` and adds the inverted-criterion note. No SDK imports.
Done when: node:test in `tests/unit` asserts the inverted line is present, `interest` absent, and key verbatim sentences match the old route text.

## Task 2 — Schemas, validators, error mapping + node tests
What it is: testable output handling (Decisions 2, 6).
What changes at a high level: add `ai-shape.js` (schema descriptors for parse and dynamic rank, `validateParse/Enhance/Rank`) and `ai-errors.js` (`toUserMessage`, code/status first, message second). Keep `Schema` construction injectable so the pure module does not import the SDK at load.
Done when: `npm run test:node` passes the PRD acceptance cases (4/3/5/1 clamp, tag filter, fence strip, missing ids → 3, error mapping per status).

## Task 3 — App Check init at firebase.js marker
What it is: abuse gate required for AI Logic (Decision 3).
What changes at a high level: at the SP03 marker in `admin/src/lib/firebase.js`, browser-only and before auth/firestore: under `import.meta.env.DEV` set the debug token from `VITE_APPCHECK_DEBUG_TOKEN` or `true`; `initializeAppCheck` with reCAPTCHA Enterprise provider (`VITE_RECAPTCHA_SITE_KEY`), auto-refresh. Skip init with a console warning when the site key is empty (local dev without key). Add both vars to `.env.example`.
Done when: vitest (mocked `firebase/app-check`) proves init order, DEV-only debug token, skip on empty key; `npm run build:admin` output has no debug-token string.

## Task 4 — Implement ai.js with Gemini
What it is: replace the stub bodies (PRD contract).
What changes at a high level: lazy import `firebase/ai`, memoized `getAI` with `GoogleAIBackend` and limited-use tokens, `GEMINI_MODEL` constant, three functions using Tasks 1-2, one retry on malformed, `Admin only` guard via `currentRole()`.
Done when: stub throw gone; Task 5 tests pass.

## Task 5 — ai.js vitest + cleanliness checks + CLAUDE.md AI section
What it is: behavior proof without network.
What changes at a high level: vitest with mocked `firebase/ai`: shapes returned, guest guard, retry-then-message, schema excludes `interest`. Append a short "AI" section to CLAUDE.md (model constant location, env vars, debug token, App Check note).
Done when: `npm run test:admin` and `test:node` green; grep of `admin/src/lib/ai*.js` finds no `anthropic`, `process.env`, or key literal.

## Owner-only steps
None here; console setup and the live 3-idea re-rank comparison are SP05 tasks.
