// src/pages/healthtech/HealthtechHomePage.tsx
// Hero plus the full health project list (MITI and Onolys pinned first, then newest first via projectsForSite).
import { RouteMeta } from '@/components/RouteMeta';
import { PageContainer } from '@/layout/PageContainer';
import { HealthtechHero, HEALTHTECH_HERO_COPY } from '@/sections/HealthtechHero';
import { ProjectListSection } from '@/sections/ProjectListSection';
import { projectsForSite } from '@/data';

// Full hero copy; under 160 characters.
const DESCRIPTION = HEALTHTECH_HERO_COPY;

export function HealthtechHomePage() {
  return (
    <>
      <RouteMeta title="Tejit Pabari | Health Tech" description={DESCRIPTION} path="/" />
      <HealthtechHero />
      <PageContainer>
        <h2 id="projects" className="scroll-mt-24 text-2xl font-semibold text-teal">All projects</h2>
        <ProjectListSection items={projectsForSite('healthtech')} />
      </PageContainer>
    </>
  );
}
