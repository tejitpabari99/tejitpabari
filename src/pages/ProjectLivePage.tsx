// src/pages/ProjectLivePage.tsx
import { useParams } from 'react-router-dom';
import { projects } from '@/data';
import { LiveRedirectFallback } from '@/components/LiveRedirectFallback';
import { HOSTED_LIVE_PAGES } from './live/registry';
import { NotFoundPage } from './NotFoundPage';

export function ProjectLivePage() {
  const { slug } = useParams<{ slug: string }>();
  const project = slug ? projects.find((p) => p.slug === slug) : undefined;
  const HostedComponent = slug ? HOSTED_LIVE_PAGES[slug] : undefined;

  if (HostedComponent) return <HostedComponent />;
  if (project?.liveUrl) return <LiveRedirectFallback to={project.liveUrl} label={project.title} />;

  // Reachable only via a hand-typed/stale URL for a slug with neither mode —
  // getStaticPaths (Task 14) never generates this path for such a slug.
  return <NotFoundPage />;
}
