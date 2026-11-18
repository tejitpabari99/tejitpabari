import type { ScheduleItem } from '@/lib/schedule/schedule';
import { formatDateLabel } from '@/lib/schedule/schedule';
import { StatusPill } from './StatusPill';

export function ScheduleCard({ item }: { item: ScheduleItem }) {
  const date = formatDateLabel(item.dateAdded);
  return (
    <li className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-[0.8rem] font-semibold text-body">{item.name}</p>
      <h3 className="mt-1 text-base font-bold text-ink">{item.project}</h3>
      {item.blurb && (
        <p data-testid="blurb" className="mt-2 text-[0.9rem] leading-6 text-body">
          {item.blurb}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <StatusPill status={item.status} />
        {date && <span className="text-xs text-body">{date}</span>}
      </div>
    </li>
  );
}
