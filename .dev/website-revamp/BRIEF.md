# tejitpabari.com Rewrite — Design Brief

## 1. Problem

`tejitpabari.com` runs on a half-finished Gatsby 5 + Chakra UI scaffold. The About page is empty, project "cards" are a hardcoded array rendered through a single generic `Writeup` component (`src/components/common/writeup.js`) with no individual project pages, and all content — projects, work experience, research — lives in inline JS arrays inside the page files themselves (`src/pages/projects.js`, `src/pages/work-experience.js`, `src/pages/research.js`). There is no way to link someone to one project, no OG/share metadata worth the name, and no visual identity beyond default Chakra theming with a light/dark toggle nobody asked for.

Tejit is mid-transition: SWE II on Microsoft Fabric Maps (geospatial) by day, founder/CEO of **Juno** — an AI companion for medical appointments — the rest of the time, with Juno on a path to full-time. The site currently reads as a geospatial engineer's leftover portfolio. It needs to:

1. Reposition him as a health-tech builder, not a Maps engineer with side projects.
2. Present projects as first-class, individually linkable, individually shareable pages — built to scale past the current 10 as he ships more.
3. Become the place he hosts small public projects under his own domain, not scattered across Vercel/short.gy/Chrome Web Store links.

Audience: recruiters, potential collaborators, clinicians/researchers evaluating Juno, and people arriving cold from a LinkedIn post — which makes server-rendered share-preview correctness (OG tags real crawlers can read) a functional requirement, not polish.

## 2. Decision log

Every settled decision, grouped by area. Nothing here is open for re-litigation in this brief — open items are called out separately in §5 and inline as "owner-only."

### Stack & infra

| Decision | Alternative rejected | Why |
|---|---|---|
| `vite-react-ssg` (React 19 + Vite, prerendered to static HTML per route) | **Astro** — genuinely preferable on a blank slate (typed content collections, less shipped JS) | Discarded because the owner just validated this exact stack end-to-end in `juno-landing-page`: legal pages, consent banner, analytics guard, and SEO/prerender plumbing all port over directly. A better blank-slate choice isn't worth re-deriving working infrastructure. |
| `vite-react-ssg` (cont.) | **Next.js static export** — matches techfolio's own stack, maximizing copy-paste fidelity from the reference | Adds MDX plumbing for four content types vite-react-ssg already handles via `gray-matter`/`react-markdown`, plus a much heavier toolchain for what is ultimately a static site. |
| Tailwind, `react-markdown` + `gray-matter` + `remark-gfm` + `@tailwindcss/typography`, `fuse.js` for search | — | Directly reused from `juno-landing-page`'s working configuration; no new library decisions needed. |
| **Firebase Hosting** | Cloudflare Pages — more generous free bandwidth | Bandwidth headroom is never reached by a personal portfolio; not a real differentiator. |
| Firebase Hosting (cont.) | Netlify — the current host | Firebase gives one deploy story consistent with `juno-landing-page`, the owner's other live site, instead of maintaining two hosting providers and two mental models. |
| **Rewrite in place on a branch** of `github.com/tejitpabari99/tejitpabari`; delete `src/` and all `gatsby-*` files; old code becomes a content quarry only | A fresh repo | Loses commit history and, more importantly, the existing domain/DNS wiring on the current repo. Old Gatsby site stays live on `main` until the branch merges — zero downtime during the rewrite. |
| Per-route static HTML with correct `og:`/Twitter tags is treated as load-bearing, not a nicety | A client-rendered SPA with JS-injected `<meta>` tags | LinkedIn and Facebook crawlers do not execute JavaScript. Static per-route HTML is the *only* way share previews render correctly — this constraint drives the SSG stack choice above and the `RouteMeta` pattern in §3. |

### Site map, routes & nav

