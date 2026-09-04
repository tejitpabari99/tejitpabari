import { Link } from 'react-router-dom';
import { ProjectCard } from '@/components/ProjectCard';
import { ArrowIcon } from '@/components/icons/ArrowIcon';
import { featuredProjects } from '@/config/featured';
import { trackEvent } from '@/lib/analytics';
import { resolveLiveLinks } from '@/lib/resolveLiveLinks';

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
        <h2 className="mt-4 max-w-[22ch] text-balance text-[1.5rem] font-extrabold leading-[1.1] tracking-tight text-ink sm:max-w-none sm:whitespace-nowrap sm:text-[clamp(1.4rem,3.2vw,2.5rem)] sm:leading-[0.96]">
          Selected work, in health tech and beyond.
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3">
          {featuredProjects.map((project) => {
            // Round 3.2 (owner: card links surface the live link too):
            // a featured card shows at most ONE link - ProjectCard's own
            // small overlay icon-button (externalHref/externalLabel/
            // onExternalClick). When this project declares `live`, that
            // one link becomes the live link - the same shared
            // src/lib/resolveLiveLinks.ts detail pages and index cards
            // use, so label/icon inheritance and href dedupe never drift
            // between a project's featured card and its other pages. Only
            // `resolved[0]` (the live entry itself) is used here; the rest
            // of the resolved list (any remaining links[] entries) has no
            // slot on this card and is intentionally not shown. When the
            // project has no `live` field at all, `liveLink` stays
            // undefined and the card shows no overlay, exactly as before.
            const liveLink = project.live
              ? resolveLiveLinks({ live: project.live, links: project.links, slug: project.slug, collection: 'projects' })[0]
              : undefined;

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
                externalHref={liveLink?.href}
                externalLabel={liveLink ? `Open ${project.title} live` : undefined}
                onCardClick={() =>
                  trackEvent('project_card_click', {
                    slug: project.slug,
                    collection: 'projects',
                    title: project.title,
                  })
                }
                onExternalClick={
                  liveLink
                    ? () => trackEvent('live_link_click', { url: liveLink.href, label: liveLink.label })
                    : undefined
                }
              />
            );
          })}
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
