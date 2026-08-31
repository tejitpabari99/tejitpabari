import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from '@/data/markdownComponents';
import { ExternalLinkIcon } from '../icons/ExternalLinkIcon';
import { formatWorkDate } from './formatWorkDate';
import type { WorkExperience } from '@/data';
import { trackEvent } from '@/lib/analytics';

interface TimelineEntryProps {
  entry: WorkExperience;
  /** True for index 0 of the full, startDate-descending-sorted array. */
  isCurrent: boolean;
  /** True only for the entry immediately preceding the end of the spine
   * with no stub following it. False when a TimelineSeeAllStub follows,
   * so the spine doesn't visually shrink right before it continues. */
  isLast: boolean;
}

const entryBaseClasses =
  "relative border-l-2 border-teal-secondary/15 pl-[22px] pt-[18px] transition-colors duration-200 hover:border-teal-secondary/28 " +
  "before:absolute before:-left-[5px] before:top-[22px] before:h-2 before:w-2 before:rounded-full before:border-2 before:border-cream before:content-[''] before:transition-colors before:duration-200";

export function TimelineEntry({ entry, isCurrent, isLast }: TimelineEntryProps) {
  return (
    <div
      role="listitem"
      className={[
        entryBaseClasses,
        isLast ? 'pb-1' : 'pb-6',
        isCurrent ? 'before:bg-teal' : 'before:bg-teal-secondary/20 hover:before:bg-teal',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.64rem] font-semibold uppercase tracking-[0.15em] text-teal-secondary">
          {entry.company}
        </span>
        <span className="shrink-0 text-[0.7rem] text-slate">
          {formatWorkDate(entry.startDate)} &ndash;{' '}
          {entry.endDate === 'Present' ? 'Present' : formatWorkDate(entry.endDate)}
        </span>
      </div>

      <h3 className="mt-0.5 text-[0.95rem] font-bold tracking-tight text-ink">{entry.role}</h3>

      {/* Deliberately NOT SP02's <ContentBody> — that wraps output in the
          `prose` plugin, sized for a full write-up. This blurb renders at a
          tighter, denser scale per the brief. See PRD §4.5/§9. */}
      <div className="mt-2 text-[0.82rem] leading-5 text-body [&_p]:m-0 [&_p+p]:mt-1.5 sm:text-[0.86rem]">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {entry.body}
        </ReactMarkdown>
      </div>

      {entry.links.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {entry.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                trackEvent('outbound_click', {
                  url: link.href,
                  context: 'content_external_link',
                  label: link.label,
                })
              }
              className="inline-flex items-center gap-1 text-[0.76rem] font-semibold text-teal-secondary hover:text-teal"
            >
              {link.label}
              <ExternalLinkIcon className="h-3 w-3" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
