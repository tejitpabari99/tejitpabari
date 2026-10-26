import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

/**
 * Fires a section-view event the first time each supplied section crosses
 * 50% viewport visibility during a page load.
 */
export function useSectionScrollDepth(sectionIds: string[]): void {
  const fired = useRef(new Set<string>());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting && !fired.current.has(id)) {
            fired.current.add(id);
            trackEvent('section_view', { section: id });
          }
        }
      },
      { threshold: 0.5 },
    );

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [sectionIds]);
}
