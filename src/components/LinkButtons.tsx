// src/components/LinkButtons.tsx
//
// Shared "row of link buttons with primary/icon support" logic, extracted
// so LinksRow.tsx (detail pages, size="md") and ProjectListCard.tsx (index
// pages, size="sm") render one real implementation instead of two
// divergent copies - round 3, PRD item 1.
//
// This component renders only the <a> tags themselves, no wrapping
// container: callers own the surrounding layout (flex-wrap, gap, margin),
// same as LinksRow always has.
import type { Link as ContentLink } from '@/data'; // { label, href, icon?, primary? } - src/data/shared.ts
import { DynamicIcon } from './icons/DynamicIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { trackEvent } from '@/lib/analytics';

export type LinkButtonSize = 'sm' | 'md';

// Round 3.1 (/live subsystem restoration): LinksRow prepends one synthetic
// entry for the detail page's "Live" button, built from live.label/icon
// and an INTERNAL href (/projects/<slug>/live or /research/<slug>/live) -
// never the resolved external target (see ProjectDetailPage/
// ResearchDetailPage). `isLive` is never set on a real links[] content
// entry; it exists purely so this component's click handler can log
// live_link_click instead of outbound_click/content_external_link for
// that one entry, without forking the whole render path over it.
export interface LinkButtonEntry extends ContentLink {
  isLive?: boolean;
}

export interface LinkButtonsProps {
  links: LinkButtonEntry[];
  /** @default 'md' - LinksRow's existing detail-page size. ProjectListCard
   *  passes 'sm' for the smaller, index-card link buttons (PRD item 1). */
  size?: LinkButtonSize;
}

const BASE_CLASSES = 'relative z-10 inline-flex items-center gap-1.5 font-semibold transition';
const SIZE_CLASSES: Record<LinkButtonSize, string> = {
  md: 'px-5 py-2 text-sm', // LinksRow's original size, unchanged
  sm: 'px-3 py-1.5 text-xs',
};
const ICON_SIZE_CLASSES: Record<LinkButtonSize, string> = {
  md: 'h-4 w-4',
  sm: 'h-3.5 w-3.5',
};
const EXTERNAL_ICON_SIZE_CLASSES: Record<LinkButtonSize, string> = {
  md: 'h-3.5 w-3.5',
  sm: 'h-3 w-3',
};
const PRIMARY_CLASSES = 'bg-teal text-white hover:opacity-90';
const SECONDARY_CLASSES = 'border border-teal-secondary/20 text-teal-secondary hover:bg-teal-secondary hover:text-white';

export function LinkButtons({ links, size = 'md' }: LinkButtonsProps) {
  return (
    <>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => {
            // stopPropagation matters for ProjectListCard, whose whole card
            // is a click target (an `after:absolute after:inset-0` overlay
            // on the title Link) - without this, clicking a link button
            // would also fire the card's own navigation. Harmless where
            // there's no such overlay (LinksRow's detail-page usage).
            event.stopPropagation();
            if (link.isLive) {
              trackEvent('live_link_click', { url: link.href, label: link.label });
            } else {
              trackEvent('outbound_click', { url: link.href, context: 'content_external_link', label: link.label });
            }
          }}
          className={`${BASE_CLASSES} ${SIZE_CLASSES[size]} ${link.primary ? PRIMARY_CLASSES : SECONDARY_CLASSES}`}
        >
          {link.icon ? (
            <>
              <DynamicIcon name={link.icon} className={ICON_SIZE_CLASSES[size]} />
              {link.label}
            </>
          ) : (
            <>
              {link.label}
              <ExternalLinkIcon className={EXTERNAL_ICON_SIZE_CLASSES[size]} />
            </>
          )}
        </a>
      ))}
    </>
  );
}
