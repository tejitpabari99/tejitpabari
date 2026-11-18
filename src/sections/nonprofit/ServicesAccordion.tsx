import { useState } from 'react';
import { Button } from '@/components/Button';
import { trackEvent } from '@/lib/analytics';
import { BOOKING_URL, BOOK_LABEL, SERVICES, SERVICES_HEADING } from '@/config/nonprofit';
import { ServiceItem } from './ServiceItem';

export function ServicesAccordion() {
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  const toggle = (slug: string) => {
    const opening = !open.has(slug);
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
    if (opening) trackEvent('service_toggle', { service: slug, expanded: true });
  };

  return (
    <section className="px-8 py-12 md:px-10 lg:px-12">
      <div className="mx-auto w-full max-w-content">
        <h2 className="text-[1.5rem] font-extrabold tracking-tight text-ink sm:text-[1.8rem]">{SERVICES_HEADING}</h2>
        <div className="mt-6 flex flex-col gap-3">
          {SERVICES.map((s) => (
            <ServiceItem key={s.slug} service={s} expanded={open.has(s.slug)} onToggle={toggle} />
          ))}
        </div>
        <div className="mt-8">
          <Button
            href={BOOKING_URL}
            target="_blank"
            rel="noreferrer"
            className="w-full min-h-[44px] sm:w-auto"
            onClick={() => trackEvent('book_consultation_click', { source: 'services' })}
          >
            {BOOK_LABEL}
          </Button>
        </div>
      </div>
    </section>
  );
}
