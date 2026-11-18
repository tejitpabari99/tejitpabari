// Shared search + tag filter + card list + empty state, used by main
// /projects and the healthtech/nonprofit homes.
import { SearchFilter } from '@/components/SearchFilter';
import { EmptyState } from '@/components/EmptyState';
import { ProjectListCard } from '@/components/ProjectListCard';
import { useCollectionFilter } from '@/hooks/useCollectionFilter';
import { trackEvent } from '@/lib/analytics';
import type { Project } from '@/data';

interface ProjectListSectionProps {
  items: Project[];
  /** Pass each project's `live` config to its card. Main /projects only. @default false */
  withLive?: boolean;
}

export function ProjectListSection({ items, withLive = false }: ProjectListSectionProps) {
  const { query, setQuery, activeTag, setActiveTag, results, allTags } =
    useCollectionFilter({ items, collection: 'projects' });

  return (
    <>
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
              live={withLive ? project.live : undefined}
              slug={project.slug}
              collection="projects"
              onCardClick={() =>
                trackEvent('project_card_click', { slug: project.slug, collection: 'projects', title: project.title })
              }
            />
          ))
        )}
      </div>
    </>
  );
}
