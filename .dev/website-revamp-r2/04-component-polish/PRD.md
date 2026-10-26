# PRD — Round 2, Sub-project R4: Component & Detail-Page Polish

**Repo:** `tejitpabari/tejitpabari`, branch `website-revamp`
**Depends on:** R1 (`01-shell-nav-chrome`) for `BackButton`'s new `to` prop, which `LiveRedirectFallback`
consumes here. Otherwise independent of R2/R3/R5 — no shared files.
**Consumed by:** R2 (`02-landing-sections`) — §9 carries a complete handoff for the Connect-panel
change inside `src/sections/ContactSection.tsx`, which R4 does not edit. R1 — §9 resolves R1's own
open cross-project item on `LiveRedirectFallback.tsx`'s `BackButton` target, and hands back one
exact one-line diff for `src/pages/ProjectLivePage.tsx` (R1-owned this round) to apply.
**Owns:** `src/components/*` (except `BackButton.tsx`, R1's), `src/data/ContentBody.tsx`,
`src/data/markdownComponents.tsx`, the `typography` block in `tailwind.config.ts`.
**Does NOT own (hard boundaries — cross-notes only, see §9):** `src/layout/*` (R1), `src/sections/*`
(R2), `src/content/**` / `src/pages/live/**` (R3), the legal pages (R5).
**Source of truth:** `/root/projects/tejitpabari/.dev/website-revamp-r2/SHARED-CONTEXT.md` (repo
facts, tokens, this round's locked decisions) and `REVISION-BRIEF.md` (owner feedback verbatim) —
every decision cited below as "SHARED-CONTEXT §N" or "brief #N" is settled there and not re-opened
here. `.dev/website-revamp-r2/01-shell-nav-chrome/PRD.md` (R1) is binding for `BackButton`'s new
signature and the `PageContainer`/chrome-mode conventions referenced in §9. `.dev/website-revamp-r2/
03-content-data/PRD.md` (R3) is binding for the `sample-project` deletion and the resulting empty
`HOSTED_LIVE_PAGES`, both load-bearing facts for §1 and §4.7 below.

---

## 1. Problem

Six owner complaints, all verified directly against the current code on `website-revamp` (none
assumed):

1. **Status renders as an undifferentiated teal pill in two places.** `src/components/DetailHeader.tsx`
   and `src/components/ProjectCard.tsx` each hardcode the identical markup —
   `rounded-full bg-teal/92 px-{3|2} py-{1|0.5} text-[0.68rem|0.58rem] font-semibold uppercase
   tracking-wide text-white` — with no per-status color. `Building` and `Completed` (the only two
   values any real content file currently uses — confirmed by `grep -h "^status:"
   src/content/{projects,research}/*.md`) look exactly the same, in the exact same shape the owner
   explicitly said to change ("status should be in a box"). A third allowed value, `Not Started`,
   exists in the type system (`ProjectStatus`/`ResearchStatus` in `src/data/{projects,research}.ts`,
   both `'Building' | 'Not Started' | 'Completed'`, enforced at content-parse time by
   `assertOptionalStatus`) but appears in zero content files today — any fix must still style it,
   since the build accepts it.

2. **`ContentBody`'s markdown rendering has three concrete, separately-diagnosable defects.**
   `src/data/ContentBody.tsx` renders `<div className="prose max-w-none">` — the typography plugin's
   *default* size scale, size-unmodified, with `tailwind.config.ts`'s `typography` extend block
   overriding only CSS-variable colors and link decoration, nothing about `fontSize`, heading scale,
   or vertical rhythm. Three separate things are wrong, verified by reading real files and real page
   composition (`src/pages/ProjectDetailPage.tsx`):
   - **Heading-to-body spacing/sizing has no relationship to the page's own type scale.** The page's
     own `<h1>` (`DetailHeader.tsx`) is `text-[1.9rem] sm:text-[2.4rem]`; the description paragraph
     right below it is `text-[0.98rem] leading-7`. `ContentBody`'s `prose` (unmodified) renders body
     text at the plugin's 1rem/1.75 default and any `<h2>` at 1.5em (effectively 1.5rem against a
     1rem base) — a noticeably larger, looser rhythm than everything else on the page, with no
     attempt to sit *below* the page's real h1 in visual hierarchy by design (it happens not to
     exceed it only by accident, at the plugin's default h1 size of 2.25em).
   - **The gap between `LinksRow` and `ContentBody` is 0px, not a bug of omission but a real
     collision.** `LinksRow` is `<div className="mt-6 flex flex-wrap gap-3">` — `mt-6` gives it space
     from *whatever precedes it*, but it applies no `margin-bottom` of its own. `ContentBody`'s
     wrapper (`<div className="prose max-w-none">`) has no top margin at all, and
     `@tailwindcss/typography`'s own base CSS sets `.prose > :first-child { margin-top: 0 }`
     specifically so embedding prose inside another flow doesn't double-margin — which here means
     the first rendered paragraph's own `margin-top` (which would otherwise separate it from
     `LinksRow`) is forced to `0`. Net effect, verified by tracing both files together: the "Open
     Live"/link pills and the first line of body text render with **zero** px of gap between them.
     This reproduces exactly what the owner described ("spacing between button and text").
   - **No spacing/size design exists for GFM structural elements** (headings, lists, task lists) at
     all — the current `typography` block is 13 lines of CSS-variable color assignments plus two
     link rules, nothing else.

3. **A GFM task list renders both a checkbox and a bullet marker.** Verified against the real
   dependency source, not assumed: `node_modules/mdast-util-to-hast/lib/handlers/list-item.js`
   shows a checked/unchecked list item gets `properties.className = ['task-list-item']` on the `<li>`
   and an `<input type="checkbox" disabled>` prepended as its first child — this is the exact
   `github-markdown-css` convention (the handler's own comment says so). `list.js` in the same
   package additionally stamps `class="contains-task-list"` on the parent `<ul>` the moment any
   child is a task item. Nothing in `tailwind.config.ts`'s `typography` block or
   `@tailwindcss/typography`'s own defaults ever sets `list-style-type: none` on that specific `<li>`
   — the plugin's default `ul { list-style-type: disc }` (confirmed in
   `node_modules/@tailwindcss/typography/src/styles.js`) cascades onto it unconditionally, so the
   browser draws its native `::marker` bullet *and* the checkbox renders right after it. **No
   `[data-type="taskList"]` attribute is ever emitted by this toolchain** — that's a different
   (ProseMirror/Tiptap-family) convention; a fix keyed on that attribute would silently do nothing.

