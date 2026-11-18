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

  it.each(['nonprofit', 'healthtech'])('configures %s hosting', (name) => {
    const entry = fb.hosting.find((h) => h.target === name);
    expect(entry).toBeTruthy();
    expect(entry!.public).toBe(`hosting/${name}`);
    expect(entry!.cleanUrls).toBe(true);
    expect(entry!.rewrites).toContainEqual({ source: '**', destination: '/index.html' });
    const headers = Object.fromEntries(entry!.headers[0].headers.map((h) => [h.key, h.value]));
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Strict-Transport-Security']).toContain('includeSubDomains');
    expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
    expect(existsSync(path.join(root, entry!.public, 'index.html'))).toBe(true);
    expect(existsSync(path.join(root, entry!.public, 'style.css'))).toBe(true);
  });
});
