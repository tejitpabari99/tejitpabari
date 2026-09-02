// src/pages/ProjectsPage.tsx
import { BackButton } from '@/components/BackButton';
import { SearchFilter } from '@/components/SearchFilter';
import { EmptyState } from '@/components/EmptyState';
import { ProjectCard } from '@/components/ProjectCard'; // SP03, verbatim — no fork
import { RouteMeta } from '@/components/RouteMeta'; // SP06
import { PageContainer } from '@/layout/PageContainer';
import { useCollectionFilter } from '@/hooks/useCollectionFilter';
import { projects } from '@/data';
import { trackEvent } from '@/lib/analytics';

export function ProjectsPage() {
  const { query, setQuery, activeTag, setActiveTag, results, allTags } =
    useCollectionFilter({ items: projects, collection: 'projects' });

  return (
    <PageContainer chrome="back-only">
      <RouteMeta
        title="Projects"
        description="Health-tech and developer-tools projects, from Juno to a decade of shipped side projects."
        path="/projects"
      />
      <BackButton />
      <h1 className="mt-6 text-[1.9rem] font-extrabold tracking-tight text-ink sm:text-[2.3rem]">Projects</h1>
      <div className="mt-8">
        <SearchFilter
          query={query} onQueryChange={setQuery} tags={allTags} activeTag={activeTag}
          onTagChange={setActiveTag} resultCount={results.length}
          placeholder="Search projects by name, description, or tag"
        />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.length === 0 ? (
          <EmptyState itemLabel="projects" query={query} activeTag={activeTag}
            onClear={() => { setQuery(''); setActiveTag(null); }} />
        ) : (
          results.map((project) => (
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
                trackEvent('project_card_click', { slug: project.slug, collection: 'projects', title: project.title })
              }
              onExternalClick={() =>
                trackEvent('outbound_click', {
                  url: project.liveUrl ?? '',
                  context: 'content_external_link', // renamed enum value, PRD §4.4/§9
                  label: `Open ${project.title} live`,
                })
              }
            />
          ))
        )}
      </div>
    </PageContainer>
  );
}
