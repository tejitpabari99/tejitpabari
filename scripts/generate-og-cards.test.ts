// scripts/generate-og-cards.test.ts
//
// Task 15 (06-sharing-seo-sample-project TASKS.md) — per PRD §7's third
// bullet. Exercises `generate-og-cards.mjs`'s exported `localImageDataUri`
// directly — no real satori/resvg render, no `main()` invocation.
//
// This file intentionally lives under `scripts/`, not `src/`, and — like
// scripts/check-launch-content.test.ts (SP02) and scripts/check-no-forms.test.ts
// (SP04) before it — is excluded from vitest's default test discovery via
// `test.exclude` in vite.config.ts (`scripts/**`), so `npm test` (`vitest run`
// with no path argument) does not pick it up and its suite/test counts stay
// unaffected. Because Vitest applies `exclude` before a CLI path argument
// filters anything (vite.config.ts's own comment on this), a bare
// `npx vitest run scripts/generate-og-cards.test.ts` finds zero test
// files — confirmed empirically. Run it with the same lever
// `check:launch` uses to lift the `scripts/**` exclusion for one
// invocation: `CHECK_LAUNCH=1 npx vitest run scripts/generate-og-cards.test.ts`.
//
// Note: importing `./generate-og-cards.mjs` runs that module's top-level
// code, which reads the three vendored Montserrat .ttf files off disk
// (scripts/assets/fonts/) into the `fonts` array — those files are
// committed to the repo (PRD §4.3's "Font vendoring" note), so this import
// resolves identically here and in a clean CI checkout. The module's own
// `main()` is guarded behind `import.meta.url === file://process.argv[1]`,
// so importing it here never triggers a real render or writes to disk.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { localImageDataUri, cardJsx } from './generate-og-cards.mjs';

const UNSPLASH_PLACEHOLDER = 'https://images.unsplash.com/photo-1572177812156-58036aae439c';
const fixtureDir = path.resolve(import.meta.dirname, '../public/_fixture-images');

beforeAll(() => {
  mkdirSync(fixtureDir, { recursive: true });
  writeFileSync(path.join(fixtureDir, 'real.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
});
afterAll(() => rmSync(fixtureDir, { recursive: true, force: true }));

describe('localImageDataUri', () => {
  it('returns null for the exact Unsplash placeholder', () => {
    expect(localImageDataUri(UNSPLASH_PLACEHOLDER)).toBeNull();
  });

  it('returns null for any other remote URL', () => {
    expect(localImageDataUri('https://example.com/other.jpg')).toBeNull();
  });

  it('returns a data: URI for a local, root-relative path to a file that exists', () => {
    const result = localImageDataUri('/_fixture-images/real.png');
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('returns null (never throws) for a root-relative path to a missing file', () => {
    expect(localImageDataUri('/_fixture-images/does-not-exist.png')).toBeNull();
  });

  it('returns null for undefined/empty image values (no crash on a missing frontmatter field)', () => {
    expect(localImageDataUri(undefined)).toBeNull();
    expect(localImageDataUri('')).toBeNull();
  });
});

// Task 16 — the status-pill-only-when-set rule. Asserts on the JSX object
// `cardJsx()` returns before it's ever handed to `satori()` — no image
// rendering needed. Mirrors Med-Doc Tracker/Clip-Verse, the two launch
// projects that ship with no `status` (brief §6): a card with no pill and
// no reserved gap, not a default/"Unknown" pill.
function hasStatusPillNode(tree: ReturnType<typeof cardJsx>): boolean {
  const leftColumn = tree.props.children[0];
  const textGroup = leftColumn.props.children[0];
  return textGroup.props.children.some(
    (node: { props?: { children?: unknown } } | false) => node && node.props?.children === 'Completed',
  );
}

describe('cardJsx status pill', () => {
  it('includes a status-pill node when status is set', () => {
    const tree = cardJsx({ title: 'X', tags: [], status: 'Completed', imageDataUri: null });
    expect(hasStatusPillNode(tree)).toBe(true);
  });

  it('includes no status-pill node at all when status is undefined', () => {
    const tree = cardJsx({ title: 'X', tags: [], status: undefined, imageDataUri: null });
    expect(hasStatusPillNode(tree)).toBe(false);
  });

  it('the pill entry is filtered out of the children array entirely, not left as a false/null placeholder', () => {
    // Confirms the `.filter(Boolean)` behavior PRD §4.3 describes: no
    // reserved gap in the array, the entry is simply absent — a stray
    // `false`/`null`/`undefined` entry would mean satori is handed a
    // malformed child node.
    const tree = cardJsx({ title: 'X', tags: [], status: undefined, imageDataUri: null });
    const leftColumn = tree.props.children[0];
    const textGroup = leftColumn.props.children[0];
    expect(textGroup.props.children.every((node: unknown) => node !== false && node != null)).toBe(true);
  });
});
