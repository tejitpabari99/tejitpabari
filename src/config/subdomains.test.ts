import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../../subdomains');
const json = (f: string) => JSON.parse(readFileSync(path.join(root, f), 'utf8'));

describe('subdomains hosting config', () => {
  const rc = json('.firebaserc');
  const fb = json('firebase.json');

  it('maps targets to sites in project tejitpabari-99', () => {
    expect(rc.projects.default).toBe('tejitpabari-99');
    expect(rc.targets['tejitpabari-99'].hosting).toEqual({
      nonprofit: ['tejitpabari-nonprofit'],
      healthtech: ['tejitpabari-healthtech'],
    });
  });

  it.each(['nonprofit', 'healthtech'])('configures %s hosting', (name) => {
    const entry = fb.hosting.find((h: { target: string }) => h.target === name);
    expect(entry).toBeTruthy();
    expect(entry.public).toBe(name);
    expect(entry.cleanUrls).toBe(true);
    expect(entry.rewrites).toContainEqual({ source: '**', destination: '/index.html' });
    const headers = Object.fromEntries(
      entry.headers[0].headers.map((h: { key: string; value: string }) => [h.key, h.value]),
    );
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Strict-Transport-Security']).toContain('includeSubDomains');
    expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
    expect(existsSync(path.join(root, name, 'index.html'))).toBe(true);
    expect(existsSync(path.join(root, name, 'style.css'))).toBe(true);
  });
});
