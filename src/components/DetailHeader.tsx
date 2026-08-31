// src/components/DetailHeader.tsx
import { TagPill } from './TagPill';

interface DetailHeaderProps {
  image: string;
  imageAlt?: string;
  title: string;
  status?: string;
  tags: string[];
}

export function DetailHeader({ image, imageAlt = '', title, status, tags }: DetailHeaderProps) {
  return (
    <header className="mt-6">
      <div className="relative overflow-hidden rounded-section bg-placeholder">
        <img src={image} alt={imageAlt} className="h-[200px] w-full object-cover sm:h-[260px] lg:h-[320px]" />
        {status && (
          <span className="absolute left-3 top-3 rounded-full bg-teal/92 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wide text-white">
            {status}
          </span>
        )}
      </div>
      <h1 className="mt-6 text-[1.9rem] font-extrabold tracking-tight text-ink sm:text-[2.4rem]">{title}</h1>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => <TagPill key={tag}>{tag}</TagPill>)}
        </div>
      )}
    </header>
  );
}