4. **"Open Live" and internal markdown links stay in the current tab; only external markdown/CTA
   links already open a new tab.** `src/data/markdownComponents.tsx`'s `a()` renderer branches on
   `isExternalUrl(href)`: external gets `target="_blank" rel="noreferrer"`, internal gets a plain
   `<a href={href}>` (same tab). `src/components/LinksRow.tsx` renders the "Open Live" CTA as a
   react-router `<Link to={liveHref}>` — same-tab, client-side route transition — while every other
   entry in the same row (`links.map(...)`) already has `target="_blank" rel="noreferrer"`. Verified
   by grepping every `target="_blank"` occurrence in `src` (`ProjectCard.tsx`, `LinksRow.tsx`,
   `markdownComponents.tsx`, `Footer.tsx`, `Hero.tsx`, `ContactSection.tsx`,
   `timeline/TimelineEntry.tsx`): **every existing one already carries `rel="noreferrer"`** — no
   audit fix needed there, only the "Open Live" gap itself.

5. **The Connect panel puts Email in two places and the owner wants it in one.** `src/sections/
   ContactSection.tsx`'s left column already renders email as a `Button` (`{emailHref ? <Button
   href={emailHref}>Email Me</Button> : <span>...</span>}`) — that half of the ask is already true
   today. The right-hand `<aside>` "Connect" panel duplicates it: an Email block (icon + `mailto:`
   link, with its own null-before-hydration fallback) *and* a Profiles block (GitHub/LinkedIn), the
   two separated by a `border-t` divider. The owner wants the aside's Email block gone, leaving
   Profiles alone. **This file is R2's, not R4's** — this PRD designs the removal precisely and hands
   it off (§9); it does not edit `ContactSection.tsx`.

6. **`LiveRedirectFallback.tsx` always sends Back to `/`, never to the actual project.** R1's PRD
   (§4.7/§9) changes `BackButton` to accept a `to` prop (default `/`) and flags, as an explicit open
   cross-project item, that `src/components/LiveRedirectFallback.tsx` (R4-owned) renders
   `<BackButton/>` with no `to`, so once R1's new default lands, the redirect-mode branch of
   `/projects/:slug/live` will still Back to `/` instead of `/projects/:slug` — R1 cannot fix this
   itself (file-ownership boundary). Also relevant, from R3's PRD: `HOSTED_LIVE_PAGES` goes empty
   this round (the `sample-project` deletion removes its only entry), so the *hosted*-mode branch of
   `ProjectLivePage` is unreachable in the shipped state — the redirect-mode branch, and this fix,
   are the only live path through `/projects/:slug/live` right now.

**A load-bearing fact discovered while diagnosing items 2 and 3, stated once here rather than
re-derived per item below:** `sample-project.md` — the one content file with headings (`## Why this
page exists`, `### What it exercises`) *and* a GFM task list (`- [x] Ship the sample project` /
`- [ ] Delete this file...`) — is deleted outright by R3 this same round (SHARED-CONTEXT locked
decision 4). Every other real project/research body is either empty (`columbia-virtual-campus.md`,
`med-doc-tracker.md`, `clip-verse.md`, `crunchy-filler.md`, and all five research files) or plain,
heading-free paragraphs (`juno.md`, `smarttest.md`). This strongly suggests the owner's markdown
complaints (items 2 and 3) were observed against `sample-project.md` before its scheduled deletion —
which does not make them any less real (the rendering bugs are real, verified against the actual
render pipeline below, not against that one file's specific content) but does mean **there is
currently no real, shipped content that exercises headings or a task list to visually re-check
against post-fix** (juno.md/smarttest.md do exercise item 2's LinksRow→body collision, since both
have real `links:` entries followed immediately by body paragraphs). Flagged again as an owner item
in §8.

---

## 2. Goals

- One shared `StatusBadge` component (`src/components/StatusBadge.tsx`), consumed by both
  `DetailHeader` and `ProjectCard`, replacing the duplicated flat pill: a small-radius **box**, one
  color per status, every combination independently verified at ≥4.5:1 text contrast (computed, not
  eyeballed), legible over an arbitrary photo, with a compile-time exhaustiveness check so a future
  status value can't ship unstyled.
- A `typography` config in `tailwind.config.ts` that gives `ContentBody`'s rendered markdown a size
  ramp and heading rhythm that sits below the page's own `<h1>` and matches the page's tighter,
  compact type scale, plus a real fix for the `LinksRow`→`ContentBody` 0px-gap collision.
- A GFM task-list fix keyed on the *actual* DOM the real dependency chain emits (`li.task-list-item`,
  `ul.contains-task-list`), with the checkbox itself styled so it doesn't look like a raw default
  form control, and a stated, verified answer on whether `check-no-forms.sh` is affected.
- "Open Live" opens in a new tab like every other outbound affordance on the page; a stated,
  justified scope decision on how far "all links" extends (internal markdown links: yes; the
  `ProjectCard` grid-navigation link: no) with the reasoning written down, not just the conclusion.
- `LiveRedirectFallback.tsx` threads a real Back target through to R1's new `BackButton` `to` prop,
  resolving R1's open cross-project item, plus the one-line downstream call-site diff R1 needs to
  apply.
- A complete, actionable §9 handoff for R2 covering the Connect-panel change — or an explicit
  statement that no component-level work is needed at all, if that's the honest conclusion (it is).

## 3. Non-Goals

- No edits to `src/layout/*` (R1), `src/sections/*` (R2 — including `ContactSection.tsx` itself),
  `src/content/**` or `src/pages/live/**` (R3), or the legal pages (R5). Cross-file consequences are
  handed off in §9, never designed as if this PRD could implement them.
- No syntax highlighting for fenced code blocks — not requested, no dependency added for it
  (SHARED-CONTEXT: "no new runtime dependencies without a strong, stated reason").
- No change to `AnalyticsEventName` or the `outbound_click` context enum (`src/lib/analytics.ts`) —
  every `trackEvent` call this PRD touches keeps its existing `context` value; no new context is
  introduced.
- No extension of "open in new tab" to `Nav`/`Footer` (R1-owned) or `Hero`'s in-page `Contact Me`
  anchor (R2-owned, and correctly same-tab since it's a same-page scroll, not a navigation-away
  link) — out of file-ownership scope; flagged as a cross-note in §9, not decided here.
- No new shared component for the `Hero`/`ContactSection` GitHub+LinkedIn icon-row duplication
  noticed while reading `ContactSection.tsx` — real, but out of scope for what was asked; noted as an
  optional, non-blocking suggestion in §9.
- No runtime "unknown status" fallback color is built (see §4.2) — the double build-time gate
  (content-parser enum validation + a TypeScript exhaustiveness check) makes an unmapped status
  value unreachable through any type-checked call path, so a runtime branch for it would be dead
  code; noted as a deliberate choice in §9, not an oversight.

---

## 4. Architecture Decisions

### 4.1 File map

| File | Status | Change |
|---|---|---|
| `src/components/StatusBadge.tsx` | **New** | Shared colored status box, §4.2. |
| `src/components/StatusBadge.test.tsx` | **New** | §7. |
| `src/components/DetailHeader.tsx` | Modified | Consumes `StatusBadge`; `status` prop tightened to `BadgeStatus`, §4.3. |
| `src/components/ProjectCard.tsx` | Modified | Consumes `StatusBadge`; `status` prop tightened to `ProjectStatus`, §4.3. |
| `src/components/LinksRow.tsx` | Modified | "Open Live" CTA becomes a plain `target="_blank"` anchor, §4.6. |
| `src/components/LinksRow.test.tsx` | Modified | +1 test, §7. |
| `src/components/LiveRedirectFallback.tsx` | Modified | New `backTo` prop threaded into `BackButton`, §4.7. |
| `src/components/LiveRedirectFallback.test.tsx` | Modified | +2 tests, §7. |
| `src/data/ContentBody.tsx` | Modified | Wrapper gets `mt-6`, §4.4. |
| `src/data/ContentBody.test.tsx` | **New** | §7. |
| `src/data/markdownComponents.tsx` | Modified | Every link, not just external, opens in a new tab, §4.6. |
| `src/data/markdownComponents.test.tsx` | **New** | §7. |
| `tailwind.config.ts` | Modified | `typography` block rewritten (§4.4/§4.5); one new color token, `status-building` (§4.2). |
| `src/pages/ProjectLivePage.tsx` | **Not edited here** (R1-owned this round) | One-line diff handed off, §4.7/§9. |
| `src/sections/ContactSection.tsx` | **Not edited here** (R2-owned) | Complete diff handed off, §4.8/§9. |
| `src/sections/ContactSection.test.tsx` | **Not edited here** (R2-owned) | Impact flagged, §9. |

### 4.2 `StatusBadge` — one shared, colored box

**The real allowed status values, from the type system, not guessed:** `src/data/projects.ts` and
`src/data/research.ts` each independently declare `export type ProjectStatus = 'Building' | 'Not
Started' | 'Completed';` / `export type ResearchStatus = 'Building' | 'Not Started' | 'Completed';`,
both enforced at content-parse time by `assertOptionalStatus` (`src/data/shared.ts`), which throws
for any value outside the list. `src/data/index.ts` re-exports both (`export * from './projects'`,
`export * from './research'`).

**Color mapping — chosen from the existing tokens where possible, one new token added where the
palette genuinely can't express the distinction.** The existing 8 named tokens (`cream`, `sage`,
`teal`, `teal-secondary`, `ink`, `body`, `slate`, `slate-dark`) are all shades of the same
teal-green, plus warm neutrals — there is no existing token that reads as "active/in-progress" the
way a warm color conventionally does, and using `teal` (Completed) next to `teal-secondary`
(hypothetically Building) puts two very dark, hue-similar colors side by side at `ProjectCard`'s
small badge size (`text-[0.58rem]`, a single-line chip on a 120px-tall thumbnail) — genuinely hard to
tell apart at a glance, which defeats the entire point of "colored per status." One new token,
`status-building`, is added:

