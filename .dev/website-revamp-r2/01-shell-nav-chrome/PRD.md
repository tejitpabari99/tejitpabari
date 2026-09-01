# PRD — Round 2, Sub-project 01: Shell, Nav & Chrome

**Repo:** `tejitpabari/tejitpabari`, branch `website-revamp`
**Depends on:** nothing (Phase 1, same as round 1's SP01)
**Blocks:** nothing this round directly, but R2 (`02-landing-sections`) inherits R1's canonical
page-width/padding convention for landing-section width parity, and R5 (`05-legal-pages`) inherits
it for `/privacy`/`/terms` top padding — both cited, not designed, here (see §9).
**Source of truth:** `/root/projects/tejitpabari/.dev/website-revamp-r2/SHARED-CONTEXT.md` (repo
facts, tokens, this round's locked decisions) and `REVISION-BRIEF.md` (owner feedback verbatim) —
every decision cited below as "SHARED-CONTEXT §N" or "brief #N" is settled there and is not
re-opened here. Round-1's `.dev/website-revamp/01-app-shell-design-system-deploy/PRD.md` is the
shell's original design; this PRD revises it, not replaces it.

---

## 1. Problem

Four owner-reported defects in the app shell, verified directly against the current code (all on
`website-revamp`, not `main`):

1. **The footer isn't pinned to the bottom on short pages.** `src/layout/PageShell.tsx` is a flat
   `<ConsentProvider>` wrapping `<Nav/>`, a bare `<main><Outlet/></main>`, and `<Footer/>` — no
   `flex`/`min-h-screen` anywhere in the shell. On any route whose content is shorter than the
   viewport (`/404`, a short `/research/<slug>`), the footer renders immediately after the content
   ends, floating mid-page with empty cream background below it instead of sitting at the bottom of
   the viewport.
2. **There is no way back to `/` from a sub-page except the browser's own Back button or a logo
   click that doesn't exist.** `src/config/links.ts`'s `NAV_LINKS` has four entries
   (`Projects`, `Work Experience`, `About`, `Contact`), all `/#<sectionId>` scroll-spy anchors that
   only make sense on `/`. `src/layout/Nav.tsx` derives every section id by
   `href.slice(2)` (`"/#projects" -> "projects"`) and its "near page bottom" fallback branch reads
   `NAV_LINKS[NAV_LINKS.length - 1]` assuming the last entry is a section anchor — both break the
   instant a `/`-only entry (no hash) is added naively. `src/data/index.ts`'s
   `validateNavAndFooterLinks` (the SP02 build-time nav-href validator) also has to keep accepting
   whatever new shape `NAV_LINKS` takes.
3. **The navbar and the Back control both show on `/projects` and `/projects/:slug`, which is
   visual clutter** (brief #3). `src/pages/ProjectsPage.tsx` and `src/pages/ProjectDetailPage.tsx`
   both render `<BackButton/>` directly inside a container padded `pt-28 sm:pt-32` purely to clear
   `Nav.tsx`'s `fixed` header pill. `src/pages/ProjectLivePage.tsx` (verified by reading it) renders
   **no** `BackButton` at all today — neither its hosted-component branch nor its
   `LiveRedirectFallback` fallback path (that one comes from `LiveRedirectFallback` itself, an R4
   component). `BackButton.tsx` hardcodes `to="/"`, so even where it does render, `/projects/:slug`'s
   Back goes to the homepage, not the `/projects` listing it actually came from.
4. **Page container width and top padding are inconsistent across the six sub-pages.**
   `ProjectsPage`/`ResearchPage`/`ProjectDetailPage`/`ResearchDetailPage` all use
   `mx-auto w-full max-w-content px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12` — but
   `WorkExperiencePage` uses `mx-auto w-full max-w-[720px] px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10`
   (no `lg:px-12`, and a hardcoded 720px cap instead of the `max-w-content` token), and
   `NotFoundPage` uses `mx-auto flex w-full max-w-content flex-col items-center gap-4 px-6 py-32
   text-center` (a `py-32` shorthand instead of the `pt-28/pb-20` split everyone else uses). None of
   this is intentional variation — it's drift.

Also in scope: `RESUME_URL` in `src/config/links.ts` still points at the old Drive file
(`.../1HcqZCkdxfU73PUHmFSKqJGIG7_yG3mGS/...`); SHARED-CONTEXT §6/brief #14 give the new one.

## 2. Goals

- Sticky footer: on every route, the footer sits at the bottom of the viewport when content is
  short, and at the natural end of content when content is tall — never floating.
- `Home` in the navbar, landing on `/`, correctly highlighted as active at the top of `/` and
  correctly inactive everywhere else, without breaking the existing scroll-spy behavior for the
  four section links or SP02's nav-href validator.
- Navbar hidden, Back-only chrome, on exactly `/projects`, `/projects/:slug`, `/projects/:slug/live`
  (SHARED-CONTEXT §"locked decisions" item 2) — via a mechanism that is one pure, exported,
  per-route-testable function, not ad hoc path-string checks scattered across pages.
- `BackButton` accepts a `to` target (default `/`) so each back-only page can point at its actual
  parent, not always home.
- One shared page-container convention (max-width, horizontal padding, and chrome-aware top
  padding) adopted by all six sub-pages, extracted into a reusable piece if that removes real
  duplication (it does).
- `RESUME_URL` updated.

## 3. Non-Goals

- `src/sections/*` (Hero, About, Contact, FeaturedProjects, WorkExperience section) — landing
  section width parity and copy are R2 (`02-landing-sections`). R1 only defines the width
  convention R2 must match (§9).
- `src/content/**`, `src/config/featured.ts`, `src/pages/live/**` (including the `sample-project`
  deletion) — R3.
- `src/components/*` other than `BackButton.tsx` — R4. `DetailHeader`, `LinksRow`, `ProjectCard`,
  `LiveRedirectFallback`, the markdown-rendering spacing/status-badge work (brief #15, #17, #19) are
  untouched here.
- `src/pages/{Privacy,Terms}Page.tsx`, `src/context/ConsentContext.tsx`, `ConsentBanner.tsx` — R5.
  `/privacy`/`/terms` top-padding collision (brief #5) is the same convention problem as §1 item 4,
  but R1 does not touch those two files; R5 adopts R1's convention (§9).
- Copy/voice cleanup anywhere, including `Footer.tsx`'s own text — R6. R1's `Footer.tsx` edit in
  this PRD is layout-only (`shrink-0`, see §4.6).
- Any change to `src/sections/WorkExperienceSection.tsx`'s or the landing page's own timeline
  rendering — only the standalone `/work-experience` page (`WorkExperiencePage.tsx`) is in scope.

## 4. Architecture Decisions

### 4.1 `RESUME_URL`

Trivial one-line change, done first since nothing else depends on it or blocks it.

`src/config/links.ts`, before:

```ts
export const RESUME_URL =
  'https://drive.google.com/file/d/1HcqZCkdxfU73PUHmFSKqJGIG7_yG3mGS/view?usp=sharing';
```

After:

```ts
export const RESUME_URL =
  'https://drive.google.com/file/d/1pTIyviXM0fCCkXeX6LveYXvr7QD2TD0j/view?usp=sharing';
```

(SHARED-CONTEXT §6 / brief #14. `RESUME_URL` is consumed by `FOOTER_LINKS` in the same file and by
`Footer.tsx`'s `resume_click` tracking call — both keyed off the array entry, not the URL string, so
no other file changes.)

### 4.2 `NAV_LINKS` — a discriminated shape, not string-shape sniffing

**The problem with the naive fix.** Just appending `{ label: 'Home', href: '/' }` to the existing
`{ label, href }[]` array breaks `Nav.tsx` twice: `sectionIdOf('/')` is `'/'.slice(2)` = `''`
(not a real id — `document.getElementById('')` never matches), and the "near page bottom" fallback
(`NAV_LINKS[NAV_LINKS.length - 1]`) silently stops meaning "the last section" the moment a
non-section entry sits at either end of the array. Patching around this — e.g. a runtime check like
`href.startsWith('/#')` sprinkled at each call site — reintroduces exactly the string-shape sniffing
the round-1 comment in `Nav.tsx` already relied on and that this brief flags as broken
(SHARED-CONTEXT locked decision 1: "Both must be updated deliberately, not patched around").

**The fix: an optional `sectionId` field distinguishes scroll-spy anchors from plain route links.**

`src/config/links.ts`, before:

```ts
export const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Projects', href: '/#projects' },
  { label: 'Work Experience', href: '/#work-experience' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
];
```

After:

```ts
export interface NavLink {
  label: string;
  href: string;
  /** Present only on landing-page scroll-spy anchors (href of the form
   * "/#<sectionId>"). Absent on plain route links like Home — Nav.tsx's
   * scroll-tracking loop filters to entries that carry this field instead
   * of deriving an id from href's string shape, which broke the moment a
   * non-hash entry (Home) needed to sit in this same array. */
  sectionId?: string;
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/#projects', sectionId: 'projects' },
  { label: 'Work Experience', href: '/#work-experience', sectionId: 'work-experience' },
  { label: 'About', href: '/#about', sectionId: 'about' },
  { label: 'Contact', href: '/#contact', sectionId: 'contact' },
];
```

**Placement:** Home first. Purely a UX call (leftmost = "take me to the start"); the mechanism below
does not depend on where in the array Home sits — see next paragraph.

**Why a field, not a union type.** A discriminated union
(`{kind:'section'; sectionId:string} | {kind:'route'}`) was considered and rejected: it forces every
existing call site (`item.href`, `item.label`) through a `.kind` narrowing that buys nothing here,
since `href` and `label` are common to both cases and only `sectionId` is genuinely conditional. The
optional-field shape is the smaller diff and reads the same either way at the two call sites that
matter (`Nav.tsx`'s filter, and the "does this need a section id" check).

**`src/data/index.ts` (SP02's build-time nav-href validator, found via
`grep -rn "KNOWN_STATIC_ROUTES"` / `grep -rn "NAV_LINKS"` under `src/`) — verified, not changed.**
`validateNavAndFooterLinks(navLinks: Link[], footerLinks: Link[])` does:

```ts
const [pathname] = href.split('#');
if (!KNOWN_STATIC_ROUTES.includes(pathname || '/')) { throw ... }
```

For Home's `href: '/'`, `'/'.split('#')` is `['/']`, so `pathname` is `'/'`, which is already the
first entry in `KNOWN_STATIC_ROUTES` (`['/', '/projects', '/research', '/work-experience',
'/privacy', '/terms']`). This passes today, unmodified — verified by reading the function, not
assumed. It's also type-compatible: `NAV_LINKS` is typed `NavLink[]` (superset of `Link =
{label,href}`), and TypeScript's structural typing allows passing a `NavLink[]` variable wherever
`Link[]` is expected (excess-property checking only fires on object literals, not on a typed
variable) — no cast needed at the `validateNavAndFooterLinks(NAV_LINKS, FOOTER_LINKS)` call site.
**This is the "design the change there too" outcome required by SHARED-CONTEXT locked decision 1:
the deliberate conclusion, reached by tracing the actual code rather than assuming, is that no
functional change is needed** — codified as a new regression test in `src/data/index.test.ts`
(§7) so a future refactor of the validator can't silently reintroduce a Home-shaped hole without a
test failing.

### 4.3 `Nav.tsx` — scroll-spy over `sectionId` entries only, plus Home's active state

`src/layout/Nav.tsx`, before (full file, already read in full):

```tsx
// src/layout/Nav.tsx
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_LINKS } from '@/config/links';

// NAV_LINKS entries are { label, href } with href always of the shape
// "/#<sectionId>" ...
const sectionIdOf = (href: string) => href.slice(2); // "/#projects" -> "projects"

const SCROLL_OFFSET = 140; // px — matches techfolio's own threshold

export function Nav() {
  const [scrollSection, setScrollSection] = useState<string | null>(null);
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const activeSection = isHome ? scrollSection : null;

  useEffect(() => {
    if (!isHome) return;

    const updateActiveSection = () => {
      const nearPageBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 32;
      if (nearPageBottom) {
        setScrollSection(sectionIdOf(NAV_LINKS[NAV_LINKS.length - 1].href));
        return;
      }
      const scrollMarker = window.scrollY + SCROLL_OFFSET;
      let current: string | null = null;
      for (const item of NAV_LINKS) {
        const sectionId = sectionIdOf(item.href);
        const el = document.getElementById(sectionId);
        if (el && scrollMarker >= el.offsetTop) current = sectionId;
      }
      setScrollSection(current);
    };
    // ... listeners unchanged
  }, [isHome]);

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
                    className={`... ${
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

After:

```tsx
// src/layout/Nav.tsx
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_LINKS, type NavLink } from '@/config/links';

const SCROLL_OFFSET = 140; // px — matches techfolio's own threshold

// Only entries that carry a sectionId (the four landing-page anchors)
// participate in scroll tracking. Home (no sectionId) is handled by its
// own isActive branch below — it is never a candidate here, regardless of
// where in NAV_LINKS it sits.
const SECTION_LINKS = NAV_LINKS.filter(
  (item): item is NavLink & { sectionId: string } => Boolean(item.sectionId),
);

export function Nav() {
  const [scrollSection, setScrollSection] = useState<string | null>(null);
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const activeSection = isHome ? scrollSection : null;

  useEffect(() => {
    if (!isHome) return;

    const updateActiveSection = () => {
      const nearPageBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 32;
      if (nearPageBottom) {
        setScrollSection(SECTION_LINKS[SECTION_LINKS.length - 1].sectionId);
        return;
      }
      const scrollMarker = window.scrollY + SCROLL_OFFSET;
      let current: string | null = null;
      for (const item of SECTION_LINKS) {
        const el = document.getElementById(item.sectionId);
        if (el && scrollMarker >= el.offsetTop) current = item.sectionId;
      }
      setScrollSection(current);
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [isHome]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
      <div className="mx-auto flex w-fit items-center justify-center rounded-full border border-teal-secondary/15 bg-cream/92 p-1.5 shadow-pill backdrop-blur-md">
        <nav aria-label="Primary">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((item) => {
              // Home has no sectionId: active only at the untouched page
              // top of "/" (before any section has scrolled into view) —
              // the moment scroll tracking picks a real section, Home
              // hands off to it. On any other pathname, activeSection is
              // always null (see the ternary above), so this stays false.
              const isActive = item.sectionId
                ? activeSection === item.sectionId
                : isHome && activeSection === null;
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={`block rounded-full px-4 py-2 text-[0.8rem] font-semibold transition sm:px-4.5 sm:py-2.5 sm:text-[0.83rem] lg:px-5 lg:py-2.5 lg:text-[0.88rem] ${
                      isActive
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

**Why filtering, not repositioning Home.** An earlier option considered was "just keep
`NAV_LINKS[NAV_LINKS.length - 1]` and always push Home to the front, never the back" — rejected
because it re-encodes a positional assumption (`sectionId` is a name; "not last" is not) that the
next person editing `NAV_LINKS` has no way to know they must preserve. Filtering on `sectionId` is
correct regardless of where Home (or any future non-section entry) sits in the array.

**SSR/hydration correctness of Home's initial active state.** On first paint — prerendered HTML and
the client's first render before any scroll — `scrollSection` starts `null`, so on `/`,
`activeSection` is `null` and Home's `isActive` is `true` before the `useEffect` runs (server-side,
the effect never runs at all; client-side, it runs post-mount and only overwrites `scrollSection`
once real geometry is available). This matches the existing pattern exactly (previously nothing was
highlighted in that window; now Home fills it), introduces no new hydration-mismatch class of bug
(scroll-based highlighting was already client-only), and needs no code beyond what's above.

### 4.4 Back-only chrome: route `handle` + `useMatches()`, not a `PageShell`-local pathname predicate

**Two options considered, per the brief:**

**(a) `PageShell` derives chrome mode from `useLocation().pathname` via a small pure predicate**
(e.g. `isBackOnlyPath(pathname: string): boolean` matching `/^\/projects(\/[^/]+)?(\/live)?$/`).
Pro: trivially testable with plain strings, no router machinery. Con: it is a second, independent
place that has to agree with `routes.tsx`'s own path definitions (`projects`, `projects/:slug`,
`projects/:slug/live`) — a regex living in `PageShell.tsx` that must be kept in lockstep, by eye,
with route strings living in `routes.tsx`. Adding a fourth back-only route later (or renaming an
existing one) is a two-file, easy-to-desync change with no compiler check tying them together.

**(b) A `handle` field on the route records in `src/routes.tsx`, read in `PageShell` via
`useMatches()`.** Pro: the chrome-mode declaration sits directly on the route it describes — adding
a new back-only route is a one-line addition exactly where the route itself is defined, with no
second file to remember. Con (addressed below): `useMatches()`/`handle` must actually work across
every render path this app uses (SSG prerender, client hydration, and the vitest/jsdom test
harness) — this needed verification, not assumption, since silently falling back to "show nav
everywhere" on SSG output would ship a broken build with no visible error.

**Verified, not assumed: `handle` + `useMatches()` works on all three render paths this app hits.**

- `vite-react-ssg`'s SSG prerender (reading `node_modules/vite-react-ssg/dist/shared/vite-react-ssg.Ctg3mDmH.mjs` directly): `const { StaticRouterProvider, createStaticHandler, createStaticRouter } = await import('react-router-dom/server.js'); const router = createStaticRouter(dataRoutes, routerContext, ...); <StaticRouterProvider router={router} context={routerContext}/>` — this is react-router's full **data router** SSR API. `handle` and `useMatches()` are first-class data-router features, identically available here.
- Client hydration: `vite-react-ssg`'s own exported type (`node_modules/vite-react-ssg/dist/shared/vite-react-ssg.DMvCQLH5.d.ts`) defines `type Router = ReturnType<typeof createBrowserRouter>` — also a data router.
- The test harness: `src/routes.smoke.test.tsx` (existing) already renders the real `routes` array via `createMemoryRouter(routes, {...})` + `<RouterProvider router={router}/>` — also a data router, and the exact pattern this PRD's own new tests reuse (§7).

All three are `@remix-run/router`-backed data routers; `handle`/`useMatches()` behave identically
across them. **Recommendation: option (b).** It's colocated with the route definitions it describes,
requires no second path-matching implementation to keep in sync, and is now confirmed to work
end-to-end rather than assumed to.

**The "pure exported predicate" requirement, satisfied under option (b).** The brief requires a
pure, exported, per-route-testable predicate regardless of which option is picked. Under (b), that
predicate takes a route's `handle` value (not a pathname) — pure in the same sense: no router
access, no side effects, testable by calling it directly with the `handle` value pulled off any
route record (including every real route in `src/routes.tsx`, walked in a test — see §7).

**New file `src/layout/chromeMode.ts`** (not `.tsx` — no JSX). Placed in `src/layout/`, *not* inside
`routes.tsx` itself, specifically to avoid a circular import: `routes.tsx` imports `PageShell` (as
its `element`), so if `PageShell.tsx` needed to import a type/function back out of `routes.tsx`,
that would be a real circular module dependency. `chromeMode.ts` is a small neutral module both
`routes.tsx` (to type the `handle` field it sets) and `PageShell.tsx` (to interpret `handle` at
render time) import independently:

```ts
// src/layout/chromeMode.ts
//
// The chrome contract for PageShell: each leaf route in src/routes.tsx may
// set `handle: { chrome: 'back-only' } satisfies RouteHandle` to hide Nav
// on that route. Routes with no `handle` at all — the common case — get
// 'full' by default. This file is intentionally NOT part of routes.tsx
// itself: routes.tsx imports PageShell as an element, so PageShell
// importing back from routes.tsx would be circular; both modules import
// this neutral one instead.

export type ChromeMode = 'full' | 'back-only';

export interface RouteHandle {
  chrome: ChromeMode;
}

const DEFAULT_CHROME_MODE: ChromeMode = 'full';

// Pure and router-independent: takes whatever useMatches().at(-1)?.handle
// returns (typed `unknown` by react-router — RouteObject['handle'] carries
// no built-in shape) and decides the chrome mode. A route with no handle,
// or a handle missing/misshaping `chrome`, fails open to 'full' — on
// purpose: forgetting to tag a new back-only route must show too much
// chrome (recoverable, visible) rather than silently hiding the navbar
// site-wide the moment `handle` is absent.
export function chromeModeFromHandle(handle: unknown): ChromeMode {
  if (
    handle !== null &&
    typeof handle === 'object' &&
    'chrome' in handle &&
    (handle as RouteHandle).chrome === 'back-only'
  ) {
    return 'back-only';
  }
  return DEFAULT_CHROME_MODE;
}
```

**`src/routes.tsx`**, before (the three `/projects*` routes, in context):

```tsx
{ path: 'projects', element: <ProjectsPage /> },
{
  path: 'projects/:slug',
  element: <ProjectDetailPage />,
  getStaticPaths: () => projectSlugs.map((slug) => `projects/${slug}`),
},
{
  path: 'projects/:slug/live',
  element: <ProjectLivePage />,
  getStaticPaths: () => projectLiveSlugs.map((slug) => `projects/${slug}/live`),
  // FRAGILITY GUARD ... (unchanged, see current file)
},
```

After:

```tsx
import type { RouteHandle } from '@/layout/chromeMode';
// ...
{
  path: 'projects',
  element: <ProjectsPage />,
  handle: { chrome: 'back-only' } satisfies RouteHandle,
},
{
  path: 'projects/:slug',
  element: <ProjectDetailPage />,
  getStaticPaths: () => projectSlugs.map((slug) => `projects/${slug}`),
  handle: { chrome: 'back-only' } satisfies RouteHandle,
},
{
  path: 'projects/:slug/live',
  element: <ProjectLivePage />,
  getStaticPaths: () => projectLiveSlugs.map((slug) => `projects/${slug}/live`),
  handle: { chrome: 'back-only' } satisfies RouteHandle,
  // FRAGILITY GUARD ... (unchanged, see current file)
},
```

Every other route (`index` `/`, `work-experience`, `research`, `research/:slug`, `privacy`, `terms`,
the `*` catch-all) gets **no** `handle` field at all — deliberately, so `chromeModeFromHandle`'s
fail-open default (`'full'`) is genuinely exercised by the test suite (§7) rather than every route
redundantly re-asserting `{chrome: 'full'}`.

`vite-react-ssg`'s `RouteRecord` type (`node_modules/vite-react-ssg/dist/shared/vite-react-ssg.DMvCQLH5.d.ts`)
is `Omit<NonIndexRouteObject, 'children'> & {children?: RouteRecord[]} & CommonRouteOptions` (or the
index-route equivalent) — `NonIndexRouteObject`/`IndexRouteObject` both come straight from
`react-router-dom` and already declare `handle?: AgnosticNonIndexRouteObject["handle"]` /
`handle?: AgnosticIndexRouteObject["handle"]`. No type augmentation needed; `handle` is already a
first-class field on every entry in `routes.tsx`'s array.

### 4.5 `src/layout/PageShell.tsx` — sticky footer + chrome-mode Nav

Before (full file, already read):

```tsx
// src/layout/PageShell.tsx
import { Outlet } from 'react-router-dom';
import { ScrollManager } from '@/lib/ScrollManager';
import { AnalyticsListener } from '@/lib/AnalyticsListener'; // SP05 add
import { ConsentProvider } from '@/context/ConsentContext';   // SP05 add
import { ConsentBanner } from '@/components/ConsentBanner';   // SP05 add
import { Nav } from './Nav';
import { Footer } from './Footer';

export function PageShell() {
  return (
    <ConsentProvider>
      <ScrollManager />
      <AnalyticsListener />
      <Nav />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ConsentBanner />
    </ConsentProvider>
  );
}
```

After:

```tsx
// src/layout/PageShell.tsx
import { Outlet, useMatches } from 'react-router-dom';
import { ScrollManager } from '@/lib/ScrollManager';
import { AnalyticsListener } from '@/lib/AnalyticsListener'; // SP05 add
import { ConsentProvider } from '@/context/ConsentContext';   // SP05 add
import { ConsentBanner } from '@/components/ConsentBanner';   // SP05 add
import { Nav } from './Nav';
import { Footer } from './Footer';
import { chromeModeFromHandle } from './chromeMode';

export function PageShell() {
  const matches = useMatches();
  // routes.tsx has exactly one level of route beneath PageShell today, so
  // ".at(-1)" (the deepest/leaf match) is the only match that carries a
  // page-specific handle. Written this way (rather than indexing [0]) so a
  // future nested route's own handle still wins over an ancestor's,
  // matching react-router's own handle convention.
  const chromeMode = chromeModeFromHandle(matches.at(-1)?.handle);

  return (
    <ConsentProvider>
      <ScrollManager />
      <AnalyticsListener />
      <div className="flex min-h-screen flex-col">
        {chromeMode === 'full' && <Nav />}
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <ConsentBanner />
    </ConsentProvider>
  );
}
```

**Why the flex wrapper needs no accompanying `html`/`body`/`#root` CSS change.** Verified by reading
`index.html` (bare `<div id="root"></div>`, no inline style) and `src/index.css` (three bare
`@tailwind` directives, no custom rules) — there is no `height: 100%` chain from `html`/`body`
today, and none is needed: `min-h-screen` is `min-height: 100vh`, a viewport-relative unit that does
not depend on any ancestor's height being explicitly set. The wrapper `div` will correctly be at
least one viewport tall regardless of `#root`'s own (unset, `auto`) height.

**Why `Nav` being `fixed` doesn't interact with the new flex layout.** `Nav.tsx`'s `<header>` is
`fixed inset-x-0 top-0` — removed from normal document flow entirely, so conditionally
mounting/unmounting it inside the flex column changes nothing about the column's flex math; it's
purely a "does this fixed-position pill exist in the DOM right now" toggle layered on top.
`ConsentBanner` is the same story (`fixed inset-x-0 bottom-0`, verified by reading
`src/components/ConsentBanner.tsx`) — kept as a sibling *after* the flex wrapper, matching its
original position in the tree, since it's out-of-flow regardless of where it sits.

**Why `ConsentProvider` doesn't get in the way.** Verified by reading `src/context/ConsentContext.tsx`:
`ConsentProvider` renders `<ConsentContext.Provider value={...}>{children}</ConsentContext.Provider>`
— a pure context wrapper with no DOM node of its own — so nesting the flex wrapper directly inside
it produces exactly the DOM structure intended (`#root > div.flex.min-h-screen.flex-col > (Nav?,
main, Footer)`, with `ConsentBanner` as a fixed sibling), with no extra wrapping `<div>` introduced
by the provider itself.

### 4.6 `src/layout/Footer.tsx` — `shrink-0` only (layout, not copy)

Before: `<footer className="border-t border-teal-secondary/10 bg-cream">`

After: `<footer className="shrink-0 border-t border-teal-secondary/10 bg-cream">`

Defensive, not strictly required by the flex math today (`main`'s `flex-1` absorbs all extra space;
`Footer` has no competing growth pressure to shrink against) — but it's the standard, cheap
insurance against a flex item's default `flex-shrink: 1` ever compressing the footer if `main`'s
content someday overflows unexpectedly. No other change to this file — its em-dash/voice cleanup is
R6's (§3).

### 4.7 `BackButton.tsx` — accepts `to`, default `/`

Before (full file, already read):

```tsx
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

After:

```tsx
import { Link } from 'react-router-dom';
import { ArrowIcon } from './icons/ArrowIcon';

interface BackButtonProps {
  /** Where Back navigates. Defaults to the site root. Pages whose most
   * useful Back target is a specific parent (e.g. /projects/:slug going
   * back to /projects, not /) must pass it explicitly. Always a real
   * <Link>, never `navigate(-1)`: these pages are reachable by direct or
   * shared link, which may have no browser history to go back to. */
  to?: string;
  className?: string;
}

export function BackButton({ to = '/', className = '' }: BackButtonProps) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-teal-secondary transition hover:text-teal ${className}`}
    >
      <ArrowIcon className="h-4 w-4 rotate-180" />
      Back
    </Link>
  );
}
```

`navigate(-1)` was considered and explicitly rejected, per the brief: every back-only page is a
prerendered static route reachable by a shared/direct link with no guaranteed history entry to pop
to, so `-1` could land a visitor somewhere outside the site entirely (or nowhere, if the tab opened
fresh on that URL). A named `to` target is always correct regardless of how the visitor arrived.

### 4.8 `src/layout/PageContainer.tsx` — new shared container (width, padding, chrome-aware top gutter)

**Why extract this.** All six sub-pages (`ProjectsPage`, `ProjectDetailPage`, `ResearchPage`,
`ResearchDetailPage`, `WorkExperiencePage`, `NotFoundPage`) already share, or should share, the same
outer container shape: `mx-auto w-full max-w-content px-6 pb-20 [[TOP PADDING]] sm:px-8 md:px-10
lg:px-12`. The only thing that legitimately varies is the top padding, and that variance is now
*principled* rather than accidental: it depends on chrome mode (full chrome needs real clearance
under `Nav`'s fixed pill; back-only chrome has no fixed header to clear at all). One component
encodes both the invariant part and the one dimension that's allowed to vary, instead of six
call sites independently re-deriving (or drifting from) the same convention.

```tsx
// src/layout/PageContainer.tsx
import type { ElementType, ReactNode } from 'react';
import type { ChromeMode } from './chromeMode';

// 'full': clears Nav's fixed pill (a floating rounded-pill header, not part
// of document flow — see PageShell §4.5) — same value every full-chrome
// sub-page already used before this PRD.
// 'back-only': no fixed header exists on these routes at all; pt-28/32
// there would just be dead air above the Back link, so it drops to a much
// smaller top gutter instead.
const TOP_PADDING: Record<ChromeMode, string> = {
  full: 'pt-28 sm:pt-32',
  'back-only': 'pt-12 sm:pt-16',
};

interface PageContainerProps {
  /** @default 'div' — pass 'article' for the two markdown detail pages. */
  as?: ElementType;
  chrome: ChromeMode;
  className?: string;
  children: ReactNode;
}

// The one shared width/padding convention every sub-page now uses (PRD 01
// §4.8/§4.9). Horizontal padding and max-width never vary; only top
// padding varies with chrome mode. A page needing a visually narrower
// content column (e.g. WorkExperiencePage's timeline) nests an inner
// max-w-[…] wrapper *inside* this container instead of shrinking the
// container itself, so every page keeps the same outer rhythm — see
// WorkExperiencePage, §4.9.
export function PageContainer({ as: Tag = 'div', chrome, className = '', children }: PageContainerProps) {
  return (
    <Tag
      className={`mx-auto w-full max-w-content px-6 pb-20 ${TOP_PADDING[chrome]} sm:px-8 md:px-10 lg:px-12 ${className}`}
    >
      {children}
    </Tag>
  );
}
```

A bare Tailwind-token approach (just adding e.g. a `pageTop`/`pageTopBackOnly` spacing token to
`tailwind.config.ts`) was considered and rejected in favor of a component: the padding alone isn't
the whole shared shape — `max-w-content`, `mx-auto`, `w-full`, and the horizontal padding ramp are
equally part of "the convention," and six call sites each re-typing that full class string (even
with one token swapped in) is exactly the kind of copy-paste surface that already drifted once
(`WorkExperiencePage`'s missing `lg:px-12`, §1 item 4). A component makes the whole shape one
edit-site; a token would still leave five other class strings to keep in sync by hand.

### 4.9 The six sub-pages, container-by-container

**`src/pages/ProjectsPage.tsx`** — chrome now `back-only` (§4.4), `BackButton` stays default (`to="/"`
— `/projects` is a top-level listing; home is its correct Back target).

Before:

```tsx
<div className="mx-auto w-full max-w-content px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12">
  <RouteMeta title="Projects" description="..." path="/projects" />
  <BackButton />
  <h1 ...>Projects</h1>
  ...
</div>
```

After:

```tsx
<PageContainer chrome="back-only">
  <RouteMeta title="Projects" description="..." path="/projects" />
  <BackButton />
  <h1 ...>Projects</h1>
  ...
</PageContainer>
```

**`src/pages/ProjectDetailPage.tsx`** — chrome `back-only`; `BackButton to="/projects"` (the actual
parent, not home).

Before: `<article className="mx-auto w-full max-w-content px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12">` … `<BackButton />`

After: `<PageContainer as="article" chrome="back-only">` … `<BackButton to="/projects" />`

**`src/pages/ProjectLivePage.tsx`** — chrome `back-only` (via `routes.tsx`'s `handle`, §4.4); the
page itself has **no existing container div** to convert (verified: its JSX is a bare dispatch —
`<HostedComponent/>`, or `<LiveRedirectFallback/>`, or `<NotFoundPage/>` — with no wrapping element
of its own), so §4.9's `PageContainer` extraction does not apply here; there is nothing to
normalize. What *is* missing, per §1 item 3, is a `BackButton` on the hosted-component branch (the
only branch this file itself renders any chrome for):

Before:

```tsx
if (HostedComponent && project) {
  return (
    <>
      <RouteMeta title={project.title} description={project.description}
        path={`/projects/${project.slug}/live`} image={`/og/projects/${project.slug}.png`} />
      <HostedComponent />
    </>
  );
}
```

After:

```tsx
if (HostedComponent && project) {
  return (
    <>
      <RouteMeta title={project.title} description={project.description}
        path={`/projects/${project.slug}/live`} image={`/og/projects/${project.slug}.png`} />
      <div className="mx-auto w-full max-w-content px-6 pt-8 sm:px-8 md:px-10 lg:px-12">
        <BackButton to={`/projects/${project.slug}`} />
      </div>
      <HostedComponent />
    </>
  );
}
```

This wraps only the `BackButton`, not `HostedComponent` itself — `HostedComponent` (an R3-owned
`src/pages/live/*.tsx` module) keeps full control of its own layout below the Back link. **Currently
dead code in practice:** `HOSTED_LIVE_PAGES`'s only entry today is `sample-project`, which R3
deletes this round (SHARED-CONTEXT locked decision 4) — after that lands, `HOSTED_LIVE_PAGES` is
`{}` and this branch is unreachable until a future hosted `/live` project exists. Added anyway
because it's cheap, correct, and means the contract is right the moment R3 (or a future round) adds
a new hosted entry, rather than R1 having to be re-visited.

**Resolved (§9), split by file ownership:** the redirect-mode branch (`project.liveUrl` set) renders
`<LiveRedirectFallback to={project.liveUrl} label={project.title} />`, an R4-owned component
(`src/components/LiveRedirectFallback.tsx`). R4's PRD (`04-component-polish/PRD.md` §4.7) adds a new
optional `backTo` prop to `LiveRedirectFallback`, threaded straight into `BackButton`'s own `to` prop.
R1 owns `ProjectLivePage.tsx` (this file, this section) and supplies that prop on the redirect-mode
call site:

Before:

```tsx
if (project?.liveUrl) return <LiveRedirectFallback to={project.liveUrl} label={project.title} />;
```

After:

```tsx
if (project?.liveUrl) return <LiveRedirectFallback to={project.liveUrl} label={project.title} backTo={`/projects/${project.slug}`} />;
```

Each PRD owns and implements its own half of this change; neither is blocked on the other's file.

**`src/pages/ResearchPage.tsx`** — chrome stays `full` (not in the back-only list; unaffected by
§4.4). Container converts to the shared component with **no behavior change** — it already used
exactly the `full`-chrome padding values `PageContainer` encodes:

Before: `<div className="mx-auto w-full max-w-content px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12">`

After: `<PageContainer chrome="full">`

`BackButton` here is untouched (`to="/"` default) — Research is not in `NAV_LINKS` (only in
`FOOTER_LINKS`), so `/research`'s own Back-to-home affordance stays meaningful even with Nav
visible; the owner's feedback (§SHARED-CONTEXT locked decision 2) never asked for it to be removed
there.

**`src/pages/ResearchDetailPage.tsx`** — chrome `full`, same no-behavior-change conversion:

Before: `<article className="mx-auto w-full max-w-content px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12">`

After: `<PageContainer as="article" chrome="full">`

**`src/pages/WorkExperiencePage.tsx`** — chrome `full`; this is the one real normalization, not just
a mechanical swap.

Before:

```tsx
export function WorkExperiencePage() {
  return (
    <div className="mx-auto w-full max-w-[720px] px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10">
      <RouteMeta title="Work Experience" description="..." path="/work-experience" />
      <BackButton />
      <p className="mt-6 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-teal-secondary">
        Work Experience
      </p>
      <h1 className="mt-3 text-[1.9rem] font-extrabold tracking-tight text-ink sm:text-[2.3rem]">
        The full timeline.
      </h1>
      <div className="mt-10">
        <Timeline entries={workExperience} />
      </div>
    </div>
  );
}
```

After:

```tsx
export function WorkExperiencePage() {
  return (
    <PageContainer chrome="full">
      <RouteMeta title="Work Experience" description="..." path="/work-experience" />
      <BackButton />
      <div className="max-w-[45rem]">
        <p className="mt-6 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-teal-secondary">
          Work Experience
        </p>
        <h1 className="mt-3 text-[1.9rem] font-extrabold tracking-tight text-ink sm:text-[2.3rem]">
          The full timeline.
        </h1>
        <div className="mt-10">
          <Timeline entries={workExperience} />
        </div>
      </div>
    </PageContainer>
  );
}
```

**Why the outer container widens to `max-w-content` but the timeline itself doesn't.** `Timeline`
(`src/components/timeline/Timeline.tsx`, read directly) sets no `max-w-*` of its own
(`role="list" ... className="flex flex-col gap-0 pl-1"`) — the page's old `max-w-[720px]` on its
*outer* container was doing double duty: bounding the whole page **and** giving the timeline its
narrow, readable line length. Widening the outer container to `max-w-content` (72rem ≈ 1152px) for
consistency with every other sub-page, with nothing else changed, would stretch `Timeline`'s text
rows almost to double their current width — a real regression, not a normalization. The fix used
here follows the same pattern the detail pages already establish (`ProjectDetailPage`/
`ResearchDetailPage` cap their description `<p>` at `max-w-[52rem]` *inside* a `max-w-content`
outer article): nest a narrower wrapper (`max-w-[45rem]` = 720px, the exact width being preserved)
around the content that wants it, and let the outer container be the one universal width everywhere.
`BackButton` sits outside the inner wrapper (immediately after `RouteMeta`, matching every other
page's DOM order) — both it and the inner wrapper start flush at the container's left edge
regardless of the inner wrapper's own width, since neither is centered independently. This also
picks up `lg:px-12`, which the old class string was missing entirely (§1 item 4) — a real, if minor,
bug fix bundled into the same edit.

**`src/pages/NotFoundPage.tsx`** — chrome `full` (404 is not in the back-only list). This is the
page cited directly in the owner's report (§1 item 1) as an example of the floating-footer bug, so
it's also the page most worth double-checking end to end in manual QA (§7).

Before: `<div className="mx-auto flex w-full max-w-content flex-col items-center gap-4 px-6 py-32 text-center">`

After: `<PageContainer chrome="full" className="flex flex-col items-center gap-4 text-center">`

This changes the container's own vertical rhythm slightly (`py-32` — 128px top and bottom — becomes
`PageContainer`'s `pt-28 sm:pt-32` / `pb-20`, i.e. 112–128px top, 80px bottom) to bring it in line
with the shared convention; visually this is a minor tightening of the bottom gap, not a regression
— the page is a short, centered message and the real fix for its "floats mid-viewport" problem is
`PageShell`'s sticky footer (§4.5), not this page's own padding.

## 5. API Change Summary

N/A — no backend/API surface in this project; this PRD is entirely client-side layout/routing.

## 6. Frontend Change Summary

| File | Change |
|---|---|
| `src/config/links.ts` | `RESUME_URL` updated (§4.1); `NAV_LINKS` gains `NavLink` type with optional `sectionId`, plus a new `Home` entry (§4.2). `FOOTER_LINKS` untouched. |
| `src/layout/Nav.tsx` | Scroll-spy loop filters to `sectionId`-bearing entries only; Home gets its own active-state branch; stale "href always /#..." comment removed (§4.3). |
| `src/data/index.ts` | No functional change (verified compatible as-is, §4.2); new regression test only (§7). |
| `src/layout/chromeMode.ts` | **New.** `ChromeMode`, `RouteHandle`, pure exported `chromeModeFromHandle()` (§4.4). |
| `src/routes.tsx` | `handle: { chrome: 'back-only' }` added to the three `/projects*` route records (§4.4). |
| `src/layout/PageShell.tsx` | Sticky-footer flex layout (`flex min-h-screen flex-col`, `main` gets `flex-1`); `Nav` now conditionally rendered via `useMatches()` + `chromeModeFromHandle()` (§4.5). |
| `src/layout/Footer.tsx` | `shrink-0` added to the `<footer>` element; no copy change (§4.6). |
| `src/components/BackButton.tsx` | Accepts `to?: string`, default `'/'` (§4.7). |
| `src/layout/PageContainer.tsx` | **New.** Shared width/padding convention, chrome-aware top padding (§4.8). |
| `src/pages/ProjectsPage.tsx` | Converts to `<PageContainer chrome="back-only">`; `BackButton` unchanged (`to="/"`) (§4.9). |
| `src/pages/ProjectDetailPage.tsx` | Converts to `<PageContainer as="article" chrome="back-only">`; `BackButton to="/projects"` (§4.9). |
| `src/pages/ProjectLivePage.tsx` | Adds a `BackButton to={`/projects/${slug}`}` to the hosted-component branch (§4.9), and a `backTo={`/projects/${slug}`}` prop to the redirect-mode `<LiveRedirectFallback>` call (§4.9, R4's new prop). |
| `src/pages/ResearchPage.tsx` | Converts to `<PageContainer chrome="full">`, no behavior change (§4.9). |
| `src/pages/ResearchDetailPage.tsx` | Converts to `<PageContainer as="article" chrome="full">`, no behavior change (§4.9). |
| `src/pages/WorkExperiencePage.tsx` | Converts to `<PageContainer chrome="full">` + inner `max-w-[45rem]` wrapper around heading/Timeline; picks up the previously-missing `lg:px-12` (§4.9). |
| `src/pages/NotFoundPage.tsx` | Converts to `<PageContainer chrome="full" className="flex flex-col items-center gap-4 text-center">` (§4.9). |

## 7. Testing

**Tests this PRD breaks, named exactly:**

- **`src/layout/Nav.test.tsx`**, test `'renders four items with the exact NAV_LINKS hrefs'` — the
  array now has five entries. New assertion:

  ```ts
  expect(links.map((l) => l.getAttribute('href'))).toEqual([
    '/', '/#projects', '/#work-experience', '/#about', '/#contact',
  ]);
  ```

  (Retitle to `'renders five items ...'`.) The second test in that file
  (`'clears activeSection to null on a non-/ pathname'`) needs **no** code change — it already
  iterates `getAllByRole('link')` generically and asserts none carry the active class, which now
  automatically covers Home too (verified by re-reading the test: no hardcoded count or hardcoded
  link list).

**Tests verified NOT broken (read directly, no assertion on container class or `BackButton`'s `to`
value):** `src/pages/ProjectsPage.test.tsx`, `src/pages/ProjectDetailPage.test.tsx`,
`src/pages/ProjectLivePage.test.tsx`, `src/components/LiveRedirectFallback.test.tsx`,
`src/pages/HomePage.test.tsx`. `src/routes.smoke.test.tsx` also needs no change to keep passing
(its assertion is only `not.toThrow()` for every path, including the arbitrary-slug ones like
`/projects/anything` and `/projects/anything/live`) — it is, however, the natural place to *add*
new integration coverage (below).

**New tests required:**

1. **`src/layout/chromeMode.test.ts`** (new file) — the pure predicate itself:
   - `chromeModeFromHandle(undefined)` → `'full'`.
   - `chromeModeFromHandle({})` → `'full'`.
   - `chromeModeFromHandle({ chrome: 'full' })` → `'full'`.
   - `chromeModeFromHandle({ chrome: 'back-only' })` → `'back-only'`.
   - `chromeModeFromHandle('garbage')` / `chromeModeFromHandle(null)` / `chromeModeFromHandle(42)` →
     `'full'` (fail-open on malformed input).
   - **At every route:** import `routes` from `@/routes`, walk `routes[0].children` (the flat list
     under `PageShell`), and for each record assert:
     - `path` in `['projects', 'projects/:slug', 'projects/:slug/live']` →
       `chromeModeFromHandle(record.handle)` is `'back-only'`.
     - every other record (including the index route and the `'*'` catch-all) →
       `chromeModeFromHandle(record.handle)` is `'full'`.
     This is the literal "chrome-mode predicate at every route" test the brief requires, and it
     fails immediately if a route's `handle` is ever forgotten or mistyped.

2. **`src/routes.smoke.test.tsx`** (extend the existing file) — integration-level, exercising the
   real `PageShell` + `routes` + `chromeMode` wiring together via the same `createMemoryRouter` /
   `RouterProvider` pattern the file already uses: for each of the existing `paths`, additionally
   assert `screen.queryByRole('navigation', { name: 'Primary' })` is `null` for
   `/projects`, `/projects/anything`, `/projects/anything/live`, and non-null for every other path
   in the list (`/`, `/work-experience`, `/research`, `/research/anything`, `/privacy`, `/terms`,
   `/this-does-not-exist`).

3. **`src/layout/PageShell.test.tsx`** (new file) — sticky-footer layout assertions, isolated from
   full routing: render `<PageShell/>` inside a minimal `createMemoryRouter([{ path: '/', element:
   <PageShell/>, children: [{ index: true, element: <div>content</div> }] }])` and assert (via
   `container.querySelector`) that the outer wrapper's `className` contains `flex`, `min-h-screen`,
   and `flex-col`, and that `<main>`'s `className` contains `flex-1`. A second case with a
   `handle: { chrome: 'back-only' }` child route asserts `Footer`'s text/landmark is still present
   (footer renders in every chrome mode — only `Nav` is conditional).

4. **`src/components/BackButton.test.tsx`** (new file):
   - Default (`<BackButton/>`, no `to`) renders a link with `href="/"`.
   - `<BackButton to="/projects"/>` renders `href="/projects"`.
   - `className` prop still merges into the rendered link's class list (regression guard on the
     existing behavior, unchanged by this PRD).

5. **`src/data/index.test.ts`** (extend `describe('validateNavAndFooterLinks', ...)`) — the
   regression test locking in §4.2's "verified, not changed" conclusion:

   ```ts
   it('passes a plain route entry with no hash (e.g. Home\'s "/")', () => {
     expect(() => validateNavAndFooterLinks([{ label: 'Home', href: '/' }], [])).not.toThrow();
   });
   ```

**Manual QA (not automatable, but cheap to eyeball once implemented):** load `/404` and a short
`/research/<slug>` at a tall viewport and confirm the footer sits at the true bottom of the
viewport, not mid-page: the concrete case the owner reported (§1 item 1).

## 8. Manual Intervention Required From You

None. Every item in this PRD's scope is a code change an implementer can complete unassisted —
no credentials, account access, or judgment call that only the owner can make.

## 9. Open Questions & Decisions

1. **`[RESOLVED: discriminated NAV_LINKS shape]`** — `NavLink` gains an optional `sectionId` field;
   `Nav.tsx`'s scroll-spy filters to entries carrying it. See §4.2/§4.3.
2. **`[RESOLVED: option (b), route `handle` + `useMatches()`]`** — chosen over a `PageShell`-local
   pathname predicate because it's colocated with `routes.tsx`'s own path definitions and was
   verified (not assumed) to work identically across SSG prerender, client hydration, and the
   vitest/jsdom test harness (§4.4).
3. **`[RESOLVED: BackButton stays per-page, not centralized in PageShell]`** — considered moving
   `BackButton` into `PageShell` itself (rendered once, in back-only chrome mode) so each page
   didn't need its own `<BackButton/>` line. Rejected: the three back-only routes want three
   different targets (`/`, `/projects`, `/projects/:slug`), the last of which needs a route param
   (`slug`) `PageShell` would have to read via `useParams()` — real coupling `PageShell` doesn't
   otherwise need, to save three near-trivial call sites that already exist and already have the
   context they need locally. Each page renders its own `<BackButton to="...">` instead (§4.7/§4.9).
4. **`[RESOLVED: WorkExperiencePage keeps its 720px reading width]`** — via an inner `max-w-[45rem]`
   wrapper inside a now-`max-w-content` outer `PageContainer`, not by widening the timeline itself
   (which has no `max-w` of its own and would otherwise stretch to nearly double its current width).
   See §4.9.
5. **`[RESOLVED: back-only top padding = pt-12 sm:pt-16]`** — a taste call, not load-bearing: any
   value that clears normal reading comfort works, since there's no fixed header to clear on these
   routes anymore. Flagged as easy to adjust post-implementation if the owner wants more or less air
   above the Back link once it's visible in the real app.
6. **`[RESOLVED — split by file ownership, orchestrator decision 2026-09-01]`** The BackButton target
   for the redirect-mode branch of `/projects/:slug/live` is resolved as a pair of matching edits,
   one per owning PRD: R4 owns `src/components/LiveRedirectFallback.tsx` and adds the optional
   `backTo` prop, threaded into `BackButton`'s own `to` prop (`04-component-polish/PRD.md` §4.7). R1
   owns `src/pages/ProjectLivePage.tsx` (this PRD) and supplies
   `backTo={`/projects/${project.slug}`}` at the redirect-mode call site (§4.9, code above) —
   symmetric with the hosted-mode branch's own `BackButton to={`/projects/${slug}`}`. No longer
   cross-project-blocked; each half ships in its owning PRD.
7. **`[DEFERRED — R2]`** Landing-section width parity (brief #4: "Projects section is much wider
   than the other sections") is R2's (`02-landing-sections`) job, not designed here. **R1 does
   define the canonical convention R2 should match:** `max-w-content` (72rem) as the outer bound,
   `px-6 sm:px-8 md:px-10 lg:px-12` as the horizontal padding ramp — the same values `PageContainer`
   encodes for sub-pages (§4.8). **Confirmed matching (orchestrator decision, 2026-09-01):** R2's own
   PRD (§4.1, §9) checked its landing-section width system against this exact convention — the two
   agree, no divergence found.
8. **`[DEFERRED — R5]`** `/privacy` and `/terms` top-padding collision with the navbar (brief #5) is
   the same root problem as §1 item 4, but those two files are R5's (§3 boundary), not touched here.
   **R5 should adopt `PageContainer` directly** (`chrome="full"` — both pages keep the navbar) rather
   than hand-rolling the same `pt-28 sm:pt-32` value a third time.
9. **`[RESOLVED: ProjectLivePage's hosted-branch BackButton is currently dead code]`** — noted, not
   treated as a defect: `HOSTED_LIVE_PAGES`'s only entry (`sample-project`) is deleted by R3 this
   round (SHARED-CONTEXT locked decision 4), so this branch is unreachable in the shipped state
   until a future hosted `/live` project is added. See §4.9.
