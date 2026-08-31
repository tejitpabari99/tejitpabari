# PRD — Sub-project 06: Sharing, SEO & Sample Project

**Repo:** `tejitpabari/tejitpabari` (branch `website-revamp`)
**Depends on:** SP01 (shell, router, `getStaticPaths` mechanism, `vite.config.ts`, `firebase.json`, Tailwind design tokens) — binding. SP02 (content pipeline) — consumes `projects`, `research`, the `Project`/`Research` frontmatter contracts, `assertImagePath`'s root-relative-or-absolute image contract, and the `demo?: true` field SP02 reserved specifically for this sub-project. SP04 (Projects & Research pages) — consumes the `src/pages/live/` registry convention and `HOSTED_LIVE_PAGES` verbatim; this PRD is the first real entry in that registry.
**Consumed by:** SP03 (landing page), SP04 (Projects & Research pages), SP05 (legal pages) — all call `RouteMeta` on the assumption this PRD now resolves. SP07 (content migration) — its `image` frontmatter values are what this PRD's OG-card generator reads and (mostly, at launch) declines to composite.
**Also resolves:** SP04 §9's `[OPEN]` "`RouteMeta`'s exact prop signature is assumed, not confirmed" item, and SP05 §9's identically-worded `[OPEN]` item — both close against the signature fixed in §4.2 below.
**Source of truth:** `/root/projects/tejitpabari/.dev/website-revamp/BRIEF.md` — every decision cited as "brief §N" is settled there and not re-opened here.

---

## 1. Problem

Two real gaps exist today, both load-bearing rather than cosmetic, and both already assumed by name in sibling PRDs that couldn't wait for this one to land first:

1. **`RouteMeta` doesn't exist, and three sub-projects already call it against an assumed signature.** SP04's `ProjectDetailPage.tsx`/`ResearchDetailPage.tsx` (SP04 §4.5) and SP05's `PrivacyPage.tsx`/`TermsPage.tsx` (SP05 §4.5) both render `<RouteMeta ... />` today, and both PRDs flag the exact same thing in their own §9: SP04 writes "`RouteMeta`'s exact prop signature is assumed, not confirmed — `<RouteMeta title description path image? />`, matching SP05's identical assumption about SP06's not-yet-built component," and SP05 writes "Both legal pages call it as `<RouteMeta title description path />`, matching `juno-landing-page`'s exact usage — if SP06 lands something different, only those two call sites need a one-line fix." Both guesses turn out to be correct against the binding signature below, but they were guesses until this document existed. This is the crux of the whole sub-project: brief §1 states plainly that "server-rendered share-preview correctness (OG tags real crawlers can read) [is] a functional requirement, not polish," because the audience includes "people arriving cold from a LinkedIn post" — and LinkedIn's and Facebook's crawlers do not execute JavaScript (brief §2, Sharing/SEO), so whatever `RouteMeta` emits has to already be sitting in the prerendered HTML `vite-react-ssg` writes to disk, not injected after hydration.
2. **No OG images, no sitemap, and no demo content exist to prove any of it works.** SP02 reserved a `demo?: true` field on the `Project` type specifically for this sub-project (SP02 §4.4.2, §4.7) and SP04 shipped `src/pages/live/registry.ts`'s `HOSTED_LIVE_PAGES` deliberately empty, with a comment reading "SP06 adds the `'sample-project'` entry when it lands" (SP04 §4.7). Nothing populates either seam yet. Brief §5's own risk table calls for exactly this: "Ship the `sample-project` demo first and deliberately introduce a build error in just that route to confirm the failure is caught... before a second real hosted project is added" — a test that cannot run until `sample-project` exists. Separately, every project and research card ships today with the identical Unsplash placeholder image (SP07 §4.6 confirms all 15 content files use the byte-identical placeholder URL), so without a distinct, auto-generated OG card per item, every one of the ~15 pages this site can be shared from would produce an indistinguishable link preview — defeating the entire point of per-route metadata.

Neither gap is something SP04/SP05 could close themselves — both explicitly deferred to this document by name. This PRD closes both.

## 2. Goals

- Fix `RouteMeta`'s binding prop signature and implementation, closing SP04 §9's and SP05 §9's `[OPEN]` items by name.
- Define `src/config/site.ts` as the single source of truth for site-level constants (`SITE_URL`, `SITE_NAME`, `DEFAULT_DESCRIPTION`, `DEFAULT_OG_IMAGE`) and an `absoluteUrl()` helper every absolute-URL construction in the app routes through.
- Specify a build-time OG card generator (`scripts/generate-og-cards.mjs`, satori + `@resvg/resvg-js`) producing one 1200×630 PNG per Project/Research item plus one site-level `default.png`, with a precise, code-derived rule for when a card composites the item's own image versus rendering text-only.
- Specify a build-time sitemap/robots generator (`scripts/generate-sitemap.mjs`) covering every static route, every Project/Research slug, and every hosted `/live` route — explicitly excluding redirect-mode `/live` routes.
- Produce the full route-by-route `RouteMeta` call-site inventory (route → title source → description source → image source) so SP03/SP04/SP05's pages have one table to implement against instead of five independent judgment calls.
- Ship `sample-project` — a demo Project (`demo: true`, no `liveUrl`) exercising the complete `react-markdown`/`remark-gfm` surface SP02 configures, plus its hosted `/live` page (`src/pages/live/sample-project.tsx`, zero input-accepting markup) and its one-line `HOSTED_LIVE_PAGES` registry entry — clearly marked deletable scaffolding throughout.
- Specify the one-time manual build-error-isolation verification brief §5 calls for, using `sample-project` as the test subject, without designing a general isolation mechanism (SP04 §4.9 already scoped that out).

## 3. Non-Goals

