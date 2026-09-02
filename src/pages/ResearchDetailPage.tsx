// src/pages/ResearchDetailPage.tsx
import { useParams } from 'react-router-dom';
import { BackButton } from '@/components/BackButton';
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
    <PageContainer as="article" chrome="full">
      {/* image is the build-generated OG card path, NOT item.image (the
          frontmatter placeholder/thumbnail used below in DetailHeader) —
          same fix as ProjectDetailPage, PRD §4.5/§9. */}
      <RouteMeta title={item.title} description={item.description} path={`/research/${item.slug}`} image={`/og/research/${item.slug}.png`} />
      <BackButton />
      <DetailHeader image={item.image} imageAlt={`${item.title} preview`} title={item.title} status={item.status} tags={item.tags} />
      <p className="mt-4 max-w-[52rem] text-[0.98rem] leading-7 text-body">{item.description}</p>
      <LinksRow links={item.links} />
      <ContentBody body={item.body} />
    </PageContainer>
  );
}