| Decision | Alternative rejected | Why |
|---|---|---|
| `/` is one landing page: Hero → Projects (featured) → Work Experience (timeline) → About → Contact, nav links scroll to anchors | Keeping each section as its own top-level page (current site's structure) | A first-time visitor — recruiter or LinkedIn click-through — should get the full pitch without navigating; dedicated sub-pages exist for anyone who wants the full list of any one thing. |
| `/projects/<slug>/live` is dual-mode: redirects to `liveUrl` if the project's frontmatter sets one, otherwise a real hosted page exists at that path | Redirect-only, always pointing off-site | The owner explicitly wants small projects hosted on his own domain, not just linked out to Vercel/Chrome Web Store/etc. A hosted mini-project is just another React route in the same app. |
| Nav = **Projects, Work Experience, About, Contact** only; nothing in the top-left corner | Keeping "Tejit Pabari" as a clickable wordmark top-left (current header) | Explicit owner instruction: no logo, no name in the nav bar. |
| Research is **not** in the nav; reachable only from the footer | Keeping Research in the main nav (current site includes it) | Research is a secondary credential, not part of the primary health-tech pitch; demoting it keeps the nav to four items that all point at things a recruiter cares about first. |
| `/research` uses the same search + tag-filter component as `/projects` | Tag pills only | It's the same component at no extra cost, and the original count-based argument for cutting search on `/research` was wrong — the source holds 6 research entries, not the ~3 an earlier draft of this brief assumed. |
| Footer = Research, Résumé, techfolio credit line, copyright. No social icons in the footer | Repeating GitHub/LinkedIn icons in the footer | They already appear in the hero and in the Contact "Connect" aside; a third copy is noise. |
| Sub-pages (`/projects`, `/research`, `/work-experience`, all `<slug>` detail pages) carry a back button at the top, targeting `/` | Relying on the nav bar or browser back | The nav bar has no "home" affordance once you're off the landing page (no logo to click), so an explicit back button is the only way back. |
| Card click always routes to `/<collection>/<slug>` — never straight out to an external URL | Linking straight out when a project has no written body | Identical-looking cards would behave two different ways depending on invisible frontmatter. One predictable behavior keeps the visitor on-site; the card still carries a small external-link affordance as a shortcut, and the detail page surfaces the links row near the top. |
| A project/research page with no `body` still renders correctly from `description` + `links` | Requiring a body before a project can be published | No dead ends — a project can go live with just a card blurb and links, and grow a full writeup later. |
| Work experience has **no detail pages** | A `/work-experience/<slug>` route per role | If a role deserves a full writeup, it becomes a Project instead — one content model per "this deserves its own page," not two. |

### Content model

| Decision | Alternative rejected | Why |
|---|---|---|
| Four markdown collections (Projects, Research, Work Experience, Legal) with frontmatter validated at build time | Untyped/unvalidated frontmatter | A typo in frontmatter should fail the build, not silently break a card or a share preview. |
| Projects tags fixed at **Health Tech · Developer Tools · Others** | Freeform tags | Freeform tags fragment the filter UI as more projects ship; a small fixed set stays legible at 10 projects and at 50. |
| Projects/Research `status`, when set, fixed at **Building · Not Started · Completed** ("Shipped" is a synonym of Completed, not a fourth value) | A fourth "Shipped" state | Collapses a distinction ("Completed" vs "Shipped") that doesn't change anything the site needs to render — status is a single pill on the card image. |
| **Featured projects = an ordered slug array in `src/config/featured.ts`**, capped at 6, unfilled slots backfill with most recent by date | A `featured` frontmatter boolean, or a boolean *plus* an array | Two places to check when the homepage shows something unexpected. One file is the single source of truth. |
| **`status` is optional (`status?`)** on Projects/Research — Med-Doc Tracker and Clip-Verse ship with none | Requiring every project/research entry to declare a status | The owner decided some entries genuinely don't need one; when `status` is absent the card renders **no pill at all** (no default value, no "Unknown" pill, no reserved space). Build-time frontmatter validation accepts a missing `status` but still rejects an invalid one. |
| **SMARTtest lives in Projects only** — removed from Research | Keeping it in both collections, or filing it under Research alone | It's a shipped product with 1,000+ downloads that happens to have a paper attached, not a pure research output; the paper and news-coverage links carry over as its `links[]`. Settled, not a recommendation. |
| Research tags fixed at **Health · Machine Learning · Other**, multi-tagging allowed (`tags[]`, same array shape as Projects, so `/research` uses the same filter component) | The four-tag set: Health & Life Sciences · Computer Vision & ML · NLP & Data Science · Physical Sciences | Four tags across five research items is roughly one item per tag, which makes the filter decorative — a small vocabulary with multi-tagging actually filters, a large one merely labels. |
| **Work Experience = one markdown file per role**, frontmatter (`company, role, startDate, endDate\|"Present", links[]`) + the 2–3 line blurb as the markdown **body**; ordering derived from `startDate` descending, no manual order field | A single `work-experience.json` array (easier to scan and reorder in one file, and genuinely simpler for 3 entries) | One authoring and validation pattern across all three content collections instead of two; the blurb can carry inline markdown formatting; date-derived ordering removes the need to hand-maintain a sequence. |

### Design language

| Decision | Alternative rejected | Why |
|---|---|---|
| Port Brittne Valdivia's techfolio visual system wholesale (palette, spacing, radii, shadows) | Inventing an original visual system | It's MIT-licensed and code-only (no personal content reused); the owner has already chosen this look over building one from scratch. |
| **Light mode only** — the current site's dark-mode toggle is dropped | Dark mode | The point of the rewrite is Brittne's palette; a hand-invented dark variant of someone else's light palette reads worse than either committing to light or building a real dark system from scratch — not worth it for a portfolio. |
| Font: **Montserrat**, loaded **once** in the app shell | Replicating techfolio's pattern of importing `Montserrat` via `next/font/google` separately in both `app/page.tsx` and `app/projects/[slug]/page.tsx` (confirmed in the reference repo — the exact same `next/font` call appears in both files) | That duplication is a bug in the reference, not a pattern to copy. |
| Merge project images directly into the project's frontmatter/object | Techfolio's split of card images into a separate lookup keyed by title, matched by string at render time | A second table keyed by a human-editable string (title) is a silent-breakage trap the moment a title changes. |
| Extract real shared components: `Nav`, `Card`, `Button`, `TagPill`, icon set; **one** data-driven template per collection's detail page | Techfolio's actual structure: every one of those is copy-pasted inline per page, and its four project detail pages are four bespoke hand-written layouts with copy duplicated out of its data file | This is the single biggest structural improvement over the reference — a data-driven template scales to project 11 through 50 for free; four bespoke layouts do not scale past four. |
| Do not carry over: techfolio's dead Geist font setup (imported in `app/layout.tsx`, unused since Montserrat is what's actually rendered), its no-op dark-mode CSS block, or its ~70MB of unused images | — | Dead weight with no function in the source; porting it forward would just relocate the mess. |
| Nav: floating pill, centered, `backdrop-blur`, scroll-based active-section highlight, reflows on mobile (no hamburger) | A hamburger menu on mobile | Four nav items reflow fine in a pill at any width; a hamburger is unnecessary interaction cost for four links. |
| Contact: **mailto only, no form** | A contact form | A form needs a backend or a third-party form service to receive submissions — direct conflict with the no-backend non-goal, for a portfolio that gets low-volume, high-context outreach anyway (recruiters, collaborators) where a direct email is more credible than a form. |
| Hero: two-column, smaller image than the current site's, no large hero visual | The current site's larger hero image (or a techfolio/astrofy-style big hero graphic) | Restraint — the copy (health-tech repositioning) is the point of the hero, not a big graphic. |
| About: plain prose, personal register | The current site's card-based layout (also how it renders Projects/Research/Work Experience) | About is the one section that should read like a person talking, not another card grid; reusing the card format everywhere makes every section feel the same. |

### Work-experience timeline

