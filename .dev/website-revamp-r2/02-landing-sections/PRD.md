# PRD — Round 2, Sub-project R2: Landing Sections (layout + copy)

**Project:** tejitpabari.com revision round 2
**Repo / branch:** `/root/projects/tejitpabari`, branch `website-revamp` (already checked out; do not switch)
**Round:** 2026-09-01, owner feedback round 2 (see `REVISION-BRIEF.md`)
**Owns:** `src/sections/*` — `Hero.tsx`, `HeroPortrait.tsx`, `AboutSection.tsx`, `ContactSection.tsx`,
`FeaturedProjectsSection.tsx`, `WorkExperienceSection.tsx` — and their tests only.
**Does NOT own (hard boundaries — cross-notes only, see §9):** `src/layout/*` (R1, including the
canonical sub-page container/padding convention), `src/content/**` / `src/config/featured.ts` (R3),
`src/components/*` / `src/data/*` (R4, including the `timeline/*` components this PRD's
`WorkExperienceSection` renders, and the Connect panel structure inside `ContactSection`), legal pages
(R5).
**Source of truth for facts:** `RESUME-EXTRACT.md`. No claim in the rewritten copy goes beyond what
that file (or the pre-existing, unchanged `src/content/research/*` collection, for the SMARTtest and
pill-identification callbacks) states.
**Prior planning referenced:** `.dev/website-revamp/03-landing-page-timeline/PRD.md` (round-1 design of
every section this PRD revises — quoted throughout §4 as "R1-P3"), `.dev/website-revamp/
07-content-migration-copy/PRD.md` (where the copy this PRD replaces was first drafted — quoted as
"R1-P7"), `.dev/website-revamp-r2/03-content-data/PRD.md` (this round's sibling, "R3" — the data this
round's `WorkExperienceSection` renders: 3 work-experience entries, landing timeline limit still 2, "See
all experience" now reachable for the first time; and `featuredProjects` now resolves to an
owner-pinned, explicit six-slug list — `juno, smarttest, med-doc-tracker, clip-verse,
columbia-virtual-campus, crunchy-filler` — a `FeaturedProjectsSection` rendering input change, not a
code change).
**R1's own PRD (`.dev/website-revamp-r2/01-shell-nav-chrome/PRD.md`) now exists and has been checked
against §4.1 below (orchestrator decision, 2026-09-01): the two PRDs already agree.** R1's
`PageContainer` component (R1 §4.8) encodes `mx-auto w-full max-w-content px-6 ... sm:px-8 md:px-10
lg:px-12` — the exact same bound and padding ramp §4.1 below defines for landing sections. R1's
`PageContainer` is canonical for sub-page routes; this PRD's landing sections use the same
`mx-auto w-full max-w-content` + `px-6 sm:px-8 md:px-10 lg:px-12` scale written out inline rather than
importing `PageContainer` directly, because landing sections are full-bleed colored bands (`Hero`,
`AboutSection`, etc. each own their own background color across the full viewport width) and cannot
adopt `PageContainer` as their outer element the way a sub-page's single content wrapper can. See §9.

---

## 1. Problem

Two unrelated complaints from the owner land on this sub-project, and they pull in opposite directions
if read too literally.

**1. Width inconsistency.** The owner: *"Why is projects so wide and other sections smaller in width.
Feels weird. Make them wider too."* Reading the actual code confirms the complaint is real, but not
uniform: `FeaturedProjectsSection` and `ContactSection` already size their content wrapper at
`max-w-content` (72rem/1152px); `Hero`'s outer grid is *also* already `max-w-content` (only its inner
text sub-column is capped narrower, by design, alongside the portrait). The two sections that are
genuinely narrower are `AboutSection` (`max-w-[640px]`, i.e. 40rem — less than *half* the width of
Projects/Contact) and `WorkExperienceSection` (`max-w-[720px]`, 45rem). Because every section otherwise
shares identical padding (`px-6 sm:px-8 md:px-10 lg:px-12`), the visible effect on a wide screen is
exactly what the owner describes: Projects' and Contact's content starts flush at the same left edge as
everything else and runs nearly edge-to-edge, while About and the landing Work Experience block sit
centered in a narrow column with large, obviously mismatched margins on both sides.

The complication: **"make them all as wide as Projects" cannot mean literally setting every text block
to 72rem.** About's body copy today reads at `text-[0.92rem]` (14.72px), regular weight. At a 40rem
(640px) column, that's roughly 640 / (0.5 × 14.72) ≈ **87 characters per line** — already near the top
of the commonly cited comfortable range (45–90 characters). Stretched to a literal 72rem (1152px), the
same text would run roughly **156 characters per line** — well past any readable measure, for a section
whose entire brief (R1-P3 §4.7) was "read like a person talking, not another card grid." The
work-experience timeline's body text is smaller still (`text-[0.82rem]`/`text-[0.86rem]`); stretched to
72rem it would run closer to **170 characters per line**. Both would be a straightforward typography
regression, not a fix.

**The resolution, stated in plain language for the owner:** the *section* — the bounding box that
determines where content starts and stops relative to Projects and Contact — is what becomes
consistently wide (72rem, matching every other section on the page). The *paragraph and timeline text
inside* About and Work Experience stays at a comfortable reading width (640px, unchanged from what
already shipped and was reviewed in round 1) — it just now sits flush against the same left edge as
Projects' own heading, instead of floating centered in the middle of a narrow box. This is the same
pattern `FeaturedProjectsSection` already uses for its own heading block today (a wide outer container,
a narrower inner block, left-aligned, not centered) — extended to the two sections that didn't have it.
The visible result: About and Work Experience's *left edges* now line up exactly with Projects' and
Contact's, closing the specific gap the owner is describing, while the actual sentences stay easy to
read. This is a deliberate partial version of "make it wider" — the container is fully as wide as
Projects; the prose inside it is not, on purpose, and §4.1/§4.2/§4.3 walk through why.

