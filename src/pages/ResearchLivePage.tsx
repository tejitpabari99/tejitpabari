// src/pages/ResearchLivePage.tsx
//
// Same contract as ProjectLivePage (see that file's header comment for the
// full reasoning) - the dispatch point for /research/:slug/live, applied
// to the research collection instead of projects.
import { useParams } from 'react-router-dom';
import { research } from '@/data';
import { LiveRedirectFallback } from '@/components/LiveRedirectFallback';
import { RouteMeta } from '@/components/RouteMeta';
import { resolveLiveTarget } from '@/lib/resolveLiveLinks';
import { HOSTED_LIVE_PAGES } from './live/registry';
import { NotFoundPage } from './NotFoundPage';

export function ResearchLivePage() {
  const { slug } = useParams<{ slug: string }>();
  const item = slug ? research.find((r) => r.slug === slug) : undefined;

  if (!item) return <NotFoundPage />;

  const target = resolveLiveTarget({ live: item.live, links: item.links, slug: item.slug, collection: 'research' });

  if (target.mode === 'self') {
    const HostedComponent = HOSTED_LIVE_PAGES[target.page];
    if (!HostedComponent) {
      throw new Error(
        `ResearchLivePage: "${target.page}" is not in HOSTED_LIVE_PAGES (src/pages/live/registry.ts). This should ` +
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

  return <LiveRedirectFallback to={target.destination} label={item.title} />;
}
