// src/data/research.ts
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

export type ResearchTag = 'Health' | 'Machine Learning' | 'Other';
export type ResearchStatus = 'Building' | 'Not Started' | 'Completed';

export type Research = {
  slug: string;
  title: string;
  description: string;
  image: string;
  tags: ResearchTag[];
  techTags: string[];
  status?: ResearchStatus;
  links: Link[];
  date: string;
  body: string;
  /** Round 3.1: optional "live" mapping, see src/data/shared.ts's
   *  assertOptionalLive for the full contract. `/research/<slug>/live`
   *  always exists as a route regardless of whether this is set — see
   *  src/routes.tsx and vite.config.ts's live-redirects plugin. */
  live?: LiveConfig;
};

const ALLOWED_KEYS = ['slug', 'title', 'description', 'image', 'tags', 'techTags', 'status', 'links', 'date', 'body', 'live'];
const RESEARCH_TAGS: readonly ResearchTag[] = ['Health', 'Machine Learning', 'Other'];
const RESEARCH_STATUSES: readonly ResearchStatus[] = ['Building', 'Not Started', 'Completed'];
const HOSTED_LIVE_PAGE_KEYS = Object.keys(HOSTED_LIVE_PAGES);

export function parseResearch(path: string, raw: string): Research {
  const filenameSlug = path.split('/').pop()!.replace(/\.md$/, '');
  const { data, content } = matter(raw);
  assertNoUnknownKeys(path, data, ALLOWED_KEYS);
  const slug = assertSlugMatchesFilename(path, filenameSlug, data);
  const title = assertRequiredString(path, 'title', data.title);
  const description = assertRequiredString(path, 'description', data.description);
  const image = assertImagePath(path, data.image);
  const tags = assertTags(path, data.tags, RESEARCH_TAGS) as ResearchTag[];
  const techTags = assertOptionalStringArray(path, 'techTags', data.techTags);
  const status = assertOptionalStatus(path, data.status, RESEARCH_STATUSES) as ResearchStatus | undefined;
  const links = assertLinks(path, data.links);
  const date = normalizeDateField(path, 'date', data.date);
  const live = assertOptionalLive(path, data.live, HOSTED_LIVE_PAGE_KEYS);
  return { slug, title, description, image, tags, techTags, status, links, date, body: content.trim(), live };
}

const files = import.meta.glob('/src/content/research/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

export const research: Research[] = Object.entries(files)
  .map(([path, raw]) => parseResearch(path, raw))
  .sort((a, b) => b.date.localeCompare(a.date));

const seenResearchSlugs = new Set<string>();
for (const r of research) {
  if (seenResearchSlugs.has(r.slug)) {
    throw new Error(`Duplicate slug "${r.slug}" across multiple files in src/content/research/. Slugs must be unique.`);
  }
  seenResearchSlugs.add(r.slug);
}
