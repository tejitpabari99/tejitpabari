// src/components/LinksRow.tsx
import type { Link as ContentLink } from '@/data'; // { label, href, icon?, primary? } — src/data/shared.ts
import { DynamicIcon } from './icons/DynamicIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { trackEvent } from '@/lib/analytics';

interface LinksRowProps {
  links: ContentLink[];
}

const PRIMARY_CLASSES =
  'inline-flex items-center gap-1.5 rounded-full bg-teal px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90';
const SECONDARY_CLASSES =
  'inline-flex items-center gap-1.5 rounded-full border border-teal-secondary/20 px-5 py-2 text-sm font-semibold text-teal-secondary transition hover:bg-teal-secondary hover:text-white';

export function LinksRow({ links }: LinksRowProps) {
  if (links.length === 0) return null;
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackEvent('outbound_click', { url: link.href, context: 'content_external_link', label: link.label })}
          className={link.primary ? PRIMARY_CLASSES : SECONDARY_CLASSES}
        >
          {link.icon ? (
            <>
              <DynamicIcon name={link.icon} className="h-4 w-4" />
              {link.label}
            </>
          ) : (
            <>
              {link.label}
              <ExternalLinkIcon className="h-3.5 w-3.5" />
            </>
          )}
        </a>
      ))}
    </div>
  );
}
