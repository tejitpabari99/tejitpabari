// src/layout/Nav.tsx
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_LINKS, type NavLink } from '@/config/links';

const SCROLL_OFFSET = 140; // px — matches techfolio's own threshold

// Only entries that carry a sectionId (the four landing-page anchors)
// participate in scroll tracking. Home (no sectionId) is handled by its
// own isActive branch below — it is never a candidate here, regardless of
// where in NAV_LINKS it sits.
const SECTION_LINKS = NAV_LINKS.filter(
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
      if (nearPageBottom) {
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
      <div className="mx-auto flex w-fit items-center justify-center rounded-full border border-teal-secondary/15 bg-cream/92 p-1.5 shadow-pill backdrop-blur-md">
            <nav aria-label="Primary">
              <ul className="flex items-center gap-1">
                {NAV_LINKS.map((item) => {
                  // Home has no sectionId: active only at the untouched page
                  // top of "/" (before any section has scrolled into view) —
                  // the moment scroll tracking picks a real section, Home
                  // hands off to it. On any other pathname, activeSection is
                  // always null (see the ternary above), so this stays false.
                  const isActive = item.sectionId
                    ? activeSection === item.sectionId
                    : isHome && activeSection === null;
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        className={`block rounded-full px-4 py-2 text-[0.8rem] font-semibold transition sm:px-4.5 sm:py-2.5 sm:text-[0.83rem] lg:px-5 lg:py-2.5 lg:text-[0.88rem] ${
                          isActive
                        ? 'bg-teal text-white shadow-[0_10px_24px_rgba(4,52,57,0.22)]'
                        : 'text-teal-secondary hover:bg-teal-secondary/8'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
