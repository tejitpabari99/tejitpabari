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
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import matter from 'gray-matter';
import type { Plugin } from 'vite';

const PROJECTS_DIR = path.resolve(__dirname, 'src/content/projects');

// Independent of src/data/projects.ts on purpose — same reasoning
// juno-landing-page's own sitemapPlugin documents: import.meta.glob is a
// Vite *application*-build-pipeline macro, not guaranteed to resolve from
// vite.config.ts's own lighter esbuild-based load path. This plugin does its
// own small fs + gray-matter scan instead. It does NOT re-validate
// frontmatter — the main build's loader (SP02) already fails loudly on bad
// content before this plugin's closeBundle runs.
export function readLiveUrls(dir: string): { slug: string; liveUrl: string }[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => matter(readFileSync(path.join(dir, f), 'utf-8')).data)
    .filter((data): data is { slug: string; liveUrl: string } => typeof data.liveUrl === 'string')
    .map(({ slug, liveUrl }) => ({ slug, liveUrl }));
}

function liveRedirectsPlugin(): Plugin {
  return {
    name: 'live-redirects',
    // Build-only: closeBundle otherwise also fires as a side effect of
    // Vitest's own config loading (Vitest resolves/loads vite.config.ts and
    // runs the plugin pipeline even though it never performs a real bundle),
    // which would silently rewrite the real firebase.json on every `npm
    // test` / `npx vitest run`. `apply: 'build'` scopes this plugin (and
    // therefore its closeBundle hook) to `vite build` only, leaving `vite
    // dev` and Vitest untouched, without changing any build-time behavior.
    apply: 'build',
    closeBundle() {
      const entries = readLiveUrls(PROJECTS_DIR);
      const firebaseJsonPath = path.resolve(__dirname, 'firebase.json');
      const config = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'));
      config.hosting.redirects = entries.map(({ slug, liveUrl }) => ({
        source: `/projects/${slug}/live`,
        destination: liveUrl,
        type: 302, // temporary — liveUrl is content the owner can change; a
                   // permanent 301 risks a browser/crawler caching a stale
                   // destination past the next content edit.
      }));
      writeFileSync(firebaseJsonPath, JSON.stringify(config, null, 2) + '\n');
    },
  };
}

export default defineConfig({
  plugins: [react(), liveRedirectsPlugin() /* SP06 adds its own sitemapPlugin() alongside this */],
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