**2. Headlines that don't fit on one line.** `"Selected work, in health tech and beyond."` (41
characters) is capped by `max-w-[13ch]` in `FeaturedProjectsSection`; `"Where I've worked and what
I've built."` (38 characters) is capped by `max-w-[14ch]` in `WorkExperienceSection`. At a 13–14
character clamp applied at *every* breakpoint (including desktop, at up to 40px/2.5rem font), these
41–38 character strings wrap into three or four short lines regardless of viewport — clearly not the
intended "headline breaks after a deliberate word" look, and the direct cause of the owner's complaint.
The fix isn't just "remove the clamp": removing it naively and forcing `whitespace-nowrap` at the
current font sizes would overflow every viewport under roughly 900px wide. §4.5/§4.6 work the actual
numbers and land on a responsive design that is honest about where the one-line guarantee starts (640px
and up) rather than claiming something that would break on a real phone.

**3–5. Copy.** The current hero paragraph opens with Juno before mentioning the day job — exactly the
ordering the owner asked to reverse (*"No need for that first line - juno line"*). The About section
carries the AI-essay tics the owner flagged sitewide: three em dashes, and "Health tech isn't really a
pivot for me," a hedge-then-reveal construction that reads like generated copy. The Contact section
states outright that the owner may be hiring — locked decision 8 forbids any statement about hiring in
either direction, and the current copy is exactly that statement.

## 2. Goals

- Give `Hero`, `FeaturedProjectsSection`, `WorkExperienceSection`, `AboutSection`, and `ContactSection`
  one coherent width system: every section's content sits inside the same `max-w-content` (72rem)
  bounding box, left-aligned to the same edge; body text and timeline content inside that box keep a
  readable measure (640px) rather than stretching full width.
- Make `"Selected work, in health tech and beyond."` and `"Where I've worked and what I've built."`
  render on one line, with a stated, honest floor viewport width below which that guarantee holds (not
  a claim that holds at every possible screen size).
- Replace the Hero paragraph so it leads with the Microsoft/Fabric Maps role and treats health tech as
  the side pursuit, per the owner's verbatim instruction. The "Health Tech Builder" eyebrow label was
  reconsidered for consistency with that reordering; the owner reviewed the proposed change and
  rejected it — the eyebrow stays exactly as it is today (§4.4, §9).
- Rewrite the About section to read like a person, keeping every existing factual claim
  (Microsoft/Fabric Maps, Juno, the SMARTtest self-testing research, the pill-identification work),
  cross-checked against `RESUME-EXTRACT.md`.
- Rewrite the Contact paragraph around health tech and reaching out, with zero mention of hiring in
  either direction (locked decision 8), and hand off the panel's structural redesign to R4 with the copy
  it needs.
- Apply the round's voice rules (locked decision 7 + this round's specific bans: no "not X, but Y", no
  tricolon lists, no "passionate about", no sentence-initial "Whether") to every string this PRD touches.

## 3. Non-Goals

- Any change to `src/layout/*`, `src/components/*` (including `src/components/timeline/*`, which
  `WorkExperienceSection` renders via `<Timeline>` but does not own), `src/data/*`, `src/content/**`, or
  `src/config/featured.ts`. This PRD consumes `featuredProjects` and `workExperience` exactly as R3
  computes them; it changes no import, no data shape, no query.
- Redesigning the Connect panel's internal structure (email-as-button on the left, profile-only on the
  right) — that's R4's component work per SHARED-CONTEXT.md. This PRD supplies `ContactSection`'s prose
  copy only; §9 carries the cross-note to R4 with the exact copy R4 should drop into whatever structure
  it builds.
- Touching `WorkExperiencePage.tsx` (`/work-experience`'s own page, including its own `max-w-[720px]`
  container) — that file is R1-owned (page-level container/padding, per SHARED-CONTEXT.md). §9 flags
  that R1 may want to reconsider that page's width against this PRD's new convention, but this PRD does
  not touch it.
- Any change to `HeroPortrait.tsx`'s swap mechanism, sizing, or placeholder monogram — out of scope,
  untouched by either the owner's feedback or this PRD's goals.
- Drafting new project-card or research-abstract copy — unaffected by this round, R1-P7's scope, not
  R2's.
- A literal, uncapped one-line guarantee for the two headlines at every viewport down to 320px — §1/§4.6
  explain why that specific literal reading isn't deliverable without either an illegibly small font or
  horizontal overflow, and states the actual floor instead.

---

## 4. Architecture Decisions

### 4.1 The width system, defined once

**Convention (binding for this sub-project; R1 should match it for sub-page containers — §9):**

| Layer | Value | Used by |
|---|---|---|
| Section padding | `px-6 sm:px-8 md:px-10 lg:px-12` (already universal across all five sections — unchanged) | All five sections |
| Content container | `mx-auto w-full max-w-content` (72rem/1152px) | All five sections' outer content wrapper |
| Readable-measure inner block | `max-w-[640px]`, **no `mx-auto`** — left-aligned inside the wide container, not centered independently | About's prose, Work Experience's headline (mobile) + timeline column, Featured Projects' headline (mobile) |
| Multi-column layouts | Full container width, split via CSS grid | Hero (`grid-cols-[minmax(0,1fr)_minmax(0,0.55fr)]`), Contact (`grid-cols-[minmax(0,0.95fr)_minmax(260px,0.6fr)]`) |

