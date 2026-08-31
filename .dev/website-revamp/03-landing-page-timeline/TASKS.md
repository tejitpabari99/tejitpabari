# Tasks: Landing Page & Work-Experience Timeline (SP03)

Source of truth: `/root/projects/tejitpabari/.dev/website-revamp/03-landing-page-timeline/PRD.md`. Every task below cites the PRD §4 subsection it implements. This sub-project renders the landing page (`HomePage.tsx`) and `/work-experience`, and hands off `ProjectCard` to SP04 as a collection-agnostic component that must not acquire Project-specific assumptions.

**Toolchain/consumption assumptions, confirmed from the PRD's own §0/§6, not re-derived here:** `react-router-dom`, `react-markdown`, `remark-gfm`, and `@testing-library/react` are already installed (SP01/SP02). No task below installs a dependency.

**Phase-ordering hazard, flagged once here rather than repeated on every task:** per the initiative's `README.md` dependency graph, SP03 runs in **Phase 3, in parallel with SP07** (the content-authoring sub-project) — SP03 is *not* guaranteed to run after SP07 lands real `.md` files in `src/content/**`. SP01, SP02, and SP05 *do* land first (Phases 1–2), so their exports (`Button`, `TagPill`, `BackButton`, the icon set, `PageShell`, Tailwind tokens, `@/config/links`, `@/data`, `@/config/featured`, `@/lib/isExternalUrl`, `@/config/contact`, `@/hooks/useContactMailto`, `@/lib/analytics`) are expected to exist by the time any task below runs. **Neither `@/config/links` (SP01-owned) nor `@/config/contact` (SP05-owned) is created or extended by any task in this file** — both ownership questions are binding architect decisions (PRD §9); no `src/config/social.ts` exists or is created. But **content files may not exist yet**, and per SP02's own `featured.ts` (`Task 9` of `02-content-pipeline/TASKS.md`), `computeFeatured` throws on any `FEATURED_PROJECT_SLUGS` entry that doesn't match a real loaded project — so a full `npm run build` can fail for reasons entirely outside this sub-project's code until SP07's content lands. Consequently:
- Use `npx tsc --noEmit` as the primary buildable-correctness gate for tasks that import `@/data`/`@/config/featured`, not `npm run build`.
- Any component-level test that needs project/work-experience data must use **in-memory fixtures**, never the real loaded `projects`/`workExperience` arrays.
- Where a task's manual/dev-server check would show an empty grid or a timeline with zero entries because content hasn't landed yet, that is expected and not a defect — note it, don't "fix" it by inventing placeholder content.

**Progress:** 7/16 tasks complete.

---

### Task 1 — `ProjectCard` (SP04 seam)
   - Status: Complete
   - Files: `src/components/ProjectCard.tsx` (new)
   - Changes: Per PRD §4.3. **This is the component SP04 imports directly and does not fork — every field that would otherwise be collection-specific (route prefix, whether to populate the external-link shortcut) is computed by the caller.** Any change to this component after this task must preserve that seam: no prop, default, or conditional may reference "Projects" or "Research" by name.

**Dependency, flag before starting:** imports `TagPill` (`./TagPill`) and a new `ExternalLinkIcon` (`./icons/ExternalLinkIcon`), both SP01-owned. Per phase ordering these exist by now; if either import fails, stop and confirm with the orchestrator rather than inlining a substitute.

```tsx
// src/components/ProjectCard.tsx
import { Link } from 'react-router-dom';
import { TagPill } from './TagPill';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';

export interface ProjectCardProps {
  href: string;
  image: string;
  imageAlt?: string;
  title: string;
  description: string;
  tags: string[];
  status?: string;
  externalHref?: string;
  externalLabel?: string;
  onCardClick?: () => void;
  onExternalClick?: () => void;
}

export function ProjectCard({
  href,
  image,
  imageAlt = '',
  title,
  description,
  tags,
  status,
  externalHref,
  externalLabel,
  onCardClick,
  onExternalClick,
}: ProjectCardProps) {
  return (
    <article className="group relative w-full rounded-card border border-teal-secondary/12 bg-cream p-3.5 text-center shadow-card transition duration-200 hover:-translate-y-1 hover:border-teal-secondary/22 hover:shadow-card-hover sm:p-4">
      <div className="relative mb-3 overflow-hidden rounded-xl2 bg-placeholder">
        <img
          src={image}
          alt={imageAlt}
          loading="lazy"
          className="h-[120px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] sm:h-[140px] xl:h-[155px]"
        />

        {status && (
          <span className="absolute left-2 top-2 rounded-full bg-teal/92 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wide text-white">
            {status}
          </span>
        )}

        {externalHref && (
          <a
            href={externalHref}
            target="_blank"
            rel="noreferrer"
            aria-label={externalLabel ?? `Open ${title} externally`}
            onClick={(event) => {
              event.stopPropagation();
              onExternalClick?.();
            }}
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-teal-secondary/15 bg-cream/90 text-teal-secondary backdrop-blur-sm transition hover:bg-teal-secondary hover:text-white"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <h3 className="text-[0.95rem] font-extrabold tracking-tight text-ink transition-colors duration-200 group-hover:text-teal-secondary sm:text-[1rem]">
        <Link to={href} onClick={onCardClick} className="after:absolute after:inset-0 after:content-['']">
          {title}
        </Link>
      </h3>
      <p className="mt-2 text-[0.72rem] leading-5 text-body sm:text-[0.76rem]">{description}</p>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {tags.map((tag) => (
            <TagPill key={tag}>{tag}</TagPill>
          ))}
        </div>
      )}
    </article>
  );
}
```

**Two details that are easy to drop by accident — verify both are present:**
1. `after:content-['']` on the title `<Link>`. Without it Tailwind never generates the `::after` pseudo-element (`content` defaults to `none`), and the whole-card-clickable stretched-link technique silently does nothing (PRD §4.3, §9).
2. The external-link `<a>` carries an explicit `z-10`; the stretched `after:` pseudo-element carries no explicit `z-index` (stays `auto`). This ordering is what makes the external icon clickable on top of the card-covering overlay with no `stopPropagation` strictly required (kept anyway as cheap insurance) — do not add `z-index` to the `<article>` or the `<h3>` in a way that would invert this.

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. `grep -n "after:content-\['']" src/components/ProjectCard.tsx` matches.
     3. `grep -n "'Project'\|'Research'\|liveUrl" src/components/ProjectCard.tsx` returns **no matches** — confirms no collection-specific name leaked into the component (the seam SP04 depends on).
     4. Full behavioral verification is Task 12 (dedicated test task) — this task's own acceptance criteria stop at type-correctness and the seam check above.

---

### Task 2 — `HeroPortrait` and `Hero`
   - Status: Complete
   - Files: `src/sections/HeroPortrait.tsx` (new), `src/sections/Hero.tsx` (new)
   - Changes: Per PRD §4.2.

