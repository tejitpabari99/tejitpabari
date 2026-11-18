---
status: approved
summary: Implement admin/src/lib/ai.js (parseIdea/enhanceIdea/rankIdea) with Gemini Flash via Firebase AI Logic (Gemini Developer API, Spark) + App Check (reCAPTCHA Enterprise) — the old cc-gateway SP05 ported to the React admin.
date: 2026-11-18
---
# PRD: SP03 ai-rank-gemini
Repo/branch: tejitpabari · `feat/admin-merge` · Depends on: SP01 (ported `ai.js` stub, `firebase.js`), SP02 (`auth-core.currentRole()`, pages calling `ai.js`) · Owns: `admin/src/lib/ai.js` (bodies), `admin/src/lib/ai-prompts.js`, `admin/src/lib/ai-shape.js`, `admin/src/lib/ai-errors.js`, their tests, the App Check block at the SP03 marker in `admin/src/lib/firebase.js`, `.env.example` (two admin vars), CLAUDE.md "AI" section (append only)

## TL;DR
The old SP05 design carries over unchanged except for framework glue: same three frozen functions, prompts ported verbatim from the old Anthropic routes, `responseSchema` JSON output, validators + clamps, error mapping, App Check with reCAPTCHA Enterprise and limited-use tokens. The role guard reads `currentRole()` from SP02's `auth-core.js` instead of a Svelte store. Pure modules are unit-tested with `node --test`; the Firebase-touching parts with vitest.

## Problem
SP01 ported `ai.js` as a stub that throws "AI is not configured yet" [verified: cc-gateway `src/lib/ai.js@2d95cfe`]. Anthropic needs a server-held key; there is no server. App Check enforcement for AI Logic is mandatory since 2026-11-02 (old SP05 research, fetched 2026-10-26).

## Goals / Non-Goals
- Goals: Add Idea, Enhance, Auto-rank (single + bulk) work for admin with the same output shapes and prompt semantics; no key in client; readable errors; no partial writes (callers persist only after success).
- Non-goals: UI (SP02), console setup (SP05), Vertex backend, streaming, Remote Config, admin-only server enforcement.

## Requirements
- `parseIdea(rawText)` → `{title, content, tags, brief}`; `enhanceIdea(existing, notes)` → `{content}`; `rankIdea({title,brief,content}, criteria)` → `{scores, analysis}`. Signatures frozen (SP02 calls them).
- Rank: integer 1-5 per rankable criterion, `interest` excluded, inverted criteria scored raw with the "lower is better — score the raw difficulty" note; 2-3 sentence analysis.
- Each function throws `Error('Admin only')` when `currentRole() !== 'admin'`.
- Failures produce one line in the existing error slot.

## Architecture
Carried from old SP05 (source: `/root/projects/cc-gateway/.worktrees/feat/firebase-static/docs/agent_files/feat-firebase-static-20261026-1647/05-ai-rank-gemini/PRD.md`, research table, contract table, error mapping, abuse model). Deltas only:

| Piece | Old (Svelte) | New (React admin) |
|---|---|---|
| Location | `src/lib/ai*.js` | `admin/src/lib/ai*.js` (JS, per D1) |
| Role guard | `get(role)` Svelte store | `currentRole()` from `admin/src/lib/auth-core.js` |
| App Check init | SP01 hook in `firebase.js` | same marker in ported `admin/src/lib/firebase.js`, browser-only, before `getAuth`/`getFirestore` |
| Env vars | `.env` | `VITE_RECAPTCHA_SITE_KEY`, `VITE_APPCHECK_DEBUG_TOKEN` in root `.env`/`.env.example` (admin Vite `envDir` = repo root); CI repo variable `VITE_RECAPTCHA_SITE_KEY` (public), wired by SP04 |
| Prompt source | old API routes | `git show 2d95cfe:src/routes/api/ideas/+server.js`, `.../[slug]/+server.js`, `.../[slug]/rank/+server.js` in cc-gateway |
| Tests | `node --test` | pure `ai-prompts`/`ai-shape`/`ai-errors` → `tests/unit/*.test.js` (node:test); `ai.js` + App Check init → vitest with `firebase/ai` and `firebase/app-check` mocked |

Unchanged: `GoogleAIBackend`; model constant `GEMINI_MODEL = 'gemini-3.8-flash'` in one place; lazy `await import('firebase/ai')`; `getAI(app, {backend, useLimitedUseAppCheckTokens: true})` memoized; parse/rank use `responseMimeType: application/json` + `Schema`; enhance plain text with defensive fence strip; validation (tags filtered to the 13-item list, max 3; parseInt, NaN→3, clamp 1-5, missing ids→3); one retry on malformed output; `toUserMessage` mapping (App Check 403, 429 quota, 404 model/config, safety block, malformed, generic); debug token only under `import.meta.env.DEV`.

Abuse model unchanged: App Check proves "this site", not "this admin"; bounded by Spark (no billing), lowered per-user quota (SP05), client guard + hidden UI.

## Decisions
| # | Decision | Choice | Alternatives considered | Why |
|---|---|---|---|---|
| 1 | Backend / model | Gemini Developer API, `gemini-3.8-flash` constant | Vertex; Gemini 4 Argon | Old SP05 D1-D2: Spark, no billing |
| 2 | Output | `responseSchema` + validators + clamp | Text + fence strip | Old D3 |
| 3 | App Check | reCAPTCHA Enterprise, auto-refresh, limited-use tokens | reCAPTCHA v3 | Old D5-D6 |
| 4 | Role guard source | `currentRole()` in framework-free auth-core | React context in ai.js | Keeps ai.js node-importable and UI-free |
| 5 | Language | JS | TS | D1; pure modules tested by node:test |
| 6 | Test split | pure → node:test; SDK-touching → vitest mocks | All live | No network in tests |
| 7 | Bulk concurrency | 3 (SP02 caller) | Higher | Free-tier RPM |

## Manual steps
Console/API setup is SP05 (AI Logic enable, reCAPTCHA key, App Check registration + enforcement, debug token registration, per-user quota). Live re-rank comparison of 3 ideas is SP05 smoke.

## Risks / Open Questions
- [RESOLVED: Spark works per old SP05 research; Blaze + $5/mo budget is the pre-approved fallback] AI Logic plan.
- [RESOLVED: model id is one constant; 404 mapped to a message] Model retirement.
- [RESOLVED: names read from installed SDK typings at implementation] `AIErrorCode` names.
- [RESOLVED: SDK `^12.19.0` from SP01 satisfies >= 12.14.0] Replay protection support.
- [DEFERRED] Replay-protection enforcement; temperature tuning.
- Risk: dev calls hit live Gemini (no AI Logic emulator) and need a registered debug token.

## Acceptance Criteria
- `ai.js` has no stub throw; returns exactly the contract shapes.
- `npm run test:node` covers: valid parse/enhance/rank; missing score id → 3; `"4.7"`/`"abc"`/`9`/`0` → 4/3/5/1; tags outside list dropped, max 3; empty title/content rejected; fenced enhance unfenced; `interest` never in schema or prompt; inverted line present; error mapping cases.
- vitest: guest `currentRole()` → `rankIdea` throws "Admin only"; malformed output retried once then mapped; App Check init only in browser, debug token only when DEV.
- `npm run build:admin` succeeds; no `@anthropic-ai/sdk`, API key, or `process.env` in `admin/src/lib/ai*.js`; `VITE_APPCHECK_DEBUG_TOKEN` absent from `dist-admin`.
