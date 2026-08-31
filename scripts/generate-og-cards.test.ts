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
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { localImageDataUri, cardJsx, readCollection } from './generate-og-cards.mjs';

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

// Security regression (verified finding): readCollection() used to read
// `slug` straight out of frontmatter with no check against the filename
// (unlike src/data/shared.ts's assertSlugMatchesFilename), and main() then
// does `path.join(ROOT, 'public/og', outDir, `${item.slug}.png`)` ->
// writeFileSync. A slug of "../../../../tmp/pwned-poc" resolves that join
// straight out of public/og/ — an arbitrary-file-write primitive that runs
// via the `prebuild` npm script before anything else validates the slug.
// readCollection's own dir (src/content/<dirName>) is hardcoded, not
// parameterized, so these tests exercise it against a real, throwaway
// fixture collection directory under src/content/ — created and torn down
// per test, same pattern scripts/check-no-forms.test.ts uses against the
// real src/pages/live/.
describe('readCollection slug validation', () => {
  const fixtureDirName = '__test-fixture-og-collection__';
  const fixtureDir = path.resolve(import.meta.dirname, '../src/content', fixtureDirName);

  afterEach(() => {
    if (existsSync(fixtureDir)) rmSync(fixtureDir, { recursive: true, force: true });
  });

  it('throws, naming the file and value, for a traversal slug', () => {
    mkdirSync(fixtureDir, { recursive: true });
    writeFileSync(
      path.join(fixtureDir, 'evil.md'),
      '---\nslug: ../../../../tmp/pwned-poc\ntitle: Evil\n---\nBody.\n',
    );

    expect(() => readCollection(fixtureDirName)).toThrow(/evil\.md.*pwned-poc/s);
  });

  it('throws, naming the file, for a slug containing a path separator (no ".." needed)', () => {
    mkdirSync(fixtureDir, { recursive: true });
    writeFileSync(
      path.join(fixtureDir, 'evil2.md'),
      '---\nslug: sub/dir-escape\ntitle: Evil2\n---\nBody.\n',
    );

    expect(() => readCollection(fixtureDirName)).toThrow(/evil2\.md/);
  });

  it('throws, naming the file, for a slug that does not match its filename', () => {
    mkdirSync(fixtureDir, { recursive: true });
    writeFileSync(
      path.join(fixtureDir, 'real-name.md'),
      '---\nslug: different-slug\ntitle: Mismatch\n---\nBody.\n',
    );

    expect(() => readCollection(fixtureDirName)).toThrow(/real-name\.md.*different-slug/s);
  });

  it('does not throw for a valid, matching slug', () => {
    mkdirSync(fixtureDir, { recursive: true });
    writeFileSync(
      path.join(fixtureDir, 'valid-slug.md'),
      '---\nslug: valid-slug\ntitle: Valid\n---\nBody.\n',
    );

    expect(readCollection(fixtureDirName)).toEqual([{ slug: 'valid-slug', title: 'Valid' }]);
  });
});

