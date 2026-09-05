// src/pages/ProjectDetailPage.tsx
import { useParams } from 'react-router-dom';
import { DetailHeader } from '@/components/DetailHeader';
import { LinksRow } from '@/components/LinksRow';
import { ContentBody } from '@/data/ContentBody'; // SP02
import { RouteMeta } from '@/components/RouteMeta'; // SP06
import { PageContainer } from '@/layout/PageContainer';
import { projects } from '@/data';
import { NotFoundPage } from './NotFoundPage';

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const project = projects.find((p) => p.slug === slug);

  // Unreachable via getStaticPaths (only real slugs are prerendered), but a
  // hand-edited/typo'd URL can still hit this client-side - reuse SP01's
  // real NotFoundPage rather than a second bespoke 404.
  if (!project) return <NotFoundPage />;

  return (
    <PageContainer as="article">
      <RouteMeta
        title={project.title}
        description={project.description}
        path={`/projects/${project.slug}`}
        image={`/og/projects/${project.slug}.png`}
        imageAlt={`${project.title} project preview image`}
        type="article"
        publishedTime={`${project.date}T00:00:00.000Z`}
      />
      {/* image is the build-generated OG card path, NOT project.image (the
          frontmatter placeholder/thumbnail used below in DetailHeader and on
          the card grid) - PRD §4.5/§9. `date` is a required frontmatter
          field (src/data/shared.ts's normalizeDateField) formatted as a
          full ISO-8601 timestamp for article:published_time - not an
          invented date, just the existing YYYY-MM-DD normalized to the
          timestamp shape the tag expects. */}
      <DetailHeader image={project.image} imageAlt={`${project.title} preview`} title={project.title} status={project.status} tags={project.tags} techTags={project.techTags} />
      <p className="mt-4 max-w-[52rem] text-[0.98rem] leading-7 text-body">{project.description}</p>
      <LinksRow links={project.links} />
      <ContentBody body={project.body} />
    </PageContainer>
  );
}
