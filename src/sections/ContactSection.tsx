import { Button } from '@/components/Button';
import { GitHubIcon } from '@/components/icons/GitHubIcon';
import { LinkedInIcon } from '@/components/icons/LinkedInIcon';
import { LINKEDIN_URL, GITHUB_URL, getContactEmailAddress } from '@/config/contact';
import { useContactMailto } from '@/hooks/useContactMailto';
import { trackEvent } from '@/lib/analytics';

export function ContactSection() {
  const emailHref = useContactMailto();

  // Pre-hydration (and no-JS) state: a real <button>, not a link, since
  // there's no href to offer yet. Assembles the address on click only,
  // via getContactEmailAddress(), never a plain literal in this file or
  // the compiled bundle. See src/config/contact.ts for why the address is
  // split into two constants.
  function handleEmailButtonClick() {
    // 'email_click' isn't a member of AnalyticsEventName (src/lib/analytics.ts
    // is out of scope for this change), so 'outbound_click' is the closest
    // existing category, matching the GitHub/LinkedIn click tracking below.
    trackEvent('outbound_click', { url: 'mailto:', context: 'contact_email', label: 'Email Me' });
    window.location.href = `mailto:${getContactEmailAddress()}`;
  }

  return (
    <section
      id="contact"
      className="scroll-mt-24 bg-cream px-8 py-16 sm:py-20 md:px-10 lg:px-12 lg:py-24"
    >
      <div className="mx-auto grid w-full max-w-content grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(260px,0.6fr)] lg:gap-14">
        <div className="max-w-[540px]">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-teal-secondary">
            Contact
          </p>
          <h2 className="mt-3.5 max-w-[12ch] text-[1.75rem] font-extrabold leading-[0.97] tracking-tight text-ink sm:text-[2.15rem]">
            Get in Touch
          </h2>
          <p className="mt-4 max-w-[28rem] text-[0.9rem] leading-6.5 text-body">
            I&rsquo;m always glad to hear from people working in health tech, especially
            if you want to talk through Juno from a clinical or research angle.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {emailHref ? (
              // Upgraded, post-hydration state: a real mailto: <a> so
              // middle-click and "copy link address" work for real users.
              <Button
                href={emailHref}
                onClick={() =>
                  trackEvent('outbound_click', {
                    url: emailHref,
                    context: 'contact_email',
                    label: 'Email Me',
                  })
                }
              >
                Email Me
              </Button>
            ) : (
              <Button type="button" onClick={handleEmailButtonClick}>
                Email Me
              </Button>
            )}
          </div>
        </div>

        <aside className="lg:pt-5">
          <div className="rounded-panel border border-teal-secondary/12 bg-sage p-4.5 shadow-panel sm:p-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-teal-secondary">
              Connect
            </p>

            <div className="mt-5 text-ink">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate">
                Profiles
              </p>
              <div className="mt-3 flex items-center gap-2.5">
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                  onClick={() =>
                    trackEvent('outbound_click', {
                      url: GITHUB_URL,
                      context: 'contact_social',
                      label: 'GitHub',
                    })
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-pill border border-teal-secondary/12 bg-cream text-teal-secondary transition hover:-translate-y-0.5 hover:bg-teal-secondary hover:text-white"
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
                      context: 'contact_social',
                      label: 'LinkedIn',
                    })
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-pill border border-teal-secondary/12 bg-cream text-teal-secondary transition hover:-translate-y-0.5 hover:bg-teal-secondary hover:text-white"
                >
                  <LinkedInIcon />
                </a>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
