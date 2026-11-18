// src/config/links.ts
import type { SiteId } from '@/data';
import sites from './sites.json';
import { GITHUB_URL, LINKEDIN_URL } from './contact';

export const RESUME_URL =
  'https://drive.google.com/file/d/1pTIyviXM0fCCkXeX6LveYXvr7QD2TD0j/view?usp=sharing';

export interface NavLink {
  label: string;
  href: string;
  /** Present only on landing-page scroll-spy anchors (href of the form
   * "/#<sectionId>"). Absent on plain route links like Home — Nav.tsx's
   * scroll-tracking loop filters to entries that carry this field instead
   * of deriving an id from href's string shape, which broke the moment a
   * non-hash entry (Home) needed to sit in this same array. */
  sectionId?: string;
  /** External link to one of the owner's own subdomains: opens in the same
   * tab (no target=_blank) and is never marked active. */
  sameTab?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/#projects', sectionId: 'projects' },
  { label: 'Work Experience', href: '/#work-experience', sectionId: 'work-experience' },
  { label: 'Health Tech', href: 'https://healthtech.tejitpabari.com', sameTab: true },
  { label: 'Non Profit', href: 'https://nonprofit.tejitpabari.com', sameTab: true },
  { label: 'Blog', href: 'https://substack.com/@tejitpabari' },
  { label: 'About', href: '/#about', sectionId: 'about' },
];

export const FOOTER_LINKS: { label: string; href: string }[] = [
  { label: 'Research', href: '/research' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Résumé', href: RESUME_URL },
];

/** Where the subsites' top-right "Website" button points (same tab). */
export const MAIN_SITE_URL: string = sites.main.url;

export const NAV_LINKS_BY_SITE: Record<SiteId, NavLink[]> = {
  main: NAV_LINKS,
  healthtech: [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/#projects', sectionId: 'projects' },
  ],
  nonprofit: [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/projects' },
    { label: 'Schedule', href: '/schedule' },
  ],
};

// Subsites link legal pages absolutely to main (they have no /privacy or
// /terms of their own). The obfuscated email entry is rendered by Footer.
const SUBSITE_FOOTER_LINKS: { label: string; href: string }[] = [
  { label: 'Privacy', href: `${MAIN_SITE_URL}/privacy` },
  { label: 'Terms', href: `${MAIN_SITE_URL}/terms` },
  { label: 'GitHub', href: GITHUB_URL },
  { label: 'LinkedIn', href: LINKEDIN_URL },
];

export const FOOTER_LINKS_BY_SITE: Record<SiteId, { label: string; href: string }[]> = {
  main: FOOTER_LINKS,
  healthtech: SUBSITE_FOOTER_LINKS,
  nonprofit: SUBSITE_FOOTER_LINKS,
};
