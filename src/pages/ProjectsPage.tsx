// src/pages/ProjectsPage.tsx
import { RouteMeta } from '@/components/RouteMeta'; // SP06
import { PageContainer } from '@/layout/PageContainer';
import { ProjectListSection } from '@/sections/ProjectListSection';
import { projects } from '@/data';

export function ProjectsPage() {
  return (
    <PageContainer>
      <RouteMeta
        title="Projects"
        description="Health-tech and developer-tools projects, from Juno to a decade of shipped side projects."
        path="/projects"
      />
      <h1 className="mt-6 text-[1.9rem] font-extrabold tracking-tight text-ink sm:text-[2.3rem]">Projects</h1>
      <ProjectListSection items={projects} withLive />
    </PageContainer>
  );
}
