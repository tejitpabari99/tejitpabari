// src/lib/resolveLiveLinks.ts
//
// Round 3.2 (owner: "it is not a live button, the button doesn't say
// live"): the ONE shared place that turns a content entry's `live` field
// plus its `links[]` array into the final, ordered list of link buttons -
// used by every place that renders link buttons for a project/research
// entry (LinksRow for detail pages, ProjectListCard for both index-page
// card lists, and FeaturedProjectsSection for the home page's featured
// cards), so this resolution logic exists exactly once instead of being
// re-derived per component. Framework-agnostic on purpose (plain data in,
// plain data out) so it's trivial to unit-test without React at all.
//
// Contract (per .dev/website-revamp-r3/CONTENT-AUTHORING.md's "The `live`
// field" section, which is the source of truth for the user-facing rules
// this function implements):
//
//   1. No `live` field at all -> return `links` completely unchanged. No
//      live button, no reordering, no dedupe. This is the fallback that
//      keeps every existing entry's cards/detail page looking exactly as
//      they do today.
//
//   2. A `live` field present -> a synthetic "live" entry is computed and
//      placed FIRST in the returned list, ahead of every links[] entry.
//      Its href is always the INTERNAL /projects/<slug>/live or
//      /research/<slug>/live path - never the resolved external target,
//      so the card/button never has to change even if where `live` points
//      does.
//
//   3. Label/icon are resolved through an inheritance chain, in this
//      priority order:
//        a. `live.label` / `live.icon`, if the owner set them explicitly
//           - these always win, full stop.
//        b. Otherwise, if `live.type: external` and its `href` exactly
//           matches an existing links[] entry's href (see dedupe, below),
//           that entry's label/icon are inherited - the live button is
//           now standing in for that exact link, so it only makes sense
//           to look and read like it did.
//        c. Otherwise, the links[] entry marked `primary: true`, if any.
//        d. Otherwise, the first entry in links[] (array order), if any.
//        e. Otherwise (links[] is empty, nothing to inherit from at all)
//           the last-resort defaults, "Live" / "globe".
//      This is deliberately NOT branded as "Live" by default whenever
//      there's something better to show (the owner's point: a button
//      whose label always says "Live" reads wrong when it's really a
//      Chrome Web Store link, a GitHub link, etc.).
//
//   4. Dedupe: when `live.type: external` and its `href` exactly equals
//      an existing links[] entry's `href`, that links[] entry is dropped
//      from the returned list - the live button, in that entry's stead,
//      already covers that exact destination (indirected through the
//      internal /live URL). No card or detail page should ever show the
//      same destination twice. Dedupe never applies to `live.type: self`
//      (a self-hosted page has no comparable href) or to the no-`live`
//      fallback (rule 1).
//
//   5. Whether the live entry renders filled/primary or outlined/
//      secondary follows the same rule LinkButtons already uses for any
//      entry: exactly one entry in the RETURNED list may be primary. If,
//      after dedupe, no remaining links[] entry is still marked
//      `primary: true`, the live entry becomes primary; otherwise that
//      links[] entry keeps its `primary: true` and the live entry renders
//      as the first secondary/outlined button instead.
import type { Link as ContentLink, LiveConfig } from '@/data';
import type { LinkButtonEntry } from '@/components/LinkButtons';

export type LiveLinkCollection = 'projects' | 'research';

const LIVE_DEFAULT_LABEL = 'Live';
const LIVE_DEFAULT_ICON = 'globe';

export interface ResolveLiveLinksArgs {
  live: LiveConfig | undefined;
  links: ContentLink[];
  /** The entry's own slug (Project/Research `slug`), used only to build
   *  the internal /live href - never rendered directly. */
  slug: string;
  collection: LiveLinkCollection;
}

export function resolveLiveLinks({ live, links, slug, collection }: ResolveLiveLinksArgs): LinkButtonEntry[] {
  // Rule 1: no `live` field at all -> completely unchanged.
  if (!live) return links;

  const internalHref = `/${collection}/${slug}/live`;

  // Rule 4: dedupe. Only `type: external` has a real href to compare
  // against links[] at all - `type: self` renders its own page and was
  // never a candidate for appearing in links[] in the first place.
  let dedupedEntry: ContentLink | undefined;
  let remainingLinks = links;
  if (live.type === 'external') {
    const matchIndex = links.findIndex((link) => link.href === live.href);
    if (matchIndex !== -1) {
      dedupedEntry = links[matchIndex];
      remainingLinks = links.filter((_, i) => i !== matchIndex);
    }
  }

  // Rule 3: label/icon inheritance chain. `dedupedEntry` is looked up
  // against the ORIGINAL links[] (not `remainingLinks`) for the
  // primary/first fallback too, since "primary" is a property of the
  // content the owner wrote, not an artifact of dedupe having run.
  const primaryLink = links.find((link) => link.primary);
  const firstLink = links[0];
  const inheritFrom = dedupedEntry ?? primaryLink ?? firstLink;

  const label = live.label ?? inheritFrom?.label ?? LIVE_DEFAULT_LABEL;
  const icon = live.icon ?? inheritFrom?.icon ?? LIVE_DEFAULT_ICON;

  // Rule 5: primary/secondary. Computed against `remainingLinks` (post-
  // dedupe) - if the entry that WAS primary is exactly the one just
  // deduped away, the live entry correctly takes over as primary.
  const hasRemainingPrimary = remainingLinks.some((link) => link.primary);

  const liveEntry: LinkButtonEntry = {
    label,
    href: internalHref,
    icon,
    primary: !hasRemainingPrimary,
    isLive: true,
  };

  return [liveEntry, ...remainingLinks];
}