```ts
// tailwind.config.ts — colors, one addition
colors: {
  cream: '#F7F1E8',
  sage: '#DDE7DE',
  teal: { DEFAULT: '#043439', secondary: '#0F4C45' },
  ink: '#162b26',
  body: '#3E514D',
  slate: '#6B7B77',
  'slate-dark': '#4D5D59',
  placeholder: '#EEF3EE',
  'status-building': '#92400E', // NEW — StatusBadge's "in progress" color.
  // Value is Tailwind's own default amber-800 hex, reused deliberately
  // rather than inventing an arbitrary new color: a familiar, well-tested
  // exact value, formally declared as a named brand token here (not
  // referenced as a bare `amber-800` utility class anywhere) so it's
  // tracked in the design system the same way every other color is.
},
```

Final mapping — `Completed` reuses `teal` (settled/done, matches the current default look),
`Building` uses the new `status-building` (active/in-progress, a genuinely different hue),
`Not Started` reuses `slate-dark` (neutral/pending, deliberately less saturated than either):

| Status | Token | Hex | Text | Contrast (opaque) | Contrast (worst case — see below) |
|---|---|---|---|---|---|
| `Completed` | `teal` | `#043439` | white | **13.50:1** | **10.71:1** |
| `Building` | `status-building` | `#92400E` | white | **7.09:1** | **5.94:1** |
| `Not Started` | `slate-dark` | `#4D5D59` | white | **6.94:1** | **5.67:1** |

**Method, computed not eyeballed.** Relative luminance per WCAG 2.x (`0.2126·R + 0.7152·G +
0.0722·B` on linearized sRGB channels), contrast `(L₁+0.05)/(L₂+0.05)`. "Opaque" is white text on the
badge's own solid hex — the realistic case for constraint (b), 4.5:1 minimum. "Worst case" answers
constraint (a) (the badge sits on an arbitrary photo, per `DetailHeader`'s absolute-overlay
placement): the badge keeps the existing `/92` opacity convention (`bg-teal/92` today), so the
*worst* a photo can do to it is an 8% blend of a **pure white** pixel underneath the entire chip —
computed by blending each channel `0.92·badge + 0.08·255` and re-running the same contrast formula.
All three colors clear 4.5:1 even under this deliberately pessimistic bound (no real photo is a flat
white rectangle exactly the size and position of the badge), so the existing `/92` opacity is kept
rather than raised — raising it further only matters if this bound were failing, which it isn't, with
real margin (5.67:1 minimum, 26% above the 4.5:1 floor).

**`src/components/StatusBadge.tsx` — new file, complete:**

```tsx
// src/components/StatusBadge.tsx
import type { ProjectStatus, ResearchStatus } from '@/data';

/** Every status value either collection's frontmatter can carry. Kept as an
 *  explicit union (not just `ProjectStatus`) so a status ever added to one
 *  collection but not the other still type-checks here without this file
 *  needing to know which collection is calling it. */
export type BadgeStatus = ProjectStatus | ResearchStatus;

type StatusBadgeSize = 'sm' | 'md';

// `satisfies Record<BadgeStatus, string>` is the compile-time exhaustiveness
// check the brief asks for: if a future content author adds a new literal to
// ProjectStatus or ResearchStatus (src/data/projects.ts / src/data/
// research.ts) without adding a matching key here, `npm run typecheck` fails
// on this line ("Property '<NewStatus>' is missing") — the build breaks at
// the color-mapping site itself, not silently at runtime with an unstyled
// badge. Combined with assertOptionalStatus already throwing at content-parse
// time for any value outside the allowed list, an unmapped status cannot
// reach this component through any type-checked path — see PRD §4.2/§9 for
// why no runtime fallback color is added on top of this.
const STATUS_STYLES = {
  'Not Started': 'bg-slate-dark/92 text-white',
  Building: 'bg-status-building/92 text-white',
  Completed: 'bg-teal/92 text-white',
} satisfies Record<BadgeStatus, string>;

const SIZE_STYLES: Record<StatusBadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[0.58rem]', // ProjectCard's existing pill size
  md: 'px-3 py-1 text-[0.68rem]',   // DetailHeader's existing pill size
};

interface StatusBadgeProps {
  status: BadgeStatus;
  /** @default 'md' */
  size?: StatusBadgeSize;
  /** Positioning only (e.g. "absolute left-3 top-3") — composed by the
   *  parent, which already knows where the badge sits on its own image. */
  className?: string;
}

export function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`rounded-md font-semibold uppercase tracking-wide ${SIZE_STYLES[size]} ${STATUS_STYLES[status]} ${className}`}
    >
      {status}
    </span>
  );
}
```

