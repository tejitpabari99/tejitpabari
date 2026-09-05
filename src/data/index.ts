// src/data/index.ts
import { projects, type Project } from './projects';
import { research, type Research } from './research';
import { workExperience, type WorkExperience } from './workExperience';
import { NAV_LINKS, FOOTER_LINKS } from '@/config/links';
import { isExternalUrl } from '@/lib/isExternalUrl';
import type { Link } from './shared';

export * from './projects';
export * from './research';
export * from './workExperience';
export type { Link, LiveConfig } from './shared';

export const KNOWN_STATIC_ROUTES = ['/', '/projects', '/research', '/work-experience', '/privacy', '/terms'];

export function validateInternalLinks(projects: Project[], research: Research[], workExperience: WorkExperience[]): void {
  const projectSlugs = new Set(projects.map((p) => p.slug));
  const researchSlugs = new Set(research.map((r) => r.slug));

  const allLinkSources: { path: string; links: Link[] }[] = [
    ...projects.map((p) => ({ path: `src/content/projects/${p.slug}.md`, links: p.links })),
    ...research.map((r) => ({ path: `src/content/research/${r.slug}.md`, links: r.links })),
    ...workExperience.map((w) => ({ path: `src/content/work-experience/${w.id}.md`, links: w.links })),
  ];

  for (const { path, links } of allLinkSources) {
    for (const { href } of links) {
      if (!href.startsWith('/')) continue;
      if (KNOWN_STATIC_ROUTES.includes(href)) continue;

      const projectMatch = href.match(/^\/projects\/([a-z0-9-]+)$/);
      if (projectMatch) {
        if (!projectSlugs.has(projectMatch[1])) {
          throw new Error(`${path}: link href "${href}" points at unknown project slug "${projectMatch[1]}".`);
        }
        continue;
      }
      const researchMatch = href.match(/^\/research\/([a-z0-9-]+)$/);
      if (researchMatch) {
        if (!researchSlugs.has(researchMatch[1])) {
          throw new Error(`${path}: link href "${href}" points at unknown research slug "${researchMatch[1]}".`);
        }
        continue;
      }
      throw new Error(
        `${path}: link href "${href}" looks internal (starts with "/") but doesn't match a known route pattern ` +
        `(/projects/<slug>, /research/<slug>, or a static route: ${KNOWN_STATIC_ROUTES.join(', ')}). ` +
        `Fix the typo, or extend KNOWN_STATIC_ROUTES / the pattern list in src/data/index.ts if this is a genuinely new internal route.`,
      );
    }
  }
}

export function validateNavAndFooterLinks(navLinks: Link[], footerLinks: Link[]): void {
  const allLinks = [...navLinks, ...footerLinks];
  for (const { href, label } of allLinks) {
    if (isExternalUrl(href)) continue;
    const [pathname] = href.split('#');
    if (!KNOWN_STATIC_ROUTES.includes(pathname || '/')) {
      throw new Error(
        `src/config/links.ts: "${label}" points at "${href}" (pathname "${pathname || '/'}"), which is ` +
        `not in KNOWN_STATIC_ROUTES (src/data/index.ts). Fix the typo, or add the new route to ` +
        `KNOWN_STATIC_ROUTES if it's genuine.`,
      );
    }
  }
}

validateInternalLinks(projects, research, workExperience);
validateNavAndFooterLinks(NAV_LINKS, FOOTER_LINKS);
