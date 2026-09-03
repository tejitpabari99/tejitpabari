# Round 3 summary and final verification

Branch: `website-revamp`. This is the final cleanup and verification pass
after the four round-3 sub-projects (schema/icons/content, index-page
layout, sections polish, production bugfixes) finished their work. It
closes the remaining handoffs between those sub-projects, fixes two real
bugs found during verification that no sub-project had caught, and walks
every line of the owner's feedback against the actual built site served
through the real Firebase Hosting emulator.

All verification below (screenshots, click/search interaction tests, CSP
header checks, HTTP status checks) was done against a real `npm run
build` output, served by `firebase emulators:start --only hosting`
(applies the real `firebase.json` headers), driven by a real headless
Chromium (Playwright). Screenshots referenced below are committed at
`.dev/website-revamp-r3/screenshots/`.

## Two real bugs found and fixed in this pass

Neither of these was requested verbatim by the owner, but both were
necessary to make owner-requested behavior actually work.

**1. StatusBadge's colored pill background never rendered, anywhere.**
Confirmed against compiled CSS that `bg-teal/92`, `bg-slate-dark/92`, and
`bg-status-building/92` generated zero bytes of CSS: Tailwind 3's default
opacity scale only has multiples of 5, and an off-scale `/NN` modifier
silently drops the whole utility with no build error. The same defect
was also silently breaking `border-*/12`, `/22`, `/28`,
`hover:bg-teal-secondary/8`, and `bg-cream/97` elsewhere in the codebase.
Fixed by extending `tailwind.config.ts`'s `theme.extend.opacity` with the
exact non-standard steps in use (8, 12, 22, 28, 92, 97). Verified by
grepping the freshly built CSS for the generated rules and with a real
screenshot showing visible colored status pills. See
`src/components/StatusBadge.tsx`, `tailwind.config.ts`,
`tailwind.config.test.ts` (new regression test).

**2. A real client-side crash silently broke hydration on every page,
independent of the already-fixed CSP issue.** `src/data/projects.ts` and
`src/data/research.ts` call `gray-matter`'s `matter()` on every content
file at module top level. Those modules ship in the client bundle (not
just the server-render pass), and `gray-matter` calls `Buffer.from(...)`
unconditionally, which throws `ReferenceError: Buffer is not defined` in
a real browser (Node's SSR pass and Vitest's jsdom both run inside a
real Node process, so this never surfaced there). This crashed module
evaluation before hydration ever started: the page still showed the
server-rendered HTML, but nothing was interactive on any page, on the
whole site. Reproduced live: clicking a tag pill or typing in the
`/projects` search box did nothing, before the fix. Fixed with a
`Buffer` polyfill (the standard `buffer` npm package) imported first in
`src/main.tsx`. Re-verified interactively: clicking a category pill and
typing a search query on both `/projects` and `/research` now correctly
narrows the list, with zero console errors on every route tested.

## Per-item verification against the owner's feedback

