# PRD — Sub-project 01: App Shell, Design System & Deploy

**Repo:** `tejitpabari/tejitpabari` (branch off `main`, proposed name `website-revamp`)
**Depends on:** nothing (first sub-project)
**Blocks:** 02 (Content pipeline), 03 (Landing page + timeline), 04 (Projects & Research pages), 05 (Legal & analytics), 06 (Sharing, SEO & sample project) — everything else in the initiative builds on this.
**Source of truth:** `/root/projects/tejitpabari/.dev/website-revamp/BRIEF.md` — every decision cited below as "brief §N" is settled there and is not re-opened here.

---

## 1. Problem

`tejitpabari.com` is a half-finished Gatsby 5 + Chakra UI site. Verified directly (not assumed):

- `src/pages/index.js` imports both `IntroSection` and `ProjectSection` but renders only `<IntroSection/>`:
  ```js
  import IntroSection from "../components/index/IntroSection"
  import ProjectSection from "../components/index/ProjectSection"
  ...
  const IndexPage = () => (
    <Layout>
      <IntroSection />
    </Layout>
  )
  ```
  `ProjectSection`/`ProjectCard` are dead code — three hardcoded Unsplash-image cards with placeholder copy ("Project Title", "This is a sample Project description...") that never render.
- `src/pages/about.js` renders the literal string `About` inside `<Layout>` — the page has no content.
- `gatsby-config.js`'s `siteUrl` is `https://gatsbystarterdefaultsource.gatsbyjs.io/` — a leftover from the starter template, never corrected.
- `src/components/common/header.js` holds a Chakra `useColorMode` light/dark toggle nobody asked for, a hardcoded "Tejit Pabari" wordmark button, and the Google Drive résumé link.
- `_redirects` is 0 bytes (confirmed via `wc -c`).
- `README.md` is the unmodified 5.6 KB Gatsby starter readme.

None of this can be incrementally fixed — the stack itself (Gatsby 5 + Chakra + styled-components + framer-motion, GraphQL-sourced content, client-rendered dark-mode toggle) is being replaced wholesale per brief §2 with `vite-react-ssg` + Tailwind + four markdown collections, deployed to Firebase Hosting. Before any content, search, timeline, or legal page can be built, something has to:

1. Demolish the old `src/` tree and Gatsby config files, on a branch, without touching `main` (which keeps serving the live Netlify site).
2. Stand up a working Vite + `vite-react-ssg` + TypeScript + Tailwind toolchain that actually builds and deploys.
3. Port Brittne Valdivia's techfolio visual system (palette, radii, shadows, Montserrat) into reusable Tailwind tokens and components, not copy-pasted-per-page like the reference itself does.
4. Register the full route table from brief §3 — including the two genuinely non-trivial mechanics of this site: cross-page anchor-scroll navigation (nav items are anchors on `/`, but every route needs to reach them) and `vite-react-ssg`'s `getStaticPaths` contract for the dynamic `:slug` routes SP02/SP04 will populate.
5. Configure Firebase Hosting so a deploy is possible the moment there's something to deploy.

This sub-project produces no real page content — hero copy, project cards, the timeline, search, legal text are explicitly SP02–SP06's work. Its output is a deployed, empty-but-correct shell that those five sub-projects build directly on top of.

---

## 2. Goals

- A branch off `main` with `src/` and all `gatsby-*.js` files deleted, backed by grep evidence that nothing surviving references what's removed.
- A `vite-react-ssg` + React 19 + TypeScript project, dependency-for-dependency mirroring `juno-landing-page`'s proven working versions, that builds (`tsc --noEmit && vite-react-ssg build`) and runs (`vite-react-ssg dev`).
- The full brief §3 route table registered in `vite-react-ssg`'s `RouteRecord[]` shape, including the `404` route, with placeholder page components everywhere SP02–SP06 fill in real content.
- A working, uniform anchor-scroll interaction: clicking "About" from `/research/some-slug` lands on `/` scrolled to `#about`; clicking it while already on `/` just scrolls.
- The full techfolio palette, radius scale, and shadow scale as named Tailwind tokens, documented against exactly which reference class each token replaces.
- Montserrat loaded once, sitewide, via the mechanism brief §3 locks (Google Fonts, not self-hosted, not duplicated per-page).
- A real, documented component library — `Nav`, `Footer`, `PageShell`, `Button`, `TagPill`, `BackButton`, and six hand-inlined icons — each with a typed prop interface and a named consumer sub-project, replacing techfolio's per-page-copy-pasted equivalents.
- `firebase.json` + `.firebaserc` mirroring `juno-landing-page`'s hosting config, with a documented placeholder project ID and DNS cutover called out as an owner-only step.

## 3. Non-Goals

- Any real page content: hero copy, About prose, project/research/work-experience data, search, legal text, analytics. (SP02–SP06.)
- The four markdown collections' actual loader/parser/validation logic — SP01 stubs the two slug-array modules `getStaticPaths` needs so the build compiles today; SP02 replaces their contents.
- `RouteMeta`, per-route OG tags, and OG-image generation — SP06's scope. SP01 ships a single static `<title>`/description in `index.html` sufficient for routes that don't have `RouteMeta` wired up yet.
- `ConsentContext`, GA4, the consent banner, `/privacy`/`/terms` copy — SP05's scope. SP01 registers the routes and stubs the pages; SP05 fills them in and additionally wraps `PageShell` with `ConsentProvider`/`AnalyticsListener`/`ConsentBanner` (see §4.6).
- Email obfuscation (`contact.ts`, `useContactMailto`) — consumed by SP03 (Contact section) and SP05 (`/privacy`); not built here, though `juno-landing-page/src/config/contact.ts` already contains Tejit's real address assembled in exactly this pattern and is directly reusable by whichever sub-project needs it first.
- `SearchFilter` (fuse.js + tag filter), the four detail-page templates, the `/projects/<slug>/live` redirect-vs-hosted logic — SP04's scope. SP01 registers the route shapes and slug-enumeration seam only.
- The work-experience timeline CSS, hero, About prose, Contact section — SP03's scope.
- Sitemap/`robots.txt` generation — `juno-landing-page`'s `vite.config.ts` has a working `sitemapPlugin`; porting it is a natural SP06 task (it needs the real per-collection slug/date data SP02 produces), not built here.
- CI/CD — deploy is a manual `firebase deploy` command, matching `juno-landing-page`'s own "no CI for a solo builder" decision.
  > **Amended 2026-08-31 (owner action):** superseded — the owner installed the Firebase Hosting GitHub Action integration on the repo, and it is adopted rather than removed. Deploy is now (once the workflows land, §4.9) driven by pushes/PRs, not a manual `firebase deploy`. See §4.9's "Deploy pipeline" subsection, §9, and brief §4's matching amendment.
- Dark mode, a CMS, a backend, a contact form (brief §4, unchanged here).

---

## 4. Architecture Decisions

### 4.1 Branch and demolition

**Branch:** proposed name `website-revamp` (matches the existing `.dev/website-revamp/` planning folder, easy to find). Not owner-blocking — any implementer can create it; flagged in §9 as a naming default, not a hard requirement.

> **CARVE-OUT — read this before running any demolition step (§9, owner decision):** `src/images/cat.png` is copied to `public/favicon.png` **before** `src/` is deleted. This is now the **only** file surviving the demolition below — every other file under `src/`, including everything else in `src/images/`, is deleted outright. The owner overrode an earlier resolution that treated this file as the unrelated Gatsby-starter mascot slated for deletion: it's actually a 512×512 solid-black walking-cat silhouette PNG on a transparent background, verified directly, and the owner wants it kept as the site's favicon (§4.5). A demolition step that silently destroys the one asset being kept is exactly the kind of ordering bug that's annoying to recover from — do the copy first, then delete.

**Deleted, with grep evidence that nothing surviving references them:**

