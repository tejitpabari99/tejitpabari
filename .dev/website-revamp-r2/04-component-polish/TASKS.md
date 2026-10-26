# Tasks: Component & Detail-Page Polish

Source of truth: `/root/projects/tejitpabari/.dev/website-revamp-r2/04-component-polish/PRD.md`. Every task below cites the PRD §4 subsection it implements. This is a Phase 2 sub-project (per `../README.md`) that runs **concurrently** with R2 (`02-landing-sections`) — R2 touches `src/sections/*` only, disjoint from every file this task list edits.

**Repo state assumption: this task list is written against the post-R1 tree, not today's.** R1 (`01-shell-nav-chrome`) is Phase 1 and has fully landed by the time these tasks run. Two R1-landed facts are load-bearing here, confirmed directly against R1's own `TASKS.md` (`../01-shell-nav-chrome/TASKS.md`), not assumed from its PRD prose:

- **`src/components/BackButton.tsx`** (R1 Task 11) is now `export function BackButton({ to = '/', className = '' }: BackButtonProps)`, `BackButtonProps = { to?: string; className?: string }`. Passing `to={undefined}` behaves identically to omitting the prop (JS default-parameter semantics fire on `undefined`, not just on omission).
- **`src/pages/ProjectLivePage.tsx`** (R1 Task 16) already has a `BackButton` added to its **hosted-mode** branch, reading `<BackButton to={template-string '/projects/' + project.slug} />` inside a wrapper div. R1's Task 16 **deliberately left the redirect-mode line untouched** — `if (project?.liveUrl) return <LiveRedirectFallback to={project.liveUrl} label={project.title} />;`, no `backTo` — because `LiveRedirectFallback`'s prop interface didn't have `backTo` yet at the time R1 ran, and adding an unrecognized JSX prop would have failed `npm run typecheck`. R1's own closing report flags this exact gap and hands it to R4. **Task 11 below closes it.**

**Orchestrator reassignment — read before Task 11.** PRD §9 item 10 states this pairing is "split by file ownership": R4 ships `LiveRedirectFallback.tsx`'s `backTo` prop, R1 ships the `ProjectLivePage.tsx` call-site addition. Per the orchestrator's direct instruction for this task-generation pass, **that split is superseded**: both halves — `LiveRedirectFallback.tsx`'s new `backTo` prop (PRD §4.7) **and** the one-line `ProjectLivePage.tsx` redirect-mode edit R1 left undone — are reassigned to Task 11 below, as one atomic commit. `ProjectLivePage.tsx` is nominally R1-owned this round, but R1 has fully landed before R4 runs, so there is no concurrent-write conflict — R4 is simply finishing the half R1 structurally could not. This is a deliberate reassignment, not scope creep; see Task 11's own note and the closing summary.

