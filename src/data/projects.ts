// src/data/projects.ts
import matter from 'gray-matter';
import {
  type Link,
  type LiveConfig,
  assertNoUnknownKeys,
  assertSlugMatchesFilename,
  assertRequiredString,
  assertTags,
  assertOptionalStatus,
  assertLinks,
  assertOptionalStringArray,
  normalizeDateField,
  assertImagePath,
  assertOptionalLive,
} from './shared';
import { HOSTED_LIVE_PAGES } from '@/pages/live/registry';

export type ProjectStatus = 'Building' | 'Not Started' | 'Completed';
export type ProjectTag = 'Health Tech' | 'Developer Tools' | 'Others';

export type Project = {
  slug: string;
  title: string;
  description: string;
  image: string;
  tags: ProjectTag[];
  techTags: string[];
  status?: ProjectStatus;
  links: Link[];
  date: string;
  body: string;
  /** Round 3.1: optional "live" mapping, see src/data/shared.ts's
   *  assertOptionalLive for the full contract. `/projects/<slug>/live`
   *  always exists as a route regardless of whether this is set — see
   *  src/routes.tsx and vite.config.ts's live-redirects plugin. */
  live?: LiveConfig;
};

const ALLOWED_KEYS = ['slug', 'title', 'description', 'image', 'tags', 'techTags', 'status', 'links', 'date', 'body', 'live'];
const PROJECT_TAGS: readonly ProjectTag[] = ['Health Tech', 'Developer Tools', 'Others'];
const PROJECT_STATUSES: readonly ProjectStatus[] = ['Building', 'Not Started', 'Completed'];
// Passed into assertOptionalLive so a "live.page" typo/omission fails at
// content-parse time — see that function's own header comment for why
// this is parameterized rather than imported directly inside shared.ts.
const HOSTED_LIVE_PAGE_KEYS = Object.keys(HOSTED_LIVE_PAGES);

export function parseProject(path: string, raw: string): Project {
  const filenameSlug = path.split('/').pop()!.replace(/\.md$/, '');
  const { data, content } = matter(raw);
  assertNoUnknownKeys(path, data, ALLOWED_KEYS);
  const slug = assertSlugMatchesFilename(path, filenameSlug, data);
  const title = assertRequiredString(path, 'title', data.title);
  const description = assertRequiredString(path, 'description', data.description);
  const image = assertImagePath(path, data.image);
  const tags = assertTags(path, data.tags, PROJECT_TAGS) as ProjectTag[];
  const techTags = assertOptionalStringArray(path, 'techTags', data.techTags);
  const status = assertOptionalStatus(path, data.status, PROJECT_STATUSES) as ProjectStatus | undefined;
  const links = assertLinks(path, data.links);
  const date = normalizeDateField(path, 'date', data.date);
  const live = assertOptionalLive(path, data.live, HOSTED_LIVE_PAGE_KEYS);
  return { slug, title, description, image, tags, techTags, status, links, date, body: content.trim(), live };
}

const files = import.meta.glob('/src/content/projects/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

export const projects: Project[] = Object.entries(files)
  .map(([path, raw]) => parseProject(path, raw))
  .sort((a, b) => b.date.localeCompare(a.date));

// Defense-in-depth: given assertSlugMatchesFilename already forces every
// file's own frontmatter slug to equal its own filename, a genuine
// collision here can only arise from two different filenames whose
// filename-derived slugs happen to be textually equal, which is
// structurally impossible under slug === filename for this collection's
// naming rule. Kept anyway as a cheap, explicit guard rather than a
// silent assumption.
const seenProjectSlugs = new Set<string>();
for (const p of projects) {
  if (seenProjectSlugs.has(p.slug)) {
    throw new Error(`Duplicate slug "${p.slug}" across multiple files in src/content/projects/. Slugs must be unique.`);
  }
  seenProjectSlugs.add(p.slug);
}
