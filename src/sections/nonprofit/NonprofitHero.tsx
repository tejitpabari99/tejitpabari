import { Button } from '@/components/Button';
import { trackEvent } from '@/lib/analytics';
import { BOOKING_URL, BOOK_LABEL, HERO_EYEBROW, HERO_HEADING, HERO_TEXT } from '@/config/nonprofit';

export function NonprofitHero() {
  return (
    <section className="relative bg-cream px-8 pb-14 pt-28 sm:pt-32 md:px-10 lg:px-12 lg:pt-36">
      <div className="mx-auto w-full max-w-content">
        <div className="w-full max-w-[560px] text-left">
          <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-teal-secondary sm:text-[0.74rem]">
            {HERO_EYEBROW}
          </p>

          <h1 className="text-[2.1rem] font-extrabold leading-[0.95] tracking-tight text-ink sm:text-[2.6rem] lg:text-[3rem]">
            {HERO_HEADING}
          </h1>

          <p className="mt-5 max-w-[32rem] text-[0.94rem] leading-7 text-body">{HERO_TEXT}</p>

          <div className="mt-7">
            <Button
              href={BOOKING_URL}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto"
              onClick={() => trackEvent('book_consultation_click', { source: 'hero' })}
            >
              {BOOK_LABEL}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