| Decision | Alternative rejected | Why |
|---|---|---|
| Structural pattern from gbose.dev (confirmed in `_reference-gbose/css/sidebar.css` lines ~1260–1291, `.work-card` rules), typographic rhythm from Brittne | Inventing a new timeline pattern | gbose's card-with-border-left-as-spine technique is a solid, generic CSS pattern (not copyrighted markup/copy — see Attribution) worth reusing structurally. |
| Single left spine, everything to the right, single column, no left/right alternation | A left/right alternating timeline (common portfolio template) | Alternation is a two-column layout in disguise and doesn't survive mobile without a breakpoint rewrite; single-column-by-construction needs none. |
| Line = `border-left: 2px` on each entry card, cards stacked with `gap: 0` | A single absolutely-positioned line element independent of the cards | A separate positioned line breaks the instant card heights change (new content, responsive reflow); a border on each card is self-healing by construction. |
| Dot = `::before` circle, `left: -5px`, `width/height: 8px`, `border-radius: 50%`, **2px border in the page background color** (`#F7F1E8`) | A plain filled dot with no matting border | The background-colored border is what visually punches the dot cleanly through the continuous line — without it the dot just merges into the line. |
| First (most recent) dot gets the accent color to flag "current"; all others neutral | A separate "Current" badge/label | The color-coded dot carries the signal for free, no extra UI element. |
| Hover brightens the segment and its dot, `0.2s ease` | — | Matches gbose's interaction cost with zero animation-library dependency. |
| Header row: company left (small, uppercase, letter-spaced, accent-colored) flush against date right (small, muted); bold role line beneath | — | Scannable at a glance without reading full prose. |
| **Prose blurb, 2–3 lines, at Brittne's type scale/spacing** | Porting gbose's dense 13px bullet lists directly | Grafts a dense, text-first layout onto an airy card-based system — the two would read as visually different sites stitched together. |
| Landing shows top 2–3 entries, then the spine continues past the last one into a "See all" button, implemented as a final stub `div` carrying the same `border-left` but no dot | A "See all" link/button visually detached from the timeline | Keeps the spine visually continuous instead of just stopping and restarting an unrelated CTA underneath it. |
| No sub-role nesting | Nesting multiple titles/promotions under one company entry | Cut for simplicity — only 3 entries exist today and none currently need it; add later if a multi-role company shows up. |
| No scroll-reveal, no animation library | Scroll-triggered fade-ins (techfolio uses `gsap`; a common portfolio pattern) | Extra dependency and jank risk for a timeline of 3 items; buys nothing here. |
| Responsive by construction — single column, line always left | Breakpoint-specific overrides | The single-column, left-spine layout needs no mobile-specific CSS at all. |

### Sharing / SEO

