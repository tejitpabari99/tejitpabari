// scripts/site-aware-build.test.ts
//
// Per-site behaviour of the build scripts (01-multi-site-build Task 5).
// Fixture content dirs and fixture firebase.json data only; never the real
// firebase.json. Run with:
//   CHECK_LAUNCH=1 npx vitest run scripts/site-aware-build.test.ts
import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { currentSite, resolveSite, sitesOf, loadSites } from './lib/site-config.mjs';
import { sitemapUrlsForSite, sitemapXml, robotsTxt } from './generate-sitemap.mjs';
import { readCollection, cardCollections } from './generate-og-cards.mjs';
import { injectCspHashes, promote404 } from './inject-csp-hashes.mjs';
import { cleanGeneratedPublic } from './clean-generated-public.mjs';

const sites = loadSites();
const tmpDirs: string[] = [];
function tmp() {
  const d = mkdtempSync(path.join(tmpdir(), 'site-aware-'));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  while (tmpDirs.length) rmSync(tmpDirs.pop()!, { recursive: true, force: true });
});

function md(dir: string, slug: string, extra = '') {
  writeFileSync(path.join(dir, `${slug}.md`), `---\nslug: ${slug}\ntitle: ${slug}\n${extra}---\nBody\n`);
}

function contentFixture() {
  const root = tmp();
  const projectsDir = path.join(root, 'projects');
  const researchDir = path.join(root, 'research');
  const liveDir = path.join(root, 'live');
  for (const d of [projectsDir, researchDir, liveDir]) mkdirSync(d);
  md(projectsDir, 'only-main'); // no sites: => ['main']
  md(projectsDir, 'main-and-health', 'sites: [main, healthtech]\n');
  md(projectsDir, 'main-and-nonprofit', 'sites: [main, nonprofit]\n');
  md(projectsDir, 'health-only', 'sites: [healthtech]\n');
  md(projectsDir, 'live-main', 'live:\n  type: self\n  page: demo\n');
  md(projectsDir, 'live-nonprofit', 'sites: [nonprofit]\nlive:\n  type: self\n  page: demo\n');
  md(researchDir, 'study-one');
  writeFileSync(path.join(liveDir, 'registry.ts'), "export const HOSTED_LIVE_PAGES: Record<string, unknown> = {\n  'demo': Demo,\n};\n");
  writeFileSync(path.join(liveDir, 'demo.tsx'), 'export default function Demo() { return null; }\n');
  return { projectsDir, researchDir, liveDir };
}

describe('site-config', () => {
  it('defaults SITE to main and maps outDir to dist / dist-<site>', () => {
    expect(currentSite({}).site).toBe('main');
    expect(path.basename(currentSite({}).distDir)).toBe('dist');
    expect(path.basename(currentSite({ SITE: 'healthtech' }).distDir)).toBe('dist-healthtech');
    expect(path.basename(currentSite({ SITE: 'nonprofit' }).distDir)).toBe('dist-nonprofit');
  });
  it('rejects an unknown SITE', () => {
    expect(() => resolveSite('nope')).toThrow(/invalid SITE "nope"/);
  });
  it('treats a missing sites: field as main', () => {
    expect(sitesOf({})).toEqual(['main']);
    expect(sitesOf({ sites: ['nonprofit'] })).toEqual(['nonprofit']);
  });
});

describe('sitemap per site', () => {
  it('main: static routes + main projects + research + self-hosted /live', () => {
    const urls = sitemapUrlsForSite('main', sites.main, contentFixture());
    expect(urls).toEqual(expect.arrayContaining(sites.main.staticRoutes));
    expect(urls).toEqual(
      expect.arrayContaining([
        '/projects/only-main', '/projects/main-and-health', '/projects/main-and-nonprofit', '/projects/live-main',
        '/research/study-one', '/projects/live-main/live',
      ]),
    );
    expect(urls).not.toContain('/projects/health-only');
    expect(urls).not.toContain('/projects/live-nonprofit/live');
  });

  it('healthtech: its static routes + only healthtech projects, no research, no /live', () => {
    const urls = sitemapUrlsForSite('healthtech', sites.healthtech, contentFixture());
    expect([...urls].sort()).toEqual(['/', '/projects/health-only', '/projects/main-and-health']);
  });

  it('nonprofit: its static routes + only nonprofit projects, no /live even for a self-hosted one', () => {
    const urls = sitemapUrlsForSite('nonprofit', sites.nonprofit, contentFixture());
    expect([...urls].sort()).toEqual(['/', '/projects', '/projects/live-nonprofit', '/projects/main-and-nonprofit', '/schedule']);
    expect(urls.some((u) => u.endsWith('/live'))).toBe(false);
    expect(urls.some((u) => u.startsWith('/research') || u.includes('privacy'))).toBe(false);
  });

  it('xml <loc> uses the site url', () => {
    const xml = sitemapXml(sites.healthtech.url, ['/']);
    expect(xml).toContain('<loc>https://healthtech.tejitpabari.com/</loc>');
    expect(xml).not.toContain('https://tejitpabari.com');
  });
});

describe('robots.txt', () => {
  it('main output is unchanged from the committed-era content', () => {
    expect(robotsTxt(sites.main.url)).toBe('User-agent: *\nAllow: /\n\nSitemap: https://tejitpabari.com/sitemap.xml\n');
  });
  it.each(['healthtech', 'nonprofit'])('%s: Allow + own Sitemap line, no noindex', (site) => {
    const txt = robotsTxt(sites[site].url);
    expect(txt).toContain('Allow: /');
    expect(txt).toContain(`Sitemap: ${sites[site].url}/sitemap.xml`);
    expect(txt).not.toMatch(/noindex|Disallow/i);
  });
});

