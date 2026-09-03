// src/lib/bufferPolyfill.ts
//
// Real bug fixed here (round 3 final pass): src/data/projects.ts and
// src/data/research.ts import `gray-matter` and call `matter()` on every
// content file at MODULE TOP LEVEL (`import.meta.glob(..., { eager: true
// })` then `.map(parseProject)`). Those data modules are imported, directly
// or transitively, by almost every page and by Nav/FeaturedProjectsSection
// on the home page, so they end up in the CLIENT bundle, not just the
// server-render pass. gray-matter (via its `strip-bom-string`/`kind-of`
// helpers) calls `Buffer.from(...)` unconditionally on every parse, and a
// real browser has no global `Buffer` — Node's SSR pass and Vitest's jsdom
// test environment both run inside a real Node process, so `Buffer` exists
// there and this never surfaced in tests or in the build log. In an actual
// browser it throws `ReferenceError: Buffer is not defined` while the
// `projects`/`research` arrays are being computed, which crashes that
// module's evaluation before `main.tsx`'s `ViteReactSSG(...)` call ever
// runs — the page still SHOWS the server-rendered static HTML (it was
// already in the response), but React never hydrates it, so nothing is
// interactive: no click handlers, no search, no working tag-pill filters.
// This was previously misdiagnosed as purely a CSP/hydration-data problem
// (see .dev/website-revamp-r3/BUG-DIAGNOSIS.md Bug 1) — that CSP fix was
// necessary but not sufficient; this was the other, independent cause of
// the exact same symptom ("looks correct, does nothing"), confirmed with a
// real headless-browser pageerror stack trace pointing at
// `parseProject` -> gray-matter's `toBuffer` -> `Buffer.from`.
//
// Fix: polyfill `Buffer` globally in the browser using the standard
// `buffer` npm package (Feross's userland reimplementation — this is the
// conventional fix for "Node library used in a Vite/browser bundle needs
// Buffer" and is what bundlers like webpack used to provide automatically
// via `node-libs-browser` before that stopped being the default). Must be
// imported before anything that transitively imports `src/data/*` — see
// `src/main.tsx`, where this is the very first import.
//
// Not fixed by restructuring the data pipeline to keep gray-matter/js-yaml
// out of the client bundle entirely (e.g. parsing content only at build
// time and shipping plain JSON to the client) — that would be a real
// bundle-size win (this pulls a full YAML+markdown-frontmatter parser into
// client JS for data that's static at build time) but is a materially
// larger refactor than this final-pass scope justifies, since `projects` /
// `research` / `workExperience` are imported synchronously by many page
// and test files today. Flagged in ROUND-3-SUMMARY.md as a design note for
// a future round, not attempted here.
import { Buffer } from 'buffer';

declare global {
  interface Window {
    Buffer?: typeof Buffer;
  }
}

if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer;
}
