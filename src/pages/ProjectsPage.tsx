// src/pages/ProjectsPage.tsx
import { SearchFilter } from '@/components/SearchFilter';
import { EmptyState } from '@/components/EmptyState';
import { ProjectListCard } from '@/components/ProjectListCard'; // round 3: replaces the ProjectCard grid
import { RouteMeta } from '@/components/RouteMeta'; // SP06
import { PageContainer } from '@/layout/PageContainer';
import { useCollectionFilter } from '@/hooks/useCollectionFilter';
import { projects } from '@/data';
import { trackEvent } from '@/lib/analytics';

export function ProjectsPage() {
  const { query, setQuery, activeTag, setActiveTag, results, allTags } =
    useCollectionFilter({ items: projects, collection: 'projects' });

  return (
    <PageContainer>
      <RouteMeta
        title="Projects"
        description="Health-tech and developer-tools projects, from Juno to a decade of shipped side projects."
        path="/projects"
      />
      <h1 className="mt-6 text-[1.9rem] font-extrabold tracking-tight text-ink sm:text-[2.3rem]">Projects</h1>
      <div className="mt-8">
        <SearchFilter
          query={query} onQueryChange={setQuery} tags={allTags} activeTag={activeTag}
          onTagChange={setActiveTag} resultCount={results.length}
          placeholder="Search projects by name, description, or tag"
        />
      </div>
      {/* A list of wide horizontal cards, not a grid (owner: "image on
          left and then a card that spans horizontally ... a list of
          cards, instead of a grid of 3 per row"). */}
      <div className="mt-8 flex flex-col gap-4 sm:gap-5">
        {results.length === 0 ? (
          <EmptyState itemLabel="projects" query={query} activeTag={activeTag}
            onClear={() => { setQuery(''); setActiveTag(null); }} />
        ) : (
          results.map((project) => (
            <ProjectListCard
              key={project.slug}
              href={`/projects/${project.slug}`}
              image={project.image}
              imageAlt={`${project.title} preview`}
              title={project.title}
              description={project.description}
              tags={project.tags}
              techTags={project.techTags}
              status={project.status}
              links={project.links}
              onCardClick={() =>
                trackEvent('project_card_click', { slug: project.slug, collection: 'projects', title: project.title })
              }
            />
          ))
        )}
      </div>
    </PageContainer>
  );
}
