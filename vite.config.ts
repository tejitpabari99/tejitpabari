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
const RESEARCH_DIR = path.resolve(__dirname, 'src/content/research');

export interface LiveRedirectEntry {
  source: string;
  destination: string;
}

// Round 3.1 restoration of the /live subsystem, revised in round 3.3 per
// the owner's clarified resolution rules (see
// .dev/website-revamp-r3/CONTENT-AUTHORING.md's "The `live` field"
// section for the full authoring contract, and
// src/lib/resolveLiveLinks.ts's header comment for the same three-rule
// order implemented there for the client-side dispatch pages). Every
// project/research entry gets a canonical, stable `/projects/<slug>/live`
// (or `/research/<slug>/live`) URL - this function computes the Firebase
// Hosting redirect table entry for every slug that needs an ACTUAL
// redirect:
//   1. `live.type: external` -> redirect to live.href. `live.type: self`
//      renders its own prerendered HTML at this exact path - no redirect
//      entry at all for that case (a redirect there would be wrong).
//   2. No `live` field, but links[] non-empty -> redirect to whichever
//      entry is marked primary: true, or links[0] if none is.
//   3. No `live` field and no links[] at all -> redirect to the entry's
//      own detail page.
// This MUST implement the exact same resolution order as
// src/lib/resolveLiveLinks.ts's resolveLiveTarget, or a real deployed
// cold /live hit (this plugin) and the client-side fallback
// (ProjectLivePage/ResearchLivePage, which calls resolveLiveTarget
// directly) could disagree about where a given /live goes.
//
// Independent of src/data/*.ts and src/lib/resolveLiveLinks.ts on purpose
// - same reasoning juno-landing-page's own sitemapPlugin documents (and
// scripts/generate-sitemap.mjs's own header comment repeats): import.meta.glob
// is a Vite *application*-build-pipeline macro, not guaranteed to resolve
// from vite.config.ts's own lighter esbuild-based load path, and this
// project's TS path alias ('@/...') isn't guaranteed to resolve here
// either. This plugin does its own small fs + gray-matter scan and
// reimplements the (small) resolution logic locally instead.
//
// It DOES validate `live.href` itself (mirroring src/data/shared.ts's
// assertAbsoluteUrl) rather than deferring to the main build's loader
// (same reasoning as the pre-round-3 readLiveUrls this replaces):
// closeBundle fires during vite-react-ssg's *client* bundle step, while
// assertOptionalLive only runs later, during SSR route rendering. An
// invalid href (e.g. a protocol-relative "//evil.com/phish", which Firebase
// Hosting would serve as an open redirect off tejitpabari.com) would
// otherwise be written into firebase.json's hosting.redirects BEFORE the
// SSR step ever gets a chance to reject it - leaving a corrupted
// firebase.json on disk even though the build then aborts. A links[]
// entry's href has no such absolute-URL requirement in the schema (an
// internal "/projects/other-slug" link is valid too), so - matching
// assertLinks (src/data/shared.ts), which doesn't require one either -
// only `live.href` gets that stricter check here.
export function readLiveRedirects(dir: string, routePrefix: 'projects' | 'research'): LiveRedirectEntry[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ file: f, data: matter(readFileSync(path.join(dir, f), 'utf-8')).data as Record<string, unknown> }))
    .flatMap(({ file, data }): LiveRedirectEntry[] => {
      const slug = data.slug;
      if (typeof slug !== 'string' || !slug) {
        throw new Error(`readLiveRedirects: ${path.join(dir, file)} has no string "slug" in its frontmatter.`);
      }
      const source = `/${routePrefix}/${slug}/live`;
      const live = data.live as Record<string, unknown> | undefined;

      // Rule 1.
      if (live !== undefined) {
        if (live.type === 'self') {
          return []; // self-hosted: renders its own page, no redirect at all
        }
        if (live.type === 'external') {
          const href = live.href;
          if (typeof href !== 'string' || !/^https?:\/\//.test(href)) {
            throw new Error(
              `readLiveRedirects: ${path.join(dir, file)}: "live.href" must be an absolute http(s) URL. Got ${JSON.stringify(href)}.`,
            );
          }
          return [{ source, destination: href }];
        }
        throw new Error(
          `readLiveRedirects: ${path.join(dir, file)}: "live.type" must be "self" or "external". Got ${JSON.stringify(live.type)}.`,
        );
      }

      // Rules 2/3: no `live` field - fall back to links[], then to the
      // entry's own detail page. `links` is a required field in the real
      // schema (assertLinks, src/data/shared.ts), but this script reads
      // raw, not-yet-validated frontmatter, so it tolerates a missing/
      // malformed value defensively rather than assuming the schema
      // already held by the time this runs.
      const rawLinks = Array.isArray(data.links) ? (data.links as Record<string, unknown>[]) : [];
      const primary = rawLinks.find((link) => link && link.primary === true && typeof link.href === 'string' && link.href);
      if (primary) {
        return [{ source, destination: primary.href as string }];
      }
      const first = rawLinks.find((link) => link && typeof link.href === 'string' && link.href);
      if (first) {
        return [{ source, destination: first.href as string }];
      }
      return [{ source, destination: `/${routePrefix}/${slug}` }];
    });
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
      // A full replace, not an append/merge - this is what keeps repeated
      // `npm run build` invocations idempotent (never duplicating or
      // accumulating stale redirect entries): every run recomputes the
      // complete table from current content and overwrites
      // hosting.redirects wholesale. scripts/inject-csp-hashes.mjs (the
      // separate postbuild step) only ever touches hosting.headers's CSP
      // entry on the same firebase.json object, so it can't disturb what
      // this hook wrote here.
      const entries = [
        ...readLiveRedirects(PROJECTS_DIR, 'projects'),
        ...readLiveRedirects(RESEARCH_DIR, 'research'),
      ];
      const firebaseJsonPath = path.resolve(__dirname, 'firebase.json');
      const config = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'));
      config.hosting.redirects = entries.map(({ source, destination }) => ({
        source,
        destination,
        // 301 (permanent), not the pre-round-3 302: the whole point of the
        // canonical /live URL is a stable, owner-controlled indirection the
        // owner hands out and shares - a cold hit on it should redirect
        // immediately and cache well, not flash the app first. The owner
        // updates the destination by editing frontmatter and redeploying,
        // same as any other content change; a stale cached 301 is no
        // different from a stale cached page anywhere else on this static
        // site.
        type: 301,
      }));
      writeFileSync(firebaseJsonPath, JSON.stringify(config, null, 2) + '\n');
    },
  };
}

export default defineConfig({
  plugins: [react(), liveRedirectsPlugin()], // sitemap.xml/robots.txt generation lives in scripts/generate-sitemap.mjs, run via the `prebuild` npm script — not a Vite plugin here.
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