// Coverage-audit gap A / PRD §7's fifth bullet — "A real rendered-output
// smoke test": main() run once against the real src/content/{projects,research}
// directories should produce exactly one PNG per content file plus
// default.png, each readable and reporting 1200x630 when its own header
// bytes are parsed. Every test above this point covers only the pure
// helpers (localImageDataUri, cardJsx, readCollection) — satori/resvg never
// actually run, so nothing before this test proves the pipeline produces a
// real, correctly-sized image.
//
// `main()` and `renderCard()` are NOT exported (only readCollection,
// localImageDataUri, and cardJsx are — see this file's header comment), and
// `main()` hardcodes its output path to `path.join(ROOT, 'public/og', ...)`
// — the real repo's own public/og/ — with no parameter to redirect it
// elsewhere. Calling the real main() here would therefore overwrite the
// repo's real, committed OG assets on every test run, which the task
// explicitly rules out. So this test reproduces main()'s own render loop by
// hand: the same satori -> Resvg -> PNG-bytes call renderCard() makes
// internally (scripts/generate-og-cards.mjs:167-173), fed by the exact same
// exported helpers main() itself calls (readCollection, cardJsx,
// localImageDataUri) against the real content directories, writing PNGs to
// a throwaway directory under os.tmpdir() instead. The only thing this
// doesn't exercise that a real main() run would is main()'s own
// mkdirSync/writeFileSync/assertWithinOgRoot plumbing — three lines of
// direct fs calls with no interesting logic of their own; the actual
// interesting proof (does readCollection's real data survive a genuine
// satori render into a correctly-sized PNG) is exactly what this test runs
// for real.
describe('real rendered-output smoke test (main()\'s pipeline, redirected to a temp dir)', () => {
  const CARD_WIDTH = 1200;
  const CARD_HEIGHT = 630;
  const SITE_NAME = 'Tejit Pabari'; // duplicated from generate-og-cards.mjs's own SITE_NAME — see that file's comment on why this one-string duplication is accepted.

  const repoRoot = path.resolve(import.meta.dirname, '..');
  const fontDir = path.join(repoRoot, 'scripts/assets/fonts');
  const fonts = [
    { name: 'Montserrat', weight: 700 as const, style: 'normal' as const, data: readFileSync(path.join(fontDir, 'Montserrat-Bold.ttf')) },
    { name: 'Montserrat', weight: 600 as const, style: 'normal' as const, data: readFileSync(path.join(fontDir, 'Montserrat-SemiBold.ttf')) },
    { name: 'Montserrat', weight: 400 as const, style: 'normal' as const, data: readFileSync(path.join(fontDir, 'Montserrat-Regular.ttf')) },
  ];

  let outDir: string;

  beforeAll(() => {
    outDir = path.join(os.tmpdir(), `og-card-smoke-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(path.join(outDir, 'projects'), { recursive: true });
    mkdirSync(path.join(outDir, 'research'), { recursive: true });
  });

  afterAll(() => {
    if (outDir && existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  });

  async function renderCardToTemp(
    props: { title: string; tags: string[]; status: string | undefined; imageDataUri: string | null },
    outPath: string,
  ) {
    // Mirrors renderCard() in generate-og-cards.mjs verbatim (minus its
    // assertWithinOgRoot call, which is specific to the real public/og/
    // path this test deliberately avoids writing into).
    const svg = await satori(cardJsx(props), { width: CARD_WIDTH, height: CARD_HEIGHT, fonts });
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: CARD_WIDTH } }).render().asPng();
    writeFileSync(outPath, png);
  }

  /** Parses a PNG's own IHDR chunk (bytes 16-23: width, then height, each a
   *  big-endian uint32) rather than shelling out to `file` or trusting a
   *  library — the literal header bytes are the actual proof of size. */
  function readPngDimensions(filePath: string): { width: number; height: number } {
    const buf = readFileSync(filePath);
    expect(buf.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a'); // PNG signature
    expect(buf.subarray(12, 16).toString('ascii')).toBe('IHDR');
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  it(
    'renders exactly one real PNG per content file plus default.png, each reporting 1200x630 from its own header bytes',
    async () => {
      const collections: { dirName: 'projects' | 'research'; outSubdir: string }[] = [
        { dirName: 'projects', outSubdir: 'projects' },
        { dirName: 'research', outSubdir: 'research' },
      ];

      let expectedCount = 1; // default.png
      for (const { dirName, outSubdir } of collections) {
        const items = readCollection(dirName);
        expect(items.length).toBeGreaterThan(0); // sanity: the real content dir isn't empty
        expectedCount += items.length;

        for (const item of items) {
          const outPath = path.join(outDir, outSubdir, `${item.slug}.png`);
          await renderCardToTemp(
            {
              title: item.title,
              tags: Array.isArray(item.tags) ? item.tags : [],
              status: typeof item.status === 'string' ? item.status : undefined,
              imageDataUri: localImageDataUri(item.image),
            },
            outPath,
          );
        }
      }
      await renderCardToTemp({ title: SITE_NAME, tags: [], status: undefined, imageDataUri: null }, path.join(outDir, 'default.png'));

      const allPngs = [
        ...readdirSync(path.join(outDir, 'projects')).map((f) => path.join(outDir, 'projects', f)),
        ...readdirSync(path.join(outDir, 'research')).map((f) => path.join(outDir, 'research', f)),
        path.join(outDir, 'default.png'),
      ];

      expect(allPngs).toHaveLength(expectedCount);

      for (const pngPath of allPngs) {
        expect(existsSync(pngPath)).toBe(true);
        const { width, height } = readPngDimensions(pngPath);
        expect({ file: path.basename(pngPath), width, height }).toEqual({
          file: path.basename(pngPath),
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
        });
      }
    },
    60_000, // generous: a real font-rendering satori + resvg pass per content file, not a mocked call
  );
});
