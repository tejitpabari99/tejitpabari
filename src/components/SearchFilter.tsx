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
    <div className="flex flex-col gap-3">
      {/* Full width at every breakpoint (owner: "search bar in projects
          should be bigger. Full width."), physically larger (taller,
          bigger text) than the old px-4 py-2 text-sm input. */}
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full border border-teal-secondary/15 bg-cream px-5 py-3.5 text-base text-ink focus:border-teal-secondary/40 focus:outline-none sm:text-lg"
      />
      {/* Result count moved off the input's row entirely - it no longer
          competes with the (now full-width) input, and sits beside the
          filter pills instead. */}
      <div className="flex flex-wrap items-center gap-3">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by tag">
            {tags.map((tag) => (
              <TagPill key={tag} active={tag === activeTag} onClick={() => onTagChange(tag === activeTag ? null : tag)}>
                {tag}
              </TagPill>
            ))}
          </div>
        )}
        <span className="ml-auto text-[0.72rem] text-slate" aria-live="polite">
          {resultCount} {resultCount === 1 ? 'result' : 'results'}
        </span>
      </div>
    </div>
  );
}
