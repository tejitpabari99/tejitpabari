// src/pages/nonprofit/SchedulePage.tsx
// Placeholder: title only. A later sub-project replaces the body without touching routes.
import { RouteMeta } from '@/components/RouteMeta';
import { PageContainer } from '@/layout/PageContainer';
import { SITE_CONFIG } from '@/config/site-target';

export function SchedulePage() {
  return (
    <PageContainer>
      <RouteMeta title="Schedule" description={SITE_CONFIG.description} path="/schedule" />
      <h1 className="text-3xl font-semibold text-teal">Schedule</h1>
    </PageContainer>
  );
}
