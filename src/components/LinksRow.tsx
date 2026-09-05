// src/components/LinksRow.tsx
//
// Round 3.3 (owner: "Links shown, but used to define what live is ... but
// dont need to show live"): renders links[] exactly as authored - no live
// button, no reordering, no dedupe, no label/icon inheritance. `live` (if
// set) only steers where the entry's separate /live route goes (see
// src/lib/resolveLiveLinks.ts, used by src/pages/ProjectLivePage.tsx /
// ResearchLivePage.tsx and vite.config.ts's redirect generator, not by
// this component at all).
import type { Link as ContentLink } from '@/data'; // { label, href, icon?, primary? } - src/data/shared.ts
import { LinkButtons } from './LinkButtons';

interface LinksRowProps {
  links: ContentLink[];
}

export function LinksRow({ links }: LinksRowProps) {
  if (links.length === 0) return null;
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <LinkButtons links={links} size="md" />
    </div>
  );
}