This is not a new pattern invented for this PRD — it's `FeaturedProjectsSection`'s own existing shape
(`<div className="mx-auto w-full max-w-content">` outer, `<div className="max-w-[640px]">` inner,
un-centered) generalized to the two sections that didn't have it. The key move, stated plainly: **the
inner block loses its own `mx-auto`.** Today, About's `mx-auto max-w-[640px]` both narrows *and*
centers the content independently of the section's padding — that's what produces the "floating in the
middle with huge margins" look next to Projects' content, which starts flush at the section's own left
padding edge. Once the inner block is just `max-w-[640px]` with the *outer* wrapper carrying the
`mx-auto max-w-content`, the text naturally sits flush left, aligned with every other section's content,
still at a readable width.

**Hero and Contact are unaffected by this section — they're already conformant.** Hero's outer grid is
already `mx-auto w-full max-w-content`; its inner text sub-column (`max-w-[440px]`) and Contact's
two-column split (`max-w-[540px]` + a `260–460px` aside) are deliberate, pre-existing multi-column
layouts, not narrow single-column text blocks — they don't have the "centered in empty space" problem
About and Work Experience have, so §4.1's fix doesn't apply to them. This is explicitly not touched
further in this PRD; see §9 for why Hero's 440px column stays as-is rather than growing to 640px.

### 4.2 `AboutSection.tsx`

**Before:**

```tsx
export function AboutSection() {
  return (
    <section
      id="about"
      className="scroll-mt-24 bg-sage px-6 py-16 sm:px-8 sm:py-20 md:px-10 lg:px-12 lg:py-24"
    >
      <div className="mx-auto max-w-[640px] text-left">
        <h2 className="text-[1.75rem] font-extrabold leading-[0.97] tracking-tight text-ink sm:text-[2.15rem]">
          About
        </h2>
        <div className="mt-5 space-y-4 text-[0.92rem] leading-7 text-body">
          <p>I&rsquo;m a software engineer who ends up building things end to end &mdash; backend systems at Microsoft during the day, and a health-tech startup nights and weekends.</p>
          <p>At Microsoft, I&rsquo;m a Software Engineer II on the Fabric Maps team, where I work on the infrastructure and developer tools behind large-scale geospatial data.</p>
          <p>Outside of that, I&rsquo;m building Juno &mdash; an AI companion that helps patients walk into a doctor&rsquo;s appointment prepared, and walk out with a clear record of what was said and what to do next. It&rsquo;s early: I&rsquo;m validating the idea directly with patients and clinicians before scaling anything.</p>
          <p>Health tech isn&rsquo;t really a pivot for me &mdash; some of my first research, in college, was a self-testing app for HIV and syphilis and a pill-identification tool built from photos. Juno is the same instinct, aimed at a bigger problem.</p>
        </div>
      </div>
    </section>
  );
}
```

**After:**

```tsx
export function AboutSection() {
  return (
    <section
      id="about"
      className="scroll-mt-24 bg-sage px-6 py-16 sm:px-8 sm:py-20 md:px-10 lg:px-12 lg:py-24"
    >
      <div className="mx-auto w-full max-w-content">
        <div className="max-w-[640px] text-left">
          <h2 className="text-[1.75rem] font-extrabold leading-[0.97] tracking-tight text-ink sm:text-[2.15rem]">
            About
          </h2>
          <div className="mt-5 space-y-4 text-[0.92rem] leading-7 text-body">
            <p>I&rsquo;m a software engineer. I like building things end to end, from backend to frontend, on whatever stack the problem calls for.</p>
            <p>At Microsoft, I&rsquo;m a Software Engineer II on the Fabric Maps team. I work on the infrastructure behind how geospatial data gets visualized and analyzed in Microsoft Fabric and Power BI.</p>
            <p>On the side, I build in health tech. Right now that&rsquo;s Juno, an AI companion that helps patients walk into a doctor&rsquo;s appointment prepared and walk out with a clear record of what was said and what to do next. It&rsquo;s early. I&rsquo;m still validating the idea with patients and clinicians.</p>
            <p>This isn&rsquo;t new for me. In college, I worked on a self-testing app for HIV and syphilis and a tool that identifies pills from photos. Juno picks up that same thread, aimed at a bigger problem.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Full About copy, verbatim, ready to paste** (4 paragraphs, ~139 words total — within R1-P7's original
120–180 word budget, unchanged):

> I'm a software engineer. I like building things end to end, from backend to frontend, on whatever
> stack the problem calls for.
>
> At Microsoft, I'm a Software Engineer II on the Fabric Maps team. I work on the infrastructure behind
> how geospatial data gets visualized and analyzed in Microsoft Fabric and Power BI.
>
> On the side, I build in health tech. Right now that's Juno, an AI companion that helps patients walk
> into a doctor's appointment prepared and walk out with a clear record of what was said and what to do
> next. It's early. I'm still validating the idea with patients and clinicians.
>
> This isn't new for me. In college, I worked on a self-testing app for HIV and syphilis and a tool that
> identifies pills from photos. Juno picks up that same thread, aimed at a bigger problem.

**Fact-check against `RESUME-EXTRACT.md` / the unchanged research collection, line by line:**

- "Software Engineer II on the Fabric Maps team" — matches `RESUME-EXTRACT.md`'s current title (Level
  61, March 2024–Present) exactly.
- "geospatial data gets visualized and analyzed in Microsoft Fabric and Power BI" — near-verbatim from
  the résumé's own team-context line: "Fabric Maps enables visualization and analysis of geographical
  data in Microsoft Fabric and PowerBI." Tighter to the source than the previous "infrastructure and
  developer tools" framing, which wasn't traceable to any resume line.
- "a self-testing app for HIV and syphilis" — `RESUME-EXTRACT.md`: "SMARTest: Smartphone App to
  Facilitate HIV and Syphilis Self Testing, Result Interpretation and Care." Matches; this claim was
  already in the shipped copy and is unchanged in substance, only reworded.
- "a tool that identifies pills from photos" — not in `RESUME-EXTRACT.md` directly (the résumé's own
  research list only names the two published papers), but sourced from the pre-existing, unchanged
  `src/content/research/pill-recognition-prescription-extraction.md` (outside this round's or R3's
  scope) — the same claim the currently-shipped copy already makes, reworded only, not strengthened.
- Dropped: "Health tech isn't really a pivot for me" (the flagged AI-essay phrase) and all three em
  dashes. Nothing else was removed — every fact in the before-copy survives into the after-copy.

**Voice check:** no em dashes, no "not X, but Y" (the "This isn't new for me" opener is a plain
statement with no trailing "but" clause), no tricolon lists, no "passionate about", no sentence-initial
"Whether", short declarative sentences throughout ("It's early." / "I'm still validating the idea with
patients and clinicians." replace the old copy's single longer colon-joined sentence).

### 4.3 `ContactSection.tsx`

**Before (copy only — the panel JSX itself is R4's to redesign, not reproduced here beyond the one line
that changes):**

```tsx
<p className="mt-4 max-w-[28rem] text-[0.9rem] leading-6.5 text-body">
  Whether you&rsquo;re hiring, working on something in health tech, or want to
  talk through Juno with a clinician&rsquo;s or researcher&rsquo;s eye &mdash;
  I&rsquo;d like to hear from you.
