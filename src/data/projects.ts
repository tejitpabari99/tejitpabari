// src/data/projects.ts
import matter from 'gray-matter';
import {
  type Link,
  assertNoUnknownKeys,
  assertSlugMatchesFilename,
  assertRequiredString,
  assertTags,
  assertOptionalStatus,
  assertLinks,
  normalizeDateField,
  assertAbsoluteUrl,
  assertImagePath,
} from './shared';

export type ProjectStatus = 'Building' | 'Not Started' | 'Completed';
export type ProjectTag = 'Health Tech' | 'Developer Tools' | 'Others';

export type Project = {
  slug: string;
  title: string;
  description: string;
  image: string;
  tags: ProjectTag[];
  status?: ProjectStatus;
  liveUrl?: string;
  links: Link[];
  date: string;
  body: string;
  demo?: true;
};

const ALLOWED_KEYS = ['slug', 'title', 'description', 'image', 'tags', 'status', 'liveUrl', 'links', 'date', 'body', 'demo'];
const PROJECT_TAGS: readonly ProjectTag[] = ['Health Tech', 'Developer Tools', 'Others'];
const PROJECT_STATUSES: readonly ProjectStatus[] = ['Building', 'Not Started', 'Completed'];

export function parseProject(path: string, raw: string): Project {
  const filenameSlug = path.split('/').pop()!.replace(/\.md$/, '');
  const { data, content } = matter(raw);
  assertNoUnknownKeys(path, data, ALLOWED_KEYS);
  const slug = assertSlugMatchesFilename(path, filenameSlug, data);
  const title = assertRequiredString(path, 'title', data.title);
  const description = assertRequiredString(path, 'description', data.description);
  const image = assertImagePath(path, data.image);
  const tags = assertTags(path, data.tags, PROJECT_TAGS) as ProjectTag[];
  const status = assertOptionalStatus(path, data.status, PROJECT_STATUSES) as ProjectStatus | undefined;
  const liveUrl = data.liveUrl !== undefined ? assertAbsoluteUrl(path, 'liveUrl', data.liveUrl) : undefined;
  const links = assertLinks(path, data.links);
  const date = normalizeDateField(path, 'date', data.date);
  if (data.demo !== undefined && data.demo !== true) {
    throw new Error(`${path}: "demo" must be exactly \`true\` if present, or omitted entirely.`);
  }
  return { slug, title, description, image, tags, status, liveUrl, links, date, body: content.trim(), demo: data.demo as true | undefined };
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

export type LiveMode = { mode: 'redirect'; target: string } | { mode: 'hosted' };

export function liveMode(project: Project): LiveMode {
  return project.liveUrl ? { mode: 'redirect', target: project.liveUrl } : { mode: 'hosted' };
}
