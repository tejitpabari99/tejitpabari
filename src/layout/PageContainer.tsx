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
export function PageContainer({ as: Tag = 'div', className = '', children }: PageContainerProps) {
  return (
    <Tag className={`mx-auto w-full max-w-content px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12 ${className}`}>
      {children}
    </Tag>
  );
}
