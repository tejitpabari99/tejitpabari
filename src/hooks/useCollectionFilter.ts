// src/hooks/useCollectionFilter.ts
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Fuse, { type IFuseOptions } from 'fuse.js';
import { useDebouncedValue } from '@/hooks/useDebouncedValue'; // SP01
import { trackEvent } from '@/lib/analytics'; // SP05

interface Searchable {
  title: string;
  description: string;
  tags: string[];
  body: string;
}

const FUSE_OPTIONS: IFuseOptions<Searchable> = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'description', weight: 0.3 },
    { name: 'tags', weight: 0.2 },
    { name: 'body', weight: 0.1 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

interface UseCollectionFilterArgs<T extends Searchable & { slug: string }> {
  items: T[];
  collection: 'projects' | 'research';
}

interface UseCollectionFilterResult<T> {
  query: string;
  setQuery: (q: string) => void;
  activeTag: string | null;
  setActiveTag: (t: string | null) => void;
  results: T[];
  allTags: string[];
}

export function useCollectionFilter<T extends Searchable & { slug: string }>({
  items,
  collection,
}: UseCollectionFilterArgs<T>): UseCollectionFilterResult<T> {
  const [searchParams, setSearchParams] = useSearchParams();

  // Hydration-safe defaults — see PRD §4.2's "why not read searchParams
  // synchronously" note. Real ?q=/?tag= values are adopted post-mount only.
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    const tag = searchParams.get('tag');
    if (q) setQuery(q);
    if (tag) setActiveTag(tag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debouncedQuery = useDebouncedValue(query, 200); // fast, UI-facing debounce

  const allTags = useMemo(() => Array.from(new Set(items.flatMap((i) => i.tags))).sort(), [items]);

  const tagFiltered = useMemo(
    () => (activeTag ? items.filter((i) => i.tags.includes(activeTag)) : items),
    [items, activeTag],
  );

  const fuse = useMemo(() => new Fuse(tagFiltered, FUSE_OPTIONS), [tagFiltered]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return tagFiltered;
    return fuse.search(debouncedQuery).map((r) => r.item);
  }, [debouncedQuery, fuse, tagFiltered]);

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedQuery.trim()) next.set('q', debouncedQuery);
        else next.delete('q');
        if (activeTag) next.set('tag', activeTag);
        else next.delete('tag');
        return next;
      },
      { replace: true },
    );
  }, [debouncedQuery, activeTag, setSearchParams]);

  // search_query — a SECOND, INDEPENDENT 600ms timer, deliberately separate
  // from the 200ms useDebouncedValue instance above. That 200ms debounce is
  // for UI responsiveness (how fast the grid narrows); this 600ms timer is
  // for analytics (don't count a query as "typed" until the visitor pauses
  // meaningfully). Fires on the RAW `query`, not `debouncedQuery`. This is
  // why it does NOT fire per keystroke: every keystroke resets this timer,
  // and only the last one before a 600ms pause actually calls trackEvent.
  useEffect(() => {
    if (!query.trim()) return;
    const handle = setTimeout(() => {
      trackEvent('search_query', { collection, query: query.trim(), result_count: results.length });
    }, 600);
    return () => clearTimeout(handle);
  }, [query, results.length, collection]);

  return { query, setQuery, activeTag, setActiveTag, results, allTags };
}
