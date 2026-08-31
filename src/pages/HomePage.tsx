import { Hero } from '@/sections/Hero';
import { FeaturedProjectsSection } from '@/sections/FeaturedProjectsSection';
import { WorkExperienceSection } from '@/sections/WorkExperienceSection';
import { AboutSection } from '@/sections/AboutSection';
import { ContactSection } from '@/sections/ContactSection';
import { useSectionScrollDepth } from '@/hooks/useSectionScrollDepth';

const LANDING_SCROLL_SECTIONS = ['projects', 'work-experience', 'about', 'contact'];

export function HomePage() {
  useSectionScrollDepth(LANDING_SCROLL_SECTIONS);

  return (
    <>
      <Hero />
      <FeaturedProjectsSection />
      <WorkExperienceSection />
      <AboutSection />
      <ContactSection />
    </>
  );
}
