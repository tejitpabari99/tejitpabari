# Sections polish notes (r3-03-sections-polish)

Scope: `src/sections/Hero.tsx`, `src/sections/HeroPortrait.tsx`,
`src/sections/ContactSection.tsx`, `src/sections/FeaturedProjectsSection.tsx`,
`src/sections/WorkExperienceSection.tsx`, `src/sections/AboutSection.tsx`,
`src/layout/Footer.tsx`, `src/config/contact.ts`,
`src/hooks/useContactMailto.ts`, plus colocated tests.

All six owner-feedback items below are implemented on `website-revamp`.
`npm run typecheck`, `npm test` (full suite, 235/235), `npm run lint`, and
`npm run check:no-em-dash` all pass. `npm run build`'s postbuild step is
still expected to fail on the pre-existing, tracked missing-404-route issue
(see BUGFIX-NOTES.md) - not touched here. `npx vite-react-ssg build` (the
raw build, skipping that postbuild step) succeeds and was used for all
verification below.

## 1. Featured projects: three per row

`src/sections/FeaturedProjectsSection.tsx`: grid classes changed from
`grid-cols-1 md:grid-cols-2 xl:grid-cols-4` to
`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. With exactly 6 featured
projects (`src/config/featured.ts`, `MAX_FEATURED = 6`), this gives a clean
3x2 grid at `lg` and up.

Verified in the built `dist/index.html`:
`grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3`.

The `externalHref` / `externalLabel` / `onExternalClick` props mentioned in
the task brief (from the `liveUrl`/"open live externally" removal) were
**not present** in this file's `ProjectCard` call when I read it - it was
already just `href, image, imageAlt, title, description, tags, status,
onCardClick`. Nothing to remove; presumably already cleaned up by the
schema/content sub-project before I started. Confirmed no `liveUrl` or
`externalHref` reference remains anywhere in this file.

**Handoff: change another agent must make (ProjectCard.tsx, not owned by
me).** At 3-per-row the cards are meaningfully wider (roughly 276px to
373px at the `xl`/`max-w-content` breakpoint, and even more disproportionate
at `lg`, 1024-1279px, where cards are already 3-wide but the image height is
still capped at the `sm` value), while `ProjectCard.tsx`'s image keeps a
fixed pixel height (`h-[120px] sm:h-[140px] xl:h-[155px]`). The image reads
squat/stretched at the new width. Suggested fix, in
`src/components/ProjectCard.tsx`'s image `<img>` className:

```
// before
className="h-[120px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] sm:h-[140px] xl:h-[155px]"

