# tejitpabari.com Rewrite — Planning Folder

This folder plans the rewrite of `tejitpabari.com` from its current half-finished Gatsby 5 + Chakra UI scaffold to `vite-react-ssg` (React 19 + Vite) + Tailwind, prerendered to static HTML per route and deployed to Firebase Hosting. The goal is to reposition Tejit as a health-tech builder (Juno, an AI companion for medical appointments) rather than a geospatial engineer with side projects, and to give every project an individually linkable, individually shareable page with correct OG/share-preview metadata. `BRIEF.md` in this folder is the source of truth for every settled decision — every sub-project PRD below cites it directly and does not re-litigate anything it settles.

## Sub-projects

| Folder | Title | Scope | Depends on | Status |
|---|---|---|---|---|
| `01-app-shell-design-system-deploy` | App Shell, Design System & Deploy | Vite + `vite-react-ssg` + TypeScript toolchain; Tailwind design tokens ported from Brittne Valdivia's techfolio (palette, radii, shadows, Montserrat); the full route skeleton (`routes.tsx`, `getStaticPaths` seam); shared components (`Nav`, `Footer`, `PageShell`, `Button`, `TagPill`, `BackButton`, icon set, `useDebouncedValue`); `src/config/links.ts` (`RESUME_URL`, `NAV_LINKS`, `FOOTER_LINKS`); Firebase Hosting config. | None (first sub-project) | ✅ Complete (26/26) |
| `02-content-pipeline` | Content Pipeline | Four content collections (Projects, Research, Work Experience, Legal) — on-disk layout, frontmatter contracts, `import.meta.glob` + `gray-matter` loaders, hand-rolled build-time validation (including the Nav/Footer href cross-check), `src/config/featured.ts`, the `DRAFT_DATE` placeholder mechanism, and the `/projects/<slug>/live` redirect-vs-hosted signal. | SP01 | ✅ Complete (15/15) |
| `03-landing-page-timeline` | Landing Page & Work-Experience Timeline | Hero, Featured Projects, work-experience timeline (gbose-style border-left spine), About, and Contact sections on `/`; the `/work-experience` page; `ProjectCard` (shared verbatim with SP04). Consumes SP01's `src/config/links.ts` and SP05's `src/config/contact.ts`; creates neither. | SP01, SP02 | ⬜ Not started |
| `04-projects-research-pages` | Projects & Research Pages | `/projects` and `/research` listing pages (shared search + tag-filter hook, Fuse.js); one data-driven detail template per collection; the resolved `/projects/<slug>/live` dual-mode contract (real HTTP redirect vs. hosted mini-project registry); `scripts/check-no-forms.sh`. | SP01, SP02, SP03 | ⬜ Not started |
| `05-legal-analytics` | Legal Pages & Analytics | Obfuscated-email contact pattern; `ConsentContext` + consent banner; GA4 (`trackEvent`, the five-event `AnalyticsEventName` catalogue); `/privacy` and `/terms` drafted copy. | SP01 | ✅ Complete (20/20) |
| `06-sharing-seo-sample-project` | Sharing, SEO & Sample Project | `RouteMeta` per-route OG/Twitter meta; build-time OG card generation; sitemap/robots; the deletable `sample-project` demo. | SP01, SP02, SP04 | ⬜ Not started |
| `07-content-migration-copy` | Content Migration & Copy | Migration plan for all 17 content items (10 projects, 5 research, 2 work-experience roles) from the old Gatsby site into SP02's frontmatter contract, with per-item date-confidence tiering; drafted first-pass copy for hero, About, Contact, project/research descriptions, and work-experience blurbs. | SP02 | ⬜ Not started |
| `08-ci-deploy-pipeline` | CI & Deploy Pipeline | Two hand-authored GitHub Actions workflows (PR-preview channel, merge-to-`main` live deploy) running SP02's/SP04's mechanical content gates plus a typecheck before every build; dedicated GCP service-account auth; `VITE_GA_MEASUREMENT_ID` as a repository variable with a fail-loud production guard; fork-PR guard; concurrency control; 7-day preview-channel expiry. | SP01, SP02, SP04, SP06 | ⬜ Not started |

## Dependency graph / phase ordering

This is the build order downstream implementation tooling (`dev-tasks`/`dev-code`) reads:

