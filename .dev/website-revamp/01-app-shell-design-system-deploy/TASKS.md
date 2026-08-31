# Tasks: App Shell, Design System & Deploy (SP01)

Source of truth: `/root/projects/tejitpabari/.dev/website-revamp/01-app-shell-design-system-deploy/PRD.md`. Every task below cites the PRD §4 subsection it implements. This is Phase 1 — it lands first and blocks all seven other sub-projects (`02`–`08`). Its output is a deployed, empty-but-correct shell: a working toolchain, the full design-token system, every shared component, the complete route table with placeholder pages, and Firebase Hosting config. It produces **no real page content** (hero copy, project cards, timeline, legal text, analytics) — that is SP02–SP06's work, consuming exactly the seams this task list creates.

**Repo state assumption, confirmed directly, not re-derived here:** the repo is `/root/projects/tejitpabari`, already on branch `website-revamp` (local, not pushed), created off `main`. `main` still serves the live Netlify site and must not be touched by any task below. The `.dev/` planning tree (including this file) is already committed; the working tree should otherwise be clean before Task 2 runs.

**Reference repos used for "copied verbatim" tasks below, read directly rather than re-derived from the PRD's prose summary:** `/root/projects/juno-projects/juno-landing-page` (the proven working `vite-react-ssg` app the PRD mirrors dependency-for-dependency) and `/root/projects/_reference-techfolio` (Brittne Valdivia's `app/page.tsx`, the source of the icon SVG path data in Task 14).

---

