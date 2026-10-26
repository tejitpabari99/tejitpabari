// src/pages/ResearchDetailPage.tsx
import { useParams } from 'react-router-dom';
import { DetailHeader } from '@/components/DetailHeader';
import { LinksRow } from '@/components/LinksRow';
import { ContentBody } from '@/data/ContentBody';
import { RouteMeta } from '@/components/RouteMeta';
import { PageContainer } from '@/layout/PageContainer';
import { research } from '@/data';
import { NotFoundPage } from './NotFoundPage';

export function ResearchDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const item = research.find((r) => r.slug === slug);
  if (!item) return <NotFoundPage />;

  return (
    <PageContainer as="article">
      {/* image is the build-generated OG card path, NOT item.image (the
          frontmatter placeholder/thumbnail used below in DetailHeader) -
          same fix as ProjectDetailPage, PRD §4.5/§9. `date` is a required
          frontmatter field, formatted as a full ISO-8601 timestamp for
          article:published_time - not an invented date. */}
      <RouteMeta
        title={item.title}
        description={item.description}
        path={`/research/${item.slug}`}
        image={`/og/research/${item.slug}.png`}
        imageAlt={`${item.title} research preview image`}
        type="article"
        publishedTime={`${item.date}T00:00:00.000Z`}
      />
      <DetailHeader image={item.image} imageAlt={`${item.title} preview`} title={item.title} status={item.status} tags={item.tags} techTags={item.techTags} />
      <p className="mt-4 max-w-[52rem] text-[0.98rem] leading-7 text-body">{item.description}</p>
      <LinksRow links={item.links} />
      <ContentBody body={item.body} />
    </PageContainer>
  );
}
