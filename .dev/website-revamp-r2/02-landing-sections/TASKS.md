# Tasks: Landing Sections

Source of truth: `/root/projects/tejitpabari/.dev/website-revamp-r2/02-landing-sections/PRD.md`. Every task below cites the PRD §4 subsection it implements. This sub-project owns `src/sections/*` — `Hero.tsx`, `HeroPortrait.tsx` (untouched this round), `AboutSection.tsx`, `ContactSection.tsx`, `FeaturedProjectsSection.tsx`, `WorkExperienceSection.tsx` — and their tests only. It does **not** touch `src/layout/*` (R1), `src/content/**`/`src/config/featured.ts` (R3), or `src/components/*`/`src/data/*` (R4) — with one named exception: `ContactSection.tsx`'s Connect-aside markup is R4's design (`04-component-polish/PRD.md` §9 item 12), but the file itself is R2-owned, so Task 3 below implements R4's handed-off diff verbatim rather than waiting on R4 to land it.

**Repo state assumption — this is a Phase 2 sub-project (per `../README.md`) and its tasks are written against the tree R1 (`01-shell-nav-chrome`) and R3 (`03-content-data`) leave behind, not against today's tree.** Concretely, by the time Task 1 below starts: `src/layout/PageContainer.tsx` exists and sub-page routes use it (irrelevant to this file set, noted only for context); `src/content/work-experience/` holds exactly three files (`microsoft-fabric-maps-swe-ii.md`, `microsoft-fabric-maps-swe.md`, `jio-reliance-industries.md`) so `workExperience` (sorted descending by `startDate`) is `[Software Engineer II, Software Engineer, Jio]`, length 3; `src/config/featured.ts`'s `FEATURED_PROJECT_SLUGS` is the pinned six-slug list (`juno`, `smarttest`, `med-doc-tracker`, `clip-verse`, `columbia-virtual-campus`, `crunchy-filler`); `sample-project` is gone. This sub-project's own five source files (`Hero.tsx`, `AboutSection.tsx`, `ContactSection.tsx`, `FeaturedProjectsSection.tsx`, `WorkExperienceSection.tsx`) are otherwise exactly as they ship today — verified directly against the live tree while drafting these tasks, and every "Before" block below is quoted from that live read, not reconstructed from the PRD's own prose.

**R4 (`04-component-polish`) runs in parallel with this sub-project (both Phase 2) and does not need to land first** — Task 3 below reproduces R4's already-designed `ContactSection.tsx` diff directly (R4 PRD §9 item 12), so there is no ordering dependency either way. R4 does not touch any file this sub-project owns.

**Test command note:** `npm test` runs `vitest run` (the full suite). A single file can be run directly, e.g. `npx vitest run src/sections/ContactSection.test.tsx`.

**Voice/em-dash check, done once here rather than per task:** every rewritten copy block below (Hero paragraph, About's four paragraphs, Contact's paragraph) was checked character-by-character against the PRD's §4.2/§4.3/§4.4 "Full copy, verbatim" blocks for a literal `—`, `&mdash;`, or `&#8212;` — **zero found in any of them.** The only em dashes anywhere in the PRD file live in its own explanatory prose (not user-visible copy) and inside "Before" code blocks quoting the *old* copy being replaced, which is expected and correctly left alone.

---

