// src/pages/NotFoundPage.tsx
import { useLocation } from 'react-router-dom';
import { BackButton } from '@/components/BackButton';
import { RouteMeta } from '@/components/RouteMeta'; // SP06
import { PageContainer } from '@/layout/PageContainer';

export function NotFoundPage() {
  // `path: '*'` is never enumerated by getStaticPaths (SP01 §4.7), so this
  // component is never itself prerendered — a crawler never receives this
  // HTML; every bad URL is served `/`'s prerendered index.html and only
  // swaps to NotFoundPage after client hydration (PRD 06 §4.5). So there is
  // no fixed canonical URL for "the" 404 page to declare; the real
  // pathname the visitor landed on (via useLocation) is the closest correct
  // stand-in for RouteMeta's required `path` prop, rather than a fabricated
  // static route.
  //
  // KNOWN LIMITATION: RouteMeta has no way to emit `<meta name="robots"
  // content="noindex">`, which is what a genuine 404 should carry instead
  // of a canonical link — this call still emits `<link rel="canonical">`
  // pointing at whatever bad URL the visitor typed, which is not truly
  // canonicalizable content. In practice this has no real indexing impact
  // (no crawler ever sees this markup server-side, per the paragraph
  // above), but it is not a fully correct noindex signal. Flagged here per
  // PRD 06 §6/§9 rather than silently treating this route as indexable.
  const location = useLocation();

  return (
    <PageContainer chrome="full" className="flex flex-col items-center gap-4 text-center">
      <RouteMeta
        title="Page Not Found"
        description="That page doesn't exist. Head back to the homepage."
        path={location.pathname}
      />
      <h1 className="text-2xl font-bold text-ink">Page not found</h1>
      <p className="text-body">The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.</p>
      <BackButton />
    </PageContainer>
  );
}
