// scripts/normalize-ssg-build-id.mjs
//
// Postbuild step — runs BEFORE scripts/inject-csp-hashes.mjs (see
// package.json's `postbuild` script:
// `node scripts/normalize-ssg-build-id.mjs && node scripts/inject-csp-hashes.mjs`).
//
// --- The bug this fixes -----------------------------------------------
//
// vite-react-ssg's own `build()` (node_modules/vite-react-ssg/dist/shared/
// vite-react-ssg.*.mjs) mints one random, per-build cache-busting id:
//
//   const hash = Math.random().toString(36).substring(2, 12);
//
// and threads that SAME value through three places in dist/:
//   1. Every prerendered page gets an inline
//      `<script>window.__VITE_REACT_SSG_HASH__ = '<hash>'</script>` (this
//      is the second inline script inject-csp-hashes.mjs's own header talks
//      about).
//   2. Every route's client-side loader data is written to
//      `dist/static-loader-data/<route>.<hash>.json`.
//   3. The manifest mapping route -> that per-route file is written to
//      `dist/static-loader-data-manifest-<hash>.json`, and *that exact
//      filename* (built from `window.__VITE_REACT_SSG_HASH__` at runtime -
//      see the compiled `static-loader-data-manifest-${window.__VITE_REACT_SSG_HASH__}.json`
//      fetch in node_modules/vite-react-ssg/dist/index.mjs's
//      `transformStaticLoaderRoute`) is what the hydrated client fetches on
//      first client-side navigation to resolve loader data.
//
// Because `Math.random()` reseeds every build, an otherwise byte-identical
// rebuild of an unchanged source tree previously produced a different
// `<hash>` every time -> a different SHA-256 for the
// `window.__VITE_REACT_SSG_HASH__` inline script -> a different
// `firebase.json` CSP `script-src` allow-list every single build, with no
// underlying content change to justify it. (Confirmed empirically: two
// consecutive clean builds of an unchanged tree produced hashes
// `7kh2e326t4` and `h8fc59pq3a`, and diffing the two `dist/` trees after
// stripping every occurrence of each build's own hash showed the trees are
// otherwise byte-identical.)
//
// There is a SECOND, independent source of nondeterminism in the same
// area: `staticLoaderDataManifest` (the object serialized into
// `static-loader-data-manifest-<hash>.json`) is populated by a `PQueue`
// with `concurrency: 20` rendering all routes in parallel — so the order
// routes finish rendering, and therefore the key insertion order of that
// object, varies build to build even though the resulting *set* of
// route -> file mappings never does. `JSON.stringify` on a plain object
// preserves insertion order, so that file's bytes were ALSO nondeterministic
// independent of the hash. `sortManifestKeys` below fixes this by sorting
// the manifest by route path before writing it back out, unconditionally -
// so this is fixed even in the (already handled) case where the id itself
// happens not to change.
//
// --- The fix -------------------------------------------------------------
//
// Neither of the two random-hash's roles above can be removed - the
// hash-in-filename IS the cache-busting mechanism client-side navigation's
// loader-data fetch depends on (see the header comment above and
// `transformStaticLoaderRoute` in vite-react-ssg's runtime: it fetches
// `static-loader-data-manifest-${window.__VITE_REACT_SSG_HASH__}.json`,
// so the value embedded in the page's inline script and the manifest
// file's actual name MUST always match, in every file, or hydration breaks
// with a 404 on that fetch the moment a user navigates client-side to any
// route with loader data). So this script does not remove the hash - it
// replaces vite-react-ssg's *source of the hash* with a deterministic one,
// then rewrites every place the old value appears (inline script bodies,
// per-route loader-data filenames, the manifest file's own name, and the
// path strings inside the manifest) to the new one, consistently.
//
// The new id is a truncated SHA-256 of `dist/.vite/manifest.json` - Vite's
// own client build manifest, which lists every emitted client asset under
// its Rollup/Rolldown *content*-hashed filename (e.g. `index-a1b2c3d4.js`).
// That file is:
//   - already deterministic across repeated builds of an unchanged tree
//     (verified empirically alongside the fix above - byte-identical
//     across two clean builds), because Vite's own asset content hashes
//     are a pure function of the bundled output; and
//   - NOT a pure constant: editing real page content (verified empirically
//     by appending a line to a project's markdown source and rebuilding)
//     changes emitted chunk contents and therefore changes this manifest's
//     bytes, so the id this script derives from it still changes whenever
//     a real build output change would want callers to stop trusting an
//     old cached static-loader-data file - preserving the ORIGINAL
//     cache-busting property `__VITE_REACT_SSG_HASH__` exists for, just as
//     a pure function of the build instead of `Math.random()`.
//
// `dist/.vite/manifest.json` is written by vite-react-ssg's build() before
// this script runs (it reads that same file back itself to resolve asset
// preload tags — see the `manifest.json` read in its own `build()`), and is
// never touched by inject-csp-hashes.mjs, so it's safe to read here as an
// input rather than an output of this postbuild chain. It's also excluded
// from the actual Firebase Hosting deploy by firebase.json's
// `"ignore": [..., "**/.*", ...]` (anything under a dot-directory, which
// `dist/.vite/` is) — so this script depends on a real build artifact that
// exists on disk at exactly this point in the pipeline, but never ships.
//
// If this normalization step were ever removed: `firebase.json` would
// resume changing on every single build with no real content change
// (the original bug), because the CSP hash of the
// `window.__VITE_REACT_SSG_HASH__` inline script — and, independently, the
// key order inside `static-loader-data-manifest-*.json` — would go back to
// being nondeterministic. Removing only the manifest-key-sort (leaving the
// id-substitution in place) would still leave `dist/`'s
// `static-loader-data-manifest-*.json` file nondeterministic byte-for-byte
// build to build, even though `firebase.json` itself would stay stable
// (that file isn't HTML and isn't scanned for CSP hashes) — so both halves
// of this script matter even though only one of them is visible in
// `firebase.json`.

