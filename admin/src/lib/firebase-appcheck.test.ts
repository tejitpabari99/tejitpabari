import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteApp, getApps } from 'firebase/app';

const order: string[] = [];
const mocks = vi.hoisted(() => ({
  initializeAppCheck: vi.fn(),
  provider: vi.fn(),
}));

vi.mock('firebase/app-check', () => ({
  initializeAppCheck: (...a: unknown[]) => {
    order.push('appcheck');
    return mocks.initializeAppCheck(...a);
  },
  ReCaptchaEnterpriseProvider: class {
    constructor(key: string) {
      mocks.provider(key);
    }
  },
}));
vi.mock('firebase/auth', async (orig) => {
  const real = await orig<typeof import('firebase/auth')>();
  return {
    ...real,
    getAuth: (...a: Parameters<typeof real.getAuth>) => {
      order.push('auth');
      return real.getAuth(...a);
    },
  };
});
vi.mock('firebase/firestore', async (orig) => {
  const real = await orig<typeof import('firebase/firestore')>();
  return {
    ...real,
    getFirestore: (...a: Parameters<typeof real.getFirestore>) => {
      order.push('firestore');
      return real.getFirestore(...a);
    },
  };
});

const load = () => import('./firebase.js');
const g = globalThis as Record<string, unknown>;

beforeEach(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
  vi.resetModules();
  order.length = 0;
  mocks.initializeAppCheck.mockClear();
  mocks.provider.mockClear();
  delete g.FIREBASE_APPCHECK_DEBUG_TOKEN;
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete g.FIREBASE_APPCHECK_DEBUG_TOKEN;
});

describe('App Check init', () => {
  it('initializes before auth and firestore, with reCAPTCHA Enterprise + auto-refresh', async () => {
    vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', 'site-key-123');
    const m = await load();
    expect(mocks.provider).toHaveBeenCalledWith('site-key-123');
    expect(mocks.initializeAppCheck).toHaveBeenCalledTimes(1);
    const [app, opts] = mocks.initializeAppCheck.mock.calls[0];
    expect(app).toBe(m.app);
    expect(opts.isTokenAutoRefreshEnabled).toBe(true);
    expect(opts.provider).toBeDefined();
    expect(order.indexOf('appcheck')).toBeGreaterThanOrEqual(0);
    expect(order.indexOf('appcheck')).toBeLessThan(order.indexOf('auth'));
    expect(order.indexOf('appcheck')).toBeLessThan(order.indexOf('firestore'));
  });

  it('skips with a console warning when the site key is empty', async () => {
    vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = await load();
    expect(mocks.initializeAppCheck).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(m.auth).toBeTruthy();
  });

  it('does not init without a window', async () => {
    vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', 'k');
    vi.stubGlobal('window', undefined);
    await load();
    expect(mocks.initializeAppCheck).not.toHaveBeenCalled();
  });

  it('does not re-init App Check when reusing an existing app', async () => {
    vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', 'k');
    await load();
    vi.resetModules();
    await load();
    expect(mocks.initializeAppCheck).toHaveBeenCalledTimes(1);
  });
});

describe('debug token (DEV only)', () => {
  it('uses VITE_APPCHECK_DEBUG_TOKEN under DEV', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', 'k');
    vi.stubEnv('VITE_APPCHECK_DEBUG_TOKEN', 'tok-abc');
    await load();
    expect(g.FIREBASE_APPCHECK_DEBUG_TOKEN).toBe('tok-abc');
  });

  it('falls back to true under DEV when the token var is empty', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', 'k');
    vi.stubEnv('VITE_APPCHECK_DEBUG_TOKEN', '');
    await load();
    expect(g.FIREBASE_APPCHECK_DEBUG_TOKEN).toBe(true);
  });

  it('is not set outside DEV', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', 'k');
    vi.stubEnv('VITE_APPCHECK_DEBUG_TOKEN', 'tok-abc');
    await load();
    expect(g.FIREBASE_APPCHECK_DEBUG_TOKEN).toBeUndefined();
    expect(mocks.initializeAppCheck).toHaveBeenCalledTimes(1);
  });
});