| Path | Why it's safe to delete |
|---|---|
| `src/` (entire tree: `components/`, `pages/`, `templates/`, `images/`, `content/post1.md`) — **except `src/images/cat.png`, copied to `public/favicon.png` first (see the carve-out above, §4.5, §9)** | The whole Gatsby/Chakra application. Every file was read directly for this PRD (see §1 and below) — nothing else in it survives the stack change. |
| `gatsby-config.js`, `gatsby-node.js`, `gatsby-browser.js`, `gatsby-ssr.js` | Gatsby-specific config with no Vite equivalent shape. `gatsby-node.js`'s only job is registering the dead `/using-dsg` DSG demo page (`src/templates/using-dsg.js`) — also deleted, also dead (not linked from anywhere; `grep -rn "using-dsg"` outside these two files returns nothing). |
| `src/files/tejitpabari_resume.pdf` | **Deleted, not moved (owner-confirmed, §9).** The owner confirmed directly that the shipped résumé link is the existing Google Drive URL (`https://drive.google.com/file/d/1HcqZCkdxfU73PUHmFSKqJGIG7_yG3mGS/view?usp=sharing`) — the local PDF is not served and there is nothing to compare. `grep -rln "tejitpabari_resume"` across the repo (excluding `node_modules`) returns zero code references, confirming it's safe to delete outright with the rest of `src/`. |
| `src/pages/research/{markdownRemark.frontmatter__slug}.jsx` | Gatsby GraphQL-templated dynamic route (`markdownRemark(id: { eq: $id })`) — the mechanism itself doesn't exist outside Gatsby; superseded by SP02/SP04's `vite-react-ssg` `getStaticPaths` templates (§4.7). |
| `src/templates/using-dsg.js` | Dead DSG demo page, see above. |
| `src/content/post1.md` | Placeholder trial content (`"Trial Stuff here / Trial 2 / Trial 3 / # High"`, repeated three times) — not one of the four real collections, not referenced by any surviving route. |
| `_redirects` | Confirmed 0 bytes (`wc -c` → `0`). Netlify-specific mechanism anyway; Firebase Hosting's `rewrites` in `firebase.json` (§4.9) is the direct replacement. |
| `package-lock.json` | Regenerated automatically the moment the new `package.json` (§4.2) is installed — not hand-authored, not something to carry forward. |
| All Gatsby/Chakra/emotion/styled-components/framer-motion `package.json` dependencies, plus the `netlify-shortener` devDependency and its `shorten` script | Superseded wholesale by the new stack (§4.2). `grep -rn "netlify-shortener\|gatsby-plugin-\|@chakra-ui\|styled-components\|framer-motion"` outside `package.json`/`package-lock.json` returns nothing — nothing in the app code depends on these beyond the manifest declaring them. |

**Preserved as-is (no content change needed for the stack migration):**

| Path | Note |
|---|---|
| `LICENSE` | The Gatsby starter's 0BSD text (`Copyright (c) 2020 Gatsby Inc.`). Its literal subject (the starter boilerplate) is being deleted, so the text is orphaned in meaning — but it's harmless to keep and replacing it is a taste call for the owner, not a migration requirement. Flagged, not acted on. |
| `.prettierrc` | `{"arrowParens": "avoid", "semi": false}` — an existing style preference, orthogonal to the framework. Kept unchanged. |
| `.dev/` | Planning artifacts (this PRD lives here). Not shipped in the build; no interaction with the app code. |

**Updated, not simply preserved:**

| Path | Change and why |
|---|---|
| `.gitignore` | Gatsby-era entries (`.cache/`, bare `public`) removed — `public` meant Gatsby's *build output* (gitignored) and now means Vite's *static-assets source folder* (favicon, résumé PDF — checked in, not ignored). Replaced with `juno-landing-page`'s proven set: `node_modules/`, `dist/`, `dist-ssr/`, `.env`/`.env.*` (with `!.env.example` un-ignored), `.firebase/`, `firebase-debug.log`, OS/editor cruft. See the full file in §4.2. |
| `.prettierignore` | Old contents (`.cache`, `package.json`, `package-lock.json`, `public`) rewritten to `dist`, `package.json`, `package-lock.json` — `public` no longer needs excluding (it holds binary assets prettier already ignores by extension; nothing text-based lives there yet). |
| `README.md` | Currently the *unmodified* Gatsby starter readme (confirmed by reading it — generic "Quick start," "🚀 Quick start," Gatsby CLI instructions, nothing project-specific). Rewritten to describe the actual stack, the `dev`/`build`/`preview`/`deploy` commands (§4.9), a pointer to `.dev/website-revamp/BRIEF.md` for the design record, and a pre-launch checklist section naming the manual gate scripts SP02/SP04 add later (`npm run check:launch`, `npm run check:no-forms`) — so running them before a real deploy is one documented command each, not a remembered procedure (SP02 §9). This isn't a separate task — it's the direct textual consequence of the toolchain in §4.2 existing at all, so SP01 owns it; the checklist section itself is filled in as SP02/SP04's scripts land, not populated speculatively here. |

### 4.2 Toolchain

