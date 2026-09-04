// src/pages/ProjectLivePage.tsx
//
// Round 3.1 restoration of the /live subsystem, revised in round 3.3 (see
// .dev/website-revamp-r3/CONTENT-AUTHORING.md's "The `live` field"
// section for the full resolution rules). The dispatch point for
// /projects/:slug/live - every real project slug is enumerated by
// getStaticPaths (src/routes.tsx), so this route always resolves to a
// real, known project at build time; this component only decides WHAT to
// render for it, via src/lib/resolveLiveLinks.ts's resolveLiveTarget
// (the single shared implementation of the three-rule resolution order,
// also used by vite.config.ts's build-time redirect generator so both
// agree):
//   - mode: 'self'     -> render the registered hosted component in-site
//   - mode: 'redirect' -> client-side redirect fallback to the resolved
//                         destination (an external live.href, a links[]
//                         entry's href, or the project's own detail page
//                         - resolveLiveTarget picks whichever rule
//                         applies; the guaranteed-URL behavior means a
//                         shared /live link must never dead-end)
// On a real deployed hit, every redirect case never actually reaches this
// component for a fresh visitor: vite.config.ts's live-redirects plugin
// already wrote a 301 for these exact paths into firebase.json at build
// time, so Firebase Hosting intercepts the request before any HTML
// (prerendered or otherwise) is even served. This component's redirect
// branch exists for the environments with no Hosting layer in front
// (`npm run dev`, `vite preview`) and for client-side navigation to a
// /live path after hydration.
import { useParams } from 'react-router-dom';
import { projects } from '@/data';
import { LiveRedirectFallback } from '@/components/LiveRedirectFallback';
import { RouteMeta } from '@/components/RouteMeta';
import { resolveLiveTarget } from '@/lib/resolveLiveLinks';
import { HOSTED_LIVE_PAGES } from './live/registry';
import { NotFoundPage } from './NotFoundPage';

export function ProjectLivePage() {
  const { slug } = useParams<{ slug: string }>();
  const project = slug ? projects.find((p) => p.slug === slug) : undefined;

  // Unreachable via getStaticPaths (only real project slugs are ever
  // prerendered), but a hand-typed/stale URL can still hit this
  // client-side after hydration.
  if (!project) return <NotFoundPage />;

  const target = resolveLiveTarget({ live: project.live, links: project.links, slug: project.slug, collection: 'projects' });

  if (target.mode === 'self') {
    const HostedComponent = HOSTED_LIVE_PAGES[target.page];
    // Guaranteed defined: src/data/shared.ts's assertOptionalLive already
    // validated "page" against this exact registry, by exactly this key,
    // at content-parse time - see that function's own comment. This throw
    // is defense-in-depth for a scenario that shouldn't be reachable in a
    // real build, not the primary validation path.
    if (!HostedComponent) {
      throw new Error(
        `ProjectLivePage: "${target.page}" is not in HOSTED_LIVE_PAGES (src/pages/live/registry.ts). This should ` +
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
          imageAlt={`${project.title} project preview image`}
          type="article"
          publishedTime={`${project.date}T00:00:00.000Z`}
        />
        <HostedComponent />
      </>
    );
  }

  // `label` here is the project's own title ("Redirecting you to Juno…"),
  // regardless of which rule produced `target.destination` - a stable,
  // human-readable description of where the visitor is headed, not any
  // button label from `live` or `links[]`.
  //
  // RouteMeta here too, not just on the 'self' branch above: on a real
  // deployed hit this HTML is never served (Firebase's 301, per this
  // file's header comment, intercepts first) — but `npm run dev`/`vite
  // preview` and a client-side navigation post-hydration both DO render
  // this branch directly, and until SP08's fix below this landed with a
  // completely bare <head> (no <title> at all, not even a generic one) -
  // a real coverage gap for "every route renders RouteMeta" given
  // HOSTED_LIVE_PAGES is empty today, so every current /live URL takes
  // this branch, not the 'self' one above.
  return (
    <>
      <RouteMeta
        title={project.title}
        description={project.description}
        path={`/projects/${project.slug}/live`}
        image={`/og/projects/${project.slug}.png`}
        imageAlt={`${project.title} project preview image`}
        type="article"
        publishedTime={`${project.date}T00:00:00.000Z`}
      />
      <LiveRedirectFallback to={target.destination} label={project.title} />
    </>
  );
}
