---
status: approved
summary: Healthtech Home = owner-approved hero (with Onolys CTA) plus the full health project list with search and tag filter, reusing ProjectsPage building blocks; detail pages reuse ProjectDetailPage with no /live.
date: 2026-11-18
---
# PRD: SP03 healthtech-site
Repo/branch: tejitpabari · `feat/subsites` (stacked on `feat/admin-merge`) · Depends on: 01-multi-site-build, 02-project-content · Owns: `src/pages/healthtech/HealthtechHomePage.tsx` (+ test), `src/sections/HealthtechHero.tsx` (+ test), `src/pages/ProjectDetailPage.tsx` (site-aware lookup only), `src/lib/analytics.ts` (event-name union only, if needed)

## TL;DR
Replace SP01's placeholder `HealthtechHomePage` with: hero (verbatim copy, Onolys link) then the same search + tag filter + `ProjectListCard` list used on main `/projects`, fed by `projectsForSite('healthtech')` (7 cards, newest first). Detail pages at `/projects/<slug>` reuse `ProjectDetailPage`, looked up in the healthtech set. No new routes, no `/live`.

## Problem
Healthtech has a placeholder Home after SP01. The owner wants a focused page: who I am in health tech, what I am building now (Onolys), and every health project, with the same browsing UX as main. `ProjectsPage` and `ProjectDetailPage` read the global `projects` array [verified: `src/pages/ProjectsPage.tsx:8`, `ProjectDetailPage.tsx:8`], so they cannot show a site subset today. `Hero.tsx` is main's personal hero (resume button, portrait, Microsoft line) and does not fit.

## Goals / Non-Goals
- Goals: hero + full list on Home; search, tag filter, empty state identical to main; detail pages per project; per-site SEO; mobile-first layout; analytics parity.
- Non-goals: routes, nav, footer, build, CSP (SP01); card data (SP02); nonprofit pages (SP04); a "Latest 6" cut (brief: show all); a separate `/projects` route on healthtech (brief: Home only).

## Requirements
- Hero copy, verbatim, no em dashes: "I build tools that make healthcare easier to understand, from a self-testing app to an AI companion for doctor visits and plain-language care plans. Today I'm building Onolys, AI that helps check the quality of clinical assessments."
- Hero contains a CTA "Visit Onolys" linking to `https://onolys.com`, `target="_blank" rel="noreferrer"`, firing `outbound_click` with `source: 'healthtech_hero'`.
- Hero heading (my call): eyebrow "Health Tech Builder", H1 "Tejit Pabari" with a one-line sub-label "Health tech projects". Reuses main Hero's eyebrow/H1 type scale and `bg-cream` section so the subsite looks like the same family.
- List: `useCollectionFilter({ items: projectsForSite('healthtech'), collection: 'projects' })`, `SearchFilter`, `ProjectListCard`, `EmptyState`, rendered under an "All projects" H2 (`id="projects"`).
- Card `href` is `/projects/${slug}` (root-relative, same as main; resolves on the subsite origin). No `live` is passed.
- Detail page resolves slug in `projectsForSite(SITE)`; a slug outside the site renders `NotFoundPage`. `getStaticPaths` (SP01) already uses the same set.
- `RouteMeta` Home: title "Tejit Pabari | Health Tech", description = hero first sentence trimmed to under 160 chars, `path="/"`. Detail pages keep per-project title and description; site URL and OG default come from SP01 `SITE_CONFIG`.
- Analytics: only existing events, no new names. `project_card_click` {slug, collection:'projects', title}; `search_query` {collection:'projects', query, result_count} (from the hook); `outbound_click` from hero CTA and card link buttons. `section_view` not used (single list).
- Mobile: hero stacks (single column, CTA full width under 400px); no portrait on subsite (owner did not ask; keeps first paint fast), list cards already collapse to stacked image-over-text in `ProjectListCard`; Website nav button stays visible (SP01).

