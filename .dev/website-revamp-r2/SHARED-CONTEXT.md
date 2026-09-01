# Shared context — tejitpabari.com revision round 2 (2026-09-01)

## Repo facts
- Repo: `/root/projects/tejitpabari`. Work ONLY on branch `website-revamp`. Never touch `main`.
- Stack: React 19 + `vite-react-ssg` (prerendered static HTML per route) + Vite + TypeScript +
  Tailwind 3 (+ `@tailwindcss/typography`) + react-router-dom 6. Tests: vitest + @testing-library/react
  + jsdom. Content: markdown files under `src/content/**` loaded via `import.meta.glob` + `gray-matter`,
  with hand-rolled build-time validation that THROWS at module load on bad data.
- Prior planning lives in `.dev/website-revamp/` (BRIEF.md is the round-1 source of truth,
  README.md is the sub-project index, review-2026-08-31-1000.md is the final round-1 review).
  Read what is relevant; do not re-litigate settled round-1 decisions unless this round overrides them.
- Gates that must stay green: `npm run typecheck`, `npm run lint`, `npm test`,
  `npm run check:launch`, `npm run check:no-forms`, `npm run build`.
- No new runtime dependencies without a strong, stated reason.

## Design tokens (tailwind.config.ts)
cream #F7F1E8 (bg) · sage #DDE7DE (secondary bg) · teal #043439 (accent) ·
teal-secondary #0F4C45 (borders/links/labels) · ink #162b26 (headings) · body #3E514D ·
slate #6B7B77 · slate-dark #4D5D59 · placeholder #EEF3EE.
maxWidth.content = 72rem. Radii: xl2/card/panel/section. Shadows: pill/panel/card/card-hover/section.
Font: Montserrat.

## This round's locked decisions (owner-approved 2026-09-01)
1. Navbar gets a `Home` entry. `Nav.tsx`'s `sectionIdOf = href.slice(2)` assumes every NAV_LINKS href
   is `/#<sectionId>`; a `/` href breaks that and also breaks SP02's build-time nav-href validator.
   Both must be updated deliberately, not patched around.
2. Back-only chrome (navbar HIDDEN) on exactly: `/projects`, `/projects/:slug`, `/projects/:slug/live`.
   Every other route (`/`, `/research`, `/research/:slug`, `/work-experience`, `/privacy`, `/terms`,
   404) keeps the navbar, which now includes Home.
3. `fabric-maps-mcp-server.md` and `azure-maps-ai-assistant.md` are DELETED outright (their substance
   now lives as a bullet on the Microsoft work-experience entry). No `hidden` frontmatter flag.
4. The `sample-project` demo is deleted this round. `.dev/website-revamp/review-2026-08-31-1000.md`
   contains an end-to-end rehearsal of this exact deletion — follow it.
5. Work-experience content is rebuilt from the real resume (see RESUME-EXTRACT.md). Jio stays as a
   third entry; the landing timeline's limit of 2 then naturally shows the two Microsoft roles.
6. `RESUME_URL` in `src/config/links.ts` becomes
   https://drive.google.com/file/d/1pTIyviXM0fCCkXeX6LveYXvr7QD2TD0j/view?usp=sharing
7. Copy voice: the owner says the whole site "feels written by AI". Two hard rules — (a) no em dashes
   (—) anywhere in user-visible copy, (b) rewrite so it reads like a person wrote it. Preserve every
   factual claim; only the voice changes. Do not invent biography.
8. The owner does not want any statement about whether he is or is not looking to be hired. Contact
   copy is about health tech and about reaching out, nothing about hiring.

## Verified environment facts (do not redo)
- GitHub secret `FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99`: SET. Repo variable
  `VITE_GA_MEASUREMENT_ID` = `G-9NLS3NG63M`: SET. SP08's owner-only provisioning is DONE.
- The `firebase hosting:channel:deploy` warnings "Unable to add channel domain to Firebase Auth" /
  "Unable to sync Firebase Auth state" are benign: Firebase Authentication is not enabled on the
  project, so there is no authorized-domain list to sync.
- `firebase.json` is rewritten on every build by `scripts/inject-csp-hashes.mjs` (postbuild) and by
  `vite.config.ts`'s `liveRedirectsPlugin`, so it is permanently git-dirty after any build. R6 owns
  the decision on how to handle that.

## Output convention for this round
`.dev/website-revamp-r2/<NN-kebab-name>/PRD.md`, matching the house format already used in
`.dev/website-revamp/*/PRD.md`. Sections: 1 Problem · 2 Goals · 3 Non-Goals · 4 Architecture
Decisions (file-by-file, concrete code snippets, old->new tables) · 5 API Change Summary (or N/A) ·
6 Frontend Change Summary · 7 Testing · 8 Manual Intervention Required From You ·
9 Open Questions & Decisions (every item tagged [OPEN] / [RESOLVED: <decision>] / [DEFERRED]).

## Sub-projects this round (and who owns which files — respect these boundaries strictly)
- R1 `01-shell-nav-chrome` — src/layout/{PageShell,Nav,Footer}.tsx, src/config/links.ts,
  page-level container/padding for ProjectsPage, ProjectDetailPage, ProjectLivePage, ResearchPage,
  ResearchDetailPage, WorkExperiencePage, NotFoundPage; src/components/BackButton.tsx;
  the SP02 build-time nav-href validator. Phase 1.
- R2 `02-landing-sections` — src/sections/* only (Hero, HeroPortrait, AboutSection, ContactSection,
  FeaturedProjectsSection, WorkExperienceSection) + their tests. Layout width parity, one-line
  headlines, and the copy rewrite for those sections. Phase 2.
- R3 `03-content-data` — src/content/**, src/config/featured.ts, src/pages/live/** (incl. the
  sample-project deletion), scripts/ tests that reference deleted slugs. Phase 1.
- R4 `04-component-polish` — src/components/* (ProjectCard, DetailHeader, LinksRow, TagPill, Button,
  a new status-badge component), src/data/{ContentBody,markdownComponents}.tsx, the `typography`
  block in tailwind.config.ts. Phase 2.
- R5 `05-legal-pages` — src/pages/{PrivacyPage,TermsPage}.tsx, src/context/ConsentContext.tsx,
  src/components/ConsentBanner.tsx. Phase 3.
- R6 `06-voice-sweep-and-ship` — repo-wide em-dash/voice sweep over whatever R1-R5 leave behind,
  full gate run, the firebase.json build-dirty decision, and opening the PR. Phase 4, runs last.
