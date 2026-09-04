// src/pages/ProjectLivePage.tsx
//
// Round 3.1 restoration of the /live subsystem (see
// .dev/website-revamp-r3/CONTENT-AUTHORING.md's "The `live` field"
// section). The dispatch point for /projects/:slug/live - every real
// project slug is enumerated by getStaticPaths (src/routes.tsx), so this
// route always resolves to a real, known project at build time; this
// component only decides WHAT to render for it, based on that project's
// (optional) `live` field:
//   - live.type === 'self'    -> render the registered hosted component
//   - live.type === 'external' -> client-side redirect fallback to href
//   - no `live` field at all   -> client-side redirect fallback to the
//                                  project's own detail page (the
//                                  guaranteed-URL behavior: a shared
//                                  /live link must never dead-end)
// On a real deployed hit, the external/no-field cases never actually
// reach this component for a fresh visitor: vite.config.ts's
// live-redirects plugin already wrote a 301 for these exact paths into
// firebase.json at build time, so Firebase Hosting intercepts the request
// before any HTML (prerendered or otherwise) is even served. This
// component's redirect branches exist for the environments with no
// Hosting layer in front (`npm run dev`, `vite preview`) and for
// client-side navigation to a /live path after hydration.
import { useParams } from 'react-router-dom';
import { projects } from '@/data';
import { LiveRedirectFallback } from '@/components/LiveRedirectFallback';
import { RouteMeta } from '@/components/RouteMeta';
import { HOSTED_LIVE_PAGES } from './live/registry';
import { NotFoundPage } from './NotFoundPage';

export function ProjectLivePage() {
  const { slug } = useParams<{ slug: string }>();
  const project = slug ? projects.find((p) => p.slug === slug) : undefined;

  // Unreachable via getStaticPaths (only real project slugs are ever
  // prerendered), but a hand-typed/stale URL can still hit this
  // client-side after hydration.
  if (!project) return <NotFoundPage />;

  const live = project.live;

  if (live?.type === 'self') {
    const HostedComponent = HOSTED_LIVE_PAGES[live.page];
    // Guaranteed defined: src/data/shared.ts's assertOptionalLive already
    // validated "page" against this exact registry, by exactly this key,
    // at content-parse time - see that function's own comment. This throw
    // is defense-in-depth for a scenario that shouldn't be reachable in a
    // real build, not the primary validation path.
    if (!HostedComponent) {
      throw new Error(
        `ProjectLivePage: "${live.page}" is not in HOSTED_LIVE_PAGES (src/pages/live/registry.ts). This should ` +
        'have been caught at content-parse time by assertOptionalLive (src/data/shared.ts).',
      );
    }
    return (
      <>
        <RouteMeta
          title={project.title}
          description={project.description}
          path={`/projects/${project.slug}/live`}
          image={`/og/projects/${project.slug}.png`}
        />
        <HostedComponent />
      </>
    );
  }

  // `label` here is the project's own title ("Redirecting you to Juno…"),
  // not live.label - live.label/live.icon only style the detail page's
  // Live BUTTON (see LinksRow), a separate concern from what this
  // fallback page says about where it's sending the visitor.
  if (live?.type === 'external') {
    return <LiveRedirectFallback to={live.href} label={project.title} />;
  }

  // No `live` field at all.
  return <LiveRedirectFallback to={`/projects/${project.slug}`} label={project.title} />;
}
