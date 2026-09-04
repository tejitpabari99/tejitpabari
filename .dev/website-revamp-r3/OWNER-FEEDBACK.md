# Owner feedback - round 3

Branch: `website-revamp`. This is the owner's review of round 2's shipped
site, pasted verbatim below, followed by how round 3 is split across
sub-projects to address it.

## Verbatim feedback

```
Remove back from all places. I think navbar is good enough maybe. Confusing to have both

Work experience - the timeline should be broader. Its left aligned now but the width is still less - should be same width as others.

Instead of this - tejitpabari99 _at_ gmail [dot] com, put an email me button there
search bar in projects should be bigger. Full width.
ALso, remove creator onboarding and QGIS plugin altogether from projects

I think open live button doesn't make sense. One button for each should be dark green, but that is customizable. For crunchy filler, it is chrome web store. for Juno is it the website etc - I should be able to decide and point this out in the markdown frontmatter maybe?

Also, try an alternative layout for the project and research page. The three box layout I like actually for the home page (change it to 3 in line instead of 4) - the projects. But in the actual projects page itself, the image should be on left and then a card that spans horizontally. SO a list of cards, instead of a grid of 3 per row. DOes that make sense?
And it should show other tags that I can keep there. On top of the categories. SO category is a separate tag, and then I have other tags (eg if I put the tech I used, the programming language etc). BUt the filter (tags shown right below search bar) is only on the categories.
And It should have smaller buttons for the links that I have as well. I should be able to decide what links.

See this one as a rough example - https://gbose.dev/projects.html

I also like having an icon for each button. Maybe I can specify icon (optionally) and if specificed it should pick that icon from library. I should be able to do everything in front matter or in the mardwon itself. no need to code it out for me. Pick an icon library that is vast enough maybe?

When the page is small, like mobile size, the image should come above the Health Tech Builder, Hi I'm Tejit and all the text.
Projects look pretty wide. They come one per row - which is correct. BUt they should be like 80% of the width. It seems like there is no paddin geither side and the image looks wide

Get in touch - the connet profiles card looks weird. There is no margin/padding. text goes right to the border of the card.

None of the tags are clickable in projects. They dont filter at all.
Search doesn't work as well? Why?

Ther eis no 404 - I put a random page and it put me at home page

I see two Tejit Pabari.Tejit Pabari in my browser window heading. Why?

Footer is same color as contact. I thought you were alternating no?

Can you remove the netlify stuff from github actions?
```

## How this round is split

Round 3 is broken into four sub-projects, run largely in parallel against
the same `website-revamp` branch.

**1. Schema, icons, content foundation (this sub-project,
`r3-01-schema-icons-content`)**

The groundwork the other three sub-projects build on:

- Added `lucide-react` and a `DynamicIcon` component so any link in
  frontmatter can specify an `icon:` name, resolved at content-parse time
  with a loud failure on an unrecognized name (never a silent blank icon).
- Extended the `links[]` schema with optional `icon` and `primary` fields,
  so the owner can mark exactly one link per project or research item as
  the primary "try it" destination, styled distinctly, straight from
  frontmatter, no code changes needed per project.
- Added a free-form `techTags` field (separate from the existing,
  allowlisted `tags` category field) so the owner can list the actual tech
  used per project or research item, independent of the category filter.
- Removed `creator-onboarding-tool` and `qgis-plugin-azure-maps-creator`
  from the site entirely, per the owner's request.
- Removed the whole `/projects/:slug/live` subsystem (the "Open Live"
  button, the redirect/hosted-page registry, the `liveUrl` field) since the
  owner said it doesn't make sense as a concept; replaced with the
  frontmatter-driven primary-link button described above.
- Removed the unused `demo` field from the project schema.

**2. Projects and research page layout**

Owns the actual page redesign this round's biggest ask describes: a
horizontal list-card layout (image left, content right) instead of a 3-up
grid on `/projects` and `/research`, a full-width search bar, clickable
category tag filters that actually filter, a separate row for the new
free-form `techTags` (shown but not filterable), and small per-link buttons
built on this sub-project's new `icon`/`primary` schema.

**3. Home page and shell polish**

Owns: the featured-projects section moving from 4-per-row to 3-per-row,
removing the redundant in-page Back button in favor of the navbar alone,
widening the work-experience timeline to match the rest of the page's
width, replacing the raw obfuscated email address with an "Email me"
button, the mobile layout fix so the hero image sits above the headline
text on small screens, the "Get in touch" social-profiles card's missing
padding, and the footer/contact alternating-color fix.

**4. Production bug fixes**

Owns the functional defects: category tags and search not filtering on
`/projects` (a CSP/hydration problem, not a UI logic problem), the missing
404 page (a random path currently falls back to the home page instead of a
real not-found page), the duplicated "Tejit Pabari · Tejit Pabari" browser
tab title, and removing the leftover Netlify step from GitHub Actions.

---

> **Note added 2026-09-04 (deploy target, not a rewrite of the feedback above):** the owner asked, separately from this round's feedback, to confirm the Netlify-related cleanup this file already discusses (item 16 above, resolved in `ROUND-3-SUMMARY.md`'s "The Netlify question"). Re-verified directly: the repository has no live Netlify configuration of any kind (no `netlify.toml`, no `_redirects`/`_headers`, no Netlify Forms markup, no `netlify-shortener` or other Netlify package, nothing in `.github/workflows/`). The site deploys exclusively via Firebase Hosting (`firebase.json`, `firebase deploy`, project `tejitpabari-99`). The remaining Netlify-shaped item is not code: whether the owner's original Netlify site/account for tejitpabari.com has been decommissioned once DNS fully points at Firebase — that is an owner-only action outside this repo's scope, tracked in the `01-app-shell-design-system-deploy/PRD.md` launch-blocker section, not here.
