# Project & research image specs

**TL;DR: send me one landscape-ish photo per project/research item, roughly
4:3 (e.g. 2000×1500px), with the subject centered and ~20% clear space on
every edge. Export as WebP, quality ~80, aiming for 150-300KB. Name it
`<slug>.webp` and I'll drop it at `public/images/projects/<slug>.webp` (or
`public/images/research/<slug>.webp`) — that already works with the current
content pipeline (see "Wiring it up," below). One file per project is
enough; the site crops it differently for each surface automatically.**

## Why one image has to survive several different crops

Every project/research image is rendered with CSS `object-fit: cover`, on
three completely different surfaces, at several breakpoints each — plus a
fourth, separate 1200×630 social-share card generated at build time. `cover`
always fills its box and crops the overflow from the center by default, so
the same source file ends up cropped to several different aspect ratios.
The numbers below are the actual maximum CSS pixel boxes, computed directly
from the current component code and Tailwind config (`max-w-content:
72rem` = 1152px), not estimated.

| Surface | Component | Rendered box (max, by breakpoint) | Aspect ratio range |
|---|---|---|---|
| Home page featured grid | `ProjectCard.tsx` | ~341×205px steady-state on any desktop ≥1248px wide (common case); up to ~563×120px in the rare 600-639px transitional width band; ~300-350×120px on a typical phone | ~1.6:1 (desktop) up to ~2.9:1 (phone), spiking to ~4.7:1 in the rare transitional band |
| `/projects` & `/research` list | `ProjectListCard.tsx` | Fixed 240×180px (4:3 exactly) at ≥1024px; fixed 220×154px from 640-1023px; full-width up to ~350×180px on a phone (rare edge: ~563×180px in the same 600-639px band) | 1.33:1 (desktop, exact 4:3) to ~1.4-2:1 (mobile) |
| Project/research detail hero | `DetailHeader.tsx` | **1152×320px at any desktop ≥1248px wide — the single largest box on the site.** ~928×320px at 1024px. ~327×200px on a typical phone. | Up to **3.6:1** on desktop (a wide, short letterbox crop) down to ~1.6:1 on a phone |
| Social share card (OG/Twitter) | `scripts/generate-og-cards.mjs` | Fixed 1200×630px overall; when a local image is supplied, it fills a **400×630px panel on the right third** — a tall, narrow slice | **0.63:1** — taller than it is wide |

