# PRD — Sub-project 03: Landing Page & Work-Experience Timeline

**Repo:** `tejitpabari/tejitpabari` (branch `website-revamp`)
**Depends on:** SP01 (App shell, design system, deploy) — consumes `Nav`/`Footer`/`PageShell`/`Button`/`TagPill`/`BackButton`/icon set, the route table, `ScrollManager`, and the Tailwind design tokens verbatim. SP02 (Content pipeline) — consumes `featuredProjects` (`@/config/featured`), `workExperience` (`@/data`), and the shared `markdownComponents` react-markdown link renderer verbatim.
**Blocks:** SP04 (Projects & Research pages) — reuses `ProjectCard` as a shared, collection-agnostic component; this is the explicit seam called out throughout §4.
**Reference brief:** `/root/projects/tejitpabari/.dev/website-revamp/BRIEF.md` §2 (Design language, Work-experience timeline, Contact facts), §3 (same sections). Nothing in the brief is re-litigated here.
**Also consumed (not designed here):** `/root/projects/tejitpabari/.dev/website-revamp/07-content-migration-copy/PRD.md` — SP07's already-drafted Hero/About/Contact copy is quoted directly in §4 below (with citation) as the content that fills the slots this PRD designs, per SP07 §6's own statement that this copy is "handed to SP03." SP05's `src/config/contact.ts` (`CONTACT_EMAIL_DISPLAY`, `LINKEDIN_URL`) and `useContactMailto` hook, ported from `juno-landing-page`, are consumed as-is — SP05's own PRD directory is not yet written at the time of this PRD, so the exact file/hook contract is taken from the brief's explicit citation of `juno-landing-page/src/config/contact.ts` and `src/hooks/useContactMailto.ts` (read directly, reproduced in §4.8) and flagged as an assumption in §9 if SP05 lands something different.

---

## 1. Problem

SP01 shipped a deployed, empty-but-correct shell: `HomePage.tsx` is a stub with four `<section id="…">` placeholders (`projects`, `work-experience`, `about`, `contact`), each carrying `scroll-mt-24` so `ScrollManager`'s anchor-scroll lands cleanly below the floating nav pill, and `WorkExperiencePage.tsx` is a one-line `BackButton` + heading placeholder. SP02 shipped the data layer — `featuredProjects`, `workExperience`, and every validated frontmatter field either exposes — but nothing renders any of it yet.

This sub-project is the first place real page content appears. It has to solve five things that are each individually non-trivial, not just "fill in the placeholders":

