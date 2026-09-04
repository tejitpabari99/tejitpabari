// src/components/DetailHeader.tsx
import { TagPill } from './TagPill';
import { StatusBadge, type BadgeStatus } from './StatusBadge';
import { TechTagList } from './TechTagList';

interface DetailHeaderProps {
  image: string;
  imageAlt?: string;
  title: string;
  status?: BadgeStatus; // was `string` - tightened, see PRD §4.3
  tags: string[];
  /** Free-form techTags (round 3, PRD item 7), rendered below the category
   *  tags in TechTagList's subtler treatment. @default [] */
  techTags?: string[];
}

export function DetailHeader({ image, imageAlt = '', title, status, tags, techTags = [] }: DetailHeaderProps) {
  return (
    <header className="mt-6">
      <div className="relative overflow-hidden bg-placeholder">
        <img src={image} alt={imageAlt} className="h-[200px] w-full object-cover sm:h-[260px] lg:h-[320px]" />
        {status && <StatusBadge status={status} size="md" className="absolute left-3 top-3" />}
      </div>
      <h1 className="mt-6 text-[1.9rem] font-extrabold tracking-tight text-ink sm:text-[2.4rem]">{title}</h1>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => <TagPill key={tag}>{tag}</TagPill>)}
        </div>
      )}
      <TechTagList techTags={techTags} className="mt-2" />
    </header>
  );
}
