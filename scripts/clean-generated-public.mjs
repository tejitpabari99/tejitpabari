// scripts/clean-generated-public.mjs
//
// First step of `prebuild`. public/ is copied verbatim into every site's
// dist, and og/, sitemap.xml and robots.txt are all per-site generated
// (gitignored) files. Wipe them so a subsite build never inherits the
// previous (e.g. main's) cards or sitemap, then the generators rewrite them.
import { rmSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
export const GENERATED_PUBLIC = ['og', 'sitemap.xml', 'robots.txt'];

export function cleanGeneratedPublic(publicDir = path.join(ROOT, 'public')) {
  for (const name of GENERATED_PUBLIC) rmSync(path.join(publicDir, name), { recursive: true, force: true });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  cleanGeneratedPublic();
  console.log(`clean-generated-public: removed public/{${GENERATED_PUBLIC.join(',')}}`);
}
