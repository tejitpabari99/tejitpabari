// src/layout/Nav.tsx
import { useEffect, useRef, useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // Mobile drawer: Escape closes, body scroll locked, focus moves in and back out.
  useEffect(() => {
    if (menuOpen) {
      wasOpen.current = true;
      closeRef.current?.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMenuOpen(false);
      };
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = prevOverflow;
      };
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      hamburgerRef.current?.focus();
    }
  }, [menuOpen]);

  useEffect(() => {
    if (!isHome) return;

    const updateActiveSection = () => {
      const nearPageBottom =
        window.scrollY > 0 &&
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 32;
      // With a single section link there is no "last of several" to fall back to.
      if (nearPageBottom && SECTION_LINKS.length > 1) {
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

  const renderLink = (item: NavLink, mobile: boolean) => {
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
    const size = mobile
      ? 'px-4 py-2.5 text-[0.9rem]'
      : 'px-2 py-1.5 text-[0.62rem] sm:px-4.5 sm:py-2.5 sm:text-[0.83rem] lg:px-5 lg:py-2.5 lg:text-[0.88rem]';
    const className = `block whitespace-nowrap rounded-pill font-semibold transition ${size} ${
      isActive
        ? 'bg-teal text-white shadow-[0_10px_24px_rgba(4,52,57,0.22)]'
        : 'text-teal-secondary hover:bg-teal-secondary/8'
    }`;
    const close = () => setMenuOpen(false);
    return (
      <li key={item.href}>
        {external ? (
          <a
            href={item.href}
            {...(item.sameTab ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
            className={className}
            onClick={() => {
              close();
              trackEvent('outbound_click', { url: item.href, context: 'nav', label: item.label });
            }}
          >
            {item.label}
          </a>
        ) : (
          <Link to={item.href} className={className} onClick={close}>
            {item.label}
          </Link>
        )}
      </li>
    );
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
      {/* Mobile: hamburger fixed top-left; opens a left slide-in drawer. */}
      <button
        ref={hamburgerRef}
        type="button"
        aria-label="Open menu"
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        onClick={() => setMenuOpen(true)}
        className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-pill border border-teal-secondary/15 bg-cream/92 text-teal-secondary shadow-pill backdrop-blur-md hover:bg-teal-secondary/8 md:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M3 5h12M3 9h12M3 13h12" />
        </svg>
      </button>
      <div
        data-testid="mobile-menu-backdrop"
        aria-hidden="true"
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-10 bg-teal/40 transition-opacity duration-300 motion-reduce:transition-none md:hidden ${
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!menuOpen}
        className={`fixed inset-y-0 left-0 z-20 flex w-[80vw] max-w-[300px] flex-col border-r border-teal-secondary/15 bg-cream p-3 shadow-pill transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none md:hidden ${
          menuOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'
        }`}
      >
        <div className="mb-2 flex justify-end">
          <button
            ref={closeRef}
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-pill text-teal-secondary hover:bg-teal-secondary/8"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 4l10 10M14 4L4 14" />
            </svg>
          </button>
        </div>
        <nav aria-label="Mobile">
          <ul className="flex flex-col gap-0.5">{ACTIVE_LINKS.map((item) => renderLink(item, true))}</ul>
        </nav>
      </div>
      <div className="mx-auto hidden w-fit max-w-full items-center justify-center rounded-pill border border-teal-secondary/15 bg-cream/92 p-1.5 shadow-pill backdrop-blur-md md:flex">
        <nav aria-label="Primary">
          <ul className="flex flex-wrap items-center justify-center gap-0.5 sm:gap-1">
            {ACTIVE_LINKS.map((item) => renderLink(item, false))}
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
