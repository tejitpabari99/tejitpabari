import { Link } from 'react-router-dom';
import { ArrowIcon } from '../icons/ArrowIcon';

export function TimelineSeeAllStub() {
  return (
    // Same border-left width/color and left padding as TimelineEntry, no
    // ::before at all — this is what makes the spine read as continuing
    // past the last real entry rather than terminating.
    <div role="listitem" className="border-l-2 border-teal-secondary/15 py-4 pl-[22px]">
      <Link
        to="/work-experience"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-secondary transition hover:text-teal"
      >
        See all experience
        <ArrowIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}