**Dependency, flag before starting:** imports `Button` (`@/components/Button`, SP01), `GitHubIcon`/`LinkedInIcon` (`@/components/icons/...`, SP01), `LINKEDIN_URL`/`GITHUB_URL` (`@/config/contact`, SP05), `trackEvent` (`@/lib/analytics`, SP05), `RESUME_URL` (`@/config/links`, SP01). All are expected to exist per phase ordering (SP01/SP02/SP05 land before SP03); if `@/config/contact`, `@/config/links`, or `@/lib/analytics` are missing, stop and confirm with the orchestrator — this sub-project does not create or extend any of them (binding, PRD §9).

```tsx
// src/sections/HeroPortrait.tsx
interface HeroPortraitProps {
  /** Real photo/illustration path, once the owner supplies one. Omit to
   *  render the placeholder monogram — this is the entire swap mechanism:
   *  one prop, no layout change, no other file to touch. */
  src?: string;
}

export function HeroPortrait({ src }: HeroPortraitProps) {
  if (src) {
    return (
      <img
        src={src}
        alt="Tejit Pabari"
        className="h-auto w-full max-w-[160px] object-contain sm:max-w-[190px] md:max-w-[210px] lg:max-w-[230px]"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="flex aspect-square w-full max-w-[160px] items-center justify-center rounded-panel border border-teal-secondary/15 bg-placeholder text-[2.5rem] font-extrabold tracking-tight text-teal-secondary sm:max-w-[190px] md:max-w-[210px] lg:max-w-[230px]"
    >
      TP
    </div>
  );
}
```

```tsx
// src/sections/Hero.tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { GitHubIcon } from '@/components/icons/GitHubIcon';
import { LinkedInIcon } from '@/components/icons/LinkedInIcon';
import { HeroPortrait } from './HeroPortrait';
import { GITHUB_URL, LINKEDIN_URL } from '@/config/contact';
import { RESUME_URL } from '@/config/links';
import { trackEvent } from '@/lib/analytics';

export function Hero() {
  return (
    <section className="relative bg-cream px-6 pb-14 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12 lg:pt-36">
      <div className="mx-auto grid w-full max-w-content grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.55fr)] lg:gap-8">
        <div className="mx-auto w-full max-w-[440px] text-left lg:mx-0">
          <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-teal-secondary sm:text-[0.74rem]">
            Health Tech Builder
          </p>

          <h1 className="max-w-[10ch] text-[2.1rem] font-extrabold leading-[0.95] tracking-tight text-ink sm:text-[2.6rem] lg:text-[3rem]">
            Hi, I&rsquo;m Tejit.
          </h1>

          <p className="mt-5 max-w-[32rem] text-[0.94rem] leading-7 text-body">
            I&rsquo;m building Juno, an AI companion that helps patients get more out of
            every medical appointment &mdash; while working full-time as a Software
            Engineer II on Microsoft&rsquo;s Fabric Maps team. Health tech is where most
            of my energy outside of work goes, and where I&rsquo;m headed next.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              href={RESUME_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackEvent('resume_click', { source: 'hero', url: RESUME_URL })}
            >
              Download Resume
            </Button>

            {/* Deliberately react-router <Link>, not <Button href="#contact">
                — see PRD §4.2 for why: a plain same-pathname hash link would
                jump instantly, bypassing ScrollManager's smooth scroll. */}
            <Link
              to="/#contact"
              className="inline-flex items-center justify-center rounded-full border border-teal-secondary px-6 py-2.5 text-sm font-semibold text-teal-secondary transition hover:bg-teal-secondary hover:text-white lg:px-7 lg:py-3 lg:text-[0.92rem]"
            >
              Contact Me
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-2.5">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              onClick={() => trackEvent('outbound_click', { url: GITHUB_URL, context: 'hero_social', label: 'GitHub' })}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-secondary/15 bg-cream text-teal-secondary transition hover:-translate-y-0.5 hover:border-teal-secondary/25 hover:bg-teal-secondary hover:text-white"
            >
              <GitHubIcon />
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              onClick={() => trackEvent('outbound_click', { url: LINKEDIN_URL, context: 'hero_social', label: 'LinkedIn' })}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-secondary/15 bg-cream text-teal-secondary transition hover:-translate-y-0.5 hover:border-teal-secondary/25 hover:bg-teal-secondary hover:text-white"
            >
              <LinkedInIcon />
            </a>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <HeroPortrait />
        </div>
      </div>
    </section>
  );
}
```

Note: `<HeroPortrait />` is called here with **no `src`** — the monogram placeholder ships at launch (PRD §4.2, §8 item 3). Do not invent or hotlink a placeholder photo.

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. `Hero` has no `id`/`scroll-mt-24` — it is not a `Nav` scroll target (PRD §4.1). Confirm by inspection: `grep -n "id=" src/sections/Hero.tsx` returns no `<section id=` match.
     3. Devtools check at 375px: hero collapses to a single column, `HeroPortrait` (the "TP" monogram) renders **below** the text block, not beside it. At 1440px: two-column layout, portrait to the right, capped at `230px` max-width (visibly and noticeably smaller than a typical full-bleed hero image).
     4. Clicking "Download Resume" opens `RESUME_URL` in a new tab (`target="_blank"`) and calls `trackEvent('resume_click', { source: 'hero', url: RESUME_URL })` — verify via a temporary `console.log` inside a stubbed `trackEvent` during manual dev-server QA, or defer to a future test task if one is added (PRD §7 does not name a dedicated `Hero.test.tsx`, so no automated test is required by this task).
     5. "Contact Me" renders as a real `<a>` produced by react-router's `<Link>` (inspect the DOM — it is an anchor with `href="/#contact"`), not a `<Button>`.

---

### Task 3 — `FeaturedProjectsSection`
   - Status: Complete
   - Files: `src/sections/FeaturedProjectsSection.tsx` (new)
   - Changes: Per PRD §4.4. Depends on Task 1 (`ProjectCard`).

