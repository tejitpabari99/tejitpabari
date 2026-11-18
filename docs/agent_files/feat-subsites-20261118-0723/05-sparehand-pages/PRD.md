---
status: draft
summary: Serve sparehand-plugin docs as a GitHub Pages site (source main /docs, same default Jekyll look as sparehand-auto) with stable skill URLs, drop the PDF, then swap the two site cards to the Pages URLs.
date: 2026-11-18
---
# PRD: SP05 sparehand-pages
Repo/branch: two repos. (A) `tejitpabari99/sparehand-plugin` · new branch `feat/pages` off `origin/main`. (B) tejitpabari · `feat/subsites` (stacked on `feat/admin-merge`) · Depends on: SP02 (cards exist) for part B only; part A is independent · Owns: sparehand-plugin `docs/_config.yml`, `docs/_includes/head-custom.html`, `docs/README.md`, `docs/skills/*.md` links, `README.md` (one line), deletions of `docs/nonprofit-guide.pdf` and `scripts/build_guide_pdf.py`; site repo `src/content/projects/partner-event-finder.md` and `install-automation.md` (href only)

## TL;DR
Turn on GitHub Pages for sparehand-plugin from `main` `/docs`, the same legacy "deploy from branch" mode `sparehand-auto` uses. Existing markdown becomes HTML with no new build tooling. Skill pages live at `https://tejitpabari99.github.io/sparehand-plugin/skills/<skill>.html`. The PDF, its generator script and its two doc links go in the same PR. After Pages is live and returns 200, the two site cards swap from GitHub markdown links to these URLs.

## Problem
Skill docs are only readable as raw GitHub markdown, and the nonprofit guide is a 467 KB PDF that duplicates them. The owner wants nonprofit visitors to land on a normal web page. `sparehand-plugin` has no Pages site today [verified: `gh api repos/tejitpabari99/sparehand-plugin/pages` returns 404; the `.../sparehand-plugin/` URL returns 404].

## Goals / Non-Goals
- Goals: stable public URLs per skill; look matches sparehand-auto; no extra CI beyond what exists; PDF and orphans gone; site cards point at Pages once verified.
- Non-goals: new content, a custom domain, a custom theme, a web version of the illustrated guide, version bumps or a plugin release, changing the site card copy (SP02).

