// src/pages/ProjectDetailPage.tsx
import { useParams } from 'react-router-dom';
import { BackButton } from '@/components/BackButton';
import { DetailHeader } from '@/components/DetailHeader';
import { LinksRow } from '@/components/LinksRow';
import { ContentBody } from '@/data/ContentBody'; // SP02
import { RouteMeta } from '@/components/RouteMeta'; // SP06
import { projects } from '@/data';
import { NotFoundPage } from './NotFoundPage';
import { hasLiveRoute } from './live/registry';

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const project = projects.find((p) => p.slug === slug);

  // Unreachable via getStaticPaths (only real slugs are prerendered), but a
  // hand-edited/typo'd URL can still hit this client-side — reuse SP01's
  // real NotFoundPage rather than a second bespoke 404.
  if (!project) return <NotFoundPage />;

  return (
    <article className="mx-auto w-full max-w-content px-6 pb-20 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12">
      <RouteMeta
        title={project.title}
        description={project.description}
        path={`/projects/${project.slug}`}
        image={`/og/projects/${project.slug}.png`}
      />
      {/* image is the build-generated OG card path, NOT project.image (the
          frontmatter placeholder/thumbnail used below in DetailHeader and on
          the card grid) — PRD §4.5/§9. */}
      <BackButton />
      <DetailHeader image={project.image} imageAlt={`${project.title} preview`} title={project.title} status={project.status} tags={project.tags} />
      <p className="mt-4 max-w-[52rem] text-[0.98rem] leading-7 text-body">{project.description}</p>
      <LinksRow
        links={project.links}
        liveHref={hasLiveRoute(project.slug) ? `/projects/${project.slug}/live` : undefined}
      />
      <ContentBody body={project.body} />
    </article>
  );
}