**TypeScript: yes.** `juno-landing-page` uses it, and this project has five sub-projects handing typed data and props to each other across a max-depth-2 delegation model (SP02's content types feed SP03/SP04's components; SP01's component prop interfaces are consumed by SP03–SP06 directly) — the same reasoning `juno-landing-page`'s own 01 PRD gives (`tsc --noEmit` as "the highest-value, lowest-cost check available" for catching shape drift between sub-projects that don't share a conversation). No reason to diverge from the pattern source.

**`package.json`** — dependency-for-dependency mirror of `juno-landing-page`'s verified-working set, plus `prettier` carried over from the current repo (not in `juno-landing-page`, kept here because `.prettierrc` already exists and is a stated preference, not blind mirroring):

```json
{
  "name": "tejitpabari-website",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "author": "Tejit Pabari (tejitpabari99@gmail.com)",
  "license": "0BSD",
  "repository": { "type": "git", "url": "https://github.com/tejitpabari99/tejitpabari" },
  "bugs": { "url": "https://github.com/tejitpabari99/tejitpabari/issues" },
  "scripts": {
    "dev": "vite-react-ssg dev",
    "build": "tsc --noEmit && vite-react-ssg build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run",
    "format": "prettier --write \"**/*.{ts,tsx,json,md,css}\""
  },
  "dependencies": {
    "fuse.js": "^7.5.0",
    "gray-matter": "^4.0.3",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-markdown": "^10.1.0",
    "react-router-dom": "^6.14.1",
    "remark-gfm": "^4.0.1",
    "vite-react-ssg": "^0.9.2"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@tailwindcss/typography": "^0.5.20",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.3",
    "@types/node": "^24.13.3",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.4",
    "@vitejs/plugin-react": "^6.1.0",
    "autoprefixer": "^10.5.4",
    "eslint": "^10.9.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.4",
    "globals": "^17.11.0",
    "jsdom": "^29.1.1",
    "postcss": "^8.5.26",
    "prettier": "^3.8.1",
    "tailwindcss": "^3.4.19",
    "typescript": "~6.0.2",
    "typescript-eslint": "^8.67.0",
    "vite": "^8.2.2",
    "vitest": "^4.1.11"
  }
}
```

Note on `react-router-dom` pinning: `^6.14.1`, not the npm-`latest` v7 — `vite-react-ssg@0.9.2` targets React Router v6 (confirmed in its own README: "vite-react-ssg will continue to maintain SSG functionality for React Router v6 users"), and `juno-landing-page`'s real `package.json` (not just its planning doc) ships exactly this pin. An unpinned install would silently grab v7 and break.

Dropped from the old `package.json`: `baseUrl: "https://tejitpabari.com/"` — a custom field Gatsby never actually reads correctly either (see the wrong `siteUrl` in `gatsby-config.js`, §1); the closest live equivalent is a `VITE_SITE_URL` env var, which is SP06's concern once `RouteMeta`/sitemap generation need an absolute origin (matching `juno-landing-page/vite.config.ts`'s own `process.env.VITE_SITE_URL ?? 'https://meetjuno.health'` pattern).

**`vite.config.ts`:**

```ts
/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  ssgOptions: {
    dirStyle: 'nested', // dist/<route>/index.html — matches juno-landing-page; plays cleanly with Firebase's cleanUrls
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
});
```

No `sitemapPlugin` here (non-goal, §3) — `juno-landing-page`'s version is a good model for SP06 once real slugs/dates exist.

**`tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json`** — copied verbatim from `juno-landing-page` (generic Vite+TS project config, nothing project-specific to change): `@/*` → `./src/*` path alias, `target: es2023`, `moduleResolution: bundler`, `noUnusedLocals`/`noUnusedParameters` on, `types: ["vite/client"]` on the app config (so no separate `vite-env.d.ts` file is needed — `juno-landing-page` doesn't have one either, for the same reason).

**`postcss.config.js`** — copied verbatim:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**`eslint.config.js`** — copied verbatim (flat config, `js.configs.recommended` + `tseslint.configs.recommended` + `react-hooks` + `react-refresh`, `globals: globals.browser`, `dist` globally ignored).

**`.gitignore`** (replaces the Gatsby-era one, adapted from `juno-landing-page`'s):

```
node_modules/
dist/
dist-ssr/

.env
.env.*
!.env.example

.firebase/
.firebaserc.local
firebase-debug.log
firestore-debug.log

.DS_Store
Thumbs.db
coverage/
*.local

.vscode/*
!.vscode/extensions.json
.idea/

logs
npm-debug.log*
```

**`src/setupTests.ts`** — copied verbatim from `juno-landing-page` (needed the moment any page renders `<RouteMeta>`/`<Head>` in a test, which SP06 will do; setting this up now means SP03–SP06 don't each have to rediscover why a bare component test crashes on `<Head>`):

```ts
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// vite-react-ssg's <Head> (a react-helmet-async wrapper) needs a
// <HelmetProvider> from the exact module instance vite-react-ssg bundles
// internally, which only exists inside the real app tree (main.tsx) — not
// reachable from an isolated component test. Mock <Head> as a passthrough
// so tests can render pages that use it without crashing; the actual proof
// that tags land in <head> is a dist/ build-output audit (SP06's job).
vi.mock('vite-react-ssg', async () => {
  const actual = await vi.importActual<typeof import('vite-react-ssg')>('vite-react-ssg');
  return {
    ...actual,
    Head: ({ children }: { children?: React.ReactNode }) => children,
  };
});
```

### 4.3 Directory structure

```
tejitpabari/
├── .firebaserc
├── firebase.json
├── .gitignore
├── .prettierrc                 (unchanged)
├── .prettierignore              (updated, §4.1)
├── LICENSE                      (unchanged)
├── README.md                    (rewritten, §4.1)
├── package.json
├── tsconfig.json / .app.json / .node.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── eslint.config.js
├── index.html
├── .dev/                        (exists — planning artefacts, not shipped)
├── public/
│   └── favicon.png              (copied from src/images/cat.png before demolition — §4.1, §4.5)
└── src/
    ├── main.tsx
    ├── routes.tsx
    ├── index.css
    ├── setupTests.ts
    ├── content/
    │   ├── projects/            (SP02/SP07: *.md files + the real loader)
    │   │   └── index.ts         (SP01 stub — §4.7)
    │   ├── research/
    │   │   └── index.ts         (SP01 stub — §4.7)
    │   ├── work-experience/     (empty — SP02/SP07)
    │   └── legal/               (empty — SP05/SP07)
    ├── config/                  (empty — SP02's featured.ts, SP05's contact.ts land here)
    ├── layout/
    │   ├── PageShell.tsx
    │   ├── Nav.tsx
    │   └── Footer.tsx
    ├── components/
    │   ├── Button.tsx
    │   ├── TagPill.tsx
    │   ├── BackButton.tsx
    │   └── icons/
    │       ├── GitHubIcon.tsx
    │       ├── LinkedInIcon.tsx
    │       ├── EmailIcon.tsx
    │       ├── ExternalLinkIcon.tsx
    │       └── ArrowIcon.tsx
    ├── hooks/
    │   └── useDebouncedValue.ts   (ported verbatim from juno-landing-page — §6, consumed by SP04's useCollectionFilter)
    ├── lib/
    │   └── ScrollManager.tsx
    └── pages/
        ├── HomePage.tsx
        ├── ProjectsPage.tsx
        ├── ProjectDetailPage.tsx
        ├── ProjectLivePage.tsx
        ├── WorkExperiencePage.tsx
        ├── ResearchPage.tsx
        ├── ResearchDetailPage.tsx
        ├── PrivacyPage.tsx
        ├── TermsPage.tsx
        └── NotFoundPage.tsx
```

**Judgment call — `content/`, `config/` pre-scaffolded empty**, mirroring `juno-landing-page`'s own precedent of pre-creating `sections/`/`hooks/`/`config/` in 01 so downstream sub-projects have one settled place to add files instead of each inventing its own layout. Nothing about SP01's own contract depends on these being empty.

**Judgment call — icons live in a `components/icons/` subfolder**, not flat in `components/`. Six small files justify one level of grouping; `juno-landing-page` doesn't have this problem (it has zero icons) so there's no existing convention to match here.

### 4.4 Design tokens

All hex values and class patterns below are grepped directly from `_reference-techfolio/app/page.tsx` and `app/projects/[slug]/page.tsx` (cited inline), not re-derived from the brief's summary.

**`tailwind.config.ts`:**

```ts
import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F7F1E8',        // primary background
        sage: '#DDE7DE',         // secondary/card background
        teal: {
          DEFAULT: '#043439',    // primary accent
          secondary: '#0F4C45',  // borders, links, labels, icons
        },
        ink: '#162b26',          // primary text
        body: '#3E514D',         // body text
        slate: '#6B7B77',        // tertiary text (lighter)
        'slate-dark': '#4D5D59', // tertiary text (darker)
        placeholder: '#EEF3EE',  // image placeholder background
      },
      fontFamily: {
        sans: [
          'Montserrat',
          'ui-sans-serif', 'system-ui', '-apple-system',
          'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif',
        ],
      },
      borderRadius: {
        xl2: '1rem',       // inner media frames — e.g. app/projects/[slug]/page.tsx:278
        card: '1.05rem',   // landing project cards — app/page.tsx:445
        panel: '1.15rem',  // About/Contact aside panels — app/page.tsx:371,522
        section: '1.25rem',// detail-page content sections — app/projects/[slug]/page.tsx (dominant value, 25+ hits)
      },
      boxShadow: {
        pill: '0 14px 40px rgba(22,43,38,0.08)',        // nav pill — app/page.tsx:239
        panel: '0 16px 34px rgba(22,43,38,0.06)',        // About/Contact aside — app/page.tsx:371
        card: '0 14px 28px rgba(22,43,38,0.05)',         // project card default — app/page.tsx:445
        'card-hover': '0 18px 34px rgba(22,43,38,0.08)', // project card hover — app/page.tsx:445
        section: '0 12px 28px rgba(22,43,38,0.05)',      // detail-page sections — app/projects/[slug]/page.tsx (dominant value)
      },
      maxWidth: {
        content: '72rem',
      },
    },
  },
  plugins: [typography],
} satisfies Config;
```

**Border-opacity convention (documented, not tokenized):** borders are always `border-teal-secondary/<N>` at 10–22% — never a flat gray, matching techfolio exactly (`border-[#0F4C45]/12`, `/15`, `/18`, `/22` all appear at different call sites). This is left as Tailwind's built-in opacity-modifier syntax on the named `teal-secondary` color rather than baked into named tokens, because the exact opacity is a per-context decision (12% default card border, 15% nav pill/tag pill, 18% dashed placeholder borders, 22% hover state) — tokenizing five near-identical values would just relocate the same judgment call one file over.

**Where a token vs. an arbitrary bracket value is appropriate:** any color, radius, or shadow that repeats across ≥2 components gets a named token above. A one-off value specific to a single, non-reused element (e.g. the exact px offsets inside a hand-tuned decorative shape) stays an arbitrary Tailwind bracket value at the call site, exactly as the reference does it — this project doesn't invent new decorative one-offs (gsap-driven scroll-cue decorations are dropped per brief's no-animation-library non-goal), so in practice this case barely arises outside spacing/sizing that's already covered by Tailwind's default scale.

### 4.5 Montserrat

Brief §3 locks the mechanism: "Montserrat via Google Fonts, loaded once in the app's root layout — not duplicated per-page the way the reference does it." Confirmed directly: `app/page.tsx:6-11` and `app/projects/[slug]/page.tsx:4,7` both call `Montserrat({ subsets: ["latin"] })` via `next/font/google` independently — two separate font-loading calls in two files, which is the Next.js-specific mechanism this project doesn't have (Vite has no `next/font`).

For a Vite SPA, the direct translation of "loaded once in the root layout" is `index.html`'s `<head>` — it's the one template every prerendered route's HTML is generated from, so there's no way to duplicate the font call per-page even by accident (the bug in the reference was calling the loader twice in two component files, not "the font tag appears in every HTML file," which is normal and expected for any global asset in a multi-page SSG).

```html
<!-- index.html, inside <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap"
  rel="stylesheet"
/>
```

**Weights: 400, 500, 600, 700, 800.** Grepped actual usage in the reference (`grep -oE "font-(thin|...|black)"` across `app/page.tsx` and `app/projects/[slug]/page.tsx`): `font-extrabold` (800) — 36 hits, `font-semibold` (600) — 37 hits, `font-medium` (500) — 8 hits, plus implicit 400 (regular body text, no weight class). `font-bold` (700) has zero hits in the reference, but is included anyway because it's one of Tailwind's default weight utilities (`font-bold`) and any of SP02–SP06 reaching for it later should get real Montserrat Bold, not the browser's synthetic-bold fallback rendering of 600.

**Fallback stack:** `Montserrat, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif` — set as `theme.extend.fontFamily.sans` in `tailwind.config.ts` (§4.4), so it applies globally the moment Tailwind's Preflight base styles are in effect, with no `font-sans`/`className={montserrat.className}`-equivalent needed on any wrapper element (the reference applies the font via a className on `<main>`; Tailwind's own default-sans mechanism does the equivalent job here with zero per-page wiring).

**Not self-hosted.** Brief §3 explicitly names Google Fonts as the mechanism, not `next/font`'s self-hosting-with-build-time-optimization (which has no Vite equivalent) and not a hand-vendored `@font-face`. This is a locked decision, not re-litigated here.

**Favicon — resolved, the existing cat silhouette, overriding an earlier monogram resolution (§9, owner decision).** A previous pass resolved the favicon as a "TP monogram" placeholder SVG and specified deleting `src/images/cat.png` as the unrelated Gatsby-starter mascot. **The owner overrode this directly: the cat stays.** Verified directly, not re-described from the earlier (incorrect) characterization: `src/images/cat.png` is a **512×512 PNG of a solid black walking-cat silhouette on a transparent background** — it is NOT the Gatsby starter mascot. It's a clean, high-contrast silhouette that reads correctly at 16×16, exactly what a favicon needs.

Per the carve-out in §4.1: `src/images/cat.png` is copied to `public/favicon.png` **before** `src/` is demolished — this is the only file surviving that demolition step. No image tooling or conversion needed; it's copied verbatim (PNG in, PNG out).

```html
<!-- index.html, inside <head>, alongside the Montserrat link tags above -->
<link rel="icon" type="image/png" href="/favicon.png" />
<link rel="apple-touch-icon" href="/favicon.png" />
```

Shipped as-is, in black — black-on-transparent renders correctly against both light and dark browser chrome, which a teal (`#043439`) version would not necessarily. Recoloring it to the palette accent is a one-value change (a CSS/SVG recolor, or a re-export) if the owner ever wants it, but nothing about shipping the asset as-is today is a placeholder or a compromise — it's the resolved choice.

`public/favicon.png` is listed in §4.3's directory structure. See §8 for the owner's standing option to replace it with a different asset later.

### 4.6 Shared components

Each component below is built here and consumed by the sub-project(s) named. Full prop interfaces given since three other sub-projects import these directly without seeing this conversation.

**`Nav`** (`src/layout/Nav.tsx`) — consumed by `PageShell` only (no props; rendered once per app via the layout route).

Ports techfolio's floating-pill markup (`app/page.tsx:239` — `<div className="mx-auto flex w-fit items-center justify-center rounded-full border ... backdrop-blur-md">`) and its manual scroll-listener active-section logic (`app/page.tsx:141-179`), with three deliberate departures:

1. **No "Home" item.** Brief nav = Projects, Work Experience, About, Contact only (brief §2/§3) — no fifth "Home" tab the way techfolio has.
2. **"Nothing in the top-left corner"** is satisfied structurally, not just by omission: the `<header>` is a full-width `fixed` bar, but its only child is one `mx-auto w-fit` centered pill — there is no three-column (logo-left / nav-center / actions-right) grid to begin with, so there's no top-left slot that could ever be filled by accident. This is exactly techfolio's own layout, which already has nothing in that corner (its wordmark lives inside the hero, not the nav).
3. **Route-aware re-scanning, which techfolio's single-page reference doesn't need.** Techfolio has exactly one page, so its `useEffect(() => {...}, [])` capturing `document.getElementById(...)` once at mount is safe — the sections it's looking for exist from the first render onward, forever. This site has multiple routes sharing one persistent `Nav` (react-router's layout-route pattern keeps `PageShell` mounted across sibling-route navigation, so `Nav` itself never remounts). If `Nav`'s effect only ran once, a user landing first on `/research/foo` (where none of the four section ids exist yet) and then clicking `BackButton` to `/` would have a `Nav` stuck with a scroll listener still checking stale (`null`) element references. Fixed by keying the effect on `location.pathname` and re-querying `document.getElementById` inside the scroll handler itself (not cached outside it), and explicitly clearing `activeSection` to `null` whenever `pathname !== '/'` — so a sub-page never shows a leftover highlighted pill.

```tsx
// src/layout/Nav.tsx
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_LINKS } from '@/config/links';

// NAV_LINKS entries are { label, href } with href always of the shape
// "/#<sectionId>" (§9, coordinating with SP02 §4.5.4's validator, which
// checks this same array's hrefs against KNOWN_STATIC_ROUTES). Nav's own
// active-section logic needs the bare sectionId to match against
// document.getElementById, so it's derived here rather than duplicated as a
// second field on NAV_LINKS.
const sectionIdOf = (href: string) => href.slice(2); // "/#projects" -> "projects"

const SCROLL_OFFSET = 140; // px — matches techfolio's own threshold (app/page.tsx:145)

export function Nav() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname !== '/') {
      setActiveSection(null);
      return;
    }

    const updateActiveSection = () => {
      const nearPageBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 32;
      if (nearPageBottom) {
        setActiveSection(sectionIdOf(NAV_LINKS[NAV_LINKS.length - 1].href));
        return;
      }
      const scrollMarker = window.scrollY + SCROLL_OFFSET;
      let current: string | null = null;
      for (const item of NAV_LINKS) {
        const sectionId = sectionIdOf(item.href);
        const el = document.getElementById(sectionId);
        if (el && scrollMarker >= el.offsetTop) current = sectionId;
      }
      setActiveSection(current);
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
      <div className="mx-auto flex w-fit items-center justify-center rounded-full border border-teal-secondary/15 bg-cream/92 p-1.5 shadow-pill backdrop-blur-md">
        <nav aria-label="Primary">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((item) => {
              const sectionId = sectionIdOf(item.href);
              return (
                <li key={sectionId}>
                  <Link
                    to={item.href}
                    className={`block rounded-full px-4 py-2 text-[0.8rem] font-semibold transition sm:px-4.5 sm:py-2.5 sm:text-[0.83rem] lg:px-5 lg:py-2.5 lg:text-[0.88rem] ${
                      activeSection === sectionId
                        ? 'bg-teal text-white shadow-[0_10px_24px_rgba(4,52,57,0.22)]'
                        : 'text-teal-secondary hover:bg-teal-secondary/8'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
```

**Data-driven, per SP02 §4.5.4/§9's cross-check.** `NAV_LINKS` is no longer a local array inside `Nav.tsx` — it's imported from `src/config/links.ts` (SP03-owned, §4.6 below), the same file `FOOTER_LINKS` and `RESUME_URL` live in, so SP02's build-time validator can check every nav/footer href against `KNOWN_STATIC_ROUTES` in one place. `Nav.tsx` itself is otherwise unchanged — same scroll logic, same markup, same four items, just no longer the place that array is defined.

No mobile hamburger (brief §3, locked) — four items at this pill's font sizes reflow within the pill's own `w-fit` sizing at any viewport width; techfolio ships the identical nav with no breakpoint-specific menu logic.

**`Footer`** (`src/layout/Footer.tsx`) — consumed by `PageShell` only. **Contents, resolved (§9): Research, Privacy, Terms, Résumé, then the techfolio credit line, then copyright.** Brief §2/§3's literal enumeration ("Research, Résumé, techfolio credit line, copyright") predates `/privacy`/`/terms` being locked into the same brief's route table, and the nav deliberately carries no home/logo affordance — so built exactly as literally enumerated, the two legal routes would be reachable only by typing the URL. A privacy policy that can't be found doesn't do the job a privacy policy exists to do, so both links ship in the footer:

```tsx
// src/layout/Footer.tsx
import { Link } from 'react-router-dom';
import { FOOTER_LINKS } from '@/config/links'; // SP03-owned — see §9
import { isExternalUrl } from '@/lib/isExternalUrl';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-teal-secondary/10 bg-cream">
      <div className="mx-auto flex w-full max-w-content flex-col items-center gap-3 px-6 py-8 text-center sm:px-8 md:px-10 lg:px-12">
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-4 text-[0.78rem] font-semibold text-teal-secondary">
          {FOOTER_LINKS.map((item) =>
            isExternalUrl(item.href) ? (
              <a key={item.href} href={item.href} target="_blank" rel="noreferrer" className="hover:text-teal">
                {item.label}
              </a>
            ) : (
              <Link key={item.href} to={item.href} className="hover:text-teal">
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <p className="text-[0.72rem] text-slate">
          Visual design adapted from{' '}
          <a
            href="https://github.com/brittnebaila/techfolio"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-teal-secondary"
          >
            Brittne Valdivia&rsquo;s techfolio
          </a>
          .
        </p>
        <p className="text-[0.72rem] text-slate">© {year} Tejit Pabari</p>
      </div>
    </footer>
  );
}
```

The credit line's exact wording ("Portfolio template adapted from Brittne Valdivia: https://github.com/brittnebaila/techfolio") is the reference repo's own README-recommended text (`_reference-techfolio/README.md`, "Recommended Credit" section), reworded minimally to read as a sentence rather than a code block, and pointed at the exact repo path.

**`FOOTER_LINKS` is imported, not hardcoded here (§9), for two independent reasons.** First, per SP02 §4.5.4/§9: SP02's build-time validator checks every nav/footer href against `KNOWN_STATIC_ROUTES`, which requires the hrefs to exist as data, not JSX literals — `Footer` renders whatever `FOOTER_LINKS` says (Research, Privacy, Terms internal; Résumé external, distinguished via `isExternalUrl`, the same SP01-owned utility SP02 §4.8 already assumes) rather than hardcoding four separate elements. Second, per SP01 §9/SP03 §9: the Résumé entry's `href` (the Drive link) is quoted in exactly one place, `src/config/links.ts`'s `FOOTER_LINKS` array — so when the owner resolves the Drive-vs-local-PDF open item (§8), it's a one-line change in one file rather than a find-and-replace. `src/config/links.ts` is SP03-owned (see SP03's PRD §4 for its full contents, including `NAV_LINKS` and `RESUME_URL`); SP01 only consumes `FOOTER_LINKS` from it here.

**`PageShell`** (`src/layout/PageShell.tsx`) — the router's layout element:

```tsx
// src/layout/PageShell.tsx
import { Outlet } from 'react-router-dom';
import { ScrollManager } from '@/lib/ScrollManager';
import { Nav } from './Nav';
import { Footer } from './Footer';

export function PageShell() {
  return (
    <>
      <ScrollManager />
      <Nav />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
```

**Hand-off to SP05:** `juno-landing-page/src/layout/PageShell.tsx` wraps this exact same shape in `<ConsentProvider>` and adds `<AnalyticsListener/>` + `<ConsentBanner/>`:

```tsx
// what SP05 changes this file into (juno-landing-page's actual, working shape)
export function PageShell() {
  return (
    <ConsentProvider>
      <ScrollManager />
      <AnalyticsListener />
      <Nav />
      <main><Outlet /></main>
      <Footer />
      <ConsentBanner />
    </ConsentProvider>
  );
}
```
SP05 edits this file directly rather than SP01 building the consent plumbing speculatively — `ConsentContext`/`analytics.ts`/`ConsentBanner` don't exist yet and are entirely SP05's design.

**`ScrollManager`** (`src/lib/ScrollManager.tsx`) — consumed by `PageShell` only. Copied verbatim from `juno-landing-page/src/lib/ScrollManager.tsx` — already proven, no changes needed:

```tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      const scroll = () => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      requestAnimationFrame(() => requestAnimationFrame(scroll));
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  return null;
}
```

**`Button`** (`src/components/Button.tsx`) — consumed by SP03 (hero CTAs, "Email Me"), SP04 (any inline external-link buttons on detail pages), SP05 (legal-page consent actions, if any). Solid + outline variants per brief §3, class values taken directly from techfolio's hero CTAs (`app/page.tsx:262-276`):

```tsx
// src/components/Button.tsx
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'solid' | 'outline';

type CommonProps = {
  variant?: ButtonVariant; // default 'solid'
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { href?: undefined };

type ButtonAsAnchor = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const BASE =
  'inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold transition lg:px-7 lg:py-3 lg:text-[0.92rem]';

const VARIANTS: Record<ButtonVariant, string> = {
  solid: 'bg-teal text-white hover:opacity-90',
  outline: 'border border-teal-secondary text-teal-secondary hover:bg-teal-secondary hover:text-white',
};

export function Button({ variant = 'solid', className = '', children, ...rest }: ButtonProps) {
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`;
  if ('href' in rest && rest.href) {
    return (
      <a className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }
  return (
    <button className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
```

**Deliberately not router-aware.** `Button` renders a plain `<a>` or `<button>`, never a react-router `<Link>` — every real use case in the brief (mailto, external résumé/hero links, form-less "Contact Me" anchor) is a plain anchor or click handler, and brief §2 is explicit that a project/research **card** always routes internally via `<Link>`, never via a button-styled external link. A component consumer needing internal client-side navigation styled like a button should compose `<Link className={...}>` directly with the same class strings, or SP03/SP04 can add a thin `LinkButton` variant later if a real case shows up — not invented speculatively here.

**`TagPill`** (`src/components/TagPill.tsx`) — consumed by SP03/SP04 (project/research cards, the shared `SearchFilter`'s filter chips). Static display styling ported directly from `app/page.tsx:495-501`; the `active`/`onClick` states are a **new addition**, not in the reference (techfolio's tags are always static, never a filter control) — added because brief §2/§3 requires a tag-filter component on `/projects` and `/research` that this component will need to serve double duty for:

```tsx
// src/components/TagPill.tsx
import type { ReactNode } from 'react';

interface TagPillProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TagPill({ children, active = false, onClick, className = '' }: TagPillProps) {
  const Tag = onClick ? 'button' : 'span';
  const base = 'rounded-full border px-2 py-1 text-[0.62rem] font-semibold transition sm:text-[0.66rem]';
  const tone = active
    ? 'border-teal bg-teal text-white'
    : 'border-teal-secondary/15 bg-cream text-teal-secondary';
  return (
    <Tag onClick={onClick} className={`${base} ${tone} ${className}`}>
      {children}
    </Tag>
  );
}
```

**`BackButton`** (`src/components/BackButton.tsx`) — consumed by SP03 (`/work-experience`), SP04 (`/projects`, `/research`, and every `<slug>` detail page). Always targets `/`, per brief's explicit reasoning ("the nav bar has no 'home' affordance once you're off the landing page"):

```tsx
// src/components/BackButton.tsx
import { Link } from 'react-router-dom';
import { ArrowIcon } from './icons/ArrowIcon';

export function BackButton({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-teal-secondary transition hover:text-teal ${className}`}
    >
      <ArrowIcon className="h-4 w-4 rotate-180" />
      Back
    </Link>
  );
}
```

**Icon set** (`src/components/icons/*.tsx`) — `GitHubIcon`, `LinkedInIcon`, `EmailIcon` are ported verbatim from `app/page.tsx` (they're generic geometric SVG path data — GitHub's octocat mark, a generic envelope glyph — not "personal content" under the MIT/content split in brief's Attribution decisions). Each takes one prop: `{ className?: string }`, defaulting to `h-4 w-4`. `ExternalLinkIcon` and `ArrowIcon` are new — techfolio has no equivalent (its "Read More" affordance in the old Gatsby site used Chakra's `ArrowForwardIcon`; techfolio itself has no external-link glyph at all) — authored in the same outline stroke style as the reference's own `EmailIcon` (`fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"`) for visual consistency:

```tsx
// src/components/icons/ExternalLinkIcon.tsx
export function ExternalLinkIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none"
      stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 5h5v5" />
      <path d="M19 5l-9 9" />
      <path d="M9 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" />
    </svg>
  );
}
```
```tsx
// src/components/icons/ArrowIcon.tsx
export function ArrowIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none"
      stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}
```
`ArrowIcon` points right by default; `BackButton` rotates it 180° rather than needing a second "left arrow" component.

**Consumer map:**

| Component | Built here | Consumed by |
|---|---|---|
| `Nav`, `Footer`, `PageShell`, `ScrollManager` | SP01 | Every route, via the router (SP05 extends `PageShell`) |
| `Button` | SP01 | SP03 (hero/contact CTAs), SP05 |
| `TagPill` | SP01 | SP03/SP04 (cards, `SearchFilter`) |
| `BackButton` | SP01 | SP03 (`/work-experience`), SP04 (list + detail pages) |
| Icon set | SP01 | SP03 (hero/contact social icons), SP04 (card external-link affordance) |

**`useDebouncedValue`** (`src/hooks/useDebouncedValue.ts`) — a small, generic, content-agnostic hook ported verbatim from `juno-landing-page`, consumed by SP04's `useCollectionFilter` (the `/projects`/`/research` search debounce). It's a four-line hook with no reason to differ between projects, and SP01 owns `src/hooks/`, so it lands here rather than being created ad hoc by whichever page happens to need it first — resolving SP04 §9's item flagging this hook's existence as an unconfirmed assumption:

```ts
// src/hooks/useDebouncedValue.ts
import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}
```

### 4.7 Routing skeleton and the `getStaticPaths` seam

Full brief §3 route table, registered as `vite-react-ssg`'s `RouteRecord[]` (confirmed shape and mechanism directly from `juno-landing-page/src/routes.tsx`, `src/main.tsx`, and `node_modules/vite-react-ssg/README.md` — not assumed):

```tsx
// src/main.tsx
import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './routes';
import './index.css';

export const createRoot = ViteReactSSG({
  routes,
  basename: import.meta.env.BASE_URL,
});
```

```tsx
// src/routes.tsx
import type { RouteRecord } from 'vite-react-ssg';
import { PageShell } from '@/layout/PageShell';
import { HomePage } from '@/pages/HomePage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { ProjectLivePage } from '@/pages/ProjectLivePage';
import { WorkExperiencePage } from '@/pages/WorkExperiencePage';
import { ResearchPage } from '@/pages/ResearchPage';
import { ResearchDetailPage } from '@/pages/ResearchDetailPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { TermsPage } from '@/pages/TermsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { projectSlugs } from '@/content/projects';
import { researchSlugs } from '@/content/research';

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <PageShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'projects', element: <ProjectsPage /> },
      {
        path: 'projects/:slug',
        element: <ProjectDetailPage />,
        getStaticPaths: () => projectSlugs.map((slug) => `projects/${slug}`),
      },
      {
        path: 'projects/:slug/live',
        element: <ProjectLivePage />,
        getStaticPaths: () => projectSlugs.map((slug) => `projects/${slug}/live`),
      },
      { path: 'work-experience', element: <WorkExperiencePage /> },
      { path: 'research', element: <ResearchPage /> },
      {
        path: 'research/:slug',
        element: <ResearchDetailPage />,
        getStaticPaths: () => researchSlugs.map((slug) => `research/${slug}`),
      },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
```

**How `vite-react-ssg` discovers dynamic routes for prerendering (this is the mechanism SP04/SP06 depend on):** a route with a `:param` segment is only prerendered for the concrete paths its `getStaticPaths()` function returns — a plain array of path strings, resolved once at build time. `juno-landing-page`'s real `routes.tsx` shows this exact pattern already working in production: `getStaticPaths: () => projects.map((p) => \`projects/${p.slug}\`)`. No `:param` route without a `getStaticPaths` gets prerendered at all (it would only ever be reachable client-side after JS hydrates) — which is why `work-experience` and the collection index pages (`projects`, `research`) don't need one: they're static paths, not dynamic segments.

**The seam SP02 must fill:** `src/content/projects/index.ts` and `src/content/research/index.ts` must each export a slug array from that same import path — `projectSlugs: string[]` / `researchSlugs: string[]` (or equivalently, a full typed array with a `.slug` field that `routes.tsx` maps over; either shape satisfies the contract, since `routes.tsx` only needs strings to hand `getStaticPaths`). SP01 ships a **placeholder** implementation so the app builds today, before SP02 exists:

```ts
// src/content/projects/index.ts — PLACEHOLDER, replaced by SP02's real gray-matter loader.
// Contract: keep exporting `projectSlugs: string[]` from this exact path —
// src/routes.tsx imports it directly for getStaticPaths.
export const projectSlugs: string[] = [];
```
```ts
// src/content/research/index.ts — same contract, same placeholder shape.
export const researchSlugs: string[] = [];
```

With both arrays empty, `projects/:slug`, `projects/:slug/live`, and `research/:slug` simply prerender zero pages today — the routes exist and typecheck, but there's nothing to visit until SP02 lands real slugs. This is expected and correct for SP01's scope.

**The `/projects/<slug>/live` dual-mode route** (redirect to `liveUrl` if set, else a real hosted page — brief §2) is SP04's design, not built here. SP01 registers the route shape (above) and a placeholder `ProjectLivePage`, and hands SP04 the one relevant mechanism found in `vite-react-ssg`'s own README under "Redirect": since `getStaticPaths`/`loader` only run at build time and cannot redirect, a client-side `useNavigate()` call inside a `useEffect` is the documented pattern for a build-time-static route that needs to conditionally redirect at runtime. SP04 decides how the per-slug `liveUrl` frontmatter reaches that component (via SP02's loader) — not designed here.

**404 and the accepted static-hosting trade-off.** `path: '*'` is a genuine catch-all React Router route, resolving to a real `NotFoundPage` client-side. It cannot be enumerated by `getStaticPaths` (it has no concrete path), so it is never itself prerendered to a physical HTML file. Combined with `firebase.json`'s catch-all rewrite (`"source": "**", "destination": "/index.html"`, §4.9) — every URL, including a genuinely bad one, is served the exact same prerendered `/index.html` (the home route's static markup) with an HTTP 200, and only after React hydrates client-side does the router match `*` and swap in `NotFoundPage`. This means: (a) there is no true HTTP 404 status anywhere on this site, and (b) a bad URL briefly shows the home page's static shell before hydration corrects it. Both are accepted, not solved — this is the exact same trade-off `juno-landing-page`'s production Firebase config already ships with (it has no catch-all route at all, meaning a bad URL there renders *nothing* under `PageShell`'s `<Outlet/>`; ours is a strict improvement, not a regression). Not tracked as an open decision — it's a direct, inherited consequence of the SPA-rewrite hosting model brief §3 already locks, not a new decision.

**Placeholder pages** (all in `src/pages/`, following `juno-landing-page`'s own 01 precedent of shipping *minimal real content*, not truly empty files, so routing/anchor-scroll/Nav can be proven end-to-end before SP02–SP06 build on top):

- `HomePage.tsx` — a hero-shaped stub plus four `<section id="…">` blocks (`projects`, `work-experience`, `about`, `contact`), each with `scroll-mt-24` so `ScrollManager`'s `scrollIntoView` lands below the floating nav pill, not under it. SP03 replaces the section bodies; it does not touch the `id`s or the `scroll-mt-24` convention without a reason, since `Nav`'s scroll math depends on them.
- `ProjectsPage.tsx`, `ProjectDetailPage.tsx`, `ProjectLivePage.tsx`, `WorkExperiencePage.tsx`, `ResearchPage.tsx`, `ResearchDetailPage.tsx`, `PrivacyPage.tsx`, `TermsPage.tsx` — each a `BackButton` + a one-line heading naming which sub-project fills it in. `ProjectDetailPage`/`ResearchDetailPage` additionally read `useParams<{ slug: string }>()` and echo the slug, so SP04 has a working param-reading example to build from.
- `NotFoundPage.tsx` — **fully built, not a placeholder** (generic copy, no owner-specific fact needed): `BackButton` + "Page not found" + one line of body text.

### 4.8 Anchor-scroll cross-page navigation

The one genuinely non-trivial interaction in this site: clicking "About" from `/research/some-slug` must navigate to `/` *and then* scroll to `#about`; clicking it while already on `/` must just scroll, no reload. Resolved identically to `juno-landing-page`'s own proven solution — **plain `<Link>` with a combined `to`, plus one route-level `ScrollManager`** (§4.6):

```tsx
<Link to="/#about">About</Link>
```

React Router treats `/#about` as an ordinary navigation to pathname `/` with hash `#about`, from *any* current route — no custom click handler, no `navigate()`-then-`setTimeout` hack. `ScrollManager`, mounted once in `PageShell` (so it runs on every route change regardless of which page is active), reads `location.hash` after the navigation commits and calls `scrollIntoView` on the matching element, with a double-`requestAnimationFrame` fallback for cases where layout hasn't settled yet (e.g., a still-loading hero image reserving space). No-hash navigations (e.g. clicking a project card) fall through to `window.scrollTo(0, 0)` in the same effect, so users land at the top of a fresh page rather than wherever the previous page's scroll position was.

**Known, accepted edge case (inherited from `juno-landing-page`, not re-solved here):** clicking "About" twice in a row while already sitting at `#about` does not re-trigger a scroll, because `location.hash` doesn't change between the two clicks and React Router doesn't bump `location.key` for an identical `to`. Cosmetically harmless — the user is already there.

### 4.9 Firebase Hosting

**`firebase.json`** — single-site config (no multi-site `target`, unlike `juno-landing-page`'s, which hosts four independent sites under one Firebase project; this site is its own standalone Firebase project, so the simpler single-default-site shape applies), mirroring the exact `public`/`cleanUrls`/rewrite/cache shape the task spec calls for:

```jsonc
{
  "hosting": {
    "public": "dist",
    "cleanUrls": true,
    "trailingSlash": false,
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ],
    "headers": [
      {
        "source": "**/assets/**",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
        ]
      },
      {
        "source": "**/index.html",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache" }
        ]
      }
    ]
  }
}
```

`public: "dist"` matches Vite's default output dir (no Vite config change needed). `**/assets/**` matches Vite's hashed-filename asset output — safe to cache for a year, `immutable` since the filename changes on every content change. `**/index.html` explicitly `no-cache` so a new deploy is picked up immediately rather than served stale.

**`.firebaserc`** — real project ID, now that the owner has created the project:

```jsonc
{
  "projects": {
    "default": "tejitpabari-99"
  }
}
```

Hosting site ID is `tejitpabari-99` (matches the project ID — Firebase's default when no separate site is created), so the default Hosting URL is `https://tejitpabari-99.web.app`. That's the URL step 4 of the manual QA checklist (§8 item 4) is run against before DNS cuts over.