**`tailwind.config.ts` — two disjoint edits, both R4's, no collision with R1 or R2.** Confirmed by reading both other PRDs directly: R1's `TASKS.md` never touches `tailwind.config.ts` (grep for `tailwind.config` in that file returns nothing outside this file's own intro), and R2's PRD only mentions the `tailwindcss` package version in passing prose, never edits the config file. Task 1 below adds one color token (`colors.status-building`); Task 5 replaces the `typography` block. Different top-level keys of the same theme-extend object — sequential commits, no overlap.

**Boundary — `src/sections/ContactSection.tsx` is not touched by any task below.** PRD §4.8/§9 item 12 concludes the Connect-panel change is a pure markup edit in a file R2 owns; this task list carries that handoff forward as a closing-summary note only, per this round's file-ownership boundary.

**Test command note:** `npm test` runs `vitest run` (the full suite). A single file can be run directly, e.g. `npx vitest run src/components/StatusBadge.test.tsx`. `npm run typecheck` runs `tsc -b --noEmit`.

---

### Task 1 — `StatusBadge` component + `status-building` color token
   - Files: `tailwind.config.ts`, `src/components/StatusBadge.tsx` (new)
   - Changes: Per PRD §4.2. Add one new color token to `tailwind.config.ts`'s existing `colors` block (leave every other key untouched), then add the new `StatusBadge` component that consumes it.

     `tailwind.config.ts` — `colors` block, one addition (insert `'status-building'` after `placeholder`, before the closing brace):
     ```ts
     colors: {
       cream: '#F7F1E8',
       sage: '#DDE7DE',
       teal: {
         DEFAULT: '#043439',
         secondary: '#0F4C45',
       },
       ink: '#162b26',
       body: '#3E514D',
       slate: '#6B7B77',
       'slate-dark': '#4D5D59',
       placeholder: '#EEF3EE',
       'status-building': '#92400E', // NEW — StatusBadge's "in progress" color.
       // Tailwind's own default amber-800 hex, reused deliberately rather
       // than inventing an arbitrary new color: a familiar, well-tested
       // exact value, formally declared as a named brand token here (not
       // referenced as a bare `amber-800` utility class anywhere) so it's
       // tracked in the design system the same way every other color is.
     },
     ```

     `src/components/StatusBadge.tsx` — new file, complete:
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
     // check: if a future content author adds a new literal to ProjectStatus or
     // ResearchStatus (src/data/projects.ts / src/data/research.ts) without
     // adding a matching key here, `npm run typecheck` fails on this line
     // ("Property '<NewStatus>' is missing") — the build breaks at the
     // color-mapping site itself, not silently at runtime with an unstyled
     // badge. Combined with assertOptionalStatus already throwing at
     // content-parse time for any value outside the allowed list, an unmapped
     // status cannot reach this component through any type-checked path — see
     // PRD §4.2/§9 item 2 for why no runtime fallback color is added on top of
     // this (deliberate, not an oversight).
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

     `rounded-md` (Tailwind's default 0.375rem) is the "box" shape the owner asked for — a small radius, not `rounded-full`. No new radius token is added; the four custom radius tokens (`xl2`/`card`/`panel`/`section`) are all 1rem+, meant for large surfaces, not a one-line chip.
   - Acceptance criteria:
     1. `npm run typecheck` passes — in particular, the `satisfies Record<BadgeStatus, string>` line on `STATUS_STYLES` compiles with all three keys present.
     2. `grep -c "'status-building': '#92400E'" tailwind.config.ts` → `1`.
     3. `grep -c "satisfies Record<BadgeStatus, string>" src/components/StatusBadge.tsx` → `2` (one explanatory comment line, one the actual `STATUS_STYLES` assertion — confirm the second is real code, not just the comment, with `grep -n "} satisfies Record<BadgeStatus, string>;" src/components/StatusBadge.tsx` → `1`).
     4. No other file is imported or changed by this task; `npm test` passes in full (nothing yet consumes `StatusBadge`, so no existing test is affected).

---

### Task 2 — `StatusBadge.test.tsx` (new)
   - Files: `src/components/StatusBadge.test.tsx` (new)
   - Changes: Per PRD §7. Depends on Task 1.
     ```tsx
     // src/components/StatusBadge.test.tsx
     import { describe, expect, it } from 'vitest';
     import { render, screen } from '@testing-library/react';
     import { StatusBadge } from './StatusBadge';

     describe('StatusBadge', () => {
       it('renders "Completed" with the teal background and white text', () => {
         render(<StatusBadge status="Completed" />);
         expect(screen.getByText('Completed')).toHaveClass('bg-teal/92', 'text-white');
       });

       it('renders "Building" with the status-building background and white text', () => {
         render(<StatusBadge status="Building" />);
         expect(screen.getByText('Building')).toHaveClass('bg-status-building/92', 'text-white');
       });

       it('renders "Not Started" with the slate-dark background and white text', () => {
         render(<StatusBadge status="Not Started" />);
         expect(screen.getByText('Not Started')).toHaveClass('bg-slate-dark/92', 'text-white');
       });

       it('defaults to size="md" padding/font-size classes', () => {
         render(<StatusBadge status="Building" />);
         expect(screen.getByText('Building')).toHaveClass('px-3', 'py-1', 'text-[0.68rem]');
       });

       it('renders size="sm" padding/font-size classes when requested', () => {
         render(<StatusBadge status="Building" size="sm" />);
         expect(screen.getByText('Building')).toHaveClass('px-2', 'py-0.5', 'text-[0.58rem]');
       });

       it("composes a caller-supplied className alongside the component's own classes", () => {
         render(<StatusBadge status="Building" className="absolute left-3 top-3" />);
         expect(screen.getByText('Building')).toHaveClass(
           'absolute', 'left-3', 'top-3', 'bg-status-building/92', 'rounded-md',
         );
       });

       it('renders the status text as the only content, for every BadgeStatus value', () => {
         (['Not Started', 'Building', 'Completed'] as const).forEach((status) => {
           const { unmount } = render(<StatusBadge status={status} />);
           expect(screen.getByText(status).textContent).toBe(status);
           unmount();
         });
       });

       it('renders a rounded-md box, not a rounded-full pill', () => {
         render(<StatusBadge status="Completed" />);
         const badge = screen.getByText('Completed');
         expect(badge).toHaveClass('rounded-md');
         expect(badge).not.toHaveClass('rounded-full');
       });
     });
     ```
   - Acceptance criteria:
     1. `npx vitest run src/components/StatusBadge.test.tsx` passes all 8 cases.
     2. `npm run typecheck` passes.

---

### Task 3 — `src/components/DetailHeader.tsx`: consumes `StatusBadge`
   - Files: `src/components/DetailHeader.tsx`
   - Changes: Per PRD §4.3. Depends on Task 1. Replace the hardcoded pill with `StatusBadge`; narrow `status` from `string` to `BadgeStatus`.

     Before:
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

     After:
     ```tsx
     // src/components/DetailHeader.tsx
     import { TagPill } from './TagPill';
     import { StatusBadge, type BadgeStatus } from './StatusBadge';

     interface DetailHeaderProps {
       image: string;
       imageAlt?: string;
       title: string;
       status?: BadgeStatus; // was `string` — tightened, see PRD §4.3
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

     `status?: string` → `status?: BadgeStatus` compiles with zero call-site changes: both real callers (`ProjectDetailPage` passes `project.status: ProjectStatus | undefined`, `ResearchDetailPage` passes `item.status: ResearchStatus | undefined`) already pass a value assignable to `BadgeStatus`. Neither call site is edited by this task.
   - Acceptance criteria:
     1. `npm run typecheck` passes.
     2. `npx vitest run src/components/DetailHeader.test.tsx` passes **unmodified** — every existing assertion is `getByText('Building')`/`queryByText('Building')` (text content) or a child-count check on `.bg-placeholder` (`toHaveLength(1)` absent, `toHaveLength(2)` present); `StatusBadge` still renders exactly one `<span>` with the status text as its only child, so both hold.
     3. `grep -c "rounded-full bg-teal/92" src/components/DetailHeader.tsx` → `0` (old inline pill markup fully removed).
     4. `npm test` passes in full.

---

### Task 4 — `src/components/ProjectCard.tsx`: consumes `StatusBadge`
   - Files: `src/components/ProjectCard.tsx`
   - Changes: Per PRD §4.3. Depends on Task 1. Same swap as Task 3, but `status` narrows to `ProjectStatus` (not `BadgeStatus`) — `ProjectCard` is Project-only, never used for Research, so the narrower, collection-specific type is more precise and still assignable into `StatusBadge`'s `BadgeStatus` prop.

     Diff (only the imports, the `status` field of `ProjectCardProps`, and the pill markup change — every other prop, the `article`/image/title/description/tags markup, and the `externalHref` block are untouched):
     ```tsx
     // before — imports
     import { Link } from 'react-router-dom';
     import { TagPill } from './TagPill';
     import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
     ```
     ```tsx
     // after — imports
     import { Link } from 'react-router-dom';
     import { TagPill } from './TagPill';
     import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
     import { StatusBadge } from './StatusBadge';
     import type { ProjectStatus } from '@/data';
     ```
     ```tsx
     // before — prop
     status?: string;
     ```
     ```tsx
     // after — prop
     status?: ProjectStatus;
     ```
     ```tsx
     // before — pill markup
     {status && (
       <span className="absolute left-2 top-2 rounded-full bg-teal/92 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wide text-white">
         {status}
       </span>
     )}
     ```
     ```tsx
     // after — pill markup
     {status && <StatusBadge status={status} size="sm" className="absolute left-2 top-2" />}
     ```
   - Acceptance criteria:
     1. `npm run typecheck` passes.
     2. `npx vitest run src/components/ProjectCard.test.tsx` passes **unmodified** — its assertions are `screen.getByText('Building')`/`screen.queryByText('Building')`, no class-based checks.
     3. `grep -c "rounded-full bg-teal/92" src/components/ProjectCard.tsx` → `0`.
     4. `npm test` passes in full.

---

### Task 5 — `ContentBody` typography: size ramp, heading rhythm, task-list fix, `LinksRow` gap fix
   - Files: `src/data/ContentBody.tsx`, `tailwind.config.ts`
   - Changes: Per PRD §4.4/§4.5. Two edits, presented together because the PRD's own `typography` block combines both fixes in one config object.

     `src/data/ContentBody.tsx` — one class added to the wrapper (closes the `LinksRow`→`ContentBody` 0px gap at the source, per PRD §4.4's reasoning: `LinksRow` can render `null`, so a margin living there is unreliable; this wrapper always either renders `null` or its full markup, so it's the one place spacing can be guaranteed):
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

     `tailwind.config.ts` — `typography` key, full replacement (leave `colors`, `fontFamily`, `borderRadius`, `boxShadow`, `maxWidth`, and `plugins` exactly as Task 1 left them; only the `typography: () => ({...})` value changes):
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
           // expected to start at h2. h1 is still styled here, capped well
           // below the page h1's smallest breakpoint value, purely as a
           // defensive floor in case a content author ever writes one.
           h1: { fontSize: '1.5rem', lineHeight: '1.25', fontWeight: '800', marginTop: '0', marginBottom: '0.75em' },
           h2: { fontSize: '1.28rem', lineHeight: '1.3', fontWeight: '800', marginTop: '2em', marginBottom: '0.65em' },
           h3: { fontSize: '1.08rem', lineHeight: '1.35', fontWeight: '700', marginTop: '1.6em', marginBottom: '0.5em' },
           h4: { fontSize: '0.98rem', fontWeight: '700', marginTop: '1.4em', marginBottom: '0.4em' },
           p: { marginTop: '0', marginBottom: '1.1em' },
           'ul, ol': { marginTop: '0.9em', marginBottom: '1.1em' },
           li: { marginTop: '0.35em', marginBottom: '0.35em' },

           // GFM task lists — keyed on the real classes mdast-util-to-hast
           // actually emits (li.task-list-item / ul.contains-task-list), not
           // `:has()` or a `[data-type="taskList"]` attribute (that's a
           // different, ProseMirror/Tiptap-family convention this toolchain
           // never emits). PRD §4.5.
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
   - Acceptance criteria:
     1. `npm run typecheck` passes.
     2. `grep -c 'className="prose mt-6 max-w-none"' src/data/ContentBody.tsx` → `1`.
     3. `grep -c "'li.task-list-item'" tailwind.config.ts` → `1`; `grep -c "'ul.contains-task-list'" tailwind.config.ts` → `1`.
     4. `grep -c "fontSize: '0.95rem'" tailwind.config.ts` → `1` (confirms the `DEFAULT.css.fontSize` override, not a `prose-sm`/`prose-lg` variant class, is what's in place).
     5. No test file references the removed default `prose` sizing, so no existing test breaks from this task alone; `npm test` passes in full (Task 6 below is what pins the new behavior).

---

### Task 6 — `src/data/ContentBody.test.tsx` (new)
   - Files: `src/data/ContentBody.test.tsx` (new)
   - Changes: Per PRD §7. Depends on Task 5.
     ```tsx
     // src/data/ContentBody.test.tsx
     import { describe, expect, it } from 'vitest';
     import { render } from '@testing-library/react';
     import { ContentBody } from './ContentBody';

     describe('ContentBody', () => {
       it('renders null for an empty body', () => {
         const { container } = render(<ContentBody body="" />);
         expect(container).toBeEmptyDOMElement();
       });

       it('renders null for a whitespace-only body', () => {
         const { container } = render(<ContentBody body={'   \n  '} />);
         expect(container).toBeEmptyDOMElement();
       });

       it('renders the markdown for a non-empty body', () => {
         const { getByText } = render(<ContentBody body="Hello world" />);
         expect(getByText('Hello world')).toBeInTheDocument();
       });

       it('the wrapper carries prose, mt-6, and max-w-none — regression pin for the LinksRow gap fix (PRD §4.4)', () => {
         const { container } = render(<ContentBody body="Hello world" />);
         expect(container.firstElementChild).toHaveClass('prose', 'mt-6', 'max-w-none');
       });

       it('a GFM task list renders exactly two checkboxes with correct checked/disabled state', () => {
         const { container, getAllByRole } = render(<ContentBody body={'- [x] Done\n- [ ] Not done'} />);
         const checkboxes = getAllByRole('checkbox');
         expect(checkboxes).toHaveLength(2);
         expect(checkboxes[0]).toBeChecked();
         expect(checkboxes[0]).toBeDisabled();
         expect(checkboxes[1]).not.toBeChecked();
         expect(checkboxes[1]).toBeDisabled();

         // The real DOM hook the typography-config CSS fix depends on —
         // pins the contract between remark-gfm's actual output and the
         // tailwind.config.ts selectors, so a future react-markdown/
         // remark-gfm upgrade that changes this class name fails this test
         // immediately instead of silently un-fixing the marker bug.
         expect(container.querySelectorAll('li.task-list-item')).toHaveLength(2);
         expect(container.querySelectorAll('ul.contains-task-list')).toHaveLength(1);
       });
     });
     ```
   - Acceptance criteria:
     1. `npx vitest run src/data/ContentBody.test.tsx` passes all 5 cases.
     2. `npm run typecheck` passes.

---

### Task 7 — `src/data/markdownComponents.tsx`: every link opens in a new tab
   - Files: `src/data/markdownComponents.tsx`
   - Changes: Per PRD §4.6. Collapse the external/internal branch into one — brief #18's "all links" scope, extended to internal markdown links (reasoning: a body link is content the visitor is reading, not primary site chrome, so the same "don't lose your place mid-read" logic applies regardless of destination). `isExternalUrl` import and the branch are removed entirely; the utility itself stays in use elsewhere (`src/layout/Footer.tsx`, R1-owned) and is untouched.

     Before:
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

     After:
     ```tsx
     // src/data/markdownComponents.tsx
     import type { Components } from 'react-markdown';

     export const markdownComponents: Components = {
       a({ href, children, ...props }) {
         // brief #18: every markdown link opens in a new tab — external and
         // internal alike (PRD §4.6). An internal link now does a full
         // browser page load of that route's prerendered HTML in the new tab
         // rather than a client-side route transition — an explicit, accepted
         // trade (there is currently no internal markdown link in any real
         // content file to notice the difference on).
         return (
           <a href={href} target="_blank" rel="noreferrer" {...props}>
             {children}
           </a>
         );
       },
     };
     ```
   - Acceptance criteria:
     1. `npm run typecheck` passes.
     2. `grep -c "isExternalUrl" src/data/markdownComponents.tsx` → `0`.
     3. `grep -c 'target="_blank" rel="noreferrer"' src/data/markdownComponents.tsx` → `1`, on the single remaining branch.
     4. `npm test` passes in full (no existing test file exercises `markdownComponents` directly yet — Task 8 adds one).

---

### Task 8 — `src/data/markdownComponents.test.tsx` (new)
   - Files: `src/data/markdownComponents.test.tsx` (new)
   - Changes: Per PRD §7. Depends on Task 7. Pins brief #18's extended scope decision — the test that would have failed under the old two-branch implementation.
     ```tsx
     // src/data/markdownComponents.test.tsx
     import { describe, expect, it } from 'vitest';
     import { render, screen } from '@testing-library/react';
     import ReactMarkdown from 'react-markdown';
     import remarkGfm from 'remark-gfm';
     import { markdownComponents } from './markdownComponents';

     function renderMarkdown(body: string) {
       return render(
         <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
           {body}
         </ReactMarkdown>,
       );
     }

     describe('markdownComponents', () => {
       it('renders an external link with target="_blank" and rel="noreferrer"', () => {
         renderMarkdown('[GitHub](https://github.com/x)');
         const link = screen.getByRole('link', { name: 'GitHub' });
         expect(link).toHaveAttribute('target', '_blank');
         expect(link).toHaveAttribute('rel', 'noreferrer');
         expect(link).toHaveAttribute('href', 'https://github.com/x');
       });

       it('renders an internal link with target="_blank" and rel="noreferrer" too (PRD §4.6 — brief #18\'s extended scope)', () => {
         renderMarkdown('[Projects page](/projects)');
         const link = screen.getByRole('link', { name: 'Projects page' });
         expect(link).toHaveAttribute('target', '_blank');
         expect(link).toHaveAttribute('rel', 'noreferrer');
         expect(link).toHaveAttribute('href', '/projects');
       });
     });
     ```
   - Acceptance criteria:
     1. `npx vitest run src/data/markdownComponents.test.tsx` passes both cases.
     2. `npm run typecheck` passes.

---

### Task 9 — `src/components/LinksRow.tsx`: "Open Live" CTA opens in a new tab
   - Files: `src/components/LinksRow.tsx`
   - Changes: Per PRD §4.6/§9 item 7. `<Link>` (react-router, same-tab) → a plain `target="_blank" rel="noreferrer"` anchor, matching every other entry in the same row. `react-router-dom`'s `Link` import is removed entirely (no longer used anywhere in this file). No `trackEvent` is added to this click — unchanged from today (the `live_redirect` event already fires once `/live` loads, via `LiveRedirectFallback`'s `useEffect`; double-tracking the click would over-count).

     Before:
     ```tsx
     // src/components/LinksRow.tsx
     import { Link } from 'react-router-dom';
     import type { Link as ContentLink } from '@/data'; // SP02's Link type: { label, href }
     import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
     import { ArrowIcon } from './icons/ArrowIcon';
     import { trackEvent } from '@/lib/analytics';

     interface LinksRowProps {
       links: ContentLink[];
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

     After:
     ```tsx
     // src/components/LinksRow.tsx
     import type { Link as ContentLink } from '@/data'; // SP02's Link type: { label, href }
     import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
     import { ArrowIcon } from './icons/ArrowIcon';
     import { trackEvent } from '@/lib/analytics';

     interface LinksRowProps {
       links: ContentLink[];
       liveHref?: string;
     }

     export function LinksRow({ links, liveHref }: LinksRowProps) {
       if (links.length === 0 && !liveHref) return null;
       return (
         <div className="mt-6 flex flex-wrap gap-3">
           {liveHref && (
             // Plain <a>, not react-router's <Link>: react-router explicitly
             // skips client-side handling for any target other than "_self",
             // so a target="_blank" Link and a target="_blank" plain anchor
             // behave identically — there's no client-nav benefit left to
             // keep <Link> for.
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
     1. `npm run typecheck` passes.
     2. `grep -c "react-router-dom" src/components/LinksRow.tsx` → `0`.
     3. `npx vitest run src/components/LinksRow.test.tsx` passes **unmodified** (before Task 10 adds one more case) — the href/role assertions don't care whether the element is a react-router `<Link>` or a plain `<a>` (both render `<a href=...>` with `role="link"`), and "does not fire trackEvent when clicking the internal 'Open Live' CTA" is unaffected (no tracking added).
     4. `npm test` passes in full.

---

### Task 10 — `src/components/LinksRow.test.tsx`: +1 test
   - Files: `src/components/LinksRow.test.tsx`
   - Changes: Per PRD §7. Depends on Task 9. Add one test asserting the "Open Live" CTA itself opens in a new tab (the existing suite only checked this for the external `links` entries). Insert alongside the other `it(...)` blocks, e.g. immediately after `'external links open in a new tab with rel="noreferrer"'`:
     ```tsx
     it('the "Open Live" CTA opens in a new tab with rel="noreferrer"', () => {
       renderLinksRow({ links: [], liveHref: '/projects/juno/live' });
       const cta = screen.getByRole('link', { name: /Open Live/i });
       expect(cta).toHaveAttribute('target', '_blank');
       expect(cta).toHaveAttribute('rel', 'noreferrer');
     });
     ```
   - Acceptance criteria:
     1. `npx vitest run src/components/LinksRow.test.tsx` passes all 7 cases (6 existing + 1 new).
     2. `npm run typecheck` passes.

---

### Task 11 — `LiveRedirectFallback`'s `backTo` prop + the reassigned `ProjectLivePage.tsx` one-liner
   - Files: `src/components/LiveRedirectFallback.tsx`, `src/pages/ProjectLivePage.tsx`
   - **Reassignment note — read this before touching either file.** PRD §9 item 10 originally split this pairing by file ownership (R4 ships `LiveRedirectFallback.tsx`'s `backTo` prop; R1 ships the `ProjectLivePage.tsx` call site). **The orchestrator has reassigned both halves to this task**, as one atomic commit, because R1's own `TASKS.md` Task 16 could not implement its half — `LiveRedirectFallback.tsx`'s `backTo` prop didn't exist yet when R1 ran, and passing an unrecognized JSX prop would have failed `npm run typecheck` (R1's Task 16 note states this explicitly and defers the fix here). `ProjectLivePage.tsx` is nominally R1-owned this round, but R1 has fully landed by the time this task runs, so there is no concurrent-write conflict — this is R4 finishing a half R1 structurally could not, not scope creep onto another sub-project's live work.
   - Changes: Per PRD §4.7.

     **Part A — `src/components/LiveRedirectFallback.tsx`:** new optional `backTo` prop, passed straight through to R1's `BackButton`'s own `to` prop.

     Before:
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

     After:
     ```tsx
     // src/components/LiveRedirectFallback.tsx
     import { useEffect } from 'react';
     import { BackButton } from './BackButton';
     import { trackEvent } from '@/lib/analytics';

     interface LiveRedirectFallbackProps {
       to: string;
       label: string;
       /** Internal BackButton target — passed through to BackButton's own `to`
        *  prop (R1's BackButton, `src/components/BackButton.tsx`). Omit to
        *  fall back to BackButton's own default ('/'); ProjectLivePage passes
        *  `/projects/<slug>` here so Back returns to the actual project this
        *  redirect came from, matching the hosted-mode branch's own
        *  BackButton target. Resolves R1's own open cross-project item on
        *  this file. */
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

     `<BackButton to={backTo} />` is correct whether `backTo` is provided or not: passing `to={undefined}` still triggers `BackButton`'s own default-parameter value (`to = '/'`) — identical to omitting the prop entirely.

     **Part B — `src/pages/ProjectLivePage.tsx`:** the one-line redirect-mode edit R1's Task 16 deliberately left undone. Only this one line changes; the hosted-mode branch (already carrying its own `BackButton` from R1 Task 16) and every other line are untouched.

     Before (post-R1 state, redirect-mode line only):
     ```tsx
     if (project?.liveUrl) return <LiveRedirectFallback to={project.liveUrl} label={project.title} />;
     ```

     After:
     ```tsx
     if (project?.liveUrl) return <LiveRedirectFallback to={project.liveUrl} label={project.title} backTo={`/projects/${project.slug}`} />;
     ```
   - Acceptance criteria:
     1. `npm run typecheck` passes.
     2. `grep -c "backTo?: string" src/components/LiveRedirectFallback.tsx` → `1`.
     3. `grep -c "<BackButton to={backTo} />" src/components/LiveRedirectFallback.tsx` → `1`.
     4. `grep -c 'backTo={\`/projects/\${project.slug}\`}' src/pages/ProjectLivePage.tsx` → `1`, on the redirect-mode line only. The hosted-mode branch's own `<BackButton to={\`/projects/\${project.slug}\`} />` from R1 Task 16 is a separate, untouched line — confirm with `grep -n 'project.slug' src/pages/ProjectLivePage.tsx`, which shows 4 matches total (`RouteMeta`'s `path`, `RouteMeta`'s `image`, the hosted-mode `BackButton`, and this new redirect-mode `backTo`), of which only the last is new from this task.
     5. `npx vitest run src/pages/ProjectLivePage.test.tsx` passes unmodified — none of its 4 cases assert on `LiveRedirectFallback`'s props, only on which branch's visible text/testid renders.
     6. `npm test` passes in full (Task 12 adds the two tests that actually assert on the new prop's wiring).

---

### Task 12 — `src/components/LiveRedirectFallback.test.tsx`: +2 tests
   - Files: `src/components/LiveRedirectFallback.test.tsx`
   - Changes: Per PRD §7. Depends on Task 11. Add two tests asserting the `Back` link's `href` reflects `backTo` when provided, and falls back to `BackButton`'s own default when omitted. Insert alongside the existing `it(...)` blocks, e.g. after the "renders the fallback copy..." test:
     ```tsx
     it("passes backTo through to BackButton's `to` prop when provided", () => {
       renderFallback({ to: 'https://app.meetjuno.health', label: 'Juno', backTo: '/projects/juno' });
       expect(screen.getByRole('link', { name: /Back/i })).toHaveAttribute('href', '/projects/juno');
     });

     it("falls back to BackButton's own default ('/') when backTo is omitted", () => {
       renderFallback({ to: 'https://app.meetjuno.health', label: 'Juno' });
       expect(screen.getByRole('link', { name: /Back/i })).toHaveAttribute('href', '/');
     });
     ```
   - Acceptance criteria:
     1. `npx vitest run src/components/LiveRedirectFallback.test.tsx` passes all 6 cases (4 existing + 2 new).
     2. `npm run typecheck` passes.
     3. `npm test` passes in full — the complete R4 test surface (Tasks 1–12) is green as one final check.

---

## Summary of what requires you (not a dev agent)

1. **Eyeball the three `StatusBadge` colors on real project photos**, especially `DetailHeader`'s badge sitting on top of an actual image (currently Unsplash placeholder photos across every project — `src/content/projects/*.md`'s `image` field). PRD §4.2's contrast math is a worst-case mathematical bound (a pure-white 8% blend at the badge's existing `/92` opacity), not a substitute for looking at the badge on the specific photos in use. (PRD §8, also carried on the round `README.md`'s "Still requires the owner" table.)
2. **Confirm the new-tab link scope decision** (PRD §4.6): "Open Live" and internal markdown body links open in a new tab; `ProjectCard`'s own grid-navigation link stays same-tab. The owner's original wording ("All links should open in a new tab") is broader than this carve-out — worth a quick nod that the carve-out matches intent before it ships. (PRD §8.)
3. **There is currently no real, shipped content to visually re-check the heading/task-list fixes against.** `sample-project.md` — the only content file that ever had headings or a GFM task list — is deleted this same round by R3. Tasks 5/6 above verify the fix against the real render pipeline (dependency source, generated DOM, an automated test with real markdown fixtures) rather than against any specific live page, but a true end-to-end visual check needs either a real project's body to eventually include a heading/task list, or a throwaway local test file added temporarily pre-launch. Not blocking — just flagged so "I don't see it anywhere on the live site" isn't mistaken for the fix not having landed. (PRD §8.)
4. **Handoff to R2 (`02-landing-sections`), not built here:** `src/sections/ContactSection.tsx`'s Connect panel (the right-hand `<aside>`) still has its duplicate Email block — PRD §9 item 12 gives the complete before/after diff and the exact `ContactSection.test.tsx` breakage (the `CONTACT_EMAIL_DISPLAY` length-2 assertions need to become length-1 once the aside's Email block is deleted). No task in this file touches `src/sections/ContactSection.tsx` or its test — that boundary is intentional (R2 owns both files this round). Nothing here is blocked on R2 taking this up; it's a parallel, independent piece of work.