</p>
```

**After:**

```tsx
<p className="mt-4 max-w-[28rem] text-[0.9rem] leading-6.5 text-body">
  I&rsquo;m always glad to hear from people working in health tech, especially
  if you want to talk through Juno from a clinical or research angle.
</p>
```

**Full Contact copy, verbatim, ready to paste:**

> **Heading (unchanged):** Get in Touch
> **Paragraph:** I'm always glad to hear from people working in health tech, especially if you want to
> talk through Juno from a clinical or research angle.

**Locked decision 8 check:** the word "hiring" and every synonym for it (looking for work, open to
opportunities, available, etc.) is fully absent — the paragraph is about health tech and being reachable,
nothing else. **Voice check:** no "Whether" opener (the exact construction the old copy used), no em
dash, one sentence, no tricolon.

**§9 cross-note to R4 (locked decision, not open):** R4 owns the Connect aside's structural rebuild —
"email should be a button" on the left, "right side should only be a profile." This PRD does not
specify that layout; it only guarantees the copy above (the heading and the one paragraph) is what R4
should render above the button/profile split. The "Email Me" button label and the "Profiles"/"GitHub"/
"LinkedIn" microcopy inside the aside are unaffected by this PRD's copy pass — they contain no hiring
language and no AI-essay tics already, so R4 is free to reuse them verbatim inside whatever new
structure it builds, or restate them; neither is this PRD's call.

### 4.4 `Hero.tsx`

**Before:**

```tsx
<p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-teal-secondary sm:text-[0.74rem]">
  Health Tech Builder
</p>

<h1 className="max-w-[10ch] text-[2.1rem] font-extrabold leading-[0.95] tracking-tight text-ink sm:text-[2.6rem] lg:text-[3rem]">
  Hi, I&rsquo;m Tejit.
</h1>

<p className="mt-5 max-w-[32rem] text-[0.94rem] leading-7 text-body">
  I&rsquo;m building Juno, an AI companion that helps patients get more out of every medical
  appointment &mdash; while working full-time as a Software Engineer II on Microsoft&rsquo;s Fabric
  Maps team. Health tech is where most of my energy outside of work goes, and where I&rsquo;m headed
  next.
</p>
```

**After:**

```tsx
<p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-teal-secondary sm:text-[0.74rem]">
  Health Tech Builder
</p>

<h1 className="max-w-[10ch] text-[2.1rem] font-extrabold leading-[0.95] tracking-tight text-ink sm:text-[2.6rem] lg:text-[3rem]">
  Hi, I&rsquo;m Tejit.
</h1>

<p className="mt-5 max-w-[32rem] text-[0.94rem] leading-7 text-body">
  I&rsquo;m a full-time Software Engineer II at Microsoft, on the Fabric Maps team. On the side, I
  build in health tech. Right now that means Juno, an AI companion that helps patients get more out of
  every medical appointment.
