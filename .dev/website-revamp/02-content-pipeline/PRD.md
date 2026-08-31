# PRD — Sub-project 02: Content Pipeline

**Project:** tejitpabari.com rewrite (`vite-react-ssg` + Tailwind, static-prerendered, Firebase Hosting)
**Depends on:** SP01 (App shell, design system, deploy) — binding for file locations noted below (`tailwind.config`, `src/lib/isExternalUrl.ts`, `src/routes.tsx`, `PageShell`). SP01's PRD was not yet written at the time this PRD was authored; where this document assumes a specific SP01 file path, it is flagged as an assumption SP01 should confirm, not a dependency this PRD blocks on.
**Blocks:** SP03 (landing + work-experience timeline), SP04 (Projects & Research pages, `/live` dual-mode), SP06 (OG cards, sitemap, sample-project), SP07 (content authoring) — all four consume the contracts defined here.
**Reference brief:** `/root/projects/tejitpabari/.dev/website-revamp/BRIEF.md` §2 (Content model), §3 (Content model, Sharing/SEO), §6 (Content inventory). Nothing in that brief is re-litigated here; this PRD is the concrete implementation of §3's "Content model" subsection.

---

## 1. Problem

Every piece of real content on the current site — 10 projects, 5–6 research entries, 3 work-experience roles — lives as inline JS object literals inside three Gatsby page files (`src/pages/projects.js`, `src/pages/research.js`, `src/pages/work-experience.js`). There is no per-item identity beyond an array index, no frontmatter, no validation, and no way to link, share, or individually prerender a single project. The rewrite's entire premise — individually shareable project pages with real per-route `og:` tags a crawler that doesn't run JavaScript can read — requires content to exist as discrete, addressable, buildtime-readable files, not runtime-interpreted array literals baked into a page component.

This sub-project turns that inline-array content model into four content collections (three markdown-backed, one not — see §4.2) with:

