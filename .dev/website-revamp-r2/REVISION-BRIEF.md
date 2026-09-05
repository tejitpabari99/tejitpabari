# tejitpabari.com — Revision Round 2 (owner feedback), 2026-09-01

Repo: /root/projects/tejitpabari · Branch: `website-revamp` (work here only) · Prior planning: `.dev/website-revamp/`

## Verified by orchestrator (do not re-litigate)
- GitHub secret `FIREBASE_SERVICE_ACCOUNT_TEJITPABARI_99` — SET (2026-08-31).
- GitHub variable `VITE_GA_MEASUREMENT_ID` = `G-9NLS3NG63M` — SET (2026-08-31).
  => SP08 Tasks 4–6 (owner-only provisioning) are DONE. Remaining: validation PR + cutover to main.
- `firebase hosting:channel:deploy` warnings ("Unable to add channel domain to Firebase Auth" /
  "Unable to sync Firebase Auth state") are benign: Firebase Authentication is not enabled on the
  project, so there is no authorized-domain list to sync. No action.
- Resume PDF at https://drive.google.com/file/d/1pTIyviXM0fCCkXeX6LveYXvr7QD2TD0j/view is NOT
  publicly fetchable (redirects to Google sign-in). Any work-experience content that requires
  reading it is OWNER-BLOCKED — note it, do not invent facts.
- `firebase.json` is rewritten on every build by `scripts/inject-csp-hashes.mjs` (postbuild) and by
  vite.config.ts's `liveRedirectsPlugin`, so it is permanently git-dirty after a build. Needs a
  decision (commit generated output, or stop tracking the generated parts).

## Owner feedback list (verbatim intent)

### Layout / navigation
1. Footer should always be at the bottom (sticky footer on short pages).
2. Add "Home" to the navbar so you can get back to home from anywhere.
3. When a Back control is shown, do not show the navbar. Show Back on the `/projects` listing page
   and on individual project pages (so no navbar there).
4. Projects section is much wider than the other sections — inconsistent. Make all sections wider
   and consistent.
5. `/privacy` has no top padding — it collides with the navbar. Same for `/terms`.

### Copy / content (site-wide)
6. Replace the hero/about line "I'm building Juno, an AI companion ... where I'm headed next."
   Drop the Juno opening entirely. New shape: "I am a full-time Software Engineer II ... On the
   side, I love working on health tech ... creating projects there."
7. "Selected work, in health tech and beyond." must render on one line.
8. "Where I've worked and what I've built." must render on one line.
9. Work experience: remove the "QGIS Plugin" and "Creator Onboarding Tool" links; keep only the
   Fabric Maps blog link. Add more work experience. The second role must not be
   "Computer Vision Researcher" — correct title comes from the resume [OWNER-BLOCKED].
10. Projects: do not show "Fabric Maps MCP Server" or "Azure Maps AI Assistant".
11. Contact/Connect: do not state whether he is hiring / being hired. Just talk about health tech.
12. Whole site reads like it was written by AI. Remove long em-dashes. Rewrite so it reads human.
13. `/privacy` and `/terms` copy should sound more professional.
14. Update `RESUME_URL` in `src/config/links.ts` to the new Drive file id
    `1pTIyviXM0fCCkXeX6LveYXvr7QD2TD0j`.

### Components / detail pages
15. Project status ("Building", "Completed", etc.) should render in a box, colored per status.
16. Connect section: left side = email as a button. Right side = profile only.
17. Individual project page markdown rendering is off: spacing between heading and body text,
    font sizing, spacing between buttons and text.
18. All external links must open in a new tab, including "Open live".
19. A GFM task list renders both a checkbox and a bullet dot. Should show only the checkbox.

### Launch chores
20. Delete the `sample-project` demo: `src/content/projects/sample-project.md`,
    `src/pages/live/sample-project.tsx`, its `HOSTED_LIVE_PAGES` entry in
    `src/pages/live/registry.ts`, and `src/pages/live/sample-project.test.tsx`
    (plus any fixtures/tests that assert it). `.dev/website-revamp/review-2026-08-31-1000.md`
    rehearsed this deletion end-to-end; follow that rehearsal.
21. Open a PR from `website-revamp` to `main` at the end (this exercises the PR-preview workflow
    = SP08 Task 7). Do NOT merge to main — that cutover is the owner's call.

## Constraints
- Work only on branch `website-revamp`. Commit per task / small batch.
- Every change must keep `npm run typecheck`, `npm run lint`, `npm test`, `npm run check:launch`,
  `npm run check:no-forms`, and `npm run build` green.
- No new dependencies without a strong reason.
- Do not fabricate biographical facts. Copy rewrites must preserve factual claims already in the
  repo; only the voice changes.
