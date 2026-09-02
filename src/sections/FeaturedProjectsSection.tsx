import { Link } from 'react-router-dom';
import { ProjectCard } from '@/components/ProjectCard';
import { ArrowIcon } from '@/components/icons/ArrowIcon';
import { featuredProjects } from '@/config/featured';
import { trackEvent } from '@/lib/analytics';

export function FeaturedProjectsSection() {
  return (
    <section
      id="projects"
      className="scroll-mt-24 bg-sage px-6 py-16 sm:px-8 sm:py-20 md:px-10 lg:px-12 lg:py-24"
    >
      <div className="mx-auto w-full max-w-content">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-teal-secondary">
          Projects
        </p>
        <h2 className="mt-4 max-w-[22ch] text-balance text-[1.7rem] font-extrabold leading-[1.1] tracking-tight text-ink sm:max-w-none sm:whitespace-nowrap sm:text-[clamp(1.4rem,3.2vw,2.5rem)] sm:leading-[0.96]">
          Selected work, in health tech and beyond.
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:mt-10 xl:grid-cols-4">
          {featuredProjects.map((project) => (
            <ProjectCard
              key={project.slug}
              href={`/projects/${project.slug}`}
              image={project.image}
              imageAlt={`${project.title} preview`}
              title={project.title}
              description={project.description}
              tags={project.tags}
              status={project.status}
              externalHref={project.liveUrl}
              externalLabel={`Open ${project.title} live`}
              onCardClick={() =>
                trackEvent('project_card_click', {
                  slug: project.slug,
                  collection: 'projects',
                  title: project.title,
                })
              }
              onExternalClick={() =>
                trackEvent('outbound_click', {
                  url: project.liveUrl ?? '',
                  context: 'content_external_link',
                  label: `Open ${project.title} live`,
                })
              }
            />
          ))}
        </div>

        <div className="mt-8 flex justify-center lg:mt-10">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 rounded-full border border-teal-secondary px-6 py-2.5 text-sm font-semibold text-teal-secondary transition hover:bg-teal-secondary hover:text-white lg:px-7 lg:py-3 lg:text-[0.92rem]"
          >
            See all projects
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
