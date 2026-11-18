// src/pages/nonprofit/NonprofitHomePage.tsx
import { RouteMeta } from '@/components/RouteMeta';
import { PageContainer } from '@/layout/PageContainer';
import { NonprofitHero } from '@/sections/nonprofit/NonprofitHero';
import { ConsultationStatement } from '@/sections/nonprofit/ConsultationStatement';
import { ServicesAccordion } from '@/sections/nonprofit/ServicesAccordion';
import { ProjectListSection } from '@/sections/ProjectListSection';
import { projectsForSite } from '@/data';
import { PROJECTS_HEADING, ROUTE_META } from '@/config/nonprofit';

export function NonprofitHomePage() {
  return (
    <>
      <RouteMeta title={ROUTE_META.home.title} description={ROUTE_META.home.description} path="/" suffix={false} />
      <NonprofitHero />
      <ConsultationStatement />
      <ServicesAccordion />
      <PageContainer>
        <h2 id="projects" className="scroll-mt-24 text-2xl font-semibold text-teal">{PROJECTS_HEADING}</h2>
        <ProjectListSection items={projectsForSite('nonprofit')} />
      </PageContainer>
    </>
  );
}