### Task 1 — `Hero.tsx`: paragraph rewrite (eyebrow unchanged)
   - Files: `src/sections/Hero.tsx`
   - Changes: Per PRD §4.4. Only the paragraph inside the text column changes. The eyebrow (`Health Tech Builder`) and the greeting (`Hi, I'm Tejit.`) are byte-for-byte unchanged — the owner reviewed and rejected a proposed eyebrow swap to "Software Engineer" (PRD §9 `[RESOLVED]`); do not touch that line. No width/class change anywhere else in the file — Hero's outer container is already `max-w-content` and is not touched by this sub-project (PRD §9, Hero has no "centered in dead space" problem).

     Before (current file, paragraph block only):
     ```tsx
     <p className="mt-5 max-w-[32rem] text-[0.94rem] leading-7 text-body">
       I&rsquo;m building Juno, an AI companion that helps patients get more out of every medical
       appointment &mdash; while working full-time as a Software Engineer II on Microsoft&rsquo;s Fabric
       Maps team. Health tech is where most of my energy outside of work goes, and where I&rsquo;m headed
       next.
     </p>
     ```

     After:
     ```tsx
     <p className="mt-5 max-w-[32rem] text-[0.94rem] leading-7 text-body">
       I&rsquo;m a full-time Software Engineer II at Microsoft, on the Fabric Maps team. On the
       side, I build in health tech. Right now that means Juno, an AI companion that helps patients get
       more out of every medical appointment.
     </p>
     ```

     **Full Hero copy, verbatim, ready to paste (for reference — the diff above is the actual edit):**

     > **Eyebrow (unchanged):** Health Tech Builder
     > **Greeting (unchanged):** Hi, I'm Tejit.
     > **Paragraph:** I'm a full-time Software Engineer II at Microsoft, on the Fabric Maps team. On the
     > side, I build in health tech. Right now that means Juno, an AI companion that helps patients get more
     > out of every medical appointment.

   - Acceptance criteria:
     1. `grep -c "I&rsquo;m a full-time Software Engineer II at Microsoft" src/sections/Hero.tsx` → `1`.
     2. `grep -c "I&rsquo;m building Juno" src/sections/Hero.tsx` → `0` (old Juno-first opening fully gone).
     3. `grep -c "Health Tech Builder" src/sections/Hero.tsx` → `1` (eyebrow untouched).
     4. `grep -P '&mdash;|\x{2014}' src/sections/Hero.tsx` → no match, exit code 1 (the old paragraph's one `&mdash;` is gone along with the sentence it was in; no new em dash introduced).
     5. `npm run typecheck` passes.
     6. `npm test` passes in full (no test file asserts on Hero's paragraph text or eyebrow — confirmed by repo-wide grep for the literal strings being replaced, PRD §7).

---

### Task 2 — `AboutSection.tsx`: width restructure + copy rewrite
   - Files: `src/sections/AboutSection.tsx`
   - Changes: Per PRD §4.1/§4.2. Two independent changes landing together: (a) the outer wrapper goes from a single centered `mx-auto max-w-[640px]` to a wide `mx-auto w-full max-w-content` outer with a `max-w-[640px]` inner block that has **no** `mx-auto` of its own, so the prose sits flush-left against the same edge as Projects'/Contact's content instead of floating centered in a narrow column; (b) all four paragraphs are rewritten to drop three em dashes and the "Health tech isn't really a pivot for me" hedge, while preserving every factual claim.

     Before (current file, in full):
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
               <p>
                 I&rsquo;m a software engineer who ends up building things end to end &mdash;
                 backend systems at Microsoft during the day, and a health-tech startup nights
                 and weekends.
               </p>
               <p>
                 At Microsoft, I&rsquo;m a Software Engineer II on the Fabric Maps team, where I
                 work on the infrastructure and developer tools behind large-scale geospatial
                 data.
               </p>
               <p>
                 Outside of that, I&rsquo;m building Juno &mdash; an AI companion that helps
                 patients walk into a doctor&rsquo;s appointment prepared, and walk out with a
                 clear record of what was said and what to do next. It&rsquo;s early: I&rsquo;m
                 validating the idea directly with patients and clinicians before scaling
                 anything.
               </p>
               <p>
                 Health tech isn&rsquo;t really a pivot for me &mdash; some of my first research,
                 in college, was a self-testing app for HIV and syphilis and a
                 pill-identification tool built from photos. Juno is the same instinct, aimed
                 at a bigger problem.
               </p>
             </div>
           </div>
         </section>
       );
     }
     ```

     After:
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
                 <p>
                   I&rsquo;m a software engineer. I like building things end to end, from backend
                   to frontend, on whatever stack the problem calls for.
                 </p>
                 <p>
                   At Microsoft, I&rsquo;m a Software Engineer II on the Fabric Maps team. I work
                   on the infrastructure behind how geospatial data gets visualized and analyzed
                   in Microsoft Fabric and Power BI.
                 </p>
                 <p>
                   On the side, I build in health tech. Right now that&rsquo;s Juno, an AI
                   companion that helps patients walk into a doctor&rsquo;s appointment prepared
                   and walk out with a clear record of what was said and what to do next.
                   It&rsquo;s early. I&rsquo;m still validating the idea with patients and
                   clinicians.
                 </p>
                 <p>
                   This isn&rsquo;t new for me. In college, I worked on a self-testing app for HIV
                   and syphilis and a tool that identifies pills from photos. Juno picks up that
                   same thread, aimed at a bigger problem.
                 </p>
               </div>
             </div>
           </div>
         </section>
       );
     }
     ```

     **Full About copy, verbatim, ready to paste (4 paragraphs, ~139 words):**

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

     **Fact-check, per PRD §4.2 — every claim traced to a source, nothing invented:** "Software Engineer II
     on the Fabric Maps team" matches `RESUME-EXTRACT.md` exactly (Level 61, March 2024–Present); "geospatial
     data gets visualized and analyzed in Microsoft Fabric and Power BI" is near-verbatim from the résumé's
     own team-context line; "a self-testing app for HIV and syphilis" matches `RESUME-EXTRACT.md`'s SMARTest
     research-paper line; "a tool that identifies pills from photos" is sourced from the pre-existing,
     unchanged `src/content/research/pill-recognition-prescription-extraction.md` (outside this round's
     scope) — the same claim the currently-shipped copy already makes, reworded only.

   - Acceptance criteria:
     1. `grep -c 'mx-auto w-full max-w-content' src/sections/AboutSection.tsx` → `1`; `grep -c 'mx-auto max-w-\[640px\]' src/sections/AboutSection.tsx` → `0` (old centered-and-narrowed wrapper fully gone).
     2. `grep -c 'className="max-w-\[640px\] text-left"' src/sections/AboutSection.tsx` → `1` (inner block, no `mx-auto`).
     3. `grep -c "I&rsquo;m a software engineer\. I like building things end to end" src/sections/AboutSection.tsx` → `1`.
     4. `grep -c "Health tech isn&rsquo;t really a pivot" src/sections/AboutSection.tsx` → `0`.
     5. `grep -P '&mdash;|\x{2014}' src/sections/AboutSection.tsx` → no match, exit code 1 (zero em dashes; the old copy had three).
     6. `npm run typecheck` passes.
     7. `npm test` passes in full (no test file asserts on About's copy or container class — PRD §7).
     8. **Manual devtools check at ≥1280px viewport width:** with Task 4/5 not yet landed this check is partial — confirm here only that About's content block (the `<h2>About</h2>` and the paragraphs below it) now starts at the *same x-coordinate* as `FeaturedProjectsSection`'s "Projects" eyebrow label, both measured from the left edge of the viewport. (The full four-section alignment check, once every width fix has landed, is Task 7.)

---

### Task 3 — `ContactSection.tsx`: copy rewrite + Connect-panel rebuild (R4's handed-off diff) + test fix
   - Files: `src/sections/ContactSection.tsx`, `src/sections/ContactSection.test.tsx`
   - Changes: Per PRD §4.3 (copy) **and** `04-component-polish/PRD.md` §9 item 12 (R4's complete, ready-to-apply Connect-panel diff — this PRD does not design that structure itself, but the file is R2-owned, so R2 implements it). Three things land together in one commit: the left-column paragraph is rewritten with zero hiring language (locked decision 8); the aside's Email block (icon + "Email" label + `mailto:`/fallback link) is deleted outright, along with the divider wrapper that used to separate it from Profiles (Profiles is now the aside's only content block, so it no longer needs a `border-t` divider from a first block); `EmailIcon`'s now-unused import is removed. The left column's own `Button`/fallback email affordance is untouched — only the aside's duplicate copy of the email goes away.

     Before (current file, in full):
     ```tsx
     import { Button } from '@/components/Button';
     import { GitHubIcon } from '@/components/icons/GitHubIcon';
     import { LinkedInIcon } from '@/components/icons/LinkedInIcon';
     import { EmailIcon } from '@/components/icons/EmailIcon';
     import { CONTACT_EMAIL_DISPLAY, LINKEDIN_URL, GITHUB_URL } from '@/config/contact';
     import { useContactMailto } from '@/hooks/useContactMailto';
     import { trackEvent } from '@/lib/analytics';

     export function ContactSection() {
       const emailHref = useContactMailto();

       return (
         <section
           id="contact"
           className="scroll-mt-24 bg-cream px-6 py-16 sm:px-8 sm:py-20 md:px-10 lg:px-12 lg:py-24"
         >
           <div className="mx-auto grid w-full max-w-content grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(260px,0.6fr)] lg:gap-14">
             <div className="max-w-[540px]">
               <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-teal-secondary">
                 Contact
               </p>
               <h2 className="mt-3.5 max-w-[12ch] text-[1.75rem] font-extrabold leading-[0.97] tracking-tight text-ink sm:text-[2.15rem]">
                 Get in Touch
               </h2>
               <p className="mt-4 max-w-[28rem] text-[0.9rem] leading-6.5 text-body">
                 Whether you&rsquo;re hiring, working on something in health tech, or want to
                 talk through Juno with a clinician&rsquo;s or researcher&rsquo;s eye &mdash;
                 I&rsquo;d like to hear from you.
               </p>
               <div className="mt-6 flex flex-wrap gap-2.5">
                 {emailHref ? (
                   <Button href={emailHref}>Email Me</Button>
                 ) : (
                   <span className="select-all rounded-full border border-teal-secondary/20 px-5 py-2 text-[0.82rem] font-semibold text-teal-secondary">
                     {CONTACT_EMAIL_DISPLAY}
                   </span>
                 )}
               </div>
             </div>

             <aside className="lg:pt-5">
               <div className="rounded-panel border border-teal-secondary/12 bg-sage p-4.5 shadow-panel sm:p-5">
                 <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-teal-secondary">
                   Connect
                 </p>

                 <div className="mt-5 space-y-4 text-ink">
                   <div className="flex items-start gap-3">
                     <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-teal-secondary/12 bg-cream text-teal-secondary">
                       <EmailIcon />
                     </span>
                     <div>
                       <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate">
                         Email
                       </p>
                       {emailHref ? (
                         <a
                           href={emailHref}
                           className="mt-1.5 inline-block text-[0.9rem] font-semibold text-ink transition hover:text-teal-secondary"
                         >
                           {CONTACT_EMAIL_DISPLAY}
                         </a>
                       ) : (
                         <p className="mt-1.5 select-all text-[0.9rem] font-semibold text-ink">
                           {CONTACT_EMAIL_DISPLAY}
                         </p>
                       )}
                     </div>
                   </div>

                   <div className="border-t border-teal-secondary/10 pt-4">
                     <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate">
                       Profiles
                     </p>
                     <div className="mt-3 flex items-center gap-2.5">
                       <a
                         href={GITHUB_URL}
                         target="_blank"
                         rel="noreferrer"
                         aria-label="GitHub"
                         onClick={() =>
                           trackEvent('outbound_click', {
                             url: GITHUB_URL,
                             context: 'contact_social',
                             label: 'GitHub',
                           })
                         }
                         className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-secondary/12 bg-cream text-teal-secondary transition hover:-translate-y-0.5 hover:bg-teal-secondary hover:text-white"
                       >
                         <GitHubIcon />
                       </a>
                       <a
                         href={LINKEDIN_URL}
                         target="_blank"
                         rel="noreferrer"
                         aria-label="LinkedIn"
                         onClick={() =>
                           trackEvent('outbound_click', {
                             url: LINKEDIN_URL,
                             context: 'contact_social',
                             label: 'LinkedIn',
                           })
                         }
                         className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-secondary/12 bg-cream text-teal-secondary transition hover:-translate-y-0.5 hover:bg-teal-secondary hover:text-white"
                       >
                         <LinkedInIcon />
                       </a>
                     </div>
                   </div>
                 </div>
               </div>
             </aside>
           </div>
         </section>
       );
     }
     ```

     After:
     ```tsx
     import { Button } from '@/components/Button';
     import { GitHubIcon } from '@/components/icons/GitHubIcon';
     import { LinkedInIcon } from '@/components/icons/LinkedInIcon';
     import { CONTACT_EMAIL_DISPLAY, LINKEDIN_URL, GITHUB_URL } from '@/config/contact';
     import { useContactMailto } from '@/hooks/useContactMailto';
     import { trackEvent } from '@/lib/analytics';

     export function ContactSection() {
       const emailHref = useContactMailto();

       return (
         <section
           id="contact"
           className="scroll-mt-24 bg-cream px-6 py-16 sm:px-8 sm:py-20 md:px-10 lg:px-12 lg:py-24"
         >
           <div className="mx-auto grid w-full max-w-content grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(260px,0.6fr)] lg:gap-14">
             <div className="max-w-[540px]">
               <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-teal-secondary">
                 Contact
               </p>
               <h2 className="mt-3.5 max-w-[12ch] text-[1.75rem] font-extrabold leading-[0.97] tracking-tight text-ink sm:text-[2.15rem]">
                 Get in Touch
               </h2>
               <p className="mt-4 max-w-[28rem] text-[0.9rem] leading-6.5 text-body">
                 I&rsquo;m always glad to hear from people working in health tech, especially
                 if you want to talk through Juno from a clinical or research angle.
               </p>
               <div className="mt-6 flex flex-wrap gap-2.5">
                 {emailHref ? (
                   <Button href={emailHref}>Email Me</Button>
                 ) : (
                   <span className="select-all rounded-full border border-teal-secondary/20 px-5 py-2 text-[0.82rem] font-semibold text-teal-secondary">
                     {CONTACT_EMAIL_DISPLAY}
                   </span>
                 )}
               </div>
             </div>

             <aside className="lg:pt-5">
               <div className="rounded-panel border border-teal-secondary/12 bg-sage p-4.5 shadow-panel sm:p-5">
                 <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-teal-secondary">
                   Connect
                 </p>

                 <div className="mt-5 text-ink">
                   <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate">
                     Profiles
                   </p>
                   <div className="mt-3 flex items-center gap-2.5">
                     <a
                       href={GITHUB_URL}
                       target="_blank"
                       rel="noreferrer"
                       aria-label="GitHub"
                       onClick={() =>
                         trackEvent('outbound_click', {
                           url: GITHUB_URL,
                           context: 'contact_social',
                           label: 'GitHub',
                         })
                       }
                       className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-secondary/12 bg-cream text-teal-secondary transition hover:-translate-y-0.5 hover:bg-teal-secondary hover:text-white"
                     >
                       <GitHubIcon />
                     </a>
                     <a
                       href={LINKEDIN_URL}
                       target="_blank"
                       rel="noreferrer"
                       aria-label="LinkedIn"
                       onClick={() =>
                         trackEvent('outbound_click', {
                           url: LINKEDIN_URL,
                           context: 'contact_social',
                           label: 'LinkedIn',
                         })
                       }
                       className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-secondary/12 bg-cream text-teal-secondary transition hover:-translate-y-0.5 hover:bg-teal-secondary hover:text-white"
                     >
                       <LinkedInIcon />
                     </a>
                   </div>
                 </div>
               </div>
             </aside>
           </div>
         </section>
       );
     }
     ```

     **Full Contact copy, verbatim, ready to paste:**

     > **Heading (unchanged):** Get in Touch
     > **Paragraph:** I'm always glad to hear from people working in health tech, especially if you want to
     > talk through Juno from a clinical or research angle.

     **Locked decision 8 check:** "hiring" and every synonym (looking for work, open to opportunities,
     available) is fully absent from the new paragraph.

     `src/sections/ContactSection.test.tsx`, before (current file, in full):
     ```tsx
     import { describe, expect, it, vi } from 'vitest';
     import { render, screen, waitFor } from '@testing-library/react';
     import { MemoryRouter } from 'react-router-dom';
     import { ContactSection } from './ContactSection';
     import { CONTACT_EMAIL_DISPLAY } from '@/config/contact';

     const contactMailto = vi.hoisted(() => ({ href: null as string | null }));

     vi.mock('@/hooks/useContactMailto', () => ({
       useContactMailto: () => contactMailto.href,
     }));

     describe('ContactSection', () => {
       it('shows the obfuscated text before the mailto effect settles, then exposes the mailto affordances', async () => {
         const view = render(
           <MemoryRouter>
             <ContactSection />
           </MemoryRouter>,
         );

         const initialNodes = screen.getAllByText(CONTACT_EMAIL_DISPLAY);
         expect(initialNodes).toHaveLength(2);
         for (const node of initialNodes) {
           expect(node.closest('a')).toBeNull();
         }

         contactMailto.href = 'mailto:tejitpabari99@gmail.com';
         view.rerender(
           <MemoryRouter>
             <ContactSection />
           </MemoryRouter>,
         );
         await waitFor(() => {
           expect(screen.getByRole('link', { name: 'Email Me' })).toHaveAttribute(
             'href',
             'mailto:tejitpabari99@gmail.com',
           );
           const asideEmail = screen.getAllByText(CONTACT_EMAIL_DISPLAY).find((node) => node.closest('a'));
           expect(asideEmail?.closest('a')).toHaveAttribute('href', 'mailto:tejitpabari99@gmail.com');
         });
       });
     });
     ```

     **This test breaks the instant the aside's Email block is deleted** — `getAllByText(CONTACT_EMAIL_DISPLAY)`
     goes from 2 nodes (left-column fallback + aside fallback) to 1 (left-column only), and the aside-node
     lookup (`.find((node) => node.closest('a'))`) now finds nothing. Fix per R4's own note (§9 item 12): drop
     to a length-1 assertion and remove the now-meaningless aside lookup, keeping only the checks already
     covered by the "Email Me" button assertion.

     After:
     ```tsx
     import { describe, expect, it, vi } from 'vitest';
     import { render, screen, waitFor } from '@testing-library/react';
     import { MemoryRouter } from 'react-router-dom';
     import { ContactSection } from './ContactSection';
     import { CONTACT_EMAIL_DISPLAY } from '@/config/contact';

     const contactMailto = vi.hoisted(() => ({ href: null as string | null }));

     // RTL's render is wrapped in act(), which flushes passive effects before it
     // returns in the React version used by this project. Control the hook's value
     // to inspect ContactSection's pre- and post-mount branches deterministically;
     // the real hook timing is covered by src/hooks/useContactMailto.test.ts.
     vi.mock('@/hooks/useContactMailto', () => ({
       useContactMailto: () => contactMailto.href,
     }));

     describe('ContactSection', () => {
       it('shows the obfuscated text before the mailto effect settles, then exposes the mailto affordance', async () => {
         const view = render(
           <MemoryRouter>
             <ContactSection />
           </MemoryRouter>,
         );

         // Before the hook supplies a client-only href, the left column's
         // fallback stays plain text so prerendered HTML cannot contain a
         // mailto href. The Connect aside no longer renders an email node at
         // all (R4's Connect-panel rebuild moved email out of the aside
         // entirely, keeping only Profiles there) — CONTACT_EMAIL_DISPLAY now
         // appears exactly once, not twice.
         const initialNodes = screen.getAllByText(CONTACT_EMAIL_DISPLAY);
         expect(initialNodes).toHaveLength(1);
         expect(initialNodes[0].closest('a')).toBeNull();

         // Once useContactMailto's effect settles, rerender with its
         // resulting value and verify the "Email Me" button by its label/href.
         contactMailto.href = 'mailto:tejitpabari99@gmail.com';
         view.rerender(
           <MemoryRouter>
             <ContactSection />
           </MemoryRouter>,
         );
         await waitFor(() => {
           expect(screen.getByRole('link', { name: 'Email Me' })).toHaveAttribute(
             'href',
             'mailto:tejitpabari99@gmail.com',
           );
         });
       });
     });
     ```

   - Acceptance criteria:
     1. `grep -c "import { EmailIcon }" src/sections/ContactSection.tsx` → `0`.
     2. `grep -c "Email" src/sections/ContactSection.tsx` → `1` (only the `"Email Me"` button label survives; the aside's own "Email" sub-heading is gone).
     3. `grep -c "Whether you&rsquo;re hiring" src/sections/ContactSection.tsx` → `0`; `grep -ic "hiring" src/sections/ContactSection.tsx` → `0` (locked decision 8, checked both directions).
     4. `grep -c "I&rsquo;m always glad to hear from people working in health tech" src/sections/ContactSection.tsx` → `1`.
     5. `grep -c "border-t border-teal-secondary/10 pt-4" src/sections/ContactSection.tsx` → `0` (divider wrapper removed — Profiles is now the aside's only block).
     6. `grep -P '&mdash;|\x{2014}' src/sections/ContactSection.tsx` → no match, exit code 1.
     7. `src/sections/ContactSection.test.tsx` matches the "after" block above exactly.
     8. `npm run typecheck` passes.
     9. `npx vitest run src/sections/ContactSection.test.tsx` passes.
     10. `npm test` passes in full.

---

### Task 4 — `FeaturedProjectsSection.tsx`: headline width/wrap fix
   - Files: `src/sections/FeaturedProjectsSection.tsx`
   - Changes: Per PRD §4.5/§4.7. The headline's `max-w-[13ch]`-at-every-breakpoint clamp (which wrapped the 41-character string into three-to-four short lines) is replaced with a responsive mechanism: `whitespace-nowrap` plus a fluid `clamp()` font-size, active only from the `sm` breakpoint (640px) up; below that, wrapping stays allowed at a larger `22ch` max-width with `text-balance` so it breaks into a clean two-line wrap instead. The now-redundant `<div className="max-w-[640px]">` wrapper around the eyebrow+headline pair is removed — the headline manages its own width directly, and the short "Projects" eyebrow never needed it. Headline text itself, the `ProjectCard` grid, and "See all projects" link are all unchanged.

     Before (current file, in full):
     ```tsx
     import { Link } from 'react-router-dom';
     import { ProjectCard } from '@/components/ProjectCard';
     import { ArrowIcon } from '@/components/icons/ArrowIcon';
     import { featuredProjects } from '@/config/featured';
     import { trackEvent } from '@/lib/analytics';

     export function FeaturedProjectsSection() {
       return (
         <section
           id="projects"
           className="scroll-mt-24 bg-sage px-6 py-16 sm:px-8 sm:py-20 md:px-10 lg:px-12 lg:py-24"
         >
           <div className="mx-auto w-full max-w-content">
             <div className="max-w-[640px]">
               <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-teal-secondary">
                 Projects
               </p>
               <h2 className="mt-4 max-w-[13ch] text-[2rem] font-extrabold leading-[0.96] tracking-tight text-ink sm:text-[2.5rem]">
                 Selected work, in health tech and beyond.
               </h2>
             </div>

             <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:mt-10 xl:grid-cols-4">
               {featuredProjects.map((project) => (
                 <ProjectCard
                   key={project.slug}
                   href={`/projects/${project.slug}`}
                   image={project.image}
                   imageAlt={`${project.title} preview`}
                   title={project.title}
                   description={project.description}
                   tags={project.tags}
                   status={project.status}
                   externalHref={project.liveUrl}
                   externalLabel={`Open ${project.title} live`}
                   onCardClick={() =>
                     trackEvent('project_card_click', {
                       slug: project.slug,
                       collection: 'projects',
                       title: project.title,
                     })
                   }
                   onExternalClick={() =>
                     trackEvent('outbound_click', {
                       url: project.liveUrl ?? '',
                       context: 'content_external_link',
                       label: `Open ${project.title} live`,
                     })
                   }
                 />
               ))}
             </div>

             <div className="mt-8 flex justify-center lg:mt-10">
               <Link
                 to="/projects"
                 className="inline-flex items-center gap-1.5 rounded-full border border-teal-secondary px-6 py-2.5 text-sm font-semibold text-teal-secondary transition hover:bg-teal-secondary hover:text-white lg:px-7 lg:py-3 lg:text-[0.92rem]"
               >
                 See all projects
                 <ArrowIcon className="h-4 w-4" />
               </Link>
             </div>
           </div>
         </section>
       );
     }
     ```

     After (only the eyebrow/headline block changes — everything from the `ProjectCard` grid down is untouched):
     ```tsx
     import { Link } from 'react-router-dom';
     import { ProjectCard } from '@/components/ProjectCard';
     import { ArrowIcon } from '@/components/icons/ArrowIcon';
     import { featuredProjects } from '@/config/featured';
     import { trackEvent } from '@/lib/analytics';

     export function FeaturedProjectsSection() {
       return (
         <section
           id="projects"
           className="scroll-mt-24 bg-sage px-6 py-16 sm:px-8 sm:py-20 md:px-10 lg:px-12 lg:py-24"
         >
           <div className="mx-auto w-full max-w-content">
             <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-teal-secondary">
               Projects
             </p>
             <h2 className="mt-4 max-w-[22ch] text-balance text-[1.7rem] font-extrabold leading-[1.1] tracking-tight text-ink sm:max-w-none sm:whitespace-nowrap sm:text-[clamp(1.4rem,3.2vw,2.5rem)] sm:leading-[0.96]">
               Selected work, in health tech and beyond.
             </h2>

             <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:mt-10 xl:grid-cols-4">
               {featuredProjects.map((project) => (
                 <ProjectCard
                   key={project.slug}
                   href={`/projects/${project.slug}`}
                   image={project.image}
                   imageAlt={`${project.title} preview`}
                   title={project.title}
                   description={project.description}
                   tags={project.tags}
                   status={project.status}
                   externalHref={project.liveUrl}
                   externalLabel={`Open ${project.title} live`}
                   onCardClick={() =>
                     trackEvent('project_card_click', {
                       slug: project.slug,
                       collection: 'projects',
                       title: project.title,
                     })
                   }
                   onExternalClick={() =>
                     trackEvent('outbound_click', {
                       url: project.liveUrl ?? '',
                       context: 'content_external_link',
                       label: `Open ${project.title} live`,
                     })
                   }
                 />
               ))}
             </div>

             <div className="mt-8 flex justify-center lg:mt-10">
               <Link
                 to="/projects"
                 className="inline-flex items-center gap-1.5 rounded-full border border-teal-secondary px-6 py-2.5 text-sm font-semibold text-teal-secondary transition hover:bg-teal-secondary hover:text-white lg:px-7 lg:py-3 lg:text-[0.92rem]"
               >
                 See all projects
                 <ArrowIcon className="h-4 w-4" />
               </Link>
             </div>
           </div>
         </section>
       );
     }
     ```

   - Acceptance criteria:
     1. `grep -c '<div className="max-w-\[640px\]">' src/sections/FeaturedProjectsSection.tsx` → `0` (redundant wrapper gone).
     2. `grep -c 'max-w-\[22ch\] text-balance' src/sections/FeaturedProjectsSection.tsx` → `1`.
     3. `grep -c 'sm:whitespace-nowrap sm:text-\[clamp(1.4rem,3.2vw,2.5rem)\]' src/sections/FeaturedProjectsSection.tsx` → `1`.
     4. `grep -c "Selected work, in health tech and beyond." src/sections/FeaturedProjectsSection.tsx` → `1` (headline text itself unchanged).
     5. `npm run typecheck` passes.
     6. `npm test` passes in full (no test asserts on this headline's class string or wrap behavior — PRD §7; real-browser one-line verification is Task 6).

---

### Task 5 — `WorkExperienceSection.tsx`: width + headline/wrap fix, `<Timeline>` reading-width wrap, "See all experience" test
   - Files: `src/sections/WorkExperienceSection.tsx`, `src/sections/WorkExperienceSection.test.ts`
   - Changes: Per PRD §4.1/§4.6/§4.7 and §7 (test). Three changes to `WorkExperienceSection.tsx`: the outer container widens from the bespoke `max-w-[720px]` to the shared `max-w-content` (matching Projects/Contact, PRD §4.1); the headline gets the identical `clamp()`/`nowrap` mechanism Task 4 applied to Featured Projects (same class string — the shorter 38-character string gets extra headroom "for free" from the 41-character string's floor, PRD §4.7); and `<Timeline>` is now wrapped in its own `max-w-[640px]` div so each entry's smaller body text (`text-[0.82rem]`/`text-[0.86rem]`) doesn't stretch to the new, wider container's full width. `computeLandingTimelineState`/`LANDING_TIMELINE_LIMIT` are untouched — already generic over entry count, no edit needed for R3's now-3-entry `workExperience`. Separately, this task adds the "See all experience" test this PRD claims ownership of (PRD §7): with R3's 3-entry content, `hasMore` (`3 > LANDING_TIMELINE_LIMIT (2)`) is `true` for the first time the landing page has ever rendered, so `TimelineSeeAllStub` mounts on `/` for the first time — this has only ever been verified by code tracing, never rendered and asserted on.

     Before (current file, in full):
     ```tsx
     import { workExperience, type WorkExperience } from '@/data';
     import { Timeline } from '@/components/timeline/Timeline';

     // Brief §2/§3 says "top 2–3 entries" without pinning an exact number.
     // Resolved at 2 (PRD §4.5/§9, owner decision propagated from SP07's role
     // drop) — the "See all" stub's visibility is NOT tuned via this number; it
     // renders only when workExperience.length > LANDING_TIMELINE_LIMIT. At
     // today's 2-role launch content that's false, so the stub does not render.
     export const LANDING_TIMELINE_LIMIT = 2;

     // Exported for testability — PRD §7 requires boundary-testing this
     // computation at exactly LANDING_TIMELINE_LIMIT, one below, and one above.
     // eslint-disable-next-line react-refresh/only-export-components
     export function computeLandingTimelineState(
       all: WorkExperience[],
       limit: number = LANDING_TIMELINE_LIMIT,
     ): { entries: WorkExperience[]; hasMore: boolean } {
       return { entries: all.slice(0, limit), hasMore: all.length > limit };
     }

     export function WorkExperienceSection() {
       const { entries, hasMore } = computeLandingTimelineState(workExperience);

       return (
         <section
           id="work-experience"
           className="scroll-mt-24 bg-cream px-6 py-16 sm:px-8 sm:py-20 md:px-10 lg:px-12 lg:py-24"
         >
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
         </section>
       );
     }
     ```

     After (`LANDING_TIMELINE_LIMIT`/`computeLandingTimelineState` untouched — only the JSX below changes):
     ```tsx
     import { workExperience, type WorkExperience } from '@/data';
     import { Timeline } from '@/components/timeline/Timeline';

     // Brief §2/§3 says "top 2–3 entries" without pinning an exact number.
     // Resolved at 2 (PRD §4.5/§9, owner decision propagated from SP07's role
     // drop) — the "See all" stub's visibility is NOT tuned via this number; it
     // renders only when workExperience.length > LANDING_TIMELINE_LIMIT. As of
     // this round's real 3-entry content (Software Engineer II, Software
     // Engineer, Jio), that's true for the first time — see the
     // "WorkExperienceSection (real content)" test below.
     export const LANDING_TIMELINE_LIMIT = 2;

     // Exported for testability — PRD §7 requires boundary-testing this
     // computation at exactly LANDING_TIMELINE_LIMIT, one below, and one above.
     // eslint-disable-next-line react-refresh/only-export-components
     export function computeLandingTimelineState(
       all: WorkExperience[],
       limit: number = LANDING_TIMELINE_LIMIT,
     ): { entries: WorkExperience[]; hasMore: boolean } {
       return { entries: all.slice(0, limit), hasMore: all.length > limit };
     }

     export function WorkExperienceSection() {
       const { entries, hasMore } = computeLandingTimelineState(workExperience);

       return (
         <section
           id="work-experience"
           className="scroll-mt-24 bg-cream px-6 py-16 sm:px-8 sm:py-20 md:px-10 lg:px-12 lg:py-24"
         >
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
         </section>
       );
     }
     ```

     `src/sections/WorkExperienceSection.test.ts`, before (current file, in full):
     ```ts
     import { describe, expect, it } from 'vitest';
     import { computeLandingTimelineState, LANDING_TIMELINE_LIMIT } from './WorkExperienceSection';
     import type { WorkExperience } from '@/data';

     function entry(id: string): WorkExperience {
       return {
         id,
         company: 'C',
         role: 'R',
         startDate: '2024-01-01',
         endDate: 'Present',
         links: [],
         draftDate: false,
         body: 'b',
       };
     }

     describe('computeLandingTimelineState', () => {
       it('hasMore is false at exactly the limit', () => {
         const all = Array.from({ length: LANDING_TIMELINE_LIMIT }, (_, i) => entry(String(i)));
         const { hasMore, entries } = computeLandingTimelineState(all);
         expect(hasMore).toBe(false);
         expect(entries).toHaveLength(LANDING_TIMELINE_LIMIT);
       });

       it('hasMore is false one below the limit', () => {
         const all = Array.from({ length: LANDING_TIMELINE_LIMIT - 1 }, (_, i) => entry(String(i)));
         const { hasMore } = computeLandingTimelineState(all);
         expect(hasMore).toBe(false);
       });

       it('hasMore is true one above the limit, and entries is still capped at the limit', () => {
         const all = Array.from({ length: LANDING_TIMELINE_LIMIT + 1 }, (_, i) => entry(String(i)));
         const { hasMore, entries } = computeLandingTimelineState(all);
         expect(hasMore).toBe(true);
         expect(entries).toHaveLength(LANDING_TIMELINE_LIMIT);
       });
     });
     ```

     After — the existing `describe` block is untouched; add a second `describe` block, per PRD §7, with the imports it needs that this file doesn't currently have:
     ```ts
     import { describe, expect, it } from 'vitest';
     import { render, screen } from '@testing-library/react';
     import { MemoryRouter } from 'react-router-dom';
     import {
       computeLandingTimelineState,
       LANDING_TIMELINE_LIMIT,
       WorkExperienceSection,
     } from './WorkExperienceSection';
     import { workExperience } from '@/data';
     import type { WorkExperience as WorkExperienceType } from '@/data';

     function entry(id: string): WorkExperienceType {
       return {
         id,
         company: 'C',
         role: 'R',
         startDate: '2024-01-01',
         endDate: 'Present',
         links: [],
         draftDate: false,
         body: 'b',
       };
     }

     describe('computeLandingTimelineState', () => {
       it('hasMore is false at exactly the limit', () => {
         const all = Array.from({ length: LANDING_TIMELINE_LIMIT }, (_, i) => entry(String(i)));
         const { hasMore, entries } = computeLandingTimelineState(all);
         expect(hasMore).toBe(false);
         expect(entries).toHaveLength(LANDING_TIMELINE_LIMIT);
       });

       it('hasMore is false one below the limit', () => {
         const all = Array.from({ length: LANDING_TIMELINE_LIMIT - 1 }, (_, i) => entry(String(i)));
         const { hasMore } = computeLandingTimelineState(all);
         expect(hasMore).toBe(false);
       });

       it('hasMore is true one above the limit, and entries is still capped at the limit', () => {
         const all = Array.from({ length: LANDING_TIMELINE_LIMIT + 1 }, (_, i) => entry(String(i)));
         const { hasMore, entries } = computeLandingTimelineState(all);
         expect(hasMore).toBe(true);
         expect(entries).toHaveLength(LANDING_TIMELINE_LIMIT);
       });
     });

     describe('WorkExperienceSection (real content)', () => {
       it('renders exactly LANDING_TIMELINE_LIMIT entries plus a "See all experience" link, now that real content exceeds the limit', () => {
         // Sanity check on the R3 precondition this test exists to exercise —
         // if this ever goes false again (content drops back to 2 entries),
         // the second assertion below should also flip, not silently stay
         // green.
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

   - Acceptance criteria:
     1. `grep -c 'mx-auto w-full max-w-content' src/sections/WorkExperienceSection.tsx` → `1`; `grep -c 'max-w-\[720px\]' src/sections/WorkExperienceSection.tsx` → `0`.
     2. `grep -c 'max-w-\[22ch\] text-balance' src/sections/WorkExperienceSection.tsx` → `1`; the class string on the `<h2>` is byte-for-byte identical to Task 4's Featured Projects headline class string (deliberate, PRD §4.7 — confirm by diffing the two `<h2 className="...">` lines).
     3. `grep -c 'mt-8 max-w-\[640px\] lg:mt-10' src/sections/WorkExperienceSection.tsx` → `1` (Timeline's new reading-width wrapper).
     4. `grep -c "Where I&rsquo;ve worked and what I&rsquo;ve built." src/sections/WorkExperienceSection.tsx` → `1` (headline text unchanged).
     5. `grep -c "export const LANDING_TIMELINE_LIMIT = 2" src/sections/WorkExperienceSection.tsx` → `1` (unchanged).
     6. `npm run typecheck` passes.
     7. `npx vitest run src/sections/WorkExperienceSection.test.ts` passes all four cases (three existing boundary cases + the new real-content case).
     8. `npm test` passes in full.
     9. **Manual dev-server rendered check (not just the automated test above) — R3's own PRD flagged that this stub has only ever been verified by code tracing, never by looking at it:** run `npm run dev`, load `/`, scroll to Work Experience, and visually confirm the "See all experience" stub renders directly after the second (Software Engineer, not Present-role) timeline entry with no visual gap or double border, and that the timeline spine reads as continuing smoothly into it.

---

### Task 6 — Real-browser verification of the one-line headline guarantee (640px / 768px / 1024px / 1440px)
   - Files: `src/sections/FeaturedProjectsSection.tsx`, `src/sections/WorkExperienceSection.tsx` (only if a `clamp()` floor adjustment turns out to be needed)
   - Changes: Per PRD §4.7/§7 manual QA item 1 and §8 item 3. Depends on Tasks 4 and 5 (both headlines' `clamp()`/`nowrap` classes are already applied by this point). **This is the fiddliest item in this sub-project — the PRD's 640px floor rests on an estimated Montserrat ExtraBold average-glyph-width (≈0.58em), not a measured one, with the tightest margin (~7.5% headroom) landing exactly at the 640px breakpoint.** The task here is to apply nothing new (Tasks 4/5 already applied the designed classes) and instead *actually load the page in a real browser* and check it at each of the four viewport widths below, since jsdom/vitest never computes real text layout and cannot catch a glyph-width estimate being wrong.

     **Verification steps (run `npm run dev`, open the site in a real browser, use devtools' responsive-mode viewport-width field to hit each width exactly):**
     1. **640px** — the tightest point in the PRD's own math (~7.5% headroom by estimate). Confirm both `"Selected work, in health tech and beyond."` (Featured Projects) and `"Where I've worked and what I've built."` (Work Experience) render on exactly one line each, with no visible overflow and no horizontal scrollbar on the page.
     2. **768px** — confirm both headlines still render on one line (PRD's math gives ~103px headroom here).
     3. **1024px** — confirm both headlines still render on one line (~148px headroom).
     4. **1440px** — past the `clamp()`'s ceiling (reached at ~1250px viewport width); confirm both headlines render on one line at the capped `2.5rem` size with no visual regression (no clipping, no unexpected wrap).
     5. Below 640px (e.g. 375px), confirm both headlines wrap to a **clean two-line break** (not three or four short lines like the pre-fix design) and don't overflow horizontally — `max-w-[22ch]` and `text-balance` are what produce this; a three-plus-line wrap here would mean the fix regressed instead of improving on the old design.

     **If either headline clips or wraps at 640px:** the fix is a small downward adjustment to the `clamp()` floor value (currently `1.4rem`) in the matching `sm:text-[clamp(1.4rem,3.2vw,2.5rem)]` class in *both* `FeaturedProjectsSection.tsx` and `WorkExperienceSection.tsx` (they must stay identical per Task 5's acceptance criterion 2) — nudge the floor down by 1–2px, re-check step 1, repeat until it clears with visible headroom. Do not redesign the mechanism (`whitespace-nowrap` + `clamp()` + the 640px breakpoint choice) — only the floor number is in question.

     **This sub-project owns applying and doing this first real-browser check; R6 (`06-voice-sweep-and-ship/PRD.md` §7) also carries this exact check as part of its own final verification gate before ship — that is R6 re-confirming at ship time, not a second design owner. Do not treat R6's mention of this as this sub-project's task to skip.**

   - Acceptance criteria (all five observed directly in a real browser, not inferred from code):
     1. At a 640px viewport, `Selected work, in health tech and beyond.` renders on exactly one line (no wrap), with no horizontal scrollbar on the page.
     2. At a 640px viewport, `Where I've worked and what I've built.` renders on exactly one line (no wrap), with no horizontal scrollbar on the page.
     3. At 768px, 1024px, and 1440px, both headlines remain on one line each.
     4. At 375px, both headlines wrap to exactly two lines (not three or more), with no horizontal overflow.
     5. If any `clamp()` floor was adjusted to satisfy criteria 1–2: `npm run typecheck` and `npm test` still pass, and the two headline class strings in `FeaturedProjectsSection.tsx`/`WorkExperienceSection.tsx` remain byte-for-byte identical to each other after the edit.

---

### Task 7 — Final cross-section visual QA (verification only, no files modified unless a real defect is found)
   - Files: none expected — this task confirms Tasks 1–6 together produce the state PRD §1/§2/§7 describes, run once after Task 6 lands.
   - Changes: none, unless a genuine defect turns up (in which case: fix it in the relevant task's file, re-run that task's own acceptance criteria, then re-run this task).

     **Checks to run, per PRD §7 manual QA items 2/3 (items 1 and 4 are Task 6's and Task 5's own criteria, not repeated here):**

     1. **Left-edge alignment at ≥1280px viewport width** — the literal visual fix for the owner's original "Projects is wider than other sections" complaint. Load `/` in a real browser at ≥1280px and confirm: `AboutSection`'s "About" heading, `WorkExperienceSection`'s "Work Experience" eyebrow, `FeaturedProjectsSection`'s "Projects" eyebrow, and `ContactSection`'s "Contact" eyebrow all start at the *same* left x-coordinate. A side-by-side screenshot (four sections stacked, aligned to a vertical ruler or guide) is the fastest way to confirm this actually reads as fixed, not just correct by class-name inspection.
     2. **Prose stays at a readable measure** — confirm About's paragraph text and each Work Experience timeline entry's body text still wrap at roughly 640px of width (not stretched to the full 1152px container) — this is the "wide container, readable inner column" split from PRD §4.1, and the point of Tasks 2/5's inner `max-w-[640px]` blocks.
     3. **Below-640px wrap quality** (repeats Task 6 step 5 as a final confirmation once every width change has landed together): at 375px, both landing headlines wrap to a clean two-line break, About/Work Experience content has no dead margin on either side (it now runs edge-to-edge within the section's own padding, same as Projects/Contact always did), and there is no horizontal scrollbar anywhere on the page.
     4. **Full gate run:** `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` — all pass.

   - Acceptance criteria: every check above passes as described. If any does not, the relevant earlier task is not actually complete — go back and fix it in that task's own file/commit rather than patching around it here.

---

## Summary of what requires you (not a dev agent)

1. **Read and approve every rewritten copy block** — the Hero paragraph (Task 1), the About section's four paragraphs (Task 2), and the Contact paragraph (Task 3), all reproduced in full above and in PRD §4.2/§4.3/§4.4. This copy is about you personally; it must not ship on an agent's say-so. In particular: confirm the About section's framing of Juno ("It's early. I'm still validating the idea with patients and clinicians") still matches where things actually stand, and confirm the Hero paragraph's Microsoft-first reordering reads the way you intended.
2. The proposed Hero eyebrow-label swap ("Health Tech Builder" → "Software Engineer") is **already resolved** — you reviewed and rejected it (PRD §4.4, §9 `[RESOLVED]`); no code change to that line, and no further action from you here.
3. **The one-line headline guarantee's real-browser verification (Task 6)** rests on an estimated, not measured, Montserrat glyph width — flagged in the PRD as an implementation-verification item, not a design question for you. Nothing for you to decide here; it's a developer-agent (or R6's own re-check) task, not an owner one.
4. Nothing else in this sub-project's own scope is owner-blocked. The width-system convention (Task 2/4/5), the Connect-panel structural rebuild (Task 3, R4's already-approved design), and the "See all experience" test (Task 5) are all specified precisely enough to implement without further input.
