# Tasks: Projects & Research Pages (SP04)

Source of truth: `/root/projects/tejitpabari/.dev/website-revamp/04-projects-research-pages/PRD.md`. Every task below cites the PRD §4 subsection it implements. This sub-project builds the `/projects`/`/research` listing pages, both detail templates, the `/projects/<slug>/live` dual-mode route, the hosted-mini-project registry, and the "no forms" mechanical check — **not** `ProjectCard` itself, the frontmatter/content pipeline, `trackEvent`'s implementation, or `RouteMeta`/OG generation (SP03/SP02/SP05/SP06's scope respectively, all consumed as-is).

**Toolchain assumption, confirmed from SP01's `package.json` (§4.2 there), not re-derived here:** `fuse.js@^7.5.0` and `gray-matter@^4.0.3` are already installed. `react-router-dom@^6.14.1`, `vitest`, and `@testing-library/react` are already installed and configured (`npm test` → `vitest run`). No task below installs a dependency.

**Cross-sub-project sequencing this task list assumes but does not build:**
- SP01 lands `useDebouncedValue` (`src/hooks/useDebouncedValue.ts`), `TagPill`, `BackButton`, the icon set (`src/components/icons/ExternalLinkIcon.tsx`, `ArrowIcon.tsx`), `NotFoundPage`, and the placeholder `routes.tsx`/`vite.config.ts`/`firebase.json` this PRD edits directly.
- SP02 lands `projects`, `research`, `Project`/`Research`/`Link` types, `ContentBody`, and `liveMode()`, all importable from `@/data` (confirmed against SP02's own `TASKS.md`: `src/data/projects.ts`, `src/data/research.ts`, `src/data/ContentBody.tsx`, re-exported through `src/data/index.ts`).
- SP03 lands `ProjectCard` with the prop shape this PRD's snippets already assume (`href, image, imageAlt, title, description, tags, status?, externalHref?, externalLabel?, onCardClick, onExternalClick?`). **SP03's PRD is being concurrently edited as this task list is written — its final prop names/behavior are not re-verified here.** If `ProjectCard`'s actual shipped signature differs from what Tasks 4/5 below assume, treat that as a blocking discrepancy to resolve against SP03's landed code, not something to silently paper over.
- SP05 lands `trackEvent` (`@/lib/analytics`) with an `AnalyticsEventName` union that includes `'search_query'`, `'project_card_click'`, and `'outbound_click'` with a `context` value of `'content_external_link' | 'live_redirect' | ...`. **SP05's PRD (`05-legal-analytics/PRD.md`) is also being concurrently edited.** The `'content_external_link'` rename (from `'project_external_link'`) is this PRD's own resolved decision (§4.4/§9) that SP05's catalogue is stated to adopt in the same pass — confirm SP05 actually ships that literal before Tasks 4, 5, 7, 11 compile, since a stale `'project_external_link'` union would fail `tsc --noEmit` on every one of those call sites.
- SP06 lands `RouteMeta` (`@/components/RouteMeta`, signature `{ title, description, path, image? }` — confirmed binding per this PRD's §9) and, later, `src/pages/live/sample-project.tsx` plus one line in `HOSTED_LIVE_PAGES` (Task 8 below ships that registry empty).

---

### Task 1 — `useCollectionFilter` shared hook
   - Status: Complete
   - Files: `src/hooks/useCollectionFilter.ts` (new)
   - Changes: Implement exactly per PRD §4.2 — the one place Fuse.js, tag filtering, URL state, and the debounced `search_query` analytics call all live.

```ts
// src/hooks/useCollectionFilter.ts
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Fuse, { type IFuseOptions } from 'fuse.js';
import { useDebouncedValue } from '@/hooks/useDebouncedValue'; // SP01
import { trackEvent } from '@/lib/analytics'; // SP05

interface Searchable {
  title: string;
  description: string;
  tags: string[];
  body: string;
}

const FUSE_OPTIONS: IFuseOptions<Searchable> = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'description', weight: 0.3 },
    { name: 'tags', weight: 0.2 },
    { name: 'body', weight: 0.1 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

interface UseCollectionFilterArgs<T extends Searchable & { slug: string }> {
  items: T[];
  collection: 'projects' | 'research';
}

interface UseCollectionFilterResult<T> {
  query: string;
  setQuery: (q: string) => void;
  activeTag: string | null;
  setActiveTag: (t: string | null) => void;
  results: T[];
  allTags: string[];
}

export function useCollectionFilter<T extends Searchable & { slug: string }>({
  items,
  collection,
}: UseCollectionFilterArgs<T>): UseCollectionFilterResult<T> {
  const [searchParams, setSearchParams] = useSearchParams();

  // Hydration-safe defaults — see PRD §4.2's "why not read searchParams
  // synchronously" note. Real ?q=/?tag= values are adopted post-mount only.
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    const tag = searchParams.get('tag');
    if (q) setQuery(q);
    if (tag) setActiveTag(tag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debouncedQuery = useDebouncedValue(query, 200); // fast, UI-facing debounce

  const allTags = useMemo(() => Array.from(new Set(items.flatMap((i) => i.tags))).sort(), [items]);

  const tagFiltered = useMemo(
    () => (activeTag ? items.filter((i) => i.tags.includes(activeTag)) : items),
    [items, activeTag],
  );

  const fuse = useMemo(() => new Fuse(tagFiltered, FUSE_OPTIONS), [tagFiltered]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return tagFiltered;
    return fuse.search(debouncedQuery).map((r) => r.item);
  }, [debouncedQuery, fuse, tagFiltered]);

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedQuery.trim()) next.set('q', debouncedQuery);
        else next.delete('q');
        if (activeTag) next.set('tag', activeTag);
        else next.delete('tag');
        return next;
      },
      { replace: true },
    );
  }, [debouncedQuery, activeTag, setSearchParams]);

  // search_query — a SECOND, INDEPENDENT 600ms timer, deliberately separate
  // from the 200ms useDebouncedValue instance above. That 200ms debounce is
  // for UI responsiveness (how fast the grid narrows); this 600ms timer is
  // for analytics (don't count a query as "typed" until the visitor pauses
  // meaningfully). Fires on the RAW `query`, not `debouncedQuery`. This is
  // why it does NOT fire per keystroke: every keystroke resets this timer,
  // and only the last one before a 600ms pause actually calls trackEvent.
  useEffect(() => {
    if (!query.trim()) return;
    const handle = setTimeout(() => {
      trackEvent('search_query', { collection, query: query.trim(), result_count: results.length });
    }, 600);
    return () => clearTimeout(handle);
  }, [query, results.length, collection]);

  return { query, setQuery, activeTag, setActiveTag, results, allTags };
}
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. Given fixture items `[{slug:'a',title:'Juno',description:'health app',tags:['Health Tech'],body:''}, {slug:'b',title:'Other',description:'',tags:['Developer Tools'],body:''}]`, calling the hook (via `renderHook` under a `MemoryRouter`) with `activeTag='Health Tech'` and empty query returns only item `a` in `results`.
     3. With no `activeTag` and `query='juno'`, `results` narrows to item `a` only.
     4. With `activeTag='Developer Tools'` AND `query='juno'` (a query that would only match an item outside the active tag), `results` is `[]` — proving AND composition, not OR.
     5. `allTags` reflects the full unfiltered `items` array regardless of `activeTag`/`query` — does not shrink as filtering narrows `results`.
     6. Typing a non-empty query and waiting 600ms (fake timers) fires `trackEvent('search_query', { collection, query, result_count })` exactly once with the settled query, not once per keystroke (simulate 3 rapid `setQuery` calls inside the 600ms window; assert `trackEvent` called exactly once, with the final query string).
     7. Setting `query` to `''` or `'   '` never fires `trackEvent('search_query', ...)`, even after 600ms.

---

### Task 2 — `SearchFilter` presentational component
   - Status: Complete
   - Files: `src/components/SearchFilter.tsx` (new)
   - Changes: Implement per PRD §4.2 — pure UI, no data logic. Reuses SP01's `TagPill` in its `active`/`onClick` filter-chip mode (added by SP01 specifically for this consumer).

```tsx
// src/components/SearchFilter.tsx
import { TagPill } from './TagPill';

interface SearchFilterProps {
  query: string;
  onQueryChange: (v: string) => void;
  tags: string[];
  activeTag: string | null;
  onTagChange: (t: string | null) => void;
  resultCount: number;
  placeholder: string;
}

export function SearchFilter({
  query, onQueryChange, tags, activeTag, onTagChange, resultCount, placeholder,
}: SearchFilterProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full rounded-full border border-teal-secondary/15 bg-cream px-4 py-2 text-sm text-ink focus:border-teal-secondary/40 focus:outline-none sm:w-72"
        />
        <span className="text-[0.72rem] text-slate" aria-live="polite">
          {resultCount} {resultCount === 1 ? 'result' : 'results'}
        </span>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by tag">
          {tags.map((tag) => (
            <TagPill key={tag} active={tag === activeTag} onClick={() => onTagChange(tag === activeTag ? null : tag)}>
              {tag}
            </TagPill>
          ))}
        </div>
      )}
    </div>
  );
}
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. Renders zero `TagPill`s when `tags={[]}` (the tag-filter group is omitted entirely, not rendered empty).
     3. Typing into the input calls `onQueryChange` with the new value on every keystroke (this component itself does no debouncing — that's Task 1's job).
     4. Clicking a non-active tag calls `onTagChange('<that tag>')`; clicking the currently-active tag calls `onTagChange(null)` (single-select, click-to-clear).

