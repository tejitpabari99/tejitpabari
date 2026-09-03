// vite-react-ssg augments Vite's `UserConfig` (adding `ssgOptions`) via a
// `declare module 'vite'` block in its own .d.ts. TS only applies an ambient
// augmentation to files inside the same compiled "program" as the file that
// declares it. This file is type-checked in isolation under
// tsconfig.node.json (only `include`s vite.config.ts), and nothing in this
// file otherwise imports from 'vite-react-ssg', so without this reference
// the augmentation is invisible here and `ssgOptions` below fails to
// typecheck ("does not exist in type 'UserConfigExport'"). This triple-slash
// reference pulls in vite-react-ssg's types for this file only, at zero
// runtime cost, which is the mechanism TS provides for exactly this case.
/// <reference types="vite-react-ssg" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import path from 'node:path';

// Round 3 (r3-01-schema-icons-content): this file used to also export
// `readLiveUrls` and a `liveRedirectsPlugin` that scanned every project's
// `liveUrl` frontmatter and wrote `firebase.json`'s `hosting.redirects` for
// each `/projects/<slug>/live` path at build time (closeBundle). Both
// `liveUrl` and the whole /live subsystem were removed in this round, so
// that plugin has nothing left to do — removed here rather than left as
// dead code that would otherwise still open/rewrite firebase.json on every
// `vite build` for no reason.

export default defineConfig({
  plugins: [react()], // sitemap.xml/robots.txt generation lives in scripts/generate-sitemap.mjs, run via the `prebuild` npm script — not a Vite plugin here.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  ssgOptions: {
    dirStyle: 'nested', // dist/<route>/index.html — matches juno-landing-page; plays cleanly with Firebase's cleanUrls
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    // scripts/check-launch-content.test.ts is the pre-launch content gate
    // (SP02 Task 10), run explicitly via `npm run check:launch`
    // (`CHECK_LAUNCH=1 vitest run scripts/check-launch-content.test.ts`),
    // not as part of the default `npm test` suite. `scripts/**` is excluded
    // here so `npm test`'s discovered file list/counts stay limited to
    // `src/`. Vitest applies `exclude` before it applies a CLI path
    // argument as a filter — an explicit `vitest run scripts/....test.ts`
    // is filtered out just like a bare `vitest run` would be — so
    // `check:launch` sets `CHECK_LAUNCH=1` to lift the exclusion for that
    // one invocation only, letting its own explicit file argument narrow
    // discovery back down to exactly that one file.
    exclude: process.env.CHECK_LAUNCH === '1' ? [...configDefaults.exclude] : [...configDefaults.exclude, 'scripts/**'],
  },
});
