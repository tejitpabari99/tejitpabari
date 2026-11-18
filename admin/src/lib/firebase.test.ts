import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteApp, getApps } from 'firebase/app';

const mocks = vi.hoisted(() => ({ connectAuthEmulator: vi.fn(), connectFirestoreEmulator: vi.fn() }));

vi.mock('firebase/auth', async (orig) => ({
  ...(await orig<typeof import('firebase/auth')>()),
  connectAuthEmulator: mocks.connectAuthEmulator,
}));
vi.mock('firebase/firestore', async (orig) => ({
  ...(await orig<typeof import('firebase/firestore')>()),
  connectFirestoreEmulator: mocks.connectFirestoreEmulator,
}));

const SRC_PATH = path.resolve(import.meta.dirname, 'firebase.js');
const load = () => import('./firebase.js');

beforeEach(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
  vi.resetModules();
  mocks.connectAuthEmulator.mockClear();
  mocks.connectFirestoreEmulator.mockClear();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('firebase init', () => {
  it('does not init without a window (server/prerender context)', async () => {
    vi.stubGlobal('window', undefined);
    const m = await load();
    expect(m.app).toBeUndefined();
    expect(m.auth).toBeUndefined();
    expect(m.db).toBeUndefined();
    expect(getApps()).toHaveLength(0);
  });

  it('inits once in the browser', async () => {
    expect(getApps()).toHaveLength(0);
    const m = await load();
    expect(m.app && m.auth && m.db).toBeTruthy();
    expect(m.app.options.projectId).toBe('tejitpabari-99');
    expect(getApps()).toHaveLength(1);
  });

  it('reuses the existing app on re-import', async () => {
    const a = await load();
    vi.resetModules(); // fresh module evaluation, app already registered
    const b = await load();
    expect(b.app).toBe(a.app);
    expect(getApps()).toHaveLength(1);
  });

  it('SP03 marker comments sit between app init and services', () => {
    const src = readFileSync(SRC_PATH, 'utf8');
    const i = src.indexOf('initializeApp(firebaseConfig)');
    const m1 = src.indexOf('// SP05: initAppCheck(app)');
    const m2 = src.indexOf('// SP05: no getAI here');
    const s = src.indexOf('getAuth(app)');
    expect(i).toBeGreaterThan(-1);
    expect(i < m1 && m1 < m2 && m2 < s).toBe(true);
  });
});

describe('emulator connection', () => {
  it('uses an inline flag guard (no optional chaining) so prod builds drop the literals', () => {
    const src = readFileSync(SRC_PATH, 'utf8');
    expect(src).toContain("if (import.meta.env.VITE_USE_EMULATORS === 'true')");
    expect(src).not.toMatch(/import\.meta\.env\?\./);
    const guard = src.indexOf("if (import.meta.env.VITE_USE_EMULATORS === 'true')");
    expect(src.indexOf('127.0.0.1')).toBeGreaterThan(guard);
  });

  it("connects auth (9099) and firestore (8080) when flag is 'true'", async () => {
    vi.stubEnv('VITE_USE_EMULATORS', 'true');
    const m = await load();
    expect(mocks.connectAuthEmulator).toHaveBeenCalledWith(m.auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    expect(mocks.connectFirestoreEmulator).toHaveBeenCalledWith(m.db, '127.0.0.1', 8080);
  });

  it.each([undefined, '', 'false', 'TRUE', '1'])('does not connect when flag is %j', async (v) => {
    if (v !== undefined) vi.stubEnv('VITE_USE_EMULATORS', v);
    await load();
    expect(mocks.connectAuthEmulator).not.toHaveBeenCalled();
    expect(mocks.connectFirestoreEmulator).not.toHaveBeenCalled();
  });

  it('does not reconnect when reusing an existing app', async () => {
    vi.stubEnv('VITE_USE_EMULATORS', 'true');
    await load();
    mocks.connectAuthEmulator.mockClear();
    mocks.connectFirestoreEmulator.mockClear();
    vi.resetModules();
    await load();
    expect(mocks.connectAuthEmulator).not.toHaveBeenCalled();
    expect(mocks.connectFirestoreEmulator).not.toHaveBeenCalled();
  });
});
