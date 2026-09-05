// src/content/research/index.ts
// Same contract as src/content/projects/index.ts: keep exporting
// `researchSlugs: string[]` from this exact path — src/routes.tsx imports
// it directly for getStaticPaths.
//
// Real slugs come from src/data/research.ts's gray-matter loader (the
// authoritative parsed list of src/content/research/*.md). This file was
// previously a placeholder hardcoded to `[]`, which meant getStaticPaths
// for /research/:slug always resolved to zero paths and no research detail
// page was ever prerendered.
import { research } from '@/data/research';

export const researchSlugs: string[] = research.map((item) => item.slug);