1. **A hero that repositions Tejit toward health tech** with a noticeably smaller image than the current site would have used (brief §2/§3), and no owner-supplied photo or illustration to put there — the placeholder mechanism itself has to be designed, not skipped.
2. **A `ProjectCard` that is genuinely collection-agnostic**, since SP04 reuses it verbatim for both `/projects` and `/research` grids, but only Projects (not Research) carries a `liveUrl` field (SP02 §4.4.3's deliberate omission) — the card's external-link shortcut can't hardcode a Projects-only field name and still be a shared component.
3. **A status pill that occupies zero layout space when absent** — SP02's content model treats `status` as genuinely optional with no default, and the card must render identically whether or not a pill is present, not reserve a gap.
4. **A work-experience timeline** built from a CSS technique sourced from an unlicensed reference (`_reference-gbose`, all rights reserved) — reimplemented generically per the brief's own attribution rules, mapped onto this project's palette, with a "landing shows a few, then a stub continues the spine" behavior that has to look structurally continuous, not like two disconnected UI elements.
5. **An obfuscated-email contact section** that must never leak a scrapeable address into prerendered HTML, using a hook (`useContactMailto`) whose build-time-vs-client-time behavior is easy to get backwards into a hydration mismatch if implemented carelessly.

None of SP01/SP02's contracts are renegotiated here — this PRD is the concrete design for what renders inside the seams they already defined.

## 2. Goals

- `HomePage.tsx` composes Hero → Featured Projects → Work Experience (landing variant) → About → Contact, in that order, using the exact section `id`s and `scroll-mt-24` convention SP01's placeholder already established, so `Nav`/`ScrollManager` need no changes.
- A `Hero` with eyebrow, greeting, one paragraph, "Download Resume" (external, Google Drive) + "Contact Me" (in-page anchor, router-aware) CTAs, a GitHub/LinkedIn icon row, and a small, explicitly swappable placeholder portrait — no GSAP, no scroll cue.
- A `ProjectCard` component, in `src/components/` (not `src/sections/`, since SP04 imports it directly), with a prop interface that has no notion of "Projects" or "Research" — every collection-specific decision (route prefix, whether to populate the external-link shortcut) is made by the caller, not the card.
- A Featured Projects section rendering `featuredProjects` (SP02, capped at 6) in the techfolio grid, plus a "See all projects" link to `/projects`.
- A work-experience `Timeline`/`TimelineEntry`/`TimelineSeeAllStub` set implementing the gbose border-left-as-spine technique against this project's palette, with a landing variant (first N entries + a continuation stub) and a full variant (`/work-experience`, no stub) sharing the same components.
- An `AboutSection` that is plain prose on the page background — no card, no border, no bounded panel — satisfying the brief's explicit rejection of the card format for this one section.
- A `ContactSection` in the two-column techfolio layout, consuming SP05's obfuscated-email hook without reimplementing it, with a stated, verified argument for why it can't leak a plain address into prerendered HTML or produce a hydration mismatch.
- Every analytics call site SP05's `trackEvent` needs from this sub-project's components, stated precisely enough that SP05 only has to implement the function, not go hunting for where to call it.
- Every content slot this sub-project's components expose to SP07, with a length budget, cross-checked against what SP07 has *already* drafted (§07 PRD) so this document doesn't re-specify a budget SP07 already committed to differently.

## 3. Non-Goals

- `/projects`, `/research`, `SearchFilter`, the shared detail-page template, `/projects/<slug>/live` — SP04's scope entirely. This PRD only builds and hands off `ProjectCard`.
- `ConsentContext`, `loadGa()`, the consent banner, and `trackEvent`'s actual implementation — SP05's scope. This PRD states call sites against SP05's now-confirmed function signature (§4.9, §9), not the analytics module itself.
- `RouteMeta`, OG tags, OG image generation, the sample project — SP06's scope.
- Any markdown content file, or final hero/About/Contact/timeline copy — SP07's scope. Where SP07 has already drafted copy (hero, About, Contact — confirmed by reading `07-content-migration-copy/PRD.md` directly), this PRD quotes it with citation as the content that fills the slots designed here; where SP07 hasn't drafted something this sub-project's design introduces (the Featured Projects and Work Experience section headlines — see §4.10), that's flagged as a genuine gap, not filled in here.
- The real hero portrait/photo — owner-only, already tracked as an open item in this PRD's own §8; this PRD does not re-decide it, only consumes whichever value lands in `@/data`/`@/config`. (The contact location string and the Drive-vs-local résumé decision are both already resolved — see §9 — and are no longer open items this PRD defers on.)
- Dark mode, scroll-reveal animation, a contact form, work-experience detail pages, sub-role nesting — all locked non-goals from the brief, unchanged here.
- Editing SP01's `Footer.tsx` or SP05's `contact.ts` directly. Where this sub-project's design implies a small addition to one of those files (e.g., a `GITHUB_URL` constant, a shared `RESUME_URL`), it's called out as a coordination note in §9, not silently assumed to already exist.

---

## 4. Architecture Decisions

### 4.1 Landing page composition

`HomePage.tsx` replaces SP01's placeholder entirely. It renders five components in order; the four anchored ones keep SP01's exact `id`/`scroll-mt-24` contract, and each owns its own `<section>` wrapper (not a shared wrapper in `HomePage.tsx`) — this matches SP01's own placeholder structure and keeps each section's background/padding self-contained:

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

`Hero` carries no `id`/`scroll-mt-24` — it isn't a `Nav` target (nav = Projects, Work Experience, About, Contact only, brief §2), so it needs neither. The other four each render `<section id="…" className="scroll-mt-24 …">` directly, matching SP01's placeholder convention exactly (§4.7 of SP01's PRD: "each with `scroll-mt-24` so `ScrollManager`'s `scrollIntoView` lands below the floating nav pill, not under it").

**Background rhythm:** alternating `bg-cream`/`bg-sage` bands (Hero cream → Projects sage → Work Experience cream → About sage → Contact cream), matching techfolio's own alternation (`app/page.tsx`: `#home` and `#about`/`#contact` are cream, `#projects` is sage). This is a cosmetic judgment call, not a locked decision — see §9.

### 4.2 Hero

**`src/config/links.ts` — SP01-owned and created there (binding, §9), consumed here for `RESUME_URL`.** SP01 lands first (Phase 1) and its `Nav`/`Footer` cannot render without this file existing, so SP01 owns and creates it (`NAV_LINKS`, `FOOTER_LINKS`, `RESUME_URL` — see SP01 PRD §4.6 for the full file contents); this sub-project consumes `RESUME_URL` for Hero's résumé CTA below, and SP02's build-time validator checks every internal href in it against `KNOWN_STATIC_ROUTES` (SP02 §4.5.4/§9). Nothing in this sub-project creates or extends `src/config/links.ts`.

```tsx
// src/sections/Hero.tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { GitHubIcon } from '@/components/icons/GitHubIcon';
import { LinkedInIcon } from '@/components/icons/LinkedInIcon';
import { HeroPortrait } from './HeroPortrait';
import { GITHUB_URL, LINKEDIN_URL } from '@/config/contact'; // SP05-owned, see §4.8
import { RESUME_URL } from '@/config/links'; // SP01-owned, see §9
import { trackEvent } from '@/lib/analytics'; // SP05-owned, see §4.9

export function Hero() {
  return (
    <section className="relative bg-cream px-6 pb-14 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12 lg:pt-36">
      <div className="mx-auto grid w-full max-w-content grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.55fr)] lg:gap-8">
        <div className="mx-auto w-full max-w-[440px] text-left lg:mx-0">
          <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-teal-secondary sm:text-[0.74rem]">
            Health Tech Builder {/* SP07 §4.5.1 — drafted, ≤4 words */}
          </p>

          <h1 className="max-w-[10ch] text-[2.1rem] font-extrabold leading-[0.95] tracking-tight text-ink sm:text-[2.6rem] lg:text-[3rem]">
            Hi, I&rsquo;m Tejit. {/* SP07 §4.5.1 — drafted, ≤6 words */}
          </h1>

          <p className="mt-5 max-w-[32rem] text-[0.94rem] leading-7 text-body">
            I&rsquo;m building Juno, an AI companion that helps patients get more out of
            every medical appointment &mdash; while working full-time as a Software
            Engineer II on Microsoft&rsquo;s Fabric Maps team. Health tech is where most
            of my energy outside of work goes, and where I&rsquo;m headed next.
            {/* SP07 §4.5.1 — drafted, 35–55 words, two sentences */}
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

            {/* Deliberately NOT <Button href="#contact">. Button (SP01) renders a
                plain <a> — a plain same-pathname hash link would jump instantly via
                native browser behavior, bypassing ScrollManager's smooth scroll
                entirely, which would make this CTA feel inconsistent with every Nav
                click doing the same "jump to #contact" action smoothly. Using
                react-router's <Link> instead makes this a real navigation, which
                ScrollManager listens for — exactly the mechanism Nav itself uses
                (SP01 §4.6/§4.8). Composed with Button's own outline classes per
                SP01's documented guidance for router-aware button-styled links. */}
            <Link
              to="/#contact"
              // No trackEvent here (§4.9, §9) — SP05's AnalyticsEventName has no
              // event for an in-page anchor CTA; navigation itself is unaffected.
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

**Hero copy is SP07's, already drafted** (`07-content-migration-copy/PRD.md` §4.5.1) — quoted above verbatim, not invented here. SP07's own §8 flags it as a first draft pending the owner's edit pass, unchanged by this PRD.

**What the hero image actually is, and how it's swapped** — the owner has supplied no photo or illustration, and the brief only says the image must be "noticeably smaller than the current site's, no large hero visual" (brief §2/§3), not what it should show. Rather than leave an `<img>` with a broken/empty `src`, or silently invent a personal photo/illustration that doesn't exist:

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

`Hero.tsx` calls `<HeroPortrait />` with no `src` — the monogram placeholder is what ships at launch. Sizing is capped at `230px` at the largest breakpoint (versus techfolio's `620px` avatar), which is the concrete, checkable form of "noticeably smaller" the brief calls for. When the owner supplies a real photo or a commissioned illustration, the swap is `public/hero-portrait.jpg` + `<HeroPortrait src="/hero-portrait.jpg" />` — a one-line change to `Hero.tsx`, no new component, no layout change (the placeholder and the real image share the exact same size classes). This is a genuinely new UI element, not ported from techfolio (which always has a real avatar) or from the current site (which has no hero image at all) — flagged as a design addition in §9, not attributed to either reference.

**Responsive collapse:** `grid-cols-1` below `lg` (1024px) — text column full-width, portrait centered below it (portrait is the second grid item, so it renders after the text on mobile, matching techfolio's own document order and matching "the pitch is the point, restraint over graphic" — a visitor scrolls past the copy before reaching the (currently placeholder) image). At `lg` and above, `grid-cols-[minmax(0,1fr)_minmax(0,0.55fr)]` — asymmetric, giving the text column more room than techfolio's near-even split (`0.95fr`/`1.05fr`), since this hero's image is intentionally the less important element.

### 4.3 `ProjectCard` — collection-agnostic, the SP04 seam

**This is the component SP04 imports directly and does not fork.** Every field that would otherwise be collection-specific is computed by the caller and passed in as a plain value:

```tsx
// src/components/ProjectCard.tsx
import { Link } from 'react-router-dom';
import { TagPill } from './TagPill';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';

export interface ProjectCardProps {
  /** Internal detail route, e.g. `/projects/${slug}` or `/research/${slug}`.
   *  This component has no notion of "collection" — the caller computes the
   *  full path. */
  href: string;
  image: string;
  imageAlt?: string;
  title: string;
  description: string;
  tags: string[];
  /** Optional; SP02's content model treats status as genuinely optional with
   *  no default. Absent → render nothing, no reserved space (see below). */
  status?: string;
  /**
   * Optional "shortcut" link, rendered as a small icon button on the image,
   * top-right, opening in a new tab. Deliberately NOT named `liveUrl` — that
   * field only exists on Projects (SP02 §4.4.2), not Research (SP02 §4.4.3
   * drops it on purpose, since no `/research/<slug>/live` route consumes it).
   * Naming this prop after a Projects-only field would leak collection
   * knowledge into a component SP04 is meant to reuse unchanged.
   *
   * Recommended caller behavior (not enforced here):
   *  - Projects: pass `project.liveUrl` (may be undefined — most projects
   *    have no live-tool destination, and the icon simply doesn't render).
   *  - Research: recommend omitting this entirely. Research's `links[]`
   *    entries are citations (a paper, a project report), not a "go try it
   *    now" destination — reusing the same icon for a citation link would
   *    promise something the click doesn't deliver. This is SP04's call to
   *    make, not enforced by this component; see §9.
   */
  externalHref?: string;
  externalLabel?: string;
  /** Analytics hook — SP03/SP04 wire this to `trackEvent` with whatever
   *  params make sense for their own collection/context; ProjectCard itself
   *  never imports `trackEvent` directly, so it stays decoupled from SP05's
   *  module and doesn't hardcode assumptions about what gets tracked. */
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
              // Not strictly required for correctness (this anchor is a
              // sibling of the stretched link below, not a descendant — see
              // the stacking-order note), but kept as a defensive guard
              // against any future parent-level delegated click handler.
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

**How the whole card is clickable *and* the external-link icon is independently clickable** (the same problem `juno-landing-page`'s own `ProjectCard` solves, reused here rather than re-derived): the primary link wraps only the title text and carries `after:absolute after:inset-0`, stretching its own `::after` pseudo-element to fill the nearest positioned ancestor — the `<article>` itself (`className="group relative …"`), since the `<Link>` has no explicit `position` set. That makes the *entire card* clickable to `href` even though the actual `<a>` element only visually wraps the title. The external-link `<a>` lives as a plain sibling inside the image wrapper, given `z-10` explicitly — Tailwind's `after:` pseudo-element carries no explicit `z-index` (stays `auto`), and a positioned element with an explicit `z-index` always stacks above a sibling with `z-index: auto` regardless of DOM order, so the external icon is reliably clickable on top of the stretched overlay with no `stopPropagation` even required for the click to register on the correct element (kept anyway, as noted above, as cheap insurance).

**One correction versus the pattern this is copied from:** Tailwind CSS never renders a `::before`/`::after` pseudo-element unless its `content` property is explicitly set — `after:absolute after:inset-0` alone, with no `content-['']`, produces no visible or clickable pseudo-element at all (`content` defaults to `none`). `juno-landing-page`'s own PRD (`02-landing-page/PRD.md` §4.3) shows this exact stretched-link snippet *without* `after:content-['']` — either its real, shipped codebase includes the utility and the PRD prose simply omitted it, or the reference has a latent bug. Either way, this PRD includes `after:content-['']` explicitly above so the technique is verified-correct here rather than silently copied from prose that may be incomplete.

**No reserved space when `status` is absent.** The status pill is an `absolute`-positioned overlay on top of the image, not a layout element in normal flow — removing it doesn't shift or compress anything else in the card (the image height, title position, and description position are all identical whether or not the pill renders). This is the direct, checkable answer to "what does the card look like with no pill": pixel-for-pixel identical to a card with one, minus the pill itself. Confirmed by construction, not by a conditional layout branch that could get this wrong.

**`status` gets one uniform pill treatment regardless of which of the three values it is** (`Building` / `Not Started` / `Completed`) — a solid `bg-teal/92` fill with the status text, no per-value color-coding. This is a deliberate simplification versus `juno-landing-page`'s own five-color status-dot system (`02-landing-page/PRD.md` §4.3): that system was designed around Juno's own five-value status vocabulary and a small colored dot, neither of which applies here — SP02's three-value vocabulary (brief §2/§3) doesn't call for or benefit from color-differentiation, and techfolio itself has no status precedent at all to extend. The pill's text is what communicates which status it is; color stays uniform.

**Radius token note:** the image wrapper uses `rounded-xl2` (SP01's `1rem` token, documented for "inner media frames") rather than techfolio's literal `0.9rem` arbitrary value — a 0.1rem/1.6px difference, invisible at the sizes involved, in exchange for reusing an existing named token instead of introducing a new one-off arbitrary value for a single component. Everything else (`rounded-card`, `shadow-card`/`shadow-card-hover`, `border-teal-secondary/12`→`/22` on hover) is SP01's token set used exactly as documented.

### 4.4 Featured Projects section

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
            {/* Real copy, drafted by this PRD — §4.10, §9. Owner may edit like any other copy (§8). */}
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
            // No trackEvent here (§4.9, §9) — "see all" is not one of SP05's
            // five tracked events; the navigation itself is unaffected.
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

Grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-4`, matching techfolio exactly. `featuredProjects` is capped at 6 (SP02 §4.6), so the grid can wrap into a partial last row (e.g., 4+2 at `xl`) — this is standard grid wrap behavior, not a special case to design around. The headline is real, drafted copy, not placeholder text — SP07's existing drafting plan (§07 PRD §4.5) doesn't cover this slot (it's a page-design headline, not migrated content), so this PRD drafts it directly rather than routing three short strings through a separate content-authoring handoff. See §4.10 and §9.

### 4.5 Work-experience timeline

**The CSS technique, mapped onto this project's palette** — confirmed directly against `_reference-gbose/css/sidebar.css` lines 1251–1298 (`.work-list`, `.work-card`, `.work-card::before`, `.work-card:first-child::before`, `.work-card:hover`, `.work-header`):

| gbose token | This project's value |
|---|---|
| `--border` | `border-teal-secondary/15` (`rgba(15,76,69,0.15)`) |
| `--border-accent` (hover) | `border-teal-secondary/28` |
| `--accent` | `#0F4C45` (`teal-secondary`) — dot fill for the "current" entry and on hover |
| `--text` / `--text-muted` | `text-ink` / `text-slate` |
| `--bg` (the dot's matting ring color) | `#F7F1E8` (`cream`) |

**One deliberate implementation departure from gbose's literal markup:** gbose's cards are plain `<div>`s in a flex column, not an `<ol>`/`<li>` list. This PRD follows the same shape — a `role="list"` wrapping `<div>`, with each entry and the "see all" stub as `role="listitem"` `<div>`s — rather than a semantic `<ol>`/`<li>`, specifically so the brief's literal "a final stub `div`" (brief §2/§3, Work-experience timeline) can be exactly that: a plain `<div>` sibling, not forced into `<li>` to satisfy `<ol>`'s child-element restriction. `role="list"`/`role="listitem"` attributes preserve the list semantics for assistive technology that a bare `<div>` structure would otherwise lose.

```tsx
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
import { markdownComponents } from '@/data/markdownComponents'; // SP02-owned, reused as-is
import { ExternalLinkIcon } from '../icons/ExternalLinkIcon';
import { formatWorkDate } from './formatWorkDate';
import type { WorkExperience } from '@/data';
import { trackEvent } from '@/lib/analytics';

interface TimelineEntryProps {
  entry: WorkExperience;
  /** True for index 0 of the full, startDate-descending-sorted array — see
   *  the note below on why index-based "current" is safe here. */
  isCurrent: boolean;
  /** True only for the entry immediately preceding the end of the spine with
   *  no stub following it (i.e., the real final entry on `/work-experience`,
   *  or the last landing entry when there's nothing more to see). False when
   *  a `TimelineSeeAllStub` follows, so the spine doesn't visually shrink
   *  right before it continues. */
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

      {/* Deliberately NOT SP02's <ContentBody> (@/data/ContentBody.tsx) — that
          component wraps output in the `prose` typography plugin, sized for a
          full project/research write-up. The brief is explicit this blurb
          renders "at Brittne's type scale" (a tight 2–3 line rhythm), which is
          smaller and denser than `prose`'s default sizing — rendering
          react-markdown directly with hand-picked classes gets the exact
          scale without fighting `prose`'s defaults. See §9. */}
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
import { trackEvent } from '@/lib/analytics';

export function TimelineSeeAllStub() {
  return (
    // Same border-left width/color and left padding as TimelineEntry, no
    // ::before at all — this is what makes the spine read as continuing past
    // the last real entry rather than terminating and restarting a
    // disconnected button underneath it (brief §2/§3).
    <div role="listitem" className="border-l-2 border-teal-secondary/15 py-4 pl-[22px]">
      <Link
        to="/work-experience"
        // No trackEvent here (§4.9, §9) — "see all" is not one of SP05's five
        // tracked events; the navigation itself is unaffected.
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
   *  slice — SP02's `workExperience` export is pre-sorted `startDate`
   *  descending, so index 0 is always the true most-recent role whether the
   *  caller passes the full array or a `.slice(0, N)` of it. */
  entries: WorkExperience[];
  /** When true, renders a TimelineSeeAllStub after the last passed-in entry,
   *  and that entry gets standard (non-reduced) bottom padding so the spine
   *  continues into the stub without a visual gap. Omit/false for the full
   *  `/work-experience` page. */
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

**Landing variant:**

```tsx
// src/sections/WorkExperienceSection.tsx
import { workExperience } from '@/data';
import { Timeline } from '@/components/timeline/Timeline';

// Brief §2/§3 says "top 2–3 entries" without pinning an exact number. Kept at
// 2 — the binding architect decision (§9, owner decision propagated from
// SP07 §4.3's role drop) is that the "See all" stub is NOT tied to this exact
// number at all: it renders only when `workExperience.length >
// LANDING_TIMELINE_LIMIT` (see `hasMore` below), so the limit itself is just
// "how many entries the landing page shows," not a hand-tuned value chosen to
// make the stub meaningful. At today's launch content — 2 real work-experience
// roles, after the owner dropped the Programming for Entrepreneurs and Social
// Good TA-ship (SP07 §4.3/§9) — `workExperience.length` is 2, so `hasMore` is
// false: the landing page shows both roles and the stub does not render; the
// spine simply ends after the last entry. If a third role is ever added,
// `hasMore` becomes true automatically with no code change here. See §9.
const LANDING_TIMELINE_LIMIT = 2;

export function WorkExperienceSection() {
  const entries = workExperience.slice(0, LANDING_TIMELINE_LIMIT);
  const hasMore = workExperience.length > LANDING_TIMELINE_LIMIT;

  return (
    <section id="work-experience" className="scroll-mt-24 bg-cream px-6 py-16 sm:px-8 sm:py-20 md:px-10 lg:px-12 lg:py-24">
      <div className="mx-auto w-full max-w-[720px]">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-teal-secondary">Work Experience</p>
        <h2 className="mt-4 max-w-[14ch] text-[2rem] font-extrabold leading-[0.96] tracking-tight text-ink sm:text-[2.4rem]">
          {/* Real copy, drafted by this PRD — §4.10, §9. Owner may edit like any other copy (§8). */}
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

**Why the "See all" stub only renders when `entries.length > limit`** (not unconditionally, the way a literal reading of the brief's "then the spine continues... into a See all button" might suggest): with only two roles today, `/work-experience` would show the identical two entries already visible on the landing page — a functioning-but-pointless click if the stub rendered unconditionally. Gating on `hasMore = workExperience.length > LANDING_TIMELINE_LIMIT` is the resolved, binding rule (§9): the stub renders only when there are genuinely more roles than the landing page shows. Today that's false (2 total, limit 2) — the landing page shows both roles and the spine simply ends, no stub. This isn't a workaround for today's role count; it's the general condition the design was always meant to satisfy, now made explicit rather than left as an ambient assumption tied to a specific number of roles.

**"Current" dot logic, stated precisely:** `isCurrent = index === 0` against an array SP02 guarantees is sorted `startDate` descending. Since the landing variant always slices from the *start* of that same sorted array (`.slice(0, N)`), index 0 in the slice is identical to index 0 in the full array — "current" is correct on both the landing page and `/work-experience` by construction, with no separate "is this actually the most recent" check needed. The one theoretical edge case (a future *past* role added with a `startDate` more recent than the current `Present` role's `startDate`, which would flip the accent dot to the wrong entry) is a data-shape situation the brief's own non-goals rule out (no overlapping/multi-role complexity is designed for) — flagged as `[DEFERRED]` in §9, not solved speculatively.

### 4.6 `/work-experience` page

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
        {/* Real copy, drafted by this PRD — §4.10, §9. Owner may edit like any other copy (§8). */}
        The full timeline.
      </h1>
      <div className="mt-10">
        <Timeline entries={workExperience} />
      </div>
    </div>
  );
}
```

No `showSeeAll` (defaults `false`) — this page renders every entry, so the spine simply ends after the real last entry with its reduced `pb-1` bottom padding (gbose's `.work-card:last-child { padding-bottom: 4px; }`, reused as `TimelineEntry`'s `isLast` branch). `PageShell` (SP01) already wraps this route via the router; this component only owns its own content, not the shell.

**Accepted, deliberate duplication at today's 2-role launch content.** With only two work-experience roles total (SP07 §4.3/§9, after the owner dropped the Programming for Entrepreneurs and Social Good role), this page currently renders the identical two entries already visible in the landing page's Work Experience section (§4.5) — and, per §4.5's resolved `hasMore` gating, the landing page doesn't even link here today (no "See all" stub renders). This is accepted, not a defect: the route stays because it's in the brief's own route table (brief §3) and scales for free the moment a third role is added — at that point the landing page shows a subset, the "See all" stub reappears, and this page stops being a duplicate. The route is not deleted on account of today's temporary duplication.

### 4.7 About section

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
          {/* SP07 §4.5.2 — drafted, 3–4 short paragraphs, ~120–180 words total */}
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

**Explicitly not the card format.** No `rounded-panel`/`border`/`shadow-panel` wrapper, no bounded box distinguishing this section's content from its background — the prose sits directly on the section's own tinted background (`bg-sage`), exactly satisfying the brief's requirement that About "should read like a person talking, not another card grid" (brief §2/§3). This is a deliberate divergence from techfolio itself, whose own About section *is* a bordered `bg-[#DDE7DE]` card (`app/page.tsx:371`) — the brief explicitly rejects that specific piece of the reference for this one section, so it isn't ported here even though every other section borrows techfolio's card treatment where applicable.

**No separate eyebrow + headline pairing** (unlike Hero/Projects/Work Experience/Contact, which all use an eyebrow label + `h2` headline). SP07's already-drafted About copy (§07 PRD §4.5.2) is four paragraphs with no separate headline sentence — adding an invented headline this PRD would have to write itself contradicts the "you consume SP07's copy, don't write marketing copy" instruction, so the section header is just a plain `h2` reading "About," matching `juno-landing-page`'s own `AboutSection` precedent (`<h2>About</h2>` + paragraphs, no eyebrow/tagline pair).

### 4.8 Contact section

```tsx
// src/sections/ContactSection.tsx
import { Button } from '@/components/Button';
import { GitHubIcon } from '@/components/icons/GitHubIcon';
import { LinkedInIcon } from '@/components/icons/LinkedInIcon';
import { EmailIcon } from '@/components/icons/EmailIcon';
import { CONTACT_EMAIL_DISPLAY, LINKEDIN_URL, GITHUB_URL } from '@/config/contact'; // SP05-owned
import { useContactMailto } from '@/hooks/useContactMailto'; // SP05-owned
import { trackEvent } from '@/lib/analytics';

// No location constant — resolved (§9): the Contact aside ships with no
// location line at all, owner decision. Email + circular GitHub/LinkedIn
// icon buttons is the complete aside; omitting the row means no placeholder
// can ever leak to production and no stale personal-location claim can go
// stale.

export function ContactSection() {
  const emailHref = useContactMailto();

  return (
    <section id="contact" className="scroll-mt-24 bg-cream px-6 py-16 sm:px-8 sm:py-20 md:px-10 lg:px-12 lg:py-24">
      <div className="mx-auto grid w-full max-w-content grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(260px,0.6fr)] lg:gap-14">
        <div className="max-w-[540px]">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-teal-secondary">Contact</p>
          <h2 className="mt-3.5 max-w-[12ch] text-[1.75rem] font-extrabold leading-[0.97] tracking-tight text-ink sm:text-[2.15rem]">
            Get in Touch {/* SP07 §4.5.6 — drafted */}
          </h2>
          <p className="mt-4 max-w-[28rem] text-[0.9rem] leading-6.5 text-body">
            Whether you&rsquo;re hiring, working on something in health tech, or want to
            talk through Juno with a clinician&rsquo;s or researcher&rsquo;s eye &mdash;
            I&rsquo;d like to hear from you. {/* SP07 §4.5.6 — drafted */}
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {emailHref ? (
              // No trackEvent here (§4.9, §9) — a mailto click isn't one of
              // SP05's five tracked events; the link itself is unaffected.
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
                    <a
                      href={emailHref}
                      // No trackEvent here (§4.9, §9) — same reasoning as the
                      // primary "Email Me" button above.
                      className="mt-1.5 inline-block text-[0.9rem] font-semibold text-ink transition hover:text-teal-secondary"
                    >
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

**Why `useContactMailto` cannot leak a plain address into prerendered HTML, and why the later update doesn't cause a hydration mismatch** — read directly from `juno-landing-page/src/hooks/useContactMailto.ts` and reproduced for SP05 to port verbatim:

```ts
// src/hooks/useContactMailto.ts (SP05-owned; reproduced here for reference, not built by this sub-project)
export function useContactMailto(): string | null {
  const [href, setHref] = useState<string | null>(null);
  useEffect(() => {
    setHref(`mailto:${getContactEmailAddress()}`);
  }, []);
  return href;
}
```

The reasoning, stated precisely for this sub-project's components:

1. `vite-react-ssg`'s build-time prerender pass executes each component's render phase but never runs effects (this is the same property `juno-landing-page`'s own PRD cites for its consent-banner fix) — so during that pass, `useContactMailto()` always returns `null`. Every conditional branch in `ContactSection` above that checks `emailHref` therefore renders its `null` branch (the `<span className="select-all">…{CONTACT_EMAIL_DISPLAY}</span>` / plain `<p>` text) in the file that ships as static HTML. `CONTACT_EMAIL_DISPLAY` is the obfuscated string (`'tejitpabari99 _at_ gmail [dot] com'`, per SP05's `contact.ts`) — never a real `mailto:` href, never a bare `user@domain` string, anywhere in what a crawler or scraper reads.
2. **No hydration mismatch, because the first client render matches the server render exactly.** React hydration compares the DOM produced by the *first* client-side render pass (before any effect has run) against the server/prerendered markup. On mount, `useContactMailto`'s `useState(null)` initializes to `null` — identical to the build-time value — so the very first client render produces the identical `null`-branch markup hydration expects. Only *after* hydration completes does the `useEffect` fire and call `setHref(...)`, which triggers an ordinary post-hydration re-render swapping in the real `mailto:` `<a>`/link. This is a normal client-side state update, not a hydration diff — React never compares against this later state.
3. **Graceful degradation, the actual point of the pattern:** a visitor with JavaScript disabled (or in the brief instant before the effect fires) sees the exact same obfuscated text, `select-all` so it can be copied and retyped by hand — nothing is hidden, broken, or non-functional, just not machine-parseable as a scrapable pattern without a manual step.

This sub-project consumes `useContactMailto` and `contact.ts` exactly as SP05 is expected to port them (brief §2/§3, citing `juno-landing-page/src/config/contact.ts` and `src/hooks/useContactMailto.ts` directly) — it does not reimplement or modify either.

**`GITHUB_URL` is SP05-owned, imported from `contact.ts` alongside `LINKEDIN_URL` (binding, §9) — no `src/config/social.ts` is created.** Brief §2/§3's "Contact facts" already groups the email, LinkedIn, and GitHub together as one ported concern from `juno-landing-page/src/config/contact.ts`, including the "not obfuscated, and here is why" reasoning for LinkedIn/GitHub living in that same file's comments — a separate `social.ts` would orphan that reasoning. GitHub needs none of the email-obfuscation machinery `contact.ts` otherwise exists for, but that's not reason enough to split it into a third file when `contact.ts`'s scope is "identity constants," not narrowly "obfuscated identity constants." `LINKEDIN_URL` and `GITHUB_URL` are both imported from SP05's `contact.ts`, unchanged.

**Responsive collapse:** `grid-cols-1` below `lg` — the "Connect" aside renders below the left column's heading/paragraph/button on mobile, identical stacking order to techfolio's own contact section.

### 4.9 Analytics call sites for SP05's `trackEvent`

**Confirmed signature (§9), against SP05's actual, now-shipped §4.3/§4.4**: `trackEvent(name: AnalyticsEventName, params?: Record<string, string | number | boolean>): void`, imported from `@/lib/analytics`, where `AnalyticsEventName` is a fixed five-value union: `'outbound_click' | 'project_card_click' | 'resume_click' | 'search_query' | 'section_view'` (SP05 §4.3). This PRD's original call sites assumed a looser, unconfirmed signature and used five event names outside that union (`outbound_link_click`, `cta_click`, `see_all_projects_click`, `see_all_work_experience_click`, `email_click`) — none of which exist in SP05's shipped `AnalyticsEventName` type, so as originally written these calls would fail `tsc --noEmit`. **Fixed below, call site by call site, to match SP05 exactly — SP05 itself is not changed.** Two categories of fix: (1) `outbound_link_click` renamed to `outbound_click` everywhere it's used (Hero social icons, the Featured Projects card's external-link shortcut) — the interaction itself is unchanged, only the event name; (2) the four events with no SP05 equivalent (`cta_click` on the Hero's "Contact Me" link, `see_all_projects_click`, `see_all_work_experience_click`, and `email_click` on both Contact-section email affordances) are **not tracked** — none of the four is part of the brief's own six tracked-event categories (brief §2/§3: pageviews, outbound clicks, project-card clicks, résumé clicks, search queries, scroll depth), so dropping them loses no brief-mandated signal; the `<Link>`/`<a>` elements themselves are unchanged, only the now-absent `onClick` tracking call.

Every call site this sub-project introduces:

| Event | Component | Params | Trigger |
|---|---|---|---|
| `project_card_click` | `ProjectCard` (via `FeaturedProjectsSection`'s `onCardClick`) | `{ slug, collection: 'projects', title: project.title }` | Click on the card's title/stretched link |
| `outbound_click` | `ProjectCard` (via `onExternalClick`) | `{ url, context: 'content_external_link', label: \`Open ${project.title} live\` }` | Click on the card's external-link shortcut icon |
| `outbound_click` | `Hero` (GitHub/LinkedIn icon row) | `{ url, context: 'hero_social', label: 'GitHub' \| 'LinkedIn' }` | Click on either social icon |
| `outbound_click` | `ContactSection` (Profiles row) | `{ url, context: 'contact_social', label: 'GitHub' \| 'LinkedIn' }` | Click on GitHub/LinkedIn icon buttons in the Connect aside |
| `outbound_click` | `TimelineEntry` (role links) | `{ url, context: 'content_external_link', label: link.label }` | Click on any work-experience role's link |
| `resume_click` | `Hero` (Download Resume button) | `{ source: 'hero', url: RESUME_URL }` | Click on the résumé CTA |
| — (not tracked) | `Hero` (Contact Me button) | — | The in-page anchor CTA is not an outbound/card/résumé/search/scroll event in SP05's catalogue; the `<Link to="/#contact">` navigation itself is unaffected, only the removed `onClick` tracking call. |
| — (not tracked) | `ContactSection` (both the primary button and the aside's email link) | — | Same reasoning — a `mailto:` click isn't one of the brief's six tracked-event categories; SP05's catalogue has no event for it. |
| — (not tracked) | `FeaturedProjectsSection` ("See all projects" link) | — | Same reasoning. |
| — (not tracked) | `TimelineSeeAllStub` ("See all experience" link) | — | Same reasoning. |
| `section_view` | `HomePage` via `useSectionScrollDepth` | `{ section: 'projects' \| 'work-experience' \| 'about' \| 'contact' }` | First time each section crosses 50% viewport visibility, once per section per page load — this is the "landing-page section scroll depth" signal brief §3 asks for |

```ts
// src/hooks/useSectionScrollDepth.ts
import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

/**
 * Fires trackEvent('section_view', { section }) the first time each given
 * section id crosses 50% viewport visibility, once per section per page
 * load. `hero` is intentionally excluded from the caller's id list — reaching
 * it is equivalent to "the page loaded," already covered by a pageview event
 * SP05 owns elsewhere; this hook is specifically for scroll depth *past* the
 * fold.
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

### 4.10 Content slots and length budgets for SP07

**Already drafted by SP07** (`07-content-migration-copy/PRD.md` §4.5, quoted directly in §4.2/§4.7/§4.8 above — not re-specified here beyond citing the length budget SP07 already committed to):

| Slot | Component | Budget (per SP07 §4.5) |
|---|---|---|
| Hero eyebrow | `Hero.tsx` | ≤4 words |
| Hero greeting (`h1`) | `Hero.tsx` | ≤6 words |
| Hero paragraph | `Hero.tsx` | 35–55 words, two sentences |
| About paragraphs | `AboutSection.tsx` | 3–4 paragraphs, ~120–180 words total, no separate headline |
| Contact heading | `ContactSection.tsx` | short (SP07 drafted "Get in Touch") |
| Contact paragraph | `ContactSection.tsx` | one paragraph (SP07 drafted ~28 words) |
| Work-experience blurbs | `TimelineEntry.tsx` (via markdown `body`) | 2–3 lines of prose per SP02 §4.4.4/brief §2/§3; SP07 has already drafted both in full (§07 PRD §4.5.5) |

**Three additional slots this PRD drafts and ships directly, resolved (§9), not routed through SP07** (SP07's brief-derived field list is Hero/About/Contact/project-descriptions/research-abstracts/work-experience-blurbs only — it has no entry for a landing-section headline, since the brief's own §3 design-language text never mandates one for Projects/Work Experience the way it does for Hero/Contact). Three short section headings aren't a content-drafting project — they're part of the page design, which is this PRD's own scope, and routing them through SP07 for three short strings would add a handoff for no gain:

| Slot | Component | Budget | Drafted copy |
|---|---|---|---|
| Featured Projects section headline (`h2`) | `FeaturedProjectsSection.tsx` | ≤12 words, health-tech-aware framing (this section shows featured *projects*, not exclusively health-tech ones) | "Selected work, in health tech and beyond." |
| Work Experience section headline (`h2`) | `WorkExperienceSection.tsx` | ≤10 words | "Where I've worked and what I've built." |
| `/work-experience` page headline (`h1`) | `WorkExperiencePage.tsx` | ≤8 words | "The full timeline." |

This is real, shipped copy, on-tone with the rest of the page and consistent with the brief's health-tech repositioning — not placeholder text and not a bracketed TODO. Like every other piece of drafted copy in this initiative, the owner may edit any of the three (§8).

---

## 5. API Change Summary

N/A. This sub-project builds React components consuming already-validated, build-time-loaded static data (`@/config/featured`, `@/data`) and SP05's client-only obfuscation hook — there is no backend, database, or network request anywhere in it, matching the initiative's locked non-goal (brief §4).

---

## 6. Frontend Change Summary

| Type | Name | Path | Notes |
|---|---|---|---|
| Modified | `HomePage` | `src/pages/HomePage.tsx` | Replaces SP01's placeholder. Composes Hero → Featured Projects → Work Experience → About → Contact; wires `useSectionScrollDepth`. |
| Modified | `WorkExperiencePage` | `src/pages/WorkExperiencePage.tsx` | Replaces SP01's placeholder. `BackButton` + heading + full `Timeline`. |
| New | `Hero` | `src/sections/Hero.tsx` | Eyebrow/greeting/paragraph, résumé + contact CTAs, social row. Consumes `RESUME_URL`, `GITHUB_URL`, `LINKEDIN_URL`. |
| New | `HeroPortrait` | `src/sections/HeroPortrait.tsx` | Swappable placeholder-or-real-image slot, `src?` prop. |
| New | `FeaturedProjectsSection` | `src/sections/FeaturedProjectsSection.tsx` | Renders `featuredProjects` via `ProjectCard`; "See all projects" link. |
| New (shared, SP04 seam) | `ProjectCard` | `src/components/ProjectCard.tsx` | Collection-agnostic; consumed by both this sub-project and SP04. See §4.3. |
| New | `WorkExperienceSection` | `src/sections/WorkExperienceSection.tsx` | Landing timeline variant, `LANDING_TIMELINE_LIMIT = 2`. |
| New | `Timeline` | `src/components/timeline/Timeline.tsx` | Shared by landing and full-page variants. |
| New | `TimelineEntry` | `src/components/timeline/TimelineEntry.tsx` | Single role card: border-left spine segment + dot. |
| New | `TimelineSeeAllStub` | `src/components/timeline/TimelineSeeAllStub.tsx` | Continuation stub, no dot. |
| New | `formatWorkDate` | `src/components/timeline/formatWorkDate.ts` | ISO date → "Mon YYYY". |
| New | `AboutSection` | `src/sections/AboutSection.tsx` | Plain prose, no card wrapper. |
| New | `ContactSection` | `src/sections/ContactSection.tsx` | Two-column; consumes SP05's `useContactMailto`/`contact.ts`. |
| New | `useSectionScrollDepth` | `src/hooks/useSectionScrollDepth.ts` | IntersectionObserver-based scroll-depth analytics hook. |
| Consumed, not modified | `featuredProjects` | `@/config/featured` (SP02) | |
| Consumed, not modified | `workExperience`, `WorkExperience` type | `@/data` (SP02) | |
| Consumed, not modified | `markdownComponents` | `@/data/markdownComponents` (SP02) | Reused for work-experience blurb rendering. |
| Consumed, not modified | `Nav`, `Footer`, `PageShell`, `Button`, `TagPill`, `BackButton`, icon set | SP01 | |
| Consumed, not modified | `RESUME_URL`, `NAV_LINKS`, `FOOTER_LINKS` | `@/config/links` (SP01, binding — no longer created by this sub-project, see §9) | |
| Consumed, not modified | `CONTACT_EMAIL_DISPLAY`, `LINKEDIN_URL`, `GITHUB_URL`, `GITHUB_USERNAME`, `useContactMailto` | `@/config/contact` (SP05, binding — no `src/config/social.ts` is created, see §9) | |
| Consumed, not modified | `trackEvent`, `AnalyticsEventName` | `@/lib/analytics` (SP05, confirmed contract, see §9) | |

---

## 7. Testing

Sized the same way SP01/SP02 sized their own testing scope — targeted, not exhaustive, given this is a personal-portfolio landing page, not a production app:

- **`ProjectCard`** (`src/components/ProjectCard.test.tsx`): renders the title link with the given `href`; renders the status pill only when `status` is provided, and confirms no extra DOM node/spacing exists when it's absent (the "no reserved space" claim in §4.3, worth pinning directly since it's easy to accidentally implement as a conditionally-empty placeholder div instead of true absence); renders the external-link icon only when `externalHref` is provided; clicking the external-link icon calls `onExternalClick` and does not also trigger `onCardClick` (confirms the sibling-not-nested stacking claim in §4.3 actually holds, not just in theory).
- **`Timeline`/`TimelineEntry`/`TimelineSeeAllStub`**: `isCurrent` is `true` only for index 0, given a fixture array; `TimelineSeeAllStub` renders only when `showSeeAll` is `true` and `entries.length > 0`; the entry immediately before the stub gets the non-reduced `pb-6` class, not `pb-1` (the exact "spine continues into the stub without a gap" claim in §4.5); `WorkExperienceSection`'s `hasMore` computation is correct at exactly `LANDING_TIMELINE_LIMIT`, one below it, and one above it (boundary cases for the "See all" gating logic in §4.5).
- **`formatWorkDate`**: a handful of fixed input/output pairs (`'2021-06-01'` → `'Jun 2021'`), plus a confirmation that `'Present'` is never passed into it (that branch is handled by the caller, not this function).
- **`useContactMailto` integration in `ContactSection`** (via React Testing Library + `act`): initial render shows `CONTACT_EMAIL_DISPLAY` as plain text with no `href`; after effects flush, the same text becomes a real `mailto:` link — confirms the pre-mount/post-mount branch actually swaps, not just that one branch renders correctly in isolation.
- **`useSectionScrollDepth`**: mock `IntersectionObserver`, confirm `trackEvent('section_view', …)` fires exactly once per section even if the observer callback fires multiple times for the same element (the `fired` ref's de-dupe logic).
- **`HomePage` smoke test**: renders without throwing, all five sections/component in the expected order, all four anchored sections carry their expected `id`.

**Manual QA checklist** (extends SP01's own, run once post-deploy):

1. Resize the viewport from 1440px down to 360px — Hero collapses to single-column with the portrait below the text, Contact collapses with the Connect aside below the left column, at no point does any element overflow horizontally.
2. Click each Nav item from a scrolled-down position on `/` — smooth-scrolls to the correct section; click "Contact Me" in the Hero — same smooth-scroll behavior as a Nav click (confirms the `<Link to="/#contact">` fix in §4.2 actually produces parity, not a silent instant-jump).
3. Hover a `ProjectCard` with a `liveUrl` set — card lifts/shadow deepens/image scales/title tints teal; separately, hover and click just the external-link icon — navigates to the external URL in a new tab without also navigating to the internal detail route.
4. Confirm a card whose project has no `status` shows no pill and no gap where one would be, side-by-side in the same grid row as a card that does have one.
5. On `/`, confirm the work-experience landing section shows both entries (2 total at current launch content, matching `LANDING_TIMELINE_LIMIT`) with **no** "See all" stub — `hasMore` is false since `workExperience.length` (2) is not greater than the limit (2); the spine simply ends after the second entry. Confirm `/work-experience` independently renders the same two entries with no stub.
6. Load `/` with JavaScript disabled (or throttle/inspect the very first paint) — confirm the Contact section shows the obfuscated text, never a real `mailto:` link, in both the primary button slot and the Connect aside.
7. `View Source` (not DevTools' rendered DOM — the literal HTTP response) on `/` post-build — confirm no plain `tejitpabari99@gmail.com` string appears anywhere in the file.

**Not worth building here:** end-to-end browser tests for smooth-scroll physics (not meaningfully unit-testable, low value — covered by manual QA item 2); visual regression tooling (no prior visual baseline exists yet to protect); testing `react-markdown`'s own rendering correctness inside `TimelineEntry` (already exercised and trusted via SP02's own test suite and `ContentBody`'s use of the same library).

---

## 8. Manual Intervention Required From You

1. **Approve or edit SP07's already-drafted Hero, About, and Contact copy** (quoted in full in §4.2/§4.7/§4.8) — this sub-project renders it as-is; SP07's own §8 already flags it as a first draft pending your read-through, unchanged by this PRD.
2. **Edit or approve the three headline slots this sub-project drafts directly** (§4.10, resolved — no longer routed through SP07): the Featured Projects section headline, the Work Experience section headline, and the `/work-experience` page's own `h1`. These ship as real copy, not placeholder text — treat them the same as SP07's other first-draft fields for the purposes of your read-through.
3. **Supply a real hero portrait/photo or commissioned illustration whenever ready** — not blocking; the monogram placeholder (§4.2) ships at launch and the swap is a one-line prop change (`<HeroPortrait src="/hero-portrait.jpg" />`) with no other file touched.
4. **Nothing else in this sub-project is owner-blocked.** The DNS/Firebase open items are tracked in SP01's own "Manual Intervention" section already — this sub-project only consumes whatever values eventually land there, and renders correctly regardless of when they arrive. (The contact location string, the work-experience dates, and the Drive-vs-local résumé decision are all already resolved — see §9 — nothing further needed from you on any of them.)

---

## 9. Open Questions & Decisions

- `[RESOLVED: ProjectCard's external-link prop is a generic `externalHref`, not a Projects-specific `liveUrl`]` — keeps the shared component fully decoupled from any one collection's frontmatter shape; the caller (this sub-project, or SP04) decides what to pass. See §4.3.
- `[RESOLVED: SP04 §4.3 binds this — Research cards never populate `externalHref`]` — exactly as this PRD recommended (a citation link isn't a "try it now" affordance the same icon should promise for Projects). See SP04 §9's matching resolved entry. No change to this PRD's §4.3 `ProjectCard` design is needed — the component's `externalHref` prop was already generic and caller-supplied.
- `[RESOLVED: after:content-[''] added to ProjectCard's stretched-link title, correcting an omission in the juno-landing-page PRD's own equivalent snippet]` — without it, Tailwind never generates the `::after` pseudo-element at all, and the stretched-link technique silently doesn't work. See §4.3.
- `[RESOLVED: status pill gets one uniform color treatment, not per-value color-coding]` — diverges from `juno-landing-page`'s five-color status-dot system on purpose; that system doesn't map onto this project's three-value vocabulary or techfolio's (status-free) card precedent. See §4.3.
- `[RESOLVED: TimelineSeeAllStub and TimelineEntry are role="listitem" divs inside a role="list" div, not literal <ol>/<li>]` — satisfies both the brief's literal "a final stub div" wording and HTML validity (an `<ol>` cannot directly contain a bare `<div>` child). See §4.5.
- `[RESOLVED: LANDING_TIMELINE_LIMIT = 2, not 3]` — binding architect decision, no longer an owner confirmation item (§8's matching item is removed). With the Programming for Entrepreneurs role dropped (SP07 §4.3/§9), only two roles exist today, so both 2 and 3 render identically right now — the choice is entirely about what happens at the third role. At a limit of 2, adding a third role makes the landing show two and the "See all" spine stub appear, which is the first moment `/work-experience` stops duplicating the landing section and starts earning its place in the route table (§4.6). At a limit of 3, the landing would swallow all three and the sub-page would stay redundant even longer. Brief §2 permits "top 2–3 entries," so both values comply; 2 is chosen because it makes the dedicated route meaningful sooner. The `hasMore = workExperience.length > LANDING_TIMELINE_LIMIT` stub condition is unchanged by this — see the binding decision below, which supersedes this entry's now-superseded original reasoning (it argued the limit had to be 2 specifically to keep the stub meaningful; that reasoning no longer applies now that the stub's visibility is gated on role count, not tuned via the limit).
- `[RESOLVED: the landing timeline's "See all" stub renders only when there are more roles than the landing shows; with two roles it does not render]` — binding architect decision, propagated from the owner's decision to drop the Programming for Entrepreneurs and Social Good role (SP07 §4.3/§9). The `/work-experience` route stays (it's in the brief's route table and scales for free as roles are added), but the "See all" stub is an explicit condition — `hasMore = workExperience.length > LANDING_TIMELINE_LIMIT` — not an ambient assumption tied to a specific role count. With today's 2 real roles, the landing page shows both and the stub does not render; the spine simply ends after the last entry. See §4.5, §4.6.
- `[RESOLVED: work-experience blurbs render via a hand-styled react-markdown call, not SP02's shared <ContentBody>]` — `ContentBody`'s `prose` typography plugin is sized for a full write-up, not the tighter "Brittne's type scale" 2–3 line rhythm the timeline needs; SP02's own PRD anticipates this exact reuse-with-different-styling need for a hypothetical future work-experience detail page. See §4.5.
- `[DEFERRED]` **Index-0-as-"current" could theoretically mismatch if a future past role were added with a more recent `startDate` than the current `Present` role's** — a data shape the brief's own non-goals (no multi-role/overlap complexity) don't anticipate. Not solved speculatively; revisit only if such a role is ever actually added. See §4.5.
- `[RESOLVED: `trackEvent(name: string, params?: Record<string, unknown>): void`, imported from `@/lib/analytics`]` — confirmed against SP05 §4.3/§4.4, which now exists and defines exactly this (as `trackEvent(name: AnalyticsEventName, params?: Record<string, string | number | boolean>): void`, `AnalyticsEventName` a fixed five-value union). SP05's actual event-name catalogue differs from what this PRD's original §4.9 call sites assumed: five call sites used names outside SP05's union (`outbound_link_click`, `cta_click`, `see_all_projects_click`, `see_all_work_experience_click`, `email_click`). Fixed in §4.2/§4.4/§4.5/§4.8/§4.9 to match SP05 exactly — `outbound_link_click` renamed to `outbound_click` throughout, and the four events with no SP05 equivalent are no longer tracked (none is part of the brief's own six tracked-event categories, so nothing brief-mandated is lost). SP05 itself was not changed.
- `[RESOLVED: `RESUME_URL` lives only in `src/config/links.ts`; SP01's `Footer.tsx` and this sub-project's `Hero.tsx` both import it]` — `src/config/links.ts` also carries `NAV_LINKS` and `FOOTER_LINKS` per SP02 §4.5.4's validator cross-check, so all three exports are defined together, not just `RESUME_URL`.
- `[RESOLVED: `src/config/links.ts` is SP01-owned and created there, not by this sub-project]` — binding architect decision, resolving a three-way ownership collision (SP01's `Nav`/`Footer` consume it, SP02's build-time validator checks its entries against `KNOWN_STATIC_ROUTES`, and this PRD had also proposed defining it). SP01 lands first (Phase 1) and its `Nav`/`Footer` cannot render without this file existing, so any other owner creates a forward dependency from Phase 1 into a later phase — this sub-project and SP02 are consumers only. See SP01 §4.6/§9, and §4.2 above (updated to consume rather than create).
- `[RESOLVED: identity constants (email, LinkedIn, GitHub) live in SP05's `src/config/contact.ts`; navigation constants live in SP01's `src/config/links.ts`; no `src/config/social.ts` is created]` — binding architect decision, resolving the `GITHUB_URL` collision this PRD's own task generation surfaced (claimed by both a proposed `src/config/social.ts` and SP05's `contact.ts`). Brief §2/§3 "Contact facts" already groups the email, LinkedIn, and GitHub together as one ported concern from `juno-landing-page/src/config/contact.ts`, including the "not obfuscated, and here is why" reasoning for LinkedIn/GitHub living in that same file's comments — splitting the socials into a third file would orphan that reasoning. The résumé is a nav/footer destination, not an identity handle, so it stays in `links.ts`. See §4.2/§4.8 above (updated to import `GITHUB_URL` from `@/config/contact`) and SP05 §4.1/§9.
- `[RESOLVED: the headline copy drafted in this PRD's §4.4/§4.5/§4.6 ships as the real copy, not as placeholder]` — three section headings are page design, which is this PRD's own scope, and routing them through SP07 for three short strings would add a handoff for no gain. §4.4/§4.5/§4.6/§4.10 no longer frame these three strings as placeholder or as a visible TODO; the owner may edit them like any other copy (§8).
- `[DEFERRED]` **Background color alternation** (cream/sage/cream/sage/cream across the five sections, §4.1) is a cosmetic judgment call mirroring techfolio's own rhythm, not a brief-mandated sequence — easy to adjust visually during implementation with no contract impact on any other sub-project.
- `[RESOLVED: HeroPortrait's placeholder monogram is a new UI element, not ported from either reference]` — techfolio always has a real avatar illustration; the current Gatsby site has no hero image at all. Neither reference offers a "no image yet" pattern to copy, so this PRD designs one: a swappable `src?` prop, monogram fallback, capped small size. See §4.2.
- `[RESOLVED: the Contact aside ships no location line — owner decided to omit rather than supply a value]` — a portfolio's Contact aside works fine with email + social links alone; omitting the line means no placeholder can ever leak to production and no stale personal-location claim can go stale. `LocationIcon` (SP01 §4.6) is no longer imported or rendered here; the aside is email + circular GitHub/LinkedIn icon buttons, one fewer row. See §4.8.