- `ProjectCard`, the landing page, the timeline, Hero/About/Contact, `/projects`/`/research` listing pages, the two detail-page templates — SP03/SP04's scope. This PRD specifies what those pages pass into `RouteMeta` and reads what SP02/SP04 already expose (`Project`, `Research`, `HOSTED_LIVE_PAGES`); it does not touch their component code.
- `ConsentContext`, `trackEvent`'s implementation, `/privacy`/`/terms` copy — SP05's scope, consumed as-is (`RouteMeta`'s two legal-page call sites are already correct against the signature fixed here, per SP05 §4.5's own stated assumption).
- The frontmatter contract, loaders, validation, `ContentBody`, `markdownComponents`, `featured.ts` — SP02's scope. This PRD's OG generator and sitemap generator read Projects/Research content directly off disk (§4.3, §4.4 explain why, not via `@/data`), but the frontmatter shape they read is SP02's, unmodified.
- Writing any of the 10 real projects' or 5 real research items' content, or their real dates/tags/`liveUrl` values — SP07's scope, consumed as-is. `sample-project.md` is explicitly **not** SP07's content: SP07 §3 states outright "Writing SP06's `sample-project.md`... is out of scope here even though it lives in the same `src/content/projects/` directory."
- Real project photography. Until it exists, every OG card this sub-project generates is text-only and every card's source `image` is the Unsplash placeholder — an owner item, tracked in §8/§9, not solved here.
- True build-isolation for hosted `/live` mini-projects (a micro-frontend architecture, iframe sandboxing, per-route deploy isolation). SP04 §4.9 already frames this as future, separate work and ships a partial mitigation (one-file-per-project convention, a required smoke test). This PRD's only touchpoint is the one-time manual verification brief §5 asks for (§4.8, §8) — not a new isolation mechanism.
- Real-world verification that LinkedIn/Facebook/iMessage actually render these cards correctly. That requires the site to be live on `tejitpabari.com` (SP01 §4.9's DNS cutover, owner-only) — tracked as a post-deploy owner step in §8, `[DEFERRED]` in §9.
- A CMS, admin UI, or automated link-rot/uptime checking. Unchanged initiative non-goals.

---

## 4. Architecture Decisions

### 4.1 `src/config/site.ts` — site-level constants and `absoluteUrl()`

Every other piece of this sub-project — `RouteMeta`'s `og:url`/canonical construction, the OG-card generator's file paths, the sitemap's `<loc>` entries — needs the same handful of site-level facts. SP01 already anticipated this exact seam and deliberately didn't fill it: its `package.json` note says the old Gatsby `baseUrl` field's "closest live equivalent is a `VITE_SITE_URL` env var, which is SP06's concern once `RouteMeta`/sitemap generation need an absolute origin" (SP01 §4.2). This file is that concern, resolved as a plain TypeScript module rather than an env var — the origin (`https://tejitpabari.com`) is not secret, not environment-dependent (this site has exactly one real deployment target, unlike `juno-landing-page`'s multi-site Firebase project), and a hardcoded constant with no `import.meta.env` indirection is one fewer thing that can silently be undefined in a build where an env var wasn't set:

```ts
// src/config/site.ts
export const SITE_URL = 'https://tejitpabari.com';
export const SITE_NAME = 'Tejit Pabari';

export const DEFAULT_DESCRIPTION =
  'Health-tech builder and software engineer — building Juno, an AI companion ' +
  'for medical appointments, while working full-time on Microsoft Fabric Maps.';

export const DEFAULT_OG_IMAGE = '/og/default.png';

/**
 * Resolves a root-relative path ("/projects/juno", "/og/default.png") to a
 * fully-qualified https://tejitpabari.com/... URL. Already-absolute input
 * (http(s)://...) passes through unchanged — the identical duck-typing
 * assertImagePath (SP02 §4.3) already validates a `Project`/`Research`
 * `image` value against, so nothing calling this ever needs a branch to
 * decide which shape it's holding before calling it.
 */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
```

**Why this file, not scattered inline constants.** `RouteMeta` needs `SITE_URL` (canonical/`og:url`) and `SITE_NAME` (the `<title>` suffix); the OG generator needs none of these directly (it writes files, not URLs) but the sitemap generator needs `SITE_URL` for every `<loc>`; a 404/`/privacy`/`/terms`/landing page all need `DEFAULT_DESCRIPTION` and `DEFAULT_OG_IMAGE` as their `RouteMeta` fallback. Four call sites needing the same four facts is exactly the "one file is the single source of truth" reasoning the brief already applies to `featured.ts` (brief §2, Content model) — restated here for the same reason, not re-derived from scratch.

**Consequence for the two `.mjs` prebuild scripts (§4.3, §4.4):** they cannot `import` this file. `scripts/generate-og-cards.mjs` and `scripts/generate-sitemap.mjs` run as plain Node ESM (`.mjs`, no TypeScript, no bundler) *before* `vite-react-ssg build` even starts — there is no transpilation step available to turn `site.ts` into something plain `node` can load. Each script therefore carries its own one-line `const SITE_URL = 'https://tejitpabari.com';`, commented as a deliberate, tracked duplication of `src/config/site.ts`'s value. This is a different kind of duplication than the ones this codebase has repeatedly designed against elsewhere (SP02's slug/filename-agreement check, SP04's generated — not hand-maintained — `firebase.json` redirects): those guard against a *content* value drifting from its single authored source. `SITE_URL` is a domain name that changes, at most, once in this project's lifetime (never, in practice, short of the owner buying a new domain) — the drift risk is negligible enough that duplicating one string across two `.mjs` files and one `.ts` file is the pragmatic call, not a gap. Flagged `[RESOLVED]` in §9.

### 4.2 `RouteMeta` — the binding component

**Not ported from `juno-landing-page/src/components/RouteMeta.tsx`, because that file doesn't exist on disk to port.** `/root/projects/juno-landing` (the repo present on this machine matching the brief's `juno-landing-page` references) was checked directly: it contains a single commit ("Initial commit: Juno landing page content docs") and a `docs/` directory of five content-planning markdown files (`juno-overview.md`, `patients-page.md`, `landing-page-content.md`, `clinicians-page.md`, `juno-landing-structure.md`) — there is no `src/` directory anywhere in the repository, and therefore no `RouteMeta.tsx` to read or copy. This is stated plainly rather than fabricating a "ported from" citation: the component below is written directly from the binding contract this sub-project was handed, cross-checked against every place the brief and sibling PRDs describe `juno-landing-page`'s actual behavior (brief §3, Sharing/SEO: "wraps `vite-react-ssg`'s `<Head>`/react-helmet-async"; SP01 §4.2's `setupTests.ts` note, which already anticipates mocking `vite-react-ssg`'s `<Head>` specifically because "SP06 will do" render it), not copied from a source file this task assumed would be present.

**Binding prop signature** — closes SP04 §9's and SP05 §9's identically-shaped `[OPEN]` items:

```ts
interface RouteMetaProps {
  title: string;        // page title, WITHOUT the site-name suffix — RouteMeta appends it
  description: string;
  path: string;          // route path, leading slash, e.g. "/projects/juno"
  image?: string;         // absolute or site-root-relative OG image URL; defaults to DEFAULT_OG_IMAGE
}
```

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

**Why the title-suffix construction lives inside `RouteMeta`, not at each call site.** Every one of the eleven call sites in §4.5's table needs the exact same `"{title} · {SITE_NAME}"` shape — hand-writing that string concatenation at eleven separate places is exactly the kind of duplication this codebase's own precedent (`ProjectCard`, `featured.ts`, `useCollectionFilter`) consistently factors into one place instead. A caller passes the bare page title (`"Juno"`, `"Projects"`, `"Privacy Policy"`) and never has to know or repeat the separator/site-name convention.

**Why `og:type` is always `"website"`, never `"article"`.** `og:type: "article"` is the semantically "more correct" choice for a project/research writeup with a publish date, but it pulls in a parallel set of `article:*` properties (`article:published_time`, `article:author`, etc.) this content model has no clean source for — Projects/Research `date` (SP02 §4.4.1) is a sort/backfill key foremost, not an editorially meaningful "published" timestamp the way a blog post's would be, and Work Experience (which has no detail pages, brief §2) never reaches `RouteMeta` at all. A single, uniform `og:type: "website"` across every route is honest about what this site actually is (a portfolio, not a publication) and removes a whole category of "which fields does `article` type require" decisions with no payoff for a recruiter's or a crawler's rendering of the card. Flagged `[RESOLVED]` in §9.