import { readFileSync, writeFileSync, readdirSync, statSync, renameSync, unlinkSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');

// Same recursive walk inject-csp-hashes.mjs does — duplicated rather than
// imported so this script has no dependency on that one's internals (they
// run as two separate `node <script>.mjs` processes in the `postbuild` npm
// script, not as a shared module graph).
export function walkFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkFiles(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

// Pure: derives the deterministic build id from the client asset manifest's
// raw bytes. Exported so the regression test can assert the determinism
// property (same bytes in -> same id out; different bytes -> a different
// id) without needing to run a real `vite-react-ssg build`. Truncated to 10
// hex characters — no shorter than the ~10 base36 characters
// `Math.random().toString(36).substring(2, 12)` used to produce, so this
// doesn't meaningfully shrink the cache-busting id's collision space.
export function computeDeterministicBuildId(manifestBytes) {
  return createHash('sha256').update(manifestBytes).digest('hex').slice(0, 10);
}

// Pure: given the static-loader-data-manifest's parsed
// `{ routePath: relativeFilePath }` object (whose key order is
// nondeterministic — see header comment), returns a NEW object with the
// same entries in sorted-by-route-path order, and every relative file path
// rewritten to swap `oldId` for `newId`. Throws instead of silently
// skipping a path that doesn't match the expected
// `static-loader-data/<route>.<oldId>.json` shape — a mismatch here means
// vite-react-ssg changed its output format and this script's assumptions
// need re-checking, not a build that silently ships a broken manifest.
export function rewriteLoaderDataManifest(manifest, oldId, newId) {
  const suffix = `.${oldId}.json`;
  const out = {};
  for (const routePath of Object.keys(manifest).sort()) {
    const relPath = manifest[routePath];
    if (!relPath.endsWith(suffix)) {
      throw new Error(
        `normalize-ssg-build-id: static-loader-data-manifest entry for "${routePath}" ("${relPath}") does not end ` +
          `with the expected ".${oldId}.json" suffix — vite-react-ssg's loader-data filename format may have changed.`,
      );
    }
    out[routePath] = relPath.slice(0, -suffix.length) + `.${newId}.json`;
  }
  return out;
}

function findLoaderDataManifestFile() {
  const candidates = readdirSync(DIST_DIR).filter((f) => /^static-loader-data-manifest-.+\.json$/.test(f));
  if (candidates.length === 0) {
    throw new Error(
      `normalize-ssg-build-id: no static-loader-data-manifest-*.json found directly under ${DIST_DIR} — did ` +
        '`vite-react-ssg build` run first, or has its output filename format changed?',
    );
  }
  if (candidates.length > 1) {
    throw new Error(
      `normalize-ssg-build-id: expected exactly one static-loader-data-manifest-*.json under ${DIST_DIR}, found ` +
        `${candidates.length} (${candidates.join(', ')}) — is dist/ from a previous build not cleaned before this one?`,
    );
  }
  const filename = candidates[0];
  const match = filename.match(/^static-loader-data-manifest-(.+)\.json$/);
  return { filename, oldId: match[1] };
}

function main() {
  const clientManifestPath = path.join(DIST_DIR, '.vite', 'manifest.json');
  if (!existsSync(clientManifestPath)) {
    throw new Error(
      `normalize-ssg-build-id: ${clientManifestPath} not found — vite-react-ssg's client build should always emit ` +
        "this (`manifest: true` in its client build() call). Without it there's no deterministic input to derive " +
        'this build\'s id from.',
    );
  }
  const newId = computeDeterministicBuildId(readFileSync(clientManifestPath));

  const { filename: oldManifestFilename, oldId } = findLoaderDataManifestFile();
  const oldManifestPath = path.join(DIST_DIR, oldManifestFilename);
  const rawManifest = JSON.parse(readFileSync(oldManifestPath, 'utf-8'));

  // Rename every per-route static-loader-data/<route>.<oldId>.json to
  // .<newId>.json BEFORE writing the new manifest (which references the
  // post-rename paths) — if this were done after, and the process died in
  // between, dist/ could be left with a manifest pointing at files that no
  // longer exist under their old names.
  const newManifest = rewriteLoaderDataManifest(rawManifest, oldId, newId);
  for (const routePath of Object.keys(rawManifest)) {
    const oldRelPath = rawManifest[routePath];
    const newRelPath = newManifest[routePath];
    if (oldRelPath === newRelPath) continue; // newId === oldId (astronomically unlikely, but a no-op rename is still correct)
    const oldAbs = path.join(DIST_DIR, oldRelPath);
    const newAbs = path.join(DIST_DIR, newRelPath);
    if (!existsSync(oldAbs)) {
      throw new Error(`normalize-ssg-build-id: static-loader-data-manifest referenced ${oldRelPath}, but that file does not exist.`);
    }
    renameSync(oldAbs, newAbs);
  }

  const newManifestFilename = `static-loader-data-manifest-${newId}.json`;
  const newManifestPath = path.join(DIST_DIR, newManifestFilename);
  // No trailing newline / pretty-printing: this file is a machine-fetched
  // runtime artifact (see transformStaticLoaderRoute's `fetch`), not
  // developer-facing, and vite-react-ssg itself writes it with
  // `JSON.stringify(staticLoaderDataManifest, null, 0)` — matching that
  // exactly keeps this rewritten file's format indistinguishable from what
  // vite-react-ssg would have written itself, had its own hash been stable.
  writeFileSync(newManifestPath, JSON.stringify(newManifest, null, 0));
  if (newManifestPath !== oldManifestPath) {
    unlinkSync(oldManifestPath);
  }

  // Rewrite the `window.__VITE_REACT_SSG_HASH__ = '<oldId>'` inline script
  // in every prerendered HTML page to the new id. Runs BEFORE
  // inject-csp-hashes.mjs's promote404() copies dist/404/index.html to
  // dist/404.html, so both the original and the promoted copy end up with
  // the same rewritten (and therefore identical, therefore
  // single-hash-in-the-allow-list) inline script — promote404() is a
  // literal `copyFileSync`, so as long as this runs first there's nothing
  // further for it to do here.
  const oldAssignment = `window.__VITE_REACT_SSG_HASH__ = '${oldId}'`;
  const newAssignment = `window.__VITE_REACT_SSG_HASH__ = '${newId}'`;
  const htmlFiles = walkFiles(DIST_DIR).filter((f) => f.endsWith('.html'));
  let rewrittenCount = 0;
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8');
    if (!html.includes(oldAssignment)) continue;
    writeFileSync(file, html.split(oldAssignment).join(newAssignment));
    rewrittenCount++;
  }
  if (rewrittenCount === 0) {
    throw new Error(
      'normalize-ssg-build-id: found zero HTML files containing the expected ' +
        `"${oldAssignment}" inline script — vite-react-ssg's hydration bootstrap script format may have changed; ` +
        'update the string this script matches against.',
    );
  }

  console.log(
    `[normalize-ssg-build-id] replaced vite-react-ssg's random per-build id (${oldId}) with a deterministic one ` +
      `(${newId}, derived from dist/.vite/manifest.json) across ${rewrittenCount} HTML file(s) and ` +
      `${Object.keys(newManifest).length} static-loader-data file(s), and sorted the loader-data manifest by route.`,
  );
}

main();