`rounded-md` (Tailwind's default 0.375rem) is the "box" the owner asked for — a small radius, not
`rounded-full`. No new radius token needed; the four custom radius tokens (`xl2`/`card`/`panel`/
`section`) are all 1rem+, meant for large surfaces (cards, panels, image frames), not a one-line
chip — reaching for Tailwind's own default `rounded` scale here is the same kind of "use the
ambient default, don't invent a token for it" call already implicit elsewhere in this file (e.g.
`rounded-full` itself, `rounded-xl`, `text-sm` are all Tailwind defaults used throughout the app
without being declared in `tailwind.config.ts`).

### 4.3 `DetailHeader` / `ProjectCard` — consuming `StatusBadge`

**`src/components/DetailHeader.tsx`:**

```tsx
// before
{status && (
  <span className="absolute left-3 top-3 rounded-full bg-teal/92 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wide text-white">
    {status}
  </span>
)}
```
```tsx
// after
{status && <StatusBadge status={status} size="md" className="absolute left-3 top-3" />}
```

Full new file:

```tsx
// src/components/DetailHeader.tsx
import { TagPill } from './TagPill';
import { StatusBadge, type BadgeStatus } from './StatusBadge';

interface DetailHeaderProps {
  image: string;
  imageAlt?: string;
  title: string;
  status?: BadgeStatus; // was `string` — tightened, see below
  tags: string[];
}

export function DetailHeader({ image, imageAlt = '', title, status, tags }: DetailHeaderProps) {
  return (
    <header className="mt-6">
      <div className="relative overflow-hidden rounded-section bg-placeholder">
        <img src={image} alt={imageAlt} className="h-[200px] w-full object-cover sm:h-[260px] lg:h-[320px]" />
        {status && <StatusBadge status={status} size="md" className="absolute left-3 top-3" />}
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

**`status?: string` → `status?: BadgeStatus`, a deliberate narrowing, not a breaking change.**
`DetailHeader` is used by both `ProjectDetailPage` (`project.status: ProjectStatus | undefined`) and
`ResearchDetailPage` (`item.status: ResearchStatus | undefined`) — both real call sites already pass
a value assignable to `BadgeStatus`, so this compiles with zero call-site changes. It buys real
safety: `StatusBadge`'s own exhaustiveness check can only do its job if nothing upstream widens the
value back to a bare `string` first.

**`src/components/ProjectCard.tsx`:**

```tsx
// before
{status && (
  <span className="absolute left-2 top-2 rounded-full bg-teal/92 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wide text-white">
    {status}
  </span>
)}
```
```tsx
// after
{status && <StatusBadge status={status} size="sm" className="absolute left-2 top-2" />}
```

`ProjectCardProps.status` narrows from `string` to `ProjectStatus` (imported `import type {
ProjectStatus } from '@/data';`) — `ProjectCard` is Project-only (never used for Research), so the
narrower, collection-specific type is more precise than `BadgeStatus`; it's still assignable into
`StatusBadge`'s `BadgeStatus` prop (`ProjectStatus` is a subset). Add `import { StatusBadge } from
'./StatusBadge';`, remove nothing else — `TagPill`/`ExternalLinkIcon` imports and every other prop
are untouched.

**Existing tests verified NOT broken, by actually reading them, not assuming:**
- `src/components/DetailHeader.test.tsx` — every assertion is `getByText('Building')`/
  `queryByText('Building')` (text content) or a child-count check on `.bg-placeholder` (`toHaveLength(1)`
  absent, `toHaveLength(2)` present). `StatusBadge` still renders exactly one `<span>` with the status
  text as its only child — both assertions pass unmodified. No test references `rounded-full`, the
  pill's exact class list, or any other implementation detail this change touches.
- `src/components/ProjectCard.test.tsx` — same shape: `screen.getByText('Building')` /
  `screen.queryByText('Building')`, no class-based assertions. Unaffected.

Neither test file needs a single line changed by this section. (`StatusBadge.test.tsx` is new, §7.)

### 4.4 `ContentBody` typography — size ramp, heading rhythm, and the `LinksRow` gap fix

**The `LinksRow`→`ContentBody` gap, fixed at the source, not by adding a bottom margin to `LinksRow`.**
`LinksRow` can render `null` (no links, no `liveHref`) — a `margin-bottom` on it would vanish exactly
when there's nothing above `ContentBody` to separate from, which is the wrong place to guarantee
spacing. `ContentBody` always either renders `null` (empty body) or its full wrapper — the wrapper is
the one place that can reliably carry a top margin regardless of what (if anything) rendered above
it:

```tsx
// before
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
```tsx
// after
export function ContentBody({ body }: { body: string }): React.JSX.Element | null {
  if (!body.trim()) return null;
  return (
    <div className="prose mt-6 max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {body}
      </ReactMarkdown>
    </div>
  );
}
```

