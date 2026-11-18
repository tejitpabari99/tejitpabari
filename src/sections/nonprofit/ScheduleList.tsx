import type { ScheduleGroups } from '@/lib/schedule/schedule';
import { ScheduleCard } from './ScheduleCard';

const GRID = 'mt-4 grid grid-cols-1 gap-4 md:grid-cols-2';

export function ScheduleList({ groups }: { groups: ScheduleGroups }) {
  return (
    <div>
      {groups.active.length > 0 && (
        <ul className={GRID}>
          {groups.active.map((it, i) => (
            <ScheduleCard key={`a-${i}`} item={it} />
          ))}
        </ul>
      )}
      {groups.done.length > 0 && (
        <section className="mt-12">
          <h2 className="text-[1.5rem] font-extrabold tracking-tight text-ink">Done</h2>
          <ul className={GRID}>
            {groups.done.map((it, i) => (
              <ScheduleCard key={`d-${i}`} item={it} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
