// src/pages/NotFoundPage.tsx
import { Link, useLocation } from 'react-router-dom';
import { RouteMeta } from '@/components/RouteMeta'; // SP06
import { PageContainer } from '@/layout/PageContainer';

export function NotFoundPage() {
  // `path: '*'` is never enumerated by getStaticPaths (SP01 §4.7), so this
  // component is never itself prerendered - a crawler never receives this
  // HTML; every bad URL is served `/`'s prerendered index.html and only
  // swaps to NotFoundPage after client hydration (PRD 06 §4.5). So there is
  // no fixed canonical URL for "the" 404 page to declare; the real
  // pathname the visitor landed on (via useLocation) is the closest correct
  // stand-in for RouteMeta's required `path` prop, rather than a fabricated
  // static route.
  //
  // Round 3 added one exception to the paragraph above: an enumerable
  // `path: '404'` route (see routes.tsx and
  // .dev/website-revamp-r3/BUGFIX-NOTES.md) that DOES get prerendered, on
  // purpose, purely so vite-react-ssg produces a real dist/404/index.html
  // for Firebase Hosting's automatic 404 fallback. A real visitor's typo'd
  // URL still takes the client-side `path: '*'` catch-all path described
  // above, not this one; `/404` itself is only ever hit by Firebase's own
  // fallback mechanism or someone typing it directly.
  //
  // KNOWN LIMITATION: RouteMeta has no way to emit `<meta name="robots"
  // content="noindex">`, which is what a genuine 404 should carry instead
  // of a canonical link - this call still emits `<link rel="canonical">`
  // pointing at whatever bad URL the visitor typed, which is not truly
  // canonicalizable content. In practice this has no real indexing impact
  // (no crawler ever sees this markup server-side, per the paragraph
  // above), but it is not a fully correct noindex signal. Flagged here per
  // PRD 06 §6/§9 rather than silently treating this route as indexable.
  const location = useLocation();

  return (
    <PageContainer className="flex flex-col items-center gap-4 text-center">
      <RouteMeta
        title="Page Not Found"
        description="That page doesn't exist. Head back to the homepage."
        path={location.pathname}
      />
      <h1 className="text-2xl font-bold text-ink">Page not found</h1>
      <p className="text-body">The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.</p>
      {/* Round 3 (owner: "Remove back from all places ... navbar is good
          enough"): not a Back button - a genuine destination. Nav (now
          always rendered, see PageShell.tsx) already offers a way out;
          this is a second, explicit exit affordance right at the point of
          the error, not a duplicate of "Back". */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-secondary transition hover:text-teal"
      >
        Go to homepage
      </Link>
    </PageContainer>
  );
}