**DNS cutover — in progress, owner-only, documented here, not designed further:**

1. ~~Owner creates a real Firebase project~~ **Done.** The project is `tejitpabari-99`; `.firebaserc` above ships the real ID.
2. `firebase deploy` from the branch — reachable at `https://tejitpabari-99.web.app`.
3. `tejitpabari.com` and `www.tejitpabari.com` are added as custom domains in the Firebase Hosting console. Firebase's verification/target records: `A → 199.36.158.100`, `TXT hosting-site=tejitpabari-99`.
4. **In flight:** the owner is cutting the domain's DNS over from Cloudflare-proxied to Firebase — the relevant records are being set to DNS-only (grey-cloud, not proxied through Cloudflare) and pointed at the records in step 3. `main` (the current Netlify site) is untouched and keeps serving live traffic until this step completes — brief §2's explicit zero-downtime requirement.
5. Once DNS propagates and Firebase reports the custom domain "Connected" with a provisioned SSL certificate (Firebase docs put this at up to ~24h after correct records are visible), the owner confirms the new site is live at the real domain, and can then decommission the Netlify site at their discretion.

Steps 3–5 require Firebase console/DNS-registrar access only the owner has — tracked in §8, not designed further here (brief §5 already calls this "the single hard launch blocker"). Step 1 is resolved (§9); the remaining owner action narrows to completing the DNS cutover and waiting for the "Connected" status.