| # | Owner feedback (verbatim, condensed) | What was done | Where | Status |
|---|---|---|---|---|
| 1 | Remove Back from all places; navbar is enough | `BackButton.tsx` deleted; every usage removed; `NotFoundPage` uses a "Go to homepage" link instead; nav pill always renders | r3-02 (`PageShell.tsx`, `PageContainer.tsx`, all page files) | Verified - repo-wide grep for `BackButton`/`chrome=` returns nothing; nav pill visible on every screenshot including the 404 page |
| 2 | Work-experience timeline should be broader, same width as others | Outer `max-w` wrapper removed from `WorkExperienceSection` and `WorkExperiencePage` (r3-02/r3-03); this pass added `max-w-[42rem]` to only the entry's *text* content so the rail/section still spans the full `max-w-content` width while prose stays readable | `src/sections/WorkExperienceSection.tsx`, `src/pages/WorkExperiencePage.tsx`, `src/components/timeline/TimelineEntry.tsx` | Verified - screenshots `work-experience-1440.png`/`-390.png`; see "Design decisions" below for how "broader" was interpreted |
| 3 | Replace raw email with an "Email Me" button | `ContactSection` always renders a real "Email Me" affordance (button pre-hydration, upgrades to a real `mailto:` anchor after); email assembled only inside the click handler, never as a literal in source or bundle | r3-03 (`src/sections/ContactSection.tsx`) | Verified - screenshot `home-1440.png`; `grep -c tejitpabari99@gmail.com dist/index.html dist/assets/*.js` = 0 |
| 4 | Search bar on `/projects` should be bigger, full width | `SearchFilter` input is `w-full` at every breakpoint, larger text/padding | r3-02 (`src/components/SearchFilter.tsx`) | Verified - screenshots `projects-1440.png`/`-390.png` |
| 5 | Remove creator-onboarding-tool and QGIS plugin from projects entirely | Both content files and every reference deleted | r3-01 | Verified - `dist/projects/` has no directory for either slug; `/projects/creator-onboarding-tool` and `/projects/qgis-plugin-azure-maps-creator` both return a genuine HTTP 404 via the real emulator |
| 6 | "Open Live" doesn't make sense; let me pick one dark-green primary link per project/research item from frontmatter (Crunchy Filler = Chrome Web Store, Juno = website) | Whole `/projects/:slug/live` subsystem and `liveUrl` field deleted; new `links[].primary`/`icon` frontmatter fields drive a filled dark-green button for the one primary link, outlined for the rest | r3-01 (schema) + r3-02 (`LinkButtons.tsx` rendering) | Verified - screenshot `projects-1440.png`: Juno's "Website" and Crunchy Filler's "Chrome Web Store" both render filled dark green; content confirmed in `src/content/projects/juno.md` / `crunchy-filler.md` |
| 7 | Alternative layout for projects/research: horizontal list cards (image left), category tags separate from free-form tech tags, filter only on category, small link buttons with icons, all controllable from frontmatter | New `ProjectListCard.tsx`, `TechTagList.tsx`, `LinkButtons.tsx`; category `tags` render as bold `TagPill` and are the only filterable row; `techTags` render as small muted chips, shown but never filterable | r3-01 (schema) + r3-02 (layout) | Verified - screenshots `projects-1440.png`, `projects-390.png`, `research-1440.png`, `research-390.png`, `project-detail-juno-1440.png` |
| 7a | Home page: 3-in-line instead of 4 for featured projects | `FeaturedProjectsSection` grid changed to `lg:grid-cols-3`; this pass additionally bumped `ProjectCard`'s image height at `lg`/`xl` so images don't look squat at the new card width | r3-03 (`FeaturedProjectsSection.tsx`) + this pass (`ProjectCard.tsx`) | Verified - screenshot `home-1440.png` (clean 3x2 grid, correctly proportioned images) |
| 8 | Icon per link, optional, from a large icon library, all in frontmatter | `lucide-react` + `DynamicIcon`, ~88 curated icon names, plus hand-rolled `chrome`/`github`/`linkedin` brand icons since lucide ships none; unrecognized names fail the build loudly | r3-01 + r3-02 | Verified - screenshot shows Crunchy Filler's chrome icon rendering correctly; full icon list documented in `CONTENT-AUTHORING.md`; this pass applied the last outstanding icon handoff (`crunchy-filler.md`'s `icon: puzzle` → `icon: chrome`) and swept every other content file for a similar upgrade (none found - no content file links to github.com or linkedin.com today) |
| 9 | Mobile: portrait image above "Health Tech Builder / Hi, I'm Tejit" text | `Hero.tsx`'s portrait wrapper renders first in DOM order, swapped back via `lg:order-*` at desktop widths | r3-03 (`Hero.tsx`) | Verified - screenshot `home-390.png` |
| 10 | Projects should read ~80-90% width on mobile, with padding, image not full-bleed | `PageContainer`'s existing `px-6` gutter measured at ~86.7% of a 390px viewport; image sits further inset inside the card | r3-02 | Verified - screenshot `projects-390.png` shows visible gutters and inset image |
| 11 | "Connect / Profiles" card has no padding, text touches border | Root cause was the dead `p-4.5` Tailwind class (`4.5` not in the default spacing scale); fixed by adding `spacing['4.5']` to `tailwind.config.ts` | r3-04 (`tailwind.config.ts`) | Verified - screenshot `home-1440.png` (crop confirms real padding); compiled CSS grep confirms `.p-4\.5{padding:1.125rem}` |
| 12 | Tag pills don't filter at all; search doesn't work | Two independent root causes, both fixed: (a) `firebase.json`'s CSP was missing inline-script hashes on some build paths (r3-04, plus a new build-time verification guard); (b) a real client-side crash (`Buffer is not defined`, see above) broke hydration entirely - found and fixed in this final pass | r3-04 + this pass (`src/main.tsx`, `src/lib/bufferPolyfill.ts`) | Verified interactively - clicking a category pill and typing a search query on both `/projects` and `/research`, in a real browser against the real emulator, correctly narrows the list each time; zero console errors |
| 13 | No 404 page; random URL falls back to home page | Catch-all rewrite removed from `firebase.json`; enumerable `/404` route added; `promote404()` postbuild step copies `dist/404/index.html` to `dist/404.html` for Firebase's native 404 fallback | r3-04 (diagnosis + partial fix) + r3-02 (route handoff applied, build unblocked) | Verified - `curl -sI http://127.0.0.1:5000/<bad-path>` returns a genuine `HTTP/1.1 404 Not Found`; screenshots `404-1440.png`/`404-390.png` show the real `NotFoundPage`, not the home page |
| 14 | Two "Tejit Pabari · Tejit Pabari" in the browser tab title | `RouteMeta.tsx` no longer appends `· SITE_NAME` when the title already equals `SITE_NAME`; `index.html`'s redundant static `<title>`/description removed | r3-04 | Verified - every route checked via curl has exactly one `<title>` element; home page's is exactly `Tejit Pabari` |
| 15 | Footer is the same color as Contact; expected alternation | `Footer.tsx` changed from `bg-cream` to `bg-sage` | r3-03 | Verified - screenshot `home-1440.png`, Contact section (cream) and Footer (sage) are visibly distinct colors |
| 16 | Remove the Netlify stuff from GitHub Actions | See "The Netlify question" below - nothing to remove | - | Verified, no change needed |