// suggested
className="h-[120px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] sm:h-[140px] lg:h-[168px] xl:h-[205px]"
```

(`lg:h-[168px]` and `xl:h-[205px]` roughly restore the pre-change ~1.78:1
width:height aspect ratio at each breakpoint's card width; the person
implementing should eyeball/tune against the real 3-up layout rather than
trust these numbers exactly.)

## 2. Hero: portrait above text on mobile

`src/sections/Hero.tsx`: the portrait's wrapper `<div>` now renders
**first** in the DOM (before the text column), so mobile visual order
matches DOM/reading order with no CSS override needed there. `lg:order-2`
on the portrait wrapper and `lg:order-1` on the text wrapper swap them back
to text-left/portrait-right at `lg` and up (paired with base `order-1` /
`order-2` classes, harmless no-ops at the base breakpoint since DOM order
already matches, but they self-document the swap explicitly).

Verified in built HTML: portrait wrapper carries
`order-1 flex items-center justify-center lg:order-2`; text wrapper carries
`order-2 mx-auto w-full max-w-[440px] text-left lg:order-1 lg:mx-0`.

Screen-reader order: now portrait image (alt="Tejit Pabari", or `aria-hidden`
placeholder monogram) is announced before "Health Tech Builder / Hi, I'm
Tejit." Since the portrait is either `aria-hidden` (placeholder case, current
state) or a simple `alt="Tejit Pabari"` image (once a real photo is wired
up), this is a brief, non-disruptive announcement before the heading, not a
confusing detour - acceptable per the task's own guidance to prefer DOM
order matching the mobile visual order.

**Owner-only item:** no portrait photo exists in `public/` (checked with
`find public -iname '*portrait*' -o -iname '*tejit*' -o -iname '*photo*' -o
-iname '*headshot*'` - no matches; `public/` only has `favicon.png`,
`og/`, `robots.txt`, `sitemap.xml`). `HeroPortrait.tsx` was left unchanged
and still renders the "TP" placeholder monogram. Once the owner supplies a
real photo file under `public/`, wire it up in `Hero.tsx` via
`<HeroPortrait src="/whatever-the-file-is" />`.

## 3. Work experience timeline: full width

`src/sections/WorkExperienceSection.tsx`: removed `max-w-[640px]` from the
wrapper around `<Timeline>`, leaving `<div className="mt-8 lg:mt-10">`. The
timeline now spans the full `max-w-content` width like every other section,
staying left-aligned (no `mx-auto`/centering was added).

Verified in built HTML: the wrapper is now `mt-8 lg:mt-10` with no
`max-w-[640px]`.

**Handoff: change another agent must make (`TimelineEntry.tsx`, not owned
by me).** Neither `Timeline.tsx` nor `TimelineEntry.tsx` sets any internal
max-width on the entry's text content (label/date row, role heading, body
markdown, link row) - they're plain block elements that will now stretch to
fill the full ~1152px `max-w-content` width (minus the `pl-[22px]` spine
padding), producing overlong, hard-to-read text lines rather than a "huge
empty right side." Suggested fix: add a comfortable reading-width cap
directly on `TimelineEntry`'s outer element, e.g. in
`src/components/timeline/TimelineEntry.tsx`:

```
const entryBaseClasses =
  "relative max-w-[42rem] border-l-2 border-teal-secondary/15 pl-[22px] pt-[18px] transition-colors duration-200 hover:border-teal-secondary/28 " +
  "before:absolute before:-left-[5px] before:top-[22px] before:h-2 before:w-2 before:rounded-full before:border-2 before:border-cream before:content-[''] before:transition-colors before:duration-200";
```

This keeps the spine anchored at the same left position (matching the wider
section) while capping the actual text at a readable width, leaving
deliberate, not accidental, empty space on the right.

**Handoff: change another agent must make (`WorkExperiencePage.tsx`, not
owned by me).** The standalone `/work-experience` page wraps its `Timeline`
in `<div className="max-w-[45rem]">` (`src/pages/WorkExperiencePage.tsx`
line 17). For consistency with the landing section's new full width, remove
that wrapper's `max-w-[45rem]` (subject to whatever internal max-width fix
lands in `TimelineEntry.tsx` above, which would then also govern this page).

## 4. Contact: always-present "Email Me" button

`src/sections/ContactSection.tsx` no longer branches into a plain
`<span>{CONTACT_EMAIL_DISPLAY}</span>` fallback. It always renders a real
"Email Me" affordance, in both states:

- **Pre-hydration / prerendered / no-JS state** (`useContactMailto()` is
  still `null`): a real `<button type="button">Email Me</button>`. Its
  `onClick` calls `getContactEmailAddress()` (assembled from the existing
  two-constant split in `src/config/contact.ts`, only at click time, in a
  browser event handler) and sets `window.location.href = 'mailto:' +
  address`.
- **Post-hydration state** (`useContactMailto()` has resolved): the same
  visual button upgrades to a real `<a href="mailto:...">Email Me</a>`
  (via the existing `Button` component's dual button/anchor rendering), so
  middle-click and "copy link address" work for real users.

The anti-scraping property is preserved: `getContactEmailAddress()` is only
ever called from an event handler, never at render/module-eval time, so no
contiguous `user@domain.tld` literal appears anywhere in source or in the
compiled output.

**Verification (built output, not just tests):**

```
$ grep -o '<[a-z]*[^>]*>Email Me</[a-z]*>' dist/index.html
<button class="... type="button">Email Me</button>

