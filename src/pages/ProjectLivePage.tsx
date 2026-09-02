// src/pages/ProjectLivePage.tsx
import { useParams } from 'react-router-dom';
import { projects } from '@/data';
import { BackButton } from '@/components/BackButton';
import { LiveRedirectFallback } from '@/components/LiveRedirectFallback';
import { RouteMeta } from '@/components/RouteMeta'; // SP06
import { HOSTED_LIVE_PAGES } from './live/registry';
import { NotFoundPage } from './NotFoundPage';

export function ProjectLivePage() {
  const { slug } = useParams<{ slug: string }>();
  const project = slug ? projects.find((p) => p.slug === slug) : undefined;
  const HostedComponent = slug ? HOSTED_LIVE_PAGES[slug] : undefined;

  // RouteMeta only for hosted mode — redirect mode never renders this
  // page's own HTML to a real visitor (PRD §4.5), so it has nothing to
  // describe here. `project` is guaranteed defined whenever HostedComponent
  // is, since registry.ts's eager validateLiveRegistry() throws at import
  // time for any HOSTED_LIVE_PAGES slug without a matching project.
  if (HostedComponent && project) {
    return (
      <>
        <RouteMeta
          title={project.title}
          description={project.description}
          path={`/projects/${project.slug}/live`}
          image={`/og/projects/${project.slug}.png`}
        />
        <div className="mx-auto w-full max-w-content px-6 pt-8 sm:px-8 md:px-10 lg:px-12">
          <BackButton to={`/projects/${project.slug}`} />
        </div>
        <HostedComponent />
      </>
    );
  }
  if (project?.liveUrl) return <LiveRedirectFallback to={project.liveUrl} label={project.title} backTo={`/projects/${project.slug}`} />;

  // Reachable only via a hand-typed/stale URL for a slug with neither mode —
  // getStaticPaths (Task 14) never generates this path for such a slug.
  return <NotFoundPage />;
}