**`Head`'s test-time behavior is already solved, not new work here.** SP01's `src/setupTests.ts` (SP01 §4.2) already mocks `vite-react-ssg`'s `Head` export as a passthrough specifically anticipating this component — `RouteMeta`'s own tests (§7) and every page that renders it can be unit-tested today without any additional test-harness work.

### 4.3 Build-time OG card generation — `scripts/generate-og-cards.mjs`

**Why satori + `@resvg/resvg-js`, not a headless browser.** The brief itself frames the alternative and rejects it before this sub-project starts (brief §2's stack table applies the identical "don't add a heavyweight dependency" reasoning that ruled out Astro and Next.js elsewhere): a headless-Chromium screenshot pipeline (Puppeteer/Playwright) would work, but it means shipping and running a full browser binary in the build pipeline for the sole purpose of rasterizing fifteen mostly-identical text-and-color cards. `satori` renders a constrained subset of flexbox JSX straight to SVG in pure JS/WASM with no browser; `@resvg/resvg-js` rasterizes that SVG to PNG, also pure-Node. Both are already proven in exactly this role (satori is the engine behind Vercel's own `@vercel/og`), and neither needs a system dependency beyond what npm installs.

**Why an independent filesystem scan, not `import { projects, research } from '@/data'`.** This mirrors a precedent SP04 already established for the identical class of problem: its `vite.config.ts` `liveRedirectsPlugin` reads `src/content/projects/*.md` directly with `readdirSync`/`gray-matter` instead of importing `src/data/projects.ts`, because "`import.meta.glob` is a Vite *application*-build-pipeline macro, not guaranteed to resolve from `vite.config.ts`'s own lighter esbuild-based load path" (SP04 §4.6). `scripts/generate-og-cards.mjs` faces a strictly harsher version of the same constraint: it isn't loaded by Vite's config pipeline at all — it's invoked directly by `node` as a `prebuild` step, *before* `vite-react-ssg build` starts (§4.3's wiring, below). `import.meta.glob` has no meaning outside a Vite transform; a plain Node process cannot execute it under any circumstance, and — being a bare `.mjs` file, not TypeScript — this script also cannot `import` `src/data/projects.ts` for the more basic reason that Node's ESM loader doesn't strip TypeScript. The script therefore re-implements the same small, targeted read SP04's plugin already does, once each for `src/content/projects/` and `src/content/research/`:

```js
// scripts/generate-og-cards.mjs
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// Deliberately duplicated from src/config/site.ts — see SP06 PRD §4.1 for why
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

// Placeholder URL every real project/research file ships with today (SP07
// §4.6) — the ONE remote value this script treats as "no real photo yet."
// A local, root-relative path (assertImagePath's other valid shape, SP02
// §4.3) is the only thing this script ever composites.
const UNSPLASH_PLACEHOLDER = 'https://images.unsplash.com/photo-1572177812156-58036aae439c';

function readCollection(dirName) {
  const dir = path.join(ROOT, 'src/content', dirName);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const { data } = matter(readFileSync(path.join(dir, f), 'utf-8'));
      return data; // NOT re-validated here — SP02's real build-time loader
                    // (invoked by `tsc --noEmit && vite-react-ssg build`,
                    // which always runs AFTER this prebuild step) is the
                    // actual source of truth for content correctness; this
                    // script only needs to read fields to draw a card.
    });
}

const fontDir = path.join(ROOT, 'scripts/assets/fonts');
const fonts = [
  { name: 'Montserrat', weight: 700, style: 'normal', data: readFileSync(path.join(fontDir, 'Montserrat-Bold.ttf')) },
  { name: 'Montserrat', weight: 600, style: 'normal', data: readFileSync(path.join(fontDir, 'Montserrat-SemiBold.ttf')) },
  { name: 'Montserrat', weight: 400, style: 'normal', data: readFileSync(path.join(fontDir, 'Montserrat-Regular.ttf')) },
];

/** Only a local, root-relative `public/` asset gets composited — the
 *  Unsplash placeholder (or any other remote URL) renders text-only. See
 *  the rationale block below this function. */
function localImageDataUri(image) {
  if (!image || !image.startsWith('/') || image === UNSPLASH_PLACEHOLDER) return null;
  const filePath = path.join(ROOT, 'public', image.replace(/^\//, ''));
  if (!existsSync(filePath)) return null;
  const ext = path.extname(filePath).slice(1);
  const b64 = readFileSync(filePath).toString('base64');
  return `data:image/${ext};base64,${b64}`;
}

function cardJsx({ title, tags, status, imageDataUri }) {
  return {
    type: 'div',
    props: {
      style: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        display: 'flex',
        backgroundColor: CREAM,
        fontFamily: 'Montserrat',
      },
      children: [
        // Left two-thirds (or full width when there's no image to composite):
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: imageDataUri ? (CARD_WIDTH * 2) / 3 : CARD_WIDTH,
              height: '100%',
              padding: '64px 56px',
              borderTop: `6px solid ${TEAL}`,
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
                          display: 'flex',
                          alignSelf: 'flex-start',
                          backgroundColor: TEAL,
                          color: '#FFFFFF',
                          fontSize: 22,
                          fontWeight: 600,
                          padding: '6px 18px',
                          borderRadius: 999,
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                        },
                        children: status,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          fontSize: 58,
                          fontWeight: 700,
                          color: INK,
                          lineHeight: 1.15,
                          // satori has no native line-clamp; a max-height on a
                          // flex column at this font size/width reliably caps
                          // wrapped text at 3 lines for every title length in
                          // the launch content set (SP07 §4.1/§4.2's longest
                          // title, "A Study on the Solar Illumination Provided
                          // by a Water Bottle," wraps to exactly 3 lines at
                          // this width — verified against the exact string).
                          maxHeight: 58 * 1.15 * 3,
                          overflow: 'hidden',
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
                              display: 'flex',
                              fontSize: 22,
                              fontWeight: 600,
                              color: TEAL_SECONDARY,
                              border: `2px solid ${TEAL_SECONDARY}`,
                              borderRadius: 999,
                              padding: '6px 18px',
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
                props: {
                  style: { display: 'flex', fontSize: 26, fontWeight: 600, color: BODY_TEXT },
                  children: 'tejitpabari.com',
                },
              },
            ],
          },
        },
        // Right third — only rendered when a real local image exists.
        imageDataUri && {
          type: 'div',
          props: {
            style: { display: 'flex', width: CARD_WIDTH / 3, height: '100%' },
            children: [
              {
                type: 'img',
                props: {
                  src: imageDataUri,
                  style: { width: '100%', height: '100%', objectFit: 'cover' },
                },
              },
            ],
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
  for (const [dirName, outDir] of [
    ['projects', 'projects'],
    ['research', 'research'],
  ]) {
    const items = readCollection(dirName);
    for (const item of items) {
      const outPath = path.join(ROOT, 'public/og', outDir, `${item.slug}.png`);
      await renderCard(
        {
          title: item.title,
          tags: Array.isArray(item.tags) ? item.tags : [],
          status: typeof item.status === 'string' ? item.status : undefined,
          imageDataUri: localImageDataUri(item.image),
        },
        outPath,
      );
      console.log(`  og/${outDir}/${item.slug}.png`);
    }
  }

  // Site-level fallback — landing page, /privacy, /terms, 404 (§4.5's table).
  await renderCard(
    { title: SITE_NAME, tags: [], status: undefined, imageDataUri: null },
    path.join(ROOT, 'public/og/default.png'),
  );
  console.log('  og/default.png');
}

main();
```

