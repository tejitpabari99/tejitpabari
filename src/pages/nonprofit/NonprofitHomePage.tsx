// src/pages/nonprofit/NonprofitHomePage.tsx
// Placeholder: title only. A later sub-project replaces the body without touching routes.
import { RouteMeta } from '@/components/RouteMeta';
import { PageContainer } from '@/layout/PageContainer';
import { SITE_CONFIG } from '@/config/site-target';

export function NonprofitHomePage() {
  return (
    <PageContainer>
      <RouteMeta title="Nonprofit AI" description={SITE_CONFIG.description} path="/" />
      <h1 className="text-3xl font-semibold text-teal">Nonprofit AI</h1>
    </PageContainer>
  );
}
