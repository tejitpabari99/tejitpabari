// src/lib/resolveLiveLinks.ts
//
// Round 3.3 (owner clarification: "/live is a routing concept, not a
// button" - narrows round 3.2's card/detail-page live-button rendering
// back down considerably). This is the ONE shared place implementing the
// /live target-resolution rules documented in
// .dev/website-revamp-r3/CONTENT-AUTHORING.md's "The `live` field"
// section:
//
//   1. `live` declared -> type: external redirects to live.href; type:
//      self renders the registered hosted page in-site (no redirect at
//      all for that case).
//   2. No `live` field, but links[] is non-empty -> redirects to the
//      entry marked primary: true, or links[0] if none is marked.
//   3. No `live` field and no links[] at all -> redirects to the entry's
//      own detail page (/projects/<slug> or /research/<slug>).
//
// Used by:
//   - src/pages/ProjectLivePage.tsx / ResearchLivePage.tsx (client-side
//     dispatch: render the self-hosted page, or hand LiveRedirectFallback
//     the resolved destination)
//   - vite.config.ts's live-redirects plugin (build-time Firebase Hosting
//     redirect generation - implements this exact same resolution order,
//     independently, so a real deployed cold hit and the client-side
//     fallback above can never disagree about where a given /live goes)
//   - src/components/ProjectListCard.tsx (the only card surface that ever
//     shows a live-derived button, and only as a last resort when an
//     entry has no links[] at all to show instead)
//
// Deliberately does NOT do anything with label/icon inheritance or
// href-based dedupe across links[] any more (round 3.2 had both - see
// git history for r3.2-live-cards-01-resolver if that's ever needed
// again): the owner's round 3.3 clarification is that detail pages and
// populated cards show links[] exactly as authored, with `live` used only
// to steer where /live itself goes, not to grow an extra button.
import type { Link as ContentLink, LiveConfig } from '@/data';
import type { LinkButtonEntry } from '@/components/LinkButtons';

export type LiveLinkCollection = 'projects' | 'research';

export interface LiveTargetArgs {
  live: LiveConfig | undefined;
  links: ContentLink[];
  slug: string;
  collection: LiveLinkCollection;
}

/** What /projects/<slug>/live (or /research/<slug>/live) actually does -
 *  `mode: 'self'` means render the HOSTED_LIVE_PAGES component in place
 *  (no redirect); `mode: 'redirect'` carries the destination to send the
 *  visitor to. See the file header for the three-rule resolution order
 *  this implements. */
export type LiveTarget = { mode: 'self'; page: string } | { mode: 'redirect'; destination: string };

export function resolveLiveTarget({ live, links, slug, collection }: LiveTargetArgs): LiveTarget {
  // Rule 1.
  if (live?.type === 'self') return { mode: 'self', page: live.page };
  if (live?.type === 'external') return { mode: 'redirect', destination: live.href };

  // Rule 2: no `live` field, but links[] to fall back to.
  const primary = links.find((link) => link.primary);
  if (primary) return { mode: 'redirect', destination: primary.href };
  if (links.length > 0) return { mode: 'redirect', destination: links[0].href };

  // Rule 3: nothing at all to fall back to.
  return { mode: 'redirect', destination: `/${collection}/${slug}` };
}

/** The internal /live URL itself (never a resolved destination) - the
 *  one thing every surface that links to /live needs to build. */
export function buildLiveHref(collection: LiveLinkCollection, slug: string): string {
  return `/${collection}/${slug}/live`;
}

const LIVE_DEFAULT_LABEL = 'Live';
const LIVE_DEFAULT_ICON = 'globe';

/** ProjectListCard's link-button list. Renders links[] completely
 *  unchanged whenever there's at least one - no live button prepended,
 *  no reordering, no dedupe (round 3.2 behavior removed per round 3.3).
 *  ONLY when an entry has no links[] at all is a single live-link button
 *  substituted in, pointed at the internal /live URL and labeled from
 *  live.label/live.icon if set, "Live"/"globe" otherwise - so a card
 *  never ends up with literally zero link buttons. */
export function resolveCardLinks({ live, links, slug, collection }: LiveTargetArgs): LinkButtonEntry[] {
  if (links.length > 0) return links;
  return [
    {
      label: live?.label ?? LIVE_DEFAULT_LABEL,
      href: buildLiveHref(collection, slug),
      icon: live?.icon ?? LIVE_DEFAULT_ICON,
      primary: true,
      isLive: true,
    },
  ];
}
