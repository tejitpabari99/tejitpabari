// scripts/inject-csp-hashes.mjs
//
// Postbuild step — see package.json's `postbuild` script
// (`node scripts/normalize-ssg-build-id.mjs && node scripts/inject-csp-hashes.mjs`,
// itself run after `vite-react-ssg build` via the `build` script).
//
// vite-react-ssg injects two small inline <script> tags into every
// prerendered page to support client-side hydration:
//   window.__staticRouterHydrationData = JSON.parse("...")   (content varies per route)
//   window.__VITE_REACT_SSG_HASH__ = '...'                   (a cache-busting
//     id for the client's loader-data fetch — see
//     node_modules/vite-react-ssg/dist/shared/vite-react-ssg.*.mjs, the
//     `getLoaderDataFilePath`/`static-loader-data-manifest` logic)
//
// vite-react-ssg itself mints that second value with
// `Math.random().toString(36).substring(2, 12)`, regenerated on every
// single build regardless of whether the source tree changed at all. Left
// alone, that means this script's *own* hash of that inline script would
// differ every build, and so would the firebase.json this script writes —
// which is exactly the nondeterminism problem that motivated
// scripts/normalize-ssg-build-id.mjs (run immediately before this script in
// the `postbuild` chain — see that file's header for the full
// investigation and fix). By the time THIS script runs, that random value
// has already been replaced, consistently across every HTML file and every
// static-loader-data filename, with a deterministic id derived from the
// build's own content — so from this script's point of view, both inline
// scripts above are now purely a function of the rendered output, and
// hashing them here is deterministic. Do not remove that earlier step
// without re-reading its header: this script has no way to tell a
// legitimately-changed hash from `Math.random()` noise, so it would go
// back to silently producing a different firebase.json on every rebuild of
// an unchanged tree.
//
// Neither script is application code, neither is influenced by user input,
// and neither can be made external (a `src=` file) without forking
// vite-react-ssg. A strict CSP must never use 'unsafe-inline' for script-src
// (that reopens the exact XSS hole CSP exists to close), so the only
// compliant option is to allow-list the exact SHA-256 hash of each inline
// script's *content*. Because the hydration-data script's content varies
// per route, those hashes can't be hand-written into firebase.json once —
// they have to be recomputed from the real rendered output on every build.
//
// This can't live in vite.config.ts's `liveRedirectsPlugin` (closeBundle):
// that hook fires once per Rollup bundle (client, then SSR), which is
// *before* vite-react-ssg's own "Rendering Pages" step ever writes
// dist/**/*.html — so the HTML this script needs to hash doesn't exist yet
// at that point. Hence a separate script, run after `vite-react-ssg build`
// has finished writing dist/, mirroring how liveRedirectsPlugin already
// rewrites firebase.json (JSON.parse -> mutate -> JSON.stringify(..., 2)).

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const FIREBASE_JSON_PATH = path.join(ROOT, 'firebase.json');

// --- 404 promotion --------------------------------------------------------
//
// Firebase Hosting's automatic 404 fallback requires a file literally named
// `404.html` (optionally per-directory) at the root of `public`. This
// project's vite.config.ts sets `dirStyle: 'nested'`, so vite-react-ssg
// writes every route, including a `404` route, as `<path>/index.html`,
// never as a bare `<path>.html`. So `src/routes.tsx` needs an enumerable
// route (`{ path: '404', element: <NotFoundPage /> }`, alongside the
// existing `path: '*'` catch-all which stays for client-side navigation)
// that produces `dist/404/index.html`, and this step promotes that file to
// `dist/404.html`. Runs BEFORE hash collection below so the CSP hash scan
// also covers the promoted file.
function promote404() {
  const src = path.join(DIST_DIR, '404', 'index.html');
  const dest = path.join(DIST_DIR, '404.html');
  if (!existsSync(src)) {
    throw new Error(
      'inject-csp-hashes: dist/404/index.html not found - cannot produce dist/404.html for Firebase Hosting\'s ' +
        'automatic 404 fallback (see firebase.json, which no longer has a catch-all rewrite to fall back on). ' +
        'This means src/routes.tsx is missing an enumerable 404 route, e.g.:\n' +
        "    { path: '404', element: <NotFoundPage /> }\n" +
        "added alongside the existing `{ path: '*', element: <NotFoundPage /> }` catch-all (which must stay, for " +
        'client-side navigation to unknown paths after hydration). See .dev/website-revamp-r3/BUGFIX-NOTES.md, ' +
        '"Handoff" section, for the exact change. Until that route lands in src/routes.tsx, this build is expected ' +
        'to fail here rather than silently ship with no 404 page.',
    );
  }
  copyFileSync(src, dest);
  console.log("[inject-csp-hashes] promoted dist/404/index.html -> dist/404.html for Firebase Hosting's automatic 404 fallback.");
}

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

