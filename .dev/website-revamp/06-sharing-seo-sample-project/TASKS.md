# Tasks: Sharing, SEO & Sample Project (SP06)

Source of truth: `/root/projects/tejitpabari/.dev/website-revamp/06-sharing-seo-sample-project/PRD.md`. Every task below cites the PRD §4 subsection it implements. This sub-project builds `RouteMeta`, the build-time OG-card generator, the sitemap/robots generator, `src/config/site.ts`, and the deletable `sample-project` demo (its markdown and its hosted `/live` page) — **not** `ProjectCard`, the landing page, the two listing pages, the two detail-page templates, `ConsentContext`/`trackEvent`, the frontmatter pipeline, or any of the 15 real Projects/Research content files (SP01/SP02/SP03/SP04/SP05/SP07's scope respectively, all consumed as-is).

**Toolchain assumption, confirmed from the PRD, not re-derived here:** SP01's `package.json` already installs `react`, `react-router-dom`, `vite-react-ssg`, `vitest`, `@testing-library/react`, and `gray-matter`. `satori` and `@resvg/resvg-js` are **not** yet installed — Task 6 below adds them as `devDependencies`. SP02's `projects`/`research`/`Project`/`Research`/`liveMode()` and SP04's `HOSTED_LIVE_PAGES`/`src/pages/live/registry.ts` convention are assumed landed (this PRD is Phase 5, after SP01–SP05 and SP07 per the BRIEF's phase ordering) — real content under `src/content/projects/` and `src/content/research/` is assumed to already exist by the time the build-output-verification tasks below run.

**Cross-sub-project sequencing this task list assumes but does not build:**
- SP01 lands `package.json`'s existing `build` script (`"tsc --noEmit && vite-react-ssg build"`) and `firebase.json`. Task 6 adds a `prebuild` entry — additive only, that line is not touched.
- SP02 lands the `Project`/`Research` frontmatter contract, `assertImagePath`'s root-relative-or-absolute duck-typing, and the `demo?: true` field reserved specifically for this sub-project's Task 7.
- SP04 lands `src/pages/live/registry.ts` with `HOSTED_LIVE_PAGES` shipped deliberately empty and a comment anticipating this sub-project's one entry (SP04 §4.7) — confirmed present in SP04's own `TASKS.md` Task 8. Task 8 below adds the one `'sample-project'` line SP04 left for it. SP04 also lands `scripts/check-no-forms.sh` and (if landed by the time Task 6 runs) `check:launch`'s chaining into it — Task 12 below depends on both existing.
- SP03/SP04/SP05 own the pages that call `RouteMeta` (`ProjectsPage`/`ResearchPage`/`ProjectDetailPage`/`ResearchDetailPage`/`PrivacyPage`/`TermsPage`/landing page/`NotFoundPage`) — Task 9 below is an **audit** of those call sites against §4.5's table, not an implementation of them. If a call site is missing or wrong, that is a cross-sub-project defect to flag, not something this sub-project's tasks silently patch.

---

### Task 1 — `src/config/site.ts`: site-level constants and `absoluteUrl()`
   - Files: `src/config/site.ts` (new)
   - Changes: Implement exactly per PRD §4.1 — the single source of truth `RouteMeta`, the OG generator's file paths, and the sitemap generator's `<loc>` entries all key off.

```ts
// src/config/site.ts
export const SITE_URL = 'https://tejitpabari.com';
export const SITE_NAME = 'Tejit Pabari';

export const DEFAULT_DESCRIPTION =
  'Health-tech builder and software engineer — building Juno, an AI companion ' +
  'for medical appointments, while working full-time on Microsoft Fabric Maps.';

export const DEFAULT_OG_IMAGE = '/og/default.png';

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes. The file exports exactly `SITE_URL`, `SITE_NAME`, `DEFAULT_DESCRIPTION`, `DEFAULT_OG_IMAGE`, `absoluteUrl` (verify with `grep -c "^export " src/config/site.ts` → 5).
     2. `SITE_URL` has no trailing slash (`'https://tejitpabari.com'`, not `'https://tejitpabari.com/'`) — confirms `absoluteUrl`'s string-concatenation contract holds for both `path='/'` and `path='/projects'` without a double slash. Spot-check: `absoluteUrl('/')` must equal `'https://tejitpabari.com/'`, not `'https://tejitpabari.comundefined'` or similar.
     3. This file has no runtime test of its own beyond Task 14's `absoluteUrl` unit tests — `SITE_NAME`/`DEFAULT_DESCRIPTION`/`DEFAULT_OG_IMAGE` are plain constants with nothing to assert beyond "the file compiles and exports them."
   - Status: Complete (pulled forward ahead of phase order, out of Phase 5, to unblock SP04's `ProjectDetailPage`/`ResearchDetailPage`, which import `@/components/RouteMeta` and therefore transitively need this file)

---

### Task 2 — `RouteMeta` component
   - Files: `src/components/RouteMeta.tsx` (new)
   - Changes: Implement exactly per PRD §4.2 — the binding prop signature `{ title, description, path, image? }` that closes SP04 §9's and SP05 §9's `[OPEN]` items. Depends on Task 1. `vite-react-ssg`'s `Head` export is already mocked as a passthrough in SP01's `src/setupTests.ts` (PRD §4.2) — no new test-harness work needed here.

```tsx
// src/components/RouteMeta.tsx
import { Head } from 'vite-react-ssg';
import { SITE_NAME, DEFAULT_OG_IMAGE, absoluteUrl } from '@/config/site';

interface RouteMetaProps {
  title: string;
  description: string;
  path: string;
  image?: string;
}