### Task 1 — Rescue the favicon before touching anything else
   - Files: `public/favicon.png` (new)
   - Changes: Per PRD §4.1's carve-out and §4.5. **This task must run, and must be verified complete, before Task 2 (demolition) starts.** Copy the existing cat silhouette out of the tree that Task 2 is about to delete:
     ```bash
     mkdir -p public
     cp src/images/cat.png public/favicon.png
     ```
     This is the **only** file surviving the demolition in Task 2 — everything else under `src/`, including every other file in `src/images/`, is deleted there. Do not recolor, resize, or otherwise process the image; it ships as-is, in black, per PRD §4.5 ("black-on-transparent renders correctly against both light and dark browser chrome, which a teal version would not necessarily").
   - Acceptance criteria:
     1. `public/favicon.png` exists.
     2. `cmp -s src/images/cat.png public/favicon.png && echo IDENTICAL` prints `IDENTICAL` — the copy is byte-for-byte identical to the original (run this check **before** Task 2 deletes the source file, since it's the only way to verify the copy after the fact).
     3. `file public/favicon.png` reports a PNG image (sanity check that the copy isn't truncated/corrupted).

---

### Task 2 — Demolish the old Gatsby application
   - Files: deletes `src/` (entire tree), `gatsby-config.js`, `gatsby-node.js`, `gatsby-browser.js`, `gatsby-ssr.js`, `_redirects`, `package-lock.json`. Does **not** delete or modify `package.json` (overwritten wholesale in Task 3), `LICENSE`, `.prettierrc`, or `.dev/` (all preserved unchanged per PRD §4.1).
   - Changes: Per PRD §4.1. **This is destructive and irreversible in the working tree. Run every safety check below before deleting anything, and do not skip them because Task 1 "obviously" already ran.**

     **Pre-flight safety checks (must all pass before deleting anything):**
     ```bash
     git branch --show-current   # MUST print exactly: website-revamp
     git status --short          # MUST show nothing unexpected — the tree should be
                                  # clean of unrelated changes before this task's own
                                  # deletions/additions begin
     test -f public/favicon.png && cmp -s src/images/cat.png public/favicon.png && echo "Task 1 verified — safe to proceed"
     ```
     **If the branch is `main`, stop immediately and do not proceed — `main` is still serving the live site and must not be touched by any task in this sub-project.**

     **Pre-deletion grep evidence (reproduces the safety argument PRD §4.1's table already makes — run these and confirm the results match before deleting):**
     ```bash
     grep -rn "using-dsg" --exclude-dir=node_modules --exclude-dir=.git .
     # Expect: only hits inside gatsby-node.js and src/templates/using-dsg.js themselves.

     grep -rln "tejitpabari_resume" --exclude-dir=node_modules --exclude-dir=.git .
     # Expect: only src/files/tejitpabari_resume.pdf's own path (no code references it).

     grep -rn "netlify-shortener\|gatsby-plugin-\|@chakra-ui\|styled-components\|framer-motion" \
       --exclude-dir=node_modules --exclude-dir=.git --exclude=package-lock.json .
     # Expect: only hits inside package.json itself.

     wc -c _redirects
     # Expect: 0
     ```

     **Delete:**
     ```bash
     rm -rf src
     rm -f gatsby-config.js gatsby-node.js gatsby-browser.js gatsby-ssr.js
     rm -f _redirects
     rm -f package-lock.json
     ```
     This removes, among other things: `src/pages/`, `src/components/`, `src/templates/`, `src/images/` (including the now-redundant original `src/images/cat.png` — already rescued in Task 1), `src/content/post1.md`, `src/files/tejitpabari_resume.pdf` (deleted, **not** moved — PRD §4.1/§9, the résumé link is the Google Drive URL, the local PDF is never served), and `src/pages/research/{markdownRemark.frontmatter__slug}.jsx` (the dead Gatsby GraphQL dynamic-route template).

     **Explicitly not touched by this task:** `package.json` (its content is replaced in Task 3, but the file itself isn't deleted here), `LICENSE` (0BSD boilerplate, orphaned in subject but harmless — owner taste call per PRD §8/§9, not this task's concern), `.prettierrc` (unchanged style preference), `.dev/` (planning artifacts, not shipped in the build), `public/favicon.png` (outside `src/`, untouched by this task).
   - Acceptance criteria:
     1. All four pre-flight checks above pass, in order, before any deletion runs.
     2. `git status --short` after deletion shows exactly: deletions under `src/` (`D  src/...` for every prior file), `D  gatsby-config.js`, `D  gatsby-node.js`, `D  gatsby-browser.js`, `D  gatsby-ssr.js`, `D  _redirects`, `D  package-lock.json`, plus the new `public/favicon.png` from Task 1 (`??` or `A`) — nothing else.
     3. `ls src 2>&1` reports "No such file or directory" (the directory itself is gone, not just emptied).
     4. `ls gatsby-*.js 2>&1` reports no matches.
     5. `test -f LICENSE && test -f .prettierrc && test -d .dev && test -f package.json` all succeed — the four preserved/deferred paths are untouched.
     6. `test -f public/favicon.png` still succeeds (Task 1's rescued file survived).

---

### Task 3 — `package.json` and dependency install
   - Files: `package.json` (overwritten in place)
   - Changes: Per PRD §4.2. Replace the entire file with the exact block below — a dependency-for-dependency mirror of `juno-landing-page`'s proven-working `package.json`, plus `prettier` (already a stated preference via the surviving `.prettierrc`) and the two additions PRD §4.2 calls out by name: the standalone `"typecheck"` script and the `"tsx"` devDependency (both exist specifically so SP08's CI pipeline and SP02's `check:launch` script have something to run against — binding, do not omit either).

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
    "typecheck": "tsc --noEmit",
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
    "tsx": "^4.19.2",
    "typescript": "~6.0.2",
    "typescript-eslint": "^8.67.0",
    "vite": "^8.2.2",
    "vitest": "^4.1.11"
  }
}
```

     Note the `react-router-dom` pin: `^6.14.1`, **not** an unpinned/`latest` install, which would silently grab v7 — `vite-react-ssg@0.9.2` targets React Router v6 only (PRD §4.2).

     Then install:
     ```bash
     npm install
     ```
   - Acceptance criteria:
     1. `package.json` matches the block above exactly (`git diff package.json` shows only the intended full-file replacement).
     2. `grep -c '"typecheck": "tsc --noEmit"' package.json` → `1`.
     3. `grep -c '"tsx": "\^4.19.2"' package.json` → `1` (the devDependency, confirming binding decision §9 of the source PRD is satisfied).
     4. `npm install` exits 0 and regenerates `package-lock.json` (which Task 2 deleted).
     5. `node -e "require('./node_modules/react-router-dom/package.json').version"` reports a `6.x` version, not `7.x`.
     6. Full `tsc --noEmit`/`vite-react-ssg build` verification is **not** run yet — `src/` doesn't exist until later tasks recreate it. That full proof is Task 26's job.

---

### Task 4 — TypeScript project config
   - Files: `tsconfig.json` (new), `tsconfig.app.json` (new), `tsconfig.node.json` (new)
   - Changes: Per PRD §4.2 — "copied verbatim from `juno-landing-page` (generic Vite+TS project config, nothing project-specific to change)". Confirmed directly against `juno-landing-page`'s actual files (not re-derived from the PRD's prose description).

```json
// tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "types": ["vite/client"],
    "allowArbitraryExtensions": true,
    "skipLibCheck": true,

    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    "paths": {
      "@/*": ["./src/*"]
    },

    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

```json
// tsconfig.node.json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023"],
    "types": ["node"],
    "skipLibCheck": true,

    "module": "nodenext",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

     Note `tsconfig.app.json`'s `"types": ["vite/client"]` is what makes a separate `vite-env.d.ts` file unnecessary (PRD §4.2) — do not add one.
   - Acceptance criteria:
     1. All three files exist and match the JSON above exactly.
     2. `node -e "JSON.parse(require('fs').readFileSync('tsconfig.json','utf8').replace(/\/\/.*$/gm,''))"` and the equivalent for the other two files parse without throwing (basic JSON-shape sanity check; `tsc`'s own JSONC-tolerant parser is the real validator, exercised fully in Task 26).
     3. `tsconfig.app.json`'s `paths` maps `@/*` to `./src/*`, matching the `@` alias `vite.config.ts` (Task 5) registers — the two must agree or imports will resolve at build time but not in editors/`tsc`.

---

### Task 5 — Vite, PostCSS, and ESLint config
   - Files: `vite.config.ts` (new), `postcss.config.js` (new), `eslint.config.js` (new)
   - Changes: Per PRD §4.2.

```ts
// vite.config.ts
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

     No `sitemapPlugin` here — `juno-landing-page`'s version needs real per-collection slugs/dates SP02 hasn't produced yet (PRD §4.2/§3, explicit non-goal). SP04 later adds a `liveRedirectsPlugin` to this same `plugins` array and SP06 later adds its own sitemap plugin — neither is this task's job.

```js
// postcss.config.js — copied verbatim from juno-landing-page
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

```js
// eslint.config.js — copied verbatim from juno-landing-page
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
])
```
   - Acceptance criteria:
     1. All three files exist and match the content above exactly.
     2. `node --check postcss.config.js` and `node --check eslint.config.js` both exit 0 (ESM syntax check — doesn't require `src/` to exist yet).
     3. `vite.config.ts`'s `resolve.alias['@']` and `tsconfig.app.json`'s `paths['@/*']` (Task 4) agree on the same target directory (`./src`).
     4. Full functional verification (`npm run build`, `npm run lint`) is deferred to Task 26 — `src/` doesn't exist yet.

---

### Task 6 — `.gitignore`, `.prettierignore`, and `README.md`
   - Files: `.gitignore` (overwritten), `.prettierignore` (overwritten), `README.md` (overwritten)
   - Changes: Per PRD §4.1's "Updated, not simply preserved" table.

```
# .gitignore
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

     `.prettierignore` — old contents (`.cache`, `package.json`, `package-lock.json`, `public`) rewritten to drop the Gatsby-era `.cache` entry and un-ignore `public` (it holds only binary assets, already excluded by extension; nothing text-based lives there yet):
```
dist
package.json
package-lock.json
```

     `README.md` — currently the unmodified 5.6 KB Gatsby starter readme; rewritten to describe the actual stack. Must include: (a) a one-paragraph description of the actual stack (`vite-react-ssg` + React 19 + TypeScript + Tailwind, prerendered to static HTML, deployed to Firebase Hosting); (b) the `dev`/`build`/`preview`/`format`/`test`/`lint` commands from Task 3's `package.json`; (c) a pointer to `.dev/website-revamp/BRIEF.md` for the full design record; (d) a "Pre-launch checklist" section, left as a stub naming the gate scripts SP02/SP04 add later (`npm run check:launch`, `npm run check:no-forms`) without inventing their behavior — this section is filled in as those scripts land, not populated speculatively here.

```markdown
# tejitpabari.com

`vite-react-ssg` (React 19 + Vite) prerendering every route to static HTML, styled with Tailwind, deployed to Firebase Hosting. Replaces the previous Gatsby 5 + Chakra UI scaffold.

See `.dev/website-revamp/BRIEF.md` for the full design record — palette, routes, content model, and every settled decision behind this rewrite.

## Commands

- `npm run dev` — start the dev server
- `npm run typecheck` — `tsc --noEmit` only
- `npm run build` — typecheck, then build the static site to `dist/`
- `npm run preview` — serve the built `dist/` locally
- `npm test` — run the Vitest suite
- `npm run lint` — ESLint
- `npm run format` — Prettier, writes in place

## Deploy

`firebase deploy` (requires `firebase login` with access to the `tejitpabari-99` project). See `firebase.json`/`.firebaserc`.

## Pre-launch checklist

(Filled in as SP02/SP04 land their content-gate scripts — `npm run check:launch` and `npm run check:no-forms`. Not populated speculatively here; see `.dev/website-revamp/02-content-pipeline/` and `.dev/website-revamp/04-projects-research-pages/`.)
```
   - Acceptance criteria:
     1. `.gitignore` matches the block above exactly; `grep -c '\.cache' .gitignore` → `0` (the Gatsby-era entry is gone).
     2. `.prettierignore` matches the three-line block above exactly; `grep -c '^public$' .prettierignore` → `0`.
     3. `README.md` contains exactly one case-insensitive mention of `"Gatsby"` (`grep -ci gatsby README.md` → `1`, the single intentional backward-reference in the opening paragraph — the file is no longer the Gatsby starter readme, which is what this criterion is actually checking) and contains all six npm commands from Task 3's `scripts` block, plus the literal string `BRIEF.md`. (Corrected during implementation: the originally specified `→ 0` requirement was mutually unsatisfiable with this task's own mandated README content block above, which deliberately includes one "Replaces the previous Gatsby 5 + Chakra UI scaffold" sentence.)

---

### Task 7 — Tailwind design tokens
   - Files: `tailwind.config.ts` (new)
   - Changes: Per PRD §4.4. All hex values grepped directly from `_reference-techfolio/app/page.tsx` and `app/projects/[slug]/page.tsx` by the PRD — reproduced exactly, not approximated.

```ts
// tailwind.config.ts
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
        xl2: '1rem',       // inner media frames
        card: '1.05rem',   // landing project cards
        panel: '1.15rem',  // About/Contact aside panels
        section: '1.25rem',// detail-page content sections
      },
      boxShadow: {
        pill: '0 14px 40px rgba(22,43,38,0.08)',        // nav pill
        panel: '0 16px 34px rgba(22,43,38,0.06)',        // About/Contact aside
        card: '0 14px 28px rgba(22,43,38,0.05)',         // project card default
        'card-hover': '0 18px 34px rgba(22,43,38,0.08)', // project card hover
        section: '0 12px 28px rgba(22,43,38,0.05)',      // detail-page sections
      },
      maxWidth: {
        content: '72rem',
      },
    },
  },
  plugins: [typography],
} satisfies Config;
```

     **Border-opacity convention (documented, not tokenized):** borders are always `border-teal-secondary/<N>` at 10–22% — never a flat gray (`border-[#0F4C45]/12`, `/15`, `/18`, `/22` all appear at different call sites in the reference). This is Tailwind's built-in opacity modifier on the `teal-secondary` color already defined above, applied inline at each call site (e.g. `Nav`'s `border-teal-secondary/15` in Task 18) — not a separate named token, since the exact opacity is a per-context judgment call (PRD §4.4). **Light mode only** — no `darkMode` config, no `dark:` variants anywhere in this file or any component built in this sub-project.
   - Acceptance criteria:
     1. `tailwind.config.ts` matches the block above exactly.
     2. `grep -c '#F7F1E8\|#DDE7DE\|#043439\|#0F4C45\|#162b26\|#3E514D\|#6B7B77\|#4D5D59\|#EEF3EE' tailwind.config.ts` → `9` (all nine hex values present, one per color).
     3. `grep -c "card: '1.05rem'\|panel: '1.15rem'\|section: '1.25rem'\|xl2: '1rem'" tailwind.config.ts` → `4` (all four radius tokens present).
     4. `grep -c 'plugins: \[typography\]' tailwind.config.ts` → `1`.
     5. `grep -c 'darkMode\|prefers-color-scheme' tailwind.config.ts` → `0` (light mode only, no dark-mode config anywhere).
     6. Full Tailwind-compiles-correctly verification happens in Task 26 once `index.html`/`src/**/*.tsx` exist for `content` to scan.

---

### Task 8 — `index.html`: Montserrat, favicon, title
   - Files: `index.html` (new)
   - Changes: Per PRD §4.5. Montserrat loaded once via Google Fonts link tags (not `next/font`, not self-hosted, not duplicated per-page — brief §3 locks this mechanism); favicon linked per the carve-out in Task 1. Since `RouteMeta` doesn't exist yet (SP06's scope), this file ships one static `<title>`/description sufficient for every route until SP06 wires per-route meta (PRD §3 non-goals) — the copy below is a reasonable draft, not binding text; SP06/the owner may revise it.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tejit Pabari — Health-Tech Builder</title>
    <meta
      name="description"
      content="Tejit Pabari — software engineer and founder building health-tech products, including Juno, an AI companion for medical appointments."
    />

    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/favicon.png" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
   - Acceptance criteria:
     1. `index.html` matches the block above (title/description copy may be edited by the owner later; the two favicon `<link>` tags and the three Montserrat-related `<link>` tags — including both `preconnect`s — must be present verbatim).
     2. `grep -c 'href="/favicon.png"' index.html` → `2` (icon + apple-touch-icon).
     3. `grep -c 'family=Montserrat:wght@400;500;600;700;800' index.html` → `1`.
     4. `grep -c '<script type="module" src="/src/main.tsx">' index.html` → `1` — this is the file Task 23 creates; confirm the reference matches its actual path once that task lands.
     5. `grep -c 'next/font\|self-hosted\|@font-face' index.html` → `0` (Google Fonts link only, no alternate loading mechanism).

---

### Task 9 — Pre-scaffold empty content directories
   - Files: `src/content/work-experience/.gitkeep` (new), `src/content/legal/.gitkeep` (new)
   - Changes: Per PRD §4.3's directory structure and its "judgment call — `content/`, `config/` pre-scaffolded empty" note, mirroring `juno-landing-page`'s own precedent of pre-creating empty folders so downstream sub-projects have one settled place to add files. `src/content/projects/` and `src/content/research/` are created by Task 21 (which populates them with `index.ts` immediately, so they need no separate empty-placeholder here); `src/config/` is created by Task 11.
   - Acceptance criteria:
     1. `test -d src/content/work-experience && test -d src/content/legal` both succeed.
     2. Both directories are tracked in git despite being otherwise empty (`git status --short` shows the two `.gitkeep` files as new).
     3. No `.md` files exist in either directory yet — SP02 (Work Experience) and SP05/SP07 (Legal) populate them later, not this task.

---

### Task 10 — `src/lib/isExternalUrl.ts`
   - Files: `src/lib/isExternalUrl.ts` (new)
   - Changes: A small, generic utility Task 19's `Footer` needs to distinguish `FOOTER_LINKS`' one external entry (Résumé) from its three internal ones (Research, Privacy, Terms) — PRD §4.6 names this as "the same SP01-owned utility SP02 §4.8 already assumes." Not explicitly spelled out in the PRD's own code samples, so implemented here to match the exact pattern `juno-landing-page` already ships (confirmed directly, not guessed) and the same regex SP02's `assertAbsoluteUrl` validator uses, so the two stay consistent about what counts as "external":

```ts
// src/lib/isExternalUrl.ts

/**
 * True for absolute http(s) URLs pointing off-site. Root-relative paths
 * are internal and must stay in the same tab/router.
 */
export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
```

     A small colocated test, since this is a pure function with real branching behavior worth pinning cheaply:

```ts
// src/lib/isExternalUrl.test.ts
import { describe, it, expect } from 'vitest';
import { isExternalUrl } from './isExternalUrl';

describe('isExternalUrl', () => {
  it('returns true for absolute http(s) URLs', () => {
    expect(isExternalUrl('https://drive.google.com/file/d/xyz')).toBe(true);
    expect(isExternalUrl('http://example.com')).toBe(true);
  });

  it('returns false for root-relative paths', () => {
    expect(isExternalUrl('/privacy')).toBe(false);
    expect(isExternalUrl('/research')).toBe(false);
  });

  it('returns false for a bare relative path with no scheme', () => {
    expect(isExternalUrl('research/some-slug')).toBe(false);
  });
});
```
   - Acceptance criteria:
     1. `npx tsc --noEmit` (once Task 26's full toolchain is in place) passes with no errors on this file.
     2. `npm test` passes all three cases above once Task 24 wires up `vitest`/`setupTests.ts` (this file's own test can run standalone before then via `npx vitest run src/lib/isExternalUrl.test.ts` if verified early).
     3. Consumed by Task 19's `Footer` (distinguishing the Résumé link from the three internal footer links) and, per PRD §4.6/§9, assumed by SP02's markdown link renderer (`src/data/markdownComponents.tsx`) — do not rename the export or its path without checking that consumer first.

---

### Task 11 — `src/config/links.ts`
   - Files: `src/config/links.ts` (new)
   - Changes: Per PRD §4.6/§9 — binding architect decision. This file is **SP01-owned**, not SP03's, because `Nav`/`Footer` (Tasks 18/19) cannot render without it existing, and SP01 lands in Phase 1 before SP03 exists. Exports exactly three names — `RESUME_URL`, `NAV_LINKS`, `FOOTER_LINKS` — no more, no fewer.

```ts
// src/config/links.ts
export const RESUME_URL =
  'https://drive.google.com/file/d/1HcqZCkdxfU73PUHmFSKqJGIG7_yG3mGS/view?usp=sharing';

export const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Projects', href: '/#projects' },
  { label: 'Work Experience', href: '/#work-experience' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
];

export const FOOTER_LINKS: { label: string; href: string }[] = [
  { label: 'Research', href: '/research' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Résumé', href: RESUME_URL },
];
```

     **`FOOTER_LINKS` carries `/privacy` and `/terms`**, not just Research/Résumé as the brief's original literal enumeration had it — PRD §9's resolved decision: the nav carries no home/logo affordance, so as literally enumerated the two legal routes would be reachable only by typing the URL, which defeats the point of a privacy policy. Do not drop these two entries.

     **Downstream consumers, named so this file's shape isn't changed casually:** `Nav` (Task 18) and `Footer` (Task 19) map over `NAV_LINKS`/`FOOTER_LINKS` respectively rather than hardcoding hrefs in JSX — this is load-bearing for **SP02**, whose build-time link validator (`src/data/index.ts`'s `validateNavAndFooterLinks`) checks every entry here against its own `KNOWN_STATIC_ROUTES`, which only works if the hrefs exist as data. **SP03**'s Hero also imports `RESUME_URL` directly from this file. No `src/config/social.ts` is created anywhere in this sub-project or any other — identity constants (email, LinkedIn, GitHub) are SP05's `src/config/contact.ts`, not this file (PRD §9, binding).
   - Acceptance criteria:
     1. `src/config/links.ts` matches the block above exactly.
     2. `grep -c '^export const' src/config/links.ts` → `3` (exactly `RESUME_URL`, `NAV_LINKS`, `FOOTER_LINKS`, nothing else).
     3. `NAV_LINKS.length === 4`, with labels in order `Projects, Work Experience, About, Contact` and every `href` matching `/#<sectionId>`.
     4. `FOOTER_LINKS.length === 4`, with labels in order `Research, Privacy, Terms, Résumé`, and only the Résumé entry's `href` satisfying `isExternalUrl` (Task 10) — the other three are root-relative.
     5. `RESUME_URL` equals `https://drive.google.com/file/d/1HcqZCkdxfU73PUHmFSKqJGIG7_yG3mGS/view?usp=sharing` exactly (this is the sole source of the résumé destination — the local PDF at the now-deleted `src/files/tejitpabari_resume.pdf` is never referenced anywhere).

---

### Task 12 — `src/hooks/useDebouncedValue.ts`
   - Files: `src/hooks/useDebouncedValue.ts` (new)
   - Changes: Per PRD §4.6/§4.3 — a **PRD-mandated SP01 deliverable**, not incidental scaffolding: "It's a four-line hook with no reason to differ between projects, and SP01 owns `src/hooks/`, so it lands here rather than being created ad hoc by whichever page happens to need it first." Ported verbatim from `juno-landing-page`.

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

     **Consumed by SP04's `useCollectionFilter`** (the `/projects`/`/research` search debounce) — this is the one and only reason this generic hook exists in this sub-project's scope; it has no consumer within SP01 itself.
   - Acceptance criteria:
     1. `src/hooks/useDebouncedValue.ts` matches the block above exactly.
     2. `npx tsc --noEmit` passes with no errors on this file once Task 26's toolchain is complete.
     3. A quick fake-timers test (`vi.useFakeTimers()`, render via `renderHook`, change the input value, advance timers by `delayMs`, assert the returned value updates only after the delay) passes under `npm test` once Task 24 wires up Vitest — this is optional polish for SP01 itself (the PRD doesn't name this file in its own §7 test list) but cheap enough to add for SP04's confidence.

---

### Task 13 — `src/lib/ScrollManager.tsx`
   - Files: `src/lib/ScrollManager.tsx` (new)
   - Changes: Per PRD §4.6/§4.8. Ported verbatim from `juno-landing-page` — the mechanism that makes cross-page anchor-scroll navigation work (§4.8's "one genuinely non-trivial interaction in this site").

```tsx
// src/lib/ScrollManager.tsx
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

     Consumed by `PageShell` (Task 20), mounted once so it runs on every route change regardless of which page is active. This is what makes `<Link to="/#about">` (Task 18's `Nav`) work correctly from any route — React Router treats `/#about` as an ordinary navigation to pathname `/` with hash `#about`; this component reads `location.hash` after the navigation commits and scrolls to the matching element, with a double-`requestAnimationFrame` fallback for layout not having settled yet. No-hash navigations fall through to `window.scrollTo(0, 0)`.

     **Known, accepted edge case, not a bug to fix here (PRD §4.8):** clicking a nav item twice in a row while already at that section doesn't re-trigger a scroll, because `location.hash` doesn't change between the two clicks. Cosmetically harmless.
   - Acceptance criteria:
     1. `src/lib/ScrollManager.tsx` matches the block above exactly.
     2. `npx tsc --noEmit` passes with no errors on this file once Task 26's toolchain is complete.
     3. Full behavioral proof (`scrollIntoView` isn't implemented in jsdom) is a **manual QA step**, not an automated test — verified once end-to-end in Task 26's manual checklist, matching PRD §7's explicit call that E2E scroll testing is disproportionate for this sub-project.

---

### Task 14 — Icon set
   - Files: `src/components/icons/GitHubIcon.tsx`, `src/components/icons/LinkedInIcon.tsx`, `src/components/icons/EmailIcon.tsx`, `src/components/icons/ExternalLinkIcon.tsx`, `src/components/icons/ArrowIcon.tsx` (all new)
   - Changes: Per PRD §4.6. `GitHubIcon`, `LinkedInIcon`, `EmailIcon` are ported **verbatim** — real SVG path data pulled directly from `_reference-techfolio/app/page.tsx` (generic geometric glyphs — GitHub's octocat mark, a generic envelope shape — not "personal content" under the MIT/content split in the brief's Attribution decisions). `ExternalLinkIcon` and `ArrowIcon` are newly authored, matching `EmailIcon`'s outline stroke style for visual consistency, since techfolio has no equivalent for either. **No `LocationIcon`** — the Contact aside ships no location line (brief §2 amendment), so it has no consumer; do not port it even though it exists in the reference file. This makes five icon files total, not six — the PRD's own §2 Goals text says "six hand-inlined icons," which is a stale count from before the Contact-location line (and its icon) was dropped; the directory structure in PRD §4.3 and this task's file list are the authoritative, current count.

```tsx
// src/components/icons/GitHubIcon.tsx
export function GitHubIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.88-2.78.62-3.37-1.2-3.37-1.2-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.09 0-1.12.39-2.03 1.03-2.74-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.71.12 2.51.36 1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.71 1.03 1.62 1.03 2.74 0 3.96-2.34 4.82-4.57 5.08.36.32.69.95.69 1.92 0 1.39-.01 2.5-.01 2.84 0 .27.18.6.69.49A10.25 10.25 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}
```

```tsx
// src/components/icons/LinkedInIcon.tsx
export function LinkedInIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M6.94 8.5a1.72 1.72 0 1 1 0-3.44 1.72 1.72 0 0 1 0 3.44ZM8.5 18.5H5.38V9.63H8.5v8.87ZM18.62 18.5H15.5v-4.32c0-1.03-.02-2.36-1.44-2.36-1.44 0-1.66 1.13-1.66 2.29v4.39H9.28V9.63h2.99v1.21h.04c.42-.79 1.43-1.62 2.95-1.62 3.15 0 3.73 2.08 3.73 4.79v4.49ZM20.18 2H3.82A1.8 1.8 0 0 0 2 3.79v16.42C2 21.2 2.8 22 3.79 22h16.39A1.8 1.8 0 0 0 22 20.21V3.79A1.8 1.8 0 0 0 20.18 2Z" />
    </svg>
  );
}
```

```tsx
// src/components/icons/EmailIcon.tsx
export function EmailIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none"
      stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M4 6.5h16v11H4z" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </svg>
  );
}
```

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

     `ArrowIcon` points right by default; `BackButton` (Task 17) rotates it 180° rather than a second "left arrow" component being authored.
   - Acceptance criteria:
     1. All five files exist, match the blocks above exactly, and each accepts exactly one prop (`className`, defaulting to `'h-4 w-4'`).
     2. `find src/components/icons -name '*.tsx' | wc -l` → `5`.
     3. `grep -rc 'LocationIcon' src/components/icons/` → `0` (no such file, no such export anywhere in this directory).
     4. `npx tsc --noEmit` passes with no errors on any of the five files once Task 26's toolchain is complete.
     5. Consumed by **SP03** (hero/contact social icons — `GitHubIcon`, `LinkedInIcon`, `EmailIcon`) and **SP04** (card external-link affordance — `ExternalLinkIcon`); `ArrowIcon` is consumed within this sub-project by Task 17's `BackButton`.

---

### Task 15 — `src/components/Button.tsx`
   - Files: `src/components/Button.tsx` (new)
   - Changes: Per PRD §4.6. Solid/outline variants, class values taken directly from techfolio's hero CTAs.

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

     **Deliberately not router-aware** — renders a plain `<a>` or `<button>`, never a react-router `<Link>`. A project/research **card** always routes internally via `<Link>`, never a button-styled external link (brief §2) — a consumer needing internal client-side navigation styled like a button should compose `<Link className={...}>` directly with the same class strings, not use this component.
   - Acceptance criteria:
     1. `src/components/Button.tsx` matches the block above exactly.
     2. `npx tsc --noEmit` passes with no errors on this file once Task 26's toolchain is complete.
     3. `<Button href="https://example.com">Go</Button>` renders an `<a>` tag; `<Button onClick={() => {}}>Click</Button>` (no `href`) renders a `<button>` tag — verified via Task 24's smoke test.
     4. Consumed by **SP03** (hero/contact CTAs, "Email Me") and **SP05** (legal-page consent actions, if any).

---

### Task 16 — `src/components/TagPill.tsx`
   - Files: `src/components/TagPill.tsx` (new)
   - Changes: Per PRD §4.6. Static display styling ported from the reference; the `active`/`onClick` filter-chip mode is a new addition (techfolio's tags are always static) needed for SP04's `/projects`/`/research` tag filter.

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
   - Acceptance criteria:
     1. `src/components/TagPill.tsx` matches the block above exactly.
     2. `npx tsc --noEmit` passes with no errors on this file once Task 26's toolchain is complete.
     3. `<TagPill>Health Tech</TagPill>` (no `onClick`) renders a `<span>`; `<TagPill onClick={() => {}}>Health Tech</TagPill>` renders a `<button>` — verified via Task 24's smoke test.
     4. Consumed by **SP03**/**SP04** (project/research cards, the shared `SearchFilter`'s filter chips).

---

### Task 17 — `src/components/BackButton.tsx`
   - Files: `src/components/BackButton.tsx` (new)
   - Changes: Per PRD §4.6. Depends on Task 14's `ArrowIcon`. Always targets `/`, per the brief's explicit reasoning: the nav bar has no "home" affordance once you're off the landing page (no logo to click), so an explicit back button is the only way back.

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
   - Acceptance criteria:
     1. `src/components/BackButton.tsx` matches the block above exactly.
     2. `npx tsc --noEmit` passes with no errors on this file once Task 26's toolchain is complete.
     3. Rendered anywhere, its `<Link>` has `to="/"` regardless of the current route.
     4. Consumed by **SP03** (`/work-experience`) and **SP04** (`/projects`, `/research`, and every `<slug>` detail page).

---

### Task 18 — `src/layout/Nav.tsx`
   - Files: `src/layout/Nav.tsx` (new)
   - Changes: Per PRD §4.6. Depends on Task 11's `NAV_LINKS`. Ports techfolio's floating-pill markup and scroll-listener active-section logic, with three deliberate departures the PRD calls out explicitly: **no "Home" item** (four items only); **nothing in the nav's top-left corner**, satisfied structurally (the `<header>`'s only child is one `mx-auto w-fit` centered pill — there's no logo-left/nav-center/actions-right grid to begin with); and **route-aware re-scanning**, which techfolio's true single-page reference never needs — this site has multiple routes sharing one persistent `Nav` (react-router's layout-route pattern keeps `PageShell` mounted across sibling-route navigation), so the effect is keyed on `location.pathname`, re-queries `document.getElementById` inside the handler itself (not cached outside it), and explicitly clears `activeSection` to `null` whenever `pathname !== '/'`.

```tsx
// src/layout/Nav.tsx
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_LINKS } from '@/config/links';

// NAV_LINKS entries are { label, href } with href always of the shape
// "/#<sectionId>" (coordinating with SP02's build-time validator, which
// checks this same array's hrefs against KNOWN_STATIC_ROUTES). Nav's own
// active-section logic needs the bare sectionId to match against
// document.getElementById, so it's derived here rather than duplicated as a
// second field on NAV_LINKS.
const sectionIdOf = (href: string) => href.slice(2); // "/#projects" -> "projects"

const SCROLL_OFFSET = 140; // px — matches techfolio's own threshold

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

     No mobile hamburger (brief §3, locked) — four items reflow within the pill's own `w-fit` sizing at any viewport width, matching techfolio's identical four-item nav.
   - Acceptance criteria:
     1. `src/layout/Nav.tsx` matches the block above exactly.
     2. `npx tsc --noEmit` passes with no errors on this file once Task 26's toolchain is complete.
     3. Renders exactly four `<Link>`s with `to` values `/#projects`, `/#work-experience`, `/#about`, `/#contact`, in that order — verified via Task 24's smoke test.
     4. On a non-`/` pathname, no rendered link carries the active (`bg-teal text-white`) styling — verified via Task 24's smoke test (this is the regression test for the exact route-aware bug the effect's dependency array fixes).
     5. Consumed by `PageShell` only (Task 20).

---

### Task 19 — `src/layout/Footer.tsx`
   - Files: `src/layout/Footer.tsx` (new)
   - Changes: Per PRD §4.6/§9. Depends on Task 11's `FOOTER_LINKS` and Task 10's `isExternalUrl`. **Contents, resolved:** Research, Privacy, Terms, Résumé, then the techfolio credit line, then copyright — the brief's original literal enumeration ("Research, Résumé, techfolio credit line, copyright") predates `/privacy`/`/terms` being locked into the route table; shipping exactly as literally enumerated would leave both legal pages reachable only by typing the URL.

```tsx
// src/layout/Footer.tsx
import { Link } from 'react-router-dom';
import { FOOTER_LINKS } from '@/config/links';
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

     `FOOTER_LINKS` is mapped over, not hardcoded as JSX literals — required so **SP02**'s build-time validator can check every href against `KNOWN_STATIC_ROUTES`, and so the Résumé destination is quoted in exactly one place (`src/config/links.ts`).
   - Acceptance criteria:
     1. `src/layout/Footer.tsx` matches the block above exactly.
     2. `npx tsc --noEmit` passes with no errors on this file once Task 26's toolchain is complete.
     3. Renders four footer links in the order Research, Privacy, Terms, Résumé; the Résumé link is an `<a target="_blank" rel="noreferrer">`, the other three are react-router `<Link>`s.
     4. Renders the techfolio credit line linking to `https://github.com/brittnebaila/techfolio`, and a copyright line containing the current year and "Tejit Pabari".
     5. No hardcoded `href` string literal appears in this file's JSX — every link destination flows from `FOOTER_LINKS` (`grep -c 'href="' src/layout/Footer.tsx'` → `1`, only the credit-line `<a>`, which is not a `FOOTER_LINKS` entry).
     6. Consumed by `PageShell` only (Task 20).

---

### Task 20 — `src/layout/PageShell.tsx`
   - Files: `src/layout/PageShell.tsx` (new)
   - Changes: Per PRD §4.6. The router's layout element — depends on Tasks 13, 18, 19.

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

     **Named seam for SP05:** this exact shape is what SP05 wraps in `<ConsentProvider>` and extends with `<AnalyticsListener/>` + `<ConsentBanner/>` (matching `juno-landing-page`'s own proven `PageShell`). SP05 edits this file directly once `ConsentContext`/`analytics.ts`/`ConsentBanner` exist — do not build any of that plumbing speculatively here.
   - Acceptance criteria:
     1. `src/layout/PageShell.tsx` matches the block above exactly.
     2. `npx tsc --noEmit` passes with no errors on this file once Task 26's toolchain is complete.
     3. Renders `ScrollManager`, `Nav`, a `<main>` wrapping `<Outlet/>`, and `Footer`, in that order.
     4. Consumed by `src/routes.tsx` (Task 23) as the top-level layout route's `element`.

---

### Task 21 — Content seam stubs
   - Files: `src/content/projects/index.ts` (new), `src/content/research/index.ts` (new)
   - Changes: Per PRD §4.7. **Named seam for SP02.** `vite-react-ssg` only prerenders a `:param` route for the concrete paths its `getStaticPaths()` function returns — Task 23's `routes.tsx` needs `projectSlugs`/`researchSlugs` arrays to exist at these exact import paths *today*, before SP02's real markdown loader exists, so the app can build now.

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

     With both arrays empty, `projects/:slug`, `projects/:slug/live`, and `research/:slug` prerender zero pages today — the routes exist and typecheck, but there is nothing to visit until **SP02** lands real slugs. This is expected and correct for this sub-project's scope; do not populate these arrays with fixture data.
   - Acceptance criteria:
     1. Both files exist, matching the blocks above exactly (including the contract comments — SP02 reads these when replacing the files).
     2. `npx tsc --noEmit` passes with no errors on either file once Task 26's toolchain is complete.
     3. `import { projectSlugs } from '@/content/projects'` and `import { researchSlugs } from '@/content/research'` each resolve to `[]` — verified via Task 24's smoke test ("guards against SP02 accidentally shipping `undefined`," PRD §7).

---

### Task 22 — Placeholder page components
   - Files: `src/pages/HomePage.tsx`, `src/pages/ProjectsPage.tsx`, `src/pages/ProjectDetailPage.tsx`, `src/pages/ProjectLivePage.tsx`, `src/pages/WorkExperiencePage.tsx`, `src/pages/ResearchPage.tsx`, `src/pages/ResearchDetailPage.tsx`, `src/pages/PrivacyPage.tsx`, `src/pages/TermsPage.tsx`, `src/pages/NotFoundPage.tsx` (all new)
   - Changes: Per PRD §4.7. Following `juno-landing-page`'s own 01 precedent of shipping **minimal real content, not truly empty files**, so routing/anchor-scroll/`Nav` can be proven end-to-end before SP02–SP06 build on top. Depends on Task 17 (`BackButton`).

     **`HomePage.tsx`** — a hero-shaped stub plus four `<section id="…">` blocks matching `Nav`'s section ids exactly, each with `scroll-mt-24` so `ScrollManager`'s `scrollIntoView` lands below the floating nav pill, not under it:

```tsx
// src/pages/HomePage.tsx
export function HomePage() {
  return (
    <div className="mx-auto w-full max-w-content px-6 pb-20 pt-32 sm:px-8 sm:pt-36 md:px-10 lg:px-12">
      <section className="flex flex-col items-start gap-4">
        <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-teal-secondary">
          Tejit Pabari
        </p>
        <h1 className="text-[2rem] font-extrabold tracking-tight text-ink sm:text-[2.6rem]">
          Health-tech builder — hero copy lands in SP03.
        </h1>
      </section>

      <section id="projects" className="mt-24 scroll-mt-24">
        <h2 className="text-xl font-bold text-ink">Projects — filled in by SP03/SP04</h2>
      </section>

      <section id="work-experience" className="mt-24 scroll-mt-24">
        <h2 className="text-xl font-bold text-ink">Work Experience — filled in by SP03</h2>
      </section>

      <section id="about" className="mt-24 scroll-mt-24">
        <h2 className="text-xl font-bold text-ink">About — filled in by SP03</h2>
      </section>

      <section id="contact" className="mt-24 scroll-mt-24">
        <h2 className="text-xl font-bold text-ink">Contact — filled in by SP03</h2>
      </section>
    </div>
  );
}
```

     **SP03 replaces the section bodies; it does not touch the `id`s or the `scroll-mt-24` convention without a reason, since `Nav`'s scroll math (Task 18) depends on them.**

     **`ProjectsPage.tsx`, `WorkExperiencePage.tsx`, `ResearchPage.tsx`, `PrivacyPage.tsx`, `TermsPage.tsx`** — each a `BackButton` plus a one-line heading naming which sub-project fills it in:

```tsx
// src/pages/ProjectsPage.tsx
import { BackButton } from '@/components/BackButton';

export function ProjectsPage() {
  return (
    <div className="mx-auto w-full max-w-content px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12">
      <BackButton />
      <h1 className="mt-6 text-2xl font-bold text-ink">Projects — filled in by SP04</h1>
    </div>
  );
}
```
(`WorkExperiencePage.tsx` — identical shape, heading "Work Experience — filled in by SP03". `ResearchPage.tsx` — "Research — filled in by SP04". `PrivacyPage.tsx` — "Privacy Policy — filled in by SP05". `TermsPage.tsx` — "Terms — filled in by SP05".)

     **`ProjectDetailPage.tsx`, `ResearchDetailPage.tsx`** — additionally read `useParams<{ slug: string }>()` and echo the slug, so SP04 has a working param-reading example to build from:

```tsx
// src/pages/ProjectDetailPage.tsx
import { useParams } from 'react-router-dom';
import { BackButton } from '@/components/BackButton';

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <div className="mx-auto w-full max-w-content px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12">
      <BackButton />
      <h1 className="mt-6 text-2xl font-bold text-ink">Project detail — filled in by SP04</h1>
      <p className="mt-2 text-body">slug: {slug}</p>
    </div>
  );
}
```
(`ResearchDetailPage.tsx` — identical shape, heading "Research detail — filled in by SP04".)

     **`ProjectLivePage.tsx`** — same `BackButton` + heading shape as the non-detail placeholders above (no `useParams` echo required by the PRD for this one):

```tsx
// src/pages/ProjectLivePage.tsx
import { BackButton } from '@/components/BackButton';

export function ProjectLivePage() {
  return (
    <div className="mx-auto w-full max-w-content px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12">
      <BackButton />
      <h1 className="mt-6 text-2xl font-bold text-ink">Live project — dual-mode redirect/hosted logic is SP04's scope</h1>
    </div>
  );
}
```

     **`NotFoundPage.tsx`** — **fully built, not a placeholder** (generic copy, no owner-specific fact needed):

```tsx
// src/pages/NotFoundPage.tsx
import { BackButton } from '@/components/BackButton';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex w-full max-w-content flex-col items-center gap-4 px-6 py-32 text-center">
      <h1 className="text-2xl font-bold text-ink">Page not found</h1>
      <p className="text-body">The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.</p>
      <BackButton />
    </div>
  );
}
```
   - Acceptance criteria:
     1. All ten files exist under `src/pages/`.
     2. `HomePage.tsx` contains exactly four elements matching `id="projects"`, `id="work-experience"`, `id="about"`, `id="contact"`, each also carrying the `scroll-mt-24` class (`grep -c 'scroll-mt-24' src/pages/HomePage.tsx` → `4`).
     3. Every one of the nine non-`NotFoundPage` placeholders renders `BackButton`.
     4. `ProjectDetailPage.tsx` and `ResearchDetailPage.tsx` each call `useParams<{ slug: string }>()` and render the resulting `slug` value in the DOM.
     5. `NotFoundPage.tsx` contains no sub-project attribution comment/heading (it's finished content, not a stub) and renders "Page not found" plus `BackButton`.
     6. `npx tsc --noEmit` passes with no errors on any of the ten files once Task 26's toolchain is complete.

---

### Task 23 — `src/routes.tsx`, `src/main.tsx`, `src/index.css`
   - Files: `src/routes.tsx` (new), `src/main.tsx` (new), `src/index.css` (new)
   - Changes: Per PRD §4.7. Depends on Tasks 20, 21, 22. The full brief §3 route table, registered as `vite-react-ssg`'s `RouteRecord[]` shape.

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
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

     **Named seams for downstream sub-projects, so nobody wonders why this shape exists:**
     - **SP02** replaces `src/content/projects/index.ts` / `research/index.ts`'s contents with a real `gray-matter` loader — this file's two `getStaticPaths` calls are what actually consume those arrays; the import paths must not move.
     - **SP04** narrows `projects/:slug/live`'s `getStaticPaths` from "every project" (as shipped here) to the actual resolvable set once its hosted-vs-redirect registry (`src/pages/live/registry.ts`) exists, and builds the real dual-mode dispatch inside `ProjectLivePage`.
     - `path: '*'` is a genuine React Router catch-all resolved **client-side only** — it cannot be enumerated by `getStaticPaths` (no concrete path), so it is never itself prerendered to a physical file. Combined with `firebase.json`'s catch-all rewrite (Task 25), every URL — including a bad one — is served the same prerendered `/index.html` with an HTTP 200; only after React hydrates does the router match `*` and swap in `NotFoundPage`. This is an accepted trade-off inherited directly from the SPA-rewrite hosting model, not a bug to fix in this sub-project.
   - Acceptance criteria:
     1. All three files exist and match the blocks above exactly.
     2. `npx tsc --noEmit` passes with no errors on any of the three files once Task 26's full toolchain is in place.
     3. `routes` contains exactly ten leaf route entries under the single top-level `/` layout route, in the order shown above, plus the layout route itself (eleven `RouteRecord`-shaped objects total across the tree).
     4. Full prerendering proof (that `getStaticPaths` actually drives `dist/` output) is Task 26's job — this task only confirms the route table typechecks and structurally matches the block above.

---

### Task 24 — Vitest setup and smoke tests
   - Files: `src/setupTests.ts` (new), `src/routes.smoke.test.tsx` (new), `src/layout/Nav.test.tsx` (new), `src/components/Button.test.tsx` (new)
   - Changes: Per PRD §4.2/§7. `setupTests.ts` copied verbatim from `juno-landing-page` (needed the moment any page renders `<Head>`, which SP06 will do — setting this up now means SP03–SP06 don't each have to rediscover why a bare component test crashes on `<Head>`):

```ts
// src/setupTests.ts
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

     Smoke tests per PRD §7's explicit list:

```tsx
// src/routes.smoke.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';

const paths = [
  '/', '/projects', '/projects/anything', '/projects/anything/live',
  '/work-experience', '/research', '/research/anything', '/privacy', '/terms',
  '/this-does-not-exist',
];

describe('route tree smoke test', () => {
  it.each(paths)('renders %s without throwing', (path) => {
    const router = createMemoryRouter(routes, { initialEntries: [path] });
    expect(() => render(<RouterProvider router={router} />)).not.toThrow();
  });
});
```

```tsx
// src/layout/Nav.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Nav } from './Nav';

describe('Nav', () => {
  it('renders four items with the exact NAV_LINKS hrefs', () => {
    render(<MemoryRouter><Nav /></MemoryRouter>);
    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/#projects', '/#work-experience', '/#about', '/#contact',
    ]);
  });

  it('clears activeSection to null on a non-/ pathname', () => {
    render(<MemoryRouter initialEntries={['/research/foo']}><Nav /></MemoryRouter>);
    const links = screen.getAllByRole('link');
    for (const link of links) {
      expect(link.className).not.toContain('bg-teal text-white');
    }
  });
});
```

```tsx
// src/components/Button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders an <a> when given href', () => {
    render(<Button href="https://example.com">Go</Button>);
    expect(screen.getByRole('link', { name: 'Go' }).tagName).toBe('A');
  });

  it('renders a <button> otherwise', () => {
    render(<Button onClick={() => {}}>Click</Button>);
    expect(screen.getByRole('button', { name: 'Click' }).tagName).toBe('BUTTON');
  });
});
```

     Also add the content-seam guard PRD §7 names explicitly:

```ts
// src/content/seam.test.ts
import { describe, it, expect } from 'vitest';
import { projectSlugs } from './projects';
import { researchSlugs } from './research';

describe('content seam placeholders', () => {
  it('exports an array from projects/index.ts', () => {
    expect(Array.isArray(projectSlugs)).toBe(true);
  });
  it('exports an array from research/index.ts', () => {
    expect(Array.isArray(researchSlugs)).toBe(true);
  });
});
```
   - Acceptance criteria:
     1. All five files exist and match the blocks above exactly.
     2. `npm test` (`vitest run`) exits 0 with all cases across all five files passing: ten route-smoke cases, two `Nav` cases, two `Button` cases, two content-seam cases.
     3. `src/content/seam.test.ts` is placed at `src/content/`, sibling to the `projects/` and `research/` directories it imports from (per Task 21's paths).

---

### Task 25 — `firebase.json` and `.firebaserc`
   - Files: `firebase.json` (new), `.firebaserc` (new)
   - Changes: Per PRD §4.9. Single-site config (no multi-site `target`, unlike `juno-landing-page`'s multi-site GCP project) — this is its own standalone Firebase project. The real project ID, `tejitpabari-99`, already exists (created by the owner, confirmed in this PRD's §9) — do not ship a placeholder.

```jsonc
// firebase.json
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

```jsonc
// .firebaserc
{
  "projects": {
    "default": "tejitpabari-99"
  }
}
```

     `public: "dist"` matches Vite's default output directory — no Vite config change needed. `**/assets/**` matches Vite's hashed-filename asset output (safe to cache a year, `immutable`, since the filename changes on every content change). `**/index.html` is explicitly `no-cache` so a new deploy is picked up immediately. **This sub-project does not write any GitHub Actions workflow YAML** — the CI/CD pipeline that invokes `firebase deploy` via these two files is entirely SP08's scope (`08-ci-deploy-pipeline`); this task's contract with SP08 begins and ends at `firebase.json`'s `"public": "dist"` value and the npm scripts Task 3 already ships.
   - Acceptance criteria:
     1. `firebase.json` and `.firebaserc` both exist and match the blocks above exactly (valid JSON — JSONC comments here are documentation only, not literal file content; the actual files contain no comments).
     2. `node -e "JSON.parse(require('fs').readFileSync('firebase.json','utf8'))"` and the equivalent for `.firebaserc` both parse without throwing.
     3. `.firebaserc`'s `projects.default` is exactly `"tejitpabari-99"` — not a placeholder string.
     4. `firebase.json`'s `hosting.rewrites` contains exactly one entry, `{ "source": "**", "destination": "/index.html" }`.
     5. `firebase.json`'s `hosting.headers` contains exactly two entries matching the cache-control values above.
     6. `find .github/workflows -type f 2>/dev/null | wc -l` → `0` — confirms no workflow file was added by this sub-project (SP08's job, not this one).

---

### Task 26 — Full build & prerendering verification
   - Files: none new — this task runs and inspects the output of everything Tasks 1–25 built. This is the proof that the entire toolchain, design system, components, routes, and hosting config actually work together, and specifically that prerendering works (the entire architecture exists so crawlers get real HTML, not a JS-only SPA shell) — verified against `dist/` output files, not just a dev server.
   - Changes: none — verification only.
   - Acceptance criteria, run in order:
     1. `npm run typecheck` (`tsc --noEmit`) exits 0.
     2. `npm run lint` (`eslint .`) exits 0.
     3. `npm test` (`vitest run`) exits 0 — all smoke tests from Task 24 (and any others added along the way, e.g. Task 10's `isExternalUrl.test.ts`) pass.
     4. `npm run build` (`tsc --noEmit && vite-react-ssg build`) exits 0.
     5. `dist/index.html` exists.
     6. `dist/projects/index.html`, `dist/research/index.html`, `dist/work-experience/index.html`, `dist/privacy/index.html`, `dist/terms/index.html` all exist — every static (non-`:param`) route in `routes.tsx` prerendered to a physical file, in the `dist/<route>/index.html` shape `ssgOptions.dirStyle: 'nested'` (Task 5) specifies.
     7. `find dist/projects -mindepth 1 -maxdepth 1 -type d | wc -l` → `0` and the equivalent for `dist/research` → `0` — with `projectSlugs`/`researchSlugs` empty (Task 21), zero per-slug pages are generated, exactly as PRD §4.7 states is "expected and correct for SP01's scope."
     8. No physical file corresponds to the `*` catch-all route (there is no `dist/*` or similarly named file/directory) — confirms the accepted 404 trade-off from Task 23 holds: a bad URL is served `dist/index.html` verbatim, and `NotFoundPage` only appears after client-side hydration.
     9. `grep -c 'fonts.googleapis.com/css2?family=Montserrat' dist/index.html` → `1` and `grep -c 'favicon.png' dist/index.html` → `2` — the Montserrat and favicon `<head>` tags from Task 8 survived prerendering into the actual build output, not just the source `index.html`.
     10. `dist/favicon.png` exists, and `cmp -s public/favicon.png dist/favicon.png` reports identical — Vite copied the rescued favicon from `public/` into the build output unmodified.
     11. `npm run preview` starts without error and serves `dist/` (kill the process after confirming it starts cleanly; this is a smoke check, not a held-open server).
     12. `git status --short` shows a coherent set of new/modified files across Tasks 1–25 and nothing stray (no accidental leftover fixture files, no `node_modules/` tracked, no `dist/` tracked — confirm `.gitignore` from Task 6 is doing its job).

---

## Summary of what requires you (not a dev agent)

1. **Branch name.** `website-revamp` is already created and current (confirmed directly: `git branch --show-current` → `website-revamp`) — no action needed unless you want a different name, in which case rename before Task 2 runs.
2. **DNS cutover completion.** In flight, not blocked: `tejitpabari.com`/`www.tejitpabari.com` are being moved from Cloudflare-proxied DNS to Firebase's targets (`A → 199.36.158.100`, `TXT hosting-site=tejitpabari-99`). No agent can complete a DNS cutover or wait out certificate provisioning (up to ~24h). This remains the single hard launch blocker per the brief — not something Tasks 1–26 above are blocked on, since they only need the `tejitpabari-99` project to exist (it does).
3. **Confirm Firebase CLI auth** on whichever machine runs `firebase deploy` (`firebase login`, if not already authenticated with access to `tejitpabari-99`) — needed the first time an actual deploy happens, not for any task above (none of them run `firebase deploy`).
4. **After the first real deploy, open the resulting `*.web.app` URL yourself** and run the manual QA checklist the PRD's §7 lays out (nav pill visible, all four sections present, clicking each nav item scrolls correctly, hard-refreshing `/privacy` directly proves the Firebase SPA rewrite works, a bad URL resolves to `NotFoundPage`, mobile-width nav reflow). This is the actual go/no-go gate for SP02–SP06 to start building on top of this shell — Task 26 above proves the build is structurally correct, but real-browser scroll/hover/responsive behavior needs your eyes once.
5. **Decide whether to keep or replace `LICENSE`** — currently the Gatsby starter's 0BSD boilerplate text, orphaned in subject matter but harmless. Not blocking anything; Task 2 explicitly leaves it untouched.
6. **The favicon is your call to revisit at any time** — it ships as the existing cat silhouette (Task 1), and you may swap `public/favicon.png` for a different asset later; no other file needs to change if you do.
7. **Nothing else in this sub-project is owner-blocked.** The toolchain versions, design tokens, component prop shapes, route table, and Firebase Hosting config are all specified precisely enough in the PRD for Tasks 1–26 to be implemented without further input from you.
