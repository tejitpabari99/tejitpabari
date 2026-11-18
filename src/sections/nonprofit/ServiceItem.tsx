import type { Service } from '@/config/nonprofit';

interface ServiceItemProps {
  service: Service;
  expanded: boolean;
  onToggle: (slug: string) => void;
}

export function ServiceItem({ service, expanded, onToggle }: ServiceItemProps) {
  const buttonId = `service-${service.slug}-button`;
  const panelId = `service-${service.slug}-panel`;
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => onToggle(service.slug)}
          className="flex min-h-[44px] w-full flex-col items-start rounded-xl px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-secondary"
        >
          <span className="text-base font-bold text-ink">{service.title}</span>
          <span className="mt-1 text-[0.9rem] text-body">{service.teaser}</span>
        </button>
      </h3>
      <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!expanded} className="px-5 pb-5">
        <p className="text-[0.94rem] leading-7 text-body">{service.body}</p>
      </div>
    </div>
  );
}