**Dependency, flag before starting:** imports `featuredProjects` from `@/config/featured` (SP02) and `ArrowIcon` from `@/components/icons/ArrowIcon` (SP01), both expected to exist per phase ordering. Per the phase-ordering hazard noted at the top of this file, `featuredProjects` may resolve to `[]` (or throw, if `FEATURED_PROJECT_SLUGS` references slugs that don't exist yet) until SP07's content lands — this is expected, not a bug in this task's code.

```tsx
// src/sections/FeaturedProjectsSection.tsx
import { Link } from 'react-router-dom';
import { featuredProjects } from '@/config/featured';
import { ProjectCard } from '@/components/ProjectCard';
import { ArrowIcon } from '@/components/icons/ArrowIcon';
import { trackEvent } from '@/lib/analytics';

export function FeaturedProjectsSection() {
  return (
    <section id="projects" className="scroll-mt-24 bg-sage px-6 py-16 sm:px-8 sm:py-20 md:px-10 lg:px-12 lg:py-24">
      <div className="mx-auto w-full max-w-content">
        <div className="max-w-[640px]">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-teal-secondary">Projects</p>
          <h2 className="mt-4 max-w-[13ch] text-[2rem] font-extrabold leading-[0.96] tracking-tight text-ink sm:text-[2.5rem]">
            Selected work, in health tech and beyond.
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 lg:mt-10">
          {featuredProjects.map((project) => (
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
                trackEvent('project_card_click', {
                  slug: project.slug,
                  collection: 'projects',
                  title: project.title,
                })
              }
              onExternalClick={() =>
                trackEvent('outbound_click', {
                  url: project.liveUrl ?? '',
                  context: 'content_external_link',
                  label: `Open ${project.title} live`,
                })
              }
            />
          ))}
        </div>

        <div className="mt-8 flex justify-center lg:mt-10">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 rounded-full border border-teal-secondary px-6 py-2.5 text-sm font-semibold text-teal-secondary transition hover:bg-teal-secondary hover:text-white lg:px-7 lg:py-3 lg:text-[0.92rem]"
          >
            See all projects
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
```

The headline "Selected work, in health tech and beyond." is real, shipped copy per PRD §4.10/§9 — do not mark it as a placeholder or TODO.

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. `<section id="projects" className="scroll-mt-24 ...">` present — this is the exact `id` SP01's `Nav`/`ScrollManager` already targets; do not rename it.
     3. Grid classes are exactly `grid-cols-1 md:grid-cols-2 xl:grid-cols-4` (matches techfolio, PRD §4.4).
     4. `See all projects` link's `to` prop is `/projects` and carries **no** `onClick`/`trackEvent` call — PRD §4.9/§9 explicitly excludes this from SP05's five tracked events.
     5. Devtools check with a 6-item fixture swapped in temporarily (or once real content lands): at `xl` width the grid wraps into a partial last row (4 + 2) with no layout break.

---

### Task 4 — Timeline primitives: `formatWorkDate`, `TimelineEntry`, `TimelineSeeAllStub`, `Timeline`
   - Status: Complete
   - Files: `src/components/timeline/formatWorkDate.ts` (new), `src/components/timeline/TimelineEntry.tsx` (new), `src/components/timeline/TimelineSeeAllStub.tsx` (new), `src/components/timeline/Timeline.tsx` (new)
   - Changes: Per PRD §4.5. This is the most visually-specified component set in the PRD — implement the CSS exactly as given, it is not an approximation.

**Dependency, flag before starting:** `TimelineEntry` imports `markdownComponents` from `@/data/markdownComponents` (SP02) and the `WorkExperience` type from `@/data` (SP02); both `TimelineEntry` and `TimelineSeeAllStub` import `trackEvent`/`ArrowIcon`/`ExternalLinkIcon` (SP05/SP01). All expected to exist per phase ordering.

```ts
// src/components/timeline/formatWorkDate.ts
/** Formats an ISO "YYYY-MM-DD" string as "Mon YYYY" (e.g. "Jun 2021"). Not
 *  used for the literal string "Present", which is rendered as-is by the
 *  caller. */
export function formatWorkDate(iso: string): string {
  const [year, month] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
```

```tsx
// src/components/timeline/TimelineEntry.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from '@/data/markdownComponents';
import { ExternalLinkIcon } from '../icons/ExternalLinkIcon';
import { formatWorkDate } from './formatWorkDate';
import type { WorkExperience } from '@/data';
import { trackEvent } from '@/lib/analytics';

interface TimelineEntryProps {
  entry: WorkExperience;
  /** True for index 0 of the full, startDate-descending-sorted array. */
  isCurrent: boolean;
  /** True only for the entry immediately preceding the end of the spine
   *  with no stub following it. False when a TimelineSeeAllStub follows,
   *  so the spine doesn't visually shrink right before it continues. */
  isLast: boolean;
}

const entryBaseClasses =
  "relative border-l-2 border-teal-secondary/15 pl-[22px] pt-[18px] transition-colors duration-200 hover:border-teal-secondary/28 " +
  "before:absolute before:-left-[5px] before:top-[22px] before:h-2 before:w-2 before:rounded-full before:border-2 before:border-cream before:content-[''] before:transition-colors before:duration-200";

export function TimelineEntry({ entry, isCurrent, isLast }: TimelineEntryProps) {
  return (
    <div
      role="listitem"
      className={[
        entryBaseClasses,
        isLast ? 'pb-1' : 'pb-6',
        isCurrent ? 'before:bg-teal' : 'before:bg-teal-secondary/20 hover:before:bg-teal',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.64rem] font-semibold uppercase tracking-[0.15em] text-teal-secondary">
          {entry.company}
        </span>
        <span className="shrink-0 text-[0.7rem] text-slate">
          {formatWorkDate(entry.startDate)} &ndash;{' '}
          {entry.endDate === 'Present' ? 'Present' : formatWorkDate(entry.endDate)}
        </span>
      </div>

      <h3 className="mt-0.5 text-[0.95rem] font-bold tracking-tight text-ink">{entry.role}</h3>

      {/* Deliberately NOT SP02's <ContentBody> — that wraps output in the
          `prose` plugin, sized for a full write-up. This blurb renders at a
          tighter, denser scale per the brief. See PRD §4.5/§9. */}
      <div className="mt-2 text-[0.82rem] leading-5 text-body [&_p]:m-0 [&_p+p]:mt-1.5 sm:text-[0.86rem]">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {entry.body}
        </ReactMarkdown>
      </div>

      {entry.links.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {entry.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                trackEvent('outbound_click', { url: link.href, context: 'content_external_link', label: link.label })
              }
              className="inline-flex items-center gap-1 text-[0.76rem] font-semibold text-teal-secondary hover:text-teal"
            >
              {link.label}
              <ExternalLinkIcon className="h-3 w-3" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

```tsx
// src/components/timeline/TimelineSeeAllStub.tsx
import { Link } from 'react-router-dom';
import { ArrowIcon } from '../icons/ArrowIcon';

export function TimelineSeeAllStub() {
  return (
    // Same border-left width/color and left padding as TimelineEntry, no
    // ::before at all — this is what makes the spine read as continuing
    // past the last real entry rather than terminating.
    <div role="listitem" className="border-l-2 border-teal-secondary/15 py-4 pl-[22px]">
      <Link
        to="/work-experience"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-secondary transition hover:text-teal"
      >
        See all experience
        <ArrowIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}
```

```tsx
// src/components/timeline/Timeline.tsx
import type { WorkExperience } from '@/data';
import { TimelineEntry } from './TimelineEntry';
import { TimelineSeeAllStub } from './TimelineSeeAllStub';

interface TimelineProps {
  /** Entries to render, in the order given. Callers pass an already-sorted
   *  slice — index 0 is always the true most-recent role. */
  entries: WorkExperience[];
  /** When true, renders a TimelineSeeAllStub after the last passed-in
   *  entry, and that entry gets standard (non-reduced) bottom padding.
   *  Omit/false for the full /work-experience page. */
  showSeeAll?: boolean;
}

export function Timeline({ entries, showSeeAll = false }: TimelineProps) {
  return (
    <div role="list" aria-label="Work experience timeline" className="flex flex-col gap-0 pl-1">
      {entries.map((entry, index) => (
        <TimelineEntry
          key={entry.id}
          entry={entry}
          isCurrent={index === 0}
          isLast={!showSeeAll && index === entries.length - 1}
        />
      ))}
      {showSeeAll && <TimelineSeeAllStub />}
    </div>
  );
}
```

**Note on `TimelineSeeAllStub`'s missing `trackEvent`:** the PRD's own §4.9 table explicitly says "See all experience" is not one of SP05's five tracked events — do not add an `onClick`/`trackEvent` call here even though `TimelineEntry`'s own links do get one; this asymmetry is intentional, not an oversight.

   - Acceptance criteria (unit-testable behavior is Task 12; these are the structural/visual checks specific to this task):
     1. `npx tsc --noEmit` passes.
     2. `Timeline`'s wrapper carries `role="list"` and `className` containing `gap-0` (not any nonzero gap) — the cards must stack with zero gap so the `border-l-2` rules read as one unbroken line, per PRD §4.5.
     3. Devtools check at 1440px on a page with ≥2 `TimelineEntry` rendered: select an entry's root `<div>` in the Elements panel — confirm computed `border-left-width: 2px`. Select its generated `::before` pseudo-element (DevTools' "::before" sub-node) — confirm computed `width: 8px`, `height: 8px`, `border-radius: 50%` (fully round), `border-width: 2px`, and `border-color` resolving to the page background (`#F7F1E8`, the `cream` token) — this 2px cream ring is what "punches" the dot through the continuous spine line.
     4. Same devtools check on the entry with `isCurrent=true` (the first/most-recent role): its `::before` background-color resolves to the accent teal (`#0F4C45`, `teal-secondary`/`teal` token), visibly distinct from any other entry's muted dot color.
     5. Devtools check at 375px: no horizontal overflow: the timeline is single-column by construction (a `flex-col` list of full-width blocks) and needs no responsive breakpoint override to remain correct — confirm no `sm:`/`md:`/`lg:` class exists anywhere in `Timeline.tsx`/`TimelineEntry.tsx`/`TimelineSeeAllStub.tsx` that changes layout structure (font-size-only responsive classes, if any were added beyond the PRD's spec, would be a scope addition — there are none in the spec above).
     6. `TimelineSeeAllStub` has no `before:` classes at all (`grep -c "before:" src/components/timeline/TimelineSeeAllStub.tsx` → `0`) — confirms no dot renders on the stub.

---

### Task 5 — `WorkExperienceSection` (landing variant)
   - Status: Complete
   - Files: `src/sections/WorkExperienceSection.tsx` (new)
   - Changes: Per PRD §4.5. Depends on Task 4.

**Deviation from the PRD's code sample, needed for testability:** the PRD's own sample computes `entries`/`hasMore` as plain local variables inside the component body. Task 12 (below) needs to boundary-test this logic (`LANDING_TIMELINE_LIMIT`, one below it, one above it) against an in-memory fixture array, which isn't possible if the logic only ever runs against the real, loaded `workExperience` export. Extract it into an exported pure function, `computeLandingTimelineState`, with identical behavior — this changes nothing about what ships, only what's directly callable from a test.

```tsx
// src/sections/WorkExperienceSection.tsx
import { workExperience, type WorkExperience } from '@/data';
import { Timeline } from '@/components/timeline/Timeline';

// Brief §2/§3 says "top 2–3 entries" without pinning an exact number.
// Resolved at 2 (PRD §4.5/§9, owner decision propagated from SP07's role
// drop) — the "See all" stub's visibility is NOT tuned via this number; it
// renders only when workExperience.length > LANDING_TIMELINE_LIMIT. At
// today's 2-role launch content that's false, so the stub does not render.
export const LANDING_TIMELINE_LIMIT = 2;

// Exported for testability — PRD §7 requires boundary-testing this
// computation at exactly LANDING_TIMELINE_LIMIT, one below, and one above.
export function computeLandingTimelineState(
  all: WorkExperience[],
  limit: number = LANDING_TIMELINE_LIMIT,
): { entries: WorkExperience[]; hasMore: boolean } {
  return { entries: all.slice(0, limit), hasMore: all.length > limit };
}

export function WorkExperienceSection() {
  const { entries, hasMore } = computeLandingTimelineState(workExperience);

  return (
    <section id="work-experience" className="scroll-mt-24 bg-cream px-6 py-16 sm:px-8 sm:py-20 md:px-10 lg:px-12 lg:py-24">
      <div className="mx-auto w-full max-w-[720px]">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-teal-secondary">Work Experience</p>
        <h2 className="mt-4 max-w-[14ch] text-[2rem] font-extrabold leading-[0.96] tracking-tight text-ink sm:text-[2.4rem]">
          Where I&rsquo;ve worked and what I&rsquo;ve built.
        </h2>
        <div className="mt-8 lg:mt-10">
          <Timeline entries={entries} showSeeAll={hasMore} />
        </div>
      </div>
    </section>
  );
}
```

The headline "Where I've worked and what I've built." is real, shipped copy per PRD §4.10/§9.

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. `<section id="work-experience" className="scroll-mt-24 ...">` present, matching SP01's placeholder `id` exactly.
     3. `computeLandingTimelineState` is exported (`grep -n "export function computeLandingTimelineState" src/sections/WorkExperienceSection.tsx` matches) — Task 12 depends on this export existing.
     4. With today's real content (2 work-experience roles, once SP07 lands), `computeLandingTimelineState(workExperience)` returns `hasMore: false` and both roles appear in `entries` — confirm once content exists; until then this is only verifiable via the fixture tests in Task 12.

---

### Task 6 — `WorkExperiencePage`
   - Status: Complete
   - Files: `src/pages/WorkExperiencePage.tsx` (modify — replaces SP01's placeholder)
   - Changes: Per PRD §4.6. Depends on Task 4.

**Dependency, flag before starting:** imports `BackButton` from `@/components/BackButton` (SP01) and `workExperience` from `@/data` (SP02).

```tsx
// src/pages/WorkExperiencePage.tsx
import { BackButton } from '@/components/BackButton';
import { Timeline } from '@/components/timeline/Timeline';
import { workExperience } from '@/data';

export function WorkExperiencePage() {
  return (
    <div className="mx-auto w-full max-w-[720px] px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10">
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

No `showSeeAll` prop passed — defaults to `false`, so this page renders every entry with the spine simply ending after the real last entry (its `isLast` branch gets the reduced `pb-1`). `PageShell` (SP01) already wraps this route via the router; this component only owns its own content.

**Accepted, deliberate duplication at today's 2-role launch content** (PRD §4.6): this page currently shows the identical two entries already visible in the landing page's Work Experience section, and per Task 5's `hasMore` gating, the landing page doesn't even link here today. This is accepted, not a defect — do not delete or gate this route.

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. Route renders (`npm run dev`, visit `/work-experience`) with a working `BackButton` (navigates to `/`) and the `h1` reading "The full timeline."
     3. `Timeline` here is called with no `showSeeAll` prop — `grep -n "showSeeAll" src/pages/WorkExperiencePage.tsx` returns no matches.
     4. Once real content exists: the last entry in the rendered list has `pb-1` (not `pb-6`) on its root `<div>` — confirm in devtools by inspecting the final `role="listitem"` element's class list.

---

### Task 7 — `AboutSection`
   - Status: Complete
   - Files: `src/sections/AboutSection.tsx` (new)
   - Changes: Per PRD §4.7. No external dependencies beyond Tailwind tokens.

```tsx
// src/sections/AboutSection.tsx
export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-24 bg-sage px-6 py-16 sm:px-8 sm:py-20 md:px-10 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-[640px] text-left">
        <h2 className="text-[1.75rem] font-extrabold leading-[0.97] tracking-tight text-ink sm:text-[2.15rem]">
          About
        </h2>
        <div className="mt-5 space-y-4 text-[0.92rem] leading-7 text-body">
          <p>
            I&rsquo;m a software engineer who ends up building things end to end &mdash;
            backend systems at Microsoft during the day, and a health-tech startup nights
            and weekends.
          </p>
          <p>
            At Microsoft, I&rsquo;m a Software Engineer II on the Fabric Maps team, where I
            work on the infrastructure and developer tools behind large-scale geospatial
            data.
          </p>
          <p>
            Outside of that, I&rsquo;m building Juno &mdash; an AI companion that helps
            patients walk into a doctor&rsquo;s appointment prepared, and walk out with a
            clear record of what was said and what to do next. It&rsquo;s early: I&rsquo;m
            validating the idea directly with patients and clinicians before scaling
            anything.
          </p>
          <p>
            Health tech isn&rsquo;t really a pivot for me &mdash; some of my first research,
            in college, was a self-testing app for HIV and syphilis and a
            pill-identification tool built from photos. Juno is the same instinct, aimed
            at a bigger problem.
          </p>
        </div>
      </div>
    </section>
  );
}
```

**Explicitly not the card format** (PRD §4.7): no `rounded-panel`/`border`/`shadow-panel` wrapper around the prose — it sits directly on the section's own `bg-sage` background. This is a deliberate divergence from techfolio's own bordered-card About section; do not add a card wrapper even for visual consistency with other sections.

**No separate eyebrow + headline pairing** — just a plain `h2` reading "About", no uppercase eyebrow label above it (unlike Hero/Projects/Work Experience/Contact).

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. `<section id="about" className="scroll-mt-24 ...">` present.
     3. `grep -n "rounded-panel\|shadow-panel\|border " src/sections/AboutSection.tsx` returns no matches on the section's content wrapper — confirms no card treatment was added.
     4. Devtools check: the `<h2>About</h2>` has no preceding uppercase eyebrow `<p>` sibling (unlike `Hero`/`FeaturedProjectsSection`/`WorkExperienceSection`/`ContactSection`, which all do).

---

### Task 8 — `ContactSection`
   - Files: `src/sections/ContactSection.tsx` (new)
   - Changes: Per PRD §4.8. Depends on SP05's `@/config/contact` (`GITHUB_URL`, `LINKEDIN_URL`) — not on any task in this file; this sub-project does not create or extend `contact.ts` (binding, PRD §9).

**Dependency, flag before starting:** imports `Button` (`@/components/Button`, SP01), `GitHubIcon`/`LinkedInIcon`/`EmailIcon` (`@/components/icons/...`, SP01), `CONTACT_EMAIL_DISPLAY`/`LINKEDIN_URL` (`@/config/contact`, SP05), `useContactMailto` (`@/hooks/useContactMailto`, SP05), `trackEvent` (`@/lib/analytics`, SP05). All expected to exist per phase ordering; if any SP05 import is missing, stop and confirm with the orchestrator rather than reimplementing the obfuscation hook locally — PRD §4.8 is explicit this sub-project consumes it as-is, never reimplements it.

```tsx
// src/sections/ContactSection.tsx
import { Button } from '@/components/Button';
import { GitHubIcon } from '@/components/icons/GitHubIcon';
import { LinkedInIcon } from '@/components/icons/LinkedInIcon';
import { EmailIcon } from '@/components/icons/EmailIcon';
import { CONTACT_EMAIL_DISPLAY, LINKEDIN_URL, GITHUB_URL } from '@/config/contact';
import { useContactMailto } from '@/hooks/useContactMailto';
import { trackEvent } from '@/lib/analytics';

// No location constant — resolved (PRD §9): the Contact aside ships with no
// location line at all, owner decision. Email + circular GitHub/LinkedIn
// icon buttons is the complete aside. Do not add a LocationIcon or a
// placeholder location string.

export function ContactSection() {
  const emailHref = useContactMailto();

  return (
    <section id="contact" className="scroll-mt-24 bg-cream px-6 py-16 sm:px-8 sm:py-20 md:px-10 lg:px-12 lg:py-24">
      <div className="mx-auto grid w-full max-w-content grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(260px,0.6fr)] lg:gap-14">
        <div className="max-w-[540px]">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-teal-secondary">Contact</p>
          <h2 className="mt-3.5 max-w-[12ch] text-[1.75rem] font-extrabold leading-[0.97] tracking-tight text-ink sm:text-[2.15rem]">
            Get in Touch
          </h2>
          <p className="mt-4 max-w-[28rem] text-[0.9rem] leading-6.5 text-body">
            Whether you&rsquo;re hiring, working on something in health tech, or want to
            talk through Juno with a clinician&rsquo;s or researcher&rsquo;s eye &mdash;
            I&rsquo;d like to hear from you.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {emailHref ? (
              <Button href={emailHref}>
                Email Me
              </Button>
            ) : (
              <span className="select-all rounded-full border border-teal-secondary/20 px-5 py-2 text-[0.82rem] font-semibold text-teal-secondary">
                {CONTACT_EMAIL_DISPLAY}
              </span>
            )}
          </div>
        </div>

        <aside className="lg:pt-5">
          <div className="rounded-panel border border-teal-secondary/12 bg-sage p-4.5 shadow-panel sm:p-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-teal-secondary">Connect</p>

            <div className="mt-5 space-y-4 text-ink">
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-teal-secondary/12 bg-cream text-teal-secondary">
                  <EmailIcon />
                </span>
                <div>
                  <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate">Email</p>
                  {emailHref ? (
                    <a href={emailHref} className="mt-1.5 inline-block text-[0.9rem] font-semibold text-ink transition hover:text-teal-secondary">
                      {CONTACT_EMAIL_DISPLAY}
                    </a>
                  ) : (
                    <p className="mt-1.5 select-all text-[0.9rem] font-semibold text-ink">{CONTACT_EMAIL_DISPLAY}</p>
                  )}
                </div>
              </div>

              <div className="border-t border-teal-secondary/10 pt-4">
                <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate">Profiles</p>
                <div className="mt-3 flex items-center gap-2.5">
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="GitHub"
                    onClick={() => trackEvent('outbound_click', { url: GITHUB_URL, context: 'contact_social', label: 'GitHub' })}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-secondary/12 bg-cream text-teal-secondary transition hover:-translate-y-0.5 hover:bg-teal-secondary hover:text-white"
                  >
                    <GitHubIcon />
                  </a>
                  <a
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                    onClick={() => trackEvent('outbound_click', { url: LINKEDIN_URL, context: 'contact_social', label: 'LinkedIn' })}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-secondary/12 bg-cream text-teal-secondary transition hover:-translate-y-0.5 hover:bg-teal-secondary hover:text-white"
                  >
                    <LinkedInIcon />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
```

**Why this can never leak a scrapeable address, stated precisely (PRD §4.8):** `useContactMailto()` returns `null` both during `vite-react-ssg`'s build-time prerender (effects never run) and during the very first client render before hydration (its `useState` initializes to `null`) — so the prerendered HTML and the first client render are byte-identical, and every conditional above renders its `null` branch (`CONTACT_EMAIL_DISPLAY`, the obfuscated string, never a real `mailto:` href). Only after hydration completes does the effect fire and swap in the real link — an ordinary post-hydration state update, not something hydration ever diffs against. Do not "simplify" this by rendering `emailHref` unconditionally or by computing a `mailto:` string outside the hook.

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. `<section id="contact" className="scroll-mt-24 ...">` present.
     3. `grep -n "LocationIcon\|location" src/sections/ContactSection.tsx` returns no matches — confirms no location line was added.
     4. `grep -n "mailto:" src/sections/ContactSection.tsx` returns no matches — the only place a `mailto:` string is constructed is inside SP05's `useContactMailto`, never inlined here.
     5. Full pre/post-mount behavioral verification is Task 14 (dedicated integration test).
     6. Devtools check at 375px: the "Connect" aside stacks below the left column (heading/paragraph/button), matching techfolio's own contact section stacking order.

---

### Task 9 — `useSectionScrollDepth`
   - Files: `src/hooks/useSectionScrollDepth.ts` (new)
   - Changes: Per PRD §4.9. Depends on `trackEvent` from `@/lib/analytics` (SP05).

```ts
// src/hooks/useSectionScrollDepth.ts
import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

/**
 * Fires trackEvent('section_view', { section }) the first time each given
 * section id crosses 50% viewport visibility, once per section per page
 * load. `hero` is intentionally excluded from the caller's id list — that
 * signal is already covered by a pageview event SP05 owns elsewhere.
 */
export function useSectionScrollDepth(sectionIds: string[]): void {
  const fired = useRef(new Set<string>());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting && !fired.current.has(id)) {
            fired.current.add(id);
            trackEvent('section_view', { section: id });
          }
        }
      },
      { threshold: 0.5 },
    );

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [sectionIds]);
}
```

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. Behavioral verification is Task 15 (dedicated unit test with a mocked `IntersectionObserver`).

---

### Task 10 — `HomePage` composition
   - Files: `src/pages/HomePage.tsx` (modify — replaces SP01's placeholder)
   - Changes: Per PRD §4.1. Depends on Tasks 2, 3, 5, 7, 8, 9 (every section plus the scroll-depth hook).

```tsx
// src/pages/HomePage.tsx
import { Hero } from '@/sections/Hero';
import { FeaturedProjectsSection } from '@/sections/FeaturedProjectsSection';
import { WorkExperienceSection } from '@/sections/WorkExperienceSection';
import { AboutSection } from '@/sections/AboutSection';
import { ContactSection } from '@/sections/ContactSection';
import { useSectionScrollDepth } from '@/hooks/useSectionScrollDepth';

