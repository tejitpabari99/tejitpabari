import { Link } from 'react-router-dom';
import { ProjectCard } from '@/components/ProjectCard';
import { ArrowIcon } from '@/components/icons/ArrowIcon';
import { featuredProjects } from '@/config/featured';
import { trackEvent } from '@/lib/analytics';
import { buildLiveHref } from '@/lib/resolveLiveLinks';

export function FeaturedProjectsSection() {
  return (
    <section
      id="projects"
      className="scroll-mt-24 bg-sage px-8 py-16 sm:py-20 md:px-10 lg:px-12 lg:py-24"
    >
      <div className="mx-auto w-full max-w-content">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-teal-secondary">
          Projects
        </p>
        <h2 className="mt-4 max-w-[22ch] text-balance text-[1.5rem] font-extrabold leading-[1.1] tracking-tight text-ink sm:max-w-none sm:whitespace-nowrap sm:text-[clamp(1.4rem,3.2vw,2.5rem)] sm:leading-[0.96]">
          Selected work, in health tech and beyond.
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3">
          {featuredProjects.map((project) => {
            // Round 3.3 (owner clarification): a featured card's one link
            // - ProjectCard's own small overlay icon-button (externalHref/
            // externalLabel/onExternalClick) - ALWAYS points at the
            // internal /projects/<slug>/live URL, for every featured
            // project, regardless of whether it declares `live` at all.
            // Rules 2/3 in src/lib/resolveLiveLinks.ts guarantee that URL
            // resolves somewhere sensible (a links[] entry, or the detail
            // page as a last resort) even with no `live` field - the card
            // body's title link still goes straight to the detail page,
            // unchanged; this overlay is the separate "open the app"
            // affordance.
            const liveHref = buildLiveHref('projects', project.slug);

            return (
              <ProjectCard
                key={project.slug}
                href={`/projects/${project.slug}`}
                image={project.image}
                imageAlt={`${project.title} preview`}
                title={project.title}
                description={project.description}
                tags={project.tags}
                status={project.status}
                externalHref={liveHref}
                externalLabel={`Open ${project.title} live`}
                onCardClick={() =>
                  trackEvent('project_card_click', {
                    slug: project.slug,
                    collection: 'projects',
                    title: project.title,
                  })
                }
                onExternalClick={() => trackEvent('live_link_click', { url: liveHref, label: project.title })}
              />
            );
          })}
        </div>

        <div className="mt-8 flex justify-center lg:mt-10">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 border border-teal-secondary px-6 py-2.5 text-sm font-semibold text-teal-secondary transition hover:bg-teal-secondary hover:text-white lg:px-7 lg:py-3 lg:text-[0.92rem]"
          >
            See all projects
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
