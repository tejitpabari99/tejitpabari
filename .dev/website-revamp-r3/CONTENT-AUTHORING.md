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

## What's no longer part of the schema

- `liveUrl` and the whole `/projects/<slug>/live` page/redirect system are
  gone. If a project has a live version somewhere, just add it as a link
  in `links[]`, mark it `primary: true` if it's the main destination, and
  pick a fitting `icon`.
- `demo` is gone (it was unused by any page).
