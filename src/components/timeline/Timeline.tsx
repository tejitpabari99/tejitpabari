import type { WorkExperience } from '@/data';
import { TimelineEntry } from './TimelineEntry';
import { TimelineSeeAllStub } from './TimelineSeeAllStub';

interface TimelineProps {
  /** Entries to render, in the order given. Callers pass an already-sorted
   * slice — index 0 is always the true most-recent role. */
  entries: WorkExperience[];
  /** When true, renders a TimelineSeeAllStub after the last passed-in
   * entry, and that entry gets standard (non-reduced) bottom padding.
   * Omit/false for the full /work-experience page. */
  showSeeAll?: boolean;
}

export function Timeline({ entries, showSeeAll = false }: TimelineProps) {
  return (
    <div role="list" aria-label="Work experience timeline" className="flex flex-col gap-0 pl-1">
      {entries.map((entry, index) => (
        <TimelineEntry
          key={entry.id}
          entry={entry}
          isCurrent={index === 0}
          isLast={!showSeeAll && index === entries.length - 1}
        />
      ))}
      {showSeeAll && <TimelineSeeAllStub />}
    </div>
  );
}
