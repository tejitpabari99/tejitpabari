// src/pages/nonprofit/SchedulePage.tsx
// Hook state starts 'loading', so SSR and first paint render the skeleton.
import { RouteMeta } from '@/components/RouteMeta';
import { PageContainer } from '@/layout/PageContainer';
import { useSchedule } from '@/lib/schedule/useSchedule';
import { ScheduleList } from '@/sections/nonprofit/ScheduleList';
import { ScheduleSkeleton } from '@/sections/nonprofit/ScheduleSkeleton';
import { ScheduleUnavailable } from '@/sections/nonprofit/ScheduleUnavailable';
import { ROUTE_META, SCHEDULE_HEADING, SCHEDULE_INTRO, SCHEDULE_UNAVAILABLE } from '@/config/nonprofit';

export function SchedulePage() {
  const { state, groups } = useSchedule();
  return (
    <PageContainer>
      <RouteMeta title={ROUTE_META.schedule.title} description={ROUTE_META.schedule.description} path="/schedule" suffix={false} />
      <h1 className="text-3xl font-semibold text-teal">{SCHEDULE_HEADING}</h1>
      <p className="mt-2 text-body">{SCHEDULE_INTRO}</p>
      {state === 'loading' && <ScheduleSkeleton />}
      {state === 'ok' && <ScheduleList groups={groups} />}
      {(state === 'empty' || state === 'error') && <ScheduleUnavailable />}
      <noscript>
        <p className="mt-6 text-[0.94rem] text-body">{SCHEDULE_UNAVAILABLE}</p>
      </noscript>
    </PageContainer>
  );
}