**The status-pill-only-when-set rule, honored identically to the card's own rendering.** `cardJsx`'s `status &&` branch means the pill node simply isn't in the tree when `status` is `undefined` — no default value, no "Unknown" pill, no reserved gap (the `filter(Boolean)` on its parent's `children` array removes the `false` entry outright, same technique `DetailHeader`/`ProjectCard` already use in JSX conditionals, SP04 §4.4). Med-Doc Tracker and Clip-Verse (the two projects that ship with no `status`, brief §6) get an OG card with no pill, matching their on-site card exactly — the OG image is not a second place this rule could drift out of sync.

**The compositing rule — resolved, and why it needs no new SP02 frontmatter field.**

> An item's own `image` is composited into the card's right-hand third **only when it is a local path under `public/`** (i.e. `assertImagePath`'s (SP02 §4.3) other valid shape: a string starting with `/`, resolving to a real file the owner has actually added). When `image` is the Unsplash placeholder — or any other remote `http(s)://` URL — the card renders text-only.

This reads directly off a distinction SP02's own validator already draws and enforces at build time, with zero new authoring surface: `assertImagePath` accepts exactly two shapes — "a root-relative path (`/images/...`) or an absolute http(s) URL" (SP02 §4.3) — and every one of the 15 real launch content files uses the second shape today, byte-for-byte identical (SP07 §4.6: "every one of the 10 project files' `image` frontmatter value must be the exact, byte-identical placeholder URL... Research entries... [same] rule applies to all 5 research files as well"). `localImageDataUri` above only ever returns non-`null` for the first shape. **This satisfies both halves of brief §2's own stated rule** — "Auto-generate an OG share card per project at build time..., falling back to the project's own image when one exists" — without adding a field: the *existing* `image` field already distinguishes "a real asset the owner added" from "still the placeholder," so there is nothing for a new field to disambiguate that the current one doesn't already, and the brief's own second rationale ("Until real photos exist, every share preview would look identical... while still claiming to represent a distinct project") is exactly what text-only cards with distinct titles/tags/status solve without waiting on photography. Flagged `[RESOLVED]` in §9.

**Font vendoring.** Montserrat TTFs live at `scripts/assets/fonts/Montserrat-{Regular,SemiBold,Bold}.ttf`, committed to the repo — satori has no notion of a browser's CSS `@font-face`/Google Fonts network fetch; it needs the actual font bytes handed to it as a buffer at render time (the `fonts` array above). The app's own Google-Fonts `<link>` (SP01 §4.5, loaded once in `index.html`) is a completely separate concern serving the live pages' rendered text — this vendored copy exists solely so `satori()` has bytes to shape glyphs from during the Node prebuild step, which never touches a browser or the network. **The owner does not need to do anything for this** — the three files are checked into the repo once, at implementation time, from the same Montserrat family the app already uses; nothing about them needs updating unless the app's font weights change.

**Wiring — `package.json`'s `prebuild` lifecycle hook, not a manual step:**

```json
{
  "scripts": {
    "prebuild": "node scripts/generate-og-cards.mjs && node scripts/generate-sitemap.mjs",
    "build": "tsc --noEmit && vite-react-ssg build"
  },
  "devDependencies": {
    "satori": "^0.19.4",
    "@resvg/resvg-js": "^2.6.2"
  }
}
```

npm's own lifecycle mechanism runs any `pre<script>` automatically before `npm run <script>` — `npm run build` therefore always regenerates every OG card and the sitemap first, with no separate command for the owner to remember and no risk of `dist/` shipping with stale cards after a content edit. This is additive to SP01's existing `build` script (SP01 §4.2: `"build": "tsc --noEmit && vite-react-ssg build"`) — that line is untouched; only the new `prebuild` entry and the two new `devDependencies` are added.

### 4.4 Sitemap + robots — `scripts/generate-sitemap.mjs`

Same `.mjs`/plain-Node/pre-Vite constraints as §4.3 apply here, and the same independent-scan pattern resolves them — with one simplification worth stating explicitly, since it isn't obvious on first read: **this script never needs to know which Projects have a `liveUrl`.** Binding decision D (this PRD's brief) excludes every redirect-mode `/live` route from the sitemap outright — "a 302 to an off-site URL is not a page" — so the only `/live` entries the sitemap ever needs are **hosted**-mode ones, and SP04's own registry convention (§4.7 there) already makes hosted mode structurally visible on disk without reading any frontmatter at all: "One file per hosted mini-project... under `src/pages/live/`." A directory listing of `src/pages/live/*.tsx`, excluding `registry.ts` itself, is exactly the hosted-mode slug set by construction — the same "the filesystem convention is what SP06 plugs into" relationship SP04 §4.7 already documents for the two files this sub-project adds (§4.7 below).

```js
// scripts/generate-sitemap.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// Deliberately duplicated from src/config/site.ts — see SP06 PRD §4.1.
const SITE_URL = 'https://tejitpabari.com';

const ROOT = path.resolve(import.meta.dirname, '..');

// SP01's static route table (SP01 §4.7), minus the client-only catch-all
// ('*' has no concrete path to list) and minus any /live path — those are
// handled separately below, hosted-mode only.
const STATIC_ROUTES = ['/', '/projects', '/work-experience', '/research', '/privacy', '/terms'];

function collectionSlugs(dirName) {
  const dir = path.join(ROOT, 'src/content', dirName);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => matter(readFileSync(path.join(dir, f), 'utf-8')).data.slug);
}

function hostedLiveSlugs() {
  const liveDir = path.join(ROOT, 'src/pages/live');
  return readdirSync(liveDir)
    .filter((f) => f.endsWith('.tsx') && f !== 'registry.ts')
    .map((f) => f.replace(/\.tsx$/, ''));
}

function main() {
  const urls = [
    ...STATIC_ROUTES,
    ...collectionSlugs('projects').map((slug) => `/projects/${slug}`),
    ...collectionSlugs('research').map((slug) => `/research/${slug}`),
    ...hostedLiveSlugs().map((slug) => `/projects/${slug}/live`),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');

  writeFileSync(path.join(ROOT, 'public/sitemap.xml'), xml);
  console.log(`sitemap.xml: ${urls.length} URLs`);

  writeFileSync(
    path.join(ROOT, 'public/robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
  );
  console.log('robots.txt written');
}

main();
```

