// src/pages/ResearchLivePage.tsx
//
// Same contract as ProjectLivePage (see that file's header comment for the
// full reasoning) - the dispatch point for /research/:slug/live, applied
// to the research collection instead of projects.
import { useParams } from 'react-router-dom';
import { research } from '@/data';
import { LiveRedirectFallback } from '@/components/LiveRedirectFallback';
import { RouteMeta } from '@/components/RouteMeta';
import { HOSTED_LIVE_PAGES } from './live/registry';
import { NotFoundPage } from './NotFoundPage';

export function ResearchLivePage() {
  const { slug } = useParams<{ slug: string }>();
  const item = slug ? research.find((r) => r.slug === slug) : undefined;

  if (!item) return <NotFoundPage />;

  const live = item.live;

  if (live?.type === 'self') {
    const HostedComponent = HOSTED_LIVE_PAGES[live.page];
    if (!HostedComponent) {
      throw new Error(
        `ResearchLivePage: "${live.page}" is not in HOSTED_LIVE_PAGES (src/pages/live/registry.ts). This should ` +
        'have been caught at content-parse time by assertOptionalLive (src/data/shared.ts).',
      );
    }
    return (
      <>
        <RouteMeta
          title={item.title}
          description={item.description}
          path={`/research/${item.slug}/live`}
          image={`/og/research/${item.slug}.png`}
        />
        <HostedComponent />
      </>
    );
  }

  // `label` here is the entry's own title ("Redirecting you to X…"), not
  // live.label - see ProjectLivePage's identical comment.
  if (live?.type === 'external') {
    return <LiveRedirectFallback to={live.href} label={item.title} />;
  }

  return <LiveRedirectFallback to={`/research/${item.slug}`} label={item.title} />;
}
