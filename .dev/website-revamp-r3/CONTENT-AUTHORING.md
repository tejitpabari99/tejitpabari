# Content authoring reference

Round 3 adds a few new frontmatter fields to `src/content/projects/*.md` and
`src/content/research/*.md`. This is the full schema after those changes,
a complete annotated example, and the list of icon names you can use. You
can do all of this from the markdown file itself, no code changes needed.

## Full frontmatter schema

### Projects (`src/content/projects/<slug>.md`)

| Field | Required | Type | Notes |
|---|---|---|---|
| `slug` | yes | string | Must exactly match the filename (no `.md`). |
| `title` | yes | string | |
| `description` | yes | string | Short summary, shown on cards and the detail page. |
| `image` | yes | string | Root-relative path (`/images/...`) or a full `https://...` URL. |
| `tags` | yes | array | The category filter. One or more of: `Health Tech`, `Developer Tools`, `Others`. This is the only field the `/projects` filter buttons use. |
| `techTags` | no | array of strings | Free-form. Any tech, language, or tool you want listed. No allowlist, not used for filtering, just shown alongside the category tags. Omit or use `[]` for none. |
| `status` | no | string | One of: `Building`, `Not Started`, `Completed`. Omit for no status pill. |
| `links` | yes | array | Use `links: []` for none. See below for the shape of each entry. |
| `date` | yes | string | `YYYY-MM-DD`, quoted. |
| `live` | no | mapping | Controls where `/projects/<slug>/live` goes. Omit entirely for no special handling. See "The `live` field", below, for the full shape. |

### Research (`src/content/research/<slug>.md`)

Same shape as projects, except:

- `tags` uses a different allowlist: `Health`, `Machine Learning`, `Other`.
- There is no `status`... actually there is: same `status` values (`Building`,
  `Not Started`, `Completed`) apply here too.
- No `image` restriction beyond the shared rule above.

### `links[]` entry shape (both collections)

```yaml
links:
  - label: Website        # required, non-empty string
    href: https://x.com    # required, non-empty string
    icon: globe             # optional, see icon list below. Unrecognized
                             # names fail the build with a clear error.
    primary: true            # optional. At most ONE link per file may set
                              # this. That link renders as the filled,
                              # dark-green button; every other link renders
                              # in the plain outlined style.
```

If you leave `icon` off a link, it falls back to a plain external-link
arrow icon. If you leave `primary` off every link, none of them get the
filled/dark-green treatment, they all render outlined.

## Annotated example

```yaml
---
slug: crunchy-filler
title: Crunchy Filler
description: >-
  A Chrome extension that marks filler episodes across anime series on
  Crunchyroll, helping fans skip non-canon content and stay on track with
  the main story. Downloaded 200+ times.
image: https://images.unsplash.com/photo-1572177812156-58036aae439c
tags: [Developer Tools]              # category filter (allowlisted)
techTags: [Chrome Extension, JavaScript]   # free-form, shown but not filtered
status: Completed                    # optional status pill
links:
  - label: Chrome Web Store
    href: https://chromewebstore.google.com/detail/crunchy-filler/djbcknbbfoldifpllefimnnkfaogcnid
    icon: chrome                      # this site's own hand-rolled Chrome
                                       # icon (lucide-react itself ships no
                                       # brand logos, see note below)
    primary: true                     # the one obvious "try it" link
date: "2022-01-01"
---
Optional markdown body goes here, rendered below the links row.
```

## Icon names

