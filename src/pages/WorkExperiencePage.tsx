// src/pages/WorkExperiencePage.tsx
import { BackButton } from '@/components/BackButton';
import { Timeline } from '@/components/timeline/Timeline';
import { RouteMeta } from '@/components/RouteMeta'; // SP06
import { PageContainer } from '@/layout/PageContainer';
import { workExperience } from '@/data';

export function WorkExperiencePage() {
  return (
    <PageContainer chrome="full">
      <RouteMeta
        title="Work Experience"
        description="Where I've worked and what I've built along the way."
        path="/work-experience"
      />
      <BackButton />
      <div className="max-w-[45rem]">
        <p className="mt-6 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-teal-secondary">
          Work Experience
        </p>
        <h1 className="mt-3 text-[1.9rem] font-extrabold tracking-tight text-ink sm:text-[2.3rem]">
          The full timeline.
        </h1>
        <div className="mt-10">
          <Timeline entries={workExperience} />
        </div>
      </div>
    </PageContainer>
  );
}