---

### Task 3 — `EmptyState` presentational component
   - Status: Complete
   - Files: `src/components/EmptyState.tsx` (new)
   - Changes: Implement per PRD §4.2, parameterized by `itemLabel` so one component serves both collections. No "zero items in the whole collection" variant — both collections are non-empty at launch (PRD §4.2 states this is dead code here, not a gap).

```tsx
// src/components/EmptyState.tsx
interface EmptyStateProps {
  itemLabel: string;
  query: string;
  activeTag: string | null;
  onClear: () => void;
}

export function EmptyState({ itemLabel, query, activeTag, onClear }: EmptyStateProps) {
  const clearLabel = activeTag && query.trim() ? 'Clear filters' : activeTag ? 'Clear tag filter' : 'Clear search';
  return (
    <div className="col-span-full flex flex-col items-center gap-2 py-16 text-center">
      <p className="text-sm text-body">
        {activeTag && query.trim() ? (
          <>No {itemLabel} match &ldquo;{query}&rdquo; tagged <strong>{activeTag}</strong>.</>
        ) : activeTag ? (
          <>No {itemLabel} are tagged <strong>{activeTag}</strong>.</>
        ) : (
          <>No {itemLabel} match &ldquo;{query}&rdquo;.</>
        )}
      </p>
      <button type="button" onClick={onClear} className="text-sm font-semibold text-teal-secondary hover:text-teal">
        {clearLabel}
      </button>
    </div>
  );
}
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. With `activeTag=null, query='xyz'`: renders the query-only copy variant and a "Clear search" button.
     3. With `activeTag='Health', query=''`: renders the tag-only copy variant and a "Clear tag filter" button.
     4. With both set: renders the combined copy variant and a "Clear filters" button.
     5. Clicking the button calls `onClear` exactly once.

---

### Task 4 — `ProjectsPage` (real listing, replaces SP01 placeholder)
   - Status: Complete
   - Files: `src/pages/ProjectsPage.tsx` (rewritten)
   - Changes: Implement per PRD §4.2. Depends on Tasks 1–3, SP02's `projects` (`@/data`), SP03's `ProjectCard`, and SP05's `trackEvent`.

```tsx
// src/pages/ProjectsPage.tsx
import { BackButton } from '@/components/BackButton';
import { SearchFilter } from '@/components/SearchFilter';
import { EmptyState } from '@/components/EmptyState';
import { ProjectCard } from '@/components/ProjectCard'; // SP03, verbatim — no fork
import { useCollectionFilter } from '@/hooks/useCollectionFilter';
import { projects } from '@/data';
import { trackEvent } from '@/lib/analytics';

