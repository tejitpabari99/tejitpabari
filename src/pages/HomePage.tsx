import { Hero } from '@/sections/Hero';
import { FeaturedProjectsSection } from '@/sections/FeaturedProjectsSection';
import { WorkExperienceSection } from '@/sections/WorkExperienceSection';
import { AboutSection } from '@/sections/AboutSection';
import { ContactSection } from '@/sections/ContactSection';
import { useSectionScrollDepth } from '@/hooks/useSectionScrollDepth';
import { RouteMeta } from '@/components/RouteMeta'; // SP06
import { DEFAULT_DESCRIPTION } from '@/config/site';

const LANDING_SCROLL_SECTIONS = ['projects', 'work-experience', 'about', 'contact'];

export function HomePage() {
  useSectionScrollDepth(LANDING_SCROLL_SECTIONS);

  return (
    <>
      <RouteMeta title="Tejit Pabari" description={DEFAULT_DESCRIPTION} path="/" />
      <Hero />
      <FeaturedProjectsSection />
      <WorkExperienceSection />
      <AboutSection />
      <ContactSection />
    </>
  );
}