That last row is the constraint that matters most: the same photo has to
survive both a very **wide** crop (3.6:1, the desktop detail-page hero) and
a fairly **tall** crop (0.63:1, the OG card's image panel) — opposite
extremes. A photo that's already landscape-cropped tight around its subject
will lose the subject entirely in one of the two.

## The recommendation

- **Shape: near-square to a gentle 4:3 landscape**, subject dead-center,
  with roughly 20% clear, uncluttered space on all four edges. A square or
  4:3 source survives being center-cropped to both the wide hero strip and
  the tall OG panel without losing the subject — a tight 16:9 landscape
  crop does not.
- **Pixel dimensions: at least 2000×1500px** (4:3) or 1600×1600px (square).
  This comfortably covers every surface above at standard (1x) display
  density with real headroom, and covers most real-world 2x/retina cases
  too (laptop screens are rarely wider than ~1440 CSS px, well under the
  1152px hero's rendered width). The one truly worst case — a 2x/retina
  external monitor wide enough to hit the 1152px-capped hero at full
  width — would need a ~2304px-wide source to be perfectly upscale-free;
  that's a real but very small quality cost on a personal portfolio site,
  not worth doubling every file's size for. If you have access to a
  higher-resolution original, sending it is free extra headroom — there's
  no upper size limit here I need respected on the source; just target the
  *exported* file size below.
- **Format: WebP, no JPEG fallback.** The three surfaces above all render
  a plain `<img src>` (not a `<picture>` element with format fallbacks),
  so shipping a JPEG "fallback" file would just be dead weight — nothing
  in the current pipeline would ever request it. WebP has effectively
  universal browser support today and compresses meaningfully better than
  JPEG at the same visual quality, which is what actually matters for load
  time. (AVIF compresses slightly smaller still, but is more finicky to
  export consistently and the gain here is marginal — WebP is the better
  default for this pipeline. If per-format fallback is ever wanted, that's
  a small follow-up change to `ProjectCard`/`ProjectListCard`/
  `DetailHeader` to add `<picture>` markup — out of scope here, flagging
  it as a future option, not a current gap.)
- **Quality: ~78-82.** Visually indistinguishable from higher settings for
  a photo at this size, meaningfully smaller than 90+.
- **File size budget: 150-300KB** for the one master image. All three
  in-app surfaces reuse this exact same file (there's a single `image`
  field per project in frontmatter — see "one asset, not per-surface
  variants" below), so this is the only number that matters for load time;
  it's requested once per page view, not once per surface.
- **Color profile: sRGB.** Anything else (Display P3, Adobe RGB) will
  render with shifted colors in most browsers; convert to sRGB on export.

## One asset per project, not per-surface variants

Ship exactly **one** image per project/research item, not a separate crop
for the grid card vs. the list card vs. the detail hero. Reasons:

1. The content schema has a single `image: <path>` frontmatter field —
   there's no per-surface field to populate even if variants existed.
2. `object-fit: cover` already handles the different aspect ratios
   correctly from one source file (that's the entire point of the
   near-square recommendation above).
3. At a 150-300KB budget, the bandwidth savings from per-surface variants
   would be negligible for a personal portfolio's traffic, and would add
   real ongoing maintenance cost (regenerating multiple crops by hand
   every time a project photo changes) for no visible benefit.

The one place that gets a *separate*, auto-generated image is the OG/social
card — `scripts/generate-og-cards.mjs` composites your project photo into a
title card automatically at build time; you never export that one
yourself.

## Wiring it up

Frontmatter's `image:` field already accepts a root-relative local path —
`src/data/shared.ts`'s `assertImagePath` allows either an absolute
`http(s)://` URL (what every project currently uses, the shared Unsplash
placeholder) or a path starting with `/`. **No code change was needed to
make this work** — it already does. The convention to use, mirroring the
existing `public/og/` layout:

```
public/images/projects/<slug>.webp
public/images/research/<slug>.webp
```

and in the corresponding content file:

```yaml
image: /images/projects/juno.webp
```

Two things happen automatically once you do this:

- Every page that renders `project.image`/`item.image` (the home page
  featured grid, `/projects` and `/research` list cards, and the detail
  page hero) picks up the new local file immediately — no other change
  needed.
- `scripts/generate-og-cards.mjs`'s `localImageDataUri` helper already only
  composites a **local** (`/...`) image into the generated OG card — it
  deliberately skips the current Unsplash placeholder, which is why every
  OG card today is text-only. The moment a project's `image:` points at a
  real local file, the next `npm run build` (or `node
  scripts/generate-og-cards.mjs` directly) will bake that photo into its
  OG card's right-third panel automatically.

This document does **not** change any `image:` value in
`src/content/projects/*.md` or `src/content/research/*.md` — those still
point at the shared Unsplash placeholder until you source and drop in real
photos at the paths above.

## Quick reference

| What to send | Value |
|---|---|
| Shape | Near-square to 4:3 landscape, subject centered, ~20% margin on all sides |
| Pixel size | ≥2000×1500px (4:3) or ≥1600×1600px (square) |
| Format | WebP (no JPEG needed — see above) |
| Quality | ~78-82 |
| File size | 150-300KB |
| Color profile | sRGB |
| Variants | One file per project — no per-surface crops |
| Filename/path | `public/images/projects/<slug>.webp` or `public/images/research/<slug>.webp` |
| Frontmatter | `image: /images/projects/<slug>.webp` |