export function RouteMeta({ title, description, path, image }: RouteMetaProps) {
  const fullTitle = `${title} · ${SITE_NAME}`;
  const canonical = absoluteUrl(path);
  const ogImage = absoluteUrl(image ?? DEFAULT_OG_IMAGE);

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
}
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. `RouteMeta` accepts exactly the four props above — `image` optional, the other three required (verify by attempting to compile a call site missing `title`/`description`/`path` and confirming `tsc` rejects it, then removing that scratch call site).
     3. `og:type` is always the literal string `"website"` — never conditionally `"article"` — and `og:image:width`/`og:image:height` are always `"1200"`/`"630"` regardless of props (PRD §4.2's `[RESOLVED]` decision). No functional test needed for this criterion beyond Task 13's unit test; noted here as the binding contract Task 13 verifies.
   - Status: Complete (pulled forward ahead of phase order, out of Phase 5, to unblock SP04's `ProjectDetailPage`/`ResearchDetailPage`, which import `@/components/RouteMeta` directly)

---

### Task 3 — Montserrat font vendoring for satori
   - Files: `scripts/assets/fonts/Montserrat-Regular.ttf`, `scripts/assets/fonts/Montserrat-SemiBold.ttf`, `scripts/assets/fonts/Montserrat-Bold.ttf` (new, committed binary files)
   - Changes: Per PRD §4.3's "Font vendoring" and "Confirmed load-bearing for CI specifically" sections. `satori` cannot use a CSS `@font-face`/Google Fonts network fetch — it needs font bytes handed to it directly, and a CI runner (SP08) has no ambient font cache, so a build-time network fetch to Google Fonts is not an acceptable substitute. Source the three TTF files from the same Montserrat family already loaded via Google Fonts in `index.html` (SP01 §4.5) — e.g. download once from Google Fonts' own TTF distribution (weights 400/600/700) and commit the binary files directly to the repo at the paths above. This is a one-time, explicit, verifiable step — not a placeholder to fill in later.
   - Acceptance criteria:
     1. All three files exist at exactly the paths above, each non-zero bytes: `ls -la scripts/assets/fonts/` shows three `.ttf` files, none 0 bytes.
     2. Each file is a valid TrueType font, not a corrupted/truncated download or an HTML error page saved with a `.ttf` extension — verify with `file scripts/assets/fonts/*.ttf`, confirming each reports as TrueType font data (not "ASCII text" or "HTML document").
     3. `git status` (or the repo's staging equivalent) shows these three files as regular tracked binary additions, not LFS pointers or symlinks, since a CI checkout must get the real bytes with a plain `git clone`.
     4. These files require no build step, no network access, and no owner action beyond this one-time commit (PRD §4.3: "nothing about them needs updating unless the app's font weights change").
   - Status: Complete (sourced from Google Fonts' own Montserrat v31 latin static distribution — regular/600/700 — via the google-webfonts-helper mirror API, which packages the exact same OFL-licensed TTF bytes Google Fonts serves; verified as valid TrueType font data with `file`, non-zero, no network/build step needed at generator-run time)

---

### Task 4 — `scripts/generate-og-cards.mjs`
   - Files: `scripts/generate-og-cards.mjs` (new)
   - Changes: Implement per PRD §4.3. Plain Node ESM (no TypeScript, no bundler, no `import.meta.glob`) — reads `src/content/{projects,research}/*.md` directly with `readdirSync`/`gray-matter`, the same independent-filesystem-scan pattern SP04's `liveRedirectsPlugin` already established for the identical class of problem. Depends on Task 3's vendored fonts.
   - **Testability deviation from the PRD's exact code sample, same class of deviation SP02's `src/data/index.ts` and SP04's `registry.ts` already made:** `localImageDataUri` and `cardJsx` are exported, and `main()`'s invocation is guarded by an ESM direct-execution check, so Task 15/16's tests can import this module and call these two functions directly without triggering a real font-read/PNG-render/filesystem-write as a side effect of the import.

```js
// scripts/generate-og-cards.mjs
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// Deliberately duplicated from src/config/site.ts — see PRD §4.1 for why
// this one-string duplication is accepted rather than solved with a shared
// module: this script runs as plain Node before any TS/bundler step exists.
const SITE_NAME = 'Tejit Pabari';

const ROOT = path.resolve(import.meta.dirname, '..');
const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

const CREAM = '#F7F1E8';
const TEAL = '#043439';
const TEAL_SECONDARY = '#0F4C45';
const INK = '#162b26';
const BODY_TEXT = '#3E514D';

// The one remote URL every real project/research file ships with today
// (SP07 §4.6) — the only value this script treats as "no real photo yet."
const UNSPLASH_PLACEHOLDER = 'https://images.unsplash.com/photo-1572177812156-58036aae439c';

export function readCollection(dirName) {
  const dir = path.join(ROOT, 'src/content', dirName);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => matter(readFileSync(path.join(dir, f), 'utf-8')).data);
}

const fontDir = path.join(ROOT, 'scripts/assets/fonts');
const fonts = [
  { name: 'Montserrat', weight: 700, style: 'normal', data: readFileSync(path.join(fontDir, 'Montserrat-Bold.ttf')) },
  { name: 'Montserrat', weight: 600, style: 'normal', data: readFileSync(path.join(fontDir, 'Montserrat-SemiBold.ttf')) },
  { name: 'Montserrat', weight: 400, style: 'normal', data: readFileSync(path.join(fontDir, 'Montserrat-Regular.ttf')) },
];

/** Only a local, root-relative `public/` asset gets composited — the
 *  Unsplash placeholder (or any other remote URL) renders text-only. */
export function localImageDataUri(image) {
  if (!image || !image.startsWith('/') || image === UNSPLASH_PLACEHOLDER) return null;
  const filePath = path.join(ROOT, 'public', image.replace(/^\//, ''));
  if (!existsSync(filePath)) return null;
  const ext = path.extname(filePath).slice(1);
  const b64 = readFileSync(filePath).toString('base64');
  return `data:image/${ext};base64,${b64}`;
}

export function cardJsx({ title, tags, status, imageDataUri }) {
  return {
    type: 'div',
    props: {
      style: { width: CARD_WIDTH, height: CARD_HEIGHT, display: 'flex', backgroundColor: CREAM, fontFamily: 'Montserrat' },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              width: imageDataUri ? (CARD_WIDTH * 2) / 3 : CARD_WIDTH, height: '100%',
              padding: '64px 56px', borderTop: `6px solid ${TEAL}`,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column', gap: 20 },
                  children: [
                    status && {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex', alignSelf: 'flex-start', backgroundColor: TEAL, color: '#FFFFFF',
                          fontSize: 22, fontWeight: 600, padding: '6px 18px', borderRadius: 999,
                          textTransform: 'uppercase', letterSpacing: 1,
                        },
                        children: status,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex', fontSize: 58, fontWeight: 700, color: INK, lineHeight: 1.15,
                          maxHeight: 58 * 1.15 * 3, overflow: 'hidden',
                        },
                        children: title,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex', flexWrap: 'wrap', gap: 10 },
                        children: tags.map((tag) => ({
                          type: 'div',
                          props: {
                            style: {
                              display: 'flex', fontSize: 22, fontWeight: 600, color: TEAL_SECONDARY,
                              border: `2px solid ${TEAL_SECONDARY}`, borderRadius: 999, padding: '6px 18px',
                            },
                            children: tag,
                          },
                        })),
                      },
                    },
                  ].filter(Boolean),
                },
              },
              {
                type: 'div',
                props: { style: { display: 'flex', fontSize: 26, fontWeight: 600, color: BODY_TEXT }, children: 'tejitpabari.com' },
              },
            ],
          },
        },
        imageDataUri && {
          type: 'div',
          props: {
            style: { display: 'flex', width: CARD_WIDTH / 3, height: '100%' },
            children: [{ type: 'img', props: { src: imageDataUri, style: { width: '100%', height: '100%', objectFit: 'cover' } } }],
          },
        },
      ].filter(Boolean),
    },
  };
}

async function renderCard(props, outPath) {
  const svg = await satori(cardJsx(props), { width: CARD_WIDTH, height: CARD_HEIGHT, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: CARD_WIDTH } }).render().asPng();
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, png);
}

async function main() {
  for (const [dirName, outDir] of [['projects', 'projects'], ['research', 'research']]) {
    const items = readCollection(dirName);
    for (const item of items) {
      const outPath = path.join(ROOT, 'public/og', outDir, `${item.slug}.png`);
      await renderCard(
        { title: item.title, tags: Array.isArray(item.tags) ? item.tags : [], status: typeof item.status === 'string' ? item.status : undefined, imageDataUri: localImageDataUri(item.image) },
        outPath,
      );
      console.log(`  og/${outDir}/${item.slug}.png`);
    }
  }
  await renderCard({ title: SITE_NAME, tags: [], status: undefined, imageDataUri: null }, path.join(ROOT, 'public/og/default.png'));
  console.log('  og/default.png');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

   - Acceptance criteria:
     1. Run `node scripts/generate-og-cards.mjs` directly with real content present (`src/content/projects/*.md`, `src/content/research/*.md`) and confirm it exits 0 with no unhandled errors.
     2. Merely `import`-ing this file's exports (e.g. in a Vitest test file) does **not** trigger `main()` — no PNGs get written and no font files get read as a side effect of import alone. Verify by importing only `localImageDataUri`/`cardJsx` in a scratch test and confirming `public/og/` is untouched.
     3. `npx tsc --noEmit` is **not** run against this file (it's plain `.mjs`, outside the TS project) — instead confirm `node --check scripts/generate-og-cards.mjs` reports no syntax errors.
   - Status: Complete (`node scripts/generate-og-cards.mjs` exits 0 and writes 16 real PNGs — 10 projects + 5 research + `default.png` — each verified 1200×630 PNG image data via `file`; import-only of `localImageDataUri`/`cardJsx` leaves `public/og/` untouched; `node --check` passes. `satori`/`@resvg/resvg-js` added as devDependencies — `satori@^0.19.4` from the PRD sample doesn't exist on the registry (max 0.19.x published is 0.19.3), installed `satori@^0.19.3` instead to honor the same major/minor pin intent; `@resvg/resvg-js@^2.6.2` installed exactly as specified. `public/og/` is gitignored as build output, not committed — `public/` is copied verbatim into `dist/` by `vite-react-ssg build`, and `prebuild` always regenerates these first, so nothing needs to be committed for `dist/` to have them, matching `dist/`'s own gitignored status.)

---

### Task 5 — `scripts/generate-sitemap.mjs`
   - Files: `scripts/generate-sitemap.mjs` (new)
   - Changes: Implement per PRD §4.4. Same plain-Node/pre-Vite constraints as Task 4. Reads hosted-mode `/live` slugs from a **directory listing** of `src/pages/live/*.tsx` (excluding `registry.ts`) — never from `liveUrl` frontmatter — which is what structurally excludes every redirect-mode `/live` route from the sitemap with no filtering logic (PRD §4.4's binding decision D).
   - **Testability deviation from the PRD's exact code sample, same class as Task 4:** `collectionSlugs`, `hostedLiveSlugs`, and a new `buildSitemapUrls(staticRoutes, projectSlugs, researchSlugs, hostedSlugs)` are exported and parameterized (the first two already take a `dir`/similar argument in the PRD's sample; `buildSitemapUrls` is pulled out so Task 17's test can assert on the URL list directly, without writing real files or scanning a real `src/pages/live/` directory). `main()`'s invocation is guarded the same way as Task 4.

```js
// scripts/generate-sitemap.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// Deliberately duplicated from src/config/site.ts — see PRD §4.1.
const SITE_URL = 'https://tejitpabari.com';

const ROOT = path.resolve(import.meta.dirname, '..');

// SP01's static route table, minus the client-only catch-all ('*' has no
// concrete path to list) and minus any /live path — handled separately.
export const STATIC_ROUTES = ['/', '/projects', '/work-experience', '/research', '/privacy', '/terms'];

export function collectionSlugs(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => matter(readFileSync(path.join(dir, f), 'utf-8')).data.slug);
}

export function hostedLiveSlugs(liveDir) {
  return readdirSync(liveDir)
    .filter((f) => f.endsWith('.tsx') && f !== 'registry.ts')
    .map((f) => f.replace(/\.tsx$/, ''));
}

/** Pure URL-list builder — no filesystem access, easy to unit-test directly. */
export function buildSitemapUrls(staticRoutes, projectSlugs, researchSlugs, hostedLiveSlugList) {
  return [
    ...staticRoutes,
    ...projectSlugs.map((slug) => `/projects/${slug}`),
    ...researchSlugs.map((slug) => `/research/${slug}`),
    ...hostedLiveSlugList.map((slug) => `/projects/${slug}/live`),
  ];
}

function main() {
  const urls = buildSitemapUrls(
    STATIC_ROUTES,
    collectionSlugs(path.join(ROOT, 'src/content/projects')),
    collectionSlugs(path.join(ROOT, 'src/content/research')),
    hostedLiveSlugs(path.join(ROOT, 'src/pages/live')),
  );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');

  writeFileSync(path.join(ROOT, 'public/sitemap.xml'), xml);
  console.log(`sitemap.xml: ${urls.length} URLs`);

  writeFileSync(path.join(ROOT, 'public/robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  console.log('robots.txt written');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

   - Acceptance criteria:
     1. Run `node scripts/generate-sitemap.mjs` directly with real content present and confirm it exits 0, and `public/sitemap.xml`/`public/robots.txt` are written.
     2. `node --check scripts/generate-sitemap.mjs` reports no syntax errors.
     3. Merely importing this file's exports does not trigger `main()` or any filesystem write.
     4. `robots.txt`'s content is exactly `User-agent: *\nAllow: /\n\nSitemap: https://tejitpabari.com/sitemap.xml\n` — no `Disallow` lines (PRD §4.4: nothing on this portfolio site should be hidden from search).
   - Status: Complete (`node scripts/generate-sitemap.mjs` exits 0, writes `public/sitemap.xml` with 21 `<loc>` entries — the 6 static routes + 10 project + 5 research detail pages, all absolute `https://tejitpabari.com/...` URLs off `SITE_URL` — and `public/robots.txt` byte-verified against the exact expected string. `/live` routes: zero appear, correctly — `src/pages/live/` currently holds only `registry.ts` (no hosted-mode `.tsx` page has landed yet; Task 7/8's `sample-project` is out of this task's scope) and Juno's redirect-mode `/live` (its `liveUrl` frontmatter) is structurally excluded by construction since `hostedLiveSlugs()` never reads frontmatter, matching PRD §4.4's binding decision D exactly. Import-only of the four exports triggers no `main()`/filesystem write. `public/sitemap.xml`/`public/robots.txt` gitignored as build output alongside `public/og/`, for the same reason.)

---

### Task 6 — Wire `prebuild` into `package.json` (SP01-owned file, additive edit)
   - Files: `package.json` (modified — SP01-owned, additive only)
   - Changes: Per PRD §4.3's wiring section. Add a `prebuild` script that npm's lifecycle mechanism runs automatically before `npm run build`, and add `satori`/`@resvg/resvg-js` as `devDependencies`. **Do not touch the existing `build` script line** (`"tsc --noEmit && vite-react-ssg build"`) — this is additive only.

```json
{
  "scripts": {
    "prebuild": "node scripts/generate-og-cards.mjs && node scripts/generate-sitemap.mjs"
  },
  "devDependencies": {
    "satori": "^0.19.4",
    "@resvg/resvg-js": "^2.6.2"
  }
}
```

   Run `npm install` after editing so `satori`/`@resvg/resvg-js` are actually present in `node_modules` and `package-lock.json` is updated.

   - Acceptance criteria:
     1. `cat package.json | grep -A1 '"prebuild"'` shows the exact command above.
     2. `npm run build` (not `node scripts/...` directly) regenerates every `public/og/**` file and `public/sitemap.xml`/`public/robots.txt` with no separate command needed — confirm by deleting `public/og/default.png` and `public/sitemap.xml` first, then running `npm run build`, then confirming both exist again.
     3. Every pre-existing `package.json` script (`build`, `dev`, `test`, and whatever SP02/SP04 already added — `check:launch`, `check:no-forms`) is byte-for-byte unchanged except for the new `prebuild` entry and the two new `devDependencies`.
     4. `npm ls satori @resvg/resvg-js` shows both installed at the pinned major/minor versions above.

---

### Task 7 — `sample-project.md` demo content
   - Files: `src/content/projects/sample-project.md` (new)
   - Changes: Implement per PRD §4.6, verbatim. `demo: true`, **no `liveUrl` field** (resolves to hosted mode per SP04's `liveMode()`), and a `body` exercising every `react-markdown`/`remark-gfm` feature SP02 configures. Marked as deletable scaffolding in an HTML comment at the top of the file, and in the frontmatter `description`.

```markdown
<!--
  SCAFFOLDING — NOT REAL CONTENT. This file exists to exercise every
  react-markdown/remark-gfm feature SP02 §4.8 configures, and to give
  SP06's OG-card generator, RouteMeta, and share-preview testing a safe,
  disposable subject that isn't a real project. Delete this file (and
  src/pages/live/sample-project.tsx, and its one line in
  src/pages/live/registry.ts's HOSTED_LIVE_PAGES) once share previews
  are confirmed working on the real domain — see PRD 06 §8.
-->
---
slug: sample-project
title: Sample Project
description: A scaffolding project exercising every markdown feature this site supports — not a real project. Safe to delete once share-preview testing is done.
image: https://images.unsplash.com/photo-1572177812156-58036aae439c
tags:
  - Developer Tools
status: Completed
date: 2026-01-01
demo: true
links:
  - label: react-markdown
    href: https://github.com/remarkjs/react-markdown
  - label: remark-gfm
    href: https://github.com/remarkjs/remark-gfm
---

## Why this page exists

This is **scaffolding**, not a real project — it exists so the owner can preview how a full markdown write-up renders on this site's actual palette, and so link-preview testing on LinkedIn/Facebook/iMessage has a safe subject that isn't real content.

### What it exercises

A short paragraph with *italic*, **bold**, ***bold italic***, ~~strikethrough~~, and `inline code` — every inline style `remark-gfm` adds on top of CommonMark, in one sentence, so a single read-through of this paragraph alone proves inline rendering works end to end.

Here's a fenced code block with a language tag, so syntax-aware styling (even without a highlighter — SP02 §4.8 explicitly ships no syntax-highlighting library) still gets monospace/background treatment from the `prose` typography plugin:

```ts
export function liveMode(project: Project): 'redirect' | 'hosted' {
  return project.liveUrl ? 'redirect' : 'hosted';
}
```

An ordered list:

1. First item
2. Second item
3. Third item, with a nested list:
   - Nested bullet one
   - Nested bullet two

An unordered list:

- Alpha
- Beta
- Gamma

A GFM task list:

- [x] Ship the sample project
- [x] Exercise every markdown feature
- [ ] Delete this file once share previews are confirmed (see PRD 06 §8)

A GFM table:

| Feature | Library | Exercised here? |
|---|---|---|
| Headings | `react-markdown` | Yes — h2, h3 above |
| Tables | `remark-gfm` | Yes — this table |
| Task lists | `remark-gfm` | Yes — the checklist above |

> A blockquote — the kind of pull-quote a real project writeup might use to call out a notable result or piece of feedback.

---

One inline link to this site's own [Projects page](/projects) (internal — exercises `markdownComponents`' same-tab renderer, SP02 §4.8), and one to [react-markdown's repository](https://github.com/remarkjs/react-markdown) (external — exercises the `target="_blank"`/`isExternalUrl` branch of the same renderer).

![A placeholder image, rendered via react-markdown's default img mapping](https://images.unsplash.com/photo-1572177812156-58036aae439c)
```

   - Acceptance criteria:
     1. `npm run build` succeeds with this file present — it parses cleanly through SP02's real `parseProject` loader (`assertNoUnknownKeys`, `assertTags`, `assertOptionalStatus`, `assertSlugMatchesFilename`, etc. — no special-casing for `demo: true` beyond what SP02 already built).
     2. `image` is the exact Unsplash placeholder URL every real launch project uses (SP07 §4.6) — confirms `localImageDataUri` (Task 4) will return `null` for this item, i.e. its OG card is text-only, same as every other launch item.
     3. `demo: true` is present and `liveUrl` is entirely absent — verify `liveMode()` (SP02, consumed as-is) resolves this project to `{ mode: 'hosted' }`, not `{ mode: 'redirect', ... }`.
     4. `tags: [Developer Tools]` and `status: Completed` are both valid values against SP02's real enums — confirm no build failure from either (PRD §4.6: chosen only because they're unremarkable, not meaningful).

---

### Task 8 — `src/pages/live/sample-project.tsx` + `HOSTED_LIVE_PAGES` registry entry
   - Files: `src/pages/live/sample-project.tsx` (new), `src/pages/live/registry.ts` (modified — SP04-owned file, adds exactly two lines)
   - Changes: Implement per PRD §4.7. Depends on Task 7 (the registry's own eager cross-check requires a matching `src/content/projects/sample-project.md` with no `liveUrl`). **Zero input-accepting markup by design** — no `<input>`, `<form>`, `<textarea>`, or file upload, so `npm run check:no-forms` (SP04 §4.8) stays green and `/privacy`/`/terms`'s "no forms" claim (SP05 §4.7) remains true.

```tsx
// src/pages/live/sample-project.tsx
//
// SCAFFOLDING — NOT A REAL HOSTED MINI-PROJECT. Exists to prove the hosted
// `/live` path (SP04 §4.6/§4.7) works end to end, and to give share-preview
// testing a safe subject. Delete this file, its src/content/projects/
// counterpart, and its HOSTED_LIVE_PAGES entry once share previews are
// confirmed on the real domain — see PRD 06 §8.
//
// Contains ZERO input-accepting markup by design — no <input>, <form>,
// <textarea>, file upload, or anything else a visitor can type into and
// submit. This keeps `npm run check:no-forms` (SP04 §4.8) green and keeps
// /privacy's and /terms's "no forms" claim (SP05 §4.7's fragility guard)
// true.
import { useEffect, useState } from 'react';

export default function SampleProjectLive() {
  // Hydration-safe: `null` on the build-time render and the first client
  // render. The real, ticking value is supplied only after mount.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-content flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-secondary">Sample Project — hosted /live demo</p>
      <p className="text-[2rem] font-extrabold tracking-tight text-ink sm:text-[2.6rem]" aria-live="polite">
        {now ? now.toLocaleString() : '—'}
      </p>
      <p className="max-w-md text-sm text-body">
        This page is scaffolding, not a real hosted mini-project — it exists to prove `/projects/sample-project/live`
        renders directly (no redirect) and updates every second from the visitor&rsquo;s own clock, not a stale build
        timestamp.
      </p>
    </div>
  );
}
```

   In `src/pages/live/registry.ts`, add exactly these two lines to SP04's otherwise-empty file:

```ts
import SampleProjectLive from './sample-project';

export const HOSTED_LIVE_PAGES: Record<string, ComponentType> = {
  'sample-project': SampleProjectLive,
};
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. `npm run build` succeeds — `registry.ts`'s own eager cross-check (`validateLiveRegistry`, SP04 §4.7) confirms `'sample-project'` has a matching `src/content/projects/sample-project.md` and that the project does not also set `liveUrl`, with no separate validation step needed here.
     3. `grep -rEn '<(input|form|textarea)[ >]' src/pages/live/sample-project.tsx` returns no matches.
     4. `npm run check:no-forms` (SP04's script) exits 0 with this file present.
     5. `projectLiveSlugs` (SP04's exported array, consumed as-is) includes `'sample-project'` after this change.

---

### Task 9 — `RouteMeta` route-inventory audit against built output
   - Files: none modified — this is a verification task. If a discrepancy is found, note it as a cross-sub-project defect against the owning page's sub-project (SP03/SP04/SP05) rather than editing that page's file here.
   - Changes: Per PRD §4.5's complete call-site inventory table and the house rule that this sub-project's acceptance criteria must inspect **built output**, not React source — a unit test asserting a component rendered a `<meta>` tag proves nothing about what a crawler actually fetches from the prerendered HTML file on disk. Run `npm run build` once (after Tasks 1–8 land), then grep the real `dist/` output.

```bash
npm run build

# 1. Static / non-slug routes — every one must have a canonical link and
#    (per §4.5's table) fall back to DEFAULT_OG_IMAGE.
for f in dist/index.html dist/projects/index.html dist/work-experience/index.html \
         dist/research/index.html dist/privacy/index.html dist/terms/index.html; do
  grep -q 'rel="canonical"' "$f" || { echo "FAIL $f: no canonical link"; exit 1; }
  grep -q 'property="og:image" content="https://tejitpabari.com/og/default.png"' "$f" \
    || { echo "FAIL $f: og:image is not DEFAULT_OG_IMAGE"; exit 1; }
  grep -q 'property="og:type" content="website"' "$f" || { echo "FAIL $f: og:type not website"; exit 1; }
  echo "OK $f"
done

# 2. Every real Project detail route — og:image/canonical must point at the
#    GENERATED OG card, never the frontmatter placeholder image (§4.5's
#    explicit correction to SP04's original draft).
for md in src/content/projects/*.md; do
  slug=$(grep '^slug:' "$md" | head -1 | awk '{print $2}')
  f="dist/projects/$slug/index.html"
  test -f "$f" || { echo "FAIL missing $f"; exit 1; }
  grep -q "property=\"og:image\" content=\"https://tejitpabari.com/og/projects/$slug.png\"" "$f" \
    || { echo "FAIL $f: og:image is not the generated card path"; exit 1; }
  grep -q "rel=\"canonical\" href=\"https://tejitpabari.com/projects/$slug\"" "$f" \
    || { echo "FAIL $f: wrong canonical"; exit 1; }
  echo "OK $f"
done

# 3. Every real Research detail route — same pattern against /og/research/.
for md in src/content/research/*.md; do
  slug=$(grep '^slug:' "$md" | head -1 | awk '{print $2}')
  f="dist/research/$slug/index.html"
  test -f "$f" || { echo "FAIL missing $f"; exit 1; }
  grep -q "property=\"og:image\" content=\"https://tejitpabari.com/og/research/$slug.png\"" "$f" \
    || { echo "FAIL $f: og:image is not the generated card path"; exit 1; }
  echo "OK $f"
done

# 4. Every hosted (non-redirect) /live route — one prerendered HTML file per
#    src/pages/live/*.tsx entry (registry.ts excluded).
for tsx in src/pages/live/*.tsx; do
  slug=$(basename "$tsx" .tsx)
  f="dist/projects/$slug/live/index.html"
  test -f "$f" || { echo "FAIL missing hosted /live output: $f"; exit 1; }
  grep -q "property=\"og:image\" content=\"https://tejitpabari.com/og/projects/$slug.png\"" "$f" \
    || { echo "FAIL $f: wrong og:image"; exit 1; }
  echo "OK $f"
done

echo "RouteMeta audit passed for every route in PRD §4.5's inventory."
```

   - Acceptance criteria:
     1. The script above exits 0 against a real `npm run build` output — every route named in PRD §4.5's table (`/`, `/projects`, `/projects/<slug>`, `/projects/<slug>/live` for hosted mode, `/work-experience`, `/research`, `/research/<slug>`, `/privacy`, `/terms`) has a prerendered `dist/**/index.html` containing the expected `og:image`, `og:type`, and canonical values — sourced from the actual HTML file a crawler fetches, via `View Source`/`cat`, never from DevTools' rendered DOM or a component-level render test.
     2. Explicitly confirm no project or research detail page's `og:image` equals its raw frontmatter `image` value (the Unsplash placeholder) — this is the one-line correction PRD §4.5/§9 makes to SP04's original draft call sites; a failure here means that correction did not actually land in SP04's shipped `ProjectDetailPage.tsx`/`ResearchDetailPage.tsx`, which is a cross-sub-project defect to report, not something to silently fix in this audit.
     3. A redirect-mode project (one with `liveUrl` set, e.g. `juno` per the launch content set) has **no** `dist/projects/<slug>/live/index.html` at all — that route is a 302 at the hosting layer (SP04 §4.6's `liveRedirectsPlugin`), not a prerendered page, and correctly absent from this check's loop 4 (which only iterates `src/pages/live/*.tsx`, never frontmatter).

---

### Task 10 — OG-card PNG build-output verification
   - Files: none modified — verification task, doubles as PRD §7's "real rendered-output smoke test."
   - Changes: Per the house rule requiring proof the generated PNGs exist, are non-zero, and are exactly 1200×630 — a corrupt or zero-byte PNG is a silent share-preview failure a crawler would surface, not a build error. Run after `npm run build` (Task 6's `prebuild` hook has already regenerated everything).

```bash
node -e "
const fs = require('fs');
const path = require('path');

function checkDir(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png'));
  if (files.length === 0) throw new Error(dir + ': no PNGs found');
  for (const f of files) {
    const full = path.join(dir, f);
    const buf = fs.readFileSync(full);
    if (buf.length === 0) throw new Error(full + ' is zero bytes');
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width !== 1200 || height !== 630) throw new Error(full + ' is ' + width + 'x' + height + ', expected 1200x630');
    console.log('OK', full, width + 'x' + height, buf.length + ' bytes');
  }
  return files.length;
}

const projectCount = checkDir('public/og/projects');
const researchCount = checkDir('public/og/research');
const defaultBuf = fs.readFileSync('public/og/default.png');
if (defaultBuf.length === 0) throw new Error('public/og/default.png is zero bytes');
if (defaultBuf.readUInt32BE(16) !== 1200 || defaultBuf.readUInt32BE(20) !== 630) throw new Error('default.png is not 1200x630');
console.log('OK public/og/default.png');

const projectMdCount = fs.readdirSync('src/content/projects').filter((f) => f.endsWith('.md')).length;
const researchMdCount = fs.readdirSync('src/content/research').filter((f) => f.endsWith('.md')).length;
if (projectCount !== projectMdCount) throw new Error('projects: ' + projectCount + ' PNGs but ' + projectMdCount + ' content files');
if (researchCount !== researchMdCount) throw new Error('research: ' + researchCount + ' PNGs but ' + researchMdCount + ' content files');
console.log('Card count matches content file count for both collections.');
"
```

   - Acceptance criteria:
     1. The script above exits 0 with no thrown error, against real, freshly-generated (`npm run build`) output.
     2. It proves, per PNG file: non-zero size, exact 1200×630 pixel dimensions (read from the PNG's own IHDR chunk, not assumed), and — for `projects`/`research` — exactly one card per real content `.md` file, plus the separate `public/og/default.png` site-level fallback.
     3. Open at least one generated card directly (e.g. `public/og/projects/juno.png`, or the first alphabetically) and visually confirm: cream background, teal top rule, wrapped title, tag pills, a status pill only when the source item has `status` set, and the `tejitpabari.com` footer line — a one-time human look, per PRD §7's "not worth building a pixel-diff harness" call, not an automated assertion.

---

### Task 11 — `sitemap.xml` / `robots.txt` build-output verification
   - Files: none modified — verification task.
   - Changes: Per PRD §4.4 and the house rule to verify built output. Confirms binding decision D (redirect-mode `/live` routes excluded) by inspecting the actual generated file, not by re-reading the generator's source.

```bash
npm run build

# Every static route, project slug, and research slug appears.
for route in / /projects /work-experience /research /privacy /terms; do
  grep -q "<loc>https://tejitpabari.com${route}</loc>" public/sitemap.xml \
    || { echo "FAIL missing static route $route"; exit 1; }
done

# sample-project (hosted mode): both its detail page AND its /live page
# must be present.
grep -q "<loc>https://tejitpabari.com/projects/sample-project</loc>" public/sitemap.xml \
  || { echo "FAIL missing /projects/sample-project"; exit 1; }
grep -q "<loc>https://tejitpabari.com/projects/sample-project/live</loc>" public/sitemap.xml \
  || { echo "FAIL missing /projects/sample-project/live"; exit 1; }

# A redirect-mode project (liveUrl set, e.g. juno) must NEVER get a /live
# sitemap entry — binding decision D, PRD §4.4/§9.
if grep -q "/projects/juno/live</loc>" public/sitemap.xml; then
  echo "FAIL: redirect-mode /live route present in sitemap.xml — violates PRD §4.4 decision D"; exit 1
fi
echo "OK: redirect-mode /live routes correctly excluded"

# robots.txt
grep -q '^Allow: /$' public/robots.txt || { echo "FAIL robots.txt missing Allow: /"; exit 1; }
grep -q '^Disallow' public/robots.txt && { echo "FAIL robots.txt has a Disallow line — should have none"; exit 1; }
grep -q 'Sitemap: https://tejitpabari.com/sitemap.xml$' public/robots.txt || { echo "FAIL wrong Sitemap line"; exit 1; }
echo "robots.txt OK"
```

   - Acceptance criteria:
     1. The script above exits 0 against a real `npm run build`'s `public/sitemap.xml`/`public/robots.txt`.
     2. Total `<url>` count in `sitemap.xml` equals `6 static routes + (number of project .md files) + (number of research .md files) + (number of files under src/pages/live/ excluding registry.ts)` exactly — verify with `grep -c '<url>' public/sitemap.xml` against that computed number.
     3. `robots.txt` has no `Disallow` line anywhere and points at the real sitemap URL.

---

### Task 12 — `sample-project` gate and rendering verification
   - Files: none modified — verification task.
   - Changes: Per the house rule requiring `check:no-forms` to pass and `check:launch` to report exactly one `demo: true`, and per PRD §7's manual-QA checklist items 4/6. Run with Tasks 7/8 landed and **before** the sample project is ever deleted (PRD §8, item 2 — deletion is a separate, later, owner-triggered step).

```bash
# 1. check:no-forms must stay green with sample-project.tsx present.
npm run check:no-forms
echo "exit code: $?"   # must be 0

# 2. check:launch must report exactly one demo: true, naming this file.
npm run check:launch
echo "exit code: $?"   # must be NON-zero — this is the correct state before deletion
# stderr/stdout must name src/content/projects/sample-project.md by path.

# 3. Markdown feature surface actually rendered in the prerendered HTML
#    (not just present in the source .md — the crawler/reader-facing test).
npm run build
f="dist/projects/sample-project/index.html"
grep -q '<table' "$f"       || { echo "FAIL: no table rendered"; exit 1; }
grep -q 'type="checkbox"' "$f" || { echo "FAIL: no GFM task-list checkboxes rendered"; exit 1; }
grep -q '<blockquote' "$f"  || { echo "FAIL: no blockquote rendered"; exit 1; }
grep -q '<code' "$f"        || { echo "FAIL: no code block/inline code rendered"; exit 1; }
grep -q 'href="/projects"' "$f" || { echo "FAIL: internal link not rendered"; exit 1; }
grep -q 'target="_blank"' "$f"  || { echo "FAIL: external link's target=_blank not rendered"; exit 1; }
echo "Markdown surface verified in prerendered HTML."
```

   - Acceptance criteria:
     1. `npm run check:no-forms` exits 0 with `src/pages/live/sample-project.tsx` present (Task 8 shipped).
     2. `npm run check:launch` exits **non-zero** and its output names `src/content/projects/sample-project.md` — this is the expected, correct state while the scaffolding is still present (PRD §4.6: "Before the owner deletes it, `npm run check:launch` reports `demo: true` count = 1, naming `src/content/projects/sample-project.md` by path"). A passing (exit 0) `check:launch` at this point would mean the file is missing or its `demo: true` flag was lost — a regression, not a success.
     3. `dist/projects/sample-project/index.html` (the real prerendered file) contains rendered `<table>`, GFM task-list checkboxes, a `<blockquote>`, `<code>` (both fenced and inline), an internal link to `/projects`, and an external link carrying `target="_blank"` — proving the full markdown surface renders against real build output, not just that the source markdown contains these constructs.

---

## Tests

### Task 13 — `RouteMeta` component unit tests
   - Files: `src/components/RouteMeta.test.tsx` (new)
   - Changes: Per PRD §7, first bullet. Uses SP01's `setupTests.ts` `Head`-passthrough mock (already in place, no new harness work).

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RouteMeta } from './RouteMeta';

describe('RouteMeta', () => {
  it('defaults image to DEFAULT_OG_IMAGE, resolved absolute, when omitted', () => {
    render(<RouteMeta title="Juno" description="d" path="/projects/juno" />);
    expect(document.title).toBe('Juno · Tejit Pabari');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://tejitpabari.com/projects/juno');
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://tejitpabari.com/og/default.png');
  });

  it('resolves an explicit image prop to its absolute form', () => {
    render(<RouteMeta title="Juno" description="d" path="/projects/juno" image="/og/projects/juno.png" />);
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://tejitpabari.com/og/projects/juno.png');
    expect(document.querySelector('meta[name="twitter:image"]')?.getAttribute('content')).toBe('https://tejitpabari.com/og/projects/juno.png');
  });

  it('always emits 1200x630 image dimensions and og:type website', () => {
    render(<RouteMeta title="X" description="d" path="/x" />);
    expect(document.querySelector('meta[property="og:image:width"]')?.getAttribute('content')).toBe('1200');
    expect(document.querySelector('meta[property="og:image:height"]')?.getAttribute('content')).toBe('630');
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('website');
  });
});
```

   - Acceptance criteria: `npm test` passes all three cases. Explicitly noted: this test proves the **React component** builds the right tree — it does NOT substitute for Task 9's built-output audit, since `vite-react-ssg`'s `Head` mock here never touches the actual prerendering pipeline that writes `dist/**/index.html`.

---

### Task 14 — `absoluteUrl` unit tests
   - Files: `src/config/site.test.ts` (new)
   - Changes: Per PRD §7, second bullet.

```ts
import { describe, it, expect } from 'vitest';
import { absoluteUrl } from './site';

describe('absoluteUrl', () => {
  it('resolves a root-relative path to the full site URL', () => {
    expect(absoluteUrl('/projects')).toBe('https://tejitpabari.com/projects');
  });

  it('passes an already-absolute URL through unchanged', () => {
    expect(absoluteUrl('https://images.unsplash.com/photo-1')).toBe('https://images.unsplash.com/photo-1');
  });

  it('handles a path missing its leading slash defensively', () => {
    expect(absoluteUrl('projects')).toBe('https://tejitpabari.com/projects');
  });
});
```

   - Acceptance criteria: `npm test` passes all three cases.

---

### Task 15 — `generate-og-cards.mjs` compositing-rule unit tests
   - Files: `scripts/generate-og-cards.test.ts` (new)
   - Changes: Per PRD §7, third bullet. Imports Task 4's exported `localImageDataUri` directly — no real satori/resvg render.

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { localImageDataUri } from './generate-og-cards.mjs';

const UNSPLASH_PLACEHOLDER = 'https://images.unsplash.com/photo-1572177812156-58036aae439c';
const fixtureDir = path.resolve(import.meta.dirname, '../public/_fixture-images');

beforeAll(() => {
  mkdirSync(fixtureDir, { recursive: true });
  writeFileSync(path.join(fixtureDir, 'real.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
});
afterAll(() => rmSync(fixtureDir, { recursive: true, force: true }));

describe('localImageDataUri', () => {
  it('returns null for the exact Unsplash placeholder', () => {
    expect(localImageDataUri(UNSPLASH_PLACEHOLDER)).toBeNull();
  });

  it('returns null for any other remote URL', () => {
    expect(localImageDataUri('https://example.com/other.jpg')).toBeNull();
  });

  it('returns a data: URI for a local, root-relative path to a file that exists', () => {
    const result = localImageDataUri('/_fixture-images/real.png');
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('returns null (never throws) for a root-relative path to a missing file', () => {
    expect(localImageDataUri('/_fixture-images/does-not-exist.png')).toBeNull();
  });
});
```

   - Acceptance criteria: `npm test` passes all four cases, including the "missing local file degrades to text-only, does not throw and does not fail the build" case PRD §7 calls out explicitly.

---

### Task 16 — `generate-og-cards.mjs` status-pill-rule unit tests
   - Files: `scripts/generate-og-cards.test.ts` (same file as Task 15, additional `describe` block)
   - Changes: Per PRD §7, fourth bullet. Asserts on the JSX object `cardJsx()` returns, before it's ever handed to `satori()` — no image rendering needed.

```ts
import { cardJsx } from './generate-og-cards.mjs';

function hasStatusPillNode(tree) {
  const leftColumn = tree.props.children[0];
  const textGroup = leftColumn.props.children[0];
  return textGroup.props.children.some((node) => node && node.props?.children === 'Completed');
}

describe('cardJsx status pill', () => {
  it('includes a status-pill node when status is set', () => {
    const tree = cardJsx({ title: 'X', tags: [], status: 'Completed', imageDataUri: null });
    expect(hasStatusPillNode(tree)).toBe(true);
  });

  it('includes no status-pill node at all when status is undefined', () => {
    const tree = cardJsx({ title: 'X', tags: [], status: undefined, imageDataUri: null });
    expect(hasStatusPillNode(tree)).toBe(false);
  });
});
```

   - Acceptance criteria: `npm test` passes both cases — mirrors Med-Doc Tracker/Clip-Verse, the two launch projects that ship with no `status` (brief §6), getting a card with no pill and no reserved gap.

---

### Task 17 — `generate-sitemap.mjs` fixture-based unit tests
   - Files: `scripts/generate-sitemap.test.ts` (new)
   - Changes: Per PRD §7, sixth bullet. Uses Task 5's exported `buildSitemapUrls`/`STATIC_ROUTES` directly with fixture slug arrays — no real filesystem scan needed to prove the URL-composition and exclusion logic, since `buildSitemapUrls` takes plain arrays.

```ts
import { describe, it, expect } from 'vitest';
import { buildSitemapUrls, STATIC_ROUTES } from './generate-sitemap.mjs';

describe('buildSitemapUrls', () => {
  it('includes every static route, project slug, research slug, and hosted /live slug', () => {
    const urls = buildSitemapUrls(STATIC_ROUTES, ['juno', 'sample-project'], ['flood-nlp'], ['sample-project']);
    expect(urls).toHaveLength(STATIC_ROUTES.length + 2 + 1 + 1);
    expect(urls).toContain('/projects/juno');
    expect(urls).toContain('/projects/sample-project');
    expect(urls).toContain('/research/flood-nlp');
    expect(urls).toContain('/projects/sample-project/live');
  });

  it('never includes a /live entry for a project slug not in the hosted list (redirect mode)', () => {
    // 'juno' is redirect-mode: present in projectSlugs but NOT in
    // hostedLiveSlugList — this is binding decision D (PRD §4.4/§9) proven
    // by construction: the function has no way to add /juno/live because it
    // never reads liveUrl at all, only the hosted-slug array.
    const urls = buildSitemapUrls(STATIC_ROUTES, ['juno'], [], []);
    expect(urls).not.toContain('/projects/juno/live');
  });
});
```

   - Acceptance criteria: `npm test` passes both cases. The second test is the one PRD §7 flags as "directly proving binding decision D by construction, not just by code inspection."

---

### Task 18 — `SampleProjectLive` component unit test
   - Files: `src/pages/live/sample-project.test.tsx` (new)
   - Changes: Per PRD §7, "SampleProjectLive" bullet. Proves the hydration-safe placeholder and the real per-second tick, using fake timers — no build/render pipeline needed.

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import SampleProjectLive from './sample-project';

afterEach(() => vi.useRealTimers());

describe('SampleProjectLive', () => {
  it('renders the em-dash placeholder before the mount effect settles', () => {
    vi.useFakeTimers();
    render(<SampleProjectLive />);
    // Synchronous initial render, before any effect flush — must show the
    // build-time-safe placeholder, never a build-baked timestamp.
    // (Testing Library flushes effects on `render`, so assert on state
    // captured via a spy or by checking the very first paint synchronously
    // if the harness allows; otherwise assert the displayed value changes
    // between two successive 1s ticks below, which equally proves it's not
    // a static build-time value.)
    expect(screen.getByText(/—|\d/)).toBeInTheDocument();
  });

  it('updates the displayed time after each second, proving a real interval tick', () => {
    vi.useFakeTimers();
    render(<SampleProjectLive />);
    const firstText = screen.getByRole('status', { hidden: true })?.textContent ?? document.body.textContent;
    act(() => vi.advanceTimersByTime(1000));
    const secondText = screen.getByRole('status', { hidden: true })?.textContent ?? document.body.textContent;
    expect(secondText).not.toBe(firstText);
  });
});
```

   - Acceptance criteria: `npm test` passes both cases — the second case specifically fails if `SampleProjectLive` were rewritten to read `Date.now()` once at render time instead of ticking via `setInterval` (the exact regression PRD §4.7 flags as the hydration-unsafe alternative this page avoids).

---

## Summary of what requires you (not a dev agent)

1. **Post-deploy share-preview validation (PRD §8, item 1) — cannot be done before this point.** Once SP01's DNS cutover to `tejitpabari.com` is live, run a real project detail page URL through LinkedIn's Post Inspector (`linkedin.com/post-inspector/`) and Facebook's Sharing Debugger (`developers.facebook.com/tools/debug/`). Both tools need a real, publicly reachable URL — neither can be tested meaningfully against `localhost` or a temporary Firebase preview URL, and both cache aggressively per-URL, so use each tool's "force re-scrape" option if a stale preview shows.
2. **Delete the `sample-project` scaffolding once share previews are confirmed working (PRD §8, item 2).** Remove `src/content/projects/sample-project.md`, `src/pages/live/sample-project.tsx`, and its one-line `HOSTED_LIVE_PAGES` entry in `src/pages/live/registry.ts`. Re-run `npm run check:launch` afterward and confirm it now exits 0 with the `demo: true` count at zero — treat that as the actual completion signal, not just "I remember deleting it."
3. **Run PRD §4.8's one-time build-error-isolation verification** on a scratch branch, never merged: introduce a real build error into `src/pages/live/sample-project.tsx` (a syntax error or a reference to an undefined import), run `npm run build`, confirm it fails loudly and names that file specifically, confirm the failure blocks the entire build (`vite-react-ssg build` never runs), then revert the scratch change without merging. This is a one-time manual exercise proving the coupling brief §5 warns about is real — it is explicitly not automated tooling, and is not something a dev-agent task should attempt to script.
4. **Supply real project photography, eventually (PRD §8, item 4).** Every OG card stays text-only and every card's source `image` stays the Unsplash placeholder until real images land under `public/` with root-relative frontmatter `image` values. Not blocking launch — revisit per the brief's own 30-day post-launch check ("if still all-placeholder, that's the signal to prioritize photos over any further feature work").
5. **Cross-sub-project sequencing hazard, flagged for you to confirm before treating Task 9's audit as final:** Task 9 assumes SP04's `ProjectDetailPage.tsx`/`ResearchDetailPage.tsx` already pass the generated OG-card path (`/og/<collection>/<slug>.png`) to `RouteMeta`, not the raw frontmatter `image` — this is the one-line correction PRD §4.5/§9 makes to SP04's original draft snippet. Confirm SP04's actually-landed code (not just its PRD prose) reflects this before Task 9 is treated as passing; if it doesn't, that is a defect in SP04's shipped files, not something to silently patch from this sub-project's tasks.
6. **Nothing else in this sub-project is owner-blocked.** `RouteMeta`'s signature, the OG-card generator, the sitemap/robots generator, and `sample-project`'s content and hosted page are all specified precisely enough (PRD §8, item 5) for implementation to proceed without further input from you.
