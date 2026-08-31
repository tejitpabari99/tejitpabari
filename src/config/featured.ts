// src/config/featured.ts
import { projects, type Project } from '@/data';

export const MAX_FEATURED = 6;

// Ordered, up to 6 slugs — the single source of truth for the landing
// page's featured Projects section. Author edits this array directly;
// nothing else controls what's featured or in what order.
//
// Ordering-dependency note: SP02 authors this pipeline before SP07 authors
// the real content, so src/content/projects/ is currently empty. The three
// slugs below are unknown against zero real projects, which means any
// import of this module (and therefore of featuredProjects below) throws
// until SP07's matching project files land. This is expected and
// intentional — see 02-content-pipeline TASKS.md Task 9 / PRD §4.6 — and is
// harmless today because nothing yet imports this module (SP03, which
// consumes featuredProjects on the landing page, hasn't wired it up yet).
export const FEATURED_PROJECT_SLUGS: string[] = [
  'juno',
  'smarttest',
  'med-doc-tracker',
];

export function computeFeatured(all: Project[], slugs: string[]): Project[] {
  if (slugs.length > MAX_FEATURED) {
    throw new Error(`src/config/featured.ts: FEATURED_PROJECT_SLUGS has ${slugs.length} entries, max is ${MAX_FEATURED}.`);
  }
  const uniqueSlugs = [...new Set(slugs)];
  if (uniqueSlugs.length !== slugs.length) {
    throw new Error(`src/config/featured.ts: FEATURED_PROJECT_SLUGS contains a duplicate slug.`);
  }

  const featured: Project[] = [];
  for (const slug of uniqueSlugs) {
    const project = all.find((p) => p.slug === slug);
    if (!project) {
      throw new Error(`src/config/featured.ts: unknown project slug "${slug}" — no file at src/content/projects/${slug}.md.`);
    }
    featured.push(project);
  }

  const remainingSlots = MAX_FEATURED - featured.length;
  if (remainingSlots > 0) {
    const backfill = all
      .filter((p) => !uniqueSlugs.includes(p.slug))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, remainingSlots);
    featured.push(...backfill);
  }

  return featured;
}

// Pre-computed and validated at import time — a bad slug fails the build the
// moment anything imports this module, not lazily when the landing page
// happens to render.
export const featuredProjects: Project[] = computeFeatured(projects, FEATURED_PROJECT_SLUGS);
