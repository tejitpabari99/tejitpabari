// src/layout/Footer.tsx
import { Link } from 'react-router-dom';
import { FOOTER_LINKS } from '@/config/links';
import { isExternalUrl } from '@/lib/isExternalUrl';
import { trackEvent } from '@/lib/analytics'; // SP05 add

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="shrink-0 border-t border-teal-secondary/20 bg-sage">
      <div className="mx-auto flex w-full max-w-content flex-col items-center gap-3 px-6 py-8 text-center sm:px-8 md:px-10 lg:px-12">
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-4 text-[0.78rem] font-semibold text-teal-secondary">
          {FOOTER_LINKS.map((item) =>
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
