// scripts/check-launch-content.test.ts
//
// Pre-launch content gate (SP02 Task 10 — PRD §4.9). Run via
// `npm run check:launch`, which invokes
// `vitest run scripts/check-launch-content.test.ts` directly.
//
// Why a vitest file instead of the plain `tsx scripts/check-launch-content.ts`
// script originally specified: `src/data`'s loaders (`projects.ts`,
// `workExperience.ts`) call `import.meta.glob(...)` at module top level.
// `import.meta.glob` is a Vite-only build-time macro — Vite statically
// rewrites it into real imports during its own transform pass; it has no
// runtime implementation of its own. `tsx` is esbuild-based and never runs
// a Vite transform, so importing `src/data` under `tsx` throws
// `TypeError: (intermediate value).glob is not a function`, unconditionally,
// regardless of content state. `npx vitest run` already imports `src/data`
// successfully in every other suite that touches it (e.g.
// `src/routes.smoke.test.tsx`) because Vitest runs everything through
// Vite's own transform. Reusing that same mechanism for the launch gate
// avoids adding a second module system (`vite-node` is not an installed
// dependency of this project) just to re-solve a problem Vitest already
// solves.
//
// This file intentionally lives under `scripts/`, not `src/`, and is
// excluded from vitest's default test discovery via `test.exclude` in
// vite.config.ts (`scripts/**`), so `npm test` (`vitest run` with no path
// argument) does not pick it up and its suite/test counts stay unaffected.
// `check:launch` names this file explicitly instead.
//
// The gate's contract is unchanged from TASKS.md Task 10's original spec:
// same two checks (no `DRAFT_DATE: true` left on a work-experience entry,
// no `demo: true` left on a project), same failure messages, same
// "names the offending file" behavior, exit 0 on a clean corpus and
// non-zero otherwise (vitest run's own pass/fail exit code IS that
// contract here — no separate process.exit call is needed).
import { describe, expect, it } from 'vitest';
import { projects, workExperience, type Project, type WorkExperience } from '../src/data';

export function checkLaunchContent(
  allProjects: Project[],
  allWorkExperience: WorkExperience[],
): { draftDates: WorkExperience[]; demoProjects: Project[] } {
  return {
    draftDates: allWorkExperience.filter((w) => w.draftDate),
    demoProjects: allProjects.filter((p) => p.demo === true),
  };
}

describe('pre-launch content gate', () => {
  it('has no work-experience entries with DRAFT_DATE: true remaining', () => {
    const { draftDates } = checkLaunchContent(projects, workExperience);
    if (draftDates.length > 0) {
      const lines = draftDates.map(
        (w) =>
          `  - src/content/work-experience/${w.id}.md still has DRAFT_DATE: true — supply real startDate/endDate and remove the marker.`,
      );
      expect.fail(`Pre-launch content check FAILED:\n\n${lines.join('\n')}`);
    }
    expect(draftDates).toEqual([]);
  });

  it('has no project entries with demo: true remaining', () => {
    const { demoProjects } = checkLaunchContent(projects, workExperience);
    if (demoProjects.length > 0) {
      const lines = demoProjects.map(
        (p) =>
          `  - src/content/projects/${p.slug}.md still has demo: true — delete the file before a real launch (see BRIEF §3, Sharing/SEO).`,
      );
      expect.fail(`Pre-launch content check FAILED:\n\n${lines.join('\n')}`);
    }
    expect(demoProjects).toEqual([]);
  });
});

// SP02 Task 15 (PRD §7, fourth bullet): exercise `checkLaunchContent`'s
// filter/report logic directly against in-memory fixtures, never through
// `projects`/`workExperience` (the real, loaded content — already covered
// above) and never through `main()`/`process.exit` (there is no `main()`
// here; `vitest run`'s own pass/fail exit code is the gate's contract, per
// the file-header note above). `checkLaunchContent` is defined and exported
// in this same file (not a separate `./check-launch-content` module) — see
// the file-header note on why the gate's logic lives here — so it's used
// directly with no additional import.
const cleanProject: Project = { slug: 'a', title: 'A', description: 'd', image: '/x.png', tags: ['Others'], links: [], date: '2024-01-01', body: '' };
const demoProject: Project = { ...cleanProject, slug: 'sample-project', demo: true };
const cleanWork: WorkExperience = { company: 'C', role: 'R', startDate: '2024-01-01', endDate: 'Present', links: [], draftDate: false, body: 'b', id: 'c' };
const draftWork: WorkExperience = { ...cleanWork, draftDate: true };

describe('checkLaunchContent', () => {
  it('reports a work-experience entry with draftDate: true', () => {
    const { draftDates } = checkLaunchContent([cleanProject], [cleanWork, draftWork]);
    expect(draftDates.map((w) => w.id)).toEqual(['c']);
  });

  it('reports a project with demo: true', () => {
    const { demoProjects } = checkLaunchContent([cleanProject, demoProject], [cleanWork]);
    expect(demoProjects.map((p) => p.slug)).toEqual(['sample-project']);
  });

  it('reports clean when neither marker is present', () => {
    const result = checkLaunchContent([cleanProject], [cleanWork]);
    expect(result.draftDates).toHaveLength(0);
    expect(result.demoProjects).toHaveLength(0);
  });
});
