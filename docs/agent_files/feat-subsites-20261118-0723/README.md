---
status: approved
summary: Index for healthtech + nonprofit subsites design
date: 2026-11-18
---
# Subsites design index (healthtech + nonprofit)

Branch `feat/subsites`, stacked on `feat/admin-merge`. Decisions: see [brainstorm.md](brainstorm.md) (Decision log).

## Sub-projects

| # | Name | Scope | Depends | Phase | Status |
|---|---|---|---|---|---|
| 01 | [multi-site-build](01-multi-site-build/PRD.md) | `SITE=main\|healthtech\|nonprofit` switch: routes, nav, footer, SEO files, CSP, outDirs, CI build + deploy | none | 1 | PRD approved |
| 02 | [project-content](02-project-content/PRD.md) | `sites:` frontmatter, `projectsForSite(site)`, split Juno into 3 cards, 5 new cards | none | 1 | PRD approved |
| 03 | [healthtech-site](03-healthtech-site/PRD.md) | Healthtech Home (hero + Onolys CTA + filterable project list), detail pages; extracts `ProjectListSection` | 01, 02 | 2 | PRD approved |
| 04 | [nonprofit-site](04-nonprofit-site/PRD.md) | Nonprofit Home (accordion services), Projects, live Schedule page from Google Sheet CSV | 01, 02, 03 | 2 | PRD approved |
| 05 | [sparehand-pages](05-sparehand-pages/PRD.md) | GitHub Pages for sparehand-plugin (repo PR), then swap 2 card hrefs | A: none; B: 02 | 1 (A), after 02 (B) | PRD approved |

## Dependency graph

```
Phase 1:  01 multi-site-build  ||  02 project-content      (parallel)
              \                    /
Phase 2:       03 healthtech-site        (needs 01, 02)
                      |
                04 nonprofit-site        (needs 01, 02; reuses 03's ProjectListSection)

05 part A (sparehand-plugin repo PR): independent, any time
05 part B (card href swap in this repo): after 02
```

04 reuses `ProjectListSection`: 03 lands first and extracts it (or 03 extracts it before 04 starts).

## Locked decisions and seams

- All product/copy decisions: brainstorm.md Decision log (owner-approved).
- Seams owned by 02 (from `@/data`): `projectsForSite(site)`, `SiteId`, `SITE_IDS`.
- Owned by 01: `SITE`, `SITE_CONFIG`, routes, nav, footer.
- `ProjectListSection`: extracted by 03, reused by 04 and main `ProjectsPage`.
- `AnalyticsEventName` union: edited by 03, then 04 (sequential, no parallel edits).
- Branch stacks on `feat/admin-merge` (hosting targets exist only there).
- No redirect for removed `/projects/juno`; privacy page unchanged.

## Open questions (consolidated)

| Item | SP | Owner or builder | Default | Resolution |
|---|---|---|---|---|
| Main CSP hash set may change if SSR inline scripts differ after routes refactor | 01 | Builder (verify vs baseline, task 1) | Expected unchanged | Builder verifies in task 1 |
| vite-react-ssg `ssgOut` placement with custom `outDir`; confirm `.vite/manifest.json` lands in `dist-<site>/` for `normalize-ssg-build-id` | 01 | Builder | Reads `build.outDir`; verify | Builder verifies |
| Preview channels: nonprofit previews fetch sheet from `*.web.app` origin (CSP allows, CORS `*`) | 01 | Builder (confirm in preview) | Works as designed | Builder confirms in preview |
| Whether `check-no-forms.sh` / em-dash scan read built output or only `src`; extend `check:launch` to `dist-*` if needed | 01 | Builder | Extend to scan `dist-*` | Builder: extend check:launch to dist-* |
| Juno app date: brief says 2026-09-07, existing card says 2025-06-01 | 02 | Owner | Follow brief (2026-09-07) | Owner: keep 2025-06-01 (overrides brief) |
| Tag choice for plugin and Sparehand cards (`Developer Tools` alongside `Health Tech` / `Nonprofit`) | 02 | Owner | As in PRD table | Owner: plugin Health Tech only; Sparehand Nonprofit only; no Developer Tools. New thepass card (main only, Developer Tools) |
| CTA label "Visit Onolys" and heading wording | 03 | Owner | PRD wording | Owner accepted: H1 "Tejit Pabari", eyebrow "Health Tech Builder", CTA "Visit Onolys" to onolys.com |
| Portrait on subsite hero | 03 | Owner | Omitted | Owner accepted: omitted |
| `ProjectListSection` extraction ownership (SP03 vs SP04) | 03 / 04 | Orchestrator | SP03 extracts; SP04 blocks on it | Orchestrator: SP03 extracts, SP04 reuses |
| Onolys card must say early stage, no customer claims (SP02 copy, verify in 03 review) | 03 | Builder / owner copy review | Early-stage wording, no claims | Builder verifies early-stage wording in review |
| Hero eyebrow "Nonprofit AI Consulting" and H1 "Tejit Pabari" | 04 | Owner | PRD wording | Owner accepted: eyebrow "Nonprofit AI Consulting", H1 "Tejit Pabari", Book opens new tab |
| Shared `AnalyticsEventName` union edited by SP03 and SP04 | 04 | Builder | Merge order resolves trivially (03 then 04) | Builder: merge order 03 then 04 |
| Sheet CSV edge-cached (~5 min); no cache-busting param | 04 | Owner (accepted per brief) | No cache-bust | Owner accepted: no cache-bust |
| Org names public "for now"; Public Name column is later fix | 04 | Owner (accepted) | Show org names | Owner accepted: show org names |
| Mermaid under default theme: is `head-custom.html` honored | 05 | Builder (test local jekyll build or first build) | Fallback `docs/_layouts/default.html` | Builder verifies; fallback layout |
| Keep or delete `docs/guide-images/`; web version of guide wanted? | 05 | Owner | Keep | Owner: keep `docs/guide-images/` |
| First Pages build can take minutes; poll `gh api repos/tejitpabari99/sparehand-plugin/pages/builds/latest` for `built` | 05 | Builder | Poll until `built` | Builder polls until built |