- **Phase 1:** SP01 (blocks everything)
- **Phase 2:** SP02 and SP05 in parallel (both depend only on SP01; disjoint files)
- **Phase 3:** SP07 and SP03 in parallel (SP07 authors `src/content/**`; SP03 builds landing + timeline components — disjoint files)
- **Phase 4:** SP04 (depends on SP03's `ProjectCard`)
- **Phase 5:** SP06 (depends on SP04's `/live` registry convention)
- **Phase 6 (last):** SP08 (depends on SP01, SP02, SP04, SP06) — every npm script its two CI workflows invoke (`typecheck`, `check:no-forms`, `check:launch`, `prebuild`, `build`) must already exist before its design does anything useful, which is exactly why it can't build sooner than everything else.

## Status

All eight PRDs are settled — no open decisions remain in any of them. `TASKS.md` exists for SP01, SP02, and SP05; implementation is underway (see the table above and each sub-project's own `TASKS.md` for per-task status). As of 2026-08-31:

- **SP01 (App Shell, Design System & Deploy) — complete.** All 26 tasks done, including two corrective fix commits caught by Task 26's build/lint/typecheck verification (a `react-hooks/set-state-in-effect` defect in `Nav.tsx`, and a no-op `typecheck` gate). See `01-app-shell-design-system-deploy/TASKS.md`.
- **SP02 (Content Pipeline) — complete.** Tasks 1–10 (collections, loaders, validation, the pre-launch content gate) plus Tasks 11–15 (validator/unit test suites) all done — 15/15. See `02-content-pipeline/TASKS.md`.
- **SP05 (Legal Pages & Analytics) — complete.** Tasks 1–19 done (contact obfuscation, consent system, GA4 analytics, `/privacy` and `/terms` pages, and their unit/smoke tests); Task 20 (the `dist/` build audit) ran with no concurrent agents in the repo and all five acceptance checks passed against a real `npm run build` — 20/20. See `05-legal-analytics/TASKS.md`.
- **SP03, SP04, SP06, SP07, SP08 — not started.** Task generation and implementation have not begun for any of these five sub-projects.

Full implementation-run detail (task-by-task commit mapping, deviations, follow-ups): see `code-2026-08-31-0420.md` in this folder.

## Still requires the owner

These are the items no agent can resolve — tracked in each PRD's own `§9`/`§8`, aggregated here for one-glance visibility. Firebase project creation and the DNS cutover, previously the top items here, are now **done**; the new CI setup steps below (SP08) are new owner-or-agent-with-access setup steps, not blockers to anything else.

- **SP08 — Run the six-command service-account provisioning sequence (or `firebase init hosting:github` interactively instead) to create `FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99`.** A dedicated GCP service account (`roles/firebasehosting.admin` + `roles/firebase.viewer` only) has to actually be created, keyed, and uploaded as a GitHub repository secret by someone with real `gcloud`/`gh` access — SP08 §4.5 gives the exact commands. Not launch-blocking (the site still builds and can still be deployed by hand without it), but blocks CI from being able to deploy at all until done.
- **SP08 — Run `gh variable set VITE_GA_MEASUREMENT_ID --body "G-9NLS3NG63M"`** so the CI-built production site actually ships with analytics — SP08 §4.6. The merge workflow fails loudly if this is missing, so the gap can't ship silently, but someone still has to set it once.
- **SP08 — Add the two workflow files to the repo** (`.github/workflows/firebase-hosting-pull-request.yml`, `.github/workflows/firebase-hosting-merge.yml`) with the exact content SP08 §4.3/§4.4 specifies — a design document doesn't create files on disk by itself.
- **SP08 — Read §4.4's operational-consequence framing before merging `website-revamp` into `main`.** Once the two workflows and the secret/variable above exist, that merge deploys straight to the live channel — there is no separate "deploy" step to review beforehand, and it overwrites the current hand-deployed holding page (SP08 §4.12) as intended, not as an accident to investigate.
- **SP05 — Read every word of the drafted `/privacy` and `/terms` copy and edit or approve it**, including the "This isn't professional or medical advice" framing on `/terms`. Not lawyer-reviewed; must not ship unread. This copy is now **implemented in code, not just drafted in the PRD** (`src/pages/PrivacyPage.tsx`, `src/pages/TermsPage.tsx`, reproduced verbatim from the PRD) — the review gap is the same one, but it now blocks real shipped pages, not just a document.
- **SP06 — `RouteMeta` swap owed on both legal pages.** `src/pages/PrivacyPage.tsx` and `src/pages/TermsPage.tsx` currently call `vite-react-ssg`'s `Head` directly (with the exact title/description strings `RouteMeta` would have received) because `@/components/RouteMeta` doesn't exist yet — SP06 hasn't landed. When SP06 ships `RouteMeta`, both pages need the one-line swap; each has an inline comment marking the spot.
- **SP07 — Confirm or correct the four low-confidence project dates** (Juno, Med-Doc Tracker, Crunchy Filler, Clip-Verse). A wrong guess silently reorders `/projects` and changes what `featured.ts` backfills, with no build-time signal.
- **SP07 — Decide whether Med-Doc Tracker or any other body-less project should get a short `body`**, once the owner reviews the drafted card descriptions. Default is no body; the site is complete either way.