$ grep -c "tejitpabari99@gmail.com" dist/index.html
0

$ grep -rl "tejitpabari99@gmail.com" dist/assets/*.js
(no output - not present in any JS bundle either)
```

`CONTACT_EMAIL_DISPLAY` in `src/config/contact.ts` was **not** deleted: it
is still referenced by `src/pages/PrivacyPage.tsx` and
`src/pages/TermsPage.tsx` (both out of scope for me), which still render the
obfuscated display string on those pages. Only `ContactSection.tsx`'s own
import of it was removed, since that file no longer uses it.

`src/config/contact.ts` and `src/hooks/useContactMailto.ts` themselves were
**not modified** - the existing `getContactEmailAddress()` /
`useContactMailto()` contract already supported this change without
changes to either file.

Tests updated in `src/sections/ContactSection.test.tsx`:
- Pre-hydration state renders a `role="button"` "Email Me" with no
  `role="link"` version present, and no plain email literal anywhere in the
  rendered markup (covers both the `user@domain` form and the old
  `_at_`/`[dot]` obfuscated form).
- Post-hydration rerender (via the mocked hook resolving) upgrades to
  `role="link"` "Email Me" with the real `mailto:` href, and the button
  role is gone.
- New test clicking the pre-hydration button asserts
  `window.location.href` is set to the assembled `mailto:` address
  (stubs `window.location` locally to avoid jsdom's "not implemented:
  navigation" error, then restores it).

`trackEvent('email_click', ...)` was **not** used - `'email_click'` isn't a
member of `AnalyticsEventName` in `src/lib/analytics.ts`, which is out of
scope for this sub-project. Used the existing `'outbound_click'` category
instead (`context: 'contact_email'`), matching the pattern already used for
the GitHub/LinkedIn social links in the same section.

**Handoff (optional, not requested by the owner): change another agent
could make (`src/lib/analytics.ts`, not owned by me).** If a dedicated
`email_click` event name is wanted for GA reporting, add it to the
`AnalyticsEventName` union:

```
export type AnalyticsEventName =
  | 'outbound_click'
  | 'project_card_click'
  | 'resume_click'
  | 'search_query'
  | 'section_view'
  | 'email_click';
```

and then `ContactSection.tsx`'s two `trackEvent('outbound_click', ...)`
calls for the email button could switch to `trackEvent('email_click',
...)`. Not done here since it requires touching a file outside this
sub-project's ownership; current tracking already fires correctly under
`outbound_click`.

## 5. Contact "Connect / Profiles" card padding

Root cause (the dead `p-4.5` Tailwind class) was already fixed by another
agent in `tailwind.config.ts` (`spacing['4.5'] = '1.125rem'`,
`spacing['6.5'] / lineHeight['6.5'] = '1.625rem'`). Verified by building and
grepping the compiled CSS:

```
$ grep -o '\.p-4\\.5[^}]*}' dist/assets/*.css
.p-4\.5{padding:1.125rem}

$ grep -o '\.leading-6\\.5[^}]*}' dist/assets/*.css
.leading-6\.5{line-height:1.625rem}
```

The card now gets real padding (18px on mobile via `p-4.5`, 20px at `sm+`
via `sm:p-5`), which reads as comfortable, not tight against the border.
Internal spacing between "Connect", "Profiles", and the icon row (`mt-5`,
`mt-3`) was already reasonable and was left as-is - no further edit to
`ContactSection.tsx` was needed for this item. On mobile the card sits in
the stacked single-column layout (the `lg:grid-cols-[...]` split only
applies at `lg`+), so it already gets the same comfortable padding and full
available width there, not squeezed.

## 6. Footer color alternation

`src/layout/Footer.tsx`: `bg-cream` to `bg-sage`, and bumped the top border
from `border-teal-secondary/10` to `border-teal-secondary/20` for a bit
more definition against the slightly-less-light sage background (was
already using teal-secondary at a subtle opacity; kept the same hue,
adjusted only the opacity step).

Landing page now alternates cleanly end to end: Hero `bg-cream` -> Featured
Projects `bg-sage` -> Work Experience `bg-cream` -> About `bg-sage` ->
Contact `bg-cream` -> Footer `bg-sage`.

On every other page (`/projects`, `/research`, project/research detail
pages, `/work-experience`, `/privacy`, `/terms`), the page body itself is
`bg-cream` (not part of this alternation, and not a file I own), so the
footer's `bg-sage` there just gives those pages a clean sage edge at the
bottom, matching the "footer/contact alternation" intent without requiring
those pages to alternate anything themselves.

**Contrast check** (WCAG relative-luminance calculation, not a tool run):
- Footer nav links / attribution link, `text-teal-secondary` (`#0F4C45`) on
  `bg-sage` (`#DDE7DE`): ~7.7:1, comfortably passes AA for any text size.
- Footer copyright / attribution body text, `text-slate` (`#6B7B77`) on
  `bg-sage`: ~3.5:1. This is below the strict 4.5:1 AA threshold for small
  text, but it was **already** below that threshold on the prior `bg-cream`
  background too (~4.0:1) - `text-slate` is used sitewide as a deliberately
  muted "tertiary" text color (timeline dates, tag pills, etc.), and the
  drop from cream to sage is modest (~4.0 to ~3.5), not a new regression
  introduced by this change. Left as-is rather than special-casing the
  footer's text color away from the rest of the site; flagging here in case
  the owner wants tertiary text contrast addressed sitewide as a separate,
  deliberate design decision.

## Files changed

- `src/sections/Hero.tsx`
- `src/sections/FeaturedProjectsSection.tsx`
- `src/sections/WorkExperienceSection.tsx`
- `src/sections/ContactSection.tsx`
- `src/sections/ContactSection.test.tsx`
- `src/layout/Footer.tsx`

Not changed (checked, no change needed):
- `src/sections/HeroPortrait.tsx` (no real photo available yet)
- `src/sections/AboutSection.tsx` (not referenced by any owner-feedback item
  in this sub-project's scope; already alternates correctly as `bg-sage`)
- `src/config/contact.ts` (`CONTACT_EMAIL_DISPLAY` still used by
  out-of-scope `PrivacyPage.tsx` / `TermsPage.tsx`; `getContactEmailAddress`
  contract already sufficient)
- `src/hooks/useContactMailto.ts` (existing contract already sufficient)
- `src/hooks/useContactMailto.test.ts` (still accurate, unchanged)

## Handoff summary (changes another agent must make)

1. `src/components/ProjectCard.tsx` - bump the image's fixed height at
   `lg`/`xl` (see item 1 above) so images don't look squat in the new
   3-per-row grid.
2. `src/components/timeline/TimelineEntry.tsx` - add an internal max-width
   (e.g. `max-w-[42rem]`) to `entryBaseClasses` so timeline text stays
   readable now that the landing section's outer wrapper is full width (see
   item 3 above).
3. `src/pages/WorkExperiencePage.tsx` - remove the `max-w-[45rem]` wrapper
   (line 17) around the standalone page's `<Timeline>` so it matches the
   landing section's new full width.
4. (Optional) `src/lib/analytics.ts` - add `'email_click'` to
   `AnalyticsEventName` if dedicated GA reporting for the email button is
   wanted; current implementation tracks it under `'outbound_click'`
   instead, which is fully functional but less specific.

## Owner-only items

1. Supply a real portrait photo file (place under `public/`, e.g.
   `public/tejit-portrait.jpg`); then `Hero.tsx` needs a one-line change to
   pass `src="/tejit-portrait.jpg"` to `<HeroPortrait>`. Until then the
   placeholder "TP" monogram remains.