| Decision | Alternative rejected | Why |
|---|---|---|
| Per-route `og:`/Twitter meta via a `RouteMeta`-style component (ported from `juno-landing-page/src/components/RouteMeta.tsx`, which wraps `vite-react-ssg`'s `<Head>`/react-helmet-async) | A single static meta block reused across all routes | Every project/research page needs its own title, description, and OG image for share previews to be distinguishable at all. |
| Auto-generate an OG share card per project at build time (title + tags + status when set, on-palette), falling back to the project's own image when one exists | Reusing the project's card image as the OG image | Until real photos exist, every share preview would look identical (the same Unsplash placeholder) while still claiming to represent a distinct project. |
| Placeholder project image until real ones arrive: `https://images.unsplash.com/photo-1572177812156-58036aae439c` | Leaving `image` blank/broken until photos exist | Every card needs to render something now; a broken image is worse than an honest placeholder. |
| **A demo project ships at `/projects/sample-project`**, exercising the full markdown feature set, with a real hosted page at `/projects/sample-project/live` printing the current date-time; **clearly marked deletable** | No demo project — testing share previews against a real project | Using a real project to test LinkedIn/Facebook/chat unfurling risks accidentally shipping test artifacts into real content; a dedicated, clearly-scaffolding page is safe to iterate on and delete later. |

### Legal & analytics

| Decision | Alternative rejected | Why |
|---|---|---|
| `/privacy` and `/terms` adapted from `juno-landing-page`'s (`PrivacyPage.tsx`, `TermsPage.tsx`), rewritten for tejitpabari.com | Writing new legal pages from scratch | Reuses a working pattern (obfuscated-email integration, `RouteMeta`, `ConsentContext` hookup) instead of re-deriving it. |
| Policy scope = the portfolio site **and** everything hosted under tejitpabari.com, including `/projects/*/live`; projects hosted elsewhere (subdomain/other domain) carry their own notice | One blanket policy claiming to cover all of the owner's projects everywhere, regardless of where they're hosted | A policy can only truthfully speak for what it actually governs; claiming coverage over infrastructure it doesn't control would be false the moment something is hosted off-domain. |
| Policy written to **stay true** as projects are added; explicitly flagged that **the first hosted `/live` project with an input box invalidates the "no forms" claim** and the policy must be revised at that moment | Broad, forward-looking legal language that tries to pre-authorize future data collection | Vagueness is the actual failure mode on a legal page. The owner's existing Juno terms page is good specifically because it's narrow and true — this page should follow the same discipline. |
| GA4 + a minimal consent banner, ported from `juno-landing-page` including its two independent local-dev guards (`import.meta.env.DEV` check in `loadGa()`, plus the missing-measurement-ID check) | Shipping analytics without a consent banner, or building consent handling from scratch | Reuses working code; decline means zero analytics cookies (verified in `ConsentContext.tsx`'s `localStorage`-backed consent state). |
| Track: pageviews, outbound link clicks (which live-project link gets clicked), project card clicks, résumé link clicks, **search queries typed on `/projects`**, landing-page section scroll depth | Pageviews only | Search queries are called out as the single highest-value signal — they show what visitors came looking for and didn't find, which pageviews alone can't reveal. |
| Explicitly stated: legal text is **not lawyer-reviewed** and must not ship without the owner reading it | Treating the ported/adapted text as ready-to-ship | It's adapted from a different product's terms; the owner must confirm it's accurate for this site before launch regardless of how clean the diff looks. |

### Contact facts

| Decision | Alternative rejected | Why |
|---|---|---|
| Email obfuscation ported from `juno-landing-page/src/config/contact.ts` (`getContactEmailAddress()` assembled from two separate constants, only called client-side post-mount) + `useContactMailto` | Printing a plain `mailto:tejitpabari99@gmail.com` link in prerendered HTML | A plain address in static HTML is directly scrapeable; the assembled-on-demand pattern keeps it out of the build output entirely. |
| LinkedIn (`linkedin.com/in/tejitpabari`) and GitHub (`tejitpabari99`) left **un**obfuscated | Applying the same obfuscation to LinkedIn | A profile URL isn't harvested/spammed the way an email address is; obfuscating it adds friction for zero benefit (this exact reasoning is already documented in `contact.ts`). |
| Résumé links to the **existing Google Drive link** (`https://drive.google.com/file/d/1HcqZCkdxfU73PUHmFSKqJGIG7_yG3mGS/view?usp=sharing`, currently in `src/components/common/header.js`) | Switching to the local PDF copy at `src/files/tejitpabari_resume.pdf` | The Drive link is what's currently live and advertised; swapping to the local file mid-rewrite risks pointing at a different (possibly older-content, differently-formatted) résumé without the owner having compared the two. Flagged as an open item in §5 — the local copy's file timestamp is *more recent*, so the owner should confirm which one is actually current before launch. |
| Location string is a **placeholder** pending owner input, not a guess | Inferring a plausible city (e.g. current employer's office location) | Shipping a wrong or stale personal-location claim is worse than an obvious placeholder; owner-only item, flagged in §5. |

> **Amended 2026-08-31 (owner decision):** the location row above is superseded — the Contact aside ships with no location line at all, rather than a placeholder awaiting owner input. A portfolio's Contact aside works fine with email + social links alone, and omitting the line means no placeholder can ever leak to production and no stale personal-location claim can go stale. See SP03 §9.

### Copy

| Decision | Alternative rejected | Why |
|---|---|---|
| All initial copy (hero, About, all 10 project descriptions, work-experience blurbs, research abstracts, health-tech repositioning) is **drafted** from the existing site + résumé content, for the owner to edit | Shipping the rewrite with placeholder/lorem copy | A blank page waiting for "ten descriptions" is exactly how a project stalls at 90% done; a full first draft the owner only needs to edit removes that stall point. |

### Validation & failure

| Decision | Alternative rejected | Why |
|---|---|---|
| Frontmatter and internal links validated at build time (typo → failed build) | Runtime/no validation | Catches content errors before they ship, for free, at build time. |
| External link rot checked by hand; uptime monitoring for hosted `/live` projects is a separate project, explicitly out of scope here | Building automated external-link and uptime checking into this project | Scope control — this is a portfolio rewrite, not a monitoring platform. |

### Attribution

| Decision | Alternative rejected | Why |
|---|---|---|
| Courtesy credit to Brittne Valdivia's techfolio in the footer | No attribution | Not legally required under MIT for an inspired rewrite, but her README requests it, and it's cheap to do. |
| None of Brittne's personal content (photos, résumé, case-study copy, screenshots) is reused — all replaced | Reusing any of her personal content under the MIT umbrella | MIT covers the code; her personal content isn't separately licensed for reuse regardless. |
| gbose.dev's CSS *technique* (timeline structure) is reimplemented generically; none of its markup or copy is copied | Copying gbose markup/copy directly since it's a good structural reference | gbose.dev carries **no license** — all rights reserved. Only a generic, independently-reimplementable CSS pattern is safe to reuse; the actual markup and prose are not. |

## 3. Design

### Stack

`vite-react-ssg` (React 19 + Vite) prerendering every route to static HTML, Tailwind for styling, `react-markdown` + `gray-matter` + `remark-gfm` + `@tailwindcss/typography` for the four markdown collections, `fuse.js` powering a shared search + tag-filter component used on both `/projects` and `/research`. Deployed to **Firebase Hosting**, config mirroring `juno-landing-page/firebase.json`: `public: "dist"`, `cleanUrls: true`, a catch-all rewrite to `/index.html` for client-side routing on top of the prerendered shell, long-cache headers on `**/assets/**`, no-cache on `**/index.html`. `.firebaserc` ships with a documented placeholder project ID — **owner must create the actual Firebase project and point tejitpabari.com's DNS at it**; this is the single hard launch blocker (see §5).

The rewrite happens on a branch of the existing `tejitpabari99/tejitpabari` repo. Everything under `src/` and every `gatsby-*.js` config file is deleted; the old Gatsby/Chakra code is read once for content (§6) and then discarded. `main` keeps serving the current live site via Netlify until the branch is ready to merge and cut over.

### Routes

```
/                              landing page (Hero, Projects-featured, Work Experience, About, Contact — anchor-scrolled)
/projects                      all projects — search (fuse.js) + tag filter
/projects/<slug>               markdown project writeup
/projects/<slug>/live          redirect to liveUrl, OR a real hosted page if no liveUrl is set
/work-experience                full timeline (no detail pages)
/research                      all research — search (fuse.js) + tag filter, same component as /projects
/research/<slug>               research detail (abstract + links today; room for a full writeup later)
/privacy
/terms
404
```

Every sub-page (`/projects`, `/research`, `/work-experience`, and every `<slug>` detail page) has a back button at the top targeting `/`, since the nav bar carries no logo/home affordance.

Nav bar: **Projects, Work Experience, About, Contact** — all four are anchors on `/`, so from any sub-page a nav click first navigates home, then scrolls. Nothing occupies the top-left corner. Research is intentionally absent from the nav; it's reachable from the footer only.

Footer: Research, Résumé (Drive link), a one-line techfolio credit, copyright. No social icons (already present in the hero and in the Contact aside).

### Content model

Four markdown collections, each one file per item, under something like `src/content/{projects,research,work-experience,legal}/*.md`, frontmatter validated at build time.

**Projects** — `slug, title, description, image, tags[], status?, liveUrl?, links[{label, href}], date, body`
- `tags`: one or more of **Health Tech · Developer Tools · Others** (fixed set now, extensible later).
- `status?`: optional; when present, exactly one of **Building · Not Started · Completed** ("Shipped" folds into Completed), rendered as a pill on the card image. When `status` is absent, the card renders **no pill at all** — no default value, no "Unknown" pill, no reserved empty space. Build-time frontmatter validation accepts a missing `status` but still rejects an invalid one.

**Research** — same shape as Projects, including the same optional `status?` behavior and the same `tags[]` array shape (items may carry more than one tag). Own tag vocabulary, fixed at **Health · Machine Learning · Other**. `/research` uses the same search + tag-filter component as `/projects` (see Routes above).

**Work Experience** — one markdown file per role; frontmatter `company, role, startDate, endDate|"Present", links[{label, href}]`; the 2–3 line prose blurb is the markdown **body**, rendered inline in the timeline entry. No detail pages; a role that deserves a writeup becomes a Project. Ordering on both the landing timeline and `/work-experience` is derived from `startDate` descending — there is no manual order field. **`startDate`/`endDate` are not yet supplied by the owner** (see §5); until they land, each role file ships a placeholder date pair alongside a clearly visible marker (e.g. a `DRAFT_DATE` flag in frontmatter) so ordering stays deterministic during development and the missing real dates can't ship unnoticed. **The placeholder dates must be chosen so the interim, date-derived ordering matches the order the current site lists these roles in**: Microsoft Fabric Maps (most recent), then Jio, Reliance Industries, then Programming for Entrepreneurs and Social Good (oldest) — otherwise date-derived ordering could render roles in an unintended sequence during development (see §5).

> **Amended 2026-08-31 (owner decision):** Work Experience ships **two** roles, not three — Microsoft Fabric Maps and Jio, Reliance Industries, both with real, résumé-sourced dates (`2021-06-01`→`Present` and `2019-06-01`→`2019-08-01` respectively). The Programming for Entrepreneurs and Social Good Head-TA role is dropped from the site entirely: it doesn't appear in the résumé at all, no dateable source exists for it anywhere, and it was the weakest of the three entries for the brief's health-tech repositioning (§1). Dropping it also removes the initiative's only launch-blocking `DRAFT_DATE` placeholder — both remaining roles ship real dates, so no interim placeholder ordering is needed. See SP07 §4.3, SP02 §4.9.

**Legal** — privacy + terms, plain markdown or hand-written JSX pages per the `juno-landing-page` pattern.

Card click always routes to `/<collection>/<slug>`, never straight to an external URL; the card shows a small external-link affordance as a shortcut, and the detail page puts its `links[]` row near the top. A project/research page with an empty `body` still renders correctly from `description` + `links` alone.

**Featured projects**: `src/config/featured.ts` exports an ordered array of up to 6 slugs — the single source of truth for the landing page's Projects section. Any slots left empty (fewer than 6 slugs listed) backfill with the most recently dated projects not already in the list.

### Visual design system

Ported from `_reference-techfolio` (confirmed by inspecting `app/page.tsx`, `app/projects/[slug]/page.tsx`, and `app/projects/project-data.ts` directly — MIT-licensed, code-only).

- Font: **Montserrat** via Google Fonts, loaded once in the app's root layout — not duplicated per-page the way the reference does it.
- Palette (all confirmed hex values from the reference):
  - `#F7F1E8` — primary background (warm cream)
  - `#DDE7DE` — secondary/card background (sage)
  - `#043439` — primary accent (dark teal)
  - `#0F4C45` — secondary teal (borders, links, labels, icons)
  - `#162b26` — primary text
  - `#3E514D` — body text
  - `#6B7B77` / `#4D5D59` — tertiary text
  - `#EEF3EE` — image placeholder background
- Borders: teal at 12–22% opacity, never a flat gray. Shadows: tinted, e.g. `0 14px 40px rgba(22,43,38,0.08)`. Radius: pills use `rounded-full`; cards use `rounded-[1.05rem]`–`rounded-[1.25rem]` (~17–20px).
- **Light mode only** — no dark-mode CSS at all, and the current site's `useColorMode` toggle (`src/components/common/header.js`) is dropped entirely.
- Card hover (pure CSS, no JS): lift `-translate-y-1`, border darkens, shadow deepens, image `scale(1.02)`, title tints teal.
- Shared components to extract for real (the reference inlines all of these per-page): `Nav`, `Card`, `Button`, `TagPill`, a shared `SearchFilter` (search box + tag filter, used on both `/projects` and `/research`), an icon set. One data-driven detail-page template per collection, replacing the reference's four bespoke hand-written project-detail layouts.
- Explicitly not ported: the reference's dead `Geist`/`Geist_Mono` import in `app/layout.tsx` (unused — `Montserrat` is what actually renders), its no-op dark-mode `@media (prefers-color-scheme: dark)` block in `globals.css`, its ~70MB of unused images, and its title-keyed image lookup table (merge `image` directly into each project's own object/frontmatter instead).
- Nav: floating pill, centered, `backdrop-blur`, scroll-based active-section highlighting. Reflows on mobile; no hamburger.
- Contact section: two columns. Left — heading, one paragraph, an "Email Me" button (mailto, obfuscated). Right — a "Connect" aside with email, location (placeholder — owner item), and circular GitHub/LinkedIn icon buttons that lift and invert to a teal fill on hover. No form.
- Hero: two columns, an image noticeably smaller than the current site's (astrofy-inspired restraint) — eyebrow label, greeting, one health-tech-centric paragraph, "Download Resume" + "Contact Me" buttons, social icon row. No large hero image.
- About: plain prose, personal register — not the card format used everywhere else on the site.

### Work-experience timeline

Structural pattern from `_reference-gbose/css/sidebar.css` (`.work-card` rules, confirmed around lines 1260–1291), typographic rhythm and spacing from the techfolio system.

- Single left spine, single column, no left/right alternation, no sub-role nesting.
- Each entry card carries `border-left: 2px solid <color>`; cards stack with `gap: 0` so the borders read as one continuous rule rather than segmented ticks.
- Dot: `::before`, `left: -5px` (straddles the border), `8px × 8px`, `border-radius: 50%`, `border: 2px solid #F7F1E8` (the page background) — the background-colored ring is what visually punches the dot through the continuous line.
- The first (most recent) entry's dot is accent-colored to flag "current"; all others are neutral. Hover brightens the segment and its dot over `0.2s ease`.
- Header row: `display: flex; justify-content: space-between` — company left (small, uppercase, letter-spaced, teal), date flush right (small, muted). Bold role line beneath. Blurb: 2–3 lines of prose at Brittne's type scale, sourced directly from the role's markdown body — not gbose's dense 13px bullet lists.
- Landing page shows the top 2–3 entries, then the spine continues past the last real entry into a "See all" button implemented as a final stub `div` carrying the same `border-left` but no dot, so the button reads as part of the timeline rather than a bolted-on CTA.
- No scroll-reveal, no animation library. Responsive by construction (single column, spine always on the left) — no breakpoint overrides needed.

### Sharing / SEO

A `RouteMeta`-style component, ported directly from `juno-landing-page/src/components/RouteMeta.tsx`, renders per-route `<title>`, description, canonical link, and `og:`/Twitter tags via `vite-react-ssg`'s `<Head>` (a react-helmet-async wrapper) — this is what actually lands in `<head>` in the prerendered output, which is the entire point given LinkedIn/Facebook don't execute JS.

Each project gets an auto-generated OG share card at build time (title + tags + status when set, rendered on the site palette), falling back to the project's own `image` when one is set. Until real photos exist, every card uses the placeholder `https://images.unsplash.com/photo-1572177812156-58036aae439c`.

`/projects/sample-project` ships as a demo project exercising the full `react-markdown`/`remark-gfm` feature set (headings, lists, code blocks, links, images, tables, blockquotes), with a real hosted page at `/projects/sample-project/live` that renders the current date-time — this is what the owner uses to test how markdown renders and how share previews look in LinkedIn/Facebook/chat clients before real content exists. **Mark it clearly as deletable** (e.g., an HTML comment and a note in its own frontmatter) — it's scaffolding, not content, and should not survive as a permanent "10th project."

### Legal & analytics

`/privacy` and `/terms` are adapted from `juno-landing-page/src/pages/PrivacyPage.tsx` and `TermsPage.tsx`, rewritten for tejitpabari.com's actual current state: no accounts, no login, no forms, no data collected or stored (GA4 aside). The policy's scope is the portfolio site **and everything hosted under tejitpabari.com**, explicitly including `/projects/*/live` pages — a project hosted elsewhere (its own subdomain or a different domain entirely) needs its own notice, not coverage claimed here.

**Load-bearing constraint on the copy itself**: write it so it stays true as content is added. The moment the first hosted `/live` project ships with an input box, the "no forms" claim in this policy is false and the policy needs a revision — call this out explicitly in a code comment near wherever `/live` routes are registered, so it isn't missed. Vagueness is the actual risk on a legal page, not narrowness — the owner's Juno terms page is a good model precisely because it's narrow and true.

GA4 plus a minimal consent banner, ported from `juno-landing-page`'s `ConsentContext.tsx` (localStorage-backed `'unset' | 'granted' | 'denied'` state, decline = zero analytics cookies) and `lib/analytics.ts` (`loadGa()` gated by two independent guards: `import.meta.env.DEV` and a missing `VITE_GA_MEASUREMENT_ID`, so dev traffic never reaches the property under either failure mode). Events to track: pageviews, outbound link clicks (which live-project link gets clicked), project card clicks, résumé link clicks, **search queries typed on `/projects`**, and landing-page section scroll depth. Search queries are the single highest-value signal here — they show what a visitor came looking for and didn't find, which raw pageviews can't reveal.

**None of this legal text is lawyer-reviewed.** It must not ship without the owner reading every word of the adapted `/privacy` and `/terms` pages himself.

### Contact facts

- Email: `tejitpabari99@gmail.com`, obfuscated using `juno-landing-page`'s pattern — `src/config/contact.ts` assembles the real address from two separate constants inside a function (`getContactEmailAddress()`) only ever called client-side post-mount, plus a `useContactMailto` hook that returns `null` during the build-time render and first client render, then the real `mailto:` href after mount. This keeps a scrapeable plain address out of the prerendered HTML entirely.
- LinkedIn `https://www.linkedin.com/in/tejitpabari` and GitHub `tejitpabari99` are **not** obfuscated — a profile URL isn't harvested the way an email address is.
- Résumé links to the existing Google Drive link (`https://drive.google.com/file/d/1HcqZCkdxfU73PUHmFSKqJGIG7_yG3mGS/view?usp=sharing`), not the local `src/files/tejitpabari_resume.pdf`. **Open item**: confirm the Drive link actually serves the current résumé — the local repo copy has a more recent file timestamp, suggesting it may be newer content than what's on Drive. Note also that a Drive link can only be tracked as an outbound click in analytics, never as a completed download.

> **Amended 2026-08-31 (owner decision):** the open item is closed — the owner confirmed directly that the shipped résumé link is the Google Drive URL; the local PDF is not served. `src/files/tejitpabari_resume.pdf` is deleted along with the rest of `src/` during the SP01 demolition, not moved to `public/`. See SP01 §9.
- **Location string is an explicit placeholder — owner must supply the real value.** Owner-only item.

> **Amended 2026-08-31 (owner decision):** superseded — the Contact aside ships with no location line at all. Omitted rather than supplied: email + circular GitHub/LinkedIn icon buttons is a complete, working Contact aside on its own, and dropping the line removes the placeholder-leak and stale-claim risk entirely rather than just deferring it. See SP03 §9.

### Copy

Every piece of initial copy — hero paragraph, About prose, all 10 project descriptions, the 3 work-experience blurbs, the research abstracts, and the health-tech repositioning language throughout — is drafted from the current site's content and the owner's résumé, ready for the owner to edit rather than write from scratch. See §6 for the full inventory this copy is drafted from.

### Validation & failure

Frontmatter shape and internal links (`/projects/<slug>`, `/research/<slug>`, footer/nav hrefs) are validated at build time — a typo fails the build rather than shipping a broken card or a 404 behind a live link. External link rot (the ~15 external URLs in the content inventory below) is checked by hand, not automated. Uptime monitoring for hosted `/live` projects is explicitly a separate, later project — out of scope here.

## 4. Non-goals

Dark mode · a blog · RSS · scroll-reveal animation · a CMS or admin UI · any backend, database, or auth · a contact form · work-experience detail pages · sub-role nesting on the timeline · uptime monitoring · comments · i18n · migrating the old Gatsby code (content only, not code) · lawyer-reviewed legal text · ~~CI/CD (manual `firebase deploy` only)~~.

> **Amended 2026-08-31 (owner action):** CI is no longer a non-goal. The owner installed the Firebase Hosting GitHub Action integration on `github.com/tejitpabari99/tejitpabari`, which scaffolds a deploy-on-merge-to-`main` workflow and a PR-preview-channel workflow. Adopted rather than removed — it's CI a solo builder would otherwise have to hand-build, and the PR-preview channel is a real, useful check for OG/share-preview rendering before merging. See SP01 §4.9/§9 for the reconciliation this requires (build step, output directory, `VITE_GA_MEASUREMENT_ID`) and the operational consequence (merging `website-revamp` into `main` now IS the production cutover).

## 5. Open risks

| Risk | Cheapest test |
|---|---|
| The site may not be the bottleneck for health-tech credibility — shipping Juno and being visible probably matters more than a rebuilt portfolio. This is worth doing because it's cheap and he needs somewhere to point people, not because it moves anything on its own. | Analytics will show within a month whether anyone actually reaches a `/projects/<slug>` page at all. If nobody does, stop investing further here. |
| Real project images never arrive and the Unsplash placeholder ships on all 10 cards indefinitely. | Check `image` frontmatter values 30 days post-launch; if still all-placeholder, that's the signal to prioritize photos over any further feature work. |
| The legal text is not lawyer-reviewed, and the "no forms" claim in `/privacy` degrades the moment any hosted `/live` project accepts input. | Grep for the "no forms" claim whenever a new project ships to `/live`; revise the policy before that project goes live if it takes input. |
| The Firebase project creation and DNS cutover to tejitpabari.com are owner-only and block launch entirely. | N/A — owner action, tracked as a launch blocker, not testable in advance. |
| The location string is unsupplied. | N/A — owner action. |

> **Amended 2026-08-31 (owner decision):** this risk is closed, not just resolved — the location string isn't merely deferred, it's omitted from the Contact aside entirely (no location line ships at all), so there is no longer an unsupplied value blocking anything.
| The Drive résumé link may be stale relative to the local PDF copy (which has a more recent file timestamp in the repo). | Owner opens both and compares; five-minute check before launch. |

> **Amended 2026-08-31 (owner decision):** this risk is closed — the owner confirmed the Drive link is the current résumé; the local PDF copy is not served and is deleted, not moved, during the SP01 demolition. No comparison step remains before launch. See SP01 §9.
| Work-experience `startDate`/`endDate` are owner-supplied and not yet available. Since ordering on the landing timeline and `/work-experience` is now derived purely from `startDate` descending, **the timeline cannot render in a correct chronological sequence until real dates exist.** Interim: each role's markdown file ships a placeholder date pair alongside a clearly visible marker (e.g. a `DRAFT_DATE` frontmatter flag) so ordering stays deterministic during development and the missing real dates can't ship unnoticed. **The placeholder dates themselves must be chosen so the interim order matches the current site's role order** — Microsoft Fabric Maps, then Jio, Reliance Industries, then Programming for Entrepreneurs and Social Good (see §3) — otherwise date-derived ordering could render roles out of sequence during development. | Grep for the placeholder-date marker as a pre-launch/CI check; a hit blocks launch until the owner supplies real dates. Also confirm the placeholder values sort into the expected order. |

> **Amended 2026-08-31 (owner decision):** this risk is substantially closed. Résumé mining (SP07 §4.3) yielded real, high-confidence dates for Microsoft Fabric Maps and Jio, Reliance Industries. The third role, Programming for Entrepreneurs and Social Good — the one role with no dateable source anywhere — is dropped from the site entirely rather than shipped on a placeholder. Work Experience ships two roles, both with real dates, and zero `DRAFT_DATE` placeholders at launch. The `DRAFT_DATE` mechanism itself remains in SP02 for any future role added without confirmed dates. See SP02 §4.9, SP07 §4.3/§9.
| Hosting arbitrary small projects inside the portfolio app couples their failures to the site's build — one broken mini-project can break the whole deploy. Mitigation direction only (not designed here): isolate each hosted `/live` project's route/bundle so a build error in one doesn't fail the top-level build. | Ship the `sample-project` demo first and deliberately introduce a build error in just that route to confirm the failure is caught in review (or scoped by tooling) before a second real hosted project is added. |

## 6. Content inventory (appendix)

Migrated from `src/pages/projects.js`, `src/pages/work-experience.js`, and `src/pages/research.js` in the current Gatsby site.

### Projects (10 items in `projects.js`)

| # | Title | Collection | Proposed tag | Proposed status | Existing links |
|---|---|---|---|---|---|
| 1 | Juno | Projects | Health Tech | Building | App — `https://app.meetjuno.health/`; Website — `http://meetjuno.health/` |
| 2 | Med-Doc Tracker | Projects | Health Tech | **(none)** — owner decided this project ships with no status pill | Website — `https://tejitpabari.short.gy/med-doc-tracker` |
| 3 | Crunchy Filler | Projects | Developer Tools | Completed | Chrome Web Store — `https://chromewebstore.google.com/detail/crunchy-filler/djbcknbbfoldifpllefimnnkfaogcnid` |
| 4 | Clip-Verse | Projects | Developer Tools | **(none)** — owner decided this project ships with no status pill | Website — `https://clipverse-five.vercel.app/` |
| 5 | Fabric Maps MCP Server | Projects | Developer Tools | Completed (hackathon submission) | Hackathon project — `https://innovationstudio.microsoft.com/hackathons/MRTAthon-2025/project/112785` |
| 6 | Azure Maps AI Assistant | Projects | Developer Tools | Completed (hackathon) | Hackathon project — `https://hackbox.microsoft.com/hackathons/MRTAthon/project/85641` |
| 7 | QGIS Plugin for Azure Maps Creator | Projects | Developer Tools | Completed (1,000+ downloads, published to plugin store) | QGIS Plugin Store — `https://plugins.qgis.org/plugins/AzureMapsCreator/` |
| 8 | Creator Onboarding Tool | Projects | Developer Tools | Completed | Website — `https://azure.github.io/azure-maps-creator-onboarding-tool/` |
| 9 | Columbia Virtual Campus | Projects | Others | Completed (pandemic-era, wound down) | Website — `https://columbiavirtualcampus.com/`; Facebook — `https://www.facebook.com/columbiavirtualcampus/`; Instagram — `https://www.instagram.com/columbiavirtualcampus/` |
| 10 | SMARTtest: HIV & Syphilis Self-Testing App | Projects (see dedup note below) | Health Tech | Completed (1,000+ downloads, published paper, news coverage) | AIDS and Behaviour paper — `https://doi.org/10.1007/s10461-019-02718-y`; News coverage — `https://www.labiotech.eu/best-biotech/hiv-test-app-home/` |

**SMARTtest dedup — decided**: SMARTtest currently appears in both `projects.js` and `research.js` with near-identical descriptions. **Decision: it lives in Projects only (#10 above); removed from Research.** It's a shipped, downloadable product (React Native + Firebase app, 1,000+ downloads) with a published-paper credential attached — a shipped product that happens to have a paper attached, not a pure research output, and a stronger fit for the health-tech-builder positioning the whole rewrite is going for than filing it under academic research. The published paper and news-coverage links carry over as the project's `links[]`, so the research credential isn't lost, just reframed as evidence supporting a shipped project rather than as a standalone research entry.

### Work Experience (3 items in `work-experience.js`)

| # | Company | Role | Proposed dates | Blurb source | Existing links |
|---|---|---|---|---|---|
| 1 | Microsoft Fabric Maps | Software Engineer II | `endDate: "Present"` — `startDate` not present anywhere in the source; must be pulled from the résumé and confirmed by the owner | Current description is a full paragraph; needs condensing to 2–3 lines per the content model | Fabric Maps blog — `https://blog.fabric.microsoft.com/en-us/blog/introducing-maps-in-fabric-geospatial-insights-for-everyone/`; QGIS plugin (dup of Project #7); Creator Onboarding Tool (dup of Project #8) |
| 2 | Jio, Reliance Industries | Computer Vision Researcher | Past role — no dates in source, needs résumé lookup | Short description already close to 2–3 lines | None |
| ~~3~~ | ~~Programming for Entrepreneurs and Social Good~~ | ~~Head Teaching Assistant~~ | ~~Past role — no dates in source, "three semesters" mentioned in prose but no actual calendar dates~~ | ~~Already close to 2–3 lines~~ | ~~Course website — `https://www.coursicle.com/columbia/courses/INAF/U6004/`~~ |

> **Amended 2026-08-31 (owner decision):** row 3 (Programming for Entrepreneurs and Social Good) is dropped from the site entirely, not migrated — struck through above rather than deleted, since this table is a historical record of the source content. This is the weakest of the three entries for the health-tech repositioning (§1), and the only one with no dateable source anywhere (not the résumé, not the site). Work Experience ships two roles: Microsoft Fabric Maps and Jio, Reliance Industries, both with real, résumé-sourced dates. See SP07 §4.3/§9.

**Gap flagged**: none of the 3 entries as originally scraped carry explicit `startDate`/`endDate` in the current source (the JS objects have only `title`/`subtitle`/`description`/`links`). All three needed real dates sourced from the résumé and confirmed by the owner — this is required data, not a nice-to-have, since ordering on both the landing timeline and `/work-experience` is now derived purely from `startDate` descending (no manual order field), and the "most recent = accent dot" logic and date-flush-right header both depend on it too. Interim: each role's markdown file ships a placeholder date pair with a clearly visible marker (e.g. a `DRAFT_DATE` frontmatter flag) so ordering stays deterministic during development, chosen so that order matches the current site's listing — Microsoft Fabric Maps, then Jio, Reliance Industries, then Programming for Entrepreneurs and Social Good (see §3) — see the launch-blocking risk this creates in §5.

> **Amended 2026-08-31 (owner decision):** superseded by the row-3 amendment above — the résumé yielded real dates for roles 1 and 2, and role 3 is dropped rather than shipped on a placeholder. Zero roles carry `DRAFT_DATE: true` at launch. See SP02 §4.9, SP07 §4.3.

### Research (6 items in `research.js` — count mismatch flagged, see below)

| # | Title | Collection | Proposed tag | Proposed status | Existing links |
|---|---|---|---|---|---|
| 1 | Flood Event Extraction from News Media (Bangladesh) | Research | Machine Learning | Completed (preprint + AGU presentation) | Pre-print — `https://bit.ly/tejit-flood-research`; AGU abstract — `https://agu.confex.com/agu/fm20/meetingapp.cgi/Paper/766342` |
| 2 | DVMM Lab | Research | Machine Learning | Completed (project report) | Project report — `https://bit.ly/tejit-dvmm-lab-research-2020` |
| 3 | SMARTtest (research.js copy) | **Deduplicated out — decided; see dedup note above → lands in Projects #10** | — | — | — |
| 4 | INCITE Labs | Research | Machine Learning | Completed | Website — `https://incite.columbia.edu/measuring-liberal-arts`; News coverage link in source is actually a mis-pasted SMARTtest/labiotech URL — needs fixing during migration, not a real INCITE Labs citation |
| 5 | Pill Recognition & Prescription Extraction | Research | Health, Machine Learning | Completed (project report) | Project report — `https://www.researchgate.net/publication/340528010_Pill_Detection_Prescription_Analysis` |
| 6 | A Study on the Solar Illumination Provided by a Water Bottle | Research | Other | Completed (published, Google Science Fair regional finalist) | JBAER paper — `https://doi.org/10.7916/D8Q24BQ9`; Google Science Fair coverage — `https://www.hindustantimes.com/...`; Times of India — `https://timesofindia.indiatimes.com/...` |

**Contradiction caught and resolved here**: an earlier draft of this brief assumed "~3 items" in the Research collection and used that count as the reason `/research` shipped with no search box. The actual source (`research.js`) has 6 raw entries; after removing the SMARTtest duplicate per the decision above, that's **5** remaining research entries — still not 3, and the miscount itself is now moot: the owner reviewed it and reversed the decision outright. `/research` ships the same search + tag-filter component as `/projects` (see §2, §3) — it's the same component at no extra cost, so the count was never the load-bearing argument it was treated as. The `research.js` → INCITE Labs entry also has a copy-paste bug worth fixing during migration: its "News Coverage" link points at the SMARTtest/labiotech article, not anything about INCITE Labs — drop that link or replace it with a real one.

**Tag vocabulary note**: Research's tag vocabulary is settled (see §2/§3): **Health · Machine Learning · Other**, multi-tagging allowed. INCITE Labs is tagged Machine Learning only — its description (syllabus/mission-statement extraction, SQL scripting) doesn't support a Health tag, unlike Pill Recognition, which genuinely spans both.

### Owner decisions still needed

- **All 3 work-experience entries** — need real `startDate`/`endDate` values; none exist in the current source. See §5 for the ordering risk this creates in the meantime.

> **Amended 2026-08-31 (owner decision):** resolved. The résumé yielded real dates for Microsoft Fabric Maps and Jio, Reliance Industries. Programming for Entrepreneurs and Social Good — the one role with no dateable source — is dropped from the site rather than shipped on a placeholder. No work-experience dates remain outstanding.