export function ProjectsPage() {
  const { query, setQuery, activeTag, setActiveTag, results, allTags } =
    useCollectionFilter({ items: projects, collection: 'projects' });

  return (
    <div className="mx-auto w-full max-w-content px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12">
      <BackButton />
      <h1 className="mt-6 text-[1.9rem] font-extrabold tracking-tight text-ink sm:text-[2.3rem]">Projects</h1>
      <div className="mt-8">
        <SearchFilter
          query={query} onQueryChange={setQuery} tags={allTags} activeTag={activeTag}
          onTagChange={setActiveTag} resultCount={results.length}
          placeholder="Search projects by name, description, or tag"
        />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.length === 0 ? (
          <EmptyState itemLabel="projects" query={query} activeTag={activeTag}
            onClear={() => { setQuery(''); setActiveTag(null); }} />
        ) : (
          results.map((project) => (
            <ProjectCard
              key={project.slug}
              href={`/projects/${project.slug}`}
              image={project.image}
              imageAlt={`${project.title} preview`}
              title={project.title}
              description={project.description}
              tags={project.tags}
              status={project.status}
              externalHref={project.liveUrl}
              externalLabel={`Open ${project.title} live`}
              onCardClick={() =>
                trackEvent('project_card_click', { slug: project.slug, collection: 'projects', title: project.title })
              }
              onExternalClick={() =>
                trackEvent('outbound_click', {
                  url: project.liveUrl ?? '',
                  context: 'content_external_link', // renamed enum value, PRD §4.4/§9
                  label: `Open ${project.title} live`,
                })
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes; `npm run build` succeeds and `/projects` is a prerendered static route (SP01 already registers this as a non-`:param` static path, so no `getStaticPaths` change is needed here).
     2. Loading `/projects` renders `BackButton`, the "Projects" heading, `SearchFilter`, and one `ProjectCard` per item in SP02's `projects` array.
     3. Typing a substring of exactly one project's title into the search box narrows the grid to that one card (verify against real content once SP07 lands it, or fixture `projects` in a component test).
     4. A grid with `xl:grid-cols-3` (not SP03's `xl:grid-cols-4`) — spot-check the class is present on the grid container.
     5. Clicking a card fires `trackEvent('project_card_click', { slug, collection: 'projects', title })`; clicking a card's external-link icon (when `liveUrl` is set) fires `trackEvent('outbound_click', { url: liveUrl, context: 'content_external_link', label })`.

---

### Task 5 — `ResearchPage` (real listing, replaces SP01 placeholder)
   - Status: Complete
   - Files: `src/pages/ResearchPage.tsx` (rewritten)
   - Changes: Implement per PRD §4.2/§4.3. Identical shape to Task 4 with **three deliberate differences**, all tied to the resolved decision in PRD §4.3 that Research cards never populate `externalHref`: (a) `research` from `@/data` instead of `projects`; (b) `ProjectCard` is invoked **without** `externalHref`, `externalLabel`, or `onExternalClick` — not `undefined`-valued props, the props are omitted from the JSX entirely; (c) `href` points at `/research/${item.slug}`.

```tsx
// src/pages/ResearchPage.tsx
import { BackButton } from '@/components/BackButton';
import { SearchFilter } from '@/components/SearchFilter';
import { EmptyState } from '@/components/EmptyState';
import { ProjectCard } from '@/components/ProjectCard'; // same shared component, no fork
import { useCollectionFilter } from '@/hooks/useCollectionFilter';
import { research } from '@/data';
import { trackEvent } from '@/lib/analytics';

export function ResearchPage() {
  const { query, setQuery, activeTag, setActiveTag, results, allTags } =
    useCollectionFilter({ items: research, collection: 'research' });

  return (
    <div className="mx-auto w-full max-w-content px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12">
      <BackButton />
      <h1 className="mt-6 text-[1.9rem] font-extrabold tracking-tight text-ink sm:text-[2.3rem]">Research</h1>
      <div className="mt-8">
        <SearchFilter
          query={query} onQueryChange={setQuery} tags={allTags} activeTag={activeTag}
          onTagChange={setActiveTag} resultCount={results.length}
          placeholder="Search research by title, topic, or tag"
        />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.length === 0 ? (
          <EmptyState itemLabel="research entries" query={query} activeTag={activeTag}
            onClear={() => { setQuery(''); setActiveTag(null); }} />
        ) : (
          results.map((item) => (
            <ProjectCard
              key={item.slug}
              href={`/research/${item.slug}`}
              image={item.image}
              imageAlt={`${item.title} preview`}
              title={item.title}
              description={item.description}
              tags={item.tags}
              status={item.status}
              // externalHref / externalLabel / onExternalClick: DELIBERATELY
              // omitted — PRD §4.3 (resolves SP03's previously open item).
              // A citation link is not a "try it now" affordance; the
              // external-icon shortcut never appears on a Research card.
              onCardClick={() =>
                trackEvent('project_card_click', { slug: item.slug, collection: 'research', title: item.title })
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes; `/research` is a prerendered static route.
     2. Loading `/research` renders one `ProjectCard` per item in SP02's `research` array, and **no card renders an external-link icon** — assert this directly (query the DOM for `ExternalLinkIcon`'s rendered markup/role and confirm zero matches across every rendered card), since SP02's `Research` type has no `liveUrl` field at all (§4.4.3) making this the second, independent layer of enforcement beyond the type system.
     3. Search and tag filtering behave identically to `/projects` (same underlying hook), verified by the same substring-narrows-to-one-card check as Task 4.
     4. Clicking a card fires `trackEvent('project_card_click', { slug, collection: 'research', title })`.

---

### Task 6 — `DetailHeader` shared component
   - Status: Complete
   - Files: `src/components/DetailHeader.tsx` (new)
   - Changes: Implement per PRD §4.4. Shared, collection-agnostic header block: image, title, optional status pill, tags. Same "no reserved space" guarantee as SP03's `ProjectCard` — the status pill is an absolute overlay, never a layout element.

```tsx
// src/components/DetailHeader.tsx
import { TagPill } from './TagPill';

interface DetailHeaderProps {
  image: string;
  imageAlt?: string;
  title: string;
  status?: string;
  tags: string[];
}

export function DetailHeader({ image, imageAlt = '', title, status, tags }: DetailHeaderProps) {
  return (
    <header className="mt-6">
      <div className="relative overflow-hidden rounded-section bg-placeholder">
        <img src={image} alt={imageAlt} className="h-[200px] w-full object-cover sm:h-[260px] lg:h-[320px]" />
        {status && (
          <span className="absolute left-3 top-3 rounded-full bg-teal/92 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wide text-white">
            {status}
          </span>
        )}
      </div>
      <h1 className="mt-6 text-[1.9rem] font-extrabold tracking-tight text-ink sm:text-[2.4rem]">{title}</h1>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => <TagPill key={tag}>{tag}</TagPill>)}
        </div>
      )}
    </header>
  );
}
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. Renders `title` as an `<h1>` and `image` with the given `imageAlt` unconditionally.
     3. With `status` omitted, no status-pill element exists in the rendered DOM at all (not a hidden or empty one) — same claim SP03's `ProjectCard` test already pins for its own status pill.
     4. With `tags=[]`, no tag-pill wrapper `<div>` renders.

---

### Task 7 — `LinksRow` shared component
   - Status: Complete
   - Files: `src/components/LinksRow.tsx` (new)
   - Changes: Implement per PRD §4.4. Renders SP02's `links[]` plus an optional internal "Open Live" CTA (Projects only — Research never passes `liveHref`). Uses SP01's `ExternalLinkIcon`/`ArrowIcon`. Emits `outbound_click` with `context: 'content_external_link'` on every external link click — **this is the renamed enum value (from `'project_external_link'`) that this PRD's §4.4/§9 resolves; confirm SP05 has actually shipped it in its `AnalyticsEventName` union before this file is expected to typecheck** (see the sequencing note at the top of this file).

```tsx
// src/components/LinksRow.tsx
import { Link } from 'react-router-dom';
import type { Link as ContentLink } from '@/data'; // SP02's Link type: { label, href }
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { ArrowIcon } from './icons/ArrowIcon';
import { trackEvent } from '@/lib/analytics';

interface LinksRowProps {
  links: ContentLink[];
  /** Internal /projects/<slug>/live path — set only when a project has EITHER
   *  a liveUrl OR a hosted-page registration (§4.6/§4.7). Research never
   *  passes this. */
  liveHref?: string;
}

export function LinksRow({ links, liveHref }: LinksRowProps) {
  if (links.length === 0 && !liveHref) return null;
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {liveHref && (
        <Link
          to={liveHref}
          className="inline-flex items-center gap-1.5 rounded-full bg-teal px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Open Live
          <ArrowIcon className="h-4 w-4" />
        </Link>
      )}
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackEvent('outbound_click', { url: link.href, context: 'content_external_link', label: link.label })}
          className="inline-flex items-center gap-1.5 rounded-full border border-teal-secondary/20 px-5 py-2 text-sm font-semibold text-teal-secondary transition hover:bg-teal-secondary hover:text-white"
        >
          {link.label}
          <ExternalLinkIcon className="h-3.5 w-3.5" />
        </a>
      ))}
    </div>
  );
}
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. `links={[]}` and `liveHref` undefined renders `null` (nothing in the DOM, not an empty wrapper `<div>`).
     3. `liveHref` set renders an "Open Live" internal `<Link to={liveHref}>`, pointing at the given path — **not** `link.href` or any external URL.
     4. Clicking an external link fires `trackEvent('outbound_click', { url: link.href, context: 'content_external_link', label: link.label })` exactly once.

---

### Task 8 — `src/pages/live/registry.ts` — the hosted mini-project convention
   - Status: Complete
   - Files: `src/pages/live/registry.ts` (new)
   - Changes: Implement per PRD §4.7. This is the file SP05 §9's "no forms" mechanical check was blocked on, and the file SP06's `sample-project` plugs into later with exactly one line. **Ships with `HOSTED_LIVE_PAGES` empty — do not add `sample-project` here; that's SP06's task, not this one.**
   - **Testability deviation from the PRD's exact code sample, same class of deviation SP02's `src/data/index.ts` already made (SP02 `TASKS.md` Task 8):** the cross-check and the `projectLiveSlugs` computation are pulled into two exported, parameterized functions (`validateLiveRegistry`, `computeProjectLiveSlugs`) that the real module-scope code calls with the real `HOSTED_LIVE_PAGES`/`projects`, and that Task 21's tests call directly with fixture data — this preserves the PRD's exact "eager, fail loud, name the file" runtime behavior while making it possible to unit test the redirect-XOR-hosted conflict and the "no matching project" case without mocking `@/data` and forcing a fresh module evaluation.

```ts
// src/pages/live/registry.ts
//
// THE convention for adding a new hosted (non-redirect) mini-project at
// /projects/<slug>/live:
//   1. Write src/content/projects/<slug>.md with NO liveUrl field.
//   2. Write src/pages/live/<slug>.tsx, exporting one component with zero
//      required props (ProjectLivePage renders it with none).
//   3. Add exactly one line to HOSTED_LIVE_PAGES below.
// That's the whole surface. Everything else (routing, RouteMeta, the "no
// forms" check) is generic and already wired to this registry.
import type { ComponentType } from 'react';
import type { Project } from '@/data';
import { projects } from '@/data';

// SP06 adds the 'sample-project' entry when it lands; empty until then.
export const HOSTED_LIVE_PAGES: Record<string, ComponentType> = {};

/** Redirect-XOR-hosted cross-check, exported and parameterized for testing. */
export function validateLiveRegistry(hostedSlugs: string[], allProjects: Project[]): void {
  for (const slug of hostedSlugs) {
    const project = allProjects.find((p) => p.slug === slug);
    if (!project) {
      throw new Error(
        `src/pages/live/registry.ts: HOSTED_LIVE_PAGES registers "${slug}" but no ` +
        `src/content/projects/${slug}.md exists.`,
      );
    }
    if (project.liveUrl) {
      throw new Error(
        `src/pages/live/registry.ts: "${slug}" has BOTH liveUrl set in its frontmatter ` +
        `AND a HOSTED_LIVE_PAGES entry — pick exactly one mode (redirect XOR hosted). ` +
        `Remove liveUrl from the file, or remove this registry entry.`,
      );
    }
  }
}

/** The union getStaticPaths needs, exported and parameterized for testing. */
export function computeProjectLiveSlugs(hostedSlugs: string[], allProjects: Project[]): string[] {
  return allProjects.filter((p) => p.liveUrl || hostedSlugs.includes(p.slug)).map((p) => p.slug);
}

const HOSTED_SLUGS = Object.keys(HOSTED_LIVE_PAGES);

// Eager, module-load time — runs the moment anything imports this module
// (routes.tsx always does), so a bad wiring fails the build immediately.
validateLiveRegistry(HOSTED_SLUGS, projects);

export const projectLiveSlugs: string[] = computeProjectLiveSlugs(HOSTED_SLUGS, projects);

/** Used by ProjectDetailPage's LinksRow to decide whether to render the
 *  "Open Live" CTA at all. */
export function hasLiveRoute(slug: string): boolean {
  return projectLiveSlugs.includes(slug);
}
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. With `HOSTED_LIVE_PAGES={}` (as shipped), `npm run build` succeeds and `projectLiveSlugs` equals exactly the slugs of projects with `liveUrl` set.
     3. `hasLiveRoute('some-slug-with-liveUrl')` returns `true`; `hasLiveRoute('some-slug-with-neither')` returns `false`.
     4. **Negative path (redirect-XOR-hosted), run manually once and reverted:** add a fixture entry to `HOSTED_LIVE_PAGES` for a slug that also has `liveUrl` set in its frontmatter (or add `liveUrl` to an existing hosted-registered fixture). Run `npm run build`; confirm it fails, and the error names both the slug and the conflict ("has BOTH liveUrl set... AND a HOSTED_LIVE_PAGES entry"). Revert the fixture.
     5. **Negative path (orphaned registry entry), run manually once and reverted:** add a fixture entry to `HOSTED_LIVE_PAGES` for a slug with no matching `.md` file. Run `npm run build`; confirm it fails, naming the slug and the missing file. Revert.

---

### Task 9 — `ProjectDetailPage` (data-driven template, replaces SP01 placeholder)
   - Status: Complete
   - Files: `src/pages/ProjectDetailPage.tsx` (rewritten)
   - Changes: Implement per PRD §4.5. Depends on Tasks 6–8, SP02's `ContentBody`/`projects`, SP06's `RouteMeta`, SP01's `NotFoundPage`. **The `image` prop passed to `RouteMeta` is the generated OG card path (`/og/projects/<slug>.png`), NOT `project.image`** — this is a decision that was caught and fixed once already in this PRD (§4.5/§9): passing the raw frontmatter placeholder image straight to `RouteMeta` would make every project's share preview render as the identical stock photo. `DetailHeader`'s own `image` prop is unaffected and still reads `project.image` directly — only the `RouteMeta` call site differs.

```tsx
// src/pages/ProjectDetailPage.tsx
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

  // Unreachable via getStaticPaths (only real slugs are prerendered), but a
  // hand-edited/typo'd URL can still hit this client-side.
  if (!project) return <NotFoundPage />;

  return (
    <article className="mx-auto w-full max-w-content px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12">
      <RouteMeta
        title={project.title}
        description={project.description}
        path={`/projects/${project.slug}`}
        image={`/og/projects/${project.slug}.png`}
      />
      {/* image is the build-generated OG card path, NOT project.image (the
          frontmatter placeholder/thumbnail used below in DetailHeader and on
          the card grid) — PRD §4.5/§9. */}
      <BackButton />
      <DetailHeader image={project.image} imageAlt={`${project.title} preview`} title={project.title} status={project.status} tags={project.tags} />
      <p className="mt-4 max-w-[52rem] text-[0.98rem] leading-7 text-body">{project.description}</p>
      <LinksRow
        links={project.links}
        liveHref={hasLiveRoute(project.slug) ? `/projects/${project.slug}/live` : undefined}
      />
      <ContentBody body={project.body} />
    </article>
  );
}
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes; every real project slug from SP02's `projects` prerenders at `/projects/<slug>` (relies on SP01's already-registered `getStaticPaths: () => projectSlugs.map(...)` for this route — unchanged by this task).
     2. Loading a project's detail page renders `DetailHeader`, the description paragraph, `LinksRow`, and `ContentBody` in that order.
     3. Inspect the prerendered HTML `<head>` (`View Source`, not DevTools) for a project's detail page and confirm the `og:image`/`twitter:image` value is `/og/projects/<slug>.png` — never the frontmatter `image` URL.
     4. For a project with `hasLiveRoute(slug) === true`, `LinksRow` renders the "Open Live" CTA pointing at `/projects/<slug>/live`; for one with `hasLiveRoute(slug) === false`, it does not.
     5. A hand-typed unknown slug (e.g. `/projects/does-not-exist`) renders `NotFoundPage`, not a crash.

---

### Task 10 — `ResearchDetailPage` (data-driven template, replaces SP01 placeholder)
   - Status: Complete
   - Files: `src/pages/ResearchDetailPage.tsx` (rewritten)
   - Changes: Implement per PRD §4.5. Identical shape to Task 9, with **no `liveHref` concept at all** — no import from `./live/registry`, no conditional to get wrong, since Research has no `/live` route. Same OG-path-not-frontmatter-image rule for `RouteMeta` as Task 9.

```tsx
// src/pages/ResearchDetailPage.tsx
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
      {/* image is the build-generated OG card path, NOT item.image — same
          fix as ProjectDetailPage, PRD §4.5/§9. */}
      <RouteMeta title={item.title} description={item.description} path={`/research/${item.slug}`} image={`/og/research/${item.slug}.png`} />
      <BackButton />
      <DetailHeader image={item.image} imageAlt={`${item.title} preview`} title={item.title} status={item.status} tags={item.tags} />
      <p className="mt-4 max-w-[52rem] text-[0.98rem] leading-7 text-body">{item.description}</p>
      <LinksRow links={item.links} />
      <ContentBody body={item.body} />
    </article>
  );
}
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes; every real research slug prerenders at `/research/<slug>` (relies on SP01's already-registered `getStaticPaths` for this route).
     2. Loading a research item's detail page renders `DetailHeader`, description, `LinksRow` (no "Open Live" CTA ever appears — `liveHref` is never passed), and `ContentBody`.
     3. `og:image` in the prerendered `<head>` is `/og/research/<slug>.png`, not `item.image`.
     4. A hand-typed unknown slug renders `NotFoundPage`.

---

### Task 11 — `LiveRedirectFallback` component
   - Status: Complete
   - Files: `src/components/LiveRedirectFallback.tsx` (new)
   - Changes: Implement per PRD §4.6. Client-side redirect UI, defense-in-depth only (not the primary redirect mechanism — that's Task 13's HTTP-level redirect). Fires the single `live_redirect` tracking call regardless of how the visitor got here.

```tsx
// src/components/LiveRedirectFallback.tsx
import { useEffect } from 'react';
import { BackButton } from './BackButton';
import { trackEvent } from '@/lib/analytics';

interface LiveRedirectFallbackProps {
  to: string;
  label: string;
}

export function LiveRedirectFallback({ to, label }: LiveRedirectFallbackProps) {
  useEffect(() => {
    trackEvent('outbound_click', { url: to, context: 'live_redirect', label });
    window.location.replace(to);
  }, [to, label]);

  return (
    <div className="mx-auto max-w-content px-6 py-24 text-center">
      <BackButton />
      <p className="mt-10 text-body">
        Redirecting you to {label}&hellip; If nothing happens,{' '}
        <a href={to} className="font-semibold text-teal-secondary underline">click here</a>.
      </p>
    </div>
  );
}
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. On mount (with `window.location.replace` mocked), `trackEvent('outbound_click', { url: to, context: 'live_redirect', label })` is called exactly once, and `window.location.replace(to)` is called exactly once with the same `to` value — assert both calls happen (order: tracking before/alongside navigation, not after, per PRD §4.6's `sendBeacon` reasoning).
     3. The rendered fallback markup includes a real `<a href={to}>` as a manual-click escape hatch, and a `BackButton`.

---

### Task 12 — `ProjectLivePage` (dual-mode dispatch, replaces SP01 placeholder)
   - Status: Complete
   - Files: `src/pages/ProjectLivePage.tsx` (rewritten)
   - Changes: Implement per PRD §4.6, directly implementing SP02's `liveMode()` contract. Depends on Task 8's `HOSTED_LIVE_PAGES`, Task 11's `LiveRedirectFallback`, SP01's `NotFoundPage`.

```tsx
// src/pages/ProjectLivePage.tsx
import { useParams } from 'react-router-dom';
import { projects } from '@/data';
import { LiveRedirectFallback } from '@/components/LiveRedirectFallback';
import { HOSTED_LIVE_PAGES } from './live/registry';
import { NotFoundPage } from './NotFoundPage';

export function ProjectLivePage() {
  const { slug } = useParams<{ slug: string }>();
  const project = slug ? projects.find((p) => p.slug === slug) : undefined;
  const HostedComponent = slug ? HOSTED_LIVE_PAGES[slug] : undefined;

  if (HostedComponent) return <HostedComponent />;
  if (project?.liveUrl) return <LiveRedirectFallback to={project.liveUrl} label={project.title} />;

  // Reachable only via a hand-typed/stale URL for a slug with neither mode —
  // getStaticPaths (Task 14) never generates this path for such a slug.
  return <NotFoundPage />;
}
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. Given a slug present in `HOSTED_LIVE_PAGES`, renders that component directly (no redirect fallback rendered).
     3. Given a slug with `liveUrl` set and not in `HOSTED_LIVE_PAGES`, renders `LiveRedirectFallback` with `to={project.liveUrl}`.
     4. Given a slug matching neither condition (or no matching project at all), renders `NotFoundPage`.

---

### Task 13 — `vite.config.ts`: `liveRedirectsPlugin` (SP01-owned file, edited)
   - Status: Complete
   - Files: `vite.config.ts` (modified — SP01-owned)
   - Changes: Implement per PRD §4.6. Adds one plugin to SP01's existing `plugins` array; nothing else in the file changes. Mirrors `juno-landing-page`'s `sitemapPlugin` precedent: an independent filesystem + `gray-matter` scan, not `import.meta.glob`, because `vite.config.ts` loads via a lighter esbuild-based path that doesn't guarantee resolving Vite application-build-pipeline macros. Does **not** re-validate frontmatter — SP02's loader already fails loudly on bad content before this plugin's `closeBundle` runs.
   - **Testability deviation, noted so the test in Task 24 isn't fighting the file system:** `readLiveUrls` takes a `dir` parameter (the real call site passes the module's own `PROJECTS_DIR` constant) rather than closing over it, so a test can point it at a fixture temp directory directly.

```ts
// vite.config.ts — add these imports and this plugin; register it in the
// existing `plugins: [react(), ...]` array. `path` from 'node:path' should
// already be imported for SP01's alias resolution — reuse it; add only the
// fs functions and gray-matter below if not already present.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import matter from 'gray-matter';
import type { Plugin } from 'vite';

const PROJECTS_DIR = path.resolve(__dirname, 'src/content/projects');

export function readLiveUrls(dir: string): { slug: string; liveUrl: string }[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => matter(readFileSync(path.join(dir, f), 'utf-8')).data)
    .filter((data): data is { slug: string; liveUrl: string } => typeof data.liveUrl === 'string')
    .map(({ slug, liveUrl }) => ({ slug, liveUrl }));
}

function liveRedirectsPlugin(): Plugin {
  return {
    name: 'live-redirects',
    closeBundle() {
      const entries = readLiveUrls(PROJECTS_DIR);
      const firebaseJsonPath = path.resolve(__dirname, 'firebase.json');
      const config = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'));
      config.hosting.redirects = entries.map(({ slug, liveUrl }) => ({
        source: `/projects/${slug}/live`,
        destination: liveUrl,
        type: 302, // temporary — liveUrl is owner-editable content; a
                   // permanent 301 risks a cached stale destination.
      }));
      writeFileSync(firebaseJsonPath, JSON.stringify(config, null, 2) + '\n');
    },
  };
}

// In defineConfig({ plugins: [react(), liveRedirectsPlugin() /* SP06 adds
// its own sitemapPlugin() alongside this */], ... }) — everything else in
// the file (public, cleanUrls, ignore, headers, alias resolution) unchanged.
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes (this file is part of the TS project per SP01's `tsconfig`).
     2. `npm run build` succeeds; after it completes, `firebase.json`'s `hosting.redirects` array contains exactly one `{source, destination, type: 302}` entry per project with `liveUrl` set in `src/content/projects/*.md`, with `source` equal to `/projects/<slug>/live` and `destination` equal to that project's `liveUrl`.
     3. Every other top-level key already present in `firebase.json` before the build (`hosting.public`, `hosting.cleanUrls`, `hosting.ignore`, `hosting.headers`, `hosting.rewrites`) is byte-for-byte unchanged after the build.
     4. With zero `.md` files declaring `liveUrl`, `hosting.redirects` is `[]` after the build (not omitted, not left stale from a previous build — the plugin always overwrites the key).

---

### Task 14 — `routes.tsx`: narrow `/live` `getStaticPaths` (SP01-owned file, edited)
   - Status: Complete
   - Files: `src/routes.tsx` (modified — SP01-owned)
   - Changes: Implement per PRD §4.7. SP01 shipped `getStaticPaths: () => projectSlugs.map((slug) => \`projects/${slug}/live\`)` for the `/projects/:slug/live` route — every project, unconditionally. This task narrows it to Task 8's `projectLiveSlugs`, the actual resolvable set. **Only the `getStaticPaths` line and its import change on this route entry; nothing else moves.**

```tsx
// src/routes.tsx — only this route entry's getStaticPaths + import change
import { projectLiveSlugs } from '@/pages/live/registry';

// ...
{
  path: 'projects/:slug/live',
  element: <ProjectLivePage />,
  getStaticPaths: () => projectLiveSlugs.map((slug) => `projects/${slug}/live`),
  // FRAGILITY GUARD: every hosted (non-redirect) /projects/<slug>/live page
  // — anything registered in src/pages/live/registry.ts's HOSTED_LIVE_PAGES
  // — must currently accept ZERO user input. /privacy and /terms both state
  // this domain has no forms as of their last-updated date. The moment a
  // hosted /live project adds an <input>, <textarea>, <form>, or a file
  // upload, that claim is false and BOTH src/pages/PrivacyPage.tsx and
  // src/pages/TermsPage.tsx must be revised BEFORE that project ships, not
  // after. `npm run check:no-forms` (Task 15) mechanically checks this
  // directory — run it before adding any new HOSTED_LIVE_PAGES entry. See
  // PRD 05 §4.7 and PRD 04 §4.8 for the full reasoning.
},
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes; `npm run build` succeeds.
     2. `npm run build`'s output includes a prerendered HTML file at `/projects/<slug>/live` for every slug in `projectLiveSlugs` (every project with `liveUrl` set, plus every `HOSTED_LIVE_PAGES` key) — and **no** such file for a project with neither `liveUrl` nor a hosted registration. Verify by checking the `dist/` output directory listing directly against `projectLiveSlugs` before and after adding/removing a fixture `liveUrl`.
     3. Confirm the fragility-guard comment is present verbatim at this route entry (it is referenced by name from `check-no-forms.sh`'s failure message in Task 15).

---

### Task 15 — `check:no-forms` mechanical check
   - Status: Complete
   - Files: `scripts/check-no-forms.sh` (new), `package.json` (modified — add the `check:no-forms` script and chain it into `check:launch`)
   - Changes: Implement per PRD §4.8. Closes SP05 §9's previously open mechanical-check item, made possible specifically because hosted mini-projects live exclusively under `src/pages/live/` (Task 8's convention) — a scoped grep against that one directory has zero false positives.

```bash
#!/usr/bin/env bash
# scripts/check-no-forms.sh
# Run before adding any new entry to src/pages/live/registry.ts's
# HOSTED_LIVE_PAGES, and before every real deploy. Fails (nonzero exit) the
# moment any file under src/pages/live/ contains input-accepting markup —
# see the FRAGILITY GUARD comment in src/routes.tsx and PRD 05 §4.7.
set -euo pipefail

if grep -rEn '<(input|form|textarea)[ >]' src/pages/live; then
  echo ""
  echo "FRAGILITY GUARD FAILED: input-accepting markup found under src/pages/live/."
  echo "Both /privacy and /terms currently state this site has no forms. Before"
  echo "this ships, revise src/pages/PrivacyPage.tsx and src/pages/TermsPage.tsx"
  echo "(their \"no forms\" sections + LAST_UPDATED) — see PRD 05 §4.7."
  exit 1
fi

echo "check:no-forms passed — no input-accepting markup under src/pages/live/."
```

In `package.json`'s `"scripts"`:
```json
"check:no-forms": "bash scripts/check-no-forms.sh",
```
And, **only if SP02's `check:launch` script already exists** (SP02 `TASKS.md` Task 10 — confirm before editing), extend it:
```json
"check:launch": "tsx scripts/check-launch-content.ts && npm run check:no-forms",
```
If `check:launch` does not exist yet when this task runs, add `check:no-forms` as its own standalone script only, and flag the chaining step as blocked on SP02's Task 10 landing first (do not invent a placeholder `check:launch`).

   - Acceptance criteria:
     1. `chmod +x scripts/check-no-forms.sh` (or invoke via `bash scripts/check-no-forms.sh` regardless of executable bit — the `package.json` script above uses `bash` explicitly so this isn't load-bearing).
     2. On a clean checkout (only `registry.ts` and whatever `.tsx` page files already exist under `src/pages/live/`, none containing form markup), `npm run check:no-forms` exits 0 and prints the pass message.
     3. **Required negative test, run manually and reverted — do not skip:** add a scratch line `<input type="text" />` inside any existing file under `src/pages/live/` (e.g. append it as a comment-adjacent JSX fragment in `registry.ts` is not valid TSX, so instead temporarily create `src/pages/live/_scratch.tsx` containing `export const Scratch = () => <input type="text" />;`). Run `npm run check:no-forms`; confirm it exits non-zero and its output names `src/pages/live/_scratch.tsx` (via grep's own filename-prefixed output) and prints the FRAGILITY GUARD message pointing at `/privacy`/`/terms`. Delete `_scratch.tsx` and re-run `npm run check:no-forms` to confirm it passes again.
     4. If `check:launch` exists, `npm run check:launch` runs `check:no-forms` as part of its chain (confirm by checking its combined output includes the no-forms pass/fail line).

---

## Tests

### Task 16 — `useCollectionFilter` filtering/analytics unit tests
   - Status: Complete
   - Files: `src/hooks/useCollectionFilter.test.ts` (new)
   - Changes: Cover, using fixture data (no real content) and `renderHook` wrapped in a `MemoryRouter`, with `vi.mock('@/lib/analytics')` and fake timers for the 600ms analytics timer:
     - Tag filter alone narrows correctly.
     - Search alone narrows correctly.
     - Tag + search compose as AND (a query matching an item outside the active tag returns `[]`).
     - Empty query, no active tag returns every item.
     - `allTags` is derived from the full manifest and doesn't shrink as a filter narrows `results`.
     - The debounced `search_query` event fires once per settled (600ms-quiet) non-empty query with the correct `collection`/`query`/`result_count` params, and does not fire for an empty/whitespace query, and does not fire once per keystroke (assert call count stays at 1 across several rapid `setQuery` calls inside the 600ms window).
   - Acceptance criteria: `npm test` passes all cases listed above; each is a separate `it()`/`test()` block, not folded into one assertion.

---

### Task 17 — `useCollectionFilter` URL-sync tests
   - Status: Complete
   - Files: `src/hooks/useCollectionFilter.test.ts` (same file as Task 16, or a sibling `useCollectionFilter.urlSync.test.ts` — either is fine, pick one and keep it consistent) — new test cases
   - Changes: Per PRD §4.2 and §7's explicit call-out that this timing is "worth pinning directly since it's easy to accidentally 'fix' into a hydration-mismatch-prone synchronous read":
     - Given a fixture wrapped in `MemoryRouter` with an initial entry `?q=maps&tag=Health%20Tech`, the hook's returned `query`/`activeTag` are still the empty/`null` defaults on the very first synchronous render, and only reflect the URL values **after** the mount effect runs (assert both states — pre-effect-flush and post-effect-flush — not just the final settled state).
     - Typing (via `act(() => setQuery(...))` + advancing debounce timers) updates the URL (`?q=`) via `replace`, not `push` — assert `history.length` does not grow across several sequential query changes.
   - Acceptance criteria: `npm test` passes; the pre-mount-vs-post-mount assertion specifically fails if someone "fixes" the hook to read `searchParams` synchronously in the `useState` initializer (this is the regression this test exists to catch — verify by temporarily making that exact change locally, confirming the test fails, then reverting).

---

### Task 18 — `SearchFilter` and `EmptyState` component tests
   - Status: Complete
   - Files: `src/components/SearchFilter.test.tsx` (new), `src/components/EmptyState.test.tsx` (new)
   - Changes: Cover Task 2's and Task 3's acceptance criteria as automated tests: `SearchFilter` renders `resultCount` text and calls the right callback on input change and tag click (including the active-tag-clears-on-reclick case); `EmptyState` renders each of the three copy variants (tag-only, query-only, both) correctly and calls `onClear` on button click.
   - Acceptance criteria: `npm test` passes; each variant/interaction from Tasks 2/3's acceptance criteria has a corresponding `it()` block.

---

### Task 19 — `DetailHeader` and `LinksRow` component tests
   - Status: Complete
   - Files: `src/components/DetailHeader.test.tsx` (new), `src/components/LinksRow.test.tsx` (new)
   - Changes: `DetailHeader` — status pill renders only when `status` is provided, and confirms no extra DOM node/spacing exists when it's absent (same claim SP03's own `ProjectCard` test already pins, per PRD §7). `LinksRow` — renders `null` when both `links` is empty and `liveHref` is undefined; renders the "Open Live" CTA only when `liveHref` is provided, pointing at that exact path; clicking an external link fires `trackEvent('outbound_click', ...)` with `context: 'content_external_link'` and the correct `label`/`url`.
   - Acceptance criteria: `npm test` passes; `LinksRow`'s test explicitly asserts the `context` value is the string `'content_external_link'` (not the old `'project_external_link'`), since this is the one field a copy-paste from an older draft would most easily get wrong.

---

### Task 20 — Detail-page empty-`body` rendering tests
   - Status: Complete
   - Files: `src/pages/ProjectDetailPage.test.tsx` (new), `src/pages/ResearchDetailPage.test.tsx` (new)
   - Changes: Per PRD §4.5's "verified by construction" claim — given a fixture item (mock `@/data`'s `projects`/`research` export) with `body: ''`, `description` set, and a non-empty `links[]`, the page renders the header, the description paragraph, and the links row, but **nothing** from `ContentBody` — assert directly on the DOM that no stray empty wrapper element exists where the body would have gone (e.g. query for `ContentBody`'s known wrapper class/testid and assert it's absent, not just present-but-empty).
   - Acceptance criteria: `npm test` passes for both pages; this is a direct, mechanical proof of §4.5's claim, not an assertion resting on prose.

---

### Task 21 — `registry.ts` cross-check and `projectLiveSlugs` tests
   - Files: `src/pages/live/registry.test.ts` (new)
   - Changes: Using Task 8's exported `validateLiveRegistry`/`computeProjectLiveSlugs` functions directly with fixture `Project[]` arrays (no module mocking needed, per Task 8's testability deviation):
     - A fixture `hostedSlugs` entry for a slug with no matching project in the fixture list throws, naming the slug.
     - A fixture `hostedSlugs` entry for a slug whose fixture project also has `liveUrl` set throws, naming the conflict.
     - `computeProjectLiveSlugs` correctly unions `liveUrl`-bearing and hosted-registered slugs with no duplicates (a slug present in both a fixture's `liveUrl` and `hostedSlugs` — which `validateLiveRegistry` would itself reject — is not something this specific test needs to construct; test the union logic with non-overlapping fixture sets instead).
     - `hasLiveRoute` returns `true`/`false` correctly against a fixture `projectLiveSlugs` array (test the exported function directly, or reconstruct it from `computeProjectLiveSlugs`'s output).
   - Acceptance criteria: `npm test` passes all four cases; the two throw-cases assert on the error message content (naming the specific slug), not just that a throw occurred.

---

### Task 22 — `ProjectLivePage` dispatch tests
   - Files: `src/pages/ProjectLivePage.test.tsx` (new)
   - Changes: With `@/data` and `./live/registry` mocked per-test: given a hosted-registered slug, renders that component; given a `liveUrl`-only slug, renders `LiveRedirectFallback`; given a slug matching neither, renders `NotFoundPage`.
   - Acceptance criteria: `npm test` passes all three dispatch branches, each asserting on the actually-rendered component (e.g. by a distinguishing testid/text), not just "did not throw."

---

### Task 23 — `LiveRedirectFallback` test
   - Files: `src/components/LiveRedirectFallback.test.tsx` (new)
   - Changes: Covers Task 11's acceptance criteria as an automated test — mock `trackEvent` and `window.location.replace`; render with fixture `to`/`label` props; assert both are called exactly once with the correct arguments, and that the tracking call is not skipped or deferred past the navigation call.
   - Acceptance criteria: `npm test` passes.

---

### Task 24 — `liveRedirectsPlugin` test
   - Files: `vite.config.test.ts` (new, or `scripts/liveRedirectsPlugin.test.ts` if the plugin/`readLiveUrls` is easier to import in isolation from that location — pick one, keep `vite.config.ts`'s own exports minimal either way)
   - Changes: Per PRD §7 — given a fixture temp directory (created via `fs.mkdtempSync` in a `beforeEach`) containing a mix of `liveUrl`-bearing and hosted-mode `.md` files (frontmatter written directly as strings, no need for `gray-matter` to round-trip anything complex), call Task 13's exported `readLiveUrls(fixtureDir)` directly and assert it returns exactly the expected `{slug, liveUrl}` pairs (hosted-mode files, with no `liveUrl` key, are excluded). Separately, construct a fixture `firebase.json`-shaped object, apply the same `entries.map(...)` transform the plugin's `closeBundle` uses, and assert the resulting `hosting.redirects` array is exactly `[{source, destination, type: 302}, ...]` while every other key on the fixture object is unchanged (reference-equal or deep-equal, either is fine to assert).
   - Acceptance criteria: `npm test` passes; this test does not invoke a real `npm run build` (confirmed fast, per PRD §7's explicit "not requiring a real vite build" framing).

---

### Task 25 — `check-no-forms.sh` automated regression test
   - Files: `scripts/check-no-forms.test.ts` (new) — a small Vitest test that shells out to the script (Node's `child_process.execFileSync` or equivalent), per PRD §7's "a small shell-invocation test... acceptable given the script's own small surface"
   - Changes: In a `beforeEach`/`afterEach`, create and remove a fixture temp directory shaped like `src/pages/live/` (do **not** touch the real `src/pages/live/` directory from this automated test — that manual/reverted check already happened in Task 15's acceptance criteria 3). If the script's target path is hardcoded to the real `src/pages/live/` (as written in Task 15), this test's simplest reliable form is: (a) confirm the script exits 0 today against the real, clean directory, and (b) reproduce the exact manual steps from Task 15 acceptance criterion 3 programmatically — write a temp file into the real `src/pages/live/` inside the test, assert nonzero exit and the file's name in the output, then delete the temp file in a `finally`/`afterEach` regardless of test outcome, so a failed assertion never leaves the fixture behind to break every subsequent `check:no-forms` run.
   - Acceptance criteria: `npm test` passes; running the full suite twice in a row leaves zero stray files under `src/pages/live/` (confirm by diffing `git status --porcelain src/pages/live/` before and after the test run — must be identical).

---

## Summary of what requires you (not a dev agent)

1. **Confirm the "Open Live" CTA routing through `/projects/<slug>/live` rather than directly to `liveUrl`** (PRD §4.4, §8 item 1) is the behavior you want on the detail page. This PRD's reasoning is that the internal, brand-owned URL is worth surfacing prominently — but it's a judgment call, not a brief-mandated exact behavior. Nothing in Tasks 1–25 is blocked on your answer; this is a "confirm we got this right" item, not a "we can't proceed without you" item.
2. **Confirm single-select tag filtering is sufficient** (PRD §4.2, §8 item 2) at today's 3-tag-per-collection vocabulary, or say if you'd rather support selecting multiple tags at once. `[DEFERRED]` in the PRD as a small, well-scoped follow-up (`activeTag: string | null` → `activeTags: string[]`, `.includes()` → `.some()`) if you want it — not built in Tasks 1–25 above.
3. **Decide per real project, when it's built, whether it needs a hosted `/live` page at all** beyond SP06's `sample-project` (PRD §8 item 3) — Task 8's registry mechanism supports it, but nothing in today's content inventory calls for a second one. An ordinary future content decision, not something these tasks block on.
4. **Cross-sub-project sequencing risk, not something a dev agent can resolve alone:** SP05's `AnalyticsEventName` union must actually include `'search_query'` and the renamed `'content_external_link'` outbound-click context before Tasks 4, 5, 7, and 11 will typecheck — confirm SP05's landed code (not just its PRD prose) matches before those tasks are marked done, since `05-legal-analytics/PRD.md` was still being concurrently edited as this task list was written.
5. **Cross-sub-project sequencing risk on `ProjectCard`'s exact prop signature:** Tasks 4 and 5 assume the prop names this PRD's own snippets already use (`href, image, imageAlt, title, description, tags, status, externalHref, externalLabel, onCardClick, onExternalClick`). `03-landing-page-timeline/PRD.md` was also being concurrently edited — verify SP03's actually-shipped `ProjectCard` matches before treating a `tsc` failure on Tasks 4/5 as this sub-project's own bug.
6. **Nothing else in this sub-project is owner-blocked.** The Fuse config, the URL-state design, the redirect mechanism, and the hosted-project convention are all specified precisely enough (PRD §8 item 4) for implementation to proceed without further input from you.
