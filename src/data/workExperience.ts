// src/data/workExperience.ts
import matter from 'gray-matter';
import { type Link, assertRequiredString, assertLinks, normalizeDateField, assertNoUnknownKeys } from './shared';

export type WorkExperience = {
  company: string;
  role: string;
  startDate: string;
  endDate: string | 'Present';
  links: Link[];
  draftDate: boolean;
  body: string;
  id: string;
};

const ALLOWED_KEYS = ['company', 'role', 'startDate', 'endDate', 'links', 'DRAFT_DATE'];

export function parseWorkExperience(path: string, raw: string): WorkExperience {
  const id = path.split('/').pop()!.replace(/\.md$/, '');
  const { data, content } = matter(raw);
  assertNoUnknownKeys(path, data, ALLOWED_KEYS);
  const company = assertRequiredString(path, 'company', data.company);
  const role = assertRequiredString(path, 'role', data.role);
  const startDate = normalizeDateField(path, 'startDate', data.startDate);
  const endDate = data.endDate === 'Present' ? 'Present' : normalizeDateField(path, 'endDate', data.endDate);
  const links = assertLinks(path, data.links);
  if (data.DRAFT_DATE !== undefined && data.DRAFT_DATE !== true) {
    throw new Error(`${path}: "DRAFT_DATE" must be exactly \`true\` if present, or removed entirely once real dates are supplied.`);
  }
  const draftDate = data.DRAFT_DATE === true;
  const body = content.trim();
  if (!body) {
    throw new Error(`${path}: work-experience body (the 2–3 line blurb) must not be empty.`);
  }
  return { company, role, startDate, endDate, links, draftDate, body, id };
}

const files = import.meta.glob('/src/content/work-experience/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

export const workExperience: WorkExperience[] = Object.entries(files)
  .map(([path, raw]) => parseWorkExperience(path, raw))
  .sort((a, b) => b.startDate.localeCompare(a.startDate));
