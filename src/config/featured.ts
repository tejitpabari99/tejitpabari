// src/config/featured.ts
import { projects, type Project } from '@/data';

export const MAX_FEATURED = 6;

// Ordered, exactly 6 slugs — the single source of truth for the landing
// page's featured Projects section. Author edits this array directly;
// nothing else controls what's featured or in what order.
//
// Pinned explicitly by owner decision (2026-09-01, round 2 R3 PRD §4.2),
// not date-sorted backfill. With exactly 6 slugs against MAX_FEATURED = 6,
// computeFeatured's date-descending backfill branch below can never run
// (remainingSlots = 6 - 6 = 0) — this list is the complete, final featured
// set. The landing page's featured section no longer reshuffles when a
// project is added, removed, or re-dated.
export const FEATURED_PROJECT_SLUGS: string[] = [
  'juno',
  'smarttest',
  'med-doc-tracker',
  'clip-verse',
  'columbia-virtual-campus',
  'crunchy-filler',
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