`mt-6` matches the rhythm both detail-page templates already use twice (`DetailHeader`→description
is `mt-4`, description→`LinksRow` is `mt-6`) — reusing the established value rather than introducing
a fourth one-off spacing constant. This closes the gap regardless of `@tailwindcss/typography`'s own
`.prose > :first-child { margin-top: 0 }` rule (which still fires — it's what was suppressing the
first paragraph's own margin — but no longer matters, since the wrapper's own `mt-6` now provides the
separation instead of relying on the paragraph's margin to do it).

**Full replacement `typography` block** (combines this section's size/heading/spacing fix with
§4.5's task-list fix — both live in the same config object):

```ts
// tailwind.config.ts — typography, complete replacement
typography: () => ({
  DEFAULT: {
    css: {
      fontSize: '0.95rem',
      lineHeight: '1.7',
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

      // Heading ramp — sits below the page's own <h1> (DetailHeader,
      // 1.9rem/2.4rem across breakpoints) since content markdown is
      // expected to start at h2 (sample-project.md's own convention before
      // its deletion this round: "## Why this page exists"). h1 is still
      // styled here, capped well below the page h1's smallest breakpoint
      // value, purely as a defensive floor in case a content author ever
      // writes one — it should never visually outrank the real page title.
      h1: { fontSize: '1.5rem', lineHeight: '1.25', fontWeight: '800', marginTop: '0', marginBottom: '0.75em' },
      h2: { fontSize: '1.28rem', lineHeight: '1.3', fontWeight: '800', marginTop: '2em', marginBottom: '0.65em' },
      h3: { fontSize: '1.08rem', lineHeight: '1.35', fontWeight: '700', marginTop: '1.6em', marginBottom: '0.5em' },
      h4: { fontSize: '0.98rem', fontWeight: '700', marginTop: '1.4em', marginBottom: '0.4em' },
      p: { marginTop: '0', marginBottom: '1.1em' },
      'ul, ol': { marginTop: '0.9em', marginBottom: '1.1em' },
      li: { marginTop: '0.35em', marginBottom: '0.35em' },

      // GFM task lists — see PRD §4.5 for why these three selectors (not
      // `[data-type="taskList"]`, not `:has()`) are the real, verified fix.
      'ul.contains-task-list': { paddingInlineStart: '0' },
      'li.task-list-item': { listStyleType: 'none' },
      'li.task-list-item input[type="checkbox"]': {
        marginInlineEnd: '0.6em',
        accentColor: '#0F4C45',
        verticalAlign: 'middle',
      },
    },
  },
}),
```

**Why explicit `fontSize`/heading overrides on `DEFAULT`, not `prose-sm`/`prose-lg` variant
classes.** The typography plugin ships three fixed size presets (`sm` 0.875rem, base 1rem, `lg`
1.125rem base) — none lands close to this page's actual established body size (`0.98rem`, the
description paragraph's own size). Rather than pick the nearest preset and accept the mismatch (or
stack a `prose-sm` class *and* override half its values anyway), the `DEFAULT.css.fontSize` is set
directly to `0.95rem` — a hair below the description paragraph's `0.98rem`, reading as "the same
register, slightly more relaxed for longer body copy" rather than a visibly different size regime.
`ContentBody`'s markup itself is unchanged beyond the `mt-6` above — no `prose-sm`/`prose-lg` class is
added to its `className` string, since the full ramp now lives in config.

**`ResearchDetailPage` uses the identical `ContentBody` component with no page-specific prop or
variant** — confirmed by reading `src/pages/ResearchDetailPage.tsx`, which calls `<ContentBody
body={item.body} />` exactly like `ProjectDetailPage` calls `<ContentBody body={project.body} />`,
same page composition above it (`DetailHeader` → description `<p>` → `LinksRow` → `ContentBody`, same
classes, same order). Every change in this section applies identically to both; no research-specific
design is needed.

### 4.5 GFM task-list double-marker fix

**The real generated DOM, read from `node_modules`, not guessed:**

```html
<!-- what remark-gfm + mdast-util-to-hast actually produce for
     "- [x] Ship the sample project" -->
<ul class="contains-task-list">
  <li class="task-list-item">
    <input type="checkbox" checked disabled> Ship the sample project
  </li>
</ul>
```

(`node_modules/mdast-util-to-hast/lib/handlers/list-item.js`: `properties.className =
['task-list-item']` the moment `node.checked` is a boolean, plus an `<input type="checkbox"
checked={node.checked} disabled>` unshifted as the item's first child. `node_modules/mdast-util-to-
hast/lib/handlers/list.js`: the parent list gets `properties.className = ['contains-task-list']` the
moment *any* child carries `task-list-item`.) `@tailwindcss/typography`'s own base styles
(`node_modules/@tailwindcss/typography/src/styles.js`) set `ul { list-style-type: disc }` completely
generically — nothing in the plugin's defaults, or in this repo's pre-existing `typography` override,
ever excludes a task-list `<li>` from that rule, so the browser draws the native `::marker` bullet on
top of the checkbox that's already there.

**Fix is the three rules shown in §4.4's block above, keyed on the real classes:**
`ul.contains-task-list` (removes the reserved marker indent for task lists specifically, leaving
ordinary `ul`/`ol` untouched — they don't carry this class), `li.task-list-item { list-style-type:
none }` (removes the marker itself — the browser still reserves the same horizontal space an ordinary
bullet would have taken, since sibling `<li>`s under the same `ul` still use the plugin's default
`padding-inline-start`; only `.contains-task-list` overrides that to 0, so the checkbox sits flush
left rather than indented, matching how GitHub renders its own checklists — the exact convention this
class name is borrowed from).

**No `:has()` needed, and no fallback question to answer for it** — the brief's suggested
`li:has(> input[type="checkbox"])` selector was one hypothesis for how to target this; the real DOM
already carries a plain, purpose-built class (`task-list-item`) doing the identical job with universal
browser support, so `:has()` is neither used nor needed here. This is a stronger answer than "use
`:has()` and document the fallback" would have been.

**Checkbox appearance — `accent-color`, not a custom `appearance: none` rebuild.** `accent-color:
#0F4C45` (teal-secondary) recolors the native checked/unchecked control without replacing its
markup, shape, or built-in accessibility/interaction behavior — the disabled checkbox still reads and
behaves as a real (if inert) checkbox to assistive tech, just tinted to the brand palette instead of
each browser's default blue. **Stated fallback, since this is a real, if minor, browser-support
question:** `accent-color` has been supported since Chrome 93, Firefox 92, and Safari 15.4 (all
2021–2022); on anything older the checkbox simply renders in that browser's own default accent color
— fully functional, just not brand-tinted. No layout breakage either way, since `accent-color` doesn't
affect box size or position.

**`check-no-forms.sh` interaction — verified, not assumed to be fine.** `scripts/check-no-forms.sh`
runs exactly one check: `grep -RPzl '(?s)<(input|form|textarea)[\s/>]' src/pages/live` — its glob
target is the literal directory `src/pages/live`, nothing else. Every file that can ever render a
markdown-sourced `<input type="checkbox">` this round — `src/data/ContentBody.tsx`, `src/data/
markdownComponents.tsx`, `src/pages/ProjectDetailPage.tsx`, `src/pages/ResearchDetailPage.tsx`, and
every `src/content/**/*.md` file — lives outside `src/pages/live/` (confirmed: that directory
currently holds only `registry.ts`, `registry.test.ts`, and `sample-project.{tsx,test.tsx}`, the
latter two deleted by R3 this round, leaving just `registry.ts` and its test — neither imports
`ContentBody`/`ReactMarkdown` or contains literal `<input`/`<form`/`<textarea>` markup). The script
therefore **cannot see** this fix's rendered checkbox under any current or post-R3 repo state — no
exemption, comment, or change to `check-no-forms.sh` is needed. (`scripts/` isn't in R4's owned-file
list regardless, so no edit is designed there even if one had been needed.)

### 4.6 New-tab links — scope decision and the two real edits

**Scope decided:**

| Link | New tab? | Reasoning |
|---|---|---|
| "Open Live" CTA (`LinksRow`) | **Yes** | Explicit, unambiguous ask (brief #18: "including open live"). |
| External markdown link (project/research body) | Already yes | No change — verified correct today. |
| **Internal** markdown link (project/research body) | **Yes — extended** | Brief #18 says "All links," no carve-out. A body link is content the visitor is reading, not primary site chrome — the same "don't lose your place mid-read" reasoning that justifies external links applies identically whether the destination happens to be on- or off-site. Currently zero real content has one (the only internal markdown link that ever existed, `sample-project.md`'s `[Projects page](/projects)`, is deleted this round by R3) — this is a forward-looking correctness fix, not a visible behavior change today. |
| `ProjectCard`'s title/card-surface link | **No — stays same-tab** | This is primary grid→detail navigation (`/projects` listing → `/projects/<slug>`), not "a link" in the content/CTA sense the owner's list groups this complaint under (it's listed under "Components / detail pages" alongside the "Open Live" example). A card whose entire clickable surface (`after:absolute after:inset-0`, per SP03's own "quick shortcut vs. primary action" framing, already cited in the SP04 PRD for `ProjectCard`'s separate `externalHref` icon) opens a new tab on every browse-and-click is a genuinely bad, non-standard pattern — nobody expects clicking a portfolio grid item to spawn a new tab, and browsing ten cards in a listing page would leave ten open tabs. `ProjectCard`'s own external-link icon shortcut (`externalHref`) already opens in a new tab today and is unaffected either way. |
| `BackButton` | **No — not in scope** | Back navigation, not a content/CTA link; not what "all links" means here. Unchanged (R1-owned regardless). |

**`src/data/markdownComponents.tsx`:**

```tsx
// before
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
```tsx
// after
export const markdownComponents: Components = {
  a({ href, children, ...props }) {
    // brief #18: every markdown link opens in a new tab — external and
    // internal alike (see PRD §4.6 for the scope reasoning). An internal
    // link now does a full browser page load of that route's prerendered
    // HTML in the new tab rather than a client-side route transition — an
    // explicit, accepted trade (there is currently no internal markdown
    // link in any real content file to notice the difference on).
    return (
      <a href={href} target="_blank" rel="noreferrer" {...props}>
        {children}
      </a>
    );
  },
};
```

The `isExternalUrl` import and branch are removed entirely (both paths now render identically) — the
utility itself is untouched and still used elsewhere (`src/layout/Footer.tsx`, R1-owned).

**`src/components/LinksRow.tsx`:**

```tsx
// before
import { Link } from 'react-router-dom';
...
{liveHref && (
  <Link
    to={liveHref}
    className="inline-flex items-center gap-1.5 rounded-full bg-teal px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
  >
    Open Live
    <ArrowIcon className="h-4 w-4" />
  </Link>
)}
```
```tsx
// after — react-router's Link import is removed entirely (no longer used anywhere in this file)
{liveHref && (
  // Plain <a>, not react-router's <Link>: react-router explicitly skips
  // client-side handling for any target other than "_self", so a
  // target="_blank" Link and a target="_blank" plain anchor behave
  // identically — there's no client-nav benefit left to keep <Link> for.
  // The tab this opens does a full page load of this route's prerendered
  // HTML, then (redirect mode) immediately self-replaces to
  // project.liveUrl via LiveRedirectFallback (§4.7), or (hosted mode,
  // currently unreachable — HOSTED_LIVE_PAGES is empty this round per R3)
  // just renders the hosted mini-project directly.
  <a
    href={liveHref}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-1.5 rounded-full bg-teal px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
  >
    Open Live
    <ArrowIcon className="h-4 w-4" />
  </a>
)}
```

No `trackEvent` is added to this click — unchanged from today. `LinksRow.test.tsx` already pins "does
not fire trackEvent when clicking the internal 'Open Live' CTA," reasoning that stays valid: the
`live_redirect` event already fires once the `/live` route itself loads (`LiveRedirectFallback`'s
`useEffect`, redirect mode); double-tracking a click that leads to the same event would over-count.
(Hosted mode has no tracking on this path either way today — a pre-existing gap, unreachable this
round, out of scope here.)

### 4.7 `LiveRedirectFallback` — threading R1's `BackButton` `to` prop

R1's `BackButton` (its PRD §4.7) becomes `export function BackButton({ to = '/', className = '' }:
BackButtonProps)`. `LiveRedirectFallback` gets a new optional `backTo` prop, passed straight through:

```tsx
// before
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
```tsx
// after
interface LiveRedirectFallbackProps {
  to: string;
  label: string;
  /** Internal BackButton target — passed through to BackButton's own `to`
   *  prop (R1 PRD §4.7). Omit to fall back to BackButton's own default
   *  ('/'); ProjectLivePage should pass `/projects/<slug>` here so Back
   *  returns to the actual project this redirect came from, matching the
   *  hosted-mode branch's own BackButton target (R1 PRD §4.9). Resolves
   *  R1 PRD §9's open cross-project item. */
  backTo?: string;
}

export function LiveRedirectFallback({ to, label, backTo }: LiveRedirectFallbackProps) {
  useEffect(() => {
    trackEvent('outbound_click', { url: to, context: 'live_redirect', label });
    window.location.replace(to);
  }, [to, label]);

  return (
    <div className="mx-auto max-w-content px-6 py-24 text-center">
      <BackButton to={backTo} />
      <p className="mt-10 text-body">
        Redirecting you to {label}&hellip; If nothing happens,{' '}
        <a href={to} className="font-semibold text-teal-secondary underline">click here</a>.
      </p>
    </div>
  );
}
```

`<BackButton to={backTo} />` is correct whether `backTo` is provided or not: passing `to={undefined}`
still triggers `BackButton`'s own default-parameter value (`to = '/'`) — identical to omitting the
prop.

**Downstream call-site diff — for R1 to apply, not edited here.** `src/pages/ProjectLivePage.tsx` is
R1-owned this round (page-level container/padding pass); its redirect-mode branch is one line:

```tsx
// src/pages/ProjectLivePage.tsx — before
if (project?.liveUrl) return <LiveRedirectFallback to={project.liveUrl} label={project.title} />;
```
```tsx
// after
if (project?.liveUrl) return <LiveRedirectFallback to={project.liveUrl} label={project.title} backTo={`/projects/${project.slug}`} />;
```

See §9 for the handoff note.

### 4.8 Connect panel — designed for R2, not edited here

**Conclusion, stated plainly per the brief's own instruction: no new or shared component is needed.**
The left column's "email as a button" half of the ask is already true today —
`src/sections/ContactSection.tsx` already renders `{emailHref ? <Button href={emailHref}>Email
Me</Button> : <span className="select-all" ...>{CONTACT_EMAIL_DISPLAY}</span>}` on the left, with the
correct hydration-safe fallback already in place (see below). The only real change is deleting the
right-hand aside's Email block and its divider, leaving Profiles as the panel's sole content — a pure
markup edit inside one file this PRD does not own. §9 carries the complete diff.

**Graceful-degradation path — must be preserved, and is, by construction.** `useContactMailto()`
(`src/hooks/useContactMailto.ts`) returns `null` on every render before the client-only effect
settles (including `vite-react-ssg`'s build-time prerender pass, which never runs effects) — this is
why the left column's fallback (`<span className="select-all" ...>`, not a dead `mailto:` link) exists
today, and it's untouched by this change: the ternary that produces it is not part of what's being
deleted. The right aside's Email block currently has its *own*, separate copy of the same
null-before-hydration ternary — that entire block, ternary included, is what's removed. After the
change, `useContactMailto()`'s result is only ever consumed once, on the left, exactly where the
"Email should be a button" requirement lives.

---

## 5. API Change Summary

N/A — no server API in this project (static prerendered site). The only cross-file contract changes
are frontend component prop types, covered in §4.2/§4.3/§4.7 and summarized in §6.

## 6. Frontend Change Summary

| File | Change |
|---|---|
| `src/components/StatusBadge.tsx` | New. Shared colored status box; exhaustive `Record<BadgeStatus, string>` color map. |
| `src/components/DetailHeader.tsx` | Consumes `StatusBadge`; `status` prop `string` → `BadgeStatus`. |
| `src/components/ProjectCard.tsx` | Consumes `StatusBadge`; `status` prop `string` → `ProjectStatus`. |
| `src/components/LinksRow.tsx` | "Open Live" CTA: `<Link>` → plain `target="_blank" rel="noreferrer"` anchor; `react-router-dom` import removed. |
| `src/components/LiveRedirectFallback.tsx` | New optional `backTo` prop, passed to `<BackButton to={backTo} />`. |
| `src/data/ContentBody.tsx` | Wrapper `className`: `"prose max-w-none"` → `"prose mt-6 max-w-none"`. |
| `src/data/markdownComponents.tsx` | `a()` renderer: single branch, always `target="_blank" rel="noreferrer"`; `isExternalUrl` import removed. |
| `tailwind.config.ts` | `typography.DEFAULT.css`: adds `fontSize`/`lineHeight`, full heading (`h1`–`h4`) ramp, `p`/`ul,ol`/`li` spacing, task-list selectors. `colors`: adds `status-building`. |
| `src/pages/ProjectLivePage.tsx` *(R1 applies)* | `<LiveRedirectFallback to=... label=... />` → adds `backTo={`/projects/${project.slug}`}`. |
| `src/sections/ContactSection.tsx` *(R2 applies)* | Right `<aside>`: Email block + divider removed; Profiles becomes the sole content block. See §9. |

## 7. Testing

- **`src/components/StatusBadge.test.tsx`** (new): renders each of the three `BadgeStatus` values
  with the expected background-color class (`bg-teal/92`, `bg-status-building/92`,
  `bg-slate-dark/92`) and `text-white`; renders `size="sm"`/`size="md"` with the corresponding
  padding/font-size classes; renders a caller-supplied `className` (positioning) alongside the
  component's own classes; the status text itself is the rendered content (`getByText(status)`).
- **`src/components/DetailHeader.test.tsx`** — no changes required (verified in §4.3: every existing
  assertion is text-content or child-count based, unaffected by the `StatusBadge` swap).
- **`src/components/ProjectCard.test.tsx`** — no changes required (same verification, §4.3).
- **`src/components/LinksRow.test.tsx`** — add one test: `'the "Open Live" CTA opens in a new tab
  with rel="noreferrer"'`, asserting `toHaveAttribute('target', '_blank')` and
  `toHaveAttribute('rel', 'noreferrer')` on `screen.getByRole('link', { name: /Open Live/i })`. Every
  existing test in this file still passes unmodified: the href/role assertions don't care whether the
  element is a react-router `<Link>` or a plain `<a>` (both render as `<a href=...>` with `role`
  `link`), and the "does not fire trackEvent" test is unaffected (no tracking added).
- **`src/components/LiveRedirectFallback.test.tsx`** — add two tests: `backTo` provided → `Back`
  link's `href` equals the `backTo` value; `backTo` omitted → `Back` link's `href` is `'/'`
  (`BackButton`'s own default). All four existing tests are unaffected (none assert on `BackButton`'s
  `href`).
- **`src/data/ContentBody.test.tsx`** (new): empty/whitespace-only `body` renders `null`; non-empty
  `body` renders the markdown; the wrapper carries `mt-6` (`container.firstElementChild`, regression
  pin for §4.4's spacing fix); a GFM task list (`'- [x] Done\n- [ ] Not done'`) renders exactly two
  `role="checkbox"` elements with correct checked/disabled state, **and** the real DOM hook the CSS
  fix depends on is present (`document.querySelectorAll('li.task-list-item')` has length 2) — pinning
  the contract between `remark-gfm`'s actual output and the typography-config selector, so a future
  `react-markdown`/`remark-gfm` upgrade that ever changes this class name fails this test immediately
  instead of silently un-fixing the marker bug.
- **`src/data/markdownComponents.test.tsx`** (new): an external markdown link
  (`[GitHub](https://github.com/x)`) renders `target="_blank"`/`rel="noreferrer"`; an **internal**
  markdown link (`[Projects page](/projects)`) **also** renders `target="_blank"`/`rel="noreferrer"`
  — the test that would have failed under the old two-branch implementation, pinning brief #18's
  extended scope decision (§4.6).
- **No `check-no-forms` interaction test is added.** §4.5 verifies, by reading the script's exact
  glob target and the current/post-R3 contents of `src/pages/live/`, that no file capable of
  rendering a markdown checkbox lives inside the directory that script scans — there is no code path
  a test could exercise to produce a false positive. Adding a test that asserts "the script still
  passes after this change" would only be testing that `src/pages/live/` still doesn't contain
  `ContentBody`/markdown rendering, which is already covered structurally, not by this PRD's changes.

## 8. Manual Intervention Required From You

- **Eyeball the three `StatusBadge` colors on real project photos**, especially `DetailHeader`'s
  badge sitting on top of an actual image (currently Unsplash placeholder photos across every project
  — `src/content/projects/*.md`'s `image` field). §4.2's contrast math is a worst-case mathematical
  bound (a pure-white 8% blend), not a substitute for looking at the badge on the specific photos in
  use.
- **Confirm the new-tab scope decision** (§4.6): "Open Live" and internal markdown body links open in
  a new tab; `ProjectCard`'s grid-navigation link stays same-tab. The owner's original wording ("All
  links should open in a new tab") is broad; this PRD carves out one exception with reasoning — worth
  a quick nod that the carve-out matches intent before it ships.
- **There is currently no real, shipped content to visually re-check items 2/3 against.** As noted in
  §1, `sample-project.md` — the only file that ever had headings or a GFM task list — is deleted this
  same round by R3. The fixes are verified against the real render pipeline (dependency source,
  generated DOM, computed contrast) rather than against any specific page, but a true end-to-end
  visual check needs either a real project's body to eventually include a heading/task list, or a
  throwaway local test file added temporarily pre-launch. Not blocking — just flagged so "I don't see
  it anywhere on the live site" isn't mistaken for the fix not having landed.

## 9. Open Questions & Decisions

1. **`[RESOLVED: StatusBadge — box shape, 3-color mapping, one new `status-building` token]`** — see
   §4.2 for the full color/contrast justification and the exhaustiveness-check mechanism.
2. **`[RESOLVED: no runtime "unknown status" fallback is built]`** — the content-parser enum check
   (`assertOptionalStatus`) plus `StatusBadge`'s own `satisfies Record<BadgeStatus, string>`
   compile-time check together make an unmapped status unreachable through any type-checked call
   path. A runtime branch for it would be unreachable dead code today. If `DetailHeader`/`ProjectCard`
   or `StatusBadge` are ever changed to accept a bare `string` again (loosening the type), a defensive
   runtime default should be added at that point — not preemptively here.
3. **`[RESOLVED: ContentBody's wrapper carries the mt-6 spacing fix, not LinksRow]`** — see §4.4's
   reasoning: `LinksRow` can render `null`, so a margin living on it is unreliable; `ContentBody`'s
   wrapper is the one place spacing can be guaranteed regardless of what (if anything) precedes it.
4. **`[RESOLVED: task-list CSS fix targets `li.task-list-item`/`ul.contains-task-list`, not
   `:has()` or `[data-type="taskList"]`]`** — verified against the real `mdast-util-to-hast` source,
   not the brief's hypothesized selector. See §4.5.
5. **`[RESOLVED: checkbox styled via `accent-color`, stated browser-support fallback]`** — see §4.5.
6. **`[RESOLVED: check-no-forms.sh needs no exemption]`** — verified its glob target
   (`src/pages/live`) structurally excludes every file that could ever render this fix's checkbox,
   this round or in the current repo state. See §4.5.
7. **`[RESOLVED: "Open Live" CTA becomes a plain `<a target="_blank" rel="noreferrer">`, react-router
   `Link` import removed from LinksRow.tsx]`** — see §4.6.
8. **`[RESOLVED: markdownComponents' new-tab behavior extends to internal links, not just
   external]`** — scope decision with reasoning in §4.6; currently invisible in shipped content (no
   real internal markdown link exists today) but correct going forward.
9. **`[RESOLVED: ProjectCard's card-level link stays same-tab]`** — explicit recommendation against
   extending "all links" to primary grid navigation; reasoning in §4.6's table.
10. **`[RESOLVED — split by file ownership, orchestrator decision 2026-09-01]`** `src/pages/ProjectLivePage.tsx`'s
    redirect-mode branch gets the one-line `backTo={`/projects/${project.slug}`}` addition shown in
    §4.7 — that file is R1-owned this round (already touching this exact function to add the
    hosted-branch `BackButton`, per R1's own PRD §4.9), and R1's PRD (`01-shell-nav-chrome/PRD.md`
    §4.9/§9 item 6) now carries this exact addition explicitly, in the same pass as the hosted-branch
    change. Each PRD owns and ships its own half: R4 ships `LiveRedirectFallback.tsx`'s `backTo` prop
    (item 11 below), R1 ships the call-site addition.
11. **`[RESOLVED — cross-project, R1]`** `LiveRedirectFallback.tsx` now accepts `backTo`, resolving
    R1 PRD §9's open item on this exact file.
12. **`[RESOLVED — hands to R2]`** Connect panel: no new component needed (§4.8). **Complete handoff
    for `src/sections/ContactSection.tsx`:**
    - Delete the Email block (the `<div className="flex items-start gap-3">...</div>` containing the
      `EmailIcon`, the "Email" label, and the `emailHref`-conditional `mailto:`/fallback `<a>`/`<p>`)
      and the divider wrapper around Profiles (`<div className="border-t border-teal-secondary/10
      pt-4">` → unwrap its children, since Profiles becomes the panel's only content block, not a
      second one needing a divider from a first).
    - Before:
      ```tsx
      <div className="mt-5 space-y-4 text-ink">
        <div className="flex items-start gap-3">
          {/* EmailIcon + "Email" label + mailto/fallback — DELETE this whole div */}
        </div>
        <div className="border-t border-teal-secondary/10 pt-4">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate">Profiles</p>
          <div className="mt-3 flex items-center gap-2.5">{/* GitHub/LinkedIn — unchanged */}</div>
        </div>
      </div>
      ```
    - After:
      ```tsx
      <div className="mt-5 text-ink">
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate">Profiles</p>
        <div className="mt-3 flex items-center gap-2.5">{/* GitHub/LinkedIn — unchanged */}</div>
      </div>
      ```
    - Remove the now-unused `import { EmailIcon } from '@/components/icons/EmailIcon';` (the
      `useContactMailto`/`CONTACT_EMAIL_DISPLAY` imports stay — both are still used by the left
      column's existing `Button`/fallback, which is untouched).
    - **`src/sections/ContactSection.test.tsx` breaks and needs updating as a direct consequence.**
      Its one test asserts `screen.getAllByText(CONTACT_EMAIL_DISPLAY)` has length 2 (left-column
      fallback + aside fallback) before hydration, and separately locates "the aside" copy via
      `.find((node) => node.closest('a'))` after hydration. Once the aside's Email block is deleted,
      only one `CONTACT_EMAIL_DISPLAY` node exists (the left column's), both before and after
      hydration — the length-2 assertions and the aside-node lookup need to become length-1 and be
      simplified to just the left-column assertions already covered by the "Email Me" button check
      right above them in the same test. Left for R2 to fix alongside applying the diff above, not
      designed in detail here (R2 owns this file's tests).
13. **`[DEFERRED — optional, non-blocking]`** `Hero.tsx` and `ContactSection.tsx` (both R2-owned) each
    hand-roll an identical GitHub+LinkedIn icon-link pair (same SVGs, same hover classes, differing
    only in `trackEvent`'s `context` value — `hero_social` vs `contact_social`). A shared
    `SocialLinks` component could remove the duplication, but it wasn't asked for and both files are
    R2's, not R4's — noted here as a real, independently-actionable suggestion for R2 to pick up or
    not, not a requirement of this PRD.
14. **`[RESOLVED — cross-project, R6]`** Whether "all links open in a new tab" should also extend to
    `Nav`/`Footer`'s internal links (`src/layout/*`, R1-owned) is outside this PRD's file boundary.
    R6 (`06-voice-sweep-and-ship/PRD.md` §9 item 6) has now weighed in and resolved it: **no, they
    stay same-tab.** Same reasoning this PRD already applied to `ProjectCard`'s own grid-navigation
    link (§4.6 above): `Nav`'s and `Footer`'s internal, same-site links are primary site chrome/
    navigation, not content or CTA links in the sense the owner's feedback item groups this under. Both
    PRDs now agree in writing. `Footer`'s one external link (résumé/techfolio attribution) is already
    `target="_blank"` and stays that way — unaffected either way.
