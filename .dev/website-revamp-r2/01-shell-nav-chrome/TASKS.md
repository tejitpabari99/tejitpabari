# Tasks: Shell, Nav & Chrome

Source of truth: `/root/projects/tejitpabari/.dev/website-revamp-r2/01-shell-nav-chrome/PRD.md`. Every task below cites the PRD §4 subsection it implements. This is a Phase 1 sub-project (per `../README.md`) — it runs **concurrently** with R3 (`03-content-data`), which this round deletes the `sample-project` hosted `/live` demo (registry entry, content file, page, test). No task below touches `src/content/**`, `src/config/featured.ts`, `src/pages/live/**`, or `src/pages/live/registry.ts` — the only place this sub-project and R3 share a conceptual boundary is `ProjectLivePage.tsx`'s hosted-component branch (Task 16), which is worded to make no assumption about whether `HOSTED_LIVE_PAGES` is empty or has one entry at the time it runs, and touches no file R3 owns.

**Repo state assumption:** repo is `/root/projects/tejitpabari`, already on branch `website-revamp`. Round 1 (`.dev/website-revamp/`) has shipped; this PRD revises files it created. The working tree should be clean of unrelated changes before Task 1 runs. Every source file quoted "before" below was read directly from the current tree while drafting this task list (not reconstructed from the PRD's own prose) — where the real file differs from the PRD's simplified excerpt (e.g. `src/routes.tsx` already has a `projectLiveSlugs` import and a `FRAGILITY GUARD` comment the PRD's own before-block omits, and `Footer.tsx`/`PageShell.tsx` already carry SP05's `// SP05 add` consent/analytics wiring), the task below diffs against the real file, not the PRD's excerpt.

**Test command note:** `npm test` runs `vitest run` (the full suite). A single file can be run directly, e.g. `npx vitest run src/layout/chromeMode.test.ts`.

---

### Task 1 — `RESUME_URL`
   - Files: `src/config/links.ts`
   - Changes: Per PRD §4.1. One-line value swap, nothing else in the file touched yet (Task 2 adds `NAV_LINKS`'s new shape separately).

     Before:
     ```ts
     export const RESUME_URL =
       'https://drive.google.com/file/d/1HcqZCkdxfU73PUHmFSKqJGIG7_yG3mGS/view?usp=sharing';
     ```

     After:
     ```ts
     export const RESUME_URL =
       'https://drive.google.com/file/d/1pTIyviXM0fCCkXeX6LveYXvr7QD2TD0j/view?usp=sharing';
     ```
   - Acceptance criteria:
     1. `grep -c '1pTIyviXM0fCCkXeX6LveYXvr7QD2TD0j' src/config/links.ts` → `1`.
     2. `grep -c '1HcqZCkdxfU73PUHmFSKqJGIG7_yG3mGS' src/config/links.ts` → `0` (old link fully gone).
     3. `npm run typecheck` and `npm test` both pass (this change is consumed only by `FOOTER_LINKS` in the same file and `Footer.tsx`'s `resume_click` tracking call, both keyed off the array entry, not the URL string — no other file changes, no test asserts on the URL's literal value).

---

### Task 2 — `NAV_LINKS` discriminated shape + `Home` entry
   - Files: `src/config/links.ts`, `src/data/index.test.ts`
   - Changes: Per PRD §4.2. Replace the plain `{label,href}[]` array with a `NavLink` type carrying an optional `sectionId`, and add a `Home` entry with no `sectionId` (Home is a plain route link, not a scroll-spy anchor).

     `src/config/links.ts`, before (after Task 1's `RESUME_URL` change):
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

     `FOOTER_LINKS` and its own `{ label: string; href: string }[]` type are untouched — this task only changes `NAV_LINKS`'s declaration.

     `src/data/index.ts` (SP02's build-time nav-href validator, `validateNavAndFooterLinks`) needs **no code change** — verified directly against the live function body: for `Home`'s `href: '/'`, `'/'.split('#')` is `['/']`, so `pathname` is `'/'`, already the first entry in `KNOWN_STATIC_ROUTES`. `NavLink[]` is structurally assignable to the function's `Link[]` parameter (`Link = { label: string; href: string }` from `src/data/shared.ts`) since TS excess-property checking only fires on object literals, not on a typed variable passed at a call site — no cast needed at `validateNavAndFooterLinks(NAV_LINKS, FOOTER_LINKS)`. This conclusion gets a regression test instead of a code change, so a future refactor of the validator can't silently reintroduce a Home-shaped hole without a test failing.

     `src/data/index.test.ts` — add one case to the existing `describe('validateNavAndFooterLinks', ...)` block (do not touch `describe('validateInternalLinks', ...)`):
     ```ts
     it('passes a plain route entry with no hash (e.g. Home\'s "/")', () => {
       expect(() => validateNavAndFooterLinks([{ label: 'Home', href: '/' }], [])).not.toThrow();
     });
     ```
   - Acceptance criteria:
     1. `src/config/links.ts` exports `NavLink` (an interface, not a type alias — matches the block above) and `NAV_LINKS` has exactly 5 entries.
     2. `NAV_LINKS[0]` is `{ label: 'Home', href: '/' }` with no `sectionId` key present on the object at all (not `sectionId: undefined` — the literal omits the key).
     3. The other four entries keep their original `label`/`href` values and each gains `sectionId` equal to the id `Nav.tsx`'s old `sectionIdOf` would have derived (`'projects'`, `'work-experience'`, `'about'`, `'contact'`).
     4. `npm run typecheck` passes — confirms `validateNavAndFooterLinks(NAV_LINKS, FOOTER_LINKS)` in `src/data/index.ts` still typechecks with no cast added.
     5. `npx vitest run src/data/index.test.ts` passes, including the new case.
     6. `npm test` passes in full. (`src/layout/Nav.tsx` and `src/layout/Nav.test.tsx` are **not** updated in this task — `Nav.tsx` still imports the old `NAV_LINKS` shape and its own `sectionIdOf(href)` helper, which on `Home`'s `href: '/'` computes `''` and fails the existing `Nav.test.tsx`'s four-link assertion the instant this task's array gains a fifth entry. Task 3 fixes both together in the same commit — until then this task's own scope is `links.ts`/`data/index.test.ts` only, and `npm test` passing here depends on Task 3 landing immediately after, in the same PR sequence, before anyone runs the suite standalone.)

     **Note on this task's own gate:** because `Nav.tsx`/`Nav.test.tsx` consume `NAV_LINKS` and are not touched here, `npm test` will **not** pass with only this task's diff applied in isolation — `Nav.test.tsx`'s `'renders four items...'` case will fail (5 links now render, `sectionIdOf('/')` computes `''` as a `<li key="">`). Task 2 and Task 3 must land as one combined commit for the "every task ends green" rule to hold; implement them together and commit once, titled to cover both (`NAV_LINKS` shape + `Nav.tsx`/`Nav.test.tsx` update).

---

### Task 3 — `Nav.tsx` scroll-spy over `sectionId` entries, `Home`'s active state, and the `Nav.test.tsx` fix
   - Files: `src/layout/Nav.tsx`, `src/layout/Nav.test.tsx`
   - Changes: Per PRD §4.3. **Lands together with Task 2 in one commit** (see Task 2's note) — this is the half that makes the suite green again after `NAV_LINKS` gains a fifth entry.

     `src/layout/Nav.tsx`, before (current file, in full):
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

     `src/layout/Nav.test.tsx`, before (current file, in full):
     ```tsx
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

     After — per PRD §7's named-exactly breakage, retitle the first test and update its expected array to five entries (`Home`'s `/` first); the second test needs no change (already iterates `getAllByRole('link')` generically with no hardcoded count):
     ```tsx
     import { describe, it, expect } from 'vitest';
     import { render, screen } from '@testing-library/react';
     import { MemoryRouter } from 'react-router-dom';
     import { Nav } from './Nav';

     describe('Nav', () => {
       it('renders five items with the exact NAV_LINKS hrefs', () => {
         render(<MemoryRouter><Nav /></MemoryRouter>);
         const links = screen.getAllByRole('link');
         expect(links.map((l) => l.getAttribute('href'))).toEqual([
           '/', '/#projects', '/#work-experience', '/#about', '/#contact',
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
   - Acceptance criteria:
     1. `src/layout/Nav.tsx` and `src/layout/Nav.test.tsx` match the "after" blocks above exactly.
     2. `npm run typecheck` passes.
     3. `npx vitest run src/layout/Nav.test.tsx` passes both cases.
     4. Rendering `<Nav/>` at `/` (no scroll) shows exactly one active link (`bg-teal text-white` in its class list) and it is `Home`'s (`href="/"`) — add this as a third case in `Nav.test.tsx`:
        ```tsx
        it('highlights Home (not any section) at the untouched top of "/"', () => {
          render(<MemoryRouter initialEntries={['/']}><Nav /></MemoryRouter>);
          const links = screen.getAllByRole('link');
          const active = links.filter((l) => l.className.includes('bg-teal text-white'));
          expect(active).toHaveLength(1);
          expect(active[0]).toHaveAttribute('href', '/');
        });
        ```
        (jsdom never fires a real scroll event, so `scrollSection` stays at its initial `null` for the whole test, exercising exactly the SSR/hydration-correctness window PRD §4.3 describes.)
     5. `npm test` passes in full — this is the commit that makes `NAV_LINKS`'s new shape (Task 2) and `Nav.tsx`'s consumption of it agree again.

---

### Task 4 — `src/layout/chromeMode.ts` (new)
   - Files: `src/layout/chromeMode.ts` (new)
   - Changes: Per PRD §4.4. A neutral module both `routes.tsx` and `PageShell.tsx` import independently — placed outside `routes.tsx` itself specifically to avoid a circular import (`routes.tsx` imports `PageShell` as an element; `PageShell` importing back out of `routes.tsx` would be circular).

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
   - Acceptance criteria:
     1. `src/layout/chromeMode.ts` matches the block above exactly.
     2. `npm run typecheck` passes with no errors on this file.
     3. `npm test` passes (no consumer yet — this task adds no test file of its own; Task 6 does).
     4. Not `.tsx` — no JSX in this file (`grep -c '</' src/layout/chromeMode.ts` → `0`).

---

### Task 5 — `src/routes.tsx`: `handle` on the three `/projects*` routes
   - Files: `src/routes.tsx`
   - Changes: Per PRD §4.4. Depends on Task 4. Add `handle: { chrome: 'back-only' } satisfies RouteHandle` to exactly the three `/projects*` route records; every other route (`index` `/`, `work-experience`, `research`, `research/:slug`, `privacy`, `terms`, the `*` catch-all) gets **no** `handle` field — deliberately, so `chromeModeFromHandle`'s fail-open default (`'full'`) is genuinely exercised (Task 6) rather than every route redundantly re-asserting `{chrome: 'full'}`.

     Before (current file, in full):
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
     import { projectLiveSlugs } from '@/pages/live/registry';

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
             getStaticPaths: () => projectLiveSlugs.map((slug) => `projects/${slug}/live`),
             // FRAGILITY GUARD (see /privacy, /terms — "no forms"): every hosted (i.e.
             // non-redirect) /projects/<slug>/live page must currently accept ZERO user
             // input. Both legal pages state plainly that this domain has no forms as
             // of their last-updated date. The moment a hosted /live project adds an
             // <input>, <textarea>, <form>, a file upload, or anything else a visitor
             // can type into and submit, that claim is false and BOTH
             // src/pages/PrivacyPage.tsx and src/pages/TermsPage.tsx (their "no forms" /
             // "What this site does not do" sections, plus each page's LAST_UPDATED)
             // must be revised BEFORE that project ships, not after. `npm run
             // check:no-forms` (scripts/check-no-forms.sh, SP04's PRD 04 §4.8) is the
             // mechanical check for this — run it before adding any new
             // HOSTED_LIVE_PAGES entry. See PRD 05 §4.7, PRD 04 §4.7/§4.8.
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

     After — only the three `/projects*` entries gain `handle`; add one new import; everything else (including the `FRAGILITY GUARD` comment) is byte-for-byte unchanged:
     ```tsx
     // src/routes.tsx
     import type { RouteRecord } from 'vite-react-ssg';
     import { PageShell } from '@/layout/PageShell';
     import type { RouteHandle } from '@/layout/chromeMode';
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
     import { projectLiveSlugs } from '@/pages/live/registry';

     export const routes: RouteRecord[] = [
       {
         path: '/',
         element: <PageShell />,
         children: [
           { index: true, element: <HomePage /> },
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
             // FRAGILITY GUARD (see /privacy, /terms — "no forms"): every hosted (i.e.
             // non-redirect) /projects/<slug>/live page must currently accept ZERO user
             // input. Both legal pages state plainly that this domain has no forms as
             // of their last-updated date. The moment a hosted /live project adds an
             // <input>, <textarea>, <form>, a file upload, or anything else a visitor
             // can type into and submit, that claim is false and BOTH
             // src/pages/PrivacyPage.tsx and src/pages/TermsPage.tsx (their "no forms" /
             // "What this site does not do" sections, plus each page's LAST_UPDATED)
             // must be revised BEFORE that project ships, not after. `npm run
             // check:no-forms` (scripts/check-no-forms.sh, SP04's PRD 04 §4.8) is the
             // mechanical check for this — run it before adding any new
             // HOSTED_LIVE_PAGES entry. See PRD 05 §4.7, PRD 04 §4.7/§4.8.
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
   - Acceptance criteria:
     1. `grep -c "handle: { chrome: 'back-only' } satisfies RouteHandle" src/routes.tsx` → `3`.
     2. `grep -c "import type { RouteHandle } from '@/layout/chromeMode'" src/routes.tsx` → `1`.
     3. No other route record in the file contains a `handle` key (`grep -c "handle:" src/routes.tsx` → `3`, exactly the count from criterion 1).
     4. `npm run typecheck` passes.
     5. `npm test` passes — `src/routes.smoke.test.tsx`'s existing `not.toThrow()` assertions are unaffected by an additive `handle` field.

---

### Task 6 — `src/layout/chromeMode.test.ts` (new)
   - Files: `src/layout/chromeMode.test.ts` (new)
   - Changes: Per PRD §7 item 1. Depends on Tasks 4 and 5 (this test imports the real `routes` array and needs the three `handle` fields already in place). Two `describe` blocks: the pure-predicate unit cases, and the "walk every real route" integration case the PRD requires by name.

     ```ts
     // src/layout/chromeMode.test.ts
     import { describe, it, expect } from 'vitest';
     import { chromeModeFromHandle } from './chromeMode';
     import { routes } from '@/routes';

     describe('chromeModeFromHandle', () => {
       it('returns full for undefined', () => {
         expect(chromeModeFromHandle(undefined)).toBe('full');
       });

       it('returns full for an empty object', () => {
         expect(chromeModeFromHandle({})).toBe('full');
       });

       it("returns full for { chrome: 'full' }", () => {
         expect(chromeModeFromHandle({ chrome: 'full' })).toBe('full');
       });

       it("returns back-only for { chrome: 'back-only' }", () => {
         expect(chromeModeFromHandle({ chrome: 'back-only' })).toBe('back-only');
       });

       it('fails open to full for malformed input', () => {
         expect(chromeModeFromHandle('garbage')).toBe('full');
         expect(chromeModeFromHandle(null)).toBe('full');
         expect(chromeModeFromHandle(42)).toBe('full');
       });
     });

     const BACK_ONLY_PATHS = ['projects', 'projects/:slug', 'projects/:slug/live'];

     describe('every route in src/routes.tsx resolves to the expected chrome mode', () => {
       const leafRoutes = routes[0].children ?? [];

       it('has a non-empty route tree to walk (guards against an empty walk silently passing)', () => {
         expect(leafRoutes.length).toBeGreaterThan(0);
       });

       it.each(leafRoutes.map((route) => [route.path ?? '(index)', route] as const))(
         'route "%s"',
         (path, route) => {
           const expected = BACK_ONLY_PATHS.includes(path) ? 'back-only' : 'full';
           expect(chromeModeFromHandle(route.handle)).toBe(expected);
         },
       );
     });
     ```
   - Acceptance criteria:
     1. `npx vitest run src/layout/chromeMode.test.ts` passes.
     2. The second `describe` block's `it.each` produces exactly ten cases (`routes[0].children` has ten entries: `index`, `projects`, `projects/:slug`, `projects/:slug/live`, `work-experience`, `research`, `research/:slug`, `privacy`, `terms`, `*`) — three resolve `back-only`, seven resolve `full`, including the index route and the `*` catch-all explicitly.
     3. Temporarily removing (locally, not committed) the `handle` field from any one of the three `/projects*` routes in `src/routes.tsx` makes this test fail — confirms the test actually exercises the real route table, not a hardcoded copy of it.
     4. `npm test` passes in full.

---

### Task 7 — `src/layout/PageShell.tsx`: sticky footer + chrome-mode `Nav`
   - Files: `src/layout/PageShell.tsx`
   - Changes: Per PRD §4.5. Depends on Task 4 (`chromeModeFromHandle`). Preserves every SP05 addition already in the file (`ConsentProvider`, `AnalyticsListener`, `ConsentBanner`) untouched — this task only adds the flex wrapper and swaps `Nav`'s unconditional render for a chrome-mode-gated one.

     Before (current file, in full):
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
         <ConsentProvider> {/* SP05 add: wraps everything below */}
           <ScrollManager />
           <AnalyticsListener /> {/* SP05 add */}
           <Nav />
           <main>
             <Outlet />
           </main>
           <Footer />
           <ConsentBanner /> {/* SP05 add */}
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
         <ConsentProvider> {/* SP05 add: wraps everything below */}
           <ScrollManager />
           <AnalyticsListener /> {/* SP05 add */}
           <div className="flex min-h-screen flex-col">
             {chromeMode === 'full' && <Nav />}
             <main className="flex-1">
               <Outlet />
             </main>
             <Footer />
           </div>
           <ConsentBanner /> {/* SP05 add */}
         </ConsentProvider>
       );
     }
     ```

     No accompanying `html`/`body`/`#root` CSS change needed: `index.html` has a bare `<div id="root"></div>` with no inline style, and `src/index.css` is three bare `@tailwind` directives — there is no explicit height chain from `html`/`body` today, and `min-h-screen` (`min-height: 100vh`) doesn't need one. `Nav`'s `fixed inset-x-0 top-0` header and `ConsentBanner`'s `fixed inset-x-0 bottom-0` are both out of document flow, so conditionally mounting `Nav` inside the new flex column changes nothing about the column's flex math; `ConsentBanner` stays a sibling *after* the flex wrapper, matching its original tree position.
   - Acceptance criteria:
     1. `src/layout/PageShell.tsx` matches the "after" block above exactly.
     2. `npm run typecheck` passes.
     3. `npm test` passes — `src/routes.smoke.test.tsx`'s existing cases still render without throwing.
     4. Manual sanity check (not automated here — Task 21's job): `main`'s className contains `flex-1`, the wrapping `div`'s className contains `flex min-h-screen flex-col`.

---

### Task 8 — `src/layout/Footer.tsx`: `shrink-0`
   - Files: `src/layout/Footer.tsx`
   - Changes: Per PRD §4.6. Defensive insurance against a flex item's default `flex-shrink: 1` ever compressing the footer — not strictly required by the flex math today (`main`'s `flex-1` absorbs all extra space), since `Footer` has no competing growth pressure to shrink against. Layout-only; no copy change (voice cleanup is R6's scope).

     Before: `<footer className="border-t border-teal-secondary/10 bg-cream">`

     After: `<footer className="shrink-0 border-t border-teal-secondary/10 bg-cream">`

     No other line in `Footer.tsx` changes — `FOOTER_LINKS` mapping, the `isExternalUrl`/`trackEvent` wiring, the techfolio credit line, and the copyright line are all untouched.
   - Acceptance criteria:
     1. `grep -c 'className="shrink-0 border-t border-teal-secondary/10 bg-cream"' src/layout/Footer.tsx` → `1`.
     2. `npm run typecheck` passes.
     3. `npm test` passes.

---

### Task 9 — `src/layout/PageShell.test.tsx` (new)
   - Files: `src/layout/PageShell.test.tsx` (new)
   - Changes: Per PRD §7 item 3. Depends on Task 7. Isolated from full routing — renders `<PageShell/>` inside a minimal `createMemoryRouter`, not the real `routes` array.

     ```tsx
     // src/layout/PageShell.test.tsx
     import { describe, it, expect } from 'vitest';
     import { render } from '@testing-library/react';
     import { createMemoryRouter, RouterProvider } from 'react-router-dom';
     import { PageShell } from './PageShell';
     import type { RouteHandle } from './chromeMode';

     function renderShell(handle?: RouteHandle) {
       const router = createMemoryRouter([
         {
           path: '/',
           element: <PageShell />,
           children: [{ index: true, element: <div>content</div>, handle }],
         },
       ]);
       return render(<RouterProvider router={router} />);
     }

     describe('PageShell', () => {
       it('lays out a sticky-footer flex column', () => {
         const { container } = renderShell();
         expect(container.querySelector('.flex.min-h-screen.flex-col')).not.toBeNull();
         expect(container.querySelector('main')?.className).toContain('flex-1');
       });

       it('still renders Footer when the leaf route is back-only chrome (only Nav is conditional)', () => {
         const { container } = renderShell({ chrome: 'back-only' });
         const footer = container.querySelector('footer');
         expect(footer).not.toBeNull();
         expect(footer?.textContent).toContain('Tejit Pabari');
       });
     });
     ```
   - Acceptance criteria:
     1. `src/layout/PageShell.test.tsx` matches the block above exactly.
     2. `npx vitest run src/layout/PageShell.test.tsx` passes both cases.
     3. `npm test` passes in full.

---

### Task 10 — `src/routes.smoke.test.tsx`: nav-visibility integration coverage
   - Files: `src/routes.smoke.test.tsx`
   - Changes: Per PRD §7 item 2. Depends on Task 5 (route `handle`s) and Task 7 (`PageShell`'s chrome-mode gating). Extends the existing file with a second `it.each` block over the same `paths` array, exercising the real `PageShell` + `routes` + `chromeMode` wiring together via the same `createMemoryRouter`/`RouterProvider` pattern already in use. The original `'renders %s without throwing'` block is left untouched.

     Before (current file, in full):
     ```tsx
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

     After:
     ```tsx
     import { describe, it, expect } from 'vitest';
     import { render, screen } from '@testing-library/react';
     import { createMemoryRouter, RouterProvider } from 'react-router-dom';
     import { routes } from './routes';

     const paths = [
       '/', '/projects', '/projects/anything', '/projects/anything/live',
       '/work-experience', '/research', '/research/anything', '/privacy', '/terms',
       '/this-does-not-exist',
     ];

     const BACK_ONLY_PATHS = ['/projects', '/projects/anything', '/projects/anything/live'];

     describe('route tree smoke test', () => {
       it.each(paths)('renders %s without throwing', (path) => {
         const router = createMemoryRouter(routes, { initialEntries: [path] });
         expect(() => render(<RouterProvider router={router} />)).not.toThrow();
       });

       it.each(paths)('shows the navbar on %s only when chrome mode is full', (path) => {
         const router = createMemoryRouter(routes, { initialEntries: [path] });
         render(<RouterProvider router={router} />);
         const nav = screen.queryByRole('navigation', { name: 'Primary' });
         if (BACK_ONLY_PATHS.includes(path)) {
           expect(nav).toBeNull();
         } else {
           expect(nav).not.toBeNull();
         }
       });
     });
     ```
   - Acceptance criteria:
     1. `src/routes.smoke.test.tsx` matches the "after" block above exactly.
     2. `npx vitest run src/routes.smoke.test.tsx` passes all 20 cases (10 `not.toThrow` + 10 nav-visibility).
     3. `screen.queryByRole('navigation', { name: 'Primary' })` is `null` for `/projects`, `/projects/anything`, `/projects/anything/live`, and non-null for `/`, `/work-experience`, `/research`, `/research/anything`, `/privacy`, `/terms`, `/this-does-not-exist`.
     4. `npm test` passes in full.

---

### Task 11 — `src/components/BackButton.tsx`: accepts `to`, default `/`
   - Files: `src/components/BackButton.tsx`
   - Changes: Per PRD §4.7.

     Before (current file, in full):
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
   - Acceptance criteria:
     1. `src/components/BackButton.tsx` matches the "after" block above exactly.
     2. `npm run typecheck` passes.
     3. `npm test` passes — every existing `<BackButton />` call site (no `to` prop) keeps its current behavior, since the new prop defaults to `'/'`.
     4. `grep -rn "navigate(-1)" src/components/BackButton.tsx` → no match (confirms the rejected `navigate(-1)` approach was not used).

---

### Task 12 — `src/components/BackButton.test.tsx` (new)
   - Files: `src/components/BackButton.test.tsx` (new)
   - Changes: Per PRD §7 item 4. Depends on Task 11.

     ```tsx
     // src/components/BackButton.test.tsx
     import { describe, it, expect } from 'vitest';
     import { render, screen } from '@testing-library/react';
     import { MemoryRouter } from 'react-router-dom';
     import { BackButton } from './BackButton';

     describe('BackButton', () => {
       it('defaults to "/" when no to prop is given', () => {
         render(<MemoryRouter><BackButton /></MemoryRouter>);
         expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/');
       });

       it('renders the given to target', () => {
         render(<MemoryRouter><BackButton to="/projects" /></MemoryRouter>);
         expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/projects');
       });

       it('merges the className prop into the rendered link (regression guard, unchanged by this PRD)', () => {
         render(<MemoryRouter><BackButton className="extra-class" /></MemoryRouter>);
         expect(screen.getByRole('link', { name: /back/i }).className).toContain('extra-class');
       });
     });
     ```
   - Acceptance criteria:
     1. `src/components/BackButton.test.tsx` matches the block above exactly.
     2. `npx vitest run src/components/BackButton.test.tsx` passes all three cases.
     3. `npm test` passes in full.

---

### Task 13 — `src/layout/PageContainer.tsx` (new)
   - Files: `src/layout/PageContainer.tsx` (new)
   - Changes: Per PRD §4.8. Depends on Task 4 (`ChromeMode` type). The one shared width/padding convention Tasks 14–20 adopt.

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
     // WorkExperiencePage, Task 19.
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
   - Acceptance criteria:
     1. `src/layout/PageContainer.tsx` matches the block above exactly.
     2. `npm run typecheck` passes.
     3. `npm test` passes (no consumer yet — Tasks 14–20 wire it in).
     4. `<PageContainer chrome="full">x</PageContainer>` renders a `<div>` whose className contains `pt-28 sm:pt-32`; `<PageContainer chrome="back-only" as="article">x</PageContainer>` renders an `<article>` whose className contains `pt-12 sm:pt-16` — verify with a quick standalone render (folded into Task 14/15's own page-level tests rather than a dedicated `PageContainer.test.tsx`, since the PRD's §7 test list does not name one).

---

### Task 14 — `src/pages/ProjectsPage.tsx`: adopt `PageContainer`
   - Files: `src/pages/ProjectsPage.tsx`
   - Changes: Per PRD §4.9. Depends on Task 13. Chrome `back-only` (already declared on the route in Task 5). `BackButton` stays default (`to="/"`) — `/projects` is a top-level listing; home is its correct Back target. Only the outer container line and its import change; every other line (RouteMeta, SearchFilter, EmptyState, ProjectCard mapping, `trackEvent` calls) is untouched.

     Before (relevant lines):
     ```tsx
     import { BackButton } from '@/components/BackButton';
     import { SearchFilter } from '@/components/SearchFilter';
     import { EmptyState } from '@/components/EmptyState';
     import { ProjectCard } from '@/components/ProjectCard'; // SP03, verbatim — no fork
     import { RouteMeta } from '@/components/RouteMeta'; // SP06
     import { useCollectionFilter } from '@/hooks/useCollectionFilter';
     import { projects } from '@/data';
     import { trackEvent } from '@/lib/analytics';

     export function ProjectsPage() {
       const { query, setQuery, activeTag, setActiveTag, results, allTags } =
         useCollectionFilter({ items: projects, collection: 'projects' });

       return (
         <div className="mx-auto w-full max-w-content px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12">
           <RouteMeta
             title="Projects"
             description="Health-tech and developer-tools projects, from Juno to a decade of shipped side projects."
             path="/projects"
           />
           <BackButton />
           {/* ...h1, SearchFilter, results grid, all unchanged... */}
         </div>
       );
     }
     ```

     After:
     ```tsx
     import { BackButton } from '@/components/BackButton';
     import { SearchFilter } from '@/components/SearchFilter';
     import { EmptyState } from '@/components/EmptyState';
     import { ProjectCard } from '@/components/ProjectCard'; // SP03, verbatim — no fork
     import { RouteMeta } from '@/components/RouteMeta'; // SP06
     import { PageContainer } from '@/layout/PageContainer';
     import { useCollectionFilter } from '@/hooks/useCollectionFilter';
     import { projects } from '@/data';
     import { trackEvent } from '@/lib/analytics';

     export function ProjectsPage() {
       const { query, setQuery, activeTag, setActiveTag, results, allTags } =
         useCollectionFilter({ items: projects, collection: 'projects' });

       return (
         <PageContainer chrome="back-only">
           <RouteMeta
             title="Projects"
             description="Health-tech and developer-tools projects, from Juno to a decade of shipped side projects."
             path="/projects"
           />
           <BackButton />
           {/* ...h1, SearchFilter, results grid, all unchanged... */}
         </PageContainer>
       );
     }
     ```
   - Acceptance criteria:
     1. `grep -c '<PageContainer chrome="back-only">' src/pages/ProjectsPage.tsx` → `1`; `grep -c 'mx-auto w-full max-w-content px-6 pb-20 pt-28' src/pages/ProjectsPage.tsx` → `0` (old inline classes fully gone).
     2. `grep -c '<BackButton to=' src/pages/ProjectsPage.tsx` → `0` (stays default).
     3. `npm run typecheck` passes.
     4. `npx vitest run src/pages/ProjectsPage.test.tsx` passes unmodified (PRD §7: this file makes no assertion on container class or `BackButton`'s `to` value).
     5. `npm test` passes in full.

---

### Task 15 — `src/pages/ProjectDetailPage.tsx`: adopt `PageContainer`, `BackButton to="/projects"`
   - Files: `src/pages/ProjectDetailPage.tsx`
   - Changes: Per PRD §4.9. Depends on Task 13. Chrome `back-only`. `BackButton` now points at the actual parent (`/projects`), not home.

     Before (relevant lines):
     ```tsx
     import { useParams } from 'react-router-dom';
     import { BackButton } from '@/components/BackButton';
     import { DetailHeader } from '@/components/DetailHeader';
     import { LinksRow } from '@/components/LinksRow';
     import { ContentBody } from '@/data/ContentBody'; // SP02
     import { RouteMeta } from '@/components/RouteMeta'; // SP06
     import { projects } from '@/data';
     import { NotFoundPage } from './NotFoundPage';
     import { hasLiveRoute } from './live/registry';

     export function ProjectDetailPage() {
       const { slug } = useParams<{ slug: string }>();
       const project = projects.find((p) => p.slug === slug);

       if (!project) return <NotFoundPage />;

       return (
         <article className="mx-auto w-full max-w-content px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12">
           <RouteMeta ... />
           <BackButton />
           <DetailHeader ... />
           <p className="mt-4 max-w-[52rem] text-[0.98rem] leading-7 text-body">{project.description}</p>
           <LinksRow ... />
           <ContentBody body={project.body} />
         </article>
       );
     }
     ```

     After:
     ```tsx
     import { useParams } from 'react-router-dom';
     import { BackButton } from '@/components/BackButton';
     import { DetailHeader } from '@/components/DetailHeader';
     import { LinksRow } from '@/components/LinksRow';
     import { ContentBody } from '@/data/ContentBody'; // SP02
     import { RouteMeta } from '@/components/RouteMeta'; // SP06
     import { PageContainer } from '@/layout/PageContainer';
     import { projects } from '@/data';
     import { NotFoundPage } from './NotFoundPage';
     import { hasLiveRoute } from './live/registry';

     export function ProjectDetailPage() {
       const { slug } = useParams<{ slug: string }>();
       const project = projects.find((p) => p.slug === slug);

       if (!project) return <NotFoundPage />;

       return (
         <PageContainer as="article" chrome="back-only">
           <RouteMeta ... />
           <BackButton to="/projects" />
           <DetailHeader ... />
           <p className="mt-4 max-w-[52rem] text-[0.98rem] leading-7 text-body">{project.description}</p>
           <LinksRow ... />
           <ContentBody body={project.body} />
         </PageContainer>
       );
     }
     ```
   - Acceptance criteria:
     1. `grep -c '<PageContainer as="article" chrome="back-only">' src/pages/ProjectDetailPage.tsx` → `1`.
     2. `grep -c '<BackButton to="/projects" />' src/pages/ProjectDetailPage.tsx` → `1`.
     3. `npm run typecheck` passes.
     4. `npx vitest run src/pages/ProjectDetailPage.test.tsx` passes unmodified.
     5. `npm test` passes in full.

---

### Task 16 — `src/pages/ProjectLivePage.tsx`: `BackButton` on the hosted-component branch
   - Files: `src/pages/ProjectLivePage.tsx`
   - Changes: Per PRD §4.9 and §9 item 6. Chrome `back-only` was already declared on this route by Task 5's `handle`. This task touches **only** `ProjectLivePage.tsx`, adding a `BackButton` above `<HostedComponent/>` in the hosted-mode branch — it does not touch `src/pages/live/registry.ts`, `HOSTED_LIVE_PAGES`, or any `src/content/**`/`src/pages/live/**` file, so it makes no assumption about how many entries `HOSTED_LIVE_PAGES` has and does not conflict with R3's `sample-project` deletion (which lands independently, concurrently, in a different sub-project's task sequence, and empties that registry to `{}`). Whether this branch is reachable in the shipped app depends only on `HOSTED_LIVE_PAGES`'s contents at any given moment, not on this file.

     Before (current file, in full):
     ```tsx
     // src/pages/ProjectLivePage.tsx
     import { useParams } from 'react-router-dom';
     import { projects } from '@/data';
     import { LiveRedirectFallback } from '@/components/LiveRedirectFallback';
     import { RouteMeta } from '@/components/RouteMeta'; // SP06
     import { HOSTED_LIVE_PAGES } from './live/registry';
     import { NotFoundPage } from './NotFoundPage';

     export function ProjectLivePage() {
       const { slug } = useParams<{ slug: string }>();
       const project = slug ? projects.find((p) => p.slug === slug) : undefined;
       const HostedComponent = slug ? HOSTED_LIVE_PAGES[slug] : undefined;

       if (HostedComponent && project) {
         return (
           <>
             <RouteMeta
               title={project.title}
               description={project.description}
               path={`/projects/${project.slug}/live`}
               image={`/og/projects/${project.slug}.png`}
             />
             <HostedComponent />
           </>
         );
       }
       if (project?.liveUrl) return <LiveRedirectFallback to={project.liveUrl} label={project.title} />;

       return <NotFoundPage />;
     }
     ```

     After:
     ```tsx
     // src/pages/ProjectLivePage.tsx
     import { useParams } from 'react-router-dom';
     import { projects } from '@/data';
     import { BackButton } from '@/components/BackButton';
     import { LiveRedirectFallback } from '@/components/LiveRedirectFallback';
     import { RouteMeta } from '@/components/RouteMeta'; // SP06
     import { HOSTED_LIVE_PAGES } from './live/registry';
     import { NotFoundPage } from './NotFoundPage';

     export function ProjectLivePage() {
       const { slug } = useParams<{ slug: string }>();
       const project = slug ? projects.find((p) => p.slug === slug) : undefined;
       const HostedComponent = slug ? HOSTED_LIVE_PAGES[slug] : undefined;

       if (HostedComponent && project) {
         return (
           <>
             <RouteMeta
               title={project.title}
               description={project.description}
               path={`/projects/${project.slug}/live`}
               image={`/og/projects/${project.slug}.png`}
             />
             <div className="mx-auto w-full max-w-content px-6 pt-8 sm:px-8 md:px-10 lg:px-12">
               <BackButton to={`/projects/${project.slug}`} />
             </div>
             <HostedComponent />
           </>
         );
       }
       if (project?.liveUrl) return <LiveRedirectFallback to={project.liveUrl} label={project.title} />;

       return <NotFoundPage />;
     }
     ```

     **Deliberately not done in this task — the redirect-mode line is left exactly as it is.** PRD §4.9/§9 item 6 also specifies a second edit here: `<LiveRedirectFallback to={project.liveUrl} label={project.title} backTo={`/projects/${project.slug}`} />`, passing a new `backTo` prop that PRD `04-component-polish/PRD.md` §4.7 has R4 add to `LiveRedirectFallback`'s own prop interface. **This repo's `LiveRedirectFallback.tsx` does not have a `backTo` prop yet** — confirmed by reading the file directly (`src/components/LiveRedirectFallback.tsx`'s `LiveRedirectFallbackProps` today is `{ to: string; label: string }` only). R1 (this sub-project) lands in Phase 1; R4 lands in Phase 2, after R1. Adding `backTo={...}` at this call site now — before R4's prop exists — would fail `npm run typecheck` (JSX prop-checking rejects an unrecognized prop the same way an object-literal excess-property check would), which breaks this task's own "ends green" requirement. This half of the PRD's decision is therefore **not implemented by any task in this file** — see this task list's closing report for the recommended resolution (a one-line follow-up task, most naturally sequenced into R4's own task list once `LiveRedirectFallback.tsx`'s `backTo` prop exists there).
   - Acceptance criteria:
     1. `grep -c '<BackButton to={\`/projects/\${project.slug}\`} />' src/pages/ProjectLivePage.tsx` → `1`, inside the `HostedComponent && project` branch only.
     2. `grep -c 'liveUrl} label={project.title} />' src/pages/ProjectLivePage.tsx` → `1` — the redirect-mode line is unchanged (no `backTo`).
     3. `npm run typecheck` passes.
     4. `npx vitest run src/pages/ProjectLivePage.test.tsx` passes unmodified — the hosted-mode test (`slug: 'sample-project'`) still finds `getByTestId('hosted-sample-project')`; the new `BackButton` div doesn't interfere with that query.
     5. `npm test` passes in full.

---

### Task 17 — `src/pages/ResearchPage.tsx`: adopt `PageContainer` (no behavior change)
   - Files: `src/pages/ResearchPage.tsx`
   - Changes: Per PRD §4.9. Depends on Task 13. Chrome stays `full` — `/research` is not in the back-only list. This page already used exactly the `full`-chrome padding values `PageContainer` encodes, so this is a pure mechanical swap with no visual change. `BackButton` stays untouched (`to="/"` default) — Research is not in `NAV_LINKS` (only `FOOTER_LINKS`), so its own Back-to-home affordance stays meaningful with Nav visible.

     Before (relevant lines):
     ```tsx
     import { BackButton } from '@/components/BackButton';
     import { SearchFilter } from '@/components/SearchFilter';
     import { EmptyState } from '@/components/EmptyState';
     import { ProjectCard } from '@/components/ProjectCard'; // same shared component, no fork
     import { RouteMeta } from '@/components/RouteMeta'; // SP06
     import { useCollectionFilter } from '@/hooks/useCollectionFilter';
     import { research } from '@/data';
     import { trackEvent } from '@/lib/analytics';

     export function ResearchPage() {
       const { query, setQuery, activeTag, setActiveTag, results, allTags } =
         useCollectionFilter({ items: research, collection: 'research' });

       return (
         <div className="mx-auto w-full max-w-content px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12">
           <RouteMeta ... />
           <BackButton />
           {/* ...h1, SearchFilter, results grid, all unchanged... */}
         </div>
       );
     }
     ```

     After:
     ```tsx
     import { BackButton } from '@/components/BackButton';
     import { SearchFilter } from '@/components/SearchFilter';
     import { EmptyState } from '@/components/EmptyState';
     import { ProjectCard } from '@/components/ProjectCard'; // same shared component, no fork
     import { RouteMeta } from '@/components/RouteMeta'; // SP06
     import { PageContainer } from '@/layout/PageContainer';
     import { useCollectionFilter } from '@/hooks/useCollectionFilter';
     import { research } from '@/data';
     import { trackEvent } from '@/lib/analytics';

     export function ResearchPage() {
       const { query, setQuery, activeTag, setActiveTag, results, allTags } =
         useCollectionFilter({ items: research, collection: 'research' });

       return (
         <PageContainer chrome="full">
           <RouteMeta ... />
           <BackButton />
           {/* ...h1, SearchFilter, results grid, all unchanged... */}
         </PageContainer>
       );
     }
     ```
   - Acceptance criteria:
     1. `grep -c '<PageContainer chrome="full">' src/pages/ResearchPage.tsx` → `1`.
     2. `grep -c '<BackButton to=' src/pages/ResearchPage.tsx` → `0` (stays default).
     3. `npm run typecheck` passes.
     4. `npx vitest run src/pages/ResearchPage.test.tsx` (if present) passes unmodified.
     5. `npm test` passes in full.

---

### Task 18 — `src/pages/ResearchDetailPage.tsx`: adopt `PageContainer` (no behavior change)
   - Files: `src/pages/ResearchDetailPage.tsx`
   - Changes: Per PRD §4.9. Depends on Task 13. Chrome `full`, same no-behavior-change conversion as Task 17.

     Before (relevant lines):
     ```tsx
     import { useParams } from 'react-router-dom';
     import { BackButton } from '@/components/BackButton';
     import { DetailHeader } from '@/components/DetailHeader';
     import { LinksRow } from '@/components/LinksRow';
     import { ContentBody } from '@/data/ContentBody';
     import { RouteMeta } from '@/components/RouteMeta';
     import { research } from '@/data';
     import { NotFoundPage } from './NotFoundPage';

     export function ResearchDetailPage() {
       const { slug } = useParams<{ slug: string }>();
       const item = research.find((r) => r.slug === slug);
       if (!item) return <NotFoundPage />;

       return (
         <article className="mx-auto w-full max-w-content px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12">
           <RouteMeta ... />
           <BackButton />
           <DetailHeader ... />
           <p className="mt-4 max-w-[52rem] text-[0.98rem] leading-7 text-body">{item.description}</p>
           <LinksRow links={item.links} />
           <ContentBody body={item.body} />
         </article>
       );
     }
     ```

     After:
     ```tsx
     import { useParams } from 'react-router-dom';
     import { BackButton } from '@/components/BackButton';
     import { DetailHeader } from '@/components/DetailHeader';
     import { LinksRow } from '@/components/LinksRow';
     import { ContentBody } from '@/data/ContentBody';
     import { RouteMeta } from '@/components/RouteMeta';
     import { PageContainer } from '@/layout/PageContainer';
     import { research } from '@/data';
     import { NotFoundPage } from './NotFoundPage';

     export function ResearchDetailPage() {
       const { slug } = useParams<{ slug: string }>();
       const item = research.find((r) => r.slug === slug);
       if (!item) return <NotFoundPage />;

       return (
         <PageContainer as="article" chrome="full">
           <RouteMeta ... />
           <BackButton />
           <DetailHeader ... />
           <p className="mt-4 max-w-[52rem] text-[0.98rem] leading-7 text-body">{item.description}</p>
           <LinksRow links={item.links} />
           <ContentBody body={item.body} />
         </PageContainer>
       );
     }
     ```
   - Acceptance criteria:
     1. `grep -c '<PageContainer as="article" chrome="full">' src/pages/ResearchDetailPage.tsx` → `1`.
     2. `grep -c '<BackButton to=' src/pages/ResearchDetailPage.tsx` → `0` (stays default).
     3. `npm run typecheck` passes.
     4. `npm test` passes in full.

---

### Task 19 — `src/pages/WorkExperiencePage.tsx`: adopt `PageContainer` + inner `max-w-[45rem]` reading-width wrapper
   - Files: `src/pages/WorkExperiencePage.tsx`
   - Changes: Per PRD §4.9 and §9 item 4. Depends on Task 13. This is the one real normalization, not a mechanical swap: the outer container widens from `max-w-[720px]` to `max-w-content` (72rem ≈ 1152px) for consistency with every other sub-page, but `Timeline` (`src/components/timeline/Timeline.tsx`, confirmed to set no `max-w-*` of its own) would otherwise stretch to nearly double its current row width if nothing else changed — a real regression. The fix nests a `max-w-[45rem]` (= 720px, the exact width being preserved) wrapper around the heading/Timeline block, matching the same "wide outer bound, readable-measure inner block" pattern the two detail pages already use for their description `<p>`. `BackButton` sits outside the inner wrapper, immediately after `RouteMeta`, matching every other page's DOM order. This also picks up `lg:px-12`, which the old class string was missing entirely.

     Before (current file, in full):
     ```tsx
     import { BackButton } from '@/components/BackButton';
     import { Timeline } from '@/components/timeline/Timeline';
     import { RouteMeta } from '@/components/RouteMeta'; // SP06
     import { workExperience } from '@/data';

     export function WorkExperiencePage() {
       return (
         <div className="mx-auto w-full max-w-[720px] px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10">
           <RouteMeta
             title="Work Experience"
             description="Where I've worked and what I've built along the way."
             path="/work-experience"
           />
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
     import { BackButton } from '@/components/BackButton';
     import { Timeline } from '@/components/timeline/Timeline';
     import { RouteMeta } from '@/components/RouteMeta'; // SP06
     import { PageContainer } from '@/layout/PageContainer';
     import { workExperience } from '@/data';

     export function WorkExperiencePage() {
       return (
         <PageContainer chrome="full">
           <RouteMeta
             title="Work Experience"
             description="Where I've worked and what I've built along the way."
             path="/work-experience"
           />
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
   - Acceptance criteria:
     1. `src/pages/WorkExperiencePage.tsx` matches the "after" block above exactly.
     2. `grep -c 'max-w-\[720px\]' src/pages/WorkExperiencePage.tsx` → `0` (old hardcoded cap gone from the outer container).
     3. `grep -c 'max-w-\[45rem\]' src/pages/WorkExperiencePage.tsx` → `1` (new inner reading-width wrapper).
     4. `grep -c 'lg:px-12' src/pages/WorkExperiencePage.tsx` → `1` (picked up via `PageContainer`, previously absent).
     5. `npm run typecheck` passes.
     6. `npm test` passes in full.

---

### Task 20 — `src/pages/NotFoundPage.tsx`: adopt `PageContainer`
   - Files: `src/pages/NotFoundPage.tsx`
   - Changes: Per PRD §4.9. Depends on Task 13. Chrome `full`. This is the page cited directly in the owner's report (PRD §1 item 1) as an example of the floating-footer bug — the real fix for that is `PageShell`'s sticky footer (Task 7), not this page's own padding; this task only normalizes the container to the shared convention (a minor tightening of the bottom gap: old `py-32` was 128px top/bottom, `PageContainer`'s `pt-28 sm:pt-32`/`pb-20` is 112–128px top, 80px bottom).

     Before (current file, in full):
     ```tsx
     import { useLocation } from 'react-router-dom';
     import { BackButton } from '@/components/BackButton';
     import { RouteMeta } from '@/components/RouteMeta'; // SP06

     export function NotFoundPage() {
       const location = useLocation();

       return (
         <div className="mx-auto flex w-full max-w-content flex-col items-center gap-4 px-6 py-32 text-center">
           <RouteMeta
             title="Page Not Found"
             description="That page doesn't exist — head back to the homepage."
             path={location.pathname}
           />
           <h1 className="text-2xl font-bold text-ink">Page not found</h1>
           <p className="text-body">The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.</p>
           <BackButton />
         </div>
       );
     }
     ```

     After:
     ```tsx
     import { useLocation } from 'react-router-dom';
     import { BackButton } from '@/components/BackButton';
     import { RouteMeta } from '@/components/RouteMeta'; // SP06
     import { PageContainer } from '@/layout/PageContainer';

     export function NotFoundPage() {
       const location = useLocation();

       return (
         <PageContainer chrome="full" className="flex flex-col items-center gap-4 text-center">
           <RouteMeta
             title="Page Not Found"
             description="That page doesn't exist — head back to the homepage."
             path={location.pathname}
           />
           <h1 className="text-2xl font-bold text-ink">Page not found</h1>
           <p className="text-body">The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.</p>
           <BackButton />
         </PageContainer>
       );
     }
     ```

     (The rest of the file — the `useLocation`/`RouteMeta` comment block explaining why `location.pathname` stands in for a fixed canonical path, and the `KNOWN LIMITATION` note about `RouteMeta` having no `noindex` mechanism — is untouched; only the outer wrapper and its import change.)
   - Acceptance criteria:
     1. `grep -c '<PageContainer chrome="full" className="flex flex-col items-center gap-4 text-center">' src/pages/NotFoundPage.tsx` → `1`.
     2. `grep -c 'py-32' src/pages/NotFoundPage.tsx` → `0`.
     3. `npm run typecheck` passes.
     4. `npm test` passes in full.

---

### Task 21 — Full verification gate
   - Files: none new — this task runs and inspects the output of everything Tasks 1–20 built.
   - Changes: none — verification only.
   - Acceptance criteria, run in order:
     1. `npm run typecheck` exits 0.
     2. `npm run lint` exits 0.
     3. `npm test` exits 0 — every case from Tasks 1–20 passes, including: `chromeMode.test.ts`'s 5 pure-predicate cases + 10 per-route cases; `routes.smoke.test.tsx`'s 10 `not.toThrow` + 10 nav-visibility cases; `PageShell.test.tsx`'s 2 cases; `BackButton.test.tsx`'s 3 cases; `Nav.test.tsx`'s 3 cases (including the new Home-highlight case from Task 3); `data/index.test.ts`'s new Home-href regression case; every existing page/component test file confirmed unmodified in Tasks 14–20.
     4. `npm run build` exits 0 — confirms `useMatches()`/`handle` actually resolve correctly through `vite-react-ssg`'s SSG prerender path (PRD §4.4's "verified, not assumed" claim), not just under the vitest/jsdom harness.
     5. `grep -c 'handle' dist/index.html` — informational only (no fixed expected count); the real proof prerendering didn't silently drop chrome mode is criterion 4 succeeding at all plus the manual QA in criterion 6.
     6. **Manual QA (not automatable):** run `npm run preview`, then in a real browser:
        - Load `/404` and a short `/research/<slug>` at a tall viewport; confirm the footer sits at the true bottom of the viewport, not floating mid-page — the exact case the owner reported (PRD §1 item 1).
        - Load `/projects`, `/projects/<a-real-slug>`, `/projects/<a-real-slug>/live` and confirm the navbar pill is absent and Back is present on all three, with Back on the detail page returning to `/projects` (not `/`).
        - Load `/`, scroll to each section, and confirm `Home` is highlighted at the top and hands off to each section correctly as you scroll (Task 3's new active-state branch).
        - Load `/work-experience` and visually confirm the timeline's reading width looks the same as before this PRD (Task 19's `max-w-[45rem]` preservation).
        Kill the preview server after confirming.

---

## Summary of what requires you (not a dev agent)

1. **Nothing in this sub-project is owner-blocked for implementation.** PRD §8 states this explicitly ("no credentials, account access, or judgment call that only the owner can make"), and nothing in Tasks 1–21 above needed a judgment call beyond what the PRD's own §9 already resolved.
2. **The `LiveRedirectFallback`/`backTo` half of PRD §4.9/§9 item 6 is not implemented by any task above** (see Task 16's note) — it requires R4's `LiveRedirectFallback.tsx` change to land first, or a follow-up one-line task once it has. This isn't an owner decision to make; it's a sequencing note for whoever runs R4's tasks or a later cross-project cleanup pass. Flagged here so it isn't silently dropped.
3. **The back-only top padding value (`pt-12 sm:pt-16`, Task 13)** is called a "taste call, not load-bearing" in PRD §9 item 5 — worth a quick look once `/projects` is visible in the real app, per the PRD's own suggestion, but not blocking any task above.
