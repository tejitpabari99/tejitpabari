// src/content/projects/index.ts
// Contract: keep exporting `projectSlugs: string[]` from this exact path —
// src/routes.tsx imports it directly for getStaticPaths.
//
// Real slugs come from src/data/projects.ts's gray-matter loader (the
// authoritative parsed list of src/content/projects/*.md), the same source
// src/pages/live/registry.ts already draws on for projectLiveSlugs. This
// file was previously a placeholder hardcoded to `[]`, which meant
// getStaticPaths for /projects/:slug always resolved to zero paths and no
// project detail page was ever prerendered.
import { projects } from '@/data/projects';

export const projectSlugs: string[] = projects.map((project) => project.slug);
