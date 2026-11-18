// scripts/inject-csp-hashes.test.ts
//
// Proves inject-csp-hashes writes ONLY the `target: "main"` hosting entry
// of a multi-entry firebase.json, and throws a named error when `main` is
// missing. Like the other scripts/*.test.ts files it is excluded from
// `npm test`; run with `CHECK_LAUNCH=1 npx vitest run scripts/inject-csp-hashes.test.ts`.
import { describe, it, expect } from 'vitest';
import { findMainHosting, injectCspHashes } from './inject-csp-hashes.mjs';

function cspEntry(target: string, scriptSrc: string) {
  return {
    target,
    public: target,
    headers: [
      {
        source: '**',
        headers: [{ key: 'Content-Security-Policy', value: `default-src 'self'; ${scriptSrc}; object-src 'none'` }],
      },
    ],
  };
}

function fixture() {
  return {
    hosting: [
      cspEntry('admin', "script-src 'self' 'sha256-ADMINOLD='"),
      cspEntry('go', "script-src 'self'"),
      cspEntry('main', "script-src 'self' https://www.googletagmanager.com 'sha256-STALE='"),
      cspEntry('nonprofit', "script-src 'self'"),
      cspEntry('healthtech', "script-src 'self'"),
    ],
    firestore: { rules: 'firestore.rules' },
  };
}

describe('findMainHosting', () => {
  it('returns the entry whose target is "main", regardless of position', () => {
    const config = fixture();
    expect(findMainHosting(config)).toBe(config.hosting[2]);
  });

  it('throws a named error when no entry has target "main"', () => {
    const config = fixture();
    config.hosting = config.hosting.filter((h) => h.target !== 'main');
    expect(() => findMainHosting(config)).toThrow(/inject-csp-hashes: firebase\.json has no hosting entry with target "main"/);
  });
});

describe('findMainHosting legacy form', () => {
  it('rejects a single-object hosting (no target), since firebase.json is now an array', () => {
    expect(() => findMainHosting({ hosting: { public: 'dist' } })).toThrow(/target "main"/);
  });
});

describe('injectCspHashes', () => {
  it('rewrites only the main entry; the other four deep-equal their before state', () => {
    const config = fixture();
    const before = JSON.parse(JSON.stringify(config));

    injectCspHashes(config, ["'sha256-NEW1='", "'sha256-NEW2='"]);

    for (const i of [0, 1, 3, 4]) expect(config.hosting[i]).toEqual(before.hosting[i]);
    expect(config.firestore).toEqual(before.firestore);
    expect(config.hosting[2].headers[0].headers[0].value).toBe(
      "default-src 'self'; script-src 'self' https://www.googletagmanager.com 'sha256-NEW1=' 'sha256-NEW2='; object-src 'none'",
    );
  });

  it('throws and changes nothing when main is missing', () => {
    const config = fixture();
    config.hosting = config.hosting.filter((h) => h.target !== 'main');
    const before = JSON.parse(JSON.stringify(config));

    expect(() => injectCspHashes(config, ["'sha256-NEW='"])).toThrow(/target "main"/);
    expect(config).toEqual(before);
  });
});
