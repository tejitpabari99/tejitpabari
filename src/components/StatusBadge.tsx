// src/components/StatusBadge.tsx
import type { ProjectStatus, ResearchStatus } from '@/data';

/** Every status value either collection's frontmatter can carry. Kept as an
 *  explicit union (not just `ProjectStatus`) so a status ever added to one
 *  collection but not the other still type-checks here without this file
 *  needing to know which collection is calling it. */
export type BadgeStatus = ProjectStatus | ResearchStatus;

type StatusBadgeSize = 'sm' | 'md';

// `satisfies Record<BadgeStatus, string>` is the compile-time exhaustiveness
// check: if a future content author adds a new literal to ProjectStatus or
// ResearchStatus (src/data/projects.ts / src/data/research.ts) without
// adding a matching key here, `npm run typecheck` fails on this line
// ("Property '<NewStatus>' is missing") — the build breaks at the
// color-mapping site itself, not silently at runtime with an unstyled
// badge. Combined with assertOptionalStatus already throwing at
// content-parse time for any value outside the allowed list, an unmapped
// status cannot reach this component through any type-checked path — see
// PRD §4.2/§9 item 2 for why no runtime fallback color is added on top of
// this (deliberate, not an oversight).
//
// No `/NN` opacity modifier on any of these (round 4 fix): the badge sits
// `absolute` on top of a project image, so any opacity let the photo bleed
// through and washed the color out — most visibly on "Completed", where
// the brand teal read as a lighter, faded green instead of the real
// `#043439`. Solid colors here render exactly the named brand token.
const STATUS_STYLES = {
  'Not Started': 'bg-slate-dark text-white',
  Building: 'bg-status-building text-white',
  Completed: 'bg-teal text-white',
} satisfies Record<BadgeStatus, string>;

const SIZE_STYLES: Record<StatusBadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[0.58rem]', // ProjectCard's existing pill size
  md: 'px-3 py-1 text-[0.68rem]',   // DetailHeader's existing pill size
};

interface StatusBadgeProps {
  status: BadgeStatus;
  /** @default 'md' */
  size?: StatusBadgeSize;
  /** Positioning only (e.g. "absolute left-3 top-3") — composed by the
   *  parent, which already knows where the badge sits on its own image. */
  className?: string;
}

export function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`rounded-pill font-semibold uppercase tracking-wide ${SIZE_STYLES[size]} ${STATUS_STYLES[status]} ${className}`}
    >
      {status}
    </span>
  );
}
