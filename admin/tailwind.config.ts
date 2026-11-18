import type { Config } from 'tailwindcss';
import siteConfig from '../tailwind.config.ts';

// Admin reuses the site's design tokens as a preset. Content globs are
// admin-only (plus shared site components imported by admin), so the site's
// own CSS output is unaffected.
export default {
  presets: [siteConfig],
  content: ['./admin/index.html', './admin/src/**/*.{ts,tsx}', './src/components/TagPill.tsx'],
} satisfies Config;
