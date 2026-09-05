// src/config/links.ts
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
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/#projects', sectionId: 'projects' },
  { label: 'Work Experience', href: '/#work-experience', sectionId: 'work-experience' },
  { label: 'About', href: '/#about', sectionId: 'about' },
  { label: 'Contact', href: '/#contact', sectionId: 'contact' },
];

export const FOOTER_LINKS: { label: string; href: string }[] = [
  { label: 'Research', href: '/research' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Résumé', href: RESUME_URL },
];
