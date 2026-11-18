// src/layout/Footer.tsx
import { Link } from 'react-router-dom';
import { FOOTER_LINKS_BY_SITE } from '@/config/links';
import { SITE } from '@/config/site-target';
import { getContactEmailAddress } from '@/config/contact';
import { useContactMailto } from '@/hooks/useContactMailto';
import { isExternalUrl } from '@/lib/isExternalUrl';
import { trackEvent } from '@/lib/analytics'; // SP05 add

export function Footer() {
  const year = new Date().getFullYear();
  const emailHref = useContactMailto();
  const links = FOOTER_LINKS_BY_SITE[SITE];
  return (
    <footer className="shrink-0 border-t border-teal-secondary/20 bg-sage">
      <div className="mx-auto flex w-full max-w-content flex-col items-center gap-3 px-8 py-8 text-center md:px-10 lg:px-12">
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-4 text-[0.78rem] font-semibold text-teal-secondary">
          {links.map((item) =>
            isExternalUrl(item.href) ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="hover:text-teal"
                onClick={
                  item.label === 'Résumé'
                    ? () => trackEvent('resume_click', { source: 'footer', url: item.href })
                    : undefined
                }
              >
                {item.label}
              </a>
            ) : (
              <Link key={item.href} to={item.href} className="hover:text-teal">
                {item.label}
              </Link>
            ),
          )}
          {SITE !== 'main' &&
            (emailHref ? (
              <a href={emailHref} className="hover:text-teal">
                Email
              </a>
            ) : (
              // Pre-hydration: address is assembled on click only (see contact.ts).
              <button
                type="button"
                className="font-semibold hover:text-teal"
                onClick={() => {
                  window.location.href = `mailto:${getContactEmailAddress()}`;
                }}
              >
                Email
              </button>
            ))}
        </nav>
        <p className="text-[0.72rem] text-slate">
          Visual design adapted from{' '}
          <a
            href="https://github.com/brittnebaila/techfolio"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-teal-secondary"
          >
            Brittne Valdivia&rsquo;s techfolio
          </a>
          .
        </p>
        <p className="text-[0.72rem] text-slate">© {year} Tejit Pabari</p>
      </div>
    </footer>
  );
}
