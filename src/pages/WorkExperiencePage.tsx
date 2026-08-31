// src/pages/WorkExperiencePage.tsx
import { BackButton } from '@/components/BackButton';
import { Timeline } from '@/components/timeline/Timeline';
import { workExperience } from '@/data';

export function WorkExperiencePage() {
  return (
    <div className="mx-auto w-full max-w-[720px] px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10">
      <BackButton />
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
  );
}