1. An exact, typed frontmatter contract per collection, so every downstream page (SP03's timeline, SP04's grids and detail templates, SP06's OG cards and sitemap) reads a stable shape instead of guessing at an ad hoc object.
2. Build-time discovery and parsing (`import.meta.glob` + `gray-matter`), so content is a plain synchronous array by the time any route component or prerender pass touches it — no runtime fetch, no async content boundary that would leave a crawler looking at an empty shell.
3. Build-time validation strict enough that a typo'd `status` value, a mismatched slug, an unknown frontmatter key, or a stray internal link to a project that doesn't exist fails `npm run build` loudly, naming the exact file and field — not a silent broken card discovered after deploy.
4. A resolved answer to two genuinely under-specified areas the brief flags as owner-blocked, not content-pipeline-blocked: work-experience dates (§3.7, the `DRAFT_DATE` marker) and the `/projects/<slug>/live` redirect-vs-hosted contract (§4.4.5).

Three sibling sub-projects cannot start their own detail design until this contract is fixed: SP04 needs to know exactly what fields a Project/Research item exposes before it can build a shared card/filter component; SP06 needs to know exactly how to tell "redirect" from "hosted page" before it can build the `/live` route; SP07 cannot write a single content file until the schema this PRD defines is final. That ordering is why this is Phase 2, directly after SP01.

---

## 2. Goals

- Define the on-disk layout for four content collections and justify why three are markdown-backed and one (Legal) is not.
- Specify the exact frontmatter contract for Projects, Research, and Work Experience — types, required/optional fields, enum vocabularies, and how each collection's optional `status?` degrades to "no pill" rather than a default value.
- Specify a build-time loading mechanism using `import.meta.glob({ eager: true, query: '?raw' })` + `gray-matter`, mirroring `juno-landing-page`'s proven pattern, so content is a synchronously-available array by the time `vite-react-ssg`'s prerender pass or any `getStaticPaths` call needs it.
- Specify hand-rolled (not schema-library) build-time validation that fails loudly with a file-and-field-specific error message, covering: required-field presence, enum membership, array shape, slug/filename agreement, unknown-key rejection, and cross-collection internal-link validation.
- Specify `react-markdown` + `remark-gfm` + `@tailwindcss/typography` rendering configuration, including the palette-matched `prose` customization and the exact behavior for a body-less item.
- Specify `src/config/featured.ts` — the ordered, capped, validated, date-backfilled source of truth for the landing page's featured section.
- Design the `DRAFT_DATE` marker for work-experience placeholder dates, the exact placeholder values that produce the brief-mandated interim ordering, and the pre-launch check that blocks release while any remain.
- Resolve the `/projects/<slug>/live` redirect-vs-hosted contract precisely enough that SP04 can build the route without re-deriving the distinction.
- State exactly what this sub-project exports for SP04's route enumeration, SP06's OG/sitemap generation, and SP07's authoring contract.

## 3. Non-Goals

- Building any page, card, timeline, or route component. SP03/SP04 own rendering; this PRD owns data shape, loading, and validation only. Where a rendering detail is unavoidably part of the contract (e.g., what a body-less item's detail page must not break on), it is specified as a contract SP04 must satisfy, not as SP04's layout.
- Writing any actual content file. SP07 authors every `.md` file against the schema this PRD defines; the concrete file contents shown below (e.g. the work-experience placeholder-date example) are illustrative of what SP07 must produce, pinned precisely where correctness (ordering, the `DRAFT_DATE` marker) depends on exact values, not a claim that SP07's work is done here.
- The visual design of cards, tag pills, or the timeline (SP01/SP03's design-system and layout work). This PRD specifies the `prose` typography *tokens* needed for markdown body rendering because that is squarely a content-rendering concern, and no more.
- OG image generation, sitemap XML, or `RouteMeta` itself (SP06). This PRD specifies what SP06 needs to read from the content layer and flags one concrete implementation gotcha inherited from `juno-landing-page` (§4.3.4), but does not design SP06's mechanism.
- Legal page *copy* (SP05's job — privacy/terms text, GA4 consent wiring). This PRD only decides the *mechanism* Legal content loads through (§4.2).
- Deciding real project images, the real work-experience dates, or any other owner-only input. Those stay placeholders; see §8.
- A CMS, admin UI, or any editing workflow beyond "author a markdown file by hand." Explicitly out of scope per the brief's non-goals.

---

## 4. Architecture Decisions

### 4.1 Collection layout on disk

```
src/content/
├── projects/
│   ├── juno.md
│   ├── med-doc-tracker.md
│   ├── crunchy-filler.md
│   ├── clip-verse.md
│   ├── fabric-maps-mcp-server.md
│   ├── azure-maps-ai-assistant.md
│   ├── qgis-plugin-azure-maps-creator.md
│   ├── creator-onboarding-tool.md
│   ├── columbia-virtual-campus.md
│   ├── smarttest.md
│   └── sample-project.md          # SP06-owned demo, deletable — see §4.7
├── research/
│   ├── flood-event-extraction-bangladesh.md
│   ├── dvmm-lab.md
│   ├── incite-labs.md
│   ├── pill-recognition-prescription-extraction.md
│   └── solar-illumination-water-bottle.md
└── work-experience/
    ├── microsoft-fabric-maps.md
    └── jio-reliance-industries.md
    # The Programming for Entrepreneurs and Social Good role that would have
    # been the third file here is dropped from the site entirely — owner
    # decision, no dateable source exists for it anywhere. See §4.9, §9.

src/data/
├── shared.ts             # cross-collection validation helpers, Link type
├── projects.ts           # Project type, loader, `projects` export
├── research.ts           # Research type, loader, `research` export
├── workExperience.ts     # WorkExperience type, loader, `workExperience` export
├── index.ts              # aggregator: imports all three, runs cross-collection
│                          # internal-link validation as an eager side effect
├── markdownComponents.tsx  # shared react-markdown `components` override (link target)
└── ContentBody.tsx        # shared body-render helper (returns null on empty body)

src/config/
└── featured.ts            # FEATURED_PROJECT_SLUGS + computed, validated featuredProjects

src/pages/
├── PrivacyPage.tsx         # NOT markdown-backed — see §4.2. Content owned by SP05.
└── TermsPage.tsx           # NOT markdown-backed — see §4.2. Content owned by SP05.
```

One file per item, filename (minus `.md`) is the on-disk identity. No subdirectories per item, no companion asset folders — `image` is a plain URL string (§4.4.4), not a locally-vendored file, so there is nothing else to colocate yet.

**Assumption flagged for SP01:** the `src/data/` vs `src/content/` split, and the `@/` alias, mirror `juno-landing-page`'s existing `tsconfig`/`vite.config.ts` alias convention exactly. If SP01's toolchain setup uses a different alias or doesn't adopt TypeScript at all, every import path below needs a mechanical find-replace, not a redesign — the shapes and logic are unaffected.

### 4.2 Slug derivation, and why Legal isn't markdown

**Slug = filename, frontmatter `slug` must match it exactly, build fails otherwise.**

This is `juno-landing-page`'s exact, already-proven pattern (`src/data/projects.ts`, current implementation):

```ts
const filenameSlug = path.split('/').pop()!.replace(/\.md$/, '');
if (data.slug !== filenameSlug) {
  throw new Error(
    `${path}: frontmatter "slug: ${data.slug}" does not match filename "${filenameSlug}.md".`,
  );
}
```

**Why not derive the slug from the filename alone, with no frontmatter field at all?** Because a project's `slug` is quoted verbatim in three other places this content model can't fully police by construction: `src/config/featured.ts` (§4.6), any `links[{href}]` that points at another project internally (§4.5.3), and — eventually — hand-typed URLs the owner shares on LinkedIn. Requiring the frontmatter to restate the slug and checking it against the filename catches the specific, real bug class of copy-pasting an existing file as a starting point for a new one and forgetting to update the identity inside it — the file would otherwise silently overwrite/alias the original item's slug with no error at all (`import.meta.glob` keys by path, not by frontmatter slug, so two files could legally coexist with the same frontmatter `slug` and only the cross-collection duplicate-slug check in §4.5.4 would catch it — the filename/frontmatter agreement check is what makes that duplicate obvious immediately, at the single-file level, rather than only detectable once every file is loaded).

Work Experience gets **no `slug` frontmatter field or check** — there is no `/work-experience/<slug>` route (per brief, no detail pages), so there is nothing external ever quoting a work-experience item's identity by string. The filename alone is enough to give each item a stable React list key.

**Legal is not a markdown collection — it's two hand-written JSX pages, ported directly from `juno-landing-page`'s own working files.**

The brief (§3, Content model) explicitly leaves this open: *"plain markdown or hand-written JSX pages per the juno-landing-page pattern."* Checking what that pattern actually *is* settles it: `juno-landing-page/src/pages/PrivacyPage.tsx` and `TermsPage.tsx` are hand-written React components, not markdown files loaded through a parser — there is no `src/content/legal/*.md` in the reference repo at all. Three concrete reasons to follow that precedent rather than inventing a markdown path for Legal specifically:

1. **No enumeration need.** Projects and Research need `getStaticPaths` to generate an unknown-in-advance number of routes from files. Legal is permanently exactly two fixed routes (`/privacy`, `/terms`) — there is nothing to enumerate, so the entire reason this PRD's loading mechanism exists (§4.3) doesn't apply.
2. **No card/list/filter surface.** Projects and Research need `title`/`tags`/`status`/`image` because they're rendered as cards in a grid with search and tag-filtering. A legal page is a single long-form document with no metadata surface to validate — a frontmatter contract here would be schema for schema's sake.
3. **The content itself needs live code, not prose.** Per brief §3 (Contact facts, Legal & analytics), the privacy/terms pages integrate `ConsentContext`, the obfuscated-email pattern, and `RouteMeta` directly in JSX (SP05's job) — none of that is expressible as markdown frontmatter or body content without inventing a mini templating layer on top of markdown that buys nothing over just writing a `.tsx` file.

**Consequence for "four markdown collections":** the brief's decision-log table (§2) describes "four markdown collections" as the conceptual count; this PRD implements three of the four as markdown+frontmatter (Projects, Research, Work Experience) and treats Legal as a fourth *content area* whose loading mechanism is "import a `.tsx` file," which is the simplest possible "loading mechanism" available and consistent with the one working precedent this whole stack is deliberately copied from. Flagged as `[RESOLVED]` in §9, not left ambiguous for SP05 to rediscover.

### 4.3 Loading mechanism

**Mirrors `juno-landing-page/src/data/projects.ts` exactly** — `import.meta.glob` with `eager: true` and `query: '?raw'`, not a Vite plugin or a prebuild script emitting JSON. Reasoning, stated once here and not repeated per collection:

- `import.meta.glob({ eager: true })` resolves to a fully-populated, synchronous object at module-evaluation time. There is no async boundary, no `useEffect`, no loading state — by the time any importer's own top-level code runs, the glob has already run. This is exactly the property that makes content available inside `vite-react-ssg`'s build-time render pass, which is a synchronous render call, not something that can `await` a fetch.
- `query: '?raw', import: 'default'` gets the raw markdown *string* (frontmatter + body, unparsed) — parsing is `gray-matter`'s job, not Vite's. The glob path is written root-relative (`/src/content/projects/*.md`), not through the `@/` alias, because `import.meta.glob` requires a literal, statically-analyzable pattern and root-relative is the documented reliable form (confirmed directly in `juno-landing-page`'s own code comment).
- A Vite *plugin* (transforming content at the build-graph level) or a separate prebuild script emitting JSON were both considered and rejected for the same reason `juno-landing-page` rejected them: they add a build step and a serialization boundary for content that `import.meta.glob` already makes available as plain TypeScript objects, for free, with full type-checking on the loader code itself.

**Per-collection loader shape** (`src/data/shared.ts` holds what's common):

```ts
// src/data/shared.ts
export type Link = { label: string; href: string };

export function assertNoUnknownKeys(path: string, data: Record<string, unknown>, allowed: string[]): void {
  for (const key of Object.keys(data)) {
    if (!allowed.includes(key)) {
      throw new Error(
        `${path}: unrecognized frontmatter field "${key}". Allowed fields: ${allowed.join(', ')}. ` +
        `If this is a genuine typo of one of the allowed fields, fix the key name; if it's a new field the schema needs, add it to the allowed list in src/data/${'<collection>'}.ts first.`,
      );
    }
  }
}

export function assertSlugMatchesFilename(path: string, filenameSlug: string, data: Record<string, unknown>): string {
  if (data.slug !== filenameSlug) {
    throw new Error(`${path}: frontmatter "slug: ${data.slug}" does not match filename "${filenameSlug}.md".`);
  }
  return filenameSlug;
}

export function assertRequiredString(path: string, field: string, value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${path}: missing or empty required frontmatter field "${field}".`);
  }
  return value;
}

export function assertTags(path: string, value: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${path}: "tags" must be a non-empty array. Allowed values: ${allowed.join(', ')}.`);
  }
  for (const tag of value) {
    if (!allowed.includes(tag)) {
      throw new Error(`${path}: "tags" contains "${tag}", which is not one of ${allowed.join(', ')}.`);
    }
  }
  return value as string[];
}

export function assertOptionalStatus(path: string, value: unknown, allowed: readonly string[]): string | undefined {
  if (value === undefined) return undefined;
  if (!allowed.includes(value as string)) {
    throw new Error(
      `${path}: "status: ${value}" is not one of ${allowed.join(', ')} (or omit "status" entirely for no pill).`,
    );
  }
  return value as string;
}

export function assertLinks(path: string, value: unknown): Link[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path}: "links" must be an array (use "links: []" for none).`);
  }
  return value.map((entry, i) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(`${path}: "links[${i}]" must be an object with "label" and "href".`);
    }
    const { label, href } = entry as Record<string, unknown>;
    if (typeof label !== 'string' || !label.trim()) {
      throw new Error(`${path}: "links[${i}].label" is missing or empty.`);
    }
    if (typeof href !== 'string' || !href.trim()) {
      throw new Error(`${path}: "links[${i}].href" is missing or empty.`);
    }
    return { label, href };
  });
}

// gray-matter's YAML engine (js-yaml) auto-parses an unquoted YYYY-MM-DD
// scalar into a native JS Date, not a string — the same trap documented in
// juno-landing-page's vite.config.ts. Every date-shaped field in this
// content model must be normalized back to a plain ISO string, or every
// consumer (sort comparators, RouteMeta, sitemap generation) inherits a
// silent `[object Date]`-shaped bug the moment an author forgets to quote a
// date in frontmatter — which they will, because unquoted is the natural
// way to type a date in YAML.
export function normalizeDateField(path: string, field: string, value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  throw new Error(
    `${path}: "${field}" must be an ISO date (YYYY-MM-DD). Got ${JSON.stringify(value)}. ` +
    `If you typed an unquoted date, YAML may have parsed it as a different value — quote it as a string if unsure.`,
  );
}

export function assertAbsoluteUrl(path: string, field: string, value: unknown): string {
  if (typeof value !== 'string' || !/^https?:\/\//.test(value)) {
    throw new Error(`${path}: "${field}" must be an absolute http(s) URL. Got ${JSON.stringify(value)}.`);
  }
  return value;
}

// Accepts either a root-relative path ("/images/...") or an absolute URL
// (the Unsplash placeholder, or a future CDN link) — both are valid inputs
// to RouteMeta's absoluteUrl() resolver (SP06), which already knows how to
// turn a root-relative path into a fully-qualified one.
export function assertImagePath(path: string, value: unknown): string {
  if (typeof value !== 'string' || !(value.startsWith('/') || /^https?:\/\//.test(value))) {
    throw new Error(`${path}: "image" must be a root-relative path ("/images/...") or an absolute http(s) URL.`);
  }
  return value;
}
```

**Deliberate strengthening over `juno-landing-page`'s own loader: unknown-key rejection.** The reference loader validates that required fields are present and enums are valid, but never checks for *extra* keys — a typo like `descrption` or `staus` would simply be ignored, silently producing an item that's missing the field the author thought they set, with no error anywhere. `assertNoUnknownKeys` closes that gap. This is worth calling out because it's a genuine improvement over the pattern this PRD is otherwise instructed to copy, not an unexplained deviation — flagged as `[RESOLVED]` in §9.

### 4.4 Frontmatter contracts

#### 4.4.1 Shared base shape

Projects and Research share every field needed by SP04's one shared card/grid/filter component, so that component can be written once against a common type rather than special-cased per collection:

```ts
// Conceptual shared shape — not necessarily its own exported type, since
// `tags` is generic over each collection's own literal union. Shown here to
// make the "same shape" requirement (BRIEF §3) concrete and checkable.
type ContentCardItem = {
  slug: string;
  title: string;
  description: string;   // required — the card blurb AND the detail page's
                          // lede paragraph; NOT the same field as `body`.
  image: string;
  tags: string[];         // collection-specific literal union at the type level
  status?: string;         // collection-specific literal union; optional, no default
  links: Link[];
  date: string;            // ISO YYYY-MM-DD; sort key and featured-backfill key
  body: string;             // markdown; MAY be empty string — see §4.5.3
};
```

**`description` and `body` are two different fields, deliberately kept distinct** (this is a real divergence from how `juno-landing-page`'s own content model ended up — see the note below). `description` is short, always-present prose used for the card blurb and the top of the detail page. `body` is the free-form markdown write-up, and may be empty. The brief's own frontmatter list (§3) enumerates *both* `description` and `body` as separate fields for Projects — unlike `juno-landing-page`'s `Project` type, which went through a documented reversal (its own `03-project-detail-pages/PRD.md` §4.2) that *removed* `description` in favor of `body` alone, on the reasoning that two prose fields with no rule for which renders where is confusing. That reversal doesn't apply here, because this brief's rule for which renders where is explicit and different: `description` is the always-rendered card/lede paragraph; `body` is the optional deeper write-up a body-less item simply omits (§4.5.3). Keeping both is correct for *this* brief's stated behavior, not an oversight repeating a mistake the reference already fixed — flagged as a deliberate, cited divergence in §9.

#### 4.4.2 Projects — `src/data/projects.ts`

```ts
export type ProjectStatus = 'Building' | 'Not Started' | 'Completed';
export type ProjectTag = 'Health Tech' | 'Developer Tools' | 'Others';

export type Project = {
  slug: string;
  title: string;
  description: string;
  image: string;
  tags: ProjectTag[];       // one or more, fixed vocabulary
  status?: ProjectStatus;    // optional; absent → no pill, not a default
  liveUrl?: string;           // absolute URL; presence drives /live redirect mode (§4.7)
  links: Link[];               // may be []
  date: string;                 // ISO YYYY-MM-DD
  body: string;                  // markdown; may be empty ("" after trim)
  demo?: true;                    // SP06-owned marker, sample-project ONLY — see §4.7
};

const ALLOWED_KEYS = ['slug', 'title', 'description', 'image', 'tags', 'status', 'liveUrl', 'links', 'date', 'body', 'demo'];
const PROJECT_TAGS: readonly ProjectTag[] = ['Health Tech', 'Developer Tools', 'Others'];
const PROJECT_STATUSES: readonly ProjectStatus[] = ['Building', 'Not Started', 'Completed'];

const files = import.meta.glob('/src/content/projects/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function parseProject(path: string, raw: string): Project {
  const filenameSlug = path.split('/').pop()!.replace(/\.md$/, '');
  const { data, content } = matter(raw);
  assertNoUnknownKeys(path, data, ALLOWED_KEYS);
  const slug = assertSlugMatchesFilename(path, filenameSlug, data);
  const title = assertRequiredString(path, 'title', data.title);
  const description = assertRequiredString(path, 'description', data.description);
  const image = assertImagePath(path, data.image);
  const tags = assertTags(path, data.tags, PROJECT_TAGS) as ProjectTag[];
  const status = assertOptionalStatus(path, data.status, PROJECT_STATUSES) as ProjectStatus | undefined;
  const liveUrl = data.liveUrl !== undefined ? assertAbsoluteUrl(path, 'liveUrl', data.liveUrl) : undefined;
  const links = assertLinks(path, data.links);
  const date = normalizeDateField(path, 'date', data.date);
  if (data.demo !== undefined && data.demo !== true) {
    throw new Error(`${path}: "demo" must be exactly \`true\` if present, or omitted entirely.`);
  }
  return { slug, title, description, image, tags, status, liveUrl, links, date, body: content.trim(), demo: data.demo as true | undefined };
}

