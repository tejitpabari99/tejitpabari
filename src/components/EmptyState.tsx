// src/components/EmptyState.tsx
interface EmptyStateProps {
  itemLabel: string;
  query: string;
  activeTag: string | null;
  onClear: () => void;
}

export function EmptyState({ itemLabel, query, activeTag, onClear }: EmptyStateProps) {
  const clearLabel = activeTag && query.trim() ? 'Clear filters' : activeTag ? 'Clear tag filter' : 'Clear search';
  return (
    <div className="col-span-full flex flex-col items-center gap-2 py-16 text-center">
      <p className="text-sm text-body">
        {activeTag && query.trim() ? (
          <>No {itemLabel} match &ldquo;{query}&rdquo; tagged <strong>{activeTag}</strong>.</>
        ) : activeTag ? (
          <>No {itemLabel} are tagged <strong>{activeTag}</strong>.</>
        ) : (
          <>No {itemLabel} match &ldquo;{query}&rdquo;.</>
        )}
      </p>
      <button type="button" onClick={onClear} className="text-sm font-semibold text-teal-secondary hover:text-teal">
        {clearLabel}
      </button>
    </div>
  );
}
