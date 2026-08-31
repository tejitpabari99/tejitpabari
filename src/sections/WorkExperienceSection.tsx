import { workExperience, type WorkExperience } from '@/data';
import { Timeline } from '@/components/timeline/Timeline';

// Brief §2/§3 says "top 2–3 entries" without pinning an exact number.
// Resolved at 2 (PRD §4.5/§9, owner decision propagated from SP07's role
// drop) — the "See all" stub's visibility is NOT tuned via this number; it
// renders only when workExperience.length > LANDING_TIMELINE_LIMIT. At
// today's 2-role launch content that's false, so the stub does not render.
export const LANDING_TIMELINE_LIMIT = 2;

// Exported for testability — PRD §7 requires boundary-testing this
// computation at exactly LANDING_TIMELINE_LIMIT, one below, and one above.
// eslint-disable-next-line react-refresh/only-export-components
export function computeLandingTimelineState(
  all: WorkExperience[],
  limit: number = LANDING_TIMELINE_LIMIT,
): { entries: WorkExperience[]; hasMore: boolean } {
  return { entries: all.slice(0, limit), hasMore: all.length > limit };
}

export function WorkExperienceSection() {
  const { entries, hasMore } = computeLandingTimelineState(workExperience);

  return (
    <section
      id="work-experience"
      className="scroll-mt-24 bg-cream px-6 py-16 sm:px-8 sm:py-20 md:px-10 lg:px-12 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[720px]">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-teal-secondary">
          Work Experience
        </p>
        <h2 className="mt-4 max-w-[14ch] text-[2rem] font-extrabold leading-[0.96] tracking-tight text-ink sm:text-[2.4rem]">
          Where I&rsquo;ve worked and what I&rsquo;ve built.
        </h2>
        <div className="mt-8 lg:mt-10">
          <Timeline entries={entries} showSeeAll={hasMore} />
        </div>
      </div>
    </section>
  );
}
