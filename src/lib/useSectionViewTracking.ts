// src/lib/useSectionViewTracking.ts
import { useEffect, useRef } from 'react';
import { trackEvent } from './analytics';

const SECTION_IDS = ['projects', 'work-experience', 'about', 'contact'] as const;

/** Mount once on HomePage. Fires `section_view` the first time each of the
 *  four landing sections crosses 40% into the viewport — a reasonable proxy
 *  for "the visitor actually saw this section," which is what "scroll depth"
 *  cashes out to on a single-page landing layout like this one. */
export function useSectionViewTracking(): void {
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting && !seen.current.has(id)) {
            seen.current.add(id);
            trackEvent('section_view', { section: id });
          }
        }
      },
      { threshold: 0.4 },
    );
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);
}
