// scripts/inject-csp-hashes.mjs
//
// Postbuild step — see package.json's `build` script (`vite-react-ssg build
// && node scripts/inject-csp-hashes.mjs`).
//
// vite-react-ssg injects two small inline <script> tags into every
// prerendered page to support client-side hydration:
//   window.__staticRouterHydrationData = JSON.parse("...")   (content varies per route)
//   window.__VITE_REACT_SSG_HASH__ = '...'                   (a `Math.random()`
//     string, regenerated on every single build — see
//     node_modules/vite-react-ssg/dist/shared/vite-react-ssg.*.mjs, the
//     `const hash = Math.random().toString(36).substring(2, 12)` near the
//     `getLoaderDataFilePath`/`static-loader-data-manifest` logic)
//
// Neither script is application code, neither is influenced by user input,
// and neither can be made external (a `src=` file) without forking
// vite-react-ssg. A strict CSP must never use 'unsafe-inline' for script-src
// (that reopens the exact XSS hole CSP exists to close), so the only
// compliant option is to allow-list the exact SHA-256 hash of each inline
// script's *content*. Because both values above differ on every single
// build, those hashes can't be hand-written into firebase.json once — they
// have to be recomputed from the real rendered output on every build.
//
// This can't live in vite.config.ts's `liveRedirectsPlugin` (closeBundle):
// that hook fires once per Rollup bundle (client, then SSR), which is
// *before* vite-react-ssg's own "Rendering Pages" step ever writes
// dist/**/*.html — so the HTML this script needs to hash doesn't exist yet
// at that point. Hence a separate script, run after `vite-react-ssg build`
// has finished writing dist/, mirroring how liveRedirectsPlugin already
// rewrites firebase.json (JSON.parse -> mutate -> JSON.stringify(..., 2)).

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const FIREBASE_JSON_PATH = path.join(ROOT, 'firebase.json');

// Matches any <script ...> opening tag plus its body, non-greedy, across the
// whole file (script bodies never contain a literal "</script>" in this
// codebase's output). Captures the opening tag's attributes (group 1) and
// the raw body (group 2) so we can skip external (`src=`) scripts and hash
// the body exactly as it appears in the file — CSP hash-sources are defined
// over the literal element contents, no HTML-entity decoding involved.
const SCRIPT_RE = /<script([^>]*)>([\s\S]*?)<\/script>/g;

function walkHtmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkHtmlFiles(full));
    } else if (entry.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

function sha256Base64(text) {
  return createHash('sha256').update(text, 'utf-8').digest('base64');
}

function collectInlineScriptHashes(htmlFiles) {
  const hashes = new Set();
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8');
    for (const match of html.matchAll(SCRIPT_RE)) {
      const [, attrs, body] = match;
      if (/\bsrc\s*=/.test(attrs)) continue; // external script — governed by script-src's origin list, not a hash
      if (body.trim() === '') continue; // no inline content to authorize
      hashes.add(`'sha256-${sha256Base64(body)}'`);
    }
  }
  return [...hashes].sort(); // stable ordering -> stable diffs across builds when content repeats
}

function main() {
  const htmlFiles = walkHtmlFiles(DIST_DIR);
  if (htmlFiles.length === 0) {
    throw new Error(`inject-csp-hashes: no .html files found under ${DIST_DIR} — did vite-react-ssg build run first?`);
  }

  const hashSources = collectInlineScriptHashes(htmlFiles);
  if (hashSources.length === 0) {
    throw new Error(
      'inject-csp-hashes: found zero inline <script> tags across the built pages. ' +
        'That contradicts what this project shipped when its CSP was authored — if vite-react-ssg stopped ' +
        'emitting the hydration/hash bootstrap scripts, or a page now genuinely has none, update this check; ' +
        "don't silently ship a script-src with no inline-script allowance for a build that ended up needing one.",
    );
  }

  const config = JSON.parse(readFileSync(FIREBASE_JSON_PATH, 'utf-8'));
  const headerRule = config.hosting?.headers?.find((rule) => rule.source === '**');
  if (!headerRule) {
    throw new Error("inject-csp-hashes: firebase.json has no hosting.headers rule with source '**' to inject CSP hashes into.");
  }
  const cspHeader = headerRule.headers.find((h) => h.key === 'Content-Security-Policy');
  if (!cspHeader) {
    throw new Error("inject-csp-hashes: the '**' headers rule has no Content-Security-Policy entry to update.");
  }

  const directives = cspHeader.value.split(';').map((d) => d.trim()).filter(Boolean);
  const scriptSrcIndex = directives.findIndex((d) => d === 'script-src' || d.startsWith('script-src '));
  if (scriptSrcIndex === -1) {
    throw new Error("inject-csp-hashes: Content-Security-Policy has no script-src directive to inject hashes into.");
  }

  // Base sources are whatever is committed in firebase.json minus any
  // hashes left over from a previous build (so re-running this script is
  // idempotent instead of accumulating stale hashes forever).
  const baseSources = directives[scriptSrcIndex]
    .split(/\s+/)
    .slice(1) // drop the "script-src" token itself
    .filter((s) => !s.startsWith("'sha256-"));

  directives[scriptSrcIndex] = ['script-src', ...baseSources, ...hashSources].join(' ');
  cspHeader.value = directives.join('; ');

  writeFileSync(FIREBASE_JSON_PATH, JSON.stringify(config, null, 2) + '\n');
  console.log(
    `[inject-csp-hashes] wrote ${hashSources.length} inline-script hash(es) into firebase.json's Content-Security-Policy script-src (scanned ${htmlFiles.length} HTML files).`,
  );
}

main();
