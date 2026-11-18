// src/pages/nonprofit/NonprofitProjectsPage.tsx
// Placeholder: title only. A later sub-project replaces the body without touching routes.
import { RouteMeta } from '@/components/RouteMeta';
import { PageContainer } from '@/layout/PageContainer';
import { SITE_CONFIG } from '@/config/site-target';

export function NonprofitProjectsPage() {
  return (
    <PageContainer>
      <RouteMeta title="Projects" description={SITE_CONFIG.description} path="/projects" />
      <h1 className="text-3xl font-semibold text-teal">Projects</h1>
    </PageContainer>
  );
}
