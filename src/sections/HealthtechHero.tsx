import { Button } from '@/components/Button';
import { trackEvent } from '@/lib/analytics';

export const ONOLYS_URL = 'https://onolys.com';

export const HEALTHTECH_HERO_COPY =
  "I build tools that make healthcare easier to understand, from a self-testing app to an AI companion for doctor visits and plain-language care plans. Today I'm building Onolys, AI that helps check the quality of clinical assessments.";

export function HealthtechHero() {
  return (
    <section className="relative bg-cream px-8 pb-14 pt-28 sm:pt-32 md:px-10 lg:px-12 lg:pt-36">
      <div className="mx-auto w-full max-w-content">
        <div className="w-full max-w-[560px] text-left">
          <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-teal-secondary sm:text-[0.74rem]">
            Health Tech Builder
          </p>

          <h1 className="text-[2.1rem] font-extrabold leading-[0.95] tracking-tight text-ink sm:text-[2.6rem] lg:text-[3rem]">
            Tejit Pabari
          </h1>

          <p className="mt-3 text-[0.94rem] font-semibold text-teal-secondary">Health tech projects</p>

          <p className="mt-5 max-w-[32rem] text-[0.94rem] leading-7 text-body">{HEALTHTECH_HERO_COPY}</p>

          <div className="mt-7">
            <Button
              href={ONOLYS_URL}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto"
              onClick={() => trackEvent('outbound_click', { url: ONOLYS_URL, source: 'healthtech_hero', label: 'Visit Onolys' })}
            >
              Visit Onolys
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
