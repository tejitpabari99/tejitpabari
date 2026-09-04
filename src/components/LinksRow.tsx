// src/components/LinksRow.tsx
import type { Link as ContentLink, LiveConfig } from '@/data'; // { label, href, icon?, primary? } - src/data/shared.ts
import { LinkButtons } from './LinkButtons';
import { resolveLiveLinks, type LiveLinkCollection } from '@/lib/resolveLiveLinks';

interface LinksRowProps {
  links: ContentLink[];
  /** Round 3.1/3.2 (/live subsystem restoration + label/icon inheritance):
   *  the entry's own optional `live` field, unmodified - all label/icon
   *  defaulting, inheritance, dedupe, and internal-href construction is
   *  handled by the one shared src/lib/resolveLiveLinks.ts, not here.
   *  `slug`/`collection` are only used to build that internal href. */
  live?: LiveConfig;
  slug: string;
  collection: LiveLinkCollection;
}

export function LinksRow({ links, live, slug, collection }: LinksRowProps) {
  const entries = resolveLiveLinks({ live, links, slug, collection });

  if (entries.length === 0) return null;
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <LinkButtons links={entries} size="md" />
    </div>
  );
}
