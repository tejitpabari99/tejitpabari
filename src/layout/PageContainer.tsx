// src/layout/PageContainer.tsx
import type { ElementType, ReactNode } from 'react';

interface PageContainerProps {
  /** @default 'div' - pass 'article' for the two markdown detail pages. */
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

// The one shared width/padding convention every sub-page now uses (PRD 01
// §4.8/§4.9). Horizontal padding and max-width never vary. Top padding is
// now a single constant everywhere too - round 3 removed the "back-only"
// chrome mode entirely (Nav is always visible now, see PageShell.tsx), so
// there is no route left needing a smaller top gutter: every page clears
// Nav's fixed pill header with the same pt-28 sm:pt-32. A page needing a
// visually narrower content column (e.g. WorkExperiencePage's timeline)
// nests an inner max-w-[…] wrapper *inside* this container instead of
// shrinking the container itself, so every page keeps the same outer
// rhythm.
//
// Mobile gutter (round 4, owner: no breathing room between cards and the
// screen edge on phone-sized viewports): the base gutter was px-6 (24px),
// ~6% of a 390px viewport per side. Reproduced at 360/390px — no element
// escapes the container (scrollWidth === innerWidth on every route
// checked), so this was never a horizontal-overflow bug. The real cause is
// that 24px reads as barely-there breathing room once the card itself
// (border + shadow + inset image) is competing for the same narrow strip,
// which is only really noticeable once you're below the `sm` breakpoint —
// desktop already gets a much bigger gutter from md:/lg:. Fixed by raising
// the base (sub-`sm`) gutter to px-8 (32px), reusing the existing sm:px-8
// step rather than inventing a new value — every breakpoint below `sm` now
// gets what `sm` already had, so there's no longer a separate `sm:px-8` to
// declare. md:px-10/lg:px-12 are unchanged. Applied identically to every
// section/page sharing this convention (Hero, FeaturedProjectsSection,
// AboutSection, WorkExperienceSection, ContactSection, Footer) so the
// gutter stays one consistent number everywhere, not a projects-page-only
// fix.
export function PageContainer({ as: Tag = 'div', className = '', children }: PageContainerProps) {
  return (
    <Tag className={`mx-auto w-full max-w-content px-8 pb-20 pt-28 sm:pt-32 md:px-10 lg:px-12 ${className}`}>
      {children}
    </Tag>
  );
}