## The Netlify question

Ran `grep -ri netlify` across the whole repository (excluding
`node_modules`, `.git`, `dist`). Result:

- `.github/workflows/firebase-hosting-merge.yml` and
  `firebase-hosting-pull-request.yml` - the only two GitHub Actions
  workflows in the repo - contain **zero** Netlify references. Both are
  pure Firebase Hosting deploy workflows (`FirebaseExtended/action-hosting-deploy`).
- No `netlify.toml` file anywhere in the repo.
- No `_redirects` file anywhere in the repo.
- No `netlify-shortener` (or any other Netlify-named package) in
  `package.json` or `package-lock.json`.
- The only Netlify mentions anywhere in the repository are historical,
  inside `.dev/website-revamp/BRIEF.md` and
  `.dev/website-revamp/01-app-shell-design-system-deploy/PRD.md`/`TASKS.md`
  - planning documents from the round-1 migration off Netlify onto
  Firebase Hosting, describing that past decision and the DNS cutover.
  These are a record of what happened, not live configuration, and were
  left untouched.

**Conclusion: there is no live Netlify configuration anywhere in this
repository today.** GitHub Actions already runs Firebase Hosting only.
Nothing was changed for this item.

## Wrap-up checks

All run against the final committed state:

- `npm run typecheck` - passes clean.
- `npm test` - 249/249 tests passed, 42 test files.
- `npm run lint` - passes clean.
- `npm run check:launch` (`check:no-forms` + `check:no-em-dash` +
  pre-launch content gate) - passes clean.
