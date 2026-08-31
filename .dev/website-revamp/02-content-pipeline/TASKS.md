# Tasks: Content Pipeline (SP02)

Source of truth: `/root/projects/tejitpabari/.dev/website-revamp/02-content-pipeline/PRD.md`. Every task below cites the PRD §4 subsection it implements. This sub-project builds the pipeline, its types, and its validators — **not** the markdown content files themselves (SP07's job) and **not** any page/route component (SP03/SP04's job).

**Toolchain assumption, confirmed from SP01's PRD, not re-derived here:** `gray-matter@^4.0.3`, `react-markdown@^10.1.0`, `remark-gfm@^4.0.1`, `@tailwindcss/typography@^0.5.20`, and `vitest@^4.1.11` (`npm test` → `vitest run`) are already installed by SP01's `package.json`. No task below installs a dependency. `src/content/` and `src/config/` already exist as empty directories per SP01's scaffold; `src/data/` does not exist yet and is created by Task 1.

---

### Task 1 — Shared content types & validators
   - Files: `src/data/shared.ts` (new)
   - Changes: Create the file exactly as specified in PRD §4.3. Export the `Link` type and every validator helper: `assertNoUnknownKeys`, `assertSlugMatchesFilename`, `assertRequiredString`, `assertTags`, `assertOptionalStatus`, `assertLinks`, `normalizeDateField`, `assertAbsoluteUrl`, `assertImagePath`.

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
// scalar into a native JS Date, not a string. Every date-shaped field must
// be normalized back to a plain ISO string.
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

