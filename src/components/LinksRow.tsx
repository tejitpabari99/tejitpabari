// src/components/LinksRow.tsx
import type { Link as ContentLink } from '@/data'; // { label, href, icon?, primary? } - src/data/shared.ts
import { LinkButtons, type LinkButtonEntry } from './LinkButtons';

interface LinksRowProps {
  links: ContentLink[];
  /** Round 3.1 (/live subsystem restoration): present only when the entry
   *  declares a `live` field. `href` is ALWAYS the internal
   *  /projects/<slug>/live or /research/<slug>/live path — never the
   *  resolved external target, which stays owner-controlled and can
   *  change without touching this page - see ProjectDetailPage/
   *  ResearchDetailPage, which build this from `project.live`/`item.live`
   *  (already defaulted by src/data/shared.ts's assertOptionalLive). */
  live?: { href: string; label: string; icon: string };
}

export function LinksRow({ links, live }: LinksRowProps) {
  // The Live button sits first in the row. If a links[] entry is already
  // marked primary: true, that one keeps the filled/dark-green style and
  // Live renders as the first secondary (outlined) button instead -
  // exactly one filled button is ever shown, never two.
  const hasExistingPrimary = links.some((link) => link.primary);
  const entries: LinkButtonEntry[] = live
    ? [{ label: live.label, href: live.href, icon: live.icon, primary: !hasExistingPrimary, isLive: true }, ...links]
    : links;

  if (entries.length === 0) return null;
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <LinkButtons links={entries} size="md" />
    </div>
  );
}
