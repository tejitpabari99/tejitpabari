import { Link } from 'react-router-dom';
import { TagPill } from './TagPill';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { StatusBadge } from './StatusBadge';
import type { ProjectStatus } from '@/data';

export interface ProjectCardProps {
  href: string;
  image: string;
  imageAlt?: string;
  title: string;
  description: string;
  tags: string[];
  status?: ProjectStatus;
  externalHref?: string;
  externalLabel?: string;
  onCardClick?: () => void;
  onExternalClick?: () => void;
}

export function ProjectCard({
  href,
  image,
  imageAlt = '',
  title,
  description,
  tags,
  status,
  externalHref,
  externalLabel,
  onCardClick,
  onExternalClick,
}: ProjectCardProps) {
  return (
    <article className="group relative w-full rounded-card border border-teal-secondary/12 bg-cream p-3.5 text-center shadow-card transition duration-200 hover:-translate-y-1 hover:border-teal-secondary/22 hover:shadow-card-hover sm:p-4">
      <div className="relative mb-3 overflow-hidden rounded-xl2 bg-placeholder">
        <img
          src={image}
          alt={imageAlt}
          width={400}
          height={120}
          loading="lazy"
          className="h-[120px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] sm:h-[140px] lg:h-[168px] xl:h-[205px]"
        />

        {status && <StatusBadge status={status} size="sm" className="absolute left-2 top-2" />}

        {externalHref && (
          <a
            href={externalHref}
            target="_blank"
            rel="noreferrer"
            aria-label={externalLabel ?? `Open ${title} externally`}
            onClick={(event) => {
              event.stopPropagation();
              onExternalClick?.();
            }}
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-pill border border-teal-secondary/15 bg-cream/90 text-teal-secondary backdrop-blur-sm transition hover:bg-teal-secondary hover:text-white"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <h3 className="text-[0.95rem] font-extrabold tracking-tight text-ink transition-colors duration-200 group-hover:text-teal-secondary sm:text-[1rem]">
        <Link to={href} onClick={onCardClick} className="after:absolute after:inset-0 after:content-['']">
          {title}
        </Link>
      </h3>
      <p className="mt-2 text-[0.72rem] leading-5 text-body sm:text-[0.76rem]">{description}</p>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {tags.map((tag) => (
            <TagPill key={tag}>{tag}</TagPill>
          ))}
        </div>
      )}
    </article>
  );
}