export const projects: Project[] = Object.entries(files)
  .map(([path, raw]) => parseProject(path, raw))
  .sort((a, b) => b.date.localeCompare(a.date)); // most recent first — see §4.6 for why this also feeds featured-backfill
```

Duplicate-slug check (two files, same `slug`) lives in `src/data/index.ts` (§4.5.4), since it's cross-file within the collection, not per-file.

#### 4.4.3 Research — `src/data/research.ts`

Same shape and mechanism as Projects, with two deliberate differences from a literal "identical schema" reading of the brief:

```ts
export type ResearchTag = 'Health' | 'Machine Learning' | 'Other';
export type ResearchStatus = 'Building' | 'Not Started' | 'Completed'; // same vocabulary, reused as-is

export type Research = {
  slug: string;
  title: string;
  description: string;
  image: string;
  tags: ResearchTag[];      // multi-tagging allowed, e.g. ["Health", "Machine Learning"]
  status?: ResearchStatus;
  links: Link[];
  date: string;
  body: string;
  // NOTE: no `liveUrl`. See reasoning below.
};
```

**`liveUrl` is deliberately dropped from Research, despite the brief's §3 wording ("same shape as Projects").** The site map (brief §3, Routes) defines `/projects/<slug>/live` but has no `/research/<slug>/live` analog — no route in the entire application would ever read a research item's `liveUrl`. Including a field that can be set in frontmatter but never does anything anywhere is a footgun, not fidelity to "same shape": an author (or the owner, editing later) could plausibly set `liveUrl` on a research entry expecting a live-tool link to appear, and nothing would happen, with no error to explain why. The brief's "same shape" language is read here as "same shape for everything the shared filter/card component needs" (`tags[]`, `status?`, `title`/`description`/`image`/`date`/`links`/`body`) — which is fully satisfied — not as "byte-identical field list including a field with zero live consumers." If a `/research/<slug>/live` route is ever added, restoring `liveUrl` to Research is a one-line type change with no migration cost, since no research content will have ever set it. Flagged `[RESOLVED]` in §9 as a cited, deliberate divergence, not an oversight.

`ALLOWED_KEYS` for Research: `['slug', 'title', 'description', 'image', 'tags', 'status', 'links', 'date', 'body']` — `liveUrl` and `demo` both absent; setting either on a research file fails the build via `assertNoUnknownKeys`, which is exactly the intended enforcement of the above decision (not just documentation — a build-time guarantee).

Loader mechanics, glob path, sort (`date` descending), and duplicate-slug check are otherwise identical to Projects (§4.4.2), reading from `/src/content/research/*.md`.

#### 4.4.4 Work Experience — `src/data/workExperience.ts`

```ts
export type WorkExperience = {
  company: string;
  role: string;
  startDate: string;        // ISO YYYY-MM-DD — sort key, see §4.6
  endDate: string | 'Present';
  links: Link[];
  draftDate: boolean;        // true while DRAFT_DATE marker is present — see §4.7
  body: string;               // the 2–3 line blurb, markdown
  id: string;                  // filename-derived, for React keys only — NOT a route slug
};

const ALLOWED_KEYS = ['company', 'role', 'startDate', 'endDate', 'links', 'DRAFT_DATE'];

const files = import.meta.glob('/src/content/work-experience/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function parseWorkExperience(path: string, raw: string): WorkExperience {
  const id = path.split('/').pop()!.replace(/\.md$/, '');
  const { data, content } = matter(raw);
  assertNoUnknownKeys(path, data, ALLOWED_KEYS);
  const company = assertRequiredString(path, 'company', data.company);
  const role = assertRequiredString(path, 'role', data.role);
  const startDate = normalizeDateField(path, 'startDate', data.startDate);
  const endDate = data.endDate === 'Present' ? 'Present' : normalizeDateField(path, 'endDate', data.endDate);
  const links = assertLinks(path, data.links);
  if (data.DRAFT_DATE !== undefined && data.DRAFT_DATE !== true) {
    throw new Error(`${path}: "DRAFT_DATE" must be exactly \`true\` if present, or removed entirely once real dates are supplied.`);
  }
  const draftDate = data.DRAFT_DATE === true;
  const body = content.trim();
  if (!body) {
    throw new Error(`${path}: work-experience body (the 2–3 line blurb) must not be empty.`);
  }
  return { company, role, startDate, endDate, links, draftDate, body, id };
}

export const workExperience: WorkExperience[] = Object.entries(files)
  .map(([path, raw]) => parseWorkExperience(path, raw))
  .sort((a, b) => b.startDate.localeCompare(a.startDate)); // startDate descending — no manual order field, per brief
```

No `slug`/filename-agreement check (§4.2 — no route ever addresses a role by slug). No `status`/`tags`/`image` fields at all — the brief's work-experience frontmatter contract is exactly `company, role, startDate, endDate, links[]`, and the timeline (SP03) renders company/role/dates/blurb/links only, never a status pill or a tag filter. `body` is required and non-empty here specifically because, unlike Projects/Research (where an empty `body` degrades gracefully to "just show `description` + `links`," §4.5.3), Work Experience has no separate `description` field — the blurb *is* the only prose, so an empty one would render a bare header with nothing under it.

### 4.5 Build-time validation — mechanism and cross-collection checks

**Hand-rolled TypeScript, not a schema library (zod, yup, etc.).** Justified the same way the rest of this stack repeatedly rejects added tooling: the validation surface here is small and fully enumerable — a handful of required-string checks, three enum vocabularies, one array-of-objects shape, and one date-normalization helper, all reused across three loaders via `src/data/shared.ts` (§4.3). A schema library would add a dependency, a schema-definition DSL to learn, and a translation layer between "zod's error shape" and "the human-readable, file-naming error message" this PRD requires anyway — for validation logic that fits in under 80 lines of plain functions. `juno-landing-page`'s own loader makes the identical hand-rolled choice for the identical reason; there is no concrete pressure here (no deeply nested content shapes, no need for runtime type inference beyond what's shown above) that would flip that calculus for this project specifically.

**Error output contract:** every validation failure throws a plain `Error` whose message starts with the file's path (relative to repo root, exactly as `import.meta.glob`'s key provides it — e.g. `/src/content/projects/med-doc-tracker.md`), followed by a colon, followed by which field is wrong and what was expected. This is not a nicety — it's what makes the error actionable for a content author (most likely the owner, per SP07) who has no reason to know this validation code exists: `npm run build` (or `npm run dev`, since `import.meta.glob({eager:true})` re-evaluates on file save) fails with a message that names the exact file to open and the exact line to fix, with no stack-trace archaeology required. Every function in §4.3's `shared.ts` follows this format; no validation path in any of the three loaders (§4.4.2–4.4.4) is exempt.

#### 4.5.1 Per-file validation (already specified per collection above)

Required-field presence, enum membership (`tags`, `status`), array shape (`links`), slug/filename agreement (Projects/Research only), unknown-key rejection, date normalization. Runs the moment each file's `import.meta.glob` entry is parsed — i.e., at module-evaluation time, before any component renders, before `getStaticPaths` runs, before the prerender pass starts.

#### 4.5.2 Duplicate-slug check (within a collection)

```ts
// appended to the bottom of projects.ts (and research.ts, identically) —
// runs once, after the full array is built, still at module-eval time
const seen = new Set<string>();
for (const p of projects) {
  if (seen.has(p.slug)) {
    throw new Error(`Duplicate slug "${p.slug}" across multiple files in src/content/projects/. Slugs must be unique.`);
  }
  seen.add(p.slug);
}
```

Cheap, catches the case where the filename/frontmatter agreement check (§4.2) technically passes on each individual file (both files correctly declare their own filename-matching slug) but two *different* filenames happen to declare the *same* frontmatter slug — a realistic mistake if an author writes `crunchy-filler-v2.md` with `slug: crunchy-filler` while `crunchy-filler.md` still exists.

#### 4.5.3 Body-less rendering — a rendering contract, validated implicitly

**No validation rejects an empty `body`** for Projects/Research (unlike Work Experience, §4.4.4) — the brief is explicit that "a project/research page with no body still renders correctly from `description` + `links` alone" is a supported, intended state, not an error condition. What *is* enforced: `description` is required and non-empty (§4.4.1) precisely because it's the field that must always be present for this degrade-gracefully behavior to hold — an item with neither a real `description` nor a `body` would have nothing to show at all, which the required-field check on `description` already prevents structurally, without needing a special "at least one of description/body" rule.

The actual rendering contract SP04's detail-page templates must satisfy: always render `description` (as the lede paragraph) and `links` (the links row, near the top per brief §2's design language); render the `ContentBody` block (§4.7) only when `body` is non-empty, using the shared helper below so "is this body worth rendering" isn't reimplemented per template:

```tsx
// src/data/ContentBody.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from './markdownComponents';

export function ContentBody({ body }: { body: string }): React.JSX.Element | null {
  if (!body.trim()) return null;
  return (
    <div className="prose max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {body}
      </ReactMarkdown>
    </div>
  );
}
```

SP04 can call `<ContentBody body={project.body} />` unconditionally in every detail template — the component itself is the single place "empty body → render nothing" is decided, so no template needs its own `{project.body && ...}` guard duplicated three times (Projects detail, Research detail, and anywhere else a body might render, e.g. a future work-experience detail page if one is ever added despite the current non-goal).

#### 4.5.4 Cross-collection internal-link validation

**Runs in `src/data/index.ts`**, the one module that imports all three collections and is therefore the only place that can check a link in one collection against a slug that lives in another:

```ts
// src/data/index.ts
import { projects, type Project } from './projects';
import { research, type Research } from './research';
import { workExperience, type WorkExperience } from './workExperience';

export * from './projects';
export * from './research';
export * from './workExperience';

const KNOWN_STATIC_ROUTES = ['/', '/projects', '/research', '/work-experience', '/privacy', '/terms'];

function validateInternalLinks(): void {
  const projectSlugs = new Set(projects.map((p) => p.slug));
  const researchSlugs = new Set(research.map((r) => r.slug));

  const allLinkSources: { path: string; links: { label: string; href: string }[] }[] = [
    ...projects.map((p) => ({ path: `src/content/projects/${p.slug}.md`, links: p.links })),
    ...research.map((r) => ({ path: `src/content/research/${r.slug}.md`, links: r.links })),
    ...workExperience.map((w) => ({ path: `src/content/work-experience/${w.id}.md`, links: w.links })),
  ];

  for (const { path, links } of allLinkSources) {
    for (const { href } of links) {
      if (!href.startsWith('/')) continue; // absolute http(s), mailto:, tel: — external, not this check's job
      if (KNOWN_STATIC_ROUTES.includes(href)) continue;

      const projectMatch = href.match(/^\/projects\/([a-z0-9-]+)(\/live)?$/);
      if (projectMatch) {
        if (!projectSlugs.has(projectMatch[1])) {
          throw new Error(`${path}: link href "${href}" points at unknown project slug "${projectMatch[1]}".`);
        }
        continue;
      }
      const researchMatch = href.match(/^\/research\/([a-z0-9-]+)$/);
      if (researchMatch) {
        if (!researchSlugs.has(researchMatch[1])) {
          throw new Error(`${path}: link href "${href}" points at unknown research slug "${researchMatch[1]}".`);
        }
        continue;
      }
      throw new Error(
        `${path}: link href "${href}" looks internal (starts with "/") but doesn't match a known route pattern ` +
        `(/projects/<slug>, /projects/<slug>/live, /research/<slug>, or a static route: ${KNOWN_STATIC_ROUTES.join(', ')}). ` +
        `Fix the typo, or extend KNOWN_STATIC_ROUTES / the pattern list in src/data/index.ts if this is a genuinely new internal route.`,
      );
    }
  }
}

validateInternalLinks(); // runs once, eagerly, the moment anything imports from '@/data'
```

**Scope, stated precisely:** this validates `links[].href` values found in frontmatter, across all three collections, against known slugs and known static routes. It does **not** parse markdown `body` content for embedded links — a relative link typed inside a project's free-form write-up (`[see this other project](/projects/foo)`) is not walked and checked. Catching those would require parsing every body's markdown AST at validation time, which is real additional machinery (a `remark` parse pass purely for link extraction) for a content model where in-body internal cross-links are not a pattern the brief's content inventory (§6) exercises even once — every real link in the inventory is either external or lives in frontmatter `links[]`. Flagged `[DEFERRED]` in §9, not silently unhandled.

**Resolved: Nav/Footer's own hrefs are now checked against `KNOWN_STATIC_ROUTES` by this same validator, via a data-driven change on SP01's side (§9).** `KNOWN_STATIC_ROUTES` is exported specifically so such a check is possible, and the check is worth having — a typo in a nav href is exactly the class of error this pipeline exists to catch at build time, and it costs one loop. The mechanism is deliberately *not* a new lint rule or a separate test harness: SP01's `Nav`/`Footer` stop hardcoding hrefs in JSX and instead map over two new exported arrays, `NAV_LINKS` and `FOOTER_LINKS`, defined in `src/config/links.ts` (the same file SP03 defines `RESUME_URL` in — see SP03 PRD §4). This validator gains one more pass, run alongside `validateInternalLinks()` in `src/data/index.ts`:

```ts
// appended to src/data/index.ts, run alongside validateInternalLinks()
import { NAV_LINKS, FOOTER_LINKS } from '@/config/links';
import { isExternalUrl } from '@/lib/isExternalUrl';

function validateNavAndFooterLinks(): void {
  const allLinks = [...NAV_LINKS, ...FOOTER_LINKS];
  for (const { href, label } of allLinks) {
    if (isExternalUrl(href)) continue; // e.g. the Résumé Drive link — not this check's job

    // Nav's entries are hash-anchors on '/' (e.g. "/#about") — per SP01 §4.8,
    // React Router resolves "/#about" as a navigation to pathname "/" with
    // hash "#about", so it's the PATHNAME that must be a known route, not the
    // literal href string. Footer's entries carry no hash, so this is a no-op
    // for them (pathname === href).
    const [pathname] = href.split('#');
    if (!KNOWN_STATIC_ROUTES.includes(pathname || '/')) {
      throw new Error(
        `src/config/links.ts: "${label}" points at "${href}" (pathname "${pathname || '/'}"), which is ` +
        `not in KNOWN_STATIC_ROUTES (src/data/index.ts). Fix the typo, or add the new route to ` +
        `KNOWN_STATIC_ROUTES if it's genuine.`,
      );
    }
  }
}

validateNavAndFooterLinks(); // runs once, eagerly, alongside validateInternalLinks()
```

Internal entries (`/research`, `/privacy`, `/terms`, the `/#projects`-style nav anchors, etc.) are checked against `KNOWN_STATIC_ROUTES` exactly like any other internal link in this content model; external entries (identified via `isExternalUrl`, the same SP01-owned utility §4.8 already assumes) are skipped, since `KNOWN_STATIC_ROUTES` has nothing to say about the Résumé Drive link. This closes the coordination point previously left open here — see §9 and §4.5 (added to the enumerated validator checks) for the corresponding detail.

**Why this lives in `src/data/index.ts` and not inside each loader:** each loader (`projects.ts`, `research.ts`, `workExperience.ts`) can only see its own collection at module-eval time — `projects.ts` has no way to know what slugs exist in `research.ts` without importing it, and a three-way circular import (each collection importing the other two to cross-check) is exactly the situation an aggregator module exists to avoid. Every consumer (`routes.tsx`, SP03's pages, SP04's pages) should import from `@/data` (the aggregator), not from `@/data/projects` directly, so this validation always runs as a side effect of the first import anywhere in the app — there is no code path that reaches `projects`/`research`/`workExperience` without also triggering `validateInternalLinks()`.

### 4.6 `src/config/featured.ts`

```ts
// src/config/featured.ts
import { projects, type Project } from '@/data';

const MAX_FEATURED = 6;

// Ordered, up to 6 slugs — the single source of truth for the landing
// page's featured Projects section (BRIEF §2/§3). Author edits this array
// directly; nothing else controls what's featured or in what order.
export const FEATURED_PROJECT_SLUGS: string[] = [
  'juno',
  'smarttest',
  'med-doc-tracker',
];

function computeFeatured(all: Project[], slugs: string[]): Project[] {
  if (slugs.length > MAX_FEATURED) {
    throw new Error(`src/config/featured.ts: FEATURED_PROJECT_SLUGS has ${slugs.length} entries, max is ${MAX_FEATURED}.`);
  }
  const uniqueSlugs = [...new Set(slugs)];
  if (uniqueSlugs.length !== slugs.length) {
    throw new Error(`src/config/featured.ts: FEATURED_PROJECT_SLUGS contains a duplicate slug.`);
  }

  const featured: Project[] = [];
  for (const slug of uniqueSlugs) {
    const project = all.find((p) => p.slug === slug);
    if (!project) {
      throw new Error(`src/config/featured.ts: unknown project slug "${slug}" — no file at src/content/projects/${slug}.md.`);
    }
    featured.push(project);
  }

  const remainingSlots = MAX_FEATURED - featured.length;
  if (remainingSlots > 0) {
    const backfill = all
      .filter((p) => !uniqueSlugs.includes(p.slug))
      .sort((a, b) => b.date.localeCompare(a.date)) // most-recently-dated first
      .slice(0, remainingSlots);
    featured.push(...backfill);
  }

  return featured;
}

// Pre-computed and validated at import time — a bad slug fails the build the
// moment anything imports this module, not lazily when the landing page
// happens to render.
export const featuredProjects: Project[] = computeFeatured(projects, FEATURED_PROJECT_SLUGS);
```

**Backfill semantics, stated exactly** (this is the part the task brief calls out as needing precision, since it's easy to get subtly wrong):

1. Every slug in `FEATURED_PROJECT_SLUGS` must exist in `projects` — unknown slug fails the build immediately, naming the offending slug (not a silent drop).
2. Max 6 — more than 6 listed slugs fails the build rather than silently truncating (silent truncation would mean the 7th listed slug quietly never appears with no error explaining why).
3. Listed slugs render **first, in the exact order listed** — `FEATURED_PROJECT_SLUGS` is an ordering, not just a membership set.
4. If fewer than 6 are listed, the **remaining slots** (not the whole list) are filled from `projects` **sorted by `date` descending, excluding every slug already in `FEATURED_PROJECT_SLUGS`** — so a project that's both explicitly listed *and* would otherwise have been the most recent backfill candidate is never double-counted or duplicated; the `.filter((p) => !uniqueSlugs.includes(p.slug))` step is exactly what resolves the interaction the task flagged (an explicitly-listed slug that also happens to be recent doesn't distort the backfill pass — it's simply excluded from the candidate pool for backfill, having already claimed its listed position).
5. If the total `projects` collection has fewer than 6 items total, `featuredProjects` returns however many exist — no padding, no duplicate entries, no error. This is the natural consequence of `.slice(0, remainingSlots)` on a shorter-than-requested array, not a special case that needs separate handling.
6. Duplicate slugs *within* `FEATURED_PROJECT_SLUGS` itself fail the build (a copy-paste mistake, not a meaningful "feature it twice" instruction).

`featuredProjects` (the computed array), not the raw slug list, is what SP03 imports for the landing page — `FEATURED_PROJECT_SLUGS` is exported too, for tooling/tests that want to assert against the raw configuration, but no rendering code should re-implement the backfill logic against the raw list.

### 4.7 The `/projects/<slug>/live` dual-mode contract

**This content pipeline's job stops at exposing one signal: `Project.liveUrl?: string`.** Everything downstream of that signal is SP04's route-building job, but the *distinction* SP04 builds against must be unambiguous, which is what this section fixes precisely:

```ts
type LiveMode =
  | { mode: 'redirect'; target: string }  // liveUrl is set
  | { mode: 'hosted' };                    // liveUrl is absent

function liveMode(project: Project): LiveMode {
  return project.liveUrl ? { mode: 'redirect', target: project.liveUrl } : { mode: 'hosted' };
}
```

- **`liveUrl` present → redirect mode.** `project.liveUrl` is validated at build time (`assertAbsoluteUrl`, §4.3) to be a well-formed `http(s)://` URL — SP04's `/live` route for that slug has exactly one job: send the visitor to that URL. **Recommendation for SP04/SP01 (not designed here, since it crosses into `firebase.json` ownership):** prefer a real HTTP redirect over a client-side one where possible — e.g. generating `firebase.json`'s `redirects` array at build time from `projects.filter(p => p.liveUrl)`, mirroring the same `closeBundle`-hook pattern `juno-landing-page` already uses for its sitemap (§4.8 below) — with a client-side `<Navigate replace to={project.liveUrl} />` as a defensive fallback only, not the primary mechanism. A pure client-side redirect works for a real browser but does nothing for a crawler or a no-JS client hitting `/projects/<slug>/live` directly; a real Hosting-level redirect fires before any JS runs. Left as a recommendation, not a requirement, because implementing it touches SP01's `firebase.json` build step, which this sub-project doesn't own.
- **`liveUrl` absent → hosted mode.** A route exists at `/projects/<slug>/live` only for slugs SP04 explicitly registers a hosted-page component for — **this registry is not content-driven and cannot be, because a hosted page is bespoke application code (e.g. `sample-project`'s "prints the current date-time" page per brief §3), not something markdown can describe.** At launch, exactly one slug (`sample-project`) is expected to be in hosted mode. SP04's `getStaticPaths` for the `/live` route should therefore be computed as `projects.filter(p => p.liveUrl || HOSTED_LIVE_PAGE_SLUGS.has(p.slug)).map(p => p.slug)` — a union of "has liveUrl" and "has a manually-registered hosted component" — not "every project without a liveUrl," since most real projects at launch have neither (see below).
- **Neither `liveUrl` nor a hosted-page registration → no `/live` route for that slug at all.** This is the expected state for any real project the owner hasn't yet decided has a "go see it live" destination worth linking (e.g. a defunct project like Columbia Virtual Campus, whose only links are informational, not a live tool). The detail page's "open live" affordance is simply omitted for such a project — the same "missing optional field → omit UI, never a broken/disabled-looking element" rule the brief already establishes for other optional fields (§3, "missing/partial data" pattern in the reference precedent) applies identically here.

**Expected launch-time reality, worth stating explicitly so SP07 doesn't treat this as more open than it is:** per brief §2 ("the owner explicitly wants small projects hosted on his own domain, not just linked out to Vercel/Chrome Web Store/etc"), the near-term expectation is that `liveUrl` is set to whatever existing off-domain link a project already has (Chrome Web Store, Vercel, short.gy, a hackathon submission page) — i.e., **redirect mode for essentially every real project that has any "go try it" destination at all**, with hosted mode reserved for future projects the owner deliberately migrates onto his own domain, plus `sample-project`. This isn't this PRD's decision to make per-project (that's SP07's authoring call, guided by the content inventory in brief §6), but stating the expected shape here means SP04 isn't designing its hosted-page registry against a hypothetical where most projects need one.

**Sample-project's `demo: true` marker** (§4.4.2) exists so a pre-launch check (§4.9) can fail the build if a demo project is still present when the site is meant to ship as real-content-only — SP06 owns the file itself and its hosted `/live` page; this content pipeline only reserves the `demo?: true` field and enforces it can be `true` or absent, never any other value.

### 4.8 Rendering — `react-markdown` / `remark-gfm` / `@tailwindcss/typography`

**Libraries, versions verified against `juno-landing-page`'s own `package.json`** (read directly, not assumed): `react-markdown@^10.1.0`, `remark-gfm@^4.0.1`, `gray-matter@^4.0.3`, `@tailwindcss/typography@^0.5.20` — all confirmed React-19-compatible and currently maintained by the sibling project's own working install. No version research needed here beyond confirming these are the same versions already validated end-to-end; adopt them as-is rather than re-deriving compatibility from scratch.

**Shared link-rendering component** (`src/data/markdownComponents.tsx`), same "off-site link opens in a new tab" behavior `juno-landing-page`'s `ProjectDetailPage.tsx` already implements, generalized here to be collection-agnostic so it works identically for a Project body, a Research body, or (if ever needed) a Work Experience blurb's inline links:

```tsx
// src/data/markdownComponents.tsx
import type { Components } from 'react-markdown';
import { isExternalUrl } from '@/lib/isExternalUrl'; // SP01-owned utility — see assumption below

export const markdownComponents: Components = {
  a({ href, children, ...props }) {
    const isExternal = typeof href === 'string' && isExternalUrl(href);
    return isExternal ? (
      <a href={href} target="_blank" rel="noreferrer" {...props}>{children}</a>
    ) : (
      <a href={href} {...props}>{children}</a>
    );
  },
};
```

**Assumption flagged for SP01:** `src/lib/isExternalUrl.ts` is assumed ported verbatim from `juno-landing-page/src/lib/isExternalUrl.ts` as part of SP01's toolchain work (it's a small, generic, content-agnostic utility with no reason to differ). If SP01 doesn't port it, this content pipeline needs a two-line inline replacement (`/^https?:\/\//.test(href)`) — noted so SP04 isn't blocked discovering this dependency only once wiring the detail templates.

**`prose` typography customization — palette-matched, not `prose-neutral`.** This is a deliberate divergence from `juno-landing-page`'s own choice (its `03-project-detail-pages/PRD.md` §4.3 explicitly picks `prose-neutral`'s default grayscale over a custom palette-matched variant, reasoning that body prose is "visually distinct from the surrounding chrome anyway"). That reasoning doesn't transfer here: this brief's design-language section (§3) is unusually specific and exhaustive about the palette (`#162b26` ink, `#3E514D` body text, `#0F4C45` teal for links/borders, exact border-opacity and shadow-tint values) being the entire point of the rewrite — porting techfolio's visual system "wholesale" is the stated goal, not merely a chrome concern. Shipping markdown bodies in the typography plugin's generic gray would visibly clash with every hand-styled element around it (the header's `#162b26` title, the teal tag pills, the teal links elsewhere on the page). **Resolved: define a custom typography variant mapped onto the brief's own palette tokens**, for SP01 to add to `tailwind.config` alongside the design-token work it already owns:

```js
// tailwind.config.js — theme.extend.typography, additive to SP01's existing config
typography: () => ({
  DEFAULT: {
    css: {
      '--tw-prose-body': '#3E514D',
      '--tw-prose-headings': '#162b26',
      '--tw-prose-lead': '#3E514D',
      '--tw-prose-links': '#0F4C45',
      '--tw-prose-bold': '#162b26',
      '--tw-prose-bullets': '#0F4C45',
      '--tw-prose-quotes': '#162b26',
      '--tw-prose-quote-borders': 'rgba(15,76,69,0.22)',
      '--tw-prose-hr': 'rgba(15,76,69,0.12)',
      '--tw-prose-th-borders': 'rgba(15,76,69,0.22)',
      '--tw-prose-td-borders': 'rgba(15,76,69,0.12)',
      '--tw-prose-code': '#162b26',
      a: { textDecoration: 'none', fontWeight: '500' },
      'a:hover': { textDecoration: 'underline' },
    },
  },
}),
```

Usage in `ContentBody.tsx` (§4.5.3): `className="prose max-w-none"` — **not** `prose-neutral`, since `DEFAULT` is now the palette-matched variant and no modifier class is needed to select it. This customization is additive to whatever design tokens SP01 defines elsewhere; it does not require SP01 to restructure its own token setup, only to add this one `theme.extend.typography` block to the Tailwind config it already owns.

**Feature coverage, inherited from `react-markdown`/`remark-gfm` defaults, no custom components beyond the link renderer above:** headings, paragraphs, lists, and blockquotes via `react-markdown`'s default element mapping; code blocks (inline and fenced) via the default `<code>`/`<pre>` output styled by `prose`'s built-in monospace treatment — no syntax highlighting added, matching the reference's "real tooling for a documentation site, not a personal portfolio" reasoning, which applies identically here; tables via `remark-gfm`, styled by `prose`'s built-in table borders/padding; images via `react-markdown`'s default `<img>` mapping, resolving whatever path an author writes exactly as typed (no bundler resolution — see `assertImagePath`'s root-relative-or-absolute contract in §4.3, which applies identically to `![]()` references inside `body`, since `react-markdown` has no mechanism to resolve a bundler-processed import from a markdown string regardless).

### 4.9 The `DRAFT_DATE` marker and the pre-launch content gate

**The problem, restated precisely, as it stood when this section was first written:** none of the three work-experience roles then in scope carried any date in the current source (brief §6 confirms this directly — the Gatsby objects have only `title`/`subtitle`/`description`/`links`). Ordering on both the landing timeline and `/work-experience` is derived purely from `startDate` descending (§4.4.4) — with no real dates, there is no real ordering, only a placeholder one that must not be mistaken for final by a future reader of the code, and must not survive to a real launch unnoticed. **This mechanism remains fully intact for future roles added without confirmed dates** — but the situation it describes is no longer what ships at launch (see below).

**Marker design: a literal `DRAFT_DATE: true` frontmatter key**, all-caps and visually distinct from every other camelCase field in the schema by design — this is not a stylistic accident, it's chosen specifically so the flag reads as an alarm the moment a human scans the frontmatter block, rather than blending in as just another setting. Validation (§4.4.4) accepts only `true` or complete absence of the key — never `false`. **Reasoning for rejecting `false` as a valid value:** a lingering `DRAFT_DATE: false` line is dead noise an author could leave behind after supplying real dates, and a future reader (or a careless regex-based check) could plausibly mis-scan for the mere *presence* of the string `DRAFT_DATE` rather than its value — rejecting anything but `true`/absent forces the resolution to be "delete the line entirely," which is unambiguous both to a human skimming the file and to a `grep -l DRAFT_DATE` sanity check.

**Original placeholder design, kept here for the record — superseded by what actually ships (§9, owner decision).** At the time this section was authored, none of the three roles then in scope had real dates, so all three were given placeholder values chosen to produce the brief-mandated interim order (Microsoft Fabric Maps → Jio, Reliance Industries → Programming for Entrepreneurs and Social Good), deliberately obvious round numbers so nobody would mistake a placeholder for a real, approximate date:

| File | `company` | `startDate` (placeholder) | `endDate` | `DRAFT_DATE` |
|---|---|---|---|---|
| `microsoft-fabric-maps.md` | Microsoft Fabric Maps | `2024-01-01` | `Present` | `true` |
| `jio-reliance-industries.md` | Jio, Reliance Industries | `2021-01-01` | `2021-06-01` | `true` |
| ~~`programming-for-entrepreneurs.md`~~ | ~~Programming for Entrepreneurs and Social Good~~ | ~~`2019-01-01`~~ | ~~`2020-06-01`~~ | ~~`true`~~ |

**What actually ships at launch: two roles, both with real, résumé-sourced dates, and zero `DRAFT_DATE: true` entries anywhere.** SP07's résumé mining (SP07 §4.3) resolved real dates for Microsoft Fabric Maps (`2021-06-01`→`Present`) and Jio, Reliance Industries (`2019-06-01`→`2019-08-01`) — neither placeholder table row above is what ships; both are replaced with sourced fact. The third role, Programming for Entrepreneurs and Social Good, is **dropped from the site entirely** rather than shipped on the placeholder above — it's the only one of the three with no dateable source anywhere (not the résumé, not the site), and it was the weakest entry for the brief's health-tech repositioning besides. Dropping it removes the initiative's only launch-blocking `DRAFT_DATE` placeholder outright, rather than leaving one role permanently gated on an owner-supplied semester range. The `check:launch` gate below still runs and still matters — it exists for any future role added without a confirmed date — but the expected result at launch is a clean pass with **zero** remaining `DRAFT_DATE: true` entries, not one.

**The pre-launch gate — a single script covering both open placeholder markers this content model has** (`DRAFT_DATE` here, and Projects' `demo: true` from §4.7, since both are "temporary marker that must not survive to launch" problems with the identical shape):

```ts
// scripts/check-launch-content.ts — run manually before a real deploy;
// no CI exists in this project (per brief non-goals), so this is a
// documented, not automated, gate — see §9 for the CI tradeoff.
import { projects, workExperience } from '../src/data';

const draftDates = workExperience.filter((w) => w.draftDate);
const demoProjects = projects.filter((p) => p.demo === true);

if (draftDates.length > 0 || demoProjects.length > 0) {
  console.error('Pre-launch content check FAILED:\n');
  for (const w of draftDates) {
    console.error(`  - src/content/work-experience/${w.id}.md still has DRAFT_DATE: true — supply real startDate/endDate and remove the marker.`);
  }
  for (const p of demoProjects) {
    console.error(`  - src/content/projects/${p.slug}.md still has demo: true — delete the file before a real launch (see BRIEF §3, Sharing/SEO).`);
  }
  process.exit(1);
}
console.log('Pre-launch content check passed — no DRAFT_DATE or demo markers remain.');
```

Wired as `"check:launch": "tsx scripts/check-launch-content.ts"` in `package.json` (or the equivalent for whatever script runner SP01's toolchain settles on) — run by hand before the first real `firebase deploy`, per the brief's own stated non-goal of building CI. Because it imports `src/data` directly, it inherits every validation already run by the loaders and `validateInternalLinks()` (§4.5.4) for free — a broken content file fails this same command with the same file-and-field-specific error before it ever gets to the DRAFT_DATE/demo check.

---

## 5. API Change Summary

N/A. There is no backend, database, or API surface anywhere in this project (per brief non-goals) — every collection is read from static files at build time via `import.meta.glob`, and every consumer (SP03, SP04, SP06) reads plain, already-validated TypeScript arrays from `@/data`/`@/config/featured`. Nothing here is a network boundary.

---

## 6. Frontend Change Summary

| Type | Name | Path | Notes |
|---|---|---|---|
| New (content) | 10 project files | `src/content/projects/*.md` | Authored by SP07 against §4.4.2's contract. |
| New (content) | 5 research files | `src/content/research/*.md` | Authored by SP07 against §4.4.3's contract. |
| New (content) | 2 work-experience files | `src/content/work-experience/*.md` | Authored by SP07 against §4.4.4's contract. Both ship real, résumé-sourced dates (SP07 §4.3) — neither uses the `DRAFT_DATE` placeholder mechanism (§4.9), which remains available for any future role added without a confirmed date. The Programming for Entrepreneurs and Social Good role that would have been a third file is dropped from the site (owner decision, §4.9/§9). |
| New (content, SP06-owned) | Demo project | `src/content/projects/sample-project.md` | `demo: true`; exercises full markdown feature set; see §4.7. |
| New | `Link` type, shared validators | `src/data/shared.ts` | §4.3. |
| New | `Project` type + loader | `src/data/projects.ts` | §4.4.2. |
| New | `Research` type + loader | `src/data/research.ts` | §4.4.3. |
| New | `WorkExperience` type + loader | `src/data/workExperience.ts` | §4.4.4. |
| New | Aggregator + cross-collection link validation | `src/data/index.ts` | §4.5.4. All consumers should import from here, not from individual collection files directly. |
| New | Shared react-markdown link renderer | `src/data/markdownComponents.tsx` | §4.8. Depends on SP01-owned `src/lib/isExternalUrl.ts` (assumption flagged). |
| New | Shared body-render component | `src/data/ContentBody.tsx` | §4.5.3. |
| New | Featured-projects config + computed export | `src/config/featured.ts` | §4.6. |
| New (script) | Pre-launch content gate | `scripts/check-launch-content.ts` | §4.9. |
| Modified (SP01-owned, additive) | Tailwind typography tokens | `tailwind.config.js` | §4.8 — `theme.extend.typography.DEFAULT`, palette-matched. Additive to SP01's existing config, not a rewrite. |
| New (not markdown, SP05-owned content, mechanism decided here) | Privacy/Terms pages | `src/pages/PrivacyPage.tsx`, `src/pages/TermsPage.tsx` | §4.2 — hand-written JSX per the `juno-landing-page` precedent, not a markdown collection. |
| Consumed by SP04 | `projects`, `research` (for `getStaticPaths`) | via `src/data/index.ts` | §4.7/§9 — route enumeration contract. |
| Consumed by SP06 | `projects` (sitemap, OG fallback) | via `src/data/index.ts`, **or** an independent `fs`+`gray-matter` scan if run from inside `vite.config.ts` | §4.10 gotcha, carried over from `juno-landing-page`. |

---

## 7. Testing

Strategy, sized to match this being a personal-portfolio content layer, not a production data pipeline — a handful of targeted unit tests on the validation logic itself, since that logic is the entire point of this sub-project (a validator that doesn't actually catch the errors it claims to catch is worse than no validator, because it creates false confidence):

- **Validator unit tests** (`src/data/shared.test.ts`), each constructing a malformed raw frontmatter string in-memory and asserting the specific loader throws with a message containing the offending file path and field name — not just "throws," since a generic exception with no file/field context would technically pass a looser test while failing the actual point of §4.5's error-output contract. Cover: missing required field, invalid `status` enum value, valid-but-absent `status` (must NOT throw — this is the one case most likely to be implemented backwards, since "optional" validators are easy to accidentally write as "required with a default"), an unknown frontmatter key, a `slug`/filename mismatch, an unquoted-date value landing as a `Date` object (confirms `normalizeDateField`'s `instanceof Date` branch actually fires, not just its string-regex branch), and a `links` entry missing `href`.
- **Featured-backfill unit tests** (`src/config/featured.test.ts`), using an in-memory `Project[]` fixture (never real content files) covering: fewer than 6 slugs listed (backfill fills the rest, by date descending); exactly 6 listed (no backfill); more than 6 listed (throws); an unknown slug (throws, names the slug); a listed slug that also happens to be the most recent by date (confirms it isn't double-counted into the backfill pool — the one interaction case the task explicitly flagged as easy to get wrong); a duplicate slug within the list (throws); fewer than 6 total projects in the fixture (returns fewer than 6, no error, no padding).
- **Cross-collection link validation tests** (`src/data/index.test.ts`), using in-memory fixtures for all three collections: a `links[].href` pointing at a real project slug (passes); an unknown project slug (throws, names the slug and the source file); an unrecognized internal-looking path like `/projets/foo` (throws, not silently ignored); an absolute external URL (never checked, never throws); a known static route like `/work-experience` (passes without needing a slug lookup).
- **`DRAFT_DATE`/`demo` gate tests**: a `workExperience` fixture with `draftDate: true` on one entry causes `check-launch-content`'s logic to report it (test the underlying filter/report logic directly, not the script's `process.exit` side effect); same for a `projects` fixture with `demo: true`; a fixture with neither reports clean.
- **`liveMode` unit test** (§4.7): a project with `liveUrl` set returns `{ mode: 'redirect', target }`; a project without it returns `{ mode: 'hosted' }` — small, but it's the one function SP04's route-building depends on getting exactly right, so it's worth pinning directly rather than only exercising it indirectly through a page-level test SP04 owns.
- **Manual QA, once, per collection, using temporary `_fixture-*.md` files** (deleted before commit, per `juno-landing-page`'s already-proven convention, §4.7 of its own `03-project-detail-pages/PRD.md`): drop a fixture project exercising every optional field (`status`, `liveUrl`, a `body` with a heading/list/table/code-block/GFM-table/internal-and-external link) into `src/content/projects/`, confirm it renders correctly in `npm run dev`, then delete it. This is the practical way to exercise the full markdown feature set and the palette-matched `prose` styling before real content (or SP06's `sample-project`, which serves this exact purpose permanently) exists to look at.

**Explicitly not worth building here:** integration tests that render actual page components (SP04's job, against its own templates, once they exist — this PRD's tests stop at the data layer); a schema-library-driven property-based fuzz test of the validators (real tooling disproportionate to a validation surface this small and this thoroughly covered by the targeted cases above); testing `react-markdown`/`remark-gfm`'s own rendering correctness (already exercised and trusted via `juno-landing-page`'s own test suite and production use — re-verifying a third-party library's own behavior here would be redundant).

---

## 8. Manual Intervention Required From You

1. **Resolved — no longer owner-blocked.** §4.9's original placeholder table asked the owner to confirm interim work-experience dates or supply real ones before the `DRAFT_DATE` gate would clear. That's since been settled: SP07's résumé mining (§4.3 there) found real dates for two of the three roles, and the owner decided to drop the third (Programming for Entrepreneurs and Social Good, no dateable source anywhere) rather than supply one. Zero `DRAFT_DATE: true` entries ship at launch; nothing further is needed from you here.
2. **Confirm project/research `date` values can be reasonably estimated from context** (hackathon names/years, paper publication years visible in existing DOI links, résumé timeline) rather than needing your direct input per item — none of the 10 projects or 5 research entries carries an explicit date in the current source either, but unlike work-experience (where literally zero ordering information exists), most of these items carry enough contextual clues (a "2025" in a hackathon URL, a 2019 DOI, "1,000+ downloads" implying an established/older item) for SP07 to produce a defensible estimate without a placeholder-marker mechanism. Flag any item where you'd rather supply the real date directly than have SP07 estimate one — see §9.
3. **Decide, per real project, whether an existing external link becomes its `liveUrl`** (redirect mode, §4.7) or stays only in `links[]` (no `/live` route at all for that project) — this is a judgment call about which projects are worth a "try it live" affordance versus which are purely historical/informational (e.g. Columbia Virtual Campus). Not launch-blocking; every project works correctly with `liveUrl` entirely absent.
4. **Nothing else in this sub-project is owner-blocked.** The image placeholder, the tag vocabularies, the status enum, and the featured-projects list are all specified precisely enough for SP07 to author content and SP03/SP04 to build pages without further input from you — flagged here explicitly so it's clear this list is short on purpose, not incomplete.

---

## 9. Open Questions & Decisions

- `[RESOLVED: Legal is two hand-written JSX pages, not a markdown collection]` — matches `juno-landing-page`'s own actual `PrivacyPage.tsx`/`TermsPage.tsx` precedent directly; no enumeration need, no card/list surface, and the content needs live `ConsentContext`/obfuscated-email integration that markdown can't express without inventing templating machinery. See §4.2.
- `[RESOLVED: slug = filename, frontmatter slug field required and must match, for Projects/Research only — not Work Experience]` — Work Experience has no route ever addressing an item by slug, so there's nothing external to keep in agreement with the filename. See §4.2.
- `[RESOLVED: hand-rolled TypeScript validation, not zod/yup]` — validation surface is small and fully enumerable; matches `juno-landing-page`'s own precedent; a schema library would add a dependency and a translation layer for no correctness gain here. See §4.5.
- `[RESOLVED: unknown-frontmatter-key rejection added, strengthening beyond juno-landing-page's own loader]` — the reference loader never checks for extra/mistyped keys; this content model does, closing a real silent-failure gap the reference has. See §4.3.
- `[RESOLVED: description and body are kept as two distinct fields on Projects/Research, diverging from juno-landing-page's own documented reversal that collapsed them into one]` — this brief's own frontmatter list (§3) specifies both fields with a clear, different rule for which renders where (`description` always shown; `body` optional and deeper) — the reference's reversal solved a different problem (two prose fields with no rule for which renders where) that doesn't apply here. See §4.4.1.
- `[RESOLVED: Research drops liveUrl despite the brief's literal "same shape as Projects" wording]` — no `/research/<slug>/live` route exists anywhere in the site map for it to drive; a field with zero live consumers is a footgun, not fidelity. Restorable in one line if a research-live route is ever added. See §4.4.3.
- `[RESOLVED: prose typography uses a custom palette-matched DEFAULT variant, not prose-neutral]` — diverges from `juno-landing-page`'s own choice, justified because this brief's design-language section treats the exact palette as load-bearing in a way the reference project's brief didn't. See §4.8.
- `[RESOLVED: DRAFT_DATE accepts only `true` or complete absence, never `false`]` — forces removal rather than toggling, so neither a human skim nor a `grep -l DRAFT_DATE` sanity check can be fooled by a lingering, inert `false`. See §4.9.
- `[RESOLVED: exact DRAFT_DATE placeholder values, originally pinned in §4.9's table, are superseded by real dates and an owner decision]` — the original table was chosen to produce the brief-mandated interim order (Fabric Maps → Jio → Programming for Entrepreneurs) via ordinary `startDate`-descending sort. It's kept in §4.9 for the record, struck through, not deleted. What actually ships: Microsoft Fabric Maps and Jio, Reliance Industries carry real, résumé-sourced dates (SP07 §4.3), and Programming for Entrepreneurs and Social Good is dropped from the site entirely rather than shipped on its placeholder — the only one of the three with no dateable source anywhere. Zero `DRAFT_DATE: true` entries ship at launch; the mechanism itself remains for future roles. See §4.9.
- `[RESOLVED: the Programming for Entrepreneurs and Social Good TA-ship is dropped from the site — owner decision, 2026-08-31]` — it doesn't appear in the résumé at all (Work/Research/Leadership sections checked directly, SP07 §4.3), no dateable source exists for it anywhere, it was the weakest of the three work-experience entries for the brief's health-tech repositioning (§1), and dropping it removes the initiative's only launch-blocking content gate (the `DRAFT_DATE` placeholder it would otherwise have carried indefinitely). See §4.9, SP07 §4.3/§9.
- `[RESOLVED: /projects/<slug>/live redirect-vs-hosted distinction is `liveUrl` present vs. absent; hosted-page registration is a separate, non-content-driven registry SP04 owns]` — a hosted page is bespoke code that can't be described by markdown, so the content layer's job is limited to exposing one optional string field. See §4.7.
- `[RESOLVED: featured.ts backfill excludes already-listed slugs from the backfill candidate pool, resolving the "listed slug that's also recent" interaction cleanly]` — see §4.6, point 4, and the corresponding test case in §7.
- `[DEFERRED] Cross-collection link validation does not parse markdown body content for embedded internal links]` — only frontmatter `links[].href` is checked; no real content in the brief's inventory (§6) exercises an in-body internal cross-link, so the additional machinery (a remark-AST link-extraction pass) isn't justified yet. Revisit if a future write-up genuinely wants to link to another project from inside its prose. See §4.5.4.
- `[DEFERRED] Real HTTP redirect (via generated firebase.json entries) vs. client-side <Navigate> for /projects/<slug>/live's redirect mode]` — recommended direction stated in §4.7, but the concrete mechanism crosses into SP01's `firebase.json` ownership and SP04's route-building; not designed here.
- `[RESOLVED: Nav and Footer link targets are data in `src/config/links.ts`, and the existing build-time content validator asserts every internal entry is in `KNOWN_STATIC_ROUTES`]` — a typo in a nav href is exactly the class of error this pipeline exists to catch at build time, and it costs one loop. The mechanism is deliberately not a lint rule or a new test harness: SP01's `Nav`/`Footer` stop hardcoding hrefs in JSX and instead map over exported arrays (`NAV_LINKS`, `FOOTER_LINKS`) in `src/config/links.ts`; `validateNavAndFooterLinks()` (§4.5.4) iterates those arrays and fails the build on any internal href not present in `KNOWN_STATIC_ROUTES`. External hrefs (via `isExternalUrl`) are skipped. This makes SP01's `Nav`/`Footer` data-driven, which SP01 §4.6 now reflects.
- `[RESOLVED: date-confidence tiering]` — SP07 §4.1/§4.2/§4.4 supplies a date for every one of the 15 project/research items with an explicit per-item confidence tier: 11 at high/medium confidence, 4 (Juno, Med-Doc Tracker, Crunchy Filler, Clip-Verse) as explicit low-confidence estimates. No `DRAFT_DATE`-style build gate is added for these, exactly as this PRD's original judgment proposed; the residual risk (a wrong guess silently reorders `/projects` and changes `featured.ts` backfill) is carried as an owner-review item in SP07 §8 item 1, not as a blocker. Cross-reference SP07 §9's matching `[RESOLVED: date-confidence tiering]` entry.
- `[DEFERRED: the gate stays a manually-run `npm run check:launch` script; CI is out of scope per brief §4's non-goals]` — the acknowledged residual risk ("manual and easy to forget") is real but is mitigated concretely: the script is wired as an npm script and named in SP01's `README.md` pre-launch checklist (SP01 §4.1), so it's one command, not a remembered procedure.

