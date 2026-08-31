// src/layout/Nav.tsx
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_LINKS } from '@/config/links';

// NAV_LINKS entries are { label, href } with href always of the shape
// "/#<sectionId>" (coordinating with SP02's build-time validator, which
// checks this same array's hrefs against KNOWN_STATIC_ROUTES). Nav's own
// active-section logic needs the bare sectionId to match against
// document.getElementById, so it's derived here rather than duplicated as a
// second field on NAV_LINKS.
const sectionIdOf = (href: string) => href.slice(2); // "/#projects" -> "projects"

const SCROLL_OFFSET = 140; // px — matches techfolio's own threshold

export function Nav() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname !== '/') {
      setActiveSection(null);
      return;
    }

    const updateActiveSection = () => {
      const nearPageBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 32;
      if (nearPageBottom) {
        setActiveSection(sectionIdOf(NAV_LINKS[NAV_LINKS.length - 1].href));
        return;
      }
      const scrollMarker = window.scrollY + SCROLL_OFFSET;
      let current: string | null = null;
      for (const item of NAV_LINKS) {
        const sectionId = sectionIdOf(item.href);
        const el = document.getElementById(sectionId);
        if (el && scrollMarker >= el.offsetTop) current = sectionId;
      }
      setActiveSection(current);
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
      <div className="mx-auto flex w-fit items-center justify-center rounded-full border border-teal-secondary/15 bg-cream/92 p-1.5 shadow-pill backdrop-blur-md">
        <nav aria-label="Primary">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((item) => {
              const sectionId = sectionIdOf(item.href);
              return (
                <li key={sectionId}>
                  <Link
                    to={item.href}
                    className={`block rounded-full px-4 py-2 text-[0.8rem] font-semibold transition sm:px-4.5 sm:py-2.5 sm:text-[0.83rem] lg:px-5 lg:py-2.5 lg:text-[0.88rem] ${
                      activeSection === sectionId
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