## Requirements
- Reference setup [verified: `gh api repos/tejitpabari99/sparehand-auto/pages`]: `build_type: legacy`, source `main` `/`, `https_enforced: true`, no `_config.yml`, no Pages workflow (its only workflow `ci.yml` is Apps Script CI). Default theme, README as index, `.md` links rewritten to `.html` (live check: INSTALLATION_GUIDE link resolves, 200).
- Pages source for plugin: branch `main`, folder `/docs`. Index = `docs/README.md` (Jekyll readme-index). Skill list at `/skills/`, pages at `/skills/start.html`, `/skills/partner-event-finder.html`, `/skills/install-automation.html`, `/skills/share-feedback.html`.
- `docs/_config.yml`: `title`, `description`, `exclude: [agent_files]`; no theme line (inherit the same default as sparehand-auto).
- Mermaid: skill pages carry a flow in a mermaid block, which the default theme shows as plain code. Add `docs/_includes/head-custom.html` loading mermaid from jsdelivr at a pinned version and rendering `code.language-mermaid`. [OPEN] confirm the default theme honors `head-custom.html`; fallback is `docs/_layouts/default.html`.
- Links out of `docs/`: the four skill pages link `../../plugin/skills/<skill>/SKILL.md`, which is outside the Pages source and would 404. Change to absolute `https://github.com/tejitpabari99/sparehand-plugin/blob/main/plugin/skills/<skill>/SKILL.md` (README already uses absolute URLs for TERMS/PRIVACY).
- Remove `docs/nonprofit-guide.pdf`, its README bullet ("Illustrated guide for nonprofits (PDF)"), its row in `docs/README.md` (the link checker would fail on it), and `scripts/build_guide_pdf.py` (its only output is the PDF; needs reportlab/Pillow, not in CI) [verified: grep of README, docs/*.md, CHANGELOG, PRIVACY, TERMS, .gitignore, build_zip.py, start SKILL.md found only the README line].
- Keep `docs/guide-images/` (5 PNGs, ~400 KB, referenced by nothing else once the script goes) so a later web guide can reuse them; not served via a page link.
- Add one line to root README "Learn more": link to the Pages site.

## Architecture
Fit with the repo's own rules [verified: `docs/releasing.md`, `.github/workflows/validate.yml`, `validate_plugin.py`]: no `CLAUDE.md` exists. CI (`validate.yml`) already checks relative links in `README.md` and `docs/**/*.md`, that each skill has `docs/skills/<skill>.md` with a mermaid block, and TERMS/PRIVACY links. A docs-only PR touches nothing under `plugin/`, so no plugin version or changelog bump is required and the ZIP (excludes `docs/`) is unchanged. Do not rename skill pages: their filenames are the URLs and CI keys on them.

Part A order: PR with config and deletions, merge to `main`, then enable Pages (so the first publish already has the cleaned docs). Part B: after A's URLs return 200, change only the href in the two card files, plus run SP02's card tests and `check:launch`.

## Decisions
| # | Decision | Choice | Alternatives considered | Why |
|---|---|---|---|---|
| 1 | Pages source | `main` `/docs`, legacy | `/` (like sparehand-auto); Actions workflow | `/` would publish `plugin/` internals and `agent_files`; legacy needs no workflow and no new Actions surface |
| 2 | Theme | Default, no config theme | Custom or remote theme | Matches sparehand-auto; zero deps |
| 3 | Skill URL shape | `/skills/<skill>.html` | Pretty permalinks | Default Jekyll output; keeps filenames stable |
| 4 | Outside-docs links | Absolute GitHub blob URLs | Switch source to `/` | Keeps publish surface small; CI link check still passes on absolute URLs |
| 5 | PDF generator | Delete script | Keep script | Output file is gone; dead code with unpinned deps |
| 6 | guide-images | Keep | Delete | Not asked; cheap; likely reused |
| 7 | Mermaid | CDN include, pinned | Leave as code block; prerender SVG | Flows are the content of each skill page |
| 8 | Link check | Rely on `validate_plugin.py` + post-deploy `curl` | New link-check workflow | Existing CI covers repo links; Pages URLs verified after deploy |
| 9 | Site hrefs | Swap after 200 verified | Swap in SP02 | Avoids shipping dead links |

## Manual steps
- Enabling Pages is a repo-settings API call, not owner-only: token has `repo` scope and `admin: true` on the repo [verified: `gh api repos/tejitpabari99/sparehand-plugin` permissions]. Command after the PR merges: `gh api -X POST repos/tejitpabari99/sparehand-plugin/pages -f 'source[branch]=main' -f 'source[path]=/docs'`. It changes public settings, so the orchestrator runs it only on the owner's go-ahead (already given in the brief; confirm at ship time).
- Owner reviews and merges the sparehand-plugin PR (no merge by agents).
- Owner views the live site once for look and mermaid rendering.

## Risks / Open Questions
- [OPEN] Mermaid under the default theme: whether `head-custom.html` is honored; test with a local `bundle exec jekyll build` or the first build. Fallback layout in Requirements.
- [OPEN] Keep or delete `docs/guide-images/` (default: keep). Does the owner want a web version of the guide instead?
- [OPEN] First Pages build can take a few minutes; poll `gh api repos/tejitpabari99/sparehand-plugin/pages/builds/latest` for `built`.
- [RESOLVED: grep] No other repo references to the PDF beyond README and `docs/README.md`; the PDF script is the only consumer of guide-images.
- [RESOLVED: verified] Pages already works on sparehand-auto in this mode, so the account supports it.
- [DEFERRED] `start` and `share-feedback` have pages but no site cards (brief skips them).
- Risk: card hrefs live in SP02 files; SP05 must rebase onto SP02 and touch only `href`.

## Acceptance Criteria
- sparehand-plugin PR: `validate.yml` green; no `nonprofit-guide.pdf`, `build_guide_pdf.py` or "(PDF)" link; `grep -r "nonprofit-guide"` returns only historical `docs/agent_files`.
- `gh api repos/tejitpabari99/sparehand-plugin/pages` shows `build_type: legacy`, source `main` `/docs`, status `built`.
- `curl -s -o /dev/null -w '%{http_code}'` returns 200 for `/sparehand-plugin/`, `/skills/`, `/skills/start.html`, `/skills/partner-event-finder.html`, `/skills/install-automation.html`, `/skills/share-feedback.html`; mermaid renders on one skill page.
- Site repo: `partner-event-finder` and `install-automation` primary href equal the Pages URLs; `npm run check:launch` and `projects.test.ts` pass; no other card changes.