export function assertImagePath(path: string, value: unknown): string {
  if (typeof value !== 'string' || !(value.startsWith('/') || /^https?:\/\//.test(value))) {
    throw new Error(`${path}: "image" must be a root-relative path ("/images/...") or an absolute http(s) URL.`);
  }
  return value;
}
```

   - Acceptance criteria: `npx tsc --noEmit` passes with no errors involving this file. The file exports exactly the nine names above (verify with `grep -c "^export function\|^export type" src/data/shared.ts` → 9). This file has no runtime test of its own — every validator here is exercised indirectly through Task 2/3/4's loaders and directly through Task 11's `shared.test.ts`.

---

### Task 2 — Projects collection: type, loader, validation, `liveMode`
   - Files: `src/data/projects.ts` (new), `src/content/projects/` (new empty directory, e.g. via a `.gitkeep`)
   - Changes: Implement per PRD §4.2, §4.4.1, §4.4.2, §4.5.1, §4.5.2, §4.7. Export `parseProject` (not just used internally) so Task 11's tests can exercise the full per-file parse path directly with an in-memory raw string, and export `liveMode`/`LiveMode` so Task 12 can test it directly.

```ts
// src/data/projects.ts
import matter from 'gray-matter';
import {
  type Link,
  assertNoUnknownKeys,
  assertSlugMatchesFilename,
  assertRequiredString,
  assertTags,
  assertOptionalStatus,
  assertLinks,
  normalizeDateField,
  assertAbsoluteUrl,
  assertImagePath,
} from './shared';

export type ProjectStatus = 'Building' | 'Not Started' | 'Completed';
export type ProjectTag = 'Health Tech' | 'Developer Tools' | 'Others';

export type Project = {
  slug: string;
  title: string;
  description: string;
  image: string;
  tags: ProjectTag[];
  status?: ProjectStatus;
  liveUrl?: string;
  links: Link[];
  date: string;
  body: string;
  demo?: true;
};

const ALLOWED_KEYS = ['slug', 'title', 'description', 'image', 'tags', 'status', 'liveUrl', 'links', 'date', 'body', 'demo'];
const PROJECT_TAGS: readonly ProjectTag[] = ['Health Tech', 'Developer Tools', 'Others'];
const PROJECT_STATUSES: readonly ProjectStatus[] = ['Building', 'Not Started', 'Completed'];

export function parseProject(path: string, raw: string): Project {
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

const files = import.meta.glob('/src/content/projects/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

export const projects: Project[] = Object.entries(files)
  .map(([path, raw]) => parseProject(path, raw))
  .sort((a, b) => b.date.localeCompare(a.date));

const seenProjectSlugs = new Set<string>();
for (const p of projects) {
  if (seenProjectSlugs.has(p.slug)) {
    throw new Error(`Duplicate slug "${p.slug}" across multiple files in src/content/projects/. Slugs must be unique.`);
  }
  seenProjectSlugs.add(p.slug);
}

export type LiveMode = { mode: 'redirect'; target: string } | { mode: 'hosted' };

export function liveMode(project: Project): LiveMode {
  return project.liveUrl ? { mode: 'redirect', target: project.liveUrl } : { mode: 'hosted' };
}
```

   - Acceptance criteria:
     1. `npm run build` succeeds with `src/content/projects/` empty (zero `.md` files) — `projects` resolves to `[]`.
     2. Negative path — missing required field: create `src/content/projects/_fixture-bad.md` with valid frontmatter except `title` omitted. Run `npm run build`; confirm it fails with an error naming `_fixture-bad.md` and `title`. Delete the fixture; confirm `npm run build` passes again.
     3. Negative path — invalid `tags` value: same fixture pattern with `tags: ["Nonexistent"]`; confirm the build fails naming the file and the bad tag value. Delete the fixture afterward.
     4. Negative path — slug/filename mismatch: a fixture file `src/content/projects/_fixture-a.md` with frontmatter `slug: _fixture-b`; confirm the build fails naming the mismatch. Delete afterward.
     5. Negative path — `demo: false` (or any value other than `true`): confirm the build fails; only `true` or the key's total absence is accepted. Delete afterward.
     6. Negative path — duplicate slug: two fixture files declaring the same `slug` in frontmatter (each individually filename-matched, e.g. `_fixture-dup1.md` with `slug: _fixture-dup1` — no wait, per §4.5.2 the duplicate check exists for the case where two *different* filenames declare the *same* frontmatter slug, so intentionally violate slug/filename agreement is not the way to trigger this cleanly; instead use two files whose own frontmatter slug matches their own filename is impossible if both claim the same slug — so construct: `_fixture-orig.md` (`slug: _fixture-orig`) and `_fixture-orig-v2.md` (`slug: _fixture-orig`, which fails Task 2's own slug/filename check first). **Verify by reading the duplicate-slug loop's actual trigger condition** — since `assertSlugMatchesFilename` runs per-file first, a genuine duplicate can only occur via two filenames that each match their own declared slug, which is structurally impossible under `slug === filename`. Confirm this understanding by inspection (the duplicate-slug check is defense-in-depth for a scenario `assertSlugMatchesFilename` already prevents given this collection's naming rule) and note it in a one-line code comment above `seenProjectSlugs` rather than writing an unreachable test.
     7. `liveMode({ liveUrl: 'https://example.com' } as Project)` returns `{ mode: 'redirect', target: 'https://example.com' }`; `liveMode({} as Project)` returns `{ mode: 'hosted' }` (spot-checked here; full test in Task 12).

---

### Task 3 — Research collection: type, loader, validation
   - Files: `src/data/research.ts` (new), `src/content/research/` (new empty directory, e.g. via a `.gitkeep`)
   - Changes: Implement per PRD §4.4.3. Same mechanism as Task 2, with two deliberate differences from Projects: **no `liveUrl` field** and **no `demo` field** — `ALLOWED_KEYS` omits both, so setting either on a research file fails the build via `assertNoUnknownKeys` (this is the enforcement mechanism for the PRD's `[RESOLVED]` decision that Research doesn't get `liveUrl`, §4.4.3/§9). Export `parseResearch` for Task 11's tests.

```ts
// src/data/research.ts
import matter from 'gray-matter';
import {
  type Link,
  assertNoUnknownKeys,
  assertSlugMatchesFilename,
  assertRequiredString,
  assertTags,
  assertOptionalStatus,
  assertLinks,
  normalizeDateField,
  assertImagePath,
} from './shared';

export type ResearchTag = 'Health' | 'Machine Learning' | 'Other';
export type ResearchStatus = 'Building' | 'Not Started' | 'Completed';

export type Research = {
  slug: string;
  title: string;
  description: string;
  image: string;
  tags: ResearchTag[];
  status?: ResearchStatus;
  links: Link[];
  date: string;
  body: string;
};

const ALLOWED_KEYS = ['slug', 'title', 'description', 'image', 'tags', 'status', 'links', 'date', 'body'];
const RESEARCH_TAGS: readonly ResearchTag[] = ['Health', 'Machine Learning', 'Other'];
const RESEARCH_STATUSES: readonly ResearchStatus[] = ['Building', 'Not Started', 'Completed'];

export function parseResearch(path: string, raw: string): Research {
  const filenameSlug = path.split('/').pop()!.replace(/\.md$/, '');
  const { data, content } = matter(raw);
  assertNoUnknownKeys(path, data, ALLOWED_KEYS);
  const slug = assertSlugMatchesFilename(path, filenameSlug, data);
  const title = assertRequiredString(path, 'title', data.title);
  const description = assertRequiredString(path, 'description', data.description);
  const image = assertImagePath(path, data.image);
  const tags = assertTags(path, data.tags, RESEARCH_TAGS) as ResearchTag[];
  const status = assertOptionalStatus(path, data.status, RESEARCH_STATUSES) as ResearchStatus | undefined;
  const links = assertLinks(path, data.links);
  const date = normalizeDateField(path, 'date', data.date);
  return { slug, title, description, image, tags, status, links, date, body: content.trim() };
}

const files = import.meta.glob('/src/content/research/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

export const research: Research[] = Object.entries(files)
  .map(([path, raw]) => parseResearch(path, raw))
  .sort((a, b) => b.date.localeCompare(a.date));

const seenResearchSlugs = new Set<string>();
for (const r of research) {
  if (seenResearchSlugs.has(r.slug)) {
    throw new Error(`Duplicate slug "${r.slug}" across multiple files in src/content/research/. Slugs must be unique.`);
  }
  seenResearchSlugs.add(r.slug);
}
```

   - Acceptance criteria:
     1. `npm run build` succeeds with `src/content/research/` empty.
     2. Negative path — set `liveUrl: 'https://example.com'` on a fixture research file: confirm the build fails via `assertNoUnknownKeys` naming `liveUrl` as an unrecognized field. Delete the fixture afterward.
     3. Negative path — invalid `status` value on a fixture file: confirm the build fails naming the file and the bad status value; a fixture with `status` entirely omitted must **not** fail (spot-check this explicitly — the PRD flags "optional validators accidentally written as required-with-default" as the likely failure mode here).
     4. Negative path — unquoted date landing as a `Date` object: a fixture with `date: 2024-01-01` (unquoted) must still normalize to `"2024-01-01"` and must **not** throw (confirms `normalizeDateField`'s `Date` branch, not just its string branch).

---

### Task 4 — Work Experience collection: type, loader, `DRAFT_DATE`
   - Files: `src/data/workExperience.ts` (new), `src/content/work-experience/` (new empty directory, e.g. via a `.gitkeep`)
   - Changes: Implement per PRD §4.4.4 and §4.9. No `slug`/filename check (no route ever addresses a role by slug). `body` is required and non-empty here — unlike Projects/Research, there is no separate `description` field to fall back on. Export `parseWorkExperience` for Task 11's tests.

```ts
// src/data/workExperience.ts
import matter from 'gray-matter';
import { type Link, assertRequiredString, assertLinks, normalizeDateField, assertNoUnknownKeys } from './shared';

export type WorkExperience = {
  company: string;
  role: string;
  startDate: string;
  endDate: string | 'Present';
  links: Link[];
  draftDate: boolean;
  body: string;
  id: string;
};

const ALLOWED_KEYS = ['company', 'role', 'startDate', 'endDate', 'links', 'DRAFT_DATE'];

export function parseWorkExperience(path: string, raw: string): WorkExperience {
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

const files = import.meta.glob('/src/content/work-experience/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

export const workExperience: WorkExperience[] = Object.entries(files)
  .map(([path, raw]) => parseWorkExperience(path, raw))
  .sort((a, b) => b.startDate.localeCompare(a.startDate));
```

   - Acceptance criteria:
     1. `npm run build` succeeds with `src/content/work-experience/` empty.
     2. Negative path — empty body: a fixture file with valid frontmatter and no markdown body content; confirm the build fails naming the file and stating the blurb must not be empty. Delete afterward.
     3. Negative path — `DRAFT_DATE: false`: confirm the build fails (only `true` or complete absence is accepted, per PRD §4.9's explicit reasoning against a lingering `false`). Delete afterward.
     4. Positive path — `DRAFT_DATE: true` with `endDate: "Present"`: confirm the fixture parses successfully with `draftDate: true`, `endDate: 'Present'`. Delete afterward. (Exercises the mechanism that must remain fully functional for future roles even though zero entries use it at launch, per PRD §4.9/BRIEF amendment.)

---

### Task 5 — Shared markdown link renderer
   - Files: `src/data/markdownComponents.tsx` (new)
   - Changes: Per PRD §4.8. Depends on `@/lib/isExternalUrl` (SP01-owned; PRD flags this as an assumption — if the import fails because the file doesn't exist yet, stop and confirm with the orchestrator rather than inlining a substitute, since a silent substitute would diverge from every other consumer of the real utility).

```tsx
// src/data/markdownComponents.tsx
import type { Components } from 'react-markdown';
import { isExternalUrl } from '@/lib/isExternalUrl';

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

   - Acceptance criteria: `npx tsc --noEmit` passes. `markdownComponents.a` is exercised indirectly by Task 6's `ContentBody` — no standalone unit test required per PRD §7 (not enumerated there as its own test target).

---

### Task 6 — Shared body-render helper
   - Files: `src/data/ContentBody.tsx` (new)
   - Changes: Per PRD §4.5.3. Depends on Task 5.

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

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. `<ContentBody body="" />` and `<ContentBody body="   " />` both return `null` — verify with a quick render assertion (`@testing-library/react`, already installed per SP01) or inline in Task 11's suite; this is the one behavior in this file worth pinning since PRD §4.5.3 calls it out as the specific "empty body → render nothing" contract every downstream template relies on.
     3. Manual QA pass (PRD §7, last bullet — do this once, it produces no lasting diff): create a temporary `src/content/projects/_fixture-full.md` with `demo`/other required fields filled and a `body` exercising a heading, a list, a table (GFM), a fenced code block, an internal link (`/projects` — a known static route), and an external link. Run `npm run dev`, visit the project's detail route once Task 8's `getStaticPaths` wiring exists (or temporarily console-render `<ContentBody>` in isolation if that route isn't wired yet), confirm the markdown renders with the palette-matched `prose` styling from Task 7 rather than default browser/gray-prose styling, then delete `_fixture-full.md` before committing. This step has no code to commit — it is a verification checkpoint, not a task boundary.

---

### Task 7 — Palette-matched prose typography tokens
   - Files: `tailwind.config.ts` (modify — SP01-owned file; this is an additive change, not a rewrite)
   - Changes: Per PRD §4.8. **Note on file path:** the PRD's own code sample says `tailwind.config.js`; SP01's actual delivered config is TypeScript (`tailwind.config.ts`, `export default { ... } satisfies Config`, `plugins: [typography]` already registered). Add the block below to the existing `theme.extend` object — do not touch `colors`, `fontFamily`, `borderRadius`, `boxShadow`, or `maxWidth`, which SP01 already owns.

```ts
// tailwind.config.ts — inside theme.extend, additive
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

   - Acceptance criteria: `npm run build` succeeds (Tailwind config remains valid TS satisfying `Config`). `className="prose max-w-none"` (used by Task 6's `ContentBody`, no `prose-neutral` modifier) resolves to these custom CSS custom properties, not Tailwind Typography's default gray palette — spot-check by inspecting the compiled CSS output for `--tw-prose-links:#0F4C45` or by running the manual QA pass described in Task 6's acceptance criteria.

---

### Task 8 — Aggregator: cross-collection link validation and Nav/Footer link validation
   - Files: `src/data/index.ts` (new)
   - Changes: Per PRD §4.5.4. This is the single module every consumer must import from (`@/data`, not `@/data/projects` directly) so validation always runs as a side effect of the first import. **Deviation from the PRD's code sample, needed for testability:** `validateInternalLinks` and `validateNavAndFooterLinks` are written as exported, parameterized functions (taking the collections/link arrays as arguments) rather than closures over the module-level `projects`/`research`/`workExperience` bindings — PRD §7 requires `src/data/index.test.ts` to exercise this logic "using in-memory fixtures," which is only possible if the functions accept fixture data as arguments instead of always reading the real, loaded content. The real-data call at the bottom of the file is what preserves the "runs once, eagerly, on first import" behavior the PRD specifies.
   - **Dependency, flag before starting:** this task imports `NAV_LINKS`/`FOOTER_LINKS` from `@/config/links` and `isExternalUrl` from `@/lib/isExternalUrl`. `src/config/links.ts` is SP01-owned (binding architect decision, resolving what was previously a three-way ownership collision with SP03; SP01's PRD §4.6/§9 creates it, SP03's PRD §4.2/§9 was updated to consume it only — see SP01 PRD §9). SP01 lands in Phase 1, before this sub-project's Phase 2 tasks run, so `src/config/links.ts` is expected to already exist when this task is picked up. If it doesn't, **stop and confirm with the orchestrator** whether SP01 is genuinely behind schedule, rather than authoring a placeholder version of a file this sub-project doesn't own.

```ts
// src/data/index.ts
import { projects, type Project } from './projects';
import { research, type Research } from './research';
import { workExperience, type WorkExperience } from './workExperience';
import { NAV_LINKS, FOOTER_LINKS } from '@/config/links';
import { isExternalUrl } from '@/lib/isExternalUrl';
import type { Link } from './shared';

export * from './projects';
export * from './research';
export * from './workExperience';

export const KNOWN_STATIC_ROUTES = ['/', '/projects', '/research', '/work-experience', '/privacy', '/terms'];

export function validateInternalLinks(projects: Project[], research: Research[], workExperience: WorkExperience[]): void {
  const projectSlugs = new Set(projects.map((p) => p.slug));
  const researchSlugs = new Set(research.map((r) => r.slug));

  const allLinkSources: { path: string; links: Link[] }[] = [
    ...projects.map((p) => ({ path: `src/content/projects/${p.slug}.md`, links: p.links })),
    ...research.map((r) => ({ path: `src/content/research/${r.slug}.md`, links: r.links })),
    ...workExperience.map((w) => ({ path: `src/content/work-experience/${w.id}.md`, links: w.links })),
  ];

  for (const { path, links } of allLinkSources) {
    for (const { href } of links) {
      if (!href.startsWith('/')) continue;
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

export function validateNavAndFooterLinks(navLinks: Link[], footerLinks: Link[]): void {
  const allLinks = [...navLinks, ...footerLinks];
  for (const { href, label } of allLinks) {
    if (isExternalUrl(href)) continue;
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

validateInternalLinks(projects, research, workExperience);
validateNavAndFooterLinks(NAV_LINKS, FOOTER_LINKS);
```

   - Acceptance criteria:
     1. `npm run build` succeeds — with zero content files and whatever real `NAV_LINKS`/`FOOTER_LINKS` the sibling file ships, both validators pass cleanly.
     2. Negative path (internal link to unknown slug): a fixture project file with `links: [{label: "x", href: "/projects/does-not-exist"}]`; confirm the build fails naming the file, the href, and the unknown slug. Delete afterward.
     3. Negative path (unrecognized internal path shape): a fixture with `links: [{label: "x", href: "/projcts/typo"}]` (note the typo); confirm the build fails with the "doesn't match a known route pattern" message, not a silent pass. Delete afterward.
     4. Positive path: a fixture with an absolute external URL in `links` (e.g. `https://example.com`) never triggers either check.

---

### Task 9 — Featured projects config
   - Files: `src/config/featured.ts` (new)
   - Changes: Per PRD §4.6. **Deviation from the PRD's code sample, needed for testability:** `computeFeatured` is exported (the PRD's sample leaves it as a private function), since §7 requires `src/config/featured.test.ts` to call it directly against an in-memory `Project[]` fixture rather than only through the real, loaded `projects` array.

```ts
// src/config/featured.ts
import { projects, type Project } from '@/data';

export const MAX_FEATURED = 6;

export const FEATURED_PROJECT_SLUGS: string[] = [
  'juno',
  'smarttest',
  'med-doc-tracker',
];

export function computeFeatured(all: Project[], slugs: string[]): Project[] {
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
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, remainingSlots);
    featured.push(...backfill);
  }

  return featured;
}

export const featuredProjects: Project[] = computeFeatured(projects, FEATURED_PROJECT_SLUGS);
```

   - Acceptance criteria:
     1. `npm run build` succeeds when `src/content/projects/` is empty **only if** `FEATURED_PROJECT_SLUGS` is temporarily emptied too (otherwise every listed slug is "unknown" against zero real projects) — verify this specific interaction once, then leave `FEATURED_PROJECT_SLUGS` as the three slugs shown above for SP07 to validate against once real content lands. Note this ordering dependency in a comment if the build is run before SP07's content exists.
     2. Negative path — unknown slug: temporarily add a nonexistent slug to `FEATURED_PROJECT_SLUGS`; confirm the build fails naming that exact slug. Revert.
     3. Negative path — more than 6 slugs: temporarily list 7 slugs; confirm the build fails stating the count and the max. Revert.
     4. Negative path — duplicate slug within the list: temporarily repeat one slug; confirm the build fails. Revert.

---

### Task 10 — Pre-launch content gate script
   - Files: `scripts/check-launch-content.ts` (new), `package.json` (modify — add one npm script)
   - Changes: Per PRD §4.9. **Deviation from the PRD's code sample, needed for testability:** factor the filtering/reporting logic into an exported `checkLaunchContent` function separate from `main()`'s `console.error`/`process.exit` side effects, so §7's "test the underlying filter/report logic directly, not the script's `process.exit` side effect" requirement is satisfiable. Guard `main()`'s invocation with an ESM-appropriate direct-execution check (`import.meta.url === file://\${process.argv[1]}`), not `require.main === module` (this project is ESM, no CommonJS `require`).

```ts
// scripts/check-launch-content.ts
import { projects, workExperience, type Project, type WorkExperience } from '../src/data';

export function checkLaunchContent(
  allProjects: Project[],
  allWorkExperience: WorkExperience[],
): { draftDates: WorkExperience[]; demoProjects: Project[] } {
  return {
    draftDates: allWorkExperience.filter((w) => w.draftDate),
    demoProjects: allProjects.filter((p) => p.demo === true),
  };
}

function main(): void {
  const { draftDates, demoProjects } = checkLaunchContent(projects, workExperience);

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
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

   Add to `package.json` `"scripts"`:
```json
"check:launch": "tsx scripts/check-launch-content.ts"
```
(If SP01's toolchain doesn't already have `tsx` installed, flag this — do not silently swap in a different runner without confirming, since the PRD names `tsx` specifically.)

   - Acceptance criteria:
     1. `npm run check:launch` exits 0 and prints "Pre-launch content check passed" with zero content files present.
     2. Negative path: temporarily add a fixture work-experience file with `DRAFT_DATE: true`; confirm `npm run check:launch` exits non-zero and its stderr names that exact file. Delete the fixture; confirm it passes again.
     3. Negative path: temporarily add a fixture project file with `demo: true`; confirm `npm run check:launch` exits non-zero and its stderr names that exact file. Delete the fixture; confirm it passes again.

---

### Task 11 — Validator unit tests
   - Files: `src/data/shared.test.ts` (new)
   - Changes: Per PRD §7, first bullet. Using `vitest`, construct malformed raw frontmatter strings in-memory and call `parseProject`/`parseResearch`/`parseWorkExperience` (from Tasks 2–4) directly — not through `import.meta.glob` — asserting each throws with a message containing the offending file path and field name. Cover every case the PRD names explicitly:

```ts
import { describe, it, expect } from 'vitest';
import { parseProject } from './projects';

describe('parseProject', () => {
  it('throws naming the file and field on a missing required field', () => {
    const raw = `---\nslug: foo\ntitle: Foo\nimage: /x.png\ntags: [Health Tech]\nlinks: []\ndate: "2024-01-01"\n---\n`;
    expect(() => parseProject('/src/content/projects/foo.md', raw)).toThrow(/foo\.md.*description/is);
  });

  it('throws on an invalid status enum value', () => {
    const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nstatus: Shipped\nlinks: []\ndate: "2024-01-01"\n---\n`;
    expect(() => parseProject('/src/content/projects/foo.md', raw)).toThrow(/status/i);
  });

  it('does NOT throw when status is entirely absent', () => {
    const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nlinks: []\ndate: "2024-01-01"\n---\n`;
    const result = parseProject('/src/content/projects/foo.md', raw);
    expect(result.status).toBeUndefined();
  });

  it('throws on an unknown frontmatter key', () => {
    const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nlinks: []\ndate: "2024-01-01"\ndescrption: typo\n---\n`;
    expect(() => parseProject('/src/content/projects/foo.md', raw)).toThrow(/descrption/);
  });

  it('throws on a slug/filename mismatch', () => {
    const raw = `---\nslug: bar\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nlinks: []\ndate: "2024-01-01"\n---\n`;
    expect(() => parseProject('/src/content/projects/foo.md', raw)).toThrow(/does not match filename/);
  });

  it('normalizes an unquoted date parsed as a Date object', () => {
    const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nlinks: []\ndate: 2024-01-01\n---\n`;
    const result = parseProject('/src/content/projects/foo.md', raw);
    expect(result.date).toBe('2024-01-01');
  });

  it('throws on a links entry missing href', () => {
    const raw = `---\nslug: foo\ntitle: Foo\ndescription: D\nimage: /x.png\ntags: [Health Tech]\nlinks: [{label: "x"}]\ndate: "2024-01-01"\n---\n`;
    expect(() => parseProject('/src/content/projects/foo.md', raw)).toThrow(/links\[0\]\.href/);
  });
});
```

   - Acceptance criteria: `npm test` (`vitest run`) passes, including all seven cases above (adapt the raw-YAML literal syntax as needed for whatever frontmatter list/object syntax gray-matter's YAML engine parses cleanly — verify by running the suite, not by assumption). Every `.toThrow(...)` assertion matches on a message fragment that includes either the file path or the specific field name — a bare `.toThrow()` with no message assertion does not satisfy this task, per PRD §7's explicit warning that a generic exception with no file/field context "would technically pass a looser test while failing the actual point."

---

### Task 12 — `liveMode` unit test
   - Files: `src/data/projects.test.ts` (new)
   - Changes: Per PRD §7, `liveMode` bullet. Not given an explicit filename in the PRD's §7 list (only `shared.test.ts`, `featured.test.ts`, `index.test.ts` are named there) — placed here, colocated with `projects.ts`, following the same `<file>.test.ts` convention.

```ts
import { describe, it, expect } from 'vitest';
import { liveMode, type Project } from './projects';

const baseProject: Project = {
  slug: 'x', title: 'X', description: 'D', image: '/x.png',
  tags: ['Others'], links: [], date: '2024-01-01', body: '',
};

describe('liveMode', () => {
  it('returns redirect mode when liveUrl is set', () => {
    expect(liveMode({ ...baseProject, liveUrl: 'https://example.com' })).toEqual({ mode: 'redirect', target: 'https://example.com' });
  });

  it('returns hosted mode when liveUrl is absent', () => {
    expect(liveMode(baseProject)).toEqual({ mode: 'hosted' });
  });
});
```

   - Acceptance criteria: `npm test` passes both cases.

---

### Task 13 — Featured-backfill unit tests
   - Files: `src/config/featured.test.ts` (new)
   - Changes: Per PRD §7, second bullet. Use an in-memory `Project[]` fixture — never real content files — calling `computeFeatured` (exported by Task 9) directly. Cover every case the PRD names:

```ts
import { describe, it, expect } from 'vitest';
import { computeFeatured } from './featured';
import type { Project } from '@/data';

function proj(slug: string, date: string): Project {
  return { slug, title: slug, description: 'd', image: '/x.png', tags: ['Others'], links: [], date, body: '' };
}

const all: Project[] = [proj('a', '2024-06-01'), proj('b', '2024-05-01'), proj('c', '2024-04-01'), proj('d', '2024-03-01'), proj('e', '2024-02-01'), proj('f', '2024-01-01'), proj('g', '2023-12-01')];

describe('computeFeatured', () => {
  it('backfills remaining slots by date descending when fewer than 6 are listed', () => {
    const result = computeFeatured(all, ['g']);
    expect(result.map((p) => p.slug)).toEqual(['g', 'a', 'b', 'c', 'd', 'e']);
  });

  it('does no backfill when exactly 6 are listed', () => {
    const result = computeFeatured(all, ['a', 'b', 'c', 'd', 'e', 'f']);
    expect(result.map((p) => p.slug)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('throws when more than 6 slugs are listed', () => {
    expect(() => computeFeatured(all, ['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toThrow(/max is 6/);
  });

  it('throws naming an unknown slug', () => {
    expect(() => computeFeatured(all, ['nonexistent'])).toThrow(/nonexistent/);
  });

  it('does not double-count a listed slug that is also the most recent by date', () => {
    // 'a' is both explicitly listed AND the most recent overall — it must
    // occupy exactly one slot, not appear twice via the backfill pass.
    const result = computeFeatured(all, ['a', 'g']);
    expect(result.map((p) => p.slug)).toEqual(['a', 'g', 'b', 'c', 'd', 'e']);
  });

  it('throws on a duplicate slug within the list itself', () => {
    expect(() => computeFeatured(all, ['a', 'a'])).toThrow(/duplicate/i);
  });

  it('returns fewer than 6 with no padding when fewer than 6 total projects exist', () => {
    const small = all.slice(0, 3);
    const result = computeFeatured(small, []);
    expect(result).toHaveLength(3);
  });
});
```

   - Acceptance criteria: `npm test` passes all seven cases, including the double-count case, which PRD §7 flags as "the one interaction case the task explicitly flagged as easy to get wrong."

---

### Task 14 — Cross-collection and Nav/Footer link validation tests
   - Files: `src/data/index.test.ts` (new)
   - Changes: Per PRD §7, third bullet. Use in-memory fixtures for all three collections, calling `validateInternalLinks`/`validateNavAndFooterLinks` (exported, parameterized per Task 8) directly rather than relying on the real loaded content.

```ts
import { describe, it, expect } from 'vitest';
import { validateInternalLinks, validateNavAndFooterLinks, KNOWN_STATIC_ROUTES } from './index';
import type { Project, Research, WorkExperience } from '@/data';

function proj(slug: string, links: { label: string; href: string }[] = []): Project {
  return { slug, title: slug, description: 'd', image: '/x.png', tags: ['Others'], links, date: '2024-01-01', body: '' };
}

describe('validateInternalLinks', () => {
  it('passes when a link points at a real project slug', () => {
    expect(() => validateInternalLinks([proj('a'), proj('b', [{ label: 'x', href: '/projects/a' }])], [], [])).not.toThrow();
  });

  it('throws naming the source file and the unknown slug', () => {
    expect(() => validateInternalLinks([proj('b', [{ label: 'x', href: '/projects/nonexistent' }])], [], []))
      .toThrow(/b\.md.*nonexistent/is);
  });

  it('throws on an unrecognized internal-looking path, not silently ignoring it', () => {
    expect(() => validateInternalLinks([proj('b', [{ label: 'x', href: '/projets/foo' }])], [], []))
      .toThrow(/does not match a known route pattern|doesn't match a known route pattern/);
  });

  it('never checks an absolute external URL', () => {
    expect(() => validateInternalLinks([proj('b', [{ label: 'x', href: 'https://example.com' }])], [], [])).not.toThrow();
  });

  it('passes a known static route without needing a slug lookup', () => {
    expect(() => validateInternalLinks([proj('b', [{ label: 'x', href: '/work-experience' }])], [], [])).not.toThrow();
  });
});

describe('validateNavAndFooterLinks', () => {
  it('passes internal entries present in KNOWN_STATIC_ROUTES', () => {
    expect(() => validateNavAndFooterLinks([{ label: 'Projects', href: '/#projects' }], [])).not.toThrow();
  });

  it('throws on an internal entry whose pathname is not a known route', () => {
    expect(() => validateNavAndFooterLinks([{ label: 'Bad', href: '/nope' }], [])).toThrow(/KNOWN_STATIC_ROUTES/);
  });

  it('skips external entries entirely', () => {
    expect(() => validateNavAndFooterLinks([], [{ label: 'Résumé', href: 'https://drive.google.com/...' }])).not.toThrow();
  });
});
```

   - Acceptance criteria: `npm test` passes all eight cases. Note: since Task 8's `src/data/index.ts` also runs `validateInternalLinks(projects, research, workExperience)` and `validateNavAndFooterLinks(NAV_LINKS, FOOTER_LINKS)` eagerly at module scope, merely importing `./index` in this test file re-triggers that real-data validation too — if it throws (e.g. because `@/config/links` doesn't exist yet, per Task 8's flagged dependency), this test file fails to even load. If that happens, this task is blocked on the same sibling dependency Task 8 is blocked on — do not work around it by refactoring `index.ts`'s import structure without confirming with the orchestrator first.

---

### Task 15 — Pre-launch gate logic tests
   - Files: `scripts/check-launch-content.test.ts` (new)
   - Changes: Per PRD §7, fourth bullet. Test `checkLaunchContent` (exported by Task 10) directly with in-memory fixtures — never invoke `main()` or assert on `process.exit`.

```ts
import { describe, it, expect } from 'vitest';
import { checkLaunchContent } from './check-launch-content';
import type { Project, WorkExperience } from '@/data';

const cleanProject: Project = { slug: 'a', title: 'A', description: 'd', image: '/x.png', tags: ['Others'], links: [], date: '2024-01-01', body: '' };
const demoProject: Project = { ...cleanProject, slug: 'sample-project', demo: true };
const cleanWork: WorkExperience = { company: 'C', role: 'R', startDate: '2024-01-01', endDate: 'Present', links: [], draftDate: false, body: 'b', id: 'c' };
const draftWork: WorkExperience = { ...cleanWork, draftDate: true };

describe('checkLaunchContent', () => {
  it('reports a work-experience entry with draftDate: true', () => {
    const { draftDates } = checkLaunchContent([cleanProject], [cleanWork, draftWork]);
    expect(draftDates.map((w) => w.id)).toEqual(['c']);
  });

  it('reports a project with demo: true', () => {
    const { demoProjects } = checkLaunchContent([cleanProject, demoProject], [cleanWork]);
    expect(demoProjects.map((p) => p.slug)).toEqual(['sample-project']);
  });

  it('reports clean when neither marker is present', () => {
    const result = checkLaunchContent([cleanProject], [cleanWork]);
    expect(result.draftDates).toHaveLength(0);
    expect(result.demoProjects).toHaveLength(0);
  });
});
```

   - Acceptance criteria: `npm test` passes all three cases.

---

## Summary of what requires you (not a dev agent)

1. **Résumé/owner-sourced facts are already resolved for SP02's scope.** PRD §8 items 1 and 4 confirm nothing here is owner-blocked: zero `DRAFT_DATE: true` entries ship at launch, and the image placeholder/tag vocabularies/status enum/featured list are all specified precisely enough to implement without further input.
2. **Two items from PRD §8 are judgment calls for content authoring (SP07's task, not a dev-agent decision within SP02's own tasks above), surfaced here since they'll come up once real content lands:** (a) confirm project/research `date` values estimated from context (hackathon years, DOI publication years, résumé timeline) are reasonable rather than needing your direct input per item; (b) decide, per real project, whether an existing external link becomes `liveUrl` (redirect mode) or stays only in `links[]`.
3. **One cross-sub-project file dependency is flagged inline (Task 8, Task 14), not a decision left open here:** `src/config/links.ts` (`NAV_LINKS`/`FOOTER_LINKS`) is SP01-owned (binding architect decision — see SP01 PRD §9, SP03 PRD §9). Confirm SP01 has actually landed it, and in what order relative to SP02, before Task 8/Task 14 are executed; if it isn't ready yet, those two tasks are genuinely blocked on SP01's schedule, not something to route around with a placeholder.
4. **`tsx` as the script runner for `check:launch` (Task 10)** is named directly in the PRD; confirm SP01's toolchain actually installs it (it wasn't found in this pipeline's own grep of SP01's `package.json` dependency list during task derivation) before wiring the npm script, or confirm the intended substitute.