// Module-scope constant, not an inline array literal in the component body —
// a fresh array reference every render would re-run useSectionScrollDepth's
// IntersectionObserver setup/teardown on every re-render for no reason.
const LANDING_SCROLL_SECTIONS = ['projects', 'work-experience', 'about', 'contact'];

export function HomePage() {
  useSectionScrollDepth(LANDING_SCROLL_SECTIONS);
  return (
    <>
      <Hero />
      <FeaturedProjectsSection />
      <WorkExperienceSection />
      <AboutSection />
      <ContactSection />
    </>
  );
}
```

**Background rhythm** (PRD §4.1, `[DEFERRED]` per §9 — a cosmetic judgment call, not a locked contract): Hero (`bg-cream`) → Projects (`bg-sage`) → Work Experience (`bg-cream`) → About (`bg-sage`) → Contact (`bg-cream`), already baked into each section's own `<section>` className from Tasks 3/4/6/8/9 above — this task does not add any additional wrapper or background styling in `HomePage.tsx` itself; each section owns its own background.

   - Acceptance criteria:
     1. `npx tsc --noEmit` passes.
     2. `LANDING_SCROLL_SECTIONS` is declared at module scope, not inside the `HomePage` function body — `grep -n "^const LANDING_SCROLL_SECTIONS" src/pages/HomePage.tsx` matches.
     3. Full render-order/id verification is Task 16 (dedicated smoke test).
     4. Devtools check: scrolling from top to bottom of `/` visits backgrounds in the order cream → sage → cream → sage → cream with no two adjacent sections sharing the same background color.

---

### Task 11 — `ProjectCard` unit tests
   - Files: `src/components/ProjectCard.test.tsx` (new)
   - Changes: Per PRD §7, first bullet. Depends on Task 1. Use `@testing-library/react` + a `MemoryRouter` wrapper (the component renders a react-router `<Link>`).

```tsx
// src/components/ProjectCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProjectCard } from './ProjectCard';

