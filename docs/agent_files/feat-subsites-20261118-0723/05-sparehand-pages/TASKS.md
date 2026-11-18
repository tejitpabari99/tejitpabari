---
status: draft
summary: Publish sparehand-plugin docs on GitHub Pages (main /docs, legacy Jekyll), drop the PDF, then swap two site card hrefs to the Pages URLs.
date: 2026-11-18
---
# Tasks: SP05 sparehand-pages
Source of truth: /root/projects/tejitpabari/.worktrees/feat/subsites/docs/agent_files/feat-subsites-20261118-0723/05-sparehand-pages/PRD.md. Part A (Tasks 1-4) runs in `tejitpabari99/sparehand-plugin` on branch `feat/pages` off `origin/main`, own PR, owner merges. Part B (Tasks 5-6) runs in `tejitpabari99/tejitpabari` on `feat/subsites`. The sparehand-plugin repo already has CI (`validate.yml`), so no CI task is needed. No plugin version or changelog bump (docs-only).

| # | Task | Repo | Depends on | Status |
|---|---|---|---|---|
| 1 | Jekyll config and mermaid include | sparehand-plugin | none | done |
| 2 | Link fixes, PDF and script removal, README line | sparehand-plugin | none | done |
| 3 | Validate, push, open PR | sparehand-plugin | 1, 2 | done |
| 4 | Enable Pages and verify live URLs | sparehand-plugin | 3 (owner merge) | done |
| 5 | Card href swap | tejitpabari | 4, 02:T4 | todo |
| 6 | Card tests and launch checks | tejitpabari | 5 | todo |

## Task 1: Jekyll config and mermaid include
Repo: sparehand-plugin. What it is / what it means: Minimal Jekyll setup so `docs/` renders like sparehand-auto (Decisions 1, 2, 7).
What changes at a high level: Add `docs/_config.yml` with `title`, `description`, `exclude: [agent_files]` and no theme line. Add `docs/_includes/head-custom.html` loading mermaid from jsdelivr at a pinned version and rendering `code.language-mermaid` blocks. Builder verifies the default theme honors `head-custom.html` via a local `bundle exec jekyll build` (or first Pages build); if not, use fallback `docs/_layouts/default.html`.
Done when: local build (or first build) outputs HTML where a skill page's mermaid block gets the loader script; `agent_files` absent from output; `python scripts/validate_plugin.py` still passes.

## Task 2: Link fixes, PDF and script removal, README line
Repo: sparehand-plugin. What it is / what it means: Make the docs correct on Pages and remove the PDF (Decisions 4, 5, 6).
What changes at a high level: In the four `docs/skills/*.md` pages, change `../../plugin/skills/<skill>/SKILL.md` links to absolute `https://github.com/tejitpabari99/sparehand-plugin/blob/main/plugin/skills/<skill>/SKILL.md`. Delete `docs/nonprofit-guide.pdf` and `scripts/build_guide_pdf.py`; remove the "(PDF)" bullet from root `README.md` and its row in `docs/README.md`. Add one "Learn more" line in root `README.md` linking `https://tejitpabari99.github.io/sparehand-plugin/`. Keep `docs/guide-images/`. Do not rename skill pages.
Done when: `grep -r "nonprofit-guide" .` hits only historical `docs/agent_files`; no `../../plugin` links remain in `docs/skills`; `validate_plugin.py` passes (relative-link and mermaid-per-skill checks).

## Task 3: Validate, push, open PR
Repo: sparehand-plugin. What it is / what it means: Ship Part A as one PR; agents never merge.
What changes at a high level: Commit per task, push `feat/pages`, open PR via dev-ship, watch `validate.yml`.
Done when: `validate.yml` is green on the PR and the PR diff touches nothing under `plugin/`. Owner merges.

## Task 4: Enable Pages and verify live URLs
Repo: sparehand-plugin (settings API). What it is / what it means: Turn on Pages only after the cleaned docs are on `main`, so the first publish is correct (PRD Architecture, Manual steps).
What changes at a high level: After owner merge and go-ahead (confirm at ship time), run `gh api -X POST repos/tejitpabari99/sparehand-plugin/pages -f 'source[branch]=main' -f 'source[path]=/docs'`. Poll `pages/builds/latest` until `built`. Curl the six URLs.
Done when: `gh api repos/tejitpabari99/sparehand-plugin/pages` shows `build_type: legacy`, source `main` `/docs`, status `built`; `curl -s -o /dev/null -w '%{http_code}'` returns 200 for `/sparehand-plugin/`, `/skills/`, `/skills/start.html`, `/skills/partner-event-finder.html`, `/skills/install-automation.html`, `/skills/share-feedback.html`; mermaid confirmed rendering on one skill page (owner views once).

## Task 5: Card href swap
Repo: tejitpabari (`feat/subsites`). What it is / what it means: Point the two Sparehand cards at the live pages (Decision 9). Depends on 02:T4, which creates the card files; rebase onto SP02 first.
What changes at a high level: In `src/content/projects/partner-event-finder.md` and `install-automation.md`, change only the primary link href to `.../skills/partner-event-finder.html` and `.../skills/install-automation.html`. Nothing else changes. Run only after Task 4 URLs return 200.
Done when: git diff shows only those two href lines; no other card changed.

## Task 6: Card tests and launch checks
Repo: tejitpabari. What it is / what it means: Prove the swap broke nothing.
What changes at a high level: Run affected checks only; add or adjust a test asserting the two primary hrefs equal the Pages URLs if SP02's tests do not already cover it. Full suite is left to dev-ship.
Done when: `projects.test.ts` (and any href assertion) passes, `npm run check:launch` passes, `npm run check:no-em-dash` passes.

## Manual steps
- Owner reviews and merges the sparehand-plugin PR.
- Owner gives go-ahead for the Pages enable call (public setting change), then views the live site once for look and mermaid.
- Deferred: `start` and `share-feedback` have pages but no site cards.
