import { describe, expect, it } from 'vitest';
import { SITE_IDS } from '@/data';
import sites from './sites.json';
import { SITE, SITE_CONFIG } from './site-target';
import { SITE_NAME, SITE_URL } from './site';

describe('sites.json', () => {
  it('keys equal SITE_IDS and each entry id matches its key', () => {
    expect(Object.keys(sites).sort()).toEqual([...SITE_IDS].sort());
    for (const [k, v] of Object.entries(sites)) expect(v.id).toBe(k);
  });

  it('only main has live routes', () => {
    expect(Object.entries(sites).filter(([, v]) => v.hasLiveRoutes).map(([k]) => k)).toEqual(['main']);
  });
});

describe('site-target', () => {
  it('defaults to main and site.ts derives from config', () => {
    expect(SITE).toBe('main');
    expect(SITE_CONFIG.id).toBe('main');
    expect(SITE_URL).toBe('https://tejitpabari.com');
    expect(SITE_NAME).toBe('Tejit Pabari');
  });
});
