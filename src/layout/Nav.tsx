// src/layout/Nav.tsx
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_LINKS_BY_SITE, MAIN_SITE_URL, type NavLink } from '@/config/links';
import { SITE } from '@/config/site-target';
import { isExternalUrl } from '@/lib/isExternalUrl';
import { trackEvent } from '@/lib/analytics';

const SCROLL_OFFSET = 140; // px — matches techfolio's own threshold

// Only entries that carry a sectionId (the four landing-page anchors)
// participate in scroll tracking. Home (no sectionId) is handled by its
// own isActive branch below — it is never a candidate here, regardless of
// where in the links array it sits.
const ACTIVE_LINKS = NAV_LINKS_BY_SITE[SITE];
const SECTION_LINKS = ACTIVE_LINKS.filter(
  (item): item is NavLink & { sectionId: string } => Boolean(item.sectionId),
);

export function Nav() {
  const [scrollSection, setScrollSection] = useState<string | null>(null);
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const activeSection = isHome ? scrollSection : null;

  useEffect(() => {
    if (!isHome) return;

    const updateActiveSection = () => {
      const nearPageBottom =
        window.scrollY > 0 &&
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 32;
      if (nearPageBottom && SECTION_LINKS.length > 0) {
        setScrollSection(SECTION_LINKS[SECTION_LINKS.length - 1].sectionId);
        return;
      }
      const scrollMarker = window.scrollY + SCROLL_OFFSET;
      let current: string | null = null;
      for (const item of SECTION_LINKS) {
        const el = document.getElementById(item.sectionId);
        if (el && scrollMarker >= el.offsetTop) current = item.sectionId;
      }
      setScrollSection(current);
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [isHome]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
      <div className="mx-auto flex w-fit max-w-full items-center justify-center rounded-pill border border-teal-secondary/15 bg-cream/92 p-1.5 shadow-pill backdrop-blur-md">
            <nav aria-label="Primary">
              <ul className="flex flex-wrap items-center justify-center gap-0.5 sm:gap-1">
                {ACTIVE_LINKS.map((item) => {
                  // Home has no sectionId: active only at the untouched page
                  // top of "/" (before any section has scrolled into view) —
                  // the moment scroll tracking picks a real section, Home
                  // hands off to it. On any other pathname, activeSection is
                  // always null (see the ternary above), so this stays false.
                  const external = isExternalUrl(item.href);
                  const isActive = external
                    ? false
                    : item.sectionId
                      ? activeSection === item.sectionId
                      : item.href === '/'
                        ? isHome && activeSection === null
                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const className = `block whitespace-nowrap rounded-pill px-2 py-1.5 text-[0.62rem] font-semibold transition sm:px-4.5 sm:py-2.5 sm:text-[0.83rem] lg:px-5 lg:py-2.5 lg:text-[0.88rem] ${
                    isActive
                      ? 'bg-teal text-white shadow-[0_10px_24px_rgba(4,52,57,0.22)]'
                      : 'text-teal-secondary hover:bg-teal-secondary/8'
                  }`;
                  return (
                    <li key={item.href}>
                      {external ? (
                        <a
                          href={item.href}
                          {...(item.sameTab ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                          className={className}
                          onClick={() =>
                            trackEvent('outbound_click', { url: item.href, context: 'nav', label: item.label })
                          }
                        >
                          {item.label}
                        </a>
                      ) : (
                        <Link to={item.href} className={className}>
                          {item.label}
                        </Link>
                      )}
                    </li>
              );
            })}
          </ul>
        </nav>
      </div>
      {SITE !== 'main' && (
        // Subsites: always-visible (no responsive hide) same-tab link back to
        // the main site.
        <a
          href={MAIN_SITE_URL}
          className="absolute right-4 top-4 rounded-pill border border-teal-secondary/15 bg-cream/92 px-3 py-1.5 text-[0.62rem] font-semibold text-teal-secondary shadow-pill backdrop-blur-md hover:bg-teal-secondary/8 sm:right-6 sm:top-5 sm:px-4 sm:py-2.5 sm:text-[0.83rem] lg:right-8"
          onClick={() => trackEvent('outbound_click', { url: MAIN_SITE_URL, context: 'nav', label: 'Website' })}
        >
          Website
        </a>
      )}
    </header>
  );
}