</p>
```

**Full Hero copy, verbatim, ready to paste:**

> **Eyebrow (unchanged, owner-confirmed):** Health Tech Builder
> **Greeting (unchanged):** Hi, I'm Tejit.
> **Paragraph:** I'm a full-time Software Engineer II at Microsoft, on the Fabric Maps team. On the
> side, I build in health tech. Right now that means Juno, an AI companion that helps patients get more
> out of every medical appointment.

39 words, three short sentences — within R1-P7's original 35–55 word budget. Matches the owner's
verbatim instruction structurally: leads with "full-time Software Engineer II," treats health tech as
"on the side," names Juno only in the third sentence as the concrete example of that side work, never
as the opening line.

**Eyebrow label — kept exactly as it is today, per owner decision (2026-09-01).** A change to
"Software Engineer" was considered and proposed in an earlier draft of this PRD, reasoned from a
tension with the paragraph's new Microsoft-first lead ("Health Tech Builder" as the first thing a
visitor reads, immediately followed by a paragraph that leads with the Microsoft role). **The owner
reviewed this proposal directly and rejected it** — the eyebrow stays "Health Tech Builder", no code
change to that line. `Hero.tsx`'s eyebrow `<p>` is therefore unchanged between before/after; only the
greeting/paragraph text below it changes, per the diff above.

**Voice check:** no em dash (the old paragraph's one `&mdash;` is gone along with the sentence it was
in), no "not X, but Y", no tricolon, no "passionate about," no sentence-initial "Whether," three short
declarative sentences replacing the old two longer ones.

### 4.5 `FeaturedProjectsSection.tsx` — headline width + one-line fix

**Before:**

```tsx
<div className="mx-auto w-full max-w-content">
  <div className="max-w-[640px]">
    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-teal-secondary">
      Projects
    </p>
    <h2 className="mt-4 max-w-[13ch] text-[2rem] font-extrabold leading-[0.96] tracking-tight text-ink sm:text-[2.5rem]">
      Selected work, in health tech and beyond.
    </h2>
  </div>
  ...
</div>
```

**After:**

```tsx
<div className="mx-auto w-full max-w-content">
  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-teal-secondary">
    Projects
  </p>
  <h2 className="mt-4 max-w-[22ch] text-balance text-[1.7rem] font-extrabold leading-[1.1] tracking-tight text-ink sm:max-w-none sm:whitespace-nowrap sm:text-[clamp(1.4rem,3.2vw,2.5rem)] sm:leading-[0.96]">
    Selected work, in health tech and beyond.
  </h2>
  ...
</div>
```

The `<div className="max-w-[640px]">` wrapper around the eyebrow+headline pair is removed — it's no
longer needed once the headline manages its own width directly (below), and the short eyebrow label
never approached 640px in the first place.

### 4.6 `WorkExperienceSection.tsx` — headline + Timeline width, one-line fix

**Before:**

```tsx
<div className="mx-auto w-full max-w-[720px]">
  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-teal-secondary">
    Work Experience
  </p>
  <h2 className="mt-4 max-w-[14ch] text-[2rem] font-extrabold leading-[0.96] tracking-tight text-ink sm:text-[2.4rem]">
    Where I&rsquo;ve worked and what I&rsquo;ve built.
  </h2>
  <div className="mt-8 lg:mt-10">
    <Timeline entries={entries} showSeeAll={hasMore} />
  </div>
</div>
```

**After:**

```tsx
<div className="mx-auto w-full max-w-content">
  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-teal-secondary">
    Work Experience
  </p>
  <h2 className="mt-4 max-w-[22ch] text-balance text-[1.7rem] font-extrabold leading-[1.1] tracking-tight text-ink sm:max-w-none sm:whitespace-nowrap sm:text-[clamp(1.4rem,3.2vw,2.5rem)] sm:leading-[0.96]">
    Where I&rsquo;ve worked and what I&rsquo;ve built.
  </h2>
  <div className="mt-8 max-w-[640px] lg:mt-10">
    <Timeline entries={entries} showSeeAll={hasMore} />
  </div>