**Redirect-mode `/live` routes are excluded — restated as a build-artifact consequence, not just a rule.** Because `hostedLiveSlugs()` only ever reads the `src/pages/live/` directory (never `liveUrl` frontmatter), a project like Juno — `liveUrl: 'https://app.meetjuno.health/'`, redirect mode per SP04 §4.6 — never appears in `hostedLiveSlugs()`'s output at all, so `/projects/juno/live` is structurally absent from `sitemap.xml` with no filtering logic needed to exclude it. This is a direct, load-bearing consequence of binding decision D: a search engine that indexed `/projects/juno/live` would be indexing a 302, which Google's own guidance treats as low-value/skippable for sitemap purposes — the real destination worth indexing is `app.meetjuno.health` itself, a page this site doesn't own and has no business claiming in its own sitemap.

**`robots.txt` allows everything and points at the generated sitemap** — no `Disallow` entries anywhere, matching a portfolio site with nothing that should be hidden from search (no admin routes, no auth-gated content, per the brief's own non-goals).

Chained into the same `prebuild` script as §4.3 (`"prebuild": "node scripts/generate-og-cards.mjs && node scripts/generate-sitemap.mjs"`) — order between the two scripts doesn't matter (they write to disjoint output paths, `public/og/**` and `public/{sitemap.xml,robots.txt}`), sequenced only because `&&` is simpler to read than `&`/`concurrently` for two sub-second scripts with no shared state.

### 4.5 `RouteMeta` wiring — the complete call-site inventory

This sub-project owns the component (§4.2) and the audit that every route actually uses it. Every route from brief §3's "Routes" table, with its `RouteMeta` inputs:

| Route | `title` source | `description` source | `image` source | Owning sub-project |
|---|---|---|---|---|
| `/` | Literal: `"Tejit Pabari"` | `DEFAULT_DESCRIPTION` (`@/config/site`) | `DEFAULT_OG_IMAGE` (omit prop, `RouteMeta` defaults it) | SP03 |
| `/projects` | Literal: `"Projects"` | Short static line, e.g. `"Health-tech and developer-tools projects, from Juno to a decade of shipped side projects."` | `DEFAULT_OG_IMAGE` | SP04 |
| `/projects/<slug>` | `project.title` | `project.description` | `/og/projects/<slug>.png` | SP04 |
| `/projects/<slug>/live` (hosted mode only — redirect mode never renders this page's own HTML to a real visitor, §4.6/SP04 §4.6) | `project.title` | `project.description` | `/og/projects/<slug>.png` | SP04 (via `ProjectLivePage`'s dispatch, SP04 §4.6) |
| `/work-experience` | Literal: `"Work Experience"` | Short static line, e.g. `"Where I've worked and what I've built along the way."` | `DEFAULT_OG_IMAGE` | SP03 |
| `/research` | Literal: `"Research"` | Short static line, e.g. `"Published and presented research, from flood-event NLP to a Google Science Fair project."` | `DEFAULT_OG_IMAGE` | SP04 |
| `/research/<slug>` | `item.title` | `item.description` | `/og/research/<slug>.png` | SP04 |
| `/privacy` | Literal: `"Privacy Policy"` | Short static line, e.g. `"How tejitpabari.com and everything hosted under it handles data."` | `DEFAULT_OG_IMAGE` | SP05 |
| `/terms` | Literal: `"Terms of Use"` | Short static line, e.g. `"Terms for using tejitpabari.com and everything hosted under it."` | `DEFAULT_OG_IMAGE` | SP05 |
| `404` | Literal: `"Page Not Found"` | Short static line, e.g. `"That page doesn't exist — head back to the homepage."` | `DEFAULT_OG_IMAGE` | SP01 |

**Detail pages derive `title` from the item's `title`, `description` from its frontmatter `description`, `image` from `/og/<collection>/<slug>.png`** — restated as the binding rule this table encodes, since it's the one row-shape that repeats across both dynamic-route rows (`/projects/<slug>`, `/research/<slug>`). This is exactly what SP04's existing call sites already pass (SP04 §4.5's `ProjectDetailPage`/`ResearchDetailPage` snippets show `title={project.title} description={project.description} image={project.image}` today) — **with one correction this PRD makes explicit**: SP04's draft snippet passes `image={project.image}` (the item's *own* `image`, which is the Unsplash placeholder for all 15 launch items, SP07 §4.6) directly to `RouteMeta`, not the generated OG card. That would defeat the entire point of §4.3's card generator — a shared card sharing an identical remote placeholder is precisely the "every share preview would look identical" problem brief §2 generates cards to solve. **SP04's call sites must pass `image={`/og/${collection}/${slug}.png`}`, not `image={item.image}`** — a one-line fix at the two call sites in SP04 §4.5, flagged here rather than silently left for SP04's implementer to notice independently, since it inverts the value SP04's own draft snippet currently passes.

**404's `RouteMeta` is worth stating even though the route is never physically prerendered.** SP01 §4.7 already documents that `path: '*'` "cannot be enumerated by `getStaticPaths`... is never itself prerendered to a physical HTML file" — every bad URL actually serves the home route's static `index.html` over HTTP 200, with `NotFoundPage` swapped in only after client-side hydration. A crawler therefore never sees `NotFoundPage`'s `RouteMeta` in server-rendered HTML at all (it sees `/`'s), so this row exists for the real human visitor who hits a genuinely bad link and gets far enough for React to hydrate — the tab title and any client-side share affordance should still say "Page Not Found," not silently inherit the landing page's metadata. Not a contradiction with SP01's accepted trade-off, just a note so nobody expects a `/`-shaped OG preview to swap to a 404-shaped one on share — it structurally can't, and doesn't need to.

### 4.6 `sample-project` — the demo content

**Scaffolding, not content — marked as such everywhere it appears, and explicitly not SP07's to write.** SP07 §3 states this outright: "Writing SP06's `sample-project.md`... is out of scope here even though it lives in the same `src/content/projects/` directory." This section is that file's design.

`src/content/projects/sample-project.md` satisfies SP02's `Project` contract (§4.4.2 there) exactly — `demo: true` (the flag SP02 reserved for precisely this), no `liveUrl` (so it resolves to **hosted** mode per SP04 §4.6/§4.7's `liveMode()` contract, not redirect mode — the whole point of this file is to prove the hosted path works), a real `status`/`date`/tags from the fixed Projects vocabulary, and a `body` that exercises every element SP02 §4.8 configures `react-markdown` + `remark-gfm` to render:

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

