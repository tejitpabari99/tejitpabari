// src/routes.manifest.test.tsx
//
// "Main route set unchanged" guard (01-multi-site-build, Decision 8).
// Expands the route table's concrete static paths (getStaticPaths applied,
// '*' catch-all and unresolvable dynamic paths dropped) and compares them
// to src/routes.main-manifest.json, captured from the pre-multi-site tree.
// Regenerate deliberately with: UPDATE_MAIN_MANIFEST=1 npx vitest run src/routes.manifest.test.tsx
import { describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import type { RouteRecord } from 'vite-react-ssg';
import { routes } from './routes';
import manifest from './routes.main-manifest.json';

export function concretePaths(table: RouteRecord[], base = ''): string[] {
  const out: string[] = [];
  const prefix = base.replace(/\/$/, '');
  for (const r of table) {
    if (r.path === '*') continue;
    const seg = r.path ?? '';
    const joined = r.index ? base || '/' : seg.startsWith('/') ? seg : `${prefix}/${seg}`;
    if (typeof r.getStaticPaths === 'function') {
      for (const p of r.getStaticPaths() as string[]) {
        out.push(p.startsWith('/') ? p : `${prefix}/${p}`);
      }
    } else if (!joined.includes(':') && (r.index || (r.element && !r.children))) {
      out.push(joined);
    }
    if (r.children) out.push(...concretePaths(r.children, joined));
  }
  return [...new Set(out)].sort();
}

describe('main route set', () => {
  const actual = concretePaths(routes);

  if (process.env.UPDATE_MAIN_MANIFEST === '1') {
    writeFileSync(path.resolve(__dirname, 'routes.main-manifest.json'), JSON.stringify(actual, null, 2) + '\n');
  }

  it('is unchanged vs the committed main manifest', () => {
    expect(actual).toEqual(manifest);
  });
});