</div>
```

Two changes: the outer container widens from a bespoke `720px` to the shared `max-w-content` (§4.1), and
the `<Timeline>` itself is now wrapped in its own `max-w-[640px]` div so each entry's body text (already
sized smaller than About's, `text-[0.82rem]`/`text-[0.86rem]`) doesn't stretch to full container width —
the same "wide container, readable inner column" split applied to timeline content instead of prose.

**The headline class string is identical between §4.5 and §4.6, deliberately** — see below for why one
design covers both.

### 4.7 The one-line headline mechanism, worked in full

**The literal request can't be met at every viewport, and the previous design's opposite failure mode
(wrapping into 3–4 lines even on desktop) shows why a naive fix is worse than no fix.** The clamp needed
solving for two things at once: (a) guarantee no wrap from *some* stated viewport up, honestly, and (b)
not silently overflow or force horizontal scroll below that viewport.

**Approach:** `whitespace-nowrap` plus a fluid `clamp()` font-size, active only from Tailwind's `sm`
breakpoint (640px) up; below `sm`, wrapping stays allowed, at a larger max-width (`22ch`, not the old
`13`/`14ch`) so the string breaks into a clean two-line wrap instead of the old design's three-to-four
line wrap, with `text-balance` (native in Tailwind 3.4+, confirmed the installed version via
`package.json`: `"tailwindcss": "^3.4.19"`) so the browser picks a balanced break point instead of an
arbitrary one.

**The math, worked for the longer of the two strings** (`"Selected work, in health tech and beyond."`,
41 characters including spaces/punctuation — the binding case; the Work Experience headline at 38
characters gets more headroom for free from the same class string):

- **Assumption, stated explicitly:** average glyph width for Montserrat ExtraBold ≈ 0.58em — a standard
  estimate for a bold/extrabold sans typeface (regular-weight sans typically runs ~0.5em; bold weights
  run wider). This is an estimate, not a measured value — flagged as an implementation-verification item
  in §9, not presented as exact.
- Required text width at font-size *f*: `41 × 0.58 × f ≈ 23.78f`.
- **At the `sm` breakpoint (640px viewport):** available width = `640 − 2×32` (`sm:px-8`) = **576px**.
  Solving `23.78f ≤ 576` gives `f ≤ 24.2px` (≈1.51rem). The design's `clamp()` floor is set to **1.4rem
  (22.4px)**, giving `23.78 × 22.4 ≈ 533px` required against 576px available — **~43px (7.5%) of
  headroom**, intentionally kept below the razor's edge given the glyph-width estimate above isn't a
  measured value.
- **At the point the `clamp()` reaches its ceiling (2.5rem/40px):** `3.2vw = 40px → viewport ≈ 1250px`.
  At that viewport, `lg:px-12` padding leaves `1152 − 96 = 1056px` available inside the `max-w-content`
  container (the container itself caps at 1152px, so viewport padding beyond that doesn't shrink
  available width further); required width `23.78 × 40 ≈ 951px` — **~105px of headroom.**
- **Checked at two intermediate points for the tightest gap:** 768px viewport (`md:px-10` = 80px total
  padding, 688px available; `3.2vw ≈ 24.6px` required font, `23.78 × 24.6 ≈ 585px` required — 103px
  headroom) and 1024px viewport (`lg:px-12`, 96px padding, 928px available; `3.2vw ≈ 32.8px`,
  `23.78 × 32.8 ≈ 780px` required — 148px headroom). The tightest point in the entire range is exactly
  at the 640px floor (7.5% headroom); everywhere above it, headroom only grows.

**Resulting class, used identically on both headlines** (§4.5, §4.6):

```
mt-4 max-w-[22ch] text-balance text-[1.7rem] font-extrabold leading-[1.1] tracking-tight text-ink
sm:max-w-none sm:whitespace-nowrap sm:text-[clamp(1.4rem,3.2vw,2.5rem)] sm:leading-[0.96]
```

**The one-line guarantee holds at viewport width ≥ 640px (Tailwind's `sm` breakpoint) and up, with
roughly 7.5% width headroom at that floor, growing at every larger breakpoint checked.** Below 640px
(mobile phones, 320–639px), the headline wraps to two lines by design — `max-w-[22ch]` and
`text-balance` are chosen specifically so that wrap looks like a deliberate two-line break, not the old
design's three-to-four-line stack. This is the honest answer the task asked for, not a claim that holds
at 375px: at the old design's font sizes (up to 40px) and a 41-character string, one line literally
requires ~950px of contiguous horizontal space, which does not exist on a phone.

**Why the two headlines share one class string instead of each getting independently tuned values:**
using the longer string's (Projects, 41 chars) requirement as the shared floor gives the shorter string
(Work Experience, 38 chars) extra headroom "for free" (`22.04f` required vs. `23.78f` — margin grows,
never shrinks), and a single shared value is simpler to maintain and visually more consistent (both
headlines now render at the identical size across breakpoints, versus the old design's slightly
mismatched `2.5rem`/`2.4rem` sm-breakpoint values). This is a deliberate simplification, not an
oversight — noted `[RESOLVED]` in §9.

---

## 5. API Change Summary

N/A — static, prerendered site, no runtime API. This PRD changes only Tailwind class strings and JSX
text content inside six existing files; no new component, hook, or data shape is introduced.

---

## 6. Frontend Change Summary

| File | Change |
|---|---|
| `src/sections/Hero.tsx` | Eyebrow text unchanged (`"Health Tech Builder"` stays — owner rejected the proposed "Software Engineer" swap, §9 `[RESOLVED]`). Paragraph fully rewritten, drops the Juno-first opening, leads with Microsoft/Fabric Maps. No width/class change — Hero's outer container was already `max-w-content`. |
| `src/sections/HeroPortrait.tsx` | No change. |
| `src/sections/AboutSection.tsx` | Outer wrapper restructured: `mx-auto max-w-[640px]` → `mx-auto w-full max-w-content` (outer) + `max-w-[640px]` (inner, un-centered). Four paragraphs fully rewritten: 3 em dashes removed, "Health tech isn't really a pivot for me" removed, every existing factual claim retained. |
| `src/sections/ContactSection.tsx` | Paragraph copy only: hiring statement removed (locked decision 8), sentence-initial "Whether" and one em dash removed. Panel structure (email button / profile-only right column) is explicitly NOT changed here — R4's scope, §9 cross-note. |
| `src/sections/FeaturedProjectsSection.tsx` | Headline width/wrap mechanism replaced (`max-w-[13ch]` at all breakpoints → responsive `22ch`-wrap-below-640px / `nowrap`-with-`clamp()`-at-640px-and-up). Redundant `max-w-[640px]` eyebrow/headline wrapper div removed (no longer needed). Headline text unchanged. |
| `src/sections/WorkExperienceSection.tsx` | Outer container `max-w-[720px]` → `max-w-content`; `<Timeline>` wrapped in a new `max-w-[640px]` div to keep entry body text at a readable measure. Headline width/wrap mechanism replaced identically to Featured Projects (§4.7). Headline text unchanged. `computeLandingTimelineState`/`LANDING_TIMELINE_LIMIT` logic itself is unchanged — already generic over entry count, requires no edit for R3's 3-entry content. |

---

## 7. Testing

**Tests grepped for hardcoded assertions on the copy/classes this PRD changes — confirmed zero hits,
nothing breaks:**

- `src/sections/ContactSection.test.tsx` — asserts only on `CONTACT_EMAIL_DISPLAY` (from
  `@/config/contact`, untouched) and on the `"Email Me"` link's `href`/label. Contains no assertion on
  the paragraph text this PRD rewrites. **Passes unedited.**
- `src/sections/WorkExperienceSection.test.ts` — asserts only on `computeLandingTimelineState`'s return
  shape (`entries`/`hasMore`) against synthetic fixture entries built by a local `entry()` helper; no
  assertion on headline text, className, or container width. **Passes unedited.**
- `src/pages/HomePage.test.tsx` — asserts only on the number and `id` order of `<section>` elements
  (`['', 'projects', 'work-experience', 'about', 'contact']`); no copy or width assertion. **Passes
  unedited.**
- Repo-wide grep for the literal strings being replaced (`"Selected work"`, `"Where I've worked"`,
  `"building Juno"`, `"Health Tech Builder"`, `"Get in Touch"`... paired with `"hiring"`, and every
  `max-w-[13ch]`/`max-w-[14ch]`/`max-w-[640px]`/`max-w-[720px]`/`max-w-[440px]` class value) across
  every `*.test.*` file in the repo returns **zero hits** outside the two files above. No test anywhere
  else needs editing for this PRD to land clean.

**Real gap this PRD must close — the newly-reachable "See all experience" affordance (flagged by R3,
§9's cross-note there; this PRD claims ownership of the test, stated plainly below).** With R3's 3-entry
`workExperience` content, `WorkExperienceSection`'s `hasMore` (`workExperience.length >
LANDING_TIMELINE_LIMIT`, i.e. `3 > 2`) is `true` for the first time the landing page has ever rendered
— `Timeline`'s `TimelineSeeAllStub` mounts on `/` for the first time. R3's own PRD traced this
end-to-end by reading code; nothing has rendered it and asserted on the result yet. **This test belongs
to R2**, added to `src/sections/WorkExperienceSection.test.ts` (the file R2 already owns and already
tests this exact component's landing behavior) rather than `src/pages/HomePage.test.tsx` — it is
specifically about `WorkExperienceSection`'s own rendering decision (which entries show, whether the
stub appears), not about `HomePage`'s composition, which is already covered by the existing smoke test.

```ts
// New test, src/sections/WorkExperienceSection.test.ts — add alongside the
// existing computeLandingTimelineState suite; needs render/screen/MemoryRouter
// imports this file doesn't currently have.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WorkExperienceSection } from './WorkExperienceSection';
import { workExperience } from '@/data';