// Returns { hashSources, perFile }: hashSources is the deduped, sorted list
// of `'sha256-...'` source tokens to write into script-src; perFile is a
// flat list of { file, hash } entries (one per inline script found,
// duplicates included) used later to report exactly which file/script is
// missing if verification ever fails.
function collectInlineScriptHashes(htmlFiles) {
  const hashes = new Set();
  const perFile = [];
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8');
    for (const match of html.matchAll(SCRIPT_RE)) {
      const [, attrs, body] = match;
      if (/\bsrc\s*=/.test(attrs)) continue; // external script — governed by script-src's origin list, not a hash
      if (body.trim() === '') continue; // no inline content to authorize
      const hash = `'sha256-${sha256Base64(body)}'`;
      hashes.add(hash);
      perFile.push({ file, hash });
    }
  }
  return { hashSources: [...hashes].sort(), perFile }; // stable ordering -> stable diffs across builds when content repeats
}

// Safety net: re-reads firebase.json fresh from disk (not the in-memory
// `config` object this script just wrote) and confirms every inline
// <script> found in dist/**/*.html actually has its hash present in the
// written script-src directive. Without this, a future refactor of this
// script, a partial/failed write, or any build path that bypasses this
// script entirely could silently ship a firebase.json whose CSP blocks a
// real inline script, exactly the failure mode that broke /projects'
// tag-filter and search hydration in production. Fails loudly, naming the
// offending file, rather than warning.
function verifyHashesLanded(perFile) {
  const config = JSON.parse(readFileSync(FIREBASE_JSON_PATH, 'utf-8'));
  const headerRule = config.hosting?.headers?.find((rule) => rule.source === '**');
  const cspHeader = headerRule?.headers?.find((h) => h.key === 'Content-Security-Policy');
  if (!cspHeader) {
    throw new Error('inject-csp-hashes: verification failed - could not re-read a Content-Security-Policy header from firebase.json after writing it.');
  }
  const directives = cspHeader.value.split(';').map((d) => d.trim());
  const scriptSrcDirective = directives.find((d) => d === 'script-src' || d.startsWith('script-src '));
  if (!scriptSrcDirective) {
    throw new Error('inject-csp-hashes: verification failed - firebase.json has no script-src directive after writing it.');
  }
  const writtenSources = new Set(scriptSrcDirective.split(/\s+/).slice(1));

  const missing = perFile.filter(({ hash }) => !writtenSources.has(hash));
  if (missing.length > 0) {
    const detail = missing
      .map(({ file, hash }) => `  - ${path.relative(ROOT, file)}: missing ${hash}`)
      .join('\n');
    throw new Error(
      `inject-csp-hashes: verification FAILED after writing firebase.json - ${missing.length} inline <script> tag(s) ` +
        `in dist/**/*.html do not have a matching 'sha256-...' entry in the Content-Security-Policy script-src ` +
        `directive that was just written:\n${detail}\n` +
        'A real browser would refuse to execute these scripts, breaking hydration (this is exactly the bug that made ' +
        '/projects\' tag filters and search appear to do nothing). Do not deploy this dist/firebase.json pair.',
    );
  }
}

function main() {
  promote404();

  const htmlFiles = walkHtmlFiles(DIST_DIR);
  if (htmlFiles.length === 0) {
    throw new Error(`inject-csp-hashes: no .html files found under ${DIST_DIR} — did vite-react-ssg build run first?`);
  }

  const { hashSources, perFile } = collectInlineScriptHashes(htmlFiles);
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

  verifyHashesLanded(perFile);
  console.log(
    `[inject-csp-hashes] verified: all ${perFile.length} inline <script> tag(s) across ${htmlFiles.length} HTML files have a matching sha256 source in firebase.json's script-src.`,
  );
}

main();
