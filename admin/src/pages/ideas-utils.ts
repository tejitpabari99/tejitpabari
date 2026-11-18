import { computeScore } from '../lib/ideas.js';
import type { Criterion } from '../types';

export interface IdeaRow {
  slug: string;
  title: string;
  status: string;
  tags: string[];
  link: string;
  github: string;
  brief: string;
  ranked: boolean;
  scores: Record<string, number>;
  date: string;
  excerpt: string;
}

export type SortCol = 'title' | 'status' | 'tags' | 'rank' | 'date';
export type SortDir = 'asc' | 'desc';

export const STATUS_ORDER = ['new', 'inprogress', 'completed', 'rejected'];
export const STATUS_LABEL: Record<string, string> = {
  new: 'New',
  inprogress: 'In Progress',
  completed: 'Completed',
  rejected: 'Rejected',
};

export function filterIdeas(
  ideas: IdeaRow[],
  { status, tags, search }: { status: string; tags: Set<string>; search: string },
): IdeaRow[] {
  let list = ideas;
  if (status !== 'all') list = list.filter((i) => i.status === status);
  if (tags.size > 0) list = list.filter((i) => [...tags].every((t) => i.tags.includes(t)));
  const q = search.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.excerpt.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }
  return list;
}

// Same ordering rules as the old cc-gateway page.
export function sortIdeas(list: IdeaRow[], col: SortCol, dir: SortDir, criteria: Criterion[]): IdeaRow[] {
  return [...list].sort((a, b) => {
    if (col === 'rank') {
      if (!a.ranked && !b.ranked) return 0;
      if (!a.ranked) return 1;
      if (!b.ranked) return -1;
      const as = computeScore(a.scores, criteria) ?? -1;
      const bs = computeScore(b.scores, criteria) ?? -1;
      return dir === 'asc' ? as - bs : bs - as;
    }
    let av: string | number;
    let bv: string | number;
    if (col === 'status') {
      av = STATUS_ORDER.indexOf(a.status);
      bv = STATUS_ORDER.indexOf(b.status);
    } else if (col === 'tags') {
      av = a.tags.join(', ');
      bv = b.tags.join(', ');
    } else if (col === 'date') {
      av = a.date || '';
      bv = b.date || '';
    } else {
      av = a.title;
      bv = b.title;
    }
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

// Runs fn over items with at most `limit` in flight; never rejects (fn errors are the caller's to catch).
export async function runPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  const worker = async () => {
    while (next < items.length) await fn(items[next++]);
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}