describe('WorkExperienceSection (real content)', () => {
  it('renders exactly LANDING_TIMELINE_LIMIT entries plus a "See all experience" link, now that real content exceeds the limit', () => {
    // Sanity check on the R3 precondition this test exists to exercise — if
    // this ever goes false again (content drops back to 2 entries), the
    // second assertion below should also flip, not silently stay green.
    expect(workExperience.length).toBeGreaterThan(LANDING_TIMELINE_LIMIT);

    render(
      <MemoryRouter>
        <WorkExperienceSection />
      </MemoryRouter>,
    );

    // LANDING_TIMELINE_LIMIT real entries + 1 stub = 3 listitems.
    expect(screen.getAllByRole('listitem')).toHaveLength(LANDING_TIMELINE_LIMIT + 1);
    expect(screen.getByRole('link', { name: /see all experience/i })).toHaveAttribute(
      'href',
      '/work-experience',
    );
  });
});
```

**Manual QA additions (extends R1-P3's own checklist, run once the site is live):**

1. At exactly 640px viewport width, confirm both `"Selected work, in health tech and beyond."` and
   `"Where I've worked and what I've built."` render on one line with no visible overflow or horizontal
   scrollbar — this is the tightest point in §4.7's math (~7.5% headroom by estimate, not measurement).
   If it clips, nudge the `clamp()` floor down by 1–2px and re-check; the estimate in §4.7 is exactly
   this and flagged as needing real-browser confirmation.
2. Below 640px (e.g. 375px, 320px), confirm both headlines wrap to a readable two-line break, not three
   or four lines, and don't overflow horizontally.
3. Confirm About's and Work Experience's content now starts at the same left edge as Projects' and
   Contact's content, at a wide viewport (≥1280px) — this is the literal visual fix for the owner's
   original complaint; a side-by-side screenshot is the fastest way to confirm it actually reads as
   fixed, not just correct by class-name inspection.
4. **The newly-reachable "See all experience" stub** — R3's own PRD flagged that this has only ever been
   verified by code tracing, never by looking at it. Load `/` post-deploy and visually confirm the stub
   renders directly after the second (Software Engineer, not Present-role) timeline entry with no visual
   gap or double border, and that it reads correctly now that there's a real third entry behind it.

**Not worth building here:** visual regression tooling for the `clamp()` font-size curve (no prior
visual baseline exists to protect, and the manual check above is cheap and specific); a unit test
asserting on Tailwind class strings directly (brittle, low-value — the manual QA checklist item 1 is the
real check for whether the design holds).

---

## 8. Manual Intervention Required From You

1. **Read and approve every rewritten copy block** — the Hero paragraph, the About section (4
   paragraphs), and the Contact paragraph, all reproduced in full in §4.2/§4.3/§4.4. This copy is about
   you personally; it must not ship on an agent's say-so. In particular: confirm the About section's
   framing of Juno ("It's early. I'm still validating the idea with patients and clinicians") still
   matches where things actually stand.
2. ~~Confirm or reject the proposed eyebrow-label change~~ — **resolved.** The owner reviewed the
   proposed "Health Tech Builder" → "Software Engineer" swap and rejected it; the eyebrow stays
   exactly as it is today (§4.4). No longer owner-blocked.
3. **Spot-check the one-line headline guarantee in a real browser at 640px width** — moved to R6's own
   verification gate (`06-voice-sweep-and-ship/PRD.md` §7), which runs after this PRD's code lands; not
   a separate action for you to take here. The floor viewport and font-size numbers in this PRD are
   computed from an estimated average-glyph-width for Montserrat ExtraBold, not a measurement — if it
   clips at exactly 640px, the fix is a 1–2px adjustment to the `clamp()` floor, not a redesign.
4. Nothing else in this sub-project is owner-blocked. Every width/copy change here is specified
   precisely enough to implement without further input, contingent on item 1 above.

---

## 9. Open Questions & Decisions

- `[RESOLVED: width system — every landing section's outer content wrapper is mx-auto w-full
  max-w-content; readable-measure inner blocks are max-w-[640px] with no independent mx-auto, so they
  sit flush-left inside the wide container instead of centered]` — §4.1. Generalizes
  `FeaturedProjectsSection`'s own pre-existing pattern to `AboutSection` and `WorkExperienceSection`.
- `[RESOLVED: Hero's inner text sub-column (max-w-[440px]) and Contact's two-column split are NOT
  widened to match the 640px convention]` — both are pre-existing, deliberate multi-column layouts, not
  narrow single-column text blocks; they don't have the "centered in dead space" problem §4.1 fixes.
  Widening Hero's text column specifically risks colliding with the portrait column or forcing the hero
  paragraph past its 35–55 word budget for no visual gain. §4.1, §4.4.
- `[RESOLVED: container convention vs. R1]` — orchestrator decision (2026-09-01): the two PRDs already
  agree on `max-w-content` (72rem) + `px-6 sm:px-8 md:px-10 lg:px-12`. R1's `PageContainer` component
  (R1 PRD §4.8) is canonical for sub-page routes; this PRD's landing sections use the identical scale
  written inline (landing sections are full-bleed colored bands, so they can't adopt `PageContainer`
  directly as their outer element). See the header note above.
- `[RESOLVED: WorkExperiencePage.tsx's own inner container]` — orchestrator decision (2026-09-01): R1
  keeps a reading-width inner wrapper there (R1 PRD §4.9's `max-w-[45rem]` inside a `max-w-content`
  outer `PageContainer`) — the same "wide outer bound, readable-measure inner block" pattern §4.1
  establishes for the landing page's own `AboutSection`/`WorkExperienceSection`. Not an inconsistency;
  no further change needed on either side.
- `[RESOLVED: the two landing headlines share one identical clamp()/nowrap class string, sized to the
  longer (Projects, 41-char) string's requirement]` — §4.7. Gives the shorter Work Experience headline
  extra headroom "for free" and unifies both headlines' rendered size across breakpoints, a deliberate
  simplification over the old design's mismatched 2.5rem/2.4rem values.
- `[RESOLVED: the one-line headline floor (640px viewport, ~7.5% headroom, estimated 0.58em average
  glyph width for Montserrat ExtraBold) implements exactly as designed]` — orchestrator decision
  (2026-09-01): the estimate is verified in a real browser during R6's verification gate (R6 PRD §7
  now carries this as an explicit named check), not redesigned here. If the headline wraps at 640px,
  the fix is a small `clamp()` floor adjustment, made in R6's own sweep — not a reason to reopen this
  PRD's design. §4.7, §7 manual QA item 1.
