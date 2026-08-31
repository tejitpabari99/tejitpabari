---
slug: sample-project
title: Sample Project
description: A scaffolding project exercising every markdown feature this site supports — not a real project. Safe to delete once share-preview testing is done.
image: https://images.unsplash.com/photo-1572177812156-58036aae439c
tags:
  - Developer Tools
status: Completed
date: 2026-01-01
demo: true
links:
  - label: react-markdown
    href: https://github.com/remarkjs/react-markdown
  - label: remark-gfm
    href: https://github.com/remarkjs/remark-gfm
---

<!--
  SCAFFOLDING — NOT REAL CONTENT. This file exists to exercise every
  react-markdown/remark-gfm feature SP02 §4.8 configures, and to give
  SP06's OG-card generator, RouteMeta, and share-preview testing a safe,
  disposable subject that isn't a real project. Delete this file (and
  src/pages/live/sample-project.tsx, src/pages/live/sample-project.test.tsx,
  and its one line in src/pages/live/registry.ts's HOSTED_LIVE_PAGES) once
  share previews are confirmed working on the real domain — see PRD 06 §8.

  NOTE: this comment lives just after the frontmatter, not literally at
  byte 0 of the file — gray-matter (src/data/shared.ts's parseProject)
  requires the "---" frontmatter delimiter to be the file's first
  characters; a leading HTML comment before it makes gray-matter parse
  the whole file as body with empty frontmatter data (verified locally:
  `assertSlugMatchesFilename` then fails with slug "undefined" !=
  "sample-project"). Placing the same marker comment here instead is the
  closest equivalent to "an HTML comment at the top of the file" that
  still parses.
-->

## Why this page exists

This is **scaffolding**, not a real project — it exists so the owner can preview how a full markdown write-up renders on this site's actual palette, and so link-preview testing on LinkedIn/Facebook/iMessage has a safe subject that isn't real content.

### What it exercises

A short paragraph with *italic*, **bold**, ***bold italic***, ~~strikethrough~~, and `inline code` — every inline style `remark-gfm` adds on top of CommonMark, in one sentence, so a single read-through of this paragraph alone proves inline rendering works end to end.

Here's a fenced code block with a language tag, so syntax-aware styling (even without a highlighter — SP02 §4.8 explicitly ships no syntax-highlighting library) still gets monospace/background treatment from the `prose` typography plugin:

```ts
export function liveMode(project: Project): 'redirect' | 'hosted' {
  return project.liveUrl ? 'redirect' : 'hosted';
}
```

An ordered list:

1. First item
2. Second item
3. Third item, with a nested list:
   - Nested bullet one
   - Nested bullet two

An unordered list:

- Alpha
- Beta
- Gamma

A GFM task list:

- [x] Ship the sample project
- [x] Exercise every markdown feature
- [ ] Delete this file once share previews are confirmed (see PRD 06 §8)

A GFM table:

| Feature | Library | Exercised here? |
|---|---|---|
| Headings | `react-markdown` | Yes — h2, h3 above |
| Tables | `remark-gfm` | Yes — this table |
| Task lists | `remark-gfm` | Yes — the checklist above |

> A blockquote — the kind of pull-quote a real project writeup might use to call out a notable result or piece of feedback.

---

One inline link to this site's own [Projects page](/projects) (internal — exercises `markdownComponents`' same-tab renderer, SP02 §4.8), and one to [react-markdown's repository](https://github.com/remarkjs/react-markdown) (external — exercises the `target="_blank"`/`isExternalUrl` branch of the same renderer).

![A placeholder image, rendered via react-markdown's default img mapping](https://images.unsplash.com/photo-1572177812156-58036aae439c)
