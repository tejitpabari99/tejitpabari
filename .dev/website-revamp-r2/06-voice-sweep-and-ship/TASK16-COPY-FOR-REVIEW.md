# Task 16 — Manual QA: every copy block this round rewrote

**Status: prepared for the owner, not run.** Per PRD §8 item 1 and TASKS.md "Summary of what
requires you" item 3, every rewritten copy block is about the owner personally and should not ship
on an agent's say-so alone. This is the consolidated list an agent cannot approve on its own behalf —
read each block below against the live/preview site and confirm it reads naturally and says what you
mean. Grouped by sub-project, file paths given as-of the current `website-revamp` tree.

## R2 — landing sections (already committed, for your read-through here since PRD §8 groups it with R6's own copy)

**`src/sections/Hero.tsx`** — eyebrow + paragraph:
> Health Tech Builder
>
> I'm a full-time Software Engineer II at Microsoft, on the Fabric Maps team. On the side, I build in
> health tech. Right now that means Juno, an AI companion that helps patients get more out of every
> medical appointment.

**`src/sections/AboutSection.tsx`** — four paragraphs:
> I'm a software engineer. I like building things end to end, from backend to frontend, on whatever
> stack the problem calls for.
>
> At Microsoft, I'm a Software Engineer II on the Fabric Maps team. I work on the infrastructure
> behind how geospatial data gets visualized and analyzed in Microsoft Fabric and Power BI.
>
> On the side, I build in health tech. Right now that's Juno, an AI companion that helps patients walk
> into a doctor's appointment prepared and walk out with a clear record of what was said and what to
> do next.
>
> This isn't new for me. In college, I worked on a self-testing app for HIV and syphilis and a tool
> that identifies pills from photos. Juno picks up that same thread, aimed at a bigger problem.

**`src/sections/ContactSection.tsx`** — heading + paragraph (no hiring statement, per locked decision 8):
> Get in Touch
>
> I'm always glad to hear from people working in health tech, especially if you want to talk through
> Juno from a clinical or research angle.

## R6 — this sub-project's own rewrites (Tasks 2-8)

**`index.html`** — `<title>` and meta description:
> Tejit Pabari: Health-Tech Builder
>
> Tejit Pabari is a software engineer and founder building health-tech products, including Juno, an
> AI companion for medical appointments.

**`src/config/site.ts`** — `DEFAULT_DESCRIPTION`:
> Health-tech builder and software engineer. Building Juno, an AI companion for medical appointments,
> while working full-time on Microsoft Fabric Maps.

**`src/pages/NotFoundPage.tsx`** — `RouteMeta description`:
> That page doesn't exist. Head back to the homepage.

**`src/content/projects/juno.md`** — frontmatter description:
> An AI companion for medical appointments: live note-taking, real-time question prompts, and a clear
> summary of what to do next. Built with neurologists and researchers, and validated with 200+
> patients and 30+ doctors so far.

Body, paragraph 1:
> Juno helps patients get more out of every doctor's visit. During an appointment, it takes structured
> notes in real time and prompts context-aware questions a patient might not think to ask in the
> moment. It turns the conversation into a clear summary with concrete follow-ups, instead of a page
> of hurried handwriting.

Body, paragraph 3:
> So far: 200+ patients surveyed, 30+ doctors consulted, and 70 patients on the beta waitlist. Juno is
> still pre-launch: the current focus is validating the clinical workflow before scaling it.

**`src/content/projects/smarttest.md`** — frontmatter description:
> A smartphone app that makes HIV and syphilis self-testing more accessible. It walks users through
> the test, helps interpret results, and links them to follow-up care. Downloaded 1,000+ times.

Body, paragraph 1:
> SMARTtest is a smartphone app that makes HIV and syphilis self-testing more accessible. It walks a
> user through the test itself, helps interpret the result, and links them to follow-up care, all from
> a phone. Built with React Native and Firebase, with Twilio and SendGrid handling secure
> result-sharing, and deployed and tested through Expo.

Body, paragraph 2:
> The app has been downloaded 1,000+ times and received national news coverage. The underlying
> research was published in the journal *AIDS and Behavior* (one of the earliest projects that
> pointed me toward health tech, years before Juno).

**`src/content/projects/med-doc-tracker.md`** — frontmatter description (file has no body):
> A personal tool for storing, organizing, and searching all your medical documents in one place.
> Built to make the fragmented world of medical records simpler to navigate.

**`src/content/research/flood-event-extraction-bangladesh.md`** — frontmatter description (file has
no body):
> Built a BERT-based classifier to extract flood events from 40,000+ tagged Bangladeshi news articles,
> then used the resulting time-series (validated against Sentinel satellite data) to help the
> Bangladesh government develop a flood-index insurance product. Presented at AGU; published as a
> pre-print.

## R5 — legal pages (separately flagged, PRD §8 item 6 / TASKS.md item 2 — full read-through, not just a copy check)

`src/pages/PrivacyPage.tsx` and `src/pages/TermsPage.tsx` are rewritten in full, including a
substantive correction (the narrowed "no sale or sharing of data" claim) that is more than a voice
change. Not reproduced here — read both pages directly (via `npm run preview` or the preview-channel
URL once Task 18 runs), in full, before this ships.

## How to review

1. `npm run build && npm run preview` (or wait for Task 18's preview-channel URL).
2. Open `/`, a project detail page for `juno`/`smarttest`/`med-doc-tracker`,
   `/research/flood-event-extraction-bangladesh`, `/404`, `/privacy`, and `/terms`.
3. Read every block above in its real, rendered context — confirm it reads the way you'd actually
   say it, and that nothing above changed a fact, number, or claim you didn't intend.
4. If anything reads wrong: it's a one-line fix in the cited file, following the same
   never-a-mechanical-comma-swap rewrite policy the rest of this round used (PRD §4.4).
