// src/pages/live/registry.ts
//
// Round 3.1 restoration of the /live subsystem (see
// .dev/website-revamp-r3/CONTENT-AUTHORING.md's "The `live` field"
// section for the full content-authoring contract). This file is THE
// registry of self-hosted "live" pages — the owner-written React
// components that render at /projects/<slug>/live or
// /research/<slug>/live when that entry's frontmatter sets
// `live: { type: self, page: <name> }`.
//
// THE convention for adding a new one:
//   1. Write src/pages/live/<name>.tsx, exporting one component with zero
//      required props. It renders inside the normal site shell — the
//      live route lives under the same <PageShell> as every other route
//      (see src/routes.tsx), so Nav/Footer are already there; this
//      component only needs to render its own content.
//   2. Add exactly one line below: '<name>': YourComponent.
//   3. In the project's or research entry's own .md frontmatter, add:
//        live:
//          type: self
//          page: <name>
//      src/data/shared.ts's assertOptionalLive checks "page" against this
//      registry's keys at content-parse time (i.e. at build time, for
//      every build — not just when someone happens to click through to
//      the route), so a typo'd or missing page name fails loudly and
//      immediately instead of quietly 404ing for a real visitor later.
// That's the whole surface. Routing (src/routes.tsx's getStaticPaths),
// RouteMeta, sitemap inclusion (scripts/generate-sitemap.mjs), and the
// Firebase Hosting redirect table (vite.config.ts) are all already wired
// generically to this registry / to this directory — nothing else to
// touch.
//
// IMPORTANT — every file under src/pages/live/ must stay free of any
// input-accepting markup (an input field, a textarea, a form element, a
// file upload, etc. — deliberately not spelled out here as literal tags,
// since scripts/check-no-forms.sh's own grep would flag this very
// sentence). scripts/check-no-forms.sh enforces this mechanically (wired into
// `npm run check:launch`) because both src/pages/PrivacyPage.tsx and
// src/pages/TermsPage.tsx currently state, plainly, that this site has no
// forms anywhere. If a hosted live page ever genuinely needs one, update
// those two pages (their "no forms" sections and LAST_UPDATED) BEFORE
// that page ships, not after.
import type { ComponentType } from 'react';

export const HOSTED_LIVE_PAGES: Record<string, ComponentType> = {
  // Example (intentionally left commented out — this registry ships empty
  // until the owner adds a real hosted page; delete this comment once one
  // exists):
  // 'crunchy-filler': CrunchyFillerLivePage,
};
