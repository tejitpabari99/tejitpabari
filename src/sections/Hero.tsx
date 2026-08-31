import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { GitHubIcon } from '@/components/icons/GitHubIcon';
import { LinkedInIcon } from '@/components/icons/LinkedInIcon';
import { GITHUB_URL, LINKEDIN_URL } from '@/config/contact';
import { RESUME_URL } from '@/config/links';
import { trackEvent } from '@/lib/analytics';
import { HeroPortrait } from './HeroPortrait';

export function Hero() {
  return (
    <section className="relative bg-cream px-6 pb-14 pt-28 sm:px-8 sm:pt-32 md:px-10 lg:px-12 lg:pt-36">
      <div className="mx-auto grid w-full max-w-content grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.55fr)] lg:gap-8">
        <div className="mx-auto w-full max-w-[440px] text-left lg:mx-0">
          <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-teal-secondary sm:text-[0.74rem]">
            Health Tech Builder
          </p>

          <h1 className="max-w-[10ch] text-[2.1rem] font-extrabold leading-[0.95] tracking-tight text-ink sm:text-[2.6rem] lg:text-[3rem]">
            Hi, I&rsquo;m Tejit.
          </h1>

          <p className="mt-5 max-w-[32rem] text-[0.94rem] leading-7 text-body">
            I&rsquo;m building Juno, an AI companion that helps patients get more out of every medical
            appointment &mdash; while working full-time as a Software Engineer II on Microsoft&rsquo;s Fabric
            Maps team. Health tech is where most of my energy outside of work goes, and where I&rsquo;m headed
            next.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              href={RESUME_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackEvent('resume_click', { source: 'hero', url: RESUME_URL })}
            >
              Download Resume
            </Button>

            {/* Deliberately react-router <Link>, not <Button href="#contact">
                — see PRD §4.2 for why: a plain same-pathname hash link would
                jump instantly, bypassing ScrollManager's smooth scroll. */}
            <Link
              to="/#contact"
              className="inline-flex items-center justify-center rounded-full border border-teal-secondary px-6 py-2.5 text-sm font-semibold text-teal-secondary transition hover:bg-teal-secondary hover:text-white lg:px-7 lg:py-3 lg:text-[0.92rem]"
            >
              Contact Me
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-2.5">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              onClick={() =>
                trackEvent('outbound_click', {
                  url: GITHUB_URL,
                  context: 'hero_social',
                  label: 'GitHub',
                })
              }
              className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-secondary/15 bg-cream text-teal-secondary transition hover:-translate-y-0.5 hover:border-teal-secondary/25 hover:bg-teal-secondary hover:text-white"
            >
              <GitHubIcon />
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              onClick={() =>
                trackEvent('outbound_click', {
                  url: LINKEDIN_URL,
                  context: 'hero_social',
                  label: 'LinkedIn',
                })
              }
              className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-secondary/15 bg-cream text-teal-secondary transition hover:-translate-y-0.5 hover:border-teal-secondary/25 hover:bg-teal-secondary hover:text-white"
            >
              <LinkedInIcon />
            </a>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <HeroPortrait />
        </div>
      </div>
    </section>
  );
}
