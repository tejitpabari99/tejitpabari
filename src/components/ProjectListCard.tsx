// src/components/ProjectListCard.tsx
//
// Round 3, PRD item 1: replaces the 3-across ProjectCard grid on
// /projects and /research with a list of wide, horizontal cards (image
// left, content right on desktop; image on top, content below on mobile).
// ProjectCard.tsx itself is untouched - it stays as-is for the home page's
// featured-projects section.
import { Link } from 'react-router-dom';
import { TagPill } from './TagPill';
import { TechTagList } from './TechTagList';
import { StatusBadge, type BadgeStatus } from './StatusBadge';
import { LinkButtons } from './LinkButtons';
import type { Link as ContentLink, LiveConfig } from '@/data';
import { resolveCardLinks, type LiveLinkCollection } from '@/lib/resolveLiveLinks';

export interface ProjectListCardProps {
  href: string;
  image: string;
  imageAlt?: string;
  title: string;
  description: string;
  /** Category tags (the allowlisted, filterable ones) - TagPill treatment. */
  tags: string[];
  /** Free-form tech tags - subtler TechTagList treatment, never filterable. @default [] */
  techTags?: string[];
  status?: BadgeStatus;
  links: ContentLink[];
  /** Round 3.3: the entry's own optional `live` field. Renders links[]
   *  unchanged whenever there's at least one - `live` only matters here
   *  as the label/icon source for the ONE fallback case: an entry with no
   *  links[] at all gets a single live-link button instead of nothing.
   *  See src/lib/resolveLiveLinks.ts's resolveCardLinks. */
  live?: LiveConfig;
  slug: string;
  collection: LiveLinkCollection;
  onCardClick?: () => void;
}

export function ProjectListCard({
  href,
  image,
  imageAlt = '',
  title,
  description,
  tags,
  techTags = [],
  status,
  links,
  live,
  slug,
  collection,
  onCardClick,
}: ProjectListCardProps) {
  const resolvedLinks = resolveCardLinks({ live, links, slug, collection });
  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-card border border-teal-secondary/12 bg-cream shadow-card transition duration-200 hover:-translate-y-1 hover:border-teal-secondary/22 hover:shadow-card-hover sm:flex-row">
      {/* Image: full width on top for mobile, fixed-width column on the
          left from sm up (owner: "image on left ... card that spans
          horizontally", and "on mobile the image should come above the
          text"). A 4:3 frame at both sizes, rounded-xl2 + bg-placeholder to
          match the rest of the design system's media frames. */}
      <div className="relative m-3.5 h-[180px] shrink-0 overflow-hidden rounded-xl2 bg-placeholder sm:m-4 sm:h-[154px] sm:w-[220px] lg:h-[180px] lg:w-[240px]">
        <img
          src={image}
          alt={imageAlt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 px-3.5 pb-3.5 sm:py-4 sm:pl-0 sm:pr-4">
        <h3 className="text-[0.98rem] font-extrabold tracking-tight text-ink transition-colors duration-200 group-hover:text-teal-secondary sm:text-[1.05rem]">
          {/* after:absolute after:inset-0 makes the whole card clickable -
              positioned relative to the `article` above (position:
              relative), matching ProjectCard's existing affordance. */}
          <Link to={href} onClick={onCardClick} className="after:absolute after:inset-0 after:content-['']">
            {title}
          </Link>
        </h3>

        {status && <StatusBadge status={status} size="sm" className="self-start" />}

        <p className="text-[0.8rem] leading-6 text-body">{description}</p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => <TagPill key={tag}>{tag}</TagPill>)}
          </div>
        )}

        <TechTagList techTags={techTags} />

        {resolvedLinks.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            <LinkButtons links={resolvedLinks} size="sm" />
          </div>
        )}
      </div>
    </article>
  );
}