This is **scaffolding**, not a real project — it exists so the owner can preview how a full markdown write-up renders on this site's actual palette, and so link-preview testing on LinkedIn/Facebook/iMessage has a safe subject that isn't real content. See [PRD 06](#) for the deletion checklist.

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

**Why `Developer Tools` and `Completed`, specifically.** Neither choice is meaningful content — `demo: true` already marks the whole file as scaffolding regardless of what its other fields say — but SP02's build-time validator still enforces every enum on every file unconditionally (`assertTags`/`assertOptionalStatus`, SP02 §4.5.1 run "the moment each file's `import.meta.glob` entry is parsed... before any component renders"), so `sample-project.md` needs *some* valid tag and status to pass validation at all; `Developer Tools`/`Completed` are picked only because they're unremarkable, not because either carries meaning here.

**The pre-launch content gate must report exactly this file.** SP02's `scripts/check-launch-content.ts` (SP02 §4.9) already exists to fail loudly on any remaining `demo: true` project — this file is what makes that check non-vacuous. Before the owner deletes it, `npm run check:launch` reports `demo: true` count = 1, naming `src/content/projects/sample-project.md` by path; after deletion, it reports 0. This isn't new gate logic — SP02 built the check against exactly this eventuality — it's this PRD supplying the one file that check was always meant to catch.

### 4.7 `src/pages/live/sample-project.tsx` + registry entry

The hosted `/live` half of the demo, built directly on SP04's registry convention (SP04 §4.7): "1. Write `src/content/projects/<slug>.md` with NO `liveUrl` field [done, §4.6]. 2. Write `src/pages/live/<slug>.tsx`... 3. Add exactly one line to `HOSTED_LIVE_PAGES`."

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
// true. See SP05 §4.7 for the full reasoning on why this matters.
import { useEffect, useState } from 'react';

export default function SampleProjectLive() {
  // Hydration-safe: `null` on the build-time render and the first client
  // render (matching every other build-time-unsafe value on this site —
  // SP05's useContactMailto, SP04 §4.7's own flagged consequence for this
  // exact page: "a naive `new Date()` call at render time bakes in the
  // *build* timestamp, not the visitor's real time"). The real, ticking
  // value is supplied only after mount.
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

```ts
// src/pages/live/registry.ts — SP06 adds exactly these two lines to SP04's
// otherwise-empty file (SP04 §4.7):
import SampleProjectLive from './sample-project';

export const HOSTED_LIVE_PAGES: Record<string, ComponentType> = {
  'sample-project': SampleProjectLive,
};
```

**Zero input-accepting markup, verified mechanically, not just by inspection.** SP04's `scripts/check-no-forms.sh` (SP04 §4.8) greps `src/pages/live/` for `<input|form|textarea[ >]`; this file contains none of the three. SP05 §4.7's fragility guard exists precisely because "the first hosted `/live` project with an input box invalidates the 'no forms' claim" in `/privacy`/`/terms` — `sample-project` being the *first* hosted `/live` project to actually ship means it's also the first real exercise of that guard, and it passes cleanly by construction: a ticking clock reads `Date.now()`, it never reads anything the visitor typed. `npm run check:no-forms` stays green the moment this file lands, and `/privacy`/`/terms`'s "no forms" claim (SP05 §4.5) remains true.

**`registry.ts`'s own eager cross-check (SP04 §4.7) validates this entry for free the moment it's added:** it confirms `sample-project` has a matching `src/content/projects/sample-project.md` (§4.6, above) and that the same project does *not* also set `liveUrl` (it doesn't — §4.6's frontmatter has no `liveUrl` key at all) — a build-time guarantee that this entry is wired correctly, not just a code-review spot-check.

### 4.8 Build-error isolation — the one-time manual verification

Brief §5's last risk names this precisely: "hosting arbitrary small projects inside the portfolio app couples their failures to the site's build... Ship the `sample-project` demo first and deliberately introduce a build error in just that route to confirm the failure is caught in review (or scoped by tooling) before a second real hosted project is added." SP04 §4.9 already scoped true build isolation as future, separate work (a micro-frontend/iframe architecture) and shipped only a partial mitigation — a one-file-per-project convention (cheap to delete), a required per-page smoke test, and a statable minimal-dependency review discipline. **This PRD does not design a new isolation mechanism** — that would re-open a decision SP04 already made deliberately. What this PRD owns is the one concrete verification step brief §5 asks for, using the file this sub-project just shipped as the test subject, documented as a manual, owner-run check (§8, item 4) rather than automated tooling:

1. On a scratch branch (never committed to `website-revamp`), introduce a real build error into `src/pages/live/sample-project.tsx` — e.g., a syntax error, or a reference to an undefined import.
2. Run `npm run build`.
3. Confirm the build fails loudly and the error output names `src/pages/live/sample-project.tsx` specifically (TypeScript's `tsc --noEmit` step, which runs before `vite-react-ssg build` in SP01's `build` script, SP01 §4.2, should catch a type/syntax error here the same way it would for any other file in the project — there is nothing `/live`-specific about how `tsc` scopes its own error messages).
4. Confirm the failure blocks the entire build (`vite-react-ssg build` never runs) — proving the *coupling* brief §5 warns about is real and today's mitigation is "cheap to find and fix," not "isolated."
5. Revert the scratch change; do not merge it.

This closes the loop brief §5 opens without contradicting SP04's own explicit scope boundary: the test *proves* the coupling exists and that a broken hosted page is caught immediately and named precisely (not "scoped by tooling," since SP04 declined to build isolation tooling) — which is exactly the honest outcome SP04 §4.9 already predicted ("a broken hosted page still blocks the whole site's build until fixed, same as today"). Tracked as a manual step in §8, not automated — there is no CI in this project (SP01 §3, reiterated at SP02 §4.9 and SP04 §4.8) for a step like this to run inside anyway.

---

## 5. API Change Summary

N/A. Fully static site, no backend/database/API anywhere in this initiative (brief non-goal, unchanged). The closest thing to an "API" this sub-project introduces is `src/config/site.ts`'s exports (`SITE_URL`, `SITE_NAME`, `DEFAULT_DESCRIPTION`, `DEFAULT_OG_IMAGE`, `absoluteUrl()`) and `RouteMeta`'s prop contract (§4.2) — both in-repo, build-time contracts other sub-projects' components import directly, not network boundaries.

---

## 6. Frontend Change Summary

| Type | Name | Path | Notes |
|---|---|---|---|
| New | `SITE_URL`, `SITE_NAME`, `DEFAULT_DESCRIPTION`, `DEFAULT_OG_IMAGE`, `absoluteUrl` | `src/config/site.ts` | Single source of truth for site-level constants; consumed by `RouteMeta` and (duplicated per §4.1) the two `.mjs` scripts |
| New | `RouteMeta` | `src/components/RouteMeta.tsx` | Closes SP04 §9's and SP05 §9's `[OPEN]` prop-signature items |
| New (script) | `generate-og-cards.mjs` | `scripts/generate-og-cards.mjs` | Satori + `@resvg/resvg-js`; independent fs+gray-matter scan (not `@/data`), mirroring SP04 §4.6's precedent |
| New (vendored assets) | Montserrat TTFs | `scripts/assets/fonts/Montserrat-{Regular,SemiBold,Bold}.ttf` | Satori needs font bytes directly; no `@font-face` mechanism available to it |
| New (script) | `generate-sitemap.mjs` | `scripts/generate-sitemap.mjs` | Emits `public/sitemap.xml` + `public/robots.txt`; hosted-`/live` slugs read from `src/pages/live/` directory listing, not frontmatter |
| New (build output, generated) | OG cards | `public/og/{projects,research}/<slug>.png`, `public/og/default.png` | Regenerated every `npm run build` via `prebuild` |
| New (build output, generated) | Sitemap + robots | `public/sitemap.xml`, `public/robots.txt` | Same `prebuild` step |
| New (content, SP06-owned, deletable scaffolding) | `sample-project.md` | `src/content/projects/sample-project.md` | `demo: true`, no `liveUrl`; exercises full markdown surface |
| New (SP06-owned, deletable scaffolding) | `SampleProjectLive` | `src/pages/live/sample-project.tsx` | Hosted `/live` page; zero input-accepting markup |
| Modified (SP04-owned file) | `HOSTED_LIVE_PAGES` | `src/pages/live/registry.ts` | Adds the `'sample-project'` entry SP04 shipped this file empty anticipating |
| Modified (SP01-owned file) | `package.json` | `package.json` | Adds `prebuild` script, `satori`/`@resvg/resvg-js` devDependencies |
| Modified (SP04-owned call sites) | `ProjectDetailPage`, `ResearchDetailPage` | `src/pages/ProjectDetailPage.tsx`, `src/pages/ResearchDetailPage.tsx` | `RouteMeta`'s `image` prop corrected from `item.image` to `/og/<collection>/<slug>.png` — see §4.5 |
| Consumed, not modified | `Project`, `Research`, `assertImagePath`'s contract, `demo?: true` | SP02 | This PRD reads the shape; SP02 owns and validates it |
| Consumed, not modified | `HOSTED_LIVE_PAGES` registry convention, `hasLiveRoute`, `liveMode()` | SP04 | This PRD is the first real consumer of a mechanism SP04 built and shipped empty |
| Consumed, not modified | Design tokens (`cream`, `teal`, `teal-secondary`, `ink`, `body`) | SP01 `tailwind.config.ts` | Raw hex values (not Tailwind classes) reused directly in `generate-og-cards.mjs`'s satori JSX, since satori has no Tailwind runtime |

---

## 7. Testing

Sized like the sibling PRDs size theirs — targeted at the logic unique to this sub-project:

- **`RouteMeta`** (`src/components/RouteMeta.test.tsx`, using SP01's `setupTests.ts` `Head`-passthrough mock): given `{ title: 'Juno', description: '...', path: '/projects/juno' }` with no `image`, renders a `<title>Juno · Tejit Pabari</title>`, a canonical link of `https://tejitpabari.com/projects/juno`, and an `og:image`/`twitter:image` both equal to `https://tejitpabari.com/og/default.png` (the default-fallback path, resolved through `absoluteUrl`). Given an explicit `image="/og/projects/juno.png"`, `og:image` resolves to the absolute form of that path instead. Confirms `og:image:width`/`og:image:height` are always `"1200"`/`"630"` and `og:type` is always `"website"`.
- **`absoluteUrl`** (`src/config/site.test.ts`): a root-relative input (`"/projects"`) resolves to `"https://tejitpabari.com/projects"`; an already-absolute input (`"https://images.unsplash.com/..."`) passes through unchanged; a path missing its leading slash (`"projects"`, a defensive case) still resolves correctly.
- **`generate-og-cards.mjs`'s compositing rule**, run as a small standalone Node/Vitest test against the script's exported helper functions (`localImageDataUri`), not a real image-render: given the exact Unsplash placeholder URL, returns `null`; given an arbitrary other remote URL, returns `null`; given a root-relative path to a fixture file that exists under a temp `public/`, returns a `data:` URI; given a root-relative path to a file that does *not* exist, returns `null` (never throws — a missing local asset degrades to text-only, it doesn't fail the build).
- **`generate-og-cards.mjs`'s status-pill rule**: a fixture item with `status` set produces a card JSX tree containing the pill node; a fixture item with `status` undefined (mirroring Med-Doc Tracker/Clip-Verse) produces a tree with no pill node at all — asserted on the JSX object `cardJsx()` returns before it's handed to `satori()`, so this test needs no actual image rendering.
- **A real rendered-output smoke test**: `generate-og-cards.mjs`'s `main()` run once against the real `src/content/{projects,research}` directories (in CI-equivalent local dev, since there's no CI) produces exactly one PNG per content file plus `default.png`, each readable and reporting `1200×630` when its own header bytes are parsed — the actual proof the pipeline produces valid images, not just correct JSX.
- **`generate-sitemap.mjs`**: given a fixture `src/content/projects/`, `src/content/research/`, and `src/pages/live/` (one `.tsx` file plus `registry.ts`, mirroring the real shape), the generated `sitemap.xml` contains exactly `STATIC_ROUTES.length + projectCount + researchCount + 1` `<url>` entries (the `+1` is the one hosted `/live` fixture file), and specifically **excludes** any path for a fixture project carrying a `liveUrl` — this is the one test directly proving binding decision D by construction, not just by code inspection.
- **`sample-project.md` parses cleanly through SP02's real loader.** Not a new validator — this is confirmation that §4.6's frontmatter satisfies every rule SP02's existing `parseProject`/`assertTags`/`assertOptionalStatus`/`assertNoUnknownKeys` already enforce (SP02 §4.4.2/§4.5.1), run as a normal part of `npm run build`'s type-check-then-build sequence, with no special-casing for `demo: true` beyond what SP02 already built for it.
- **`SampleProjectLive`**: renders `'—'` before the mount effect fires (build-time-safe placeholder, matching the hydration-safe pattern SP04 §4.7 flagged as a requirement for this exact page); after `vi.useFakeTimers()` + advancing one second, the displayed value changes (proving the `setInterval` tick is real, not a one-shot `Date.now()` read).
- **`npm run check:no-forms` stays green** with `sample-project.tsx` present — extends SP04 §4.8's existing test fixture with this real file as an additional positive case (a file that legitimately has zero input markup, checked as part of the actual shipped registry rather than only a synthetic fixture).

**Manual QA checklist** (extends SP01/SP03/SP04's own, run once post-deploy per §8):

1. Run `npm run build` locally; confirm `public/og/projects/*.png` and `public/og/research/*.png` exist, one per launch content file, plus `public/og/default.png`, plus `public/sitemap.xml` and `public/robots.txt` — all four categories regenerated with no manual step beyond `npm run build`.
2. Open one generated OG PNG directly (e.g. `public/og/projects/juno.png`) and visually confirm: cream background, teal top rule, wrapped title, tag pills, a status pill only on projects that have one, `tejitpabari.com` footer line, and — since every launch project still carries the Unsplash placeholder (SP07 §4.6) — no composited photo on any of them yet.
3. `View Source` (real HTTP response, not DevTools' rendered DOM) on `/projects/juno` post-deploy — confirm `<title>`, `og:title`, `og:image`, and `link rel="canonical"` are all present in the raw HTML, not injected after hydration.
4. Confirm `/projects/sample-project` renders the full markdown feature set correctly against the site's palette (headings, lists, nested list, task list, table, blockquote, code block, both link types, image) — this is the actual functional test brief §3 built this file to enable.
5. Confirm `/projects/sample-project/live` renders directly (no redirect), the printed date-time is current on load, and it visibly ticks once per second.
6. Run `npm run check:launch` (SP02 §4.9) and `npm run check:no-forms` (SP04 §4.8) — confirm both report exactly one demo project / pass cleanly with `sample-project` present.
7. Confirm `sitemap.xml` lists `/projects/sample-project`, `/projects/sample-project/live`, but never `/projects/juno/live` (redirect mode, correctly excluded).
8. §4.8's one-time build-error isolation check, on a scratch branch, never merged.
9. Post-DNS-cutover only: run the real URL through LinkedIn's Post Inspector and Facebook's Sharing Debugger — tracked as an owner step in §8, not something a local checklist item can substitute for.

**Not worth building here:** a visual-regression/pixel-diff harness for OG cards (no established baseline, and the actual acceptance bar — "distinguishable, on-palette, readable" — is a five-second human look, not a pixel-perfect requirement); a headless-browser-based crawler simulation (real-world LinkedIn/Facebook rendering is only verifiable against the real, live domain, tracked in §8/§9 as an owner step, not a local test).

---

## 8. Manual Intervention Required From You

1. **Deploy first, then validate real share previews.** LinkedIn's Post Inspector (`linkedin.com/post-inspector/`) and Facebook's Sharing Debugger (`developers.facebook.com/tools/debug/`) both need a real, publicly reachable URL — neither can be tested meaningfully against `localhost` or even a temporary `*.web.app` Firebase preview URL with full fidelity, since both tools cache aggressively per-URL. Run each tool against a real `tejitpabari.com` URL (a project detail page is the best test — it has the most distinct metadata) once SP01 §4.9's DNS cutover is live, and use each tool's "force re-scrape" option if a stale/cached preview shows.
2. **Delete the sample-project scaffolding once share previews are confirmed working:** `src/content/projects/sample-project.md`, `src/pages/live/sample-project.tsx`, and its one-line entry in `src/pages/live/registry.ts`'s `HOSTED_LIVE_PAGES`. `npm run check:launch` (SP02 §4.9) will confirm the `demo: true` count drops from 1 to 0 once this is done — treat that as the actual completion signal, not just "I remember deleting it."
3. **Run §4.8's one-time build-error-isolation verification** on a scratch branch before or shortly after `sample-project` ships, per brief §5's own risk-mitigation request — deliberately break `src/pages/live/sample-project.tsx`, confirm `npm run build` fails loudly and names that file, then revert without merging.
4. **Supply real project photography, eventually.** Every OG card stays text-only and every project/research card keeps the Unsplash placeholder until real images land under `public/` with root-relative `image` frontmatter values — not blocking launch, but worth revisiting per brief §5's own 30-day check ("if still all-placeholder, that's the signal to prioritize photos over any further feature work").
5. **Nothing else in this sub-project is owner-blocked.** `RouteMeta`'s signature, the OG-card generator, the sitemap/robots generator, and `sample-project`'s content and hosted page are all specified precisely enough for implementation to proceed without further input from you.

---

## 9. Open Questions & Decisions

- `[RESOLVED: RouteMeta's prop signature is `{ title, description, path, image? }`]` — closes SP04 §9's "`RouteMeta`'s exact prop signature is assumed, not confirmed — `<RouteMeta title description path image? />`, matching SP05's identical assumption" and SP05 §9's "Both legal pages call it as `<RouteMeta title description path />`... if SP06 lands something different, only those two call sites need a one-line fix." Both assumptions turn out correct against the binding signature fixed in §4.2 — no call-site changes needed at either SP04's or SP05's existing usages, beyond the `image` *value* correction noted below.
- `[RESOLVED: OG cards are generated for every Project and Research item at build time via satori + @resvg/resvg-js; the item's own `image` is composited only when it is a local `public/` asset]` — reads directly off `assertImagePath`'s existing root-relative-vs-absolute-URL distinction (SP02 §4.3); no new frontmatter field added to SP02's contract. See §4.3.
- `[RESOLVED: redirect-mode `/live` routes are excluded from sitemap.xml]` — `generate-sitemap.mjs` only ever reads the `src/pages/live/` directory listing for hosted-mode slugs, so a redirect-mode project (`liveUrl` set) is structurally absent from the sitemap with no filtering logic required to exclude it. See §4.4.
- `[RESOLVED: `sample-project` is SP06-owned content, carries `demo: true`, and ships in hosted `/live` mode with no input elements]` — see §4.6, §4.7. Confirmed compliant with SP04 §4.8's `check-no-forms.sh` and SP05 §4.7's fragility guard by construction, not by a one-time manual check alone.
- `[RESOLVED: `og:type` is always `"website"`, never `"article"`]` — avoids a parallel `article:*` metadata surface this content model has no clean source for (Projects/Research `date` is a sort key first, not an editorial "published" timestamp); Work Experience never reaches `RouteMeta` at all (no detail pages, brief §2). See §4.2.
- `[RESOLVED: `SITE_URL` is duplicated (not shared) across `src/config/site.ts` and the two `.mjs` prebuild scripts]` — the scripts run as plain Node before any TypeScript/bundler step exists, so they cannot `import` a `.ts` file; a single string with near-zero drift risk (this project has exactly one real domain) is the accepted duplication, unlike the content-shaped duplications (slugs, `liveUrl`) this codebase elsewhere designs against. See §4.1.
- `[RESOLVED: correction to SP04's draft `RouteMeta` call sites — `image` must be `/og/<collection>/<slug>.png`, not `item.image`]` — SP04 §4.5's own snippet passes the item's raw frontmatter `image` (the Unsplash placeholder for all 15 launch items) directly to `RouteMeta`, which would defeat §4.3's OG-card generator entirely. Flagged as a one-line fix at SP04's two existing call sites (`ProjectDetailPage.tsx`, `ResearchDetailPage.tsx`), not a redesign — see §4.5 and §6's Frontend Change Summary.
- `[DEFERRED: real per-project photography]` — owner item (§8, item 4); until it lands, every OG card is text-only and every card's source `image` stays the Unsplash placeholder. Cross-references brief §5's own 30-day post-launch check for exactly this condition.
- `[DEFERRED: verifying real-world share-preview rendering in LinkedIn/Facebook/iMessage]` — cannot be meaningfully tested before the site is live on the real domain (LinkedIn's Post Inspector and Facebook's Sharing Debugger both need a real, publicly reachable, non-preview URL). Tracked as a post-deploy owner step in §8, item 1 — not something this PRD's own testing section (§7) can substitute for with a local check.
