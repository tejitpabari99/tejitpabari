// scripts/generate-og-cards.mjs
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// Deliberately duplicated from src/config/site.ts — see PRD §4.1 for why
// this one-string duplication is accepted rather than solved with a shared
// module: this script runs as plain Node before any TS/bundler step exists.
const SITE_NAME = 'Tejit Pabari';

const ROOT = path.resolve(import.meta.dirname, '..');
const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

const CREAM = '#F7F1E8';
const TEAL = '#043439';
const TEAL_SECONDARY = '#0F4C45';
const INK = '#162b26';
const BODY_TEXT = '#3E514D';

// The one remote URL every real project/research file ships with today
// (SP07 §4.6) — the only value this script treats as "no real photo yet."
const UNSPLASH_PLACEHOLDER = 'https://images.unsplash.com/photo-1572177812156-58036aae439c';

// Mirrors src/data/shared.ts's assertSlugMatchesFilename: unlike that
// loader, this script's own output path is built directly from frontmatter
// `slug` (main()'s `path.join(ROOT, 'public/og', outDir, `${item.slug}.png`)`
// -> writeFileSync). Without this check, a slug of e.g.
// "../../../../tmp/pwned-poc" escapes public/og/ entirely — an
// arbitrary-file-write primitive running via the `prebuild` npm script
// before anything else in the pipeline validates the slug.
function assertValidSlug(filePath, filenameSlug, slug) {
  if (typeof slug !== 'string' || slug.length === 0) {
    throw new Error(`generate-og-cards.mjs: ${filePath}: missing or empty "slug" in frontmatter.`);
  }
  if (slug !== filenameSlug) {
    throw new Error(`generate-og-cards.mjs: ${filePath}: frontmatter "slug: ${slug}" does not match filename "${filenameSlug}.md".`);
  }
  if (slug.includes('/') || slug.includes('\\') || slug.includes('..')) {
    throw new Error(`generate-og-cards.mjs: ${filePath}: "slug: ${slug}" must not contain path separators or "..".`);
  }
}

export function readCollection(dirName) {
  const dir = path.join(ROOT, 'src/content', dirName);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const filePath = path.join(dir, f);
      const data = matter(readFileSync(filePath, 'utf-8')).data;
      const filenameSlug = f.replace(/\.md$/, '');
      assertValidSlug(filePath, filenameSlug, data.slug);
      return data;
    });
}

const fontDir = path.join(ROOT, 'scripts/assets/fonts');
const fonts = [
  { name: 'Montserrat', weight: 700, style: 'normal', data: readFileSync(path.join(fontDir, 'Montserrat-Bold.ttf')) },
  { name: 'Montserrat', weight: 600, style: 'normal', data: readFileSync(path.join(fontDir, 'Montserrat-SemiBold.ttf')) },
  { name: 'Montserrat', weight: 400, style: 'normal', data: readFileSync(path.join(fontDir, 'Montserrat-Regular.ttf')) },
];

/** Only a local, root-relative `public/` asset gets composited — the
 *  Unsplash placeholder (or any other remote URL) renders text-only. */
export function localImageDataUri(image) {
  if (!image || !image.startsWith('/') || image === UNSPLASH_PLACEHOLDER) return null;
  const filePath = path.join(ROOT, 'public', image.replace(/^\//, ''));
  if (!existsSync(filePath)) return null;
  const ext = path.extname(filePath).slice(1);
  const b64 = readFileSync(filePath).toString('base64');
  return `data:image/${ext};base64,${b64}`;
}

export function cardJsx({ title, tags, status, imageDataUri }) {
  return {
    type: 'div',
    props: {
      style: { width: CARD_WIDTH, height: CARD_HEIGHT, display: 'flex', backgroundColor: CREAM, fontFamily: 'Montserrat' },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              width: imageDataUri ? (CARD_WIDTH * 2) / 3 : CARD_WIDTH, height: '100%',
              padding: '64px 56px', borderTop: `6px solid ${TEAL}`,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column', gap: 20 },
                  children: [
                    status && {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex', alignSelf: 'flex-start', backgroundColor: TEAL, color: '#FFFFFF',
                          fontSize: 22, fontWeight: 600, padding: '6px 18px', borderRadius: 999,
                          textTransform: 'uppercase', letterSpacing: 1,
                        },
                        children: status,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex', fontSize: 58, fontWeight: 700, color: INK, lineHeight: 1.15,
                          maxHeight: 58 * 1.15 * 3, overflow: 'hidden',
                        },
                        children: title,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex', flexWrap: 'wrap', gap: 10 },
                        children: tags.map((tag) => ({
                          type: 'div',
                          props: {
                            style: {
                              display: 'flex', fontSize: 22, fontWeight: 600, color: TEAL_SECONDARY,
                              border: `2px solid ${TEAL_SECONDARY}`, borderRadius: 999, padding: '6px 18px',
                            },
                            children: tag,
                          },
                        })),
                      },
                    },
                  ].filter(Boolean),
                },
              },
              {
                type: 'div',
                props: { style: { display: 'flex', fontSize: 26, fontWeight: 600, color: BODY_TEXT }, children: 'tejitpabari.com' },
              },
            ],
          },
        },
        imageDataUri && {
          type: 'div',
          props: {
            style: { display: 'flex', width: CARD_WIDTH / 3, height: '100%' },
            children: [{ type: 'img', props: { src: imageDataUri, style: { width: '100%', height: '100%', objectFit: 'cover' } } }],
          },
        },
      ].filter(Boolean),
    },
  };
}

// Defense-in-depth: even with readCollection's own slug validation,
// confirm the resolved output path never leaves public/og/ before writing
// anything to disk.
const OG_ROOT = path.join(ROOT, 'public/og');
function assertWithinOgRoot(outPath) {
  const resolved = path.resolve(outPath);
  if (resolved !== OG_ROOT && !resolved.startsWith(OG_ROOT + path.sep)) {
    throw new Error(`generate-og-cards.mjs: refusing to write outside public/og/: ${resolved}`);
  }
}

async function renderCard(props, outPath) {
  assertWithinOgRoot(outPath);
  const svg = await satori(cardJsx(props), { width: CARD_WIDTH, height: CARD_HEIGHT, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: CARD_WIDTH } }).render().asPng();
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, png);
}

async function main() {
  for (const [dirName, outDir] of [['projects', 'projects'], ['research', 'research']]) {
    const items = readCollection(dirName);
    for (const item of items) {
      const outPath = path.join(ROOT, 'public/og', outDir, `${item.slug}.png`);
      await renderCard(
        { title: item.title, tags: Array.isArray(item.tags) ? item.tags : [], status: typeof item.status === 'string' ? item.status : undefined, imageDataUri: localImageDataUri(item.image) },
        outPath,
      );
      console.log(`  og/${outDir}/${item.slug}.png`);
    }
  }
  await renderCard({ title: SITE_NAME, tags: [], status: undefined, imageDataUri: null }, path.join(ROOT, 'public/og/default.png'));
  console.log('  og/default.png');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