function renderCard(props: Partial<React.ComponentProps<typeof ProjectCard>> = {}) {
  return render(
    <MemoryRouter>
      <ProjectCard
        href="/projects/foo"
        image="/x.png"
        title="Foo"
        description="A project."
        tags={['Health Tech']}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('ProjectCard', () => {
  it('renders the title link with the given href', () => {
    renderCard();
    expect(screen.getByRole('link', { name: 'Foo' })).toHaveAttribute('href', '/projects/foo');
  });

  it('renders the status pill only when status is provided', () => {
    const { rerender } = renderCard({ status: 'Building' });
    expect(screen.getByText('Building')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ProjectCard href="/projects/foo" image="/x.png" title="Foo" description="A project." tags={[]} />
      </MemoryRouter>,
    );
    expect(screen.queryByText('Building')).not.toBeInTheDocument();
  });

  it('renders the external-link icon only when externalHref is provided', () => {
    const { rerender } = renderCard({ externalHref: 'https://example.com' });
    expect(screen.getByRole('link', { name: /Open Foo externally/i })).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ProjectCard href="/projects/foo" image="/x.png" title="Foo" description="A project." tags={[]} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('link', { name: /Open Foo externally/i })).not.toBeInTheDocument();
  });

  it('clicking the external-link icon calls onExternalClick and not onCardClick', async () => {
    const onCardClick = vi.fn();
    const onExternalClick = vi.fn();
    renderCard({ externalHref: 'https://example.com', onCardClick, onExternalClick });

    await userEvent.click(screen.getByRole('link', { name: /Open Foo externally/i }));

    expect(onExternalClick).toHaveBeenCalledTimes(1);
    expect(onCardClick).not.toHaveBeenCalled();
  });

  it('clicking the title link calls onCardClick and not onExternalClick', async () => {
    const onCardClick = vi.fn();
    const onExternalClick = vi.fn();
    renderCard({ externalHref: 'https://example.com', onCardClick, onExternalClick });

    await userEvent.click(screen.getByRole('link', { name: 'Foo' }));

    expect(onCardClick).toHaveBeenCalledTimes(1);
    expect(onExternalClick).not.toHaveBeenCalled();
  });
});
```

   - Acceptance criteria: `npm test` passes all five cases. The "no reserved space when status is absent" claim (PRD §4.3) is verified structurally here (the pill node is entirely absent, not present-but-empty) — a supplementary devtools check (render two cards side by side, one with `status`, one without, in a temporary dev-server fixture) confirms both cards report identical rendered height, since jsdom (used by `vitest`) does not compute real layout.

---

### Task 12 — Timeline behavior tests
   - Files: `src/components/timeline/Timeline.test.tsx` (new), `src/sections/WorkExperienceSection.test.ts` (new)
   - Changes: Per PRD §7, second bullet. Depends on Tasks 4 and 5. Use in-memory `WorkExperience[]` fixtures — never the real loaded `workExperience`.

```tsx
// src/components/timeline/Timeline.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Timeline } from './Timeline';
import type { WorkExperience } from '@/data';

function entry(id: string, startDate: string, endDate: string | 'Present' = 'Present'): WorkExperience {
  return { id, company: `Co ${id}`, role: `Role ${id}`, startDate, endDate, links: [], draftDate: false, body: `Body ${id}` };
}

const fixtures = [entry('a', '2024-01-01'), entry('b', '2022-01-01', '2023-12-01')];

function renderTimeline(props: Partial<React.ComponentProps<typeof Timeline>> = {}) {
  return render(
    <MemoryRouter>
      <Timeline entries={fixtures} {...props} />
    </MemoryRouter>,
  );
}

describe('Timeline', () => {
  it('marks only index 0 as current (accent dot class)', () => {
    renderTimeline();
    const items = screen.getAllByRole('listitem').filter((el) => el.textContent?.includes('Role'));
    expect(items[0].className).toContain('before:bg-teal');
    expect(items[0].className).not.toContain('before:bg-teal-secondary/20');
    expect(items[1].className).toContain('before:bg-teal-secondary/20');
  });

  it('renders no TimelineSeeAllStub when showSeeAll is false', () => {
    renderTimeline({ showSeeAll: false });
    expect(screen.queryByText('See all experience')).not.toBeInTheDocument();
  });

  it('renders TimelineSeeAllStub when showSeeAll is true, and the preceding entry keeps pb-6 (not pb-1)', () => {
    renderTimeline({ showSeeAll: true });
    expect(screen.getByText('See all experience')).toBeInTheDocument();

    const items = screen.getAllByRole('listitem').filter((el) => el.textContent?.includes('Role'));
    const lastRealEntry = items[items.length - 1];
    expect(lastRealEntry.className).toContain('pb-6');
    expect(lastRealEntry.className).not.toContain('pb-1');
  });

  it('gives the true last entry pb-1 when there is no stub', () => {
    renderTimeline({ showSeeAll: false });
    const items = screen.getAllByRole('listitem').filter((el) => el.textContent?.includes('Role'));
    expect(items[items.length - 1].className).toContain('pb-1');
  });
});
```

```ts
// src/sections/WorkExperienceSection.test.ts
import { describe, it, expect } from 'vitest';
import { computeLandingTimelineState, LANDING_TIMELINE_LIMIT } from './WorkExperienceSection';
import type { WorkExperience } from '@/data';

function entry(id: string): WorkExperience {
  return { id, company: 'C', role: 'R', startDate: '2024-01-01', endDate: 'Present', links: [], draftDate: false, body: 'b' };
}

describe('computeLandingTimelineState', () => {
  it('hasMore is false at exactly the limit', () => {
    const all = Array.from({ length: LANDING_TIMELINE_LIMIT }, (_, i) => entry(String(i)));
    const { hasMore, entries } = computeLandingTimelineState(all);
    expect(hasMore).toBe(false);
    expect(entries).toHaveLength(LANDING_TIMELINE_LIMIT);
  });

  it('hasMore is false one below the limit', () => {
    const all = Array.from({ length: LANDING_TIMELINE_LIMIT - 1 }, (_, i) => entry(String(i)));
    const { hasMore } = computeLandingTimelineState(all);
    expect(hasMore).toBe(false);
  });

  it('hasMore is true one above the limit, and entries is still capped at the limit', () => {
    const all = Array.from({ length: LANDING_TIMELINE_LIMIT + 1 }, (_, i) => entry(String(i)));
    const { hasMore, entries } = computeLandingTimelineState(all);
    expect(hasMore).toBe(true);
    expect(entries).toHaveLength(LANDING_TIMELINE_LIMIT);
  });
});
```

   - Acceptance criteria: `npm test` passes all seven cases across both files. The `before:bg-teal` vs `before:bg-teal-secondary/20` className assertions are the unit-testable proxy for the devtools dot-color check already specified in Task 4's acceptance criteria #4 — both should agree.

---

### Task 13 — `formatWorkDate` unit tests
   - Files: `src/components/timeline/formatWorkDate.test.ts` (new)
   - Changes: Per PRD §7, third bullet. Depends on Task 4.

```ts
import { describe, it, expect } from 'vitest';
import { formatWorkDate } from './formatWorkDate';

describe('formatWorkDate', () => {
  it.each([
    ['2021-06-01', 'Jun 2021'],
    ['2020-01-15', 'Jan 2020'],
    ['2023-12-31', 'Dec 2023'],
  ])('formats %s as %s', (input, expected) => {
    expect(formatWorkDate(input)).toBe(expected);
  });
});
```

   - Acceptance criteria: `npm test` passes all three cases. `formatWorkDate` is never called with the literal string `'Present'` anywhere in `TimelineEntry.tsx` — confirmed by inspection (`grep -n "formatWorkDate(entry.endDate)" src/components/timeline/TimelineEntry.tsx` should be gated behind the `entry.endDate === 'Present' ? 'Present' : formatWorkDate(entry.endDate)` ternary from Task 4, not called unconditionally).

---

### Task 14 — `ContactSection` pre/post-mount integration test
   - Files: `src/sections/ContactSection.test.tsx` (new)
   - Changes: Per PRD §7, fourth bullet. Depends on Task 8. This is the test that pins the hydration-safety property the PRD spends a full paragraph justifying — verify the behavior actually holds, not just that it's plausible in theory.

```tsx
// src/sections/ContactSection.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ContactSection } from './ContactSection';
import { CONTACT_EMAIL_DISPLAY } from '@/config/contact';

describe('ContactSection', () => {
  it('shows the obfuscated display text with no href before mount effects flush, then a real mailto: link after', async () => {
    render(
      <MemoryRouter>
        <ContactSection />
      </MemoryRouter>,
    );

    // Immediately after the first render (before effects have had a chance
    // to flush), the email must appear as plain text, not a link.
    const initialNodes = screen.getAllByText(CONTACT_EMAIL_DISPLAY);
    for (const node of initialNodes) {
      expect(node.closest('a')).toBeNull();
    }

    // After effects flush (useContactMailto's useEffect fires post-mount),
    // the same text becomes a real mailto: link in both the primary button
    // slot and the Connect aside.
    await waitFor(() => {
      const links = screen.getAllByText(CONTACT_EMAIL_DISPLAY).map((n) => n.closest('a'));
      expect(links.every((a) => a?.getAttribute('href')?.startsWith('mailto:'))).toBe(true);
    });
  });
});
```

   - Acceptance criteria: `npm test` passes. If `@/config/contact`/`@/hooks/useContactMailto` (SP05) don't exist yet when this task is picked up, this test file cannot even import — stop and confirm with the orchestrator (per the phase-ordering note, SP05 lands before SP03, so this should not occur in the normal sequence).

---

### Task 15 — `useSectionScrollDepth` unit test
   - Files: `src/hooks/useSectionScrollDepth.test.tsx` (new)
   - Changes: Per PRD §7, fifth bullet. Depends on Task 9. Mock `IntersectionObserver` (not provided by jsdom).

```tsx
// src/hooks/useSectionScrollDepth.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { useSectionScrollDepth } from './useSectionScrollDepth';
import * as analytics from '@/lib/analytics';

let observedCallback: IntersectionObserverCallback;

class MockIntersectionObserver {
  constructor(cb: IntersectionObserverCallback) {
    observedCallback = cb;
  }
  observe() {}
  disconnect() {}
}

function TestComponent({ ids }: { ids: string[] }) {
  useSectionScrollDepth(ids);
  return (
    <>
      {ids.map((id) => (
        <div key={id} id={id} />
      ))}
    </>
  );
}

describe('useSectionScrollDepth', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.spyOn(analytics, 'trackEvent').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('fires section_view exactly once per section even if the observer callback repeats for the same element', () => {
    render(<TestComponent ids={['projects']} />);
    const target = document.getElementById('projects')!;
    const fakeEntry = { target, isIntersecting: true } as IntersectionObserverEntry;

    observedCallback([fakeEntry], {} as IntersectionObserver);
    observedCallback([fakeEntry], {} as IntersectionObserver);
    observedCallback([fakeEntry], {} as IntersectionObserver);

    expect(analytics.trackEvent).toHaveBeenCalledTimes(1);
    expect(analytics.trackEvent).toHaveBeenCalledWith('section_view', { section: 'projects' });
  });

  it('does not fire for an entry that is not yet intersecting', () => {
    render(<TestComponent ids={['about']} />);
    const target = document.getElementById('about')!;
    observedCallback([{ target, isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(analytics.trackEvent).not.toHaveBeenCalled();
  });
});
```

   - Acceptance criteria: `npm test` passes both cases.

---

### Task 16 — `HomePage` smoke test
   - Files: `src/pages/HomePage.test.tsx` (new)
   - Changes: Per PRD §7, sixth bullet. Depends on Task 10 (and transitively on every section task). Renders the real composed `HomePage` — if `@/config/featured`/`@/data` throw because content hasn't landed yet (per the phase-ordering hazard noted at the top of this file), this test will fail for reasons outside this task's own code; if that happens, note it and do not attempt to work around it by mocking `@/data` in a way that diverges from how `HomePage` actually consumes it in production.

```tsx
// src/pages/HomePage.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('renders all five sections in order with the four anchored ids present', () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const sectionIds = Array.from(container.querySelectorAll('section')).map((el) => el.id);
    // Hero has no id (not a Nav target); the other four appear in this order.
    expect(sectionIds).toEqual(['projects', 'work-experience', 'about', 'contact']);
  });

  it('renders without throwing', () => {
    expect(() =>
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>,
      ),
    ).not.toThrow();
  });
});
```

   - Acceptance criteria: `npm test` passes both cases. The `sectionIds` order assertion is the direct, automated check for PRD §4.1's composition order (Hero → Featured Projects → Work Experience → About → Contact) and for SP01's `id`/`scroll-mt-24` contract being preserved untouched.

---

## Summary of what requires you (not a dev agent)

1. **Approve or edit SP07's already-drafted Hero, About, and Contact copy** (rendered verbatim in Tasks 2, 7, 8) — this is a first draft pending your read-through (PRD §8 item 1); nothing in these tasks depends on your edit landing before implementation.
2. **Approve or edit the three headline strings this PRD drafts directly and ships as real copy** (PRD §8 item 2, §4.10): the Featured Projects `h2` ("Selected work, in health tech and beyond.", Task 3), the Work Experience `h2` ("Where I've worked and what I've built.", Task 5), and the `/work-experience` page's `h1` ("The full timeline.", Task 6).
3. **Supply a real hero portrait or commissioned illustration whenever ready** (PRD §8 item 3) — not blocking. The monogram placeholder ships at launch (Task 2); the swap is a one-line prop change (`<HeroPortrait src="/hero-portrait.jpg" />`) with no other file touched.
4. **Nothing else in this sub-project is owner-blocked** (PRD §8 item 4) — the contact location line, work-experience dates, `LANDING_TIMELINE_LIMIT = 2`, and Drive-vs-local résumé decision are all already resolved as binding architect decisions (PRD §9); DNS/Firebase items belong to SP01's own manual-intervention list, not this one.
