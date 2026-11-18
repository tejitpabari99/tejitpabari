import { STATUS_COLORS, type ScheduleStatus } from '@/config/nonprofit';

export function StatusPill({ status }: { status: ScheduleStatus }) {
  return (
    <span className={`inline-flex rounded-pill px-3 py-1 text-xs font-semibold ${STATUS_COLORS[status]}`}>
      {status}
    </span>
  );
}
