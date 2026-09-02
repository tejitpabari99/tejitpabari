// src/components/LinksRow.tsx
import type { Link as ContentLink } from '@/data'; // SP02's Link type: { label, href }
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { ArrowIcon } from './icons/ArrowIcon';
import { trackEvent } from '@/lib/analytics';

interface LinksRowProps {
  links: ContentLink[];
  /** Internal /projects/<slug>/live path — set only when a project has EITHER
   *  a liveUrl OR a hosted-page registration (§4.6/§4.7). Research never
   *  passes this. */
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