- `npm run build` - passes end to end (prebuild → typecheck → SSG build →
  postbuild's `promote404()` + `inject-csp-hashes.mjs`, including its own
  post-write verification that every inline script has a matching CSP
  hash).
- `firebase.json` committed matches the CSP hashes from that exact final
  build.
- `git status` - clean working tree.

## Screenshots

All captured at 1440px (desktop) and 390px (mobile) against the real
build served through `firebase emulators:start --only hosting`, saved at
`.dev/website-revamp-r3/screenshots/`:

- `home-1440.png` / `home-390.png`
- `projects-1440.png` / `projects-390.png`
- `research-1440.png` / `research-390.png`
- `work-experience-1440.png` / `work-experience-390.png`
- `project-detail-juno-1440.png` / `project-detail-juno-390.png`
- `404-1440.png` / `404-390.png` (a deliberately bad URL, proving the 404
  works)

## Owner-only items

1. **Supply a real portrait photo.** No portrait file exists in
   `public/` today (`HeroPortrait.tsx` renders a "TP" placeholder
   monogram). Once the owner adds a photo file under `public/` (e.g.
   `public/tejit-portrait.jpg`), `Hero.tsx` needs a one-line change:
   `<HeroPortrait src="/tejit-portrait.jpg" />`.

## Deliberate design decisions worth knowing

- **The `/projects/:slug/live` subsystem was deleted wholesale.** The
  "Open Live" button, its redirect/hosted-page registry, and the
  `liveUrl` frontmatter field are all gone, replaced by the
  frontmatter-driven `links[].primary` button described in feedback
  item 6. This was an explicit owner request ("I think open live button
  doesn't make sense"), not an oversight.
- **`techTags` are searchable but never become filter pills.** The
  owner's spec was explicit: category `tags` are the only filterable
  row (shown as pills directly under the search bar); free-form
  `techTags` are shown alongside them in a visually distinct, subtler
  style, and are included in the Fuse.js search index at a low weight
  (0.1, the lowest of all indexed fields) so a tech-stack search term
  can still surface a result without ever out-ranking a title or
  category match. There is intentionally no UI to filter by a
  `techTags` value.
- **Timeline "broader" was interpreted as matching the page's
  structural container width, not literal edge-to-edge text.** The
  timeline's outer wrapper now spans the same `max-w-content` width as
  every other section on the page (no more inner `max-w-[640px]`/
  `max-w-[45rem]` box). Each entry's actual prose is capped at
  `max-w-[42rem]`, which lands close to the width the "About" section's
  own paragraphs already wrap at, so the timeline now visually reads as
  consistent with the rest of the page's text rather than stretching
  illegibly wide. If the owner meant something more literal (text
  itself stretching further right), that's a one-line change to
  `TimelineEntry.tsx`'s new inner wrapper.
- **StatusBadge / Tailwind opacity fix was done by extending the
  design system's scale, not by rewriting call sites.** `tailwind.config.ts`
  now declares the exact non-standard opacity steps (8, 12, 22, 28, 92,
  97) this codebase already used, rather than converting every
  `bg-x/NN` class to arbitrary-value bracket syntax. This fixes every
  affected class at once and keeps the source `className`s readable.
- **The Buffer-polyfill fix, not a data-pipeline refactor.** The
  cleaner long-term fix for the client-side `Buffer is not defined`
  crash would be to stop shipping `gray-matter`/`js-yaml` (a full
  frontmatter/YAML parser) inside the client JS bundle at all - content
  could be parsed once at build time and shipped to the client as plain
  data instead. That's a real bundle-size win but a materially larger
  refactor than this final-pass scope justified, since `projects`/
  `research`/`workExperience` are imported synchronously by many page
  and test files today. The polyfill (`src/lib/bufferPolyfill.ts`) is a
  correct, minimal, well-contained fix for the immediate correctness
  bug; the bundle-size question is left as a note for a future round.
