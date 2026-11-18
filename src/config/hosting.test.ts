import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
const json = (f: string) => JSON.parse(readFileSync(path.join(root, f), 'utf8'));

type Header = { key: string; value: string };
type HostingEntry = {
  target: string;
  public: string;
  cleanUrls?: boolean;
  rewrites?: { source: string; destination: string }[];
  headers: { source: string; headers: Header[] }[];
};

describe('root hosting config', () => {
  const rc = json('.firebaserc');
  const fb = json('firebase.json') as { hosting: HostingEntry[] };

  it('maps all 5 targets to sites in project tejitpabari-99', () => {
    expect(rc.projects.default).toBe('tejitpabari-99');
    expect(rc.targets['tejitpabari-99'].hosting).toEqual({
      main: ['tejitpabari-99'],
      admin: ['tejitpabari-admin'],
      go: ['tejitpabari-go'],
      nonprofit: ['tejitpabari-nonprofit'],
      healthtech: ['tejitpabari-healthtech'],
    });
  });

  it('has one hosting entry per mapped target', () => {
    expect(fb.hosting.map((h) => h.target).sort()).toEqual(
      Object.keys(rc.targets['tejitpabari-99'].hosting).sort(),
    );
  });

  describe.each(['nonprofit', 'healthtech'])('%s hosting', (name) => {
    const entry = () => fb.hosting.find((h) => h.target === name)!;
    const rule = (source: string) => entry().headers.find((r) => r.source === source);
    const global = () => Object.fromEntries(rule('**')!.headers.map((h) => [h.key, h.value]));
    const directive = (csp: string, d: string) => csp.split(';').map((x) => x.trim()).find((x) => x.startsWith(d + ' '));

    it('serves the built dist-<site> dir with cleanUrls and no SPA rewrite', () => {
      expect(entry()).toBeTruthy();
      expect(entry().public).toBe(`dist-${name}`);
      expect(entry().cleanUrls).toBe(true);
      expect(entry().rewrites).toBeUndefined();
      expect(JSON.stringify(entry())).not.toContain('"destination"');
    });

    it('has main-equivalent security and cache headers', () => {
      const g = global();
      expect(g['X-Content-Type-Options']).toBe('nosniff');
      expect(g['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(g['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains');
      expect(rule('**/assets/**')!.headers).toContainEqual({ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' });
      expect(rule('**/index.html')!.headers).toContainEqual({ key: 'Cache-Control', value: 'no-cache' });
    });

    it('has main\'s CSP (GTM-seeded script-src, hashes injected by the build)', () => {
      const csp = global()['Content-Security-Policy'];
      const mainCsp = Object.fromEntries(
        fb.hosting.find((h) => h.target === 'main')!.headers[0].headers.map((h) => [h.key, h.value]),
      )['Content-Security-Policy'];
      expect(directive(csp, 'script-src')).toMatch(/^script-src 'self' https:\/\/www\.googletagmanager\.com/);
      for (const d of ['default-src', 'style-src', 'font-src', 'img-src', 'frame-ancestors', 'base-uri', 'object-src', 'form-action']) {
        expect(directive(csp, d)).toBe(directive(mainCsp, d));
      }
      const mainConnect = directive(mainCsp, 'connect-src')!;
      expect(directive(csp, 'connect-src')).toBe(
        name === 'nonprofit' ? `${mainConnect} https://docs.google.com https://*.googleusercontent.com` : mainConnect,
      );
    });

    it('has no noindex / X-Robots-Tag', () => {
      const text = JSON.stringify(entry());
      expect(text).not.toMatch(/noindex/i);
      expect(text).not.toMatch(/X-Robots-Tag/i);
    });

    it('no longer has a committed hosting/<name> static dir', () => {
      expect(existsSync(path.join(root, 'hosting', name))).toBe(false);
    });
  });
});