## Architecture
**Reuse vs new**
| Piece | Decision |
|---|---|
| `SearchFilter`, `ProjectListCard`, `EmptyState`, `useCollectionFilter`, `PageContainer`, `RouteMeta`, `Button`, `ContentBody`, `DetailHeader`, `LinksRow` | Reused unchanged |
| `HealthtechHero` | New, small, local to healthtech; not a parametrized `Hero` (main's has resume, portrait, scroll-to-contact) |
| List block | Extract nothing for now: Home inlines the same ~25 JSX lines as `ProjectsPage`. [RESOLVED: orchestrator decided SP03 extracts, SP04 reuses] extract a shared `ProjectListSection({ items })` if SP04 also needs it (it does: nonprofit Home and Projects). Recommendation: SP03 lands first and extracts it; SP04 reuses; `ProjectsPage` switches to it too, no behavior change |
| `ProjectDetailPage` | Edit: `projects.find` becomes `projectsForSite(SITE).find` (main returns all 13, so main behavior is identical) |

**Sorting.** `projectsForSite` (SP02) returns newest first, so the hook receives pre-sorted items; `useCollectionFilter` needs no sort option. Its tag filter and unqueried results preserve input order, and Fuse only reorders when a query is typed (relevance, as on main). A test pins this.

**URL state.** The hook syncs `?q=`/`?tag=` via `useSearchParams`; works on the subsite Home as on `/projects`.

**Tags.** `allTags` derives from the 7 items (Health Tech, Developer Tools). With few tags the pill row is short; acceptable, no change.

**Live link.** Cards carry `links[]`, so `resolveCardLinks` never synthesizes an internal `/live` button [verified: `src/lib/resolveLiveLinks.ts` returns `links` whenever non-empty]. Detail `LinksRow` is gated by SP01 `hasLiveRoutes`.

## Decisions
| # | Decision | Choice | Alternatives considered | Why |
|---|---|---|---|---|
| 1 | Hero component | New `HealthtechHero` | Parametrize main `Hero` | Main hero has resume, portrait, contact link; forking by prop adds branching to a stable page |
| 2 | Sort | Pre-sorted by `projectsForSite`, hook unchanged | Add `sort` option to hook | Seam already guarantees order; avoids touching shared hook |
| 3 | Detail href base | Root-relative `/projects/<slug>` | Absolute subsite URL | Works per origin, matches main, no config |
| 4 | Detail lookup | `projectsForSite(SITE)` | Global `projects` | Slug outside the site 404s, no cross-site leakage |
| 5 | List extraction | Shared `ProjectListSection`, first used here | Copy per page | Three call sites (main, healthtech, nonprofit x2) |
| 6 | Analytics | Existing events, `source` field to tell sites apart | New event names | Union stays stable; one GA property for all sites (cross-site split deferred in SP01) |
| 7 | Heading | "Tejit Pabari" + "Health tech projects" sub-label | "Hi, I'm Tejit." clone; "Health Tech by Tejit" | Name keeps identity and SEO; sub-label states purpose |
| 8 | Portrait | None | Reuse `HeroPortrait` | Not requested; simpler mobile layout |

## Manual steps (owner)
- Review hero heading and CTA label in the PR.
- Confirm `https://onolys.com` resolves before publish.

## Risks / Open Questions
- [RESOLVED: owner accepted - heading "Tejit Pabari", eyebrow "Health Tech Builder", CTA "Visit Onolys" to onolys.com] CTA label and heading wording.
- [RESOLVED: owner accepted - no portrait] Portrait on subsite hero.
- [RESOLVED: orchestrator - SP03 extracts, SP04 reuses] `ProjectListSection` extraction ownership.
- [RESOLVED: builder verifies during implementation - early-stage wording, no customer claims; check in review] Onolys card must say early stage with no customer claims; owned by SP02 copy, verify when reviewing here.
- [RESOLVED: grep] No `/live` button appears on cards because `links[]` is non-empty for all 7 health cards.
- [RESOLVED: brief] Home shows all projects, no "Latest 6"; no `/projects` list route on healthtech.
- [DEFERRED] Per-site GA properties; healthtech-specific featured/pinned Onolys card.

## Acceptance Criteria
- `HealthtechHomePage` test: renders hero text exactly equal to the approved copy (string match, no em dash); contains a link to `https://onolys.com`; renders 7 cards whose order equals `projectsForSite('healthtech')` (newest first, never a hardcoded list).
- Filter test: typing a query narrows results and updates the count; clicking a tag pill filters; clearing from `EmptyState` restores the full list; ordering with no query stays newest first.
- No rendered `href` on Home or a detail page matches `/live`; no nonprofit-only or main-only project (e.g. `clip-verse`, `auto-emailer`) appears.
- `ProjectDetailPage` renders for a healthtech slug and shows `NotFoundPage` for `clip-verse` under `SITE=healthtech`; main behavior test unchanged.
- `RouteMeta` renders the healthtech title and description; `dist-healthtech/index.html` has them and no noindex.
- Analytics: card click fires `project_card_click`; hero CTA fires `outbound_click` with `source: 'healthtech_hero'`.
- Layout checked at 375px width: no horizontal scroll, CTA tappable, Website button visible.
- `npm run check:launch` (no em dashes) and `routes.smoke` for healthtech pass; only affected tests run.