Icons come from [lucide-react](https://lucide.dev/icons/), a large,
actively-maintained open-source icon set. Write the `icon:` value exactly
as lucide.dev spells it, in kebab-case (lowercase, hyphens between words),
for example the icon lucide.dev calls "External Link" is `external-link`.

**Brand/company logos:** lucide-react itself does not include these (no
Chrome browser icon, no GitHub mark, no LinkedIn/Twitter/etc. logos, these
were dropped from the lucide-react project years ago). This site fills in
the three most commonly needed ones with its own hand-rolled icon
components instead: `chrome`, `github`, and `linkedin` are all valid `icon:`
values today (see `src/components/icons/ChromeIcon.tsx`,
`GitHubIcon.tsx`, `LinkedInIcon.tsx`). For anything else brand-shaped, pick
a generic icon that fits the destination instead, for example `code` /
`git-branch` for a code repository link, or `puzzle` for some other kind of
browser-extension store link.

This site currently ships a hand-picked set of about 88 icon names (kept
small on purpose, for a small, fast page instead of loading all ~1500
lucide icons). If you want an icon not in this list, ask for it to be added
to `ICON_MAP` in `src/components/icons/iconRegistry.ts`, it's a one-line
addition.

Names available today:

```
activity, app-window, arrow-right, arrow-up-right, at-sign, award,
badge-check, bar-chart, bar-chart-2, blocks, book-open, bookmark, boxes,
brain, briefcase, building-2, calendar, chevron-right, chrome, circle-check,
clock, cloud, code, code-2, compass, cpu, database, dna, download,
external-link, file-badge, file-check, file-code, file-text, flask-conical,
flask-round, folder-git-2, git-branch, git-fork, github, globe,
graduation-cap, hash, heart-pulse, heart, help-circle, home, image, info,
layers, line-chart, link-2, link, linkedin, lock, mail, map-pin, map,
message-square, microscope, monitor-smartphone, monitor, newspaper,
notebook, package, phone, play, presentation, puzzle, rocket, school,
scroll-text, send, server, settings, shield-check, smartphone, sparkles,
star, stethoscope, tag, tags, target, terminal, trending-up, user, users,
video, wrench, zap
```

## The `live` field

Every project and research entry has a canonical, stable URL:
`/projects/<slug>/live` (or `/research/<slug>/live`). This is a ROUTE, not
a button that appears on the page — it is meant to be the one link you
hand out and share, wherever "check out my live project" comes up. It is
guaranteed to resolve to something sensible no matter what, in this exact
order:

1. **`live` declared in frontmatter** — `live.type: external` redirects
   to an address you own elsewhere (your own domain, a short link, an app
   store listing, whatever). `live.type: self` renders a page you've
   written yourself, hosted directly on this site, inside the normal site
   chrome (nav and footer, same as any other page).
2. **No `live` field, but `links[]` is non-empty** — redirects to
   whichever `links[]` entry is marked `primary: true`, or `links[0]` if
   none is marked.
3. **No `live` field and no `links[]` at all** — redirects to the entry's
   own detail page (`/projects/<slug>` or `/research/<slug>`).

```yaml
# Redirect to somewhere you host elsewhere:
live:
  type: external
  href: https://smarttest.example.com   # required for type: external.
                                          # Must be an absolute http(s) URL.

# Render a page you've written yourself, on this domain:
live:
  type: self
  page: crunchy-filler   # required for type: self. Must match a key in
                          # src/pages/live/registry.ts's HOSTED_LIVE_PAGES
                          # (see "Adding a self-hosted live page", below).
```

`label`/`icon` are also accepted on both variants (`live.label`,
`live.icon`, same icon list as `links[].icon`) — they matter only for the
one card surface that ever synthesizes a button from `live` (the
`/projects`/`/research` index cards' empty-`links[]` fallback, see
"Where the live link shows up" below); everywhere else `live` only steers
where the `/live` route goes and never shows up as a labeled button of
its own.

A build fails loudly, naming the file, for: an unrecognized `live.type`;
`href` missing or not an absolute http(s) URL for `type: external`; `page`
missing, or not a key in `HOSTED_LIVE_PAGES`, for `type: self`; an
unrecognized icon name; or an unrecognized key inside `live` (including
mixing `href` into a `type: self` entry, or `page` into a `type: external`
one — pick exactly one).

### Where the live link shows up

- **Detail pages** (`/projects/<slug>`, `/research/<slug>`): `links[]`
  renders exactly as authored — no live button, no reordering, no label
  inheritance. `live` (when set) only decides where the separate `/live`
  route goes; it never adds anything to this row. Links are "shown, but
  used to define what live is" when there's no explicit `live` field
  (rule 2 above) — they don't need to additionally show a live button of
  their own.
- **The `/projects` and `/research` index cards**: same as detail pages —
  `links[]` renders exactly as authored, unchanged, whenever it has at
  least one entry. The ONLY exception: an entry with NO `links[]` at all
  gets a single live-link button instead of showing nothing, pointed at
  the internal `/live` URL and labeled from `live.label`/`live.icon` if
  set, `"Live"`/`"globe"` otherwise.
- **The home page's featured project cards**: these cards show exactly
  ONE link (a small icon-only overlay on the card's image, no visible
  label) — and it ALWAYS points at the internal `/live` URL, for every
  featured project, whether or not it declares `live` at all. Rules 2/3
  above guarantee that URL resolves somewhere real either way. The card
  body's title still goes straight to the detail page, unchanged; the
  overlay is a separate "open the app" affordance.

The target-resolution rules (1/2/3 above) are implemented in exactly one
place, `src/lib/resolveLiveLinks.ts`'s `resolveLiveTarget`, shared by the
client-side `/live` dispatch pages and the build-time Firebase Hosting
redirect generator (`vite.config.ts`), so a real deployed hit and the
`npm run dev` fallback can never disagree about where a given `/live`
goes. The much smaller card-only logic (the index-card empty-`links[]`
fallback, and the featured-card internal href) lives in that same file's
`resolveCardLinks` and `buildLiveHref`.

### Adding a self-hosted live page

1. Write `src/pages/live/<name>.tsx`, exporting one component that takes
   no required props. It renders inside the normal site shell (nav/footer
   already there) — just write the page's own content.
2. Add one line to `HOSTED_LIVE_PAGES` in `src/pages/live/registry.ts`:
   `'<name>': YourComponent`.
3. In the entry's frontmatter, set `live: { type: self, page: <name> }`.

That registry is also what `scripts/check-no-forms.sh` guards: every file
under `src/pages/live/` must stay free of `<input>`/`<textarea>`/`<form>`/
file-upload markup, because `/privacy` and `/terms` both currently state
this site has no forms anywhere. If a self-hosted live page ever genuinely
needs one, update those two pages (and their "Last updated" date) before
that page ships, not after.

## What's no longer part of the schema

- `demo` is gone (it was unused by any page).
