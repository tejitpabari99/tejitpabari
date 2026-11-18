// src/pages/nonprofit/NonprofitProjectsPage.tsx
import { RouteMeta } from '@/components/RouteMeta';
import { PageContainer } from '@/layout/PageContainer';
import { ProjectListSection } from '@/sections/ProjectListSection';
import { projectsForSite } from '@/data';
import { ROUTE_META } from '@/config/nonprofit';

export function NonprofitProjectsPage() {
  return (
    <PageContainer>
      <RouteMeta title={ROUTE_META.projects.title} description={ROUTE_META.projects.description} path="/projects" suffix={false} />
      <h1 className="text-3xl font-semibold text-teal">Projects</h1>
      <ProjectListSection items={projectsForSite('nonprofit')} />
    </PageContainer>
  );
}
