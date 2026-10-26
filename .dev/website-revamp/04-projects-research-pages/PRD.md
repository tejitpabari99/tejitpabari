# PRD — Sub-project 04: Projects & Research Pages

**Repo:** `tejitpabari/tejitpabari` (branch `website-revamp`)
**Depends on:** SP01 (shell, router, `getStaticPaths` mechanism, `Nav`/`Footer`/`PageShell`/`Button`/`TagPill`/`BackButton`/icon set, `firebase.json`, Tailwind tokens) — binding. SP02 (content pipeline) — consumes `projects`, `research`, `Project`/`Research` types, `ContentBody`, `markdownComponents`, and the `liveMode()` contract verbatim. SP03 (landing + timeline) — reuses `ProjectCard` **verbatim, unforked**, per SP03's explicit design-for-reuse.
**Consumed by:** SP06 (Sharing/SEO & sample project) — builds `sample-project`'s hosted `/live` page directly on the registry/directory convention this PRD defines; also consumes `RouteMeta` on this sub-project's pages (assumed, not designed here — see §4.7 and §9).
**Also resolves:** SP05 §9's "no forms" mechanical-check item (previously open), which was explicitly blocked on this PRD's hosted-`/live` directory convention.
**Source of truth:** `/root/projects/tejitpabari/.dev/website-revamp/BRIEF.md` — every decision cited as "brief §N" is settled there and not re-opened here.

---

## 1. Problem

Three real gaps exist today, verified directly rather than assumed:

1. **No listing page exists anywhere, in either reference.** `_reference-techfolio` (the visual-system source) has no `/projects` route at all — confirmed by directory listing (`app/projects/[slug]/` exists; there is no sibling `app/projects/page.tsx`) — its homepage grid is the *only* listing, and it has no search. The current Gatsby site's `src/pages/projects.js` and `research.js` both render every item through one generic `Writeup`/`WriteupItem` component (`src/components/common/writeup.js`, read in full) — a single unfiltered vertical stack of cards with no per-item route, no search, and no tag filter. So the listing pages, `SearchFilter`, and both detail templates are new work in this rewrite, not ports of anything that already exists.
2. **Techfolio's own project detail page is the exact anti-pattern the brief calls out for replacement.** `_reference-techfolio/app/projects/[slug]/page.tsx` is confirmed at **1,184 lines** — four bespoke, hand-written layouts (one per project, gated by `if (params.slug === "...")` branches, not data-driven), with card images kept in a second lookup table keyed by title string, and `Montserrat` re-loaded via `next/font/google` a second time in this same file (SP01 §4.5 already documents this exact duplication and fixes it at the app-shell level). None of that pattern is portable; this PRD replaces it with one genuinely data-driven template per collection.
3. **The `/projects/<slug>/live` dual-mode route is a real routing decision, deliberately left to this sub-project.** SP01 registers the route shape with a placeholder page and a `getStaticPaths` that (as shipped) enumerates *every* project slug, not just the ones that actually resolve to something (SP01 §4.7). SP02 defines the redirect-vs-hosted *signal* (`Project.liveUrl?`) precisely but explicitly stops there (SP02 §4.7): "SP04's design, not built here." SP05 needs a directory convention from this PRD before it can turn its "no forms" code comment into an actual mechanical check (SP05 §4.7, flagged as open there, blocked on this document). This PRD is where the redirect mechanism, the hosted-page registry, and the resulting mechanical check all get decided.

None of SP01/SP02/SP03/SP05's contracts are renegotiated here — this is the concrete design for what fills the seams they already left open for this sub-project specifically.

## 2. Goals

