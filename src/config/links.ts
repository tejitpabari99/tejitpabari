// src/config/links.ts
export const RESUME_URL =
  'https://drive.google.com/file/d/1HcqZCkdxfU73PUHmFSKqJGIG7_yG3mGS/view?usp=sharing';

export const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Projects', href: '/#projects' },
  { label: 'Work Experience', href: '/#work-experience' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
];

export const FOOTER_LINKS: { label: string; href: string }[] = [
  { label: 'Research', href: '/research' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Résumé', href: RESUME_URL },
];
