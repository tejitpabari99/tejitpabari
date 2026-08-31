// src/pages/live/registry.ts
//
// THE convention for adding a new hosted (non-redirect) mini-project at
// /projects/<slug>/live:
//   1. Write src/content/projects/<slug>.md with NO liveUrl field.
//   2. Write src/pages/live/<slug>.tsx, exporting one component with zero
//      required props (ProjectLivePage renders it with none).
//   3. Add exactly one line to HOSTED_LIVE_PAGES below.
// That's the whole surface. Everything else (routing, RouteMeta, the "no
// forms" check) is generic and already wired to this registry.
import type { ComponentType } from 'react';
import type { Project } from '@/data';
import { projects } from '@/data';
import SampleProjectLive from './sample-project';

export const HOSTED_LIVE_PAGES: Record<string, ComponentType> = {
  'sample-project': SampleProjectLive,
};

/** Redirect-XOR-hosted cross-check, exported and parameterized for testing. */
export function validateLiveRegistry(hostedSlugs: string[], allProjects: Project[]): void {
  for (const slug of hostedSlugs) {
    const project = allProjects.find((p) => p.slug === slug);
    if (!project) {
      throw new Error(
        `src/pages/live/registry.ts: HOSTED_LIVE_PAGES registers "${slug}" but no ` +
        `src/content/projects/${slug}.md exists.`,
      );
    }
    if (project.liveUrl) {
      throw new Error(
        `src/pages/live/registry.ts: "${slug}" has BOTH liveUrl set in its frontmatter ` +
        `AND a HOSTED_LIVE_PAGES entry — pick exactly one mode (redirect XOR hosted). ` +
        `Remove liveUrl from the file, or remove this registry entry.`,
      );
    }
  }
}

/** The union getStaticPaths needs, exported and parameterized for testing. */
export function computeProjectLiveSlugs(hostedSlugs: string[], allProjects: Project[]): string[] {
  return allProjects.filter((p) => p.liveUrl || hostedSlugs.includes(p.slug)).map((p) => p.slug);
}

const HOSTED_SLUGS = Object.keys(HOSTED_LIVE_PAGES);

// Eager, module-load time — runs the moment anything imports this module
// (routes.tsx always does), so a bad wiring fails the build immediately.
validateLiveRegistry(HOSTED_SLUGS, projects);

export const projectLiveSlugs: string[] = computeProjectLiveSlugs(HOSTED_SLUGS, projects);

/** Used by ProjectDetailPage's LinksRow to decide whether to render the
 *  "Open Live" CTA at all. */
export function hasLiveRoute(slug: string): boolean {
  return projectLiveSlugs.includes(slug);
}
