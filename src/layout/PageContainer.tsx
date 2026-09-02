// src/layout/PageContainer.tsx
import type { ElementType, ReactNode } from 'react';
import type { ChromeMode } from './chromeMode';

// 'full': clears Nav's fixed pill (a floating rounded-pill header, not part
// of document flow — see PageShell §4.5) — same value every full-chrome
// sub-page already used before this PRD.
// 'back-only': no fixed header exists on these routes at all; pt-28/32
// there would just be dead air above the Back link, so it drops to a much
// smaller top gutter instead.
const TOP_PADDING: Record<ChromeMode, string> = {
  full: 'pt-28 sm:pt-32',
  'back-only': 'pt-12 sm:pt-16',
};

interface PageContainerProps {
  /** @default 'div' — pass 'article' for the two markdown detail pages. */
  as?: ElementType;
  chrome: ChromeMode;
  className?: string;
  children: ReactNode;
}

// The one shared width/padding convention every sub-page now uses (PRD 01
// §4.8/§4.9). Horizontal padding and max-width never vary; only top
// padding varies with chrome mode. A page needing a visually narrower
// content column (e.g. WorkExperiencePage's timeline) nests an inner
// max-w-[…] wrapper *inside* this container instead of shrinking the
// container itself, so every page keeps the same outer rhythm — see
// WorkExperiencePage, Task 19.
export function PageContainer({ as: Tag = 'div', chrome, className = '', children }: PageContainerProps) {
  return (
    <Tag
      className={`mx-auto w-full max-w-content px-6 pb-20 ${TOP_PADDING[chrome]} sm:px-8 md:px-10 lg:px-12 ${className}`}
    >
      {children}
    </Tag>
  );
}
