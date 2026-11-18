import { SCHEDULE_UNAVAILABLE } from '@/config/nonprofit';

export function ScheduleUnavailable() {
  return (
    <p role="status" className="mt-6 text-[0.94rem] text-body">
      {SCHEDULE_UNAVAILABLE}
    </p>
  );
}