- `[RESOLVED: the "Health Tech Builder" eyebrow label is kept exactly as it is today]` — owner decision
  (2026-09-01): the proposed swap to "Software Engineer" is rejected. §4.4.
- `[RESOLVED: Contact's copy has zero hiring-related language in either direction, per locked decision
  8]` — §4.3. Checked for both "yes I'm hiring/available" and "no I'm not looking" framings; neither
  appears.
- `[RESOLVED: the "See all experience" test belongs to R2, added to
  src/sections/WorkExperienceSection.test.ts]` — §7, resolving the ownership question R3's PRD raised
  and left open (it offered `HomePage.test.tsx` or `WorkExperienceSection.test.ts` as options). Landed
  on `WorkExperienceSection.test.ts` since the behavior under test — which entries render, whether the
  stub appears — is specifically this component's own logic, which R2 owns.
- `[DEFERRED: cross-note to R4 — ContactSection's Connect-panel copy (§4.3) is final; the panel's
  structural rebuild (email as button, right side profile-only) is R4's component work, not designed
  here]` — §4.3. R4 can consume the heading/paragraph above verbatim regardless of what panel structure
  it builds around them.
- `[DEFERRED: cross-note to R3 — no code change needed here for R3's featuredProjects list]` — owner
  decision (2026-09-01): `FEATURED_PROJECT_SLUGS` is now an explicit, pinned six-slug list (`juno,
  smarttest, med-doc-tracker, clip-verse, columbia-virtual-campus, crunchy-filler`), not a backfilled
  one — see R3 PRD §4.2/§9 (superseding the earlier-computed `... clip-verse, creator-onboarding-tool,
  qgis-plugin-azure-maps-creator` result, which no longer applies). `FeaturedProjectsSection.tsx`
  renders whatever `featuredProjects` resolves to with zero changes required by this PRD; only the
  section's width/headline mechanism changes, not its data consumption. `columbia-virtual-campus` and
  `crunchy-filler` now stay on the landing page; `creator-onboarding-tool` and
  `qgis-plugin-azure-maps-creator` do not (they remain reachable at `/projects`, just not featured).
