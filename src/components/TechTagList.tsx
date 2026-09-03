// src/components/TechTagList.tsx
//
// Renders the free-form `techTags` (round 3) in a deliberately SUBTLER
// treatment than TagPill's category tags - smaller, lower-contrast, plain
// outline chips - so the visual hierarchy reads "category first, tech
// second" (PRD item 1/7). Shared between ProjectListCard (index pages) and
// DetailHeader (detail pages) so both render one implementation. Never
// clickable: plain <span>s, no onClick, not part of the category filter.
interface TechTagListProps {
  techTags: string[];
  className?: string;
}

export function TechTagList({ techTags, className = '' }: TechTagListProps) {
  if (techTags.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {techTags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-teal-secondary/10 px-2 py-0.5 text-[0.62rem] font-medium text-slate"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