**Deploy pipeline (GitHub Actions)**

The owner installed the Firebase Hosting GitHub integration on `github.com/tejitpabari99/tejitpabari`, which scaffolds two workflows — typically `.github/workflows/firebase-hosting-merge.yml` (deploys on push to `main`) and `.github/workflows/firebase-hosting-pull-request.yml` (deploys PRs to preview channels) — plus a `FIREBASE_SERVICE_ACCOUNT_*` repository secret the integration creates for itself. **As of this PRD, neither workflow file, nor the service-account secret, nor any repository variable is present on `origin` (checked directly: `git ls-tree -r origin/main`, `gh secret list`, `gh variable list`, and all three branches on the remote — none show it)** — the integration install evidently hasn't pushed its scaffold yet, or the owner ran it against a different checkout. Regardless, brief §4's "no CI" non-goal is superseded by fact once these workflows do land (this PRD's job is to specify how they get reconciled, not to gate on their exact current push state):

- **The scaffolded build step is wrong for this rewrite and must be reconciled.** The Firebase integration generates its workflow against whatever repo state exists at install time — the current Gatsby repo — so its default build command and output directory target Gatsby, not this rewrite. Once the workflow files exist (on `main` or in a PR), they must be edited to: `npm ci`, `npm run build` (§4.2's `tsc --noEmit && vite-react-ssg build`), and Firebase's `public` set to **`dist`**, matching `firebase.json` above. Node version: **20** (the actions runner should use `actions/setup-node@v4` with `node-version: 20`, matching the machine's installed `v20.20.1`).
- **The workflow must pass `VITE_GA_MEASUREMENT_ID` into the build environment** (SP05 §4.3) — sourced from a repository variable or secret (`vars.VITE_GA_MEASUREMENT_ID` or `secrets.VITE_GA_MEASUREMENT_ID`; either works since it isn't sensitive, §SP05 §4.3), exported as `env:` on the build step. Without this, GA silently no-ops in the production build (SP05 §4.3's dev-mode/missing-ID guards apply equally in CI) — a deploy that "succeeds" while quietly shipping with no analytics.
- **Operational consequence — read this before merging `website-revamp` into `main`:** the merge workflow deploys to Hosting's live channel on every push to `main`. There is no separate "deploy" step distinct from the merge — **merging `website-revamp` into `main` IS the production cutover.** `main` must not be pushed to (directly, or by merging this branch) before the rewrite is actually ready to go live, because doing so deploys a broken/incomplete build over whatever is currently live at that moment (which, per the DNS cutover state above, may already be the new `tejitpabari-99` site rather than Netlify).
- **The pull-request workflow's preview-channel deploys are genuinely useful here**, beyond the integration's generic value: they give a real, shareable Hosting URL to check OG/share-preview rendering and the prerendered `<head>` output (SP06's concern) before merging, rather than trusting `vite preview` locally.

---

## 5. API Change Summary

N/A. This is a fully static site — every route is prerendered HTML at build time, with no backend, database, or API of any kind in this sub-project or the initiative as a whole (locked non-goal, brief §4).

---

## 6. Frontend Change Summary

| Type | Name | Path | Notes |
|---|---|---|---|
| Route | `/` | `src/pages/HomePage.tsx` | Placeholder hero + 4 `<section id>` stubs; real content is SP03's scope |
| Route | `/projects` | `src/pages/ProjectsPage.tsx` | Placeholder; search/filter/grid is SP04's scope |
| Route | `/projects/:slug` | `src/pages/ProjectDetailPage.tsx` | Placeholder; prerendered per SP02's `projectSlugs`; template is SP04's scope |
| Route | `/projects/:slug/live` | `src/pages/ProjectLivePage.tsx` | Placeholder; dual-mode redirect/hosted-page logic is SP04's scope |
| Route | `/work-experience` | `src/pages/WorkExperiencePage.tsx` | Placeholder; timeline is SP03's scope |
| Route | `/research` | `src/pages/ResearchPage.tsx` | Placeholder; search/filter/grid is SP04's scope |
| Route | `/research/:slug` | `src/pages/ResearchDetailPage.tsx` | Placeholder; prerendered per SP02's `researchSlugs`; template is SP04's scope |
| Route | `/privacy` | `src/pages/PrivacyPage.tsx` | Placeholder; legal copy is SP05's scope |
| Route | `/terms` | `src/pages/TermsPage.tsx` | Placeholder; legal copy is SP05's scope |
| Route | `*` (404) | `src/pages/NotFoundPage.tsx` | Fully built — generic copy, no owner-specific content needed |
| Layout | `PageShell` | `src/layout/PageShell.tsx` | Wraps every route: `ScrollManager` + `Nav` + `<Outlet/>` + `Footer`. SP05 wraps this in `ConsentProvider` + adds `AnalyticsListener`/`ConsentBanner` |
| Component | `Nav` | `src/layout/Nav.tsx` | Floating pill, 4 anchor items, route-aware scroll-based active-section highlight, no mobile menu |
| Component | `Footer` | `src/layout/Footer.tsx` | Research, Privacy, Terms, Résumé (Drive, via `RESUME_URL` from `@/config/links`) links, then techfolio credit, then copyright — no social icons |
| Utility | `ScrollManager` | `src/lib/ScrollManager.tsx` | Anchor-scroll + scroll-to-top on route change; ported verbatim from `juno-landing-page` |
| Hook | `useDebouncedValue` | `src/hooks/useDebouncedValue.ts` | Four-line generic debounce hook, ported verbatim from `juno-landing-page`; consumed by SP04's `useCollectionFilter` (`/projects`, `/research` search) |
| Component | `Button` | `src/components/Button.tsx` | Solid/outline variants; renders `<a>` or `<button>`, never router-aware |
| Component | `TagPill` | `src/components/TagPill.tsx` | Static display + new active/onClick filter-chip mode for SP04's `SearchFilter` |
| Component | `BackButton` | `src/components/BackButton.tsx` | Always targets `/`; used on every sub-page/detail page per brief |
| Components | 6 icons | `src/components/icons/*.tsx` | GitHub/LinkedIn/Email/Location ported from techfolio; ExternalLink/Arrow newly authored in matching style |
| Data seam | `projectSlugs`, `researchSlugs` | `src/content/{projects,research}/index.ts` | Placeholder empty arrays; SP02 replaces contents, must keep the export names and path |
| Config | Tailwind theme | `tailwind.config.ts` | Full techfolio palette, radius scale, shadow scale, Montserrat font stack, `@tailwindcss/typography` |
| Asset | Montserrat | `index.html` `<head>` | Google Fonts link tags, weights 400/500/600/700/800 |
| Asset | `favicon.png` | `public/favicon.png` | Copied verbatim from `src/images/cat.png` before `src/` is demolished (§4.1 carve-out) — the existing black walking-cat silhouette, shipped as-is, linked via `index.html` `<head>` (§4.5) |
| Config | Firebase Hosting | `firebase.json`, `.firebaserc` | Single-site config; placeholder project ID |

---

## 7. Testing

Sized the same way `juno-landing-page`'s 01 sized its own testing scope — worth doing given the number of sub-projects that build directly on this one, not exhaustive:

- **`tsc --noEmit` on every build** (already wired into `npm run build`). The single highest-value check: catches SP02–SP06 misusing `Nav`/`Button`/`TagPill`/`BackButton`'s prop types, or a broken `getStaticPaths` import, before it ships.
- **ESLint** — the standard Vite React-TS flat config, ported as-is. Catches unused imports and hook-rule violations (relevant here since `Nav`'s effect has a real dependency array to get right, §4.6).
- **A handful of Vitest + React Testing Library smoke tests, not a suite:**
  - All ten routes render without throwing, given `MemoryRouter`-wrapped stand-ins for `routes.tsx`'s children (`/`, `/projects`, `/projects/anything`, `/projects/anything/live`, `/work-experience`, `/research`, `/research/anything`, `/privacy`, `/terms`, an unmatched path).
  - `Nav` renders four items whose `to` props are exactly `/#projects`, `/#work-experience`, `/#about`, `/#contact`.
  - `Nav`'s active-section state clears to `null` on a non-`/` pathname (regression test for the exact bug the route-aware rewrite in §4.6 fixes).
  - `Button` renders an `<a>` when given `href` and a `<button>` otherwise.
  - `src/content/projects/index.ts` / `research/index.ts` each export an array (guards against SP02 accidentally shipping `undefined`).

**Explicitly not worth it here:**
- End-to-end tests (Playwright/Cypress) for the anchor-scroll behavior — `scrollIntoView` isn't implemented in jsdom, and a real-browser E2E harness is disproportionate for this sub-project. Verified manually instead (checklist below).
- Visual regression testing — no shipped visual content yet to protect (every page is a placeholder).
- Coverage targets of any kind.

**Manual QA checklist (post-deploy, run once per deploy until it's boring):**
1. Load `/` at the temporary `*.web.app` URL — nav pill, footer, all four placeholder sections visible, nothing in the nav's top-left corner.
2. Click each of the four nav items from `/` — scrolls smoothly to the matching section, pill highlights correctly, no reload.
3. Navigate to `/research/anything` (a genuinely non-existent slug is fine — the placeholder page still renders), click "About" in the nav — lands on `/` scrolled to `#about`.
4. Hard-refresh `/privacy` directly (typed URL, not client navigation) — confirms the Firebase SPA rewrite actually works; a common Hosting misconfiguration surfaces exactly here as a raw 404 from Firebase itself (distinct from the app's own client-rendered `NotFoundPage`).
5. Visit a deliberately bad URL (e.g. `/nonsense`) — confirms it resolves to the app's `NotFoundPage` with a working `BackButton`, per the accepted trade-off in §4.7.
6. Resize to a small mobile width (320px) — the nav pill reflows without overflowing or wrapping awkwardly.
7. `npm run build` locally — confirms `tsc --noEmit` passes and `dist/` contains one HTML file per static route (ten minus the two dynamic-with-zero-slugs routes, which correctly produce none yet).

---

## 8. Manual Intervention Required From You

1. **Confirm the branch name** — `website-revamp` is proposed (matches the `.dev/website-revamp/` planning folder); say so if you'd rather something else.
2. ~~Create the real Firebase project and supply its project ID to replace the `.firebaserc` placeholder.~~ **Done** — the project is `tejitpabari-99`; `.firebaserc` ships the real ID (§4.9, §9). The remaining action here is narrower: **complete the Cloudflare DNS cutover and wait for Firebase to report the custom domain "Connected" with a provisioned certificate** (up to ~24h after correct records are visible) — see item 5.
3. **Confirm Firebase CLI auth** on whichever machine runs `firebase deploy` (`firebase login` if not already authenticated with access to the project from step 2).
4. **After first deploy, open the resulting `*.web.app` URL yourself** and run the manual QA checklist in §7 — this is the actual go/no-go gate for SP02–SP06 starting work on top of this shell.
5. **DNS cutover** (§4.9, steps 3–5) — **in flight, not blocked:** the custom domains are added in the Firebase console and DNS records for `tejitpabari.com`/`www.tejitpabari.com` are being moved off Cloudflare's proxy to Firebase's targets (`A → 199.36.158.100`, `TXT hosting-site=tejitpabari-99`). Remaining: confirm propagation and wait for Firebase's "Connected" status with a provisioned certificate, then decide when to decommission the Netlify site — all require access only you have. Brief §5 already flags this as the single hard launch blocker; no action needed until SP02–SP06 have real content to show.
6. **Decide whether to keep or replace `LICENSE`** — currently the Gatsby starter's 0BSD boilerplate text, orphaned in subject matter but harmless; not blocking anything.
7. **[OWNER]** The favicon is the existing cat silhouette (§4.5, §9) — you may replace `public/favicon.png` with a different asset at any time; no other file needs to change. (The Drive-vs-local résumé question is already resolved — see §9 — nothing further needed from you there.)

---

## 9. Open Questions & Decisions

- `[RESOLVED: TypeScript]` — matches `juno-landing-page`, and multiple sub-projects hand typed data/props across a max-depth-2 delegation model with no shared conversation context; `tsc --noEmit` is the cheapest available cross-sub-project contract check.
- `[RESOLVED: Tailwind v3.4, not v4]` — `_reference-techfolio` uses Tailwind v4 with zero config file (`@theme inline` in `globals.css`, `@tailwindcss/postcss`), but every actual class used across `app/page.tsx` and `app/projects/[slug]/page.tsx` is either a default Tailwind utility or an arbitrary bracket value (`bg-[#F7F1E8]`, `text-[0.68rem]`) — both forms work identically in v3. `juno-landing-page` already runs `vite-react-ssg` + Tailwind v3.4.19 + a standard `tailwind.config.ts` in production; that exact combination is proven, while `vite-react-ssg` + Tailwind v4 is not verified anywhere in either reference repo. Matching the pattern source costs nothing here and avoids being the first to find out whether v4's `@theme`/CSS-first config interacts cleanly with `vite-react-ssg`'s prerender pipeline.
- `[RESOLVED: Google Fonts link, not self-hosted]` — brief §3 locks this explicitly; `next/font`'s self-hosting mechanism has no Vite equivalent regardless.
- `[RESOLVED: no mobile hamburger]` — brief §2/§3 locks this; four items reflow inside the pill's own `w-fit` sizing exactly as techfolio's four-item nav already does.
- `[RESOLVED: single-site firebase.json, not juno-landing-page's multi-target scheme]` — this is presumably its own Firebase project, not one of several sites sharing `juno-landing-page`'s multi-site GCP project; the simpler default-site shape applies unless told otherwise.
- `[RESOLVED: no sitemap/robots.txt in SP01]` — `juno-landing-page`'s `sitemapPlugin` is a good model but needs real per-collection slugs/dates SP02 hasn't produced yet; a natural SP06 addition instead.
- `[RESOLVED: 404 has no true HTTP status]` — direct, inherited consequence of the SPA-rewrite hosting model (§4.7); not a regression versus `juno-landing-page`'s own production behavior, which has no catch-all route at all.
- `[RESOLVED: Nav's scroll-listener is re-keyed on pathname, departing from techfolio's mount-once version]` — required because this site has multiple routes sharing one persistent `Nav`, which techfolio (a true single-page site) never has to handle. See §4.6.
- `[RESOLVED: the favicon is the existing cat silhouette from `src/images/cat.png`, shipped as `public/favicon.png`]` — **supersedes the earlier `[RESOLVED: ship a plain placeholder favicon — a "TP" monogram]` decision below, rather than leaving two contradictory entries.** That earlier resolution mischaracterized `cat.png` as the unrelated Gatsby-starter mascot and specified deleting it. The owner overrode this directly: verified, `src/images/cat.png` is a 512×512 solid black walking-cat silhouette PNG on a transparent background — a clean, high-contrast silhouette that reads correctly at 16×16, exactly what a favicon needs. It's copied to `public/favicon.png` before `src/` is demolished (the one file surviving that step, §4.1's carve-out) and shipped as-is, in black — which renders correctly against both light and dark browser chrome, unlike a teal version. See §4.5.
- `[RESOLVED: the Footer carries `/privacy` and `/terms` links]` — brief §2/§3's literal enumeration ("Research, Résumé, techfolio credit line, copyright") predates the legal routes being locked into the same brief's route table, and the nav deliberately carries no home/logo affordance — so as literally enumerated, `/privacy` and `/terms` would be reachable only by typing the URL. That's an oversight, not a design choice: a privacy policy that can't be found doesn't do the job a privacy policy exists to do. The footer ships as Research · Privacy · Terms · Résumé, then the techfolio credit line, then copyright. Closes SP05 §9's matching expectation that SP05 resolve the footer question. See §4.6.
- `[SUPERSEDED — see the resolved favicon entry above] ship a plain placeholder favicon — a "TP" monogram, teal `#043439` on cream `#F7F1E8`` — this was the prior resolution: a hand-written `public/favicon.svg` monogram, reasoned as the minimum honest placeholder given `cat.png` was (incorrectly) understood to be deleted Gatsby-starter mascot artwork. The owner's direct override (above) replaces this outright — no monogram ships; the favicon is the existing cat.
- `[RESOLVED: Firebase project is `tejitpabari-99`; `.firebaserc` ships the real ID]` — the owner created the project directly; `.firebaserc`'s `default` is `tejitpabari-99`, the Hosting site ID is the same, and the default Hosting URL is `https://tejitpabari-99.web.app` (§4.9).
- `[DEFERRED: owner-only — DNS cutover completion and certificate provisioning]` — in flight, not blocked: `tejitpabari.com`/`www.tejitpabari.com` are being moved from Cloudflare-proxied DNS to Firebase's targets (`A → 199.36.158.100`, `TXT hosting-site=tejitpabari-99`, records set DNS-only). No agent can complete a DNS cutover or wait out certificate provisioning (up to ~24h) — this remains the single hard launch blocker per brief §5, tracked in §8 (items 2, 5).
- `[RESOLVED: CI deploy via the Firebase Hosting GitHub Action is adopted, superseding the brief's §4 "no CI" non-goal — the pipeline already exists and removing it would be net-negative]` — the owner installed the integration on `github.com/tejitpabari99/tejitpabari`. As inspected directly (`git ls-tree -r origin/main`, `gh secret list`, `gh variable list`, all three remote branches), neither the scaffolded workflow files nor the `FIREBASE_SERVICE_ACCOUNT_*` secret are present on the repo yet — the install hasn't pushed its scaffold as of this writing. Adopting rather than removing it anyway is the right call once it lands: it's free CI a solo builder would otherwise have to build by hand, the PR-preview channel is a genuinely useful check for OG/share-preview rendering (§4.9), and reconciling its build step (`npm ci && npm run build`, `public: "dist"`, Node 20, `VITE_GA_MEASUREMENT_ID` passed through — §4.9) is a small, one-time fix versus deleting working infrastructure. The operational tradeoff — merging `website-revamp` into `main` becomes the literal production cutover, with no separate deploy step — is accepted and called out explicitly in §4.9 and §3's amendment note so it isn't discovered the hard way.
- `[RESOLVED: the résumé link is the Google Drive URL; the local PDF is not served]` — the owner confirmed this directly, rather than leaving it as a five-minute pre-launch comparison. `src/files/tejitpabari_resume.pdf` is deleted along with the rest of `src/` (§4.1) — it is not moved to `public/`, since it's never served. A Drive link is only ever trackable as an outbound click, never as a completed download (unchanged note from the original open item). `RESUME_URL` lives in exactly one place, `src/config/links.ts` (SP03-owned; SP01's `Footer.tsx` imports it, §4.6), so a future swap is still a one-line change in one file if the owner ever revisits this.
- `[DEFERRED]` **`LICENSE` file replacement.** Currently orphaned Gatsby-starter 0BSD text; harmless, purely a taste call, revisit whenever convenient.
- `[DEFERRED]` **A `LinkButton` (router-aware button-styled internal link) component**, if a real use case shows up in SP03/SP04 beyond what plain `<Link className="...">` composition already covers. Not built speculatively (§4.6).
