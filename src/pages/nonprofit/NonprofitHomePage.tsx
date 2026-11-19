// src/pages/nonprofit/NonprofitHomePage.tsx
import { RouteMeta } from '@/components/RouteMeta';
import { NonprofitHero } from '@/sections/nonprofit/NonprofitHero';
import { ConsultationStatement } from '@/sections/nonprofit/ConsultationStatement';
import { ServicesCards } from '@/sections/nonprofit/ServicesCards';
import { ProjectListSection } from '@/sections/ProjectListSection';
import { projectsForSite } from '@/data';
import { PROJECTS_HEADING, PROJECTS_SUBTITLE, ROUTE_META } from '@/config/nonprofit';

export function NonprofitHomePage() {
  return (
    <>
      <RouteMeta title={ROUTE_META.home.title} description={ROUTE_META.home.description} path="/" suffix={false} />
      <NonprofitHero />
      <ConsultationStatement />
      <ServicesCards />
      <section className="px-8 pb-20 pt-12 md:px-10 lg:px-12">
        <div className="mx-auto w-full max-w-content">
          <h2 id="projects" className="scroll-mt-24 text-[1.5rem] font-extrabold tracking-tight text-ink sm:text-[1.8rem]">{PROJECTS_HEADING}</h2>
          <p className="mt-2 text-[0.94rem] leading-7 text-body">{PROJECTS_SUBTITLE}</p>
          <ProjectListSection items={projectsForSite('nonprofit')} />
        </div>
      </section>
    </>
  );
}
