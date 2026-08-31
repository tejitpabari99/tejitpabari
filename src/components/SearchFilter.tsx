// src/components/SearchFilter.tsx
import { TagPill } from './TagPill';

interface SearchFilterProps {
  query: string;
  onQueryChange: (v: string) => void;
  tags: string[];
  activeTag: string | null;
  onTagChange: (t: string | null) => void;
  resultCount: number;
  placeholder: string;
}

export function SearchFilter({
  query, onQueryChange, tags, activeTag, onTagChange, resultCount, placeholder,
}: SearchFilterProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full rounded-full border border-teal-secondary/15 bg-cream px-4 py-2 text-sm text-ink focus:border-teal-secondary/40 focus:outline-none sm:w-72"
        />
        <span className="text-[0.72rem] text-slate" aria-live="polite">
          {resultCount} {resultCount === 1 ? 'result' : 'results'}
        </span>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by tag">
          {tags.map((tag) => (
            <TagPill key={tag} active={tag === activeTag} onClick={() => onTagChange(tag === activeTag ? null : tag)}>
              {tag}
            </TagPill>
          ))}
        </div>
      )}
    </div>
  );
}
