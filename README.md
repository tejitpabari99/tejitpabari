# tejitpabari.com

`vite-react-ssg` (React 19 + Vite) prerendering every route to static HTML, styled with Tailwind, deployed to Firebase Hosting. Replaces the previous Gatsby 5 + Chakra UI scaffold.

See `.dev/website-revamp/BRIEF.md` for the full design record — palette, routes, content model, and every settled decision behind this rewrite.

See `.dev/IMAGE-SPECS.md` for the pixel dimensions, format, and file-size budget to source real project/research photos at, replacing the current shared Unsplash placeholder.

## Commands

- `npm run dev` — start the dev server
- `npm run typecheck` — `tsc --noEmit` only
- `npm run build` — typecheck, then build the static site to `dist/`
- `npm run preview` — serve the built `dist/` locally
- `npm test` — run the Vitest suite
- `npm run lint` — ESLint
- `npm run format` — Prettier, writes in place

## Deploy

`firebase deploy` (requires `firebase login` with access to the `tejitpabari-99` project). See `firebase.json`/`.firebaserc`.

## Pre-launch checklist

(Filled in as SP02/SP04 land their content-gate scripts — `npm run check:launch` and `npm run check:no-forms`. Not populated speculatively here; see `.dev/website-revamp/02-content-pipeline/` and `.dev/website-revamp/04-projects-research-pages/`.)