describe('og scope', () => {
  it('per-project cards cover only that site\'s projects (missing sites = main)', () => {
    const { projectsDir } = contentFixture();
    // readCollection resolves under src/content; exercise via a relative dir name.
    const rel = path.relative(path.resolve(import.meta.dirname, '../src/content'), projectsDir);
    const slugs = (site?: string) => readCollection(rel, site).map((d: { slug: string }) => d.slug).sort();
    expect(slugs('healthtech')).toEqual(['health-only', 'main-and-health']);
    expect(slugs('nonprofit')).toEqual(['live-nonprofit', 'main-and-nonprofit']);
    expect(slugs('main')).toEqual(['live-main', 'main-and-health', 'main-and-nonprofit', 'only-main']);
    expect(slugs()).toHaveLength(6);
  });
  it('research cards only for main; default card title comes from the site name', () => {
    expect(cardCollections(sites.main).map(([n]: string[]) => n)).toEqual(['projects', 'research']);
    expect(cardCollections(sites.healthtech).map(([n]: string[]) => n)).toEqual(['projects']);
    expect(cardCollections(sites.nonprofit).map(([n]: string[]) => n)).toEqual(['projects']);
    expect(sites.main.name).toBe('Tejit Pabari');
    expect(sites.healthtech.name).toBe('Tejit Pabari | Health Tech');
  });
});

function cspEntry(target: string, scriptSrc: string | null) {
  return {
    target,
    public: `dist-${target}`,
    headers: [
      {
        source: '**',
        headers: scriptSrc === null ? [] : [{ key: 'Content-Security-Policy', value: `default-src 'self'; ${scriptSrc}; object-src 'none'` }],
      },
    ],
  };
}
const fixtureFirebase = () => ({
  hosting: [
    cspEntry('main', "script-src 'self' https://www.googletagmanager.com 'sha256-MAINOLD='"),
    cspEntry('healthtech', "script-src 'self' https://www.googletagmanager.com 'sha256-HOLD='"),
    cspEntry('nonprofit', "script-src 'self' https://www.googletagmanager.com"),
    cspEntry('go', "script-src 'self'"),
  ],
  firestore: { rules: 'r' },
});

describe('inject-csp-hashes targeting', () => {
  it('writes only the requested target; every other entry stays byte-identical', () => {
    const config = fixtureFirebase();
    const before = fixtureFirebase();
    injectCspHashes(config, ["'sha256-NEW='"], 'healthtech');
    for (const i of [0, 2, 3]) expect(JSON.stringify(config.hosting[i])).toBe(JSON.stringify(before.hosting[i]));
    expect(JSON.stringify(config.firestore)).toBe(JSON.stringify(before.firestore));
    expect(config.hosting[1].headers[0].headers[0].value).toBe(
      "default-src 'self'; script-src 'self' https://www.googletagmanager.com 'sha256-NEW='; object-src 'none'",
    );
  });

  it('a second run with the same hashes produces no diff', () => {
    const config = fixtureFirebase();
    injectCspHashes(config, ["'sha256-A='", "'sha256-B='"], 'nonprofit');
    const once = JSON.stringify(config, null, 2);
    injectCspHashes(config, ["'sha256-A='", "'sha256-B='"], 'nonprofit');
    expect(JSON.stringify(config, null, 2)).toBe(once);
  });

  it('fails clearly (and changes nothing) when the target entry has no CSP header', () => {
    const config = fixtureFirebase();
    config.hosting[2] = cspEntry('nonprofit', null);
    const before = JSON.stringify(config);
    expect(() => injectCspHashes(config, ["'sha256-X='"], 'nonprofit')).toThrow(/"nonprofit" has no Content-Security-Policy/);
    expect(JSON.stringify(config)).toBe(before);
  });

  it('fails clearly when the target entry does not exist', () => {
    expect(() => injectCspHashes(fixtureFirebase(), ["'sha256-X='"], 'ghost')).toThrow(/target "ghost"/);
  });
});

describe('promote404', () => {
  it('copies 404/index.html to 404.html inside the given dist only', () => {
    const dist = path.join(tmp(), 'dist-healthtech');
    mkdirSync(path.join(dist, '404'), { recursive: true });
    writeFileSync(path.join(dist, '404', 'index.html'), '<html>nf</html>');
    promote404(dist);
    expect(readFileSync(path.join(dist, '404.html'), 'utf-8')).toBe('<html>nf</html>');
  });
  it('throws naming the dist dir when 404/index.html is missing', () => {
    const dist = path.join(tmp(), 'dist-nonprofit');
    mkdirSync(dist, { recursive: true });
    expect(() => promote404(dist)).toThrow(/dist-nonprofit\/404\/index\.html not found/);
  });
});

describe('cleanGeneratedPublic', () => {
  it('removes og/, sitemap.xml, robots.txt but leaves other public files', () => {
    const pub = tmp();
    mkdirSync(path.join(pub, 'og', 'projects'), { recursive: true });
    writeFileSync(path.join(pub, 'og', 'projects', 'x.png'), 'x');
    for (const f of ['sitemap.xml', 'robots.txt', 'favicon.png']) writeFileSync(path.join(pub, f), 'x');
    cleanGeneratedPublic(pub);
    expect(existsSync(path.join(pub, 'og'))).toBe(false);
    expect(existsSync(path.join(pub, 'sitemap.xml'))).toBe(false);
    expect(existsSync(path.join(pub, 'robots.txt'))).toBe(false);
    expect(existsSync(path.join(pub, 'favicon.png'))).toBe(true);
  });
  it('is a no-op on an already clean dir', () => {
    expect(() => cleanGeneratedPublic(tmp())).not.toThrow();
  });
});
