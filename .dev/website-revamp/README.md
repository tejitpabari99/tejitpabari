# tejitpabari.com Rewrite — Planning Folder

This folder plans the rewrite of `tejitpabari.com` from its current half-finished Gatsby 5 + Chakra UI scaffold to `vite-react-ssg` (React 19 + Vite) + Tailwind, prerendered to static HTML per route and deployed to Firebase Hosting. The goal is to reposition Tejit as a health-tech builder (Juno, an AI companion for medical appointments) rather than a geospatial engineer with side projects, and to give every project an individually linkable, individually shareable page with correct OG/share-preview metadata. `BRIEF.md` in this folder is the source of truth for every settled decision — every sub-project PRD below cites it directly and does not re-litigate anything it settles.

## Sub-projects

| Folder | Title | Scope | Depends on |
|---|---|---|---|
| `01-app-shell-design-system-deploy` | App Shell, Design System & Deploy | Vite + `vite-react-ssg` + TypeScript toolchain; Tailwind design tokens ported from Brittne Valdivia's techfolio (palette, radii, shadows, Montserrat); the full route skeleton (`routes.tsx`, `getStaticPaths` seam); shared components (`Nav`, `Footer`, `PageShell`, `Button`, `TagPill`, `BackButton`, icon set, `useDebouncedValue`); Firebase Hosting config. | None (first sub-project) |
| `02-content-pipeline` | Content Pipeline | Four content collections (Projects, Research, Work Experience, Legal) — on-disk layout, frontmatter contracts, `import.meta.glob` + `gray-matter` loaders, hand-rolled build-time validation (including the Nav/Footer href cross-check), `src/config/featured.ts`, the `DRAFT_DATE` placeholder mechanism, and the `/projects/<slug>/live` redirect-vs-hosted signal. | SP01 |
| `03-landing-page-timeline` | Landing Page & Work-Experience Timeline | Hero, Featured Projects, work-experience timeline (gbose-style border-left spine), About, and Contact sections on `/`; the `/work-experience` page; `ProjectCard` (shared verbatim with SP04); `src/config/links.ts` (`RESUME_URL`, `NAV_LINKS`, `FOOTER_LINKS`). | SP01, SP02 |
| `04-projects-research-pages` | Projects & Research Pages | `/projects` and `/research` listing pages (shared search + tag-filter hook, Fuse.js); one data-driven detail template per collection; the resolved `/projects/<slug>/live` dual-mode contract (real HTTP redirect vs. hosted mini-project registry); `scripts/check-no-forms.sh`. | SP01, SP02, SP03 |
| `05-legal-analytics` | Legal Pages & Analytics | Obfuscated-email contact pattern; `ConsentContext` + consent banner; GA4 (`trackEvent`, the five-event `AnalyticsEventName` catalogue); `/privacy` and `/terms` drafted copy. | SP01 |
| `06-sharing-seo-sample-project` | Sharing, SEO & Sample Project | `RouteMeta` per-route OG/Twitter meta; build-time OG card generation; sitemap/robots; the deletable `sample-project` demo. | SP01, SP02, SP04 |
| `07-content-migration-copy` | Content Migration & Copy | Migration plan for all 17 content items (10 projects, 5 research, 2 work-experience roles) from the old Gatsby site into SP02's frontmatter contract, with per-item date-confidence tiering; drafted first-pass copy for hero, About, Contact, project/research descriptions, and work-experience blurbs. | SP02 |

## Dependency graph / phase ordering

This is the build order downstream implementation tooling (`dev-tasks`/`dev-code`) reads:

- **Phase 1:** SP01 (blocks everything)
- **Phase 2:** SP02 and SP05 in parallel (both depend only on SP01; disjoint files)
- **Phase 3:** SP07 and SP03 in parallel (SP07 authors `src/content/**`; SP03 builds landing + timeline components — disjoint files)
- **Phase 4:** SP04 (depends on SP03's `ProjectCard`)
- **Phase 5:** SP06 (depends on SP04's `/live` registry convention)

## Status

All seven PRDs are settled — no open decisions remain in any of them. `TASKS.md` generation (per-sub-project implementation task lists) is the next step.

## Still requires the owner

These are the items no agent can resolve — tracked in each PRD's own `§9`/`§8`, aggregated here for one-glance visibility:

- **SP01 — Complete the tejitpabari.com DNS cutover and wait for certificate provisioning.** Firebase project creation is done (project `tejitpabari-99`, §SP01 4.9/§9); the remaining owner action is completing the in-flight Cloudflare→Firebase DNS cutover and waiting for Firebase to report the custom domain "Connected" with a provisioned certificate (up to ~24h). Still the single hard launch blocker; `npm run build` and local preview work fully without it.
- **SP05 — Read every word of the drafted `/privacy` and `/terms` copy and edit or approve it**, including the "This isn't professional or medical advice" framing on `/terms`. Not lawyer-reviewed; must not ship unread.
- **SP07 — Confirm or correct the four low-confidence project dates** (Juno, Med-Doc Tracker, Crunchy Filler, Clip-Verse). A wrong guess silently reorders `/projects` and changes what `featured.ts` backfills, with no build-time signal.
- **SP07 — Decide whether Med-Doc Tracker or any other body-less project should get a short `body`**, once the owner reviews the drafted card descriptions. Default is no body; the site is complete either way.