- `/projects` and `/research`: `BackButton`, one shared `SearchFilter` (fuzzy search + tag filter), a `ProjectCard` grid — reusing SP03's `ProjectCard` with zero modification.
- A precise Fuse.js configuration (keys, weights, threshold), a stated and justified position on indexing `body`, a stated AND-composition rule between tag filter and search, a debounced `search_query` analytics call matching SP05's exact signature, and a recommended, justified answer on URL-reflected filter state.
- One data-driven detail template per collection (`ProjectDetailPage`, `ResearchDetailPage`), sharing a `DetailHeader` and `LinksRow` component between them (the truly collection-agnostic pieces), each still counting as "one template per collection" in the brief's sense — every project renders through the same `ProjectDetailPage` code path, every research item through the same `ResearchDetailPage` code path. Both must render correctly for an item with an empty `body`.
- A concrete, resolved `/projects/<slug>/live` dual-mode contract: a real HTTP-level redirect as the primary mechanism (closing SP02's `[DEFERRED]` item), a client-side fallback for local dev and defense-in-depth, and a `src/pages/live/` directory + registry convention for hosted mini-projects — the convention SP05 is blocked on.
- The `getStaticPaths` fix to SP01's `/live` route registration (narrowing it from "every project" to "projects that actually resolve to something"), and the resulting `npm run check:no-forms` script that closes SP05's previously open mechanical-check item.
- A stated build-isolation mitigation for hosted mini-projects, consistent with the brief's own framing that full isolation is a later, separate project.
- Every `trackEvent` call site this sub-project introduces, using SP05's authoritative signature — and an explicit flag where SP03's already-shipped call sites diverge from it.
- Resolution of SP03's previously open item on whether Research cards populate `externalHref`.

## 3. Non-Goals

- `ProjectCard` itself, the landing page, the timeline, Hero/About/Contact — SP03's scope, consumed as-is.
- The frontmatter contract, loaders, validation, `ContentBody`, `markdownComponents`, `featured.ts` — SP02's scope, consumed as-is.
- `ConsentContext`, `trackEvent`'s implementation, `/privacy`/`/terms` copy — SP05's scope. This PRD states call sites against SP05's already-shipped signature.
- `RouteMeta`, OG image generation, the sitemap, and `sample-project`'s actual content/hosted page — SP06's scope. This PRD designs the mechanism SP06's `sample-project` plugs into and states the `RouteMeta` usage as a consumed assumption.
- True build-isolation for hosted mini-projects (a separately bundled/deployed micro-frontend, iframe sandboxing, etc.) — the brief's own §5 explicitly frames this as future, separate work; this PRD states a mitigation direction only, per the task's own scope.
- A CMS, admin UI, or any authoring tool. Unchanged initiative non-goal.
- Deciding real `liveUrl` values, project dates, or copy — SP07's scope; this PRD is written against SP07's tables (§4.1 there) but doesn't re-decide any of them.

---

## 4. Architecture Decisions

### 4.1 File map

```
src/
├── hooks/
│   └── useCollectionFilter.ts     # NEW — shared search+tag+URL-sync+analytics logic
├── components/
│   ├── SearchFilter.tsx           # NEW — dumb UI: search input + tag pills, collection-agnostic
│   ├── EmptyState.tsx             # NEW — dumb UI: no-results / no-content states
│   ├── DetailHeader.tsx           # NEW — shared header block (image, title, status?, tags)
│   ├── LinksRow.tsx               # NEW — shared links[] row + optional "Open Live" CTA
│   └── LiveRedirectFallback.tsx   # NEW — client-side redirect UI + the live_redirect tracking call
├── pages/
│   ├── ProjectsPage.tsx           # REWRITTEN (SP01 placeholder → real listing)
│   ├── ResearchPage.tsx           # REWRITTEN
│   ├── ProjectDetailPage.tsx      # REWRITTEN
│   ├── ResearchDetailPage.tsx     # REWRITTEN
│   ├── ProjectLivePage.tsx        # REWRITTEN — dual-mode dispatch
│   └── live/
│       ├── registry.ts            # NEW — HOSTED_LIVE_PAGES map + cross-check + projectLiveSlugs export
│       └── sample-project.tsx     # NOT built here — SP06-owned; registry ships empty until SP06 lands
├── routes.tsx                     # MODIFIED (SP01-owned file) — /live getStaticPaths narrowed, §4.6
└── vite.config.ts                 # MODIFIED (SP01-owned file) — adds liveRedirectsPlugin(), §4.6

scripts/
└── check-no-forms.sh              # NEW — closes SP05 §9's previously open mechanical-check item
```

Everything under `src/pages/live/` and `scripts/check-no-forms.sh` is new territory this PRD owns outright. `routes.tsx` and `vite.config.ts` are SP01-owned files this PRD edits directly, in exactly the same spirit SP01 itself documents for SP04 ("SP04 decides how the per-slug `liveUrl` frontmatter reaches [`ProjectLivePage`] — not designed here," SP01 §4.7) and the same pattern SP05 already used to edit `PageShell.tsx`/`Footer.tsx` per SP01's own documented hand-offs.

### 4.2 `/projects` and `/research` — one shared hook, two thin pages

**Decision: one shared hook (`useCollectionFilter`) and two shared dumb UI components (`SearchFilter`, `EmptyState`), consumed by two separate, thin page components — not one fully generic `<CollectionListingPage collection="projects" />`.**

Justification: SP01 already registers `ProjectsPage` and `ResearchPage` as two distinct named route components in `routes.tsx` — collapsing them into one parameterized component would mean either threading per-collection heading text/empty-state copy through props anyway (barely less code than two thin wrappers) or hardcoding English strings inside a "generic" component (worse). The actual duplication risk — the search/filter *logic*, the Fuse config, the URL-sync, the debounced analytics call — is real and substantial, and that's exactly what's factored into one hook. This mirrors the brief's own reasoning for `ProjectCard` (one shared presentational contract, computed-by-caller data) applied to the filtering logic instead of a component.

**`useCollectionFilter<T>`** (`src/hooks/useCollectionFilter.ts`) — the one place Fuse, tag-filtering, URL state, and the `search_query` analytics call all live:

```ts
// src/hooks/useCollectionFilter.ts
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Fuse, { type IFuseOptions } from 'fuse.js';
import { useDebouncedValue } from '@/hooks/useDebouncedValue'; // ported from juno-landing-page, SP01-assumed (see §9)
import { trackEvent } from '@/lib/analytics'; // SP05

// Structural — Project and Research both satisfy this without either type
// importing from here. No new export SP02 has to add.
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
  threshold: 0.35,       // matches juno-landing-page's own ProjectsSection — permissive enough
  ignoreLocation: true,  // for a small catalogue that typos should still hit
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

  // Hydration-safe defaults, same idiom SP05's useContactMailto already
  // establishes: initial state matches what the build-time render produces
  // (empty query, no active tag) — the REAL ?q=/?tag= value is applied only
  // after mount, in the effect below. See §4.2's "why not read searchParams
  // synchronously" note for why this is deliberate, not an oversight.
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    const tag = searchParams.get('tag');
    if (q) setQuery(q);
    if (tag) setActiveTag(tag);
    // Deliberately empty deps — runs once, on mount, to adopt whatever the
    // URL said at first client render. Later user edits flow the other way
    // (state -> URL, below), so this effect re-running on every URL change
    // would fight that direction and isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debouncedQuery = useDebouncedValue(query, 200); // fast, UI-facing debounce

  const allTags = useMemo(() => Array.from(new Set(items.flatMap((i) => i.tags))).sort(), [items]);

  // 1. Tag filter applies to the FULL manifest first.
  const tagFiltered = useMemo(
    () => (activeTag ? items.filter((i) => i.tags.includes(activeTag)) : items),
    [items, activeTag],
  );

  // 2. Fuse is built from the tag-filtered set, so a query can only ever
  //    narrow WITHIN the active tag — tag and search compose as AND, never OR.
  const fuse = useMemo(() => new Fuse(tagFiltered, FUSE_OPTIONS), [tagFiltered]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return tagFiltered;
    return fuse.search(debouncedQuery).map((r) => r.item);
  }, [debouncedQuery, fuse, tagFiltered]);

  // URL sync — debounced value only (not every keystroke), `replace` so
  // filtering never spams browser history.
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

  // search_query — SP05's exact contract (name, params, 600ms, settled query
  // only). Fires on the RAW query (not debouncedQuery) per SP05's own
  // reference snippet, using its own independent 600ms timer.
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

**Why the URL-derived state is applied post-mount, not read synchronously in the `useState` initializer.** `/projects` and `/research` are static routes with exactly one prerendered HTML output each (no query-string variance in `getStaticPaths` — there's nothing to enumerate). If `useState(() => searchParams.get('q') ?? '')` read the real URL synchronously, a direct load of `/projects?q=maps` would have its **first client render already showing a filtered grid**, while the prerendered HTML on disk shows the full, unfiltered one — a genuine hydration mismatch (a different number of grid children), which React resolves by discarding and rebuilding that subtree, producing exactly the kind of unpredictable flash/warning this project has avoided everywhere else (SP05 §4.1/§4.2 solve the identical class of problem for the email link and the consent banner the same way: build-time-safe default, real value applied in an effect after mount). Applying the filter post-mount instead means a `?q=`-loaded URL shows the full grid for one frame, then narrows — a small, predictable, one-directional flash using an idiom this codebase already relies on elsewhere, not a new pattern.

**`SearchFilter`** (`src/components/SearchFilter.tsx`) — pure UI, no data logic, generalizing `juno-landing-page`'s `SearchBar` + `TagFilter` (read in full) into one component per the brief's own naming ("a shared `SearchFilter` (search box + tag filter)"):

```tsx
// src/components/SearchFilter.tsx
interface SearchFilterProps {
  query: string;
  onQueryChange: (v: string) => void;
  tags: string[];
  activeTag: string | null;
  onTagChange: (t: string | null) => void;
  resultCount: number;
  placeholder: string; // collection-specific copy, supplied by the caller
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

Reuses SP01's `TagPill` exactly as documented (its `active`/`onClick` mode was added by SP01 specifically for this consumer, SP01 §4.6). Single-select tag filtering (clicking an active tag clears it), matching `juno-landing-page`'s own `TagFilter` behavior — deliberate, not an oversight given multi-tagging exists on Research items: a 3-value vocabulary per collection stays legible as single-select, and an item carrying two tags is still reachable by filtering on either one. Flagged `[RESOLVED]` in §9 as overridable if the owner later wants multi-select.

**`EmptyState`** (`src/components/EmptyState.tsx`), parameterized by `itemLabel` instead of duplicated per collection:

```tsx
// src/components/EmptyState.tsx
interface EmptyStateProps {
  itemLabel: string; // "projects" | "research entries"
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

No "no items at all" variant (unlike `juno-landing-page`'s `EmptyState`, which has one) — both collections are non-empty at launch (10 projects, 5 research items per SP07), and nothing in this rewrite's scope ever ships a collection with zero items, so that state is dead code here, not a gap.

**Indexing `body` in Fuse — resolved, and the "larger client bundle" premise doesn't actually hold here.** The task framing weighs "better recall" against "larger client bundle on a prerendered site." Tracing the actual data flow: SP02's loaders use `import.meta.glob({ eager: true, query: '?raw' })` (SP02 §4.3) — every project's and research item's full `body` markdown is already resident in the `@/data` module graph, unconditionally, because that's how content becomes available to `vite-react-ssg`'s synchronous build-time render pass at all. `ProjectsPage`/`ResearchPage` already import `@/data` to render cards — the moment that import exists, the full `body` text for every item in the collection is already part of whatever JS chunk(s) reference `@/data`, whether or not Fuse ever touches it. Indexing `body` in Fuse therefore costs **Fuse's own in-memory index-construction time only** (trivial at ~15 total items across both collections) — not additional bytes over the wire beyond what SP02's architecture already ships. Given that, the recall benefit (a search for "BERT" surfaces Juno's and the flood-research write-up even though neither word appears in their short `description`) is close to free — resolved to index it, at a low `0.1` weight so an incidental body mention never outranks a real title/description/tag match. Flagged `[RESOLVED]` in §9 with this reasoning stated explicitly, since it corrects the premise of the trade-off as originally framed.

**Tag/search composition: AND, not OR** — stated once here, not per collection: an item must pass the active tag filter *and* the search query to appear in `results`. This matches `juno-landing-page`'s own `ProjectsSection` precedent exactly (tag filter narrows the manifest first; Fuse is built from that already-narrowed set) and is the only composition that makes "type to search within a tag you've already selected" behave the way a user would expect.

**Pages** — thin, collection-specific:

```tsx
// src/pages/ProjectsPage.tsx
import { BackButton } from '@/components/BackButton';
import { SearchFilter } from '@/components/SearchFilter';
import { EmptyState } from '@/components/EmptyState';
import { ProjectCard } from '@/components/ProjectCard'; // SP03, verbatim
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
          query={query}
          onQueryChange={setQuery}
          tags={allTags}
          activeTag={activeTag}
          onTagChange={setActiveTag}
          resultCount={results.length}
          placeholder="Search projects by name, description, or tag"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.length === 0 ? (
          <EmptyState
            itemLabel="projects"
            query={query}
            activeTag={activeTag}
            onClear={() => { setQuery(''); setActiveTag(null); }}
          />
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
                  context: 'content_external_link', // generalized enum value — SP05 §4.4/§9, SP04 §9
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

```tsx
// src/pages/ResearchPage.tsx — identical shape, three deliberate differences
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
          query={query}
          onQueryChange={setQuery}
          tags={allTags}
          activeTag={activeTag}
          onTagChange={setActiveTag}
          resultCount={results.length}
          placeholder="Search research by title, topic, or tag"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.length === 0 ? (
          <EmptyState
            itemLabel="research entries"
            query={query}
            activeTag={activeTag}
            onClear={() => { setQuery(''); setActiveTag(null); }}
          />
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
              // omitted. See §4.3 for the resolved reasoning (previously open in SP03).
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

Grid: `xl:grid-cols-3` here versus SP03's featured section's `xl:grid-cols-4` — a deliberate, cosmetic difference (this grid can run to 10+ items and reads better slightly wider per card at full width) — flagged as a judgment call, not a contract, in §9.

### 4.3 Resolving SP03's open item: Research cards never populate `externalHref`

SP03 §4.3 flagged this explicitly as SP04's call to make ("This PRD recommends omitting it entirely for Research... but doesn't bind SP04 to that call — SP04's own PRD should state its decision explicitly"). **Resolved: Research cards never pass `externalHref`/`externalLabel`/`onExternalClick` to `ProjectCard`, full stop** — visible directly in `ResearchPage.tsx` above. Reasoning, stated once: `ProjectCard`'s external-icon affordance promises "here's a live tool, try it now" (it renders `target="_blank"`, opens instantly on click, sits on top of the image like a shortcut button). A research item's `links[]` are citations — a pre-print, a project report, a ResearchGate page — none of which is a "try it now" destination, and SP02 §4.4.3 dropped `liveUrl` from `Research` for the identical reason ("no route ever reads a research item's `liveUrl`"). Reusing the same icon for a citation link would visually promise something the click doesn't deliver. Citations get their due prominence instead on the research detail page's `LinksRow` (§4.5), where a labeled link ("Pre-print paper," "AGU Abstract") is honest about what it is, rather than compressed into an icon that implies something else.

### 4.4 `DetailHeader` and `LinksRow` — the shared pieces between two still-separate templates

**The brief's own instruction is "one data-driven template per collection," not "one template for both collections."** This matters for exactly this sub-project: the anti-pattern being replaced (techfolio's four bespoke *per-project* layouts) is about **one page per item within a collection**, not about the boundary between Projects and Research — so "data-driven" here means "every project renders through the same `ProjectDetailPage` code path, driven entirely by that project's data, with zero per-slug branching," which both templates below satisfy independently. Where genuine, collection-agnostic duplication exists (the header block, the links row), it's factored into two small shared components — the same discipline SP03 already applied to `ProjectCard` — while the two *page* components stay separate, because Projects needs an "Open Live" affordance Research never has, and merging them would just reintroduce a collection-conditional branch inside one component instead of two clean ones.

**`DetailHeader`** (`src/components/DetailHeader.tsx`) — image, title, status pill (zero layout impact when absent, same technique as `ProjectCard`), tags:

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

Same "no reserved space" guarantee as `ProjectCard` (SP03 §4.3): the status pill is an absolute overlay on the image, never a layout element, so an item with no `status` renders the identical header minus the pill — nothing shifts.

**`LinksRow`** (`src/components/LinksRow.tsx`) — the `links[]` row "near the top," per brief §2, plus an optional internal "Open Live" CTA (Projects only):

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
   *  a liveUrl OR a hosted-page registration (see §4.6). Research never
   *  passes this; ResearchDetailPage doesn't import LinksRow with it at all. */
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

**`context: 'content_external_link'` — resolved, covering both collections' `LinksRow` entries (§9).** SP05's `outbound_click` context enum originally had no research-shaped option (`'project_external_link' | 'live_redirect' | 'hero_social' | 'contact_social'`) — reusing the Projects-named value for Research's citation links was flagged as a naming mismatch worth generalizing. Resolved rather than deferred: renaming an analytics enum value after data has been collected against it is strictly more expensive than renaming it now, before a single event has fired. SP05 §4.4's event catalogue is updated in the same pass so the two stay in sync — the enum is now `'content_external_link' | 'live_redirect' | 'hero_social' | 'contact_social'`.

**Why the "Open Live" CTA links to the internal `/projects/<slug>/live` path, not directly to `project.liveUrl` — a deliberate, stated difference from `ProjectCard`'s external icon.** SP03's `ProjectCard` (already shipped, not reopened here) passes `externalHref={project.liveUrl}` directly — the card's icon is explicitly described in the brief as "a small external-link affordance as a shortcut," so skipping the `/live` indirection there is correct: it's a quick-click convenience for someone scanning a grid. The detail page's CTA is different in kind, not just placement — it's the page's primary "go try it" action, and the entire reason `/projects/<slug>/live` exists as a stable, on-domain, ownable URL (brief §1: "become the place he hosts small public projects under his own domain") is defeated if nothing in the app ever actually points at it. Routing this one CTA through `/live` means: the URL that ends up in someone's browser address bar, in a screenshot, or copy-pasted into a message is always the brand-owned one, and if the owner ever moves where a project is actually hosted (edits `liveUrl` in frontmatter), every reference to it everywhere on the site that goes through this CTA updates automatically with zero code change. This is not a contradiction with the card's behavior — it's two different affordances (quick shortcut vs. primary action) making two different, individually correct calls, stated explicitly here so it doesn't read as an inconsistency during review.

### 4.5 Detail templates

**`ProjectDetailPage`** (`src/pages/ProjectDetailPage.tsx`):

```tsx
// src/pages/ProjectDetailPage.tsx
import { useParams } from 'react-router-dom';
import { BackButton } from '@/components/BackButton';
import { DetailHeader } from '@/components/DetailHeader';
import { LinksRow } from '@/components/LinksRow';
import { ContentBody } from '@/data/ContentBody'; // SP02
import { RouteMeta } from '@/components/RouteMeta'; // SP06 — assumed shape, see §9
import { projects } from '@/data';
import { NotFoundPage } from './NotFoundPage';
import { hasLiveRoute } from './live/registry';

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const project = projects.find((p) => p.slug === slug);

  // Unreachable via getStaticPaths (only real slugs are prerendered), but a
  // hand-edited/typo'd URL can still hit this client-side — reuse SP01's
  // real NotFoundPage rather than a second bespoke 404, unlike
  // juno-landing-page's own inline ProjectNotFound (a reasonable
  // simplification now that a real, non-placeholder 404 page exists to reuse).
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
          the card grid) — corrected per SP06 §4.5/§9, which caught this
          sub-project's own earlier draft passing the raw frontmatter image
          straight to RouteMeta, defeating SP06's OG-card generation entirely. */}
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

**`ResearchDetailPage`** (`src/pages/ResearchDetailPage.tsx`) — identical shape, no `liveHref` ever computed (Research has no `/live` concept at all — no import from `./live/registry`, no conditional to get wrong):

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
      {/* image is the build-generated OG card path, NOT item.image (the
          frontmatter placeholder/thumbnail used below in DetailHeader) —
          corrected per SP06 §4.5/§9, same fix as ProjectDetailPage above. */}
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

**Empty-`body` correctness, verified by construction, not by a special case.** `description` renders unconditionally (both templates render it as a plain paragraph immediately after the header). `LinksRow` returns `null` if there are truly zero links and no live route — otherwise renders whatever it has. `ContentBody` (SP02 §4.5.3) already returns `null` for an empty/whitespace-only `body`. Stack these three and an item with `description` + `links` but no `body` (e.g. Med-Doc Tracker, Clip-Verse, and 6 of the 10 launch projects, per SP07 §4.1) renders: header → description → links row → nothing. No empty `<div>`, no "Read more" dead end, no visual gap where the body would have gone — exactly the brief's required behavior, achieved because every piece in the stack independently degrades to rendering nothing rather than the template needing an `{project.body && ...}` branch of its own.

### 4.6 The `/projects/<slug>/live` dual-mode contract — resolved

**Redirect mechanism: a real HTTP-level redirect via a generated `firebase.json` `redirects` entry, with a client-side fallback for local dev and defense-in-depth. This closes SP02 §9's `[DEFERRED]` item.**

The task's own framing states the stakes precisely: a client-side-only redirect on a prerendered page means a visible flash for a real visitor and a **wrong** `og:` preview if anyone shares the `/live` URL directly (a crawler that doesn't execute JS sees whatever `RouteMeta` put in that page's static `<head>` — this site's own content, not the destination's). An HTTP-level redirect avoids both: it fires before any HTML is served, so a crawler hitting `/projects/juno/live` is redirected straight to `app.meetjuno.health` and previews *that* page's own OG tags, which is the only preview that's actually correct for a link pointing at Juno.

**Why generation, not a hand-maintained `redirects` array in `firebase.json`.** Firebase Hosting's `redirects` array requires one static entry per destination — a single wildcard rule (`/projects/:slug/live` → some templated destination) can't work here because each project's `liveUrl` is an unrelated, arbitrary external URL, not a predictable function of the slug. That means either hand-maintaining a second list of `slug → liveUrl` pairs inside `firebase.json`, restated independently of the frontmatter that already declares it — exactly the "second place that can silently drift" failure mode SP02 repeatedly designs against elsewhere (the slug/filename-agreement check, `featured.ts`'s single-source-of-truth array) — or generating it from the one place `liveUrl` is actually declared. Generation is the only choice consistent with this project's own established discipline.

**Mechanism — a Vite plugin, `vite.config.ts` (SP01-owned, edited here), mirroring `juno-landing-page`'s own `sitemapPlugin` precedent exactly**, including its stated reason for an *independent* filesystem scan rather than importing `@/data`:

```ts
// vite.config.ts — SP04 adds this plugin to SP01's existing config; nothing
// else in the file changes.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import matter from 'gray-matter';

const PROJECTS_DIR = path.resolve(__dirname, 'src/content/projects');

// Independent of src/data/projects.ts on purpose — same reasoning
// juno-landing-page's own sitemapPlugin documents: import.meta.glob is a
// Vite *application*-build-pipeline macro, not guaranteed to resolve from
// vite.config.ts's own lighter esbuild-based load path. This plugin does its
// own small fs + gray-matter scan instead. It does NOT re-validate
// frontmatter — the main build's loader (SP02) already fails loudly on bad
// content before this plugin's closeBundle runs.
function readLiveUrls(): { slug: string; liveUrl: string }[] {
  return readdirSync(PROJECTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => matter(readFileSync(path.join(PROJECTS_DIR, f), 'utf-8')).data)
    .filter((data): data is { slug: string; liveUrl: string } => typeof data.liveUrl === 'string')
    .map(({ slug, liveUrl }) => ({ slug, liveUrl }));
}

function liveRedirectsPlugin(): Plugin {
  return {
    name: 'live-redirects',
    closeBundle() {
      const entries = readLiveUrls();
      const firebaseJsonPath = path.resolve(__dirname, 'firebase.json');
      const config = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'));
      config.hosting.redirects = entries.map(({ slug, liveUrl }) => ({
        source: `/projects/${slug}/live`,
        destination: liveUrl,
        type: 302, // temporary — liveUrl is content the owner can change; a
                   // permanent 301 risks a browser/crawler caching a stale
                   // destination past the next content edit.
      }));
      writeFileSync(firebaseJsonPath, JSON.stringify(config, null, 2) + '\n');
    },
  };
}

export default defineConfig({
  plugins: [react(), liveRedirectsPlugin() /* SP06 adds its own sitemapPlugin() alongside this */],
  // ...rest of SP01's config unchanged
});
```

Firebase Hosting evaluates `redirects` **before** `rewrites` (confirmed against Firebase's documented request-handling order), so a generated redirect entry for `/projects/juno/live` fires before the catch-all `rewrites` entry (SP01 §4.9) ever gets a chance to serve the prerendered `/index.html` shell — hosted-mode and redirect-mode traffic never collide at the Hosting layer. This only touches `hosting.redirects`; every other key SP01 wrote (`public`, `cleanUrls`, `ignore`, `headers`) is read and rewritten byte-for-byte unchanged. **Because `firebase.json` isn't gitignored, running `npm run build` locally leaves the generated `redirects` block as an uncommitted working-tree diff** unless someone deliberately commits it — a real, accepted quirk of running the build by hand, flagged in §7/§9. **In CI (SP08's pipeline, `08-ci-deploy-pipeline` §4.2–§4.4), this doesn't arise at all**: `npm run build` runs inside the workflow's own ephemeral checkout, `closeBundle` writes the generated `redirects` into that same ephemeral `firebase.json`, and `FirebaseExtended/action-hosting-deploy@v0` reads it directly from that same working directory in the same job — the generated block is consumed immediately and never needs to be committed back to the repo, since the runner's checkout is discarded once the job ends. The "committed after a build" framing above describes a local, manual `firebase deploy` only; the production deploy path (SP08's merge workflow) never depends on it being committed.

**Client-side fallback — `LiveRedirectFallback`, defense-in-depth only, not the primary mechanism.** Two real reasons it still exists: (1) `vite-react-ssg dev`'s local dev server doesn't go through Firebase Hosting's redirect layer at all, so this is what actually fires during local development; (2) if the redirect-generation step is ever skipped before a deploy (a forgotten `npm run build`, a manual `firebase deploy` from stale output), the prerendered page itself must still not be a dead end.

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
    // The single point of truth for the live_redirect event, regardless of
    // how the visitor got here (direct URL, a shared link, this fallback
    // firing after the Hosting-level redirect was skipped). GA4's gtag.js
    // sends events via navigator.sendBeacon, which is purpose-built to
    // survive the immediate unload below — no artificial delay needed.
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

**`ProjectLivePage`** (`src/pages/ProjectLivePage.tsx`) — the dispatch point, implementing SP02 §4.7's `liveMode()` contract directly:

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
  // getStaticPaths (below) never generates this path for such a slug.
  return <NotFoundPage />;
}
```

### 4.7 The hosted mini-project convention — `src/pages/live/`

**This is the convention SP05 §9 is blocked on.** One file per hosted mini-project, one registry, both under `src/pages/live/`:

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
import { projects } from '@/data';

// SP06 adds the 'sample-project' entry when it lands; empty until then,
// exactly like SP01's own projectSlugs/researchSlugs placeholders.
export const HOSTED_LIVE_PAGES: Record<string, ComponentType> = {};

const HOSTED_SLUGS = Object.keys(HOSTED_LIVE_PAGES);

// Cross-check, eager, module-load time — same "fail loud, name the file"
// ethos as SP02's validateInternalLinks(). Runs the moment anything imports
// this module (routes.tsx always does), so a bad wiring fails the build
// immediately, not lazily when someone happens to visit the route.
for (const slug of HOSTED_SLUGS) {
  const project = projects.find((p) => p.slug === slug);
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

/** The union getStaticPaths needs: every slug that resolves to SOMETHING at
 *  /projects/<slug>/live — either mode. A project with neither gets no /live
 *  route at all, per SP02 §4.7 ("no live tool destination" is a valid,
 *  expected state, not an error). */
export const projectLiveSlugs: string[] = projects
  .filter((p) => p.liveUrl || HOSTED_SLUGS.includes(p.slug))
  .map((p) => p.slug);

/** Used by ProjectDetailPage's LinksRow to decide whether to render the
 *  "Open Live" CTA at all. */
export function hasLiveRoute(slug: string): boolean {
  return projectLiveSlugs.includes(slug);
}
```

SP06's `sample-project` plugs in with exactly two additions once it lands: `src/pages/live/sample-project.tsx` (its own component — SP06's content, not built here) and one line in `HOSTED_LIVE_PAGES` above. **Consequence for SP06, stated as an assumption, not designed here:** the "prints the current date-time" page is itself prerendered like every other route (its `getStaticPaths` entry comes from `projectLiveSlugs` above) — a naive `new Date()` call at render time bakes in the *build* timestamp, not the visitor's real time. SP06's component needs the identical hydration-safe pattern SP05 already established for the email link and consent state: render a build-time-safe placeholder, then a `useEffect` (with `setInterval` for a live clock) supplies the real, current time post-mount. Flagged here because it's a direct mechanical consequence of this routing design, not a redesign of SP06's page.

**SP01's `routes.tsx` — modified, not just consumed.** SP01 shipped `getStaticPaths: () => projectSlugs.map((slug) => \`projects/${slug}/live\`)` — every project, unconditionally. This PRD narrows it to the actual resolvable set, per SP02 §4.7's own explicit recommendation:

```tsx
// src/routes.tsx — SP04 edits this SP01-owned file (SP01 §4.7 explicitly
// defers this exact decision to SP04). Only the getStaticPaths line and the
// import change; nothing else in this route entry moves.
import { projectLiveSlugs } from '@/pages/live/registry';

// ...
{
  path: 'projects/:slug/live',
  element: <ProjectLivePage />,
  getStaticPaths: () => projectLiveSlugs.map((slug) => `projects/${slug}/live`),
  // FRAGILITY GUARD (see /privacy, /terms — "no forms"): every hosted (i.e.
  // non-redirect) /projects/<slug>/live page — anything registered in
  // src/pages/live/registry.ts's HOSTED_LIVE_PAGES — must currently accept
  // ZERO user input. Both legal pages state plainly that this domain has no
  // forms as of their last-updated date. The moment a hosted /live project
  // adds an <input>, <textarea>, <form>, a file upload, or anything else a
  // visitor can type into and submit, that claim is false and BOTH
  // src/pages/PrivacyPage.tsx and src/pages/TermsPage.tsx (their "no forms" /
  // "What this site does not do" sections, plus each page's LAST_UPDATED)
  // must be revised BEFORE that project ships, not after. `npm run
  // check:no-forms` (scripts/check-no-forms.sh) mechanically checks this
  // directory — run it before adding any new HOSTED_LIVE_PAGES entry.
  // See PRD 05 §4.7 and PRD 04 §4.8 for the full reasoning.
},
```

This is the same comment SP05 already wrote at this exact site (SP05 §4.7), reproduced with one addition: a pointer to the now-real mechanical check below, closing SP05's own previously open item that this exact narrowing was blocked on.

### 4.8 The mechanical "no forms" check — closes SP05's previously open item

Because hosted mini-projects now live exclusively under `src/pages/live/` (never mixed with `SearchFilter`'s own input, which lives in `src/components/`), a scoped grep against that one directory is precise with zero false positives — the exact condition SP05 §4.7 stated was missing:

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

Wired as `"check:no-forms": "bash scripts/check-no-forms.sh"` in `package.json`, chainable with SP02's own pre-launch gate: `"check:launch": "tsx scripts/check-launch-content.ts && npm run check:no-forms"`. **Now a CI-enforced gate, not only a manually-run pre-ship habit.** The owner adopted CI after this section was first written (brief §4's amendment); SP08 (`08-ci-deploy-pipeline` §4.2–§4.4) runs `npm run check:no-forms` as its own separately named step on every PR and every push to `main` — in addition to running a second time, transitively, inside `check:launch`'s own composition above (SP08 §4.10 notes and accepts this small redundancy explicitly, since a standalone step names a no-forms violation immediately rather than only as a sub-line inside `check:launch`'s combined output). A hosted `/live` project that adds input-accepting markup without updating `/privacy`/`/terms` first now fails the build automatically — it can no longer merge or deploy silently on the strength of nobody remembering to run this script by hand.

### 4.9 Build-isolation for hosted mini-projects — mitigation direction, not a solution

The brief's own §5 names this as the likeliest thing to bite later: hosting arbitrary small projects inside the portfolio app couples their failures to the whole site's build. This PRD does not solve that (the brief explicitly frames full isolation — a separately bundled/deployed micro-frontend, an iframe sandbox — as later, separate work), but the directory convention in §4.7 makes three concrete things possible that weren't before:

1. **Deletion is a two-line operation, not an archaeology project.** Removing a broken hosted mini-project is: delete `src/pages/live/<slug>.tsx`, remove its one line from `HOSTED_LIVE_PAGES`. The registry's own cross-check (§4.7) immediately flags any inconsistency left behind (an orphaned content file, a dangling registry entry) by name.
2. **A required smoke test per hosted page catches runtime breakage early, named.** Every file added under `src/pages/live/` ships with a same-named Vitest smoke test (`src/pages/live/<slug>.test.tsx`) asserting it renders without throwing. This doesn't achieve true build isolation — a broken hosted page still blocks the whole site's build until fixed, same as today — but it converts "an opaque prerender crash somewhere in a long build log" into one named failing test, matching the "fail loud, name the exact file" ethos SP02's content validators already establish. `sample-project`'s own eventual test is SP06's to write, following this convention.
3. **Minimal-dependency discipline is now a statable rule, not an unstated hope.** Because every hosted page is isolated to one file (plus whatever it imports), reviewing a new hosted-project PR for "does this pull in anything fragile" is a bounded diff, not a search across the whole app.

True per-route build/deploy isolation (so a broken mini-project literally can't block the rest of the site from deploying) is `[DEFERRED]` — see §9 — matching the brief's own explicit framing and the concrete test the brief itself proposes (ship `sample-project` first, deliberately break just its route, confirm the failure is caught by the smoke test in review before a second real hosted project is added).

---

## 5. API Change Summary

N/A. Fully static site, no backend/database/API anywhere in this initiative (brief non-goal, unchanged). The one thing resembling an "API" this sub-project introduces is the `liveMode`/registry contract (§4.6–§4.7), which is a build-time, in-repo contract between markdown frontmatter and a TypeScript object literal — not a network boundary.

---

## 6. Frontend Change Summary

| Type | Name | Path | Notes |
|---|---|---|---|
| New | `useCollectionFilter` | `src/hooks/useCollectionFilter.ts` | Fuse config, tag/search AND-composition, URL sync, `search_query` analytics |
| New | `SearchFilter` | `src/components/SearchFilter.tsx` | Dumb UI; generalizes `juno-landing-page`'s `SearchBar`+`TagFilter` into one component |
| New | `EmptyState` | `src/components/EmptyState.tsx` | `itemLabel`-parameterized, serves both collections |
| New | `DetailHeader` | `src/components/DetailHeader.tsx` | Shared header block; zero-layout-impact status pill, same technique as `ProjectCard` |
| New | `LinksRow` | `src/components/LinksRow.tsx` | Shared links row + optional "Open Live" CTA (Projects only) |
| New | `LiveRedirectFallback` | `src/components/LiveRedirectFallback.tsx` | Client-side redirect fallback; fires `live_redirect` `outbound_click` |
| Rewritten | `ProjectsPage` | `src/pages/ProjectsPage.tsx` | Real listing, replaces SP01 placeholder |
| Rewritten | `ResearchPage` | `src/pages/ResearchPage.tsx` | Real listing; never passes `externalHref` to `ProjectCard` |
| Rewritten | `ProjectDetailPage` | `src/pages/ProjectDetailPage.tsx` | Data-driven template; renders `LinksRow`'s `liveHref` when `hasLiveRoute()` |
| Rewritten | `ResearchDetailPage` | `src/pages/ResearchDetailPage.tsx` | Data-driven template; no `/live` concept at all |
| Rewritten | `ProjectLivePage` | `src/pages/ProjectLivePage.tsx` | Dual-mode dispatch: hosted registry → redirect fallback → 404 |
| New | `HOSTED_LIVE_PAGES`, `projectLiveSlugs`, `hasLiveRoute` | `src/pages/live/registry.ts` | The convention SP05 was blocked on; ships empty, SP06 adds one entry |
| New (SP06-owned content) | `sample-project.tsx` | `src/pages/live/sample-project.tsx` | Not built here; registry mechanism is |
| Modified (SP01-owned file) | `routes.tsx` | `src/routes.tsx` | `/live` `getStaticPaths` narrowed to `projectLiveSlugs`; fragility-guard comment updated |
| Modified (SP01-owned file) | `vite.config.ts` | `vite.config.ts` | Adds `liveRedirectsPlugin()`, generating `firebase.json`'s `hosting.redirects` |
| Modified (build artifact, generated) | `firebase.json` | `firebase.json` | `hosting.redirects` populated at build time; all other keys untouched |
| New (script) | `check-no-forms.sh` | `scripts/check-no-forms.sh` | Closes SP05 §9's previously open mechanical-check item |
| Consumed, not modified | `ProjectCard` | SP03 | Zero prop-shape or behavior changes |
| Consumed, not modified | `projects`, `research`, `ContentBody`, `markdownComponents`, `Link` type | SP02, via `@/data` | |
| Consumed, not modified | `Nav`, `Footer`, `PageShell`, `BackButton`, `TagPill`, icon set | SP01 | |
| Consumed, not modified | `trackEvent` | SP05, via `@/lib/analytics` | Using SP05's authoritative signature — see §9 for the SP03 divergence flagged |
| Consumed (assumed contract) | `RouteMeta` | SP06 | `<RouteMeta title description path image? />`, matching SP05's identical assumption. Detail-page call sites pass the generated OG card path (`/og/projects/<slug>.png`, `/og/research/<slug>.png`), not the frontmatter `image` — fixed per SP06 §4.5/§9, see §4.5 and §9. |

---

## 7. Testing

Sized like the sibling PRDs size theirs — targeted at the logic actually unique to this sub-project, not exhaustive:

- **`useCollectionFilter`** (`src/hooks/useCollectionFilter.test.ts`, fixture data, no real content): tag filter alone narrows correctly; search alone narrows correctly; tag + search compose as AND (a query that would match an item outside the active tag returns nothing); empty query with no active tag returns every item; `allTags` is derived from the full manifest and doesn't shrink as a filter narrows results (mirrors `juno-landing-page`'s own precedent test); the debounced `search_query` event fires once per settled (600ms-quiet) non-empty query, not per keystroke, with the correct `collection`/`query`/`result_count` params — and does **not** fire for an empty/whitespace query.
- **URL sync**: given a fixture wrapped in a `MemoryRouter` with an initial `?q=maps&tag=Health%20Tech` entry, `useCollectionFilter`'s returned `query`/`activeTag` reflect the URL values after the mount effect runs (not on the very first synchronous render — this is the deliberate post-mount timing from §4.2, worth pinning directly since it's easy to accidentally "fix" into a hydration-mismatch-prone synchronous read); typing updates the URL (debounced, via `replace`) without adding history entries (assert `history.length` doesn't grow across several keystrokes).
- **`SearchFilter`/`EmptyState`**: pure presentational — `SearchFilter` renders `resultCount` and calls the right callback on input/tag interactions; `EmptyState` renders the tag-only vs. query-only vs. both-active copy variants correctly and calls `onClear`.
- **`DetailHeader`**: status pill renders only when `status` is provided, and — the same claim `ProjectCard`'s own test already pins (SP03 §7) — confirms no extra DOM node/spacing exists when it's absent.
- **`LinksRow`**: renders `null` when both `links` is empty and `liveHref` is undefined; renders the "Open Live" CTA only when `liveHref` is provided; clicking an external link fires `outbound_click` with the correct `label`.
- **Detail-page empty-`body` rendering** (`ProjectDetailPage.test.tsx`, `ResearchDetailPage.test.tsx`): given a fixture item with `body: ''`, the page renders `description` and the links row but nothing from `ContentBody` (no stray empty wrapper `<div>` in the DOM) — this is the direct, mechanical proof of §4.5's "verified by construction" claim, not just an assertion in prose.
- **`registry.ts` cross-check**: a fixture registry entry for a slug with no matching project throws, naming the slug; an entry for a slug whose project also sets `liveUrl` throws, naming the conflict; `projectLiveSlugs` correctly unions liveUrl-bearing and hosted-registered slugs with no duplicates.
- **`ProjectLivePage` dispatch**: given a hosted-registered slug, renders that component; given a `liveUrl`-only slug, renders `LiveRedirectFallback`; given neither, renders `NotFoundPage`.
- **`LiveRedirectFallback`**: fires `trackEvent('outbound_click', { url, context: 'live_redirect', label })` exactly once on mount, then calls `window.location.replace` with the same `to` value (mock both; assert call order — tracking fires before/alongside the navigation call, not after, per the sendBeacon reasoning in §4.6).
- **`liveRedirectsPlugin` (vite.config.ts)**: given a fixture content directory with a mix of `liveUrl`-bearing and hosted-mode `.md` files, the generated `hosting.redirects` array contains exactly the expected `{source, destination, type: 302}` entries and leaves every other key in a fixture `firebase.json` byte-identical — run as a small standalone Node test (Vitest can import and invoke the plugin's `closeBundle` directly against a temp directory), not requiring a real `vite build`.
- **`check-no-forms.sh`**: a fixture `src/pages/live/`-shaped temp directory containing a file with a bare `<input>` makes the script exit nonzero; a directory with no such markup exits 0. Run via a small shell-invocation test or manually — either is acceptable given the script's own small surface.

**Manual QA checklist** (extends SP01/SP03's own, run once post-deploy):

1. Load `/projects`, type a known project title — the grid narrows to one card within ~200ms; clear the box — the grid returns to all 10 (at launch content).
2. Click a tag pill on `/projects` — grid narrows to that tag only; type a query that only matches an item *outside* that tag — grid goes to zero results with the tag-aware empty-state copy, not a false match.
3. Load `/projects?q=maps` directly (typed URL, not client navigation) — confirm the full grid renders for one frame, then narrows (the accepted, deliberate flash from §4.2), and confirm no React hydration-mismatch warning appears in the console.
4. On a project with `liveUrl` set, confirm the detail page's "Open Live" button URL is `/projects/<slug>/live`, and that clicking it lands you on the external destination via a real, fast HTTP redirect (check the Network tab for a 302, not a client-side render-then-navigate delay).
5. `View Source` (the literal HTTP response, not DevTools' rendered DOM) on a redirect-mode project's `/live` URL post-deploy — confirm the server response itself is the 302 redirect, never the app's static HTML shell.
6. Confirm `/projects/sample-project/live` (once SP06 lands it) renders the hosted page directly, with no redirect, and that its printed time is the *current* time on load, not a stale build timestamp.
7. Run `npm run check:no-forms` — passes on a clean checkout; manually add a scratch `<input>` inside `src/pages/live/`, confirm the script fails with the expected message, then revert.
8. Confirm a research item with two tags (e.g. Pill Recognition & Prescription Extraction — `Health`, `Machine Learning`, per SP07 §4.2) is reachable by filtering on either tag individually.

**Not worth building here:** end-to-end browser tests for the redirect's actual network behavior in production (covered by manual QA items 4–5, and genuinely requires a real deploy to verify Firebase's evaluation order, not something a local test harness can simulate faithfully); visual regression tooling (no established baseline yet); testing Fuse.js's own fuzzy-matching correctness (already exercised and trusted via `juno-landing-page`'s own `search.test.ts`, read directly for this PRD — no reason to re-derive that library's behavior here).

---

## 8. Manual Intervention Required From You

1. **Confirm the "Open Live" CTA routing through `/projects/<slug>/live` (§4.4) rather than directly to `liveUrl`** is the behavior you want on the detail page — this PRD's reasoning is that the internal URL is the stable, ownable one worth surfacing prominently, but it's a judgment call, not a brief-mandated exact behavior.
2. **Confirm single-select tag filtering** (§4.2) is sufficient at today's 3-tag-per-collection vocabulary, or say if you'd rather support selecting multiple tags at once (a small, well-scoped follow-up if so — `activeTag: string | null` becomes `activeTags: string[]`, `.includes()` becomes `.some()`).
3. **Decide per real project, when it's built, whether it needs a hosted `/live` page at all** beyond `sample-project` — this PRD's registry mechanism supports it, but nothing in today's content inventory (SP07 §4.1) calls for one; that's an ordinary, future content decision, not something this PRD blocks on.
4. **Nothing else in this sub-project is owner-blocked.** The Fuse config, the URL-state design, the redirect mechanism, and the hosted-project convention are all specified precisely enough for implementation to proceed without further input from you.

---

## 9. Open Questions & Decisions

- `[RESOLVED: one shared hook + two dumb shared UI components, two thin per-collection pages]` — not one fully generic listing component; see §4.2 for the reasoning (SP01 already registers two named route components; the real duplication risk is in the filtering logic, which is what's actually shared).
- `[RESOLVED: index `body` in Fuse, at low weight 0.1]` — the "larger client bundle" premise doesn't hold given SP02's `import.meta.glob({eager:true})` architecture already ships every item's full `body` to any page importing `@/data`; the recall benefit is close to free. See §4.2.
- `[RESOLVED: tag filter and search compose as AND, tag filter applied first]` — matches `juno-landing-page`'s own proven `ProjectsSection` precedent exactly. See §4.2.
- `[RESOLVED: filter state IS reflected in the URL (`?q=`/`?tag=`), applied post-mount rather than read synchronously]` — makes a filtered view linkable/shareable (recruiter use case named in the brief's own audience description, §1) at the cost of one deliberate, predictable post-mount flash on a direct-loaded filtered URL, using the same hydration-safe idiom SP05 already established for the email link and consent banner. Recommended and justified in §4.2, not left as a coin flip.
- `[RESOLVED: Research cards never populate `externalHref`]` — closes SP03 §9's previously open item exactly as SP03's own PRD recommended but explicitly left to SP04 to bind. See §4.3.
- `[RESOLVED: `/projects/<slug>/live` uses a real HTTP-level redirect, generated into `firebase.json`'s `hosting.redirects` by a Vite `closeBundle` plugin, with a client-side fallback for local dev and defense-in-depth only]` — closes SP02 §9's `[DEFERRED]` item. Mirrors `juno-landing-page`'s own `sitemapPlugin` precedent (independent fs scan, not `import.meta.glob`, from `vite.config.ts`) exactly. See §4.6.
- `[RESOLVED: hosted mini-project convention is `src/pages/live/<slug>.tsx` + one line in `src/pages/live/registry.ts`'s `HOSTED_LIVE_PAGES`]` — closes SP05 §9's previously open item, which was explicitly blocked on this decision. The registry's own eager cross-check enforces redirect-XOR-hosted by construction. See §4.7.
- `[RESOLVED: the "no forms" mechanical check is `scripts/check-no-forms.sh`, a scoped grep against `src/pages/live/`]` — precise, zero-false-positive, made possible specifically by the directory convention above (SP05 §4.7 explicitly named this as the blocker). See §4.8.
- `[RESOLVED: `check:no-forms` is now enforced by SP08's CI pipeline as a separate, named step on every PR and every push to `main`, not only a manually-run script]` — the owner adopted CI after this PRD was first written (brief §4's amendment); SP08 (`08-ci-deploy-pipeline` §4.2–§4.4) wires it in directly. See §4.8's updated prose.
- `[RESOLVED: true build isolation for hosted mini-projects is not solved here]` — matches the brief's own explicit framing (§5) that this needs future, separate tooling (a micro-frontend/iframe architecture). This PRD's mitigation is: an isolated one-file-per-project convention (cheap to delete), a required smoke test per hosted page (fails loud and named, doesn't achieve true isolation), and a statable minimal-dependency review discipline. `[DEFERRED]` in the brief's own terms, not silently unaddressed.
- `[RESOLVED: SP03's `trackEvent` call sites now match SP05's authoritative `AnalyticsEventName` union]` — the sibling-PRD conflict flagged here is closed directly in SP03's own PRD (SP03 §4.2/§4.4/§4.5/§4.8/§4.9, §9): `outbound_link_click` renamed to `outbound_click` throughout, and the four events with no SP05 equivalent (`cta_click`, `see_all_projects_click`, `see_all_work_experience_click`, `email_click`) are no longer tracked, since none is part of the brief's own six tracked-event categories. SP05's `AnalyticsEventName` type was not widened — SP03's calls were fixed to match it, exactly as this PRD's own call sites already did.
- `[RESOLVED: the enum value is generalized to `'content_external_link'`, covering both collections' `LinksRow` entries]` — adopted rather than deferred, because renaming an analytics enum value after data has been collected against it is strictly more expensive than renaming it now, before a single event has fired. This PRD's §4.2/§4.4 call sites (the card's external-link icon and `LinksRow`) now emit `'content_external_link'`. SP05 §4.4's event catalogue is updated in the same pass so the two stay in sync. See §4.4.
- `[RESOLVED: `<RouteMeta title description path image? />`, with `title: string; description: string; path: string; image?: string`]` — SP06 now binds exactly this signature in its own PRD §4 and §9. The prop *signature* this PRD assumed is confirmed unchanged; the `image` *value* passed at this PRD's own call sites was not — see the next entry.
- `[RESOLVED: detail pages pass the generated OG card path to `RouteMeta`, not the frontmatter `image` — caught by SP06 §4.5]` — this PRD's original `ProjectDetailPage`/`ResearchDetailPage` snippets (§4.5) passed `image={project.image}` / `image={item.image}` directly to `RouteMeta` — the item's raw frontmatter value, which is the same Unsplash placeholder URL on all 15 launch content files (SP07 §4.6). That would have defeated SP06's entire OG-card generation pipeline (§4.3 there): every share preview would have rendered as the identical stock photo regardless of which project or research item was shared. Fixed in §4.5 to `image={`/og/projects/${project.slug}.png`}` and `image={`/og/research/${item.slug}.png`}` respectively — the build-generated card, not the frontmatter thumbnail. `DetailHeader`'s own `image` prop (the on-page hero image / card thumbnail) is unaffected and still reads `project.image`/`item.image` directly, unchanged.
- `[RESOLVED: SP01 ships `src/hooks/useDebouncedValue.ts`]` — ported verbatim from `juno-landing-page`, as this PRD already reproduces in §4.2. It's a four-line hook, and SP01 owns `src/hooks/`, so the file belongs there rather than being created ad hoc by whichever page happens to need it first. SP01's §4.3 directory structure and §6 change summary are updated in the same pass to list it.
- `[DEFERRED]` **Multi-select tag filtering.** Single-select matches `juno-landing-page`'s own proven precedent and today's 3-tag vocabulary; revisit only if the owner asks for it (§8, item 2) or the tag vocabulary grows enough that single-select feels limiting.
- `[DEFERRED]` **`xl:grid-cols-3` on `/projects`/`/research` versus SP03's `xl:grid-cols-4` on the landing page's featured grid** — a cosmetic, non-binding difference between two independent grids; easy to align later with no contract impact on either sub-project if the owner prefers visual consistency over the per-page reasoning given in §4.2.
