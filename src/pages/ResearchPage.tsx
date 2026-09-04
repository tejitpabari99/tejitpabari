// src/pages/ResearchPage.tsx
import { SearchFilter } from '@/components/SearchFilter';
import { EmptyState } from '@/components/EmptyState';
import { ProjectListCard } from '@/components/ProjectListCard'; // round 3: same shared list-card, no fork
import { RouteMeta } from '@/components/RouteMeta'; // SP06
import { PageContainer } from '@/layout/PageContainer';
import { useCollectionFilter } from '@/hooks/useCollectionFilter';
import { research } from '@/data';
import { trackEvent } from '@/lib/analytics';

export function ResearchPage() {
  const { query, setQuery, activeTag, setActiveTag, results, allTags } =
    useCollectionFilter({ items: research, collection: 'research' });

  return (
    <PageContainer>
      <RouteMeta
        title="Research"
        description="Published and presented research, from flood-event NLP to a Google Science Fair project."
        path="/research"
      />
      <h1 className="mt-6 text-[1.9rem] font-extrabold tracking-tight text-ink sm:text-[2.3rem]">Research</h1>
      <div className="mt-8">
        <SearchFilter
          query={query} onQueryChange={setQuery} tags={allTags} activeTag={activeTag}
          onTagChange={setActiveTag} resultCount={results.length}
          placeholder="Search research by title, topic, or tag"
        />
      </div>
      <div className="mt-8 flex flex-col gap-4 sm:gap-5">
        {results.length === 0 ? (
          <EmptyState itemLabel="research entries" query={query} activeTag={activeTag}
            onClear={() => { setQuery(''); setActiveTag(null); }} />
        ) : (
          results.map((item) => (
            <ProjectListCard
              key={item.slug}
              href={`/research/${item.slug}`}
              image={item.image}
              imageAlt={`${item.title} preview`}
              title={item.title}
              description={item.description}
              tags={item.tags}
              techTags={item.techTags}
              status={item.status}
              links={item.links}
              live={item.live}
              slug={item.slug}
              collection="research"
              onCardClick={() =>
                trackEvent('project_card_click', { slug: item.slug, collection: 'research', title: item.title })
              }
            />
          ))
        )}
      </div>
    </PageContainer>
  );
}
