import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Cb = (u: unknown) => void;
const h = vi.hoisted(() => ({ cb: null as null | ((u: unknown) => void), unsub: null as null | (() => void) }));

vi.mock('../lib/firebase.js', () => ({ auth: {} }));
vi.mock('firebase/auth', async (orig) => ({
  ...(await orig<typeof import('firebase/auth')>()),
  onAuthStateChanged: (_a: unknown, fn: Cb) => {
    h.cb = fn;
    h.unsub = vi.fn();
    return h.unsub;
  },
}));

import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';
import { currentRole } from '../lib/auth-core.js';

const OWNER = 'tejitpabari99@gmail.com';

function Probe() {
  const { user, authReady, role } = useAuth();
  return <p data-testid="p">{`${authReady}|${role}|${user ? 'user' : 'none'}`}</p>;
}
const text = () => screen.getByTestId('p').textContent;
const fire = (u: unknown) => act(() => h.cb!(u));

beforeEach(() => {
  h.cb = null;
  h.unsub = null;
});

describe('AuthProvider', () => {
  it('authReady is false before the first callback and true after', () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(text()).toBe('false|guest|none');
    fire(null);
    expect(text()).toBe('true|guest|none');
  });

  it('role flips on simulated sign-in / sign-out and currentRole() tracks it', () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    fire({ email: OWNER, emailVerified: true });
    expect(text()).toBe('true|admin|user');
    expect(currentRole()).toBe('admin');
    fire({ email: 'other@x.com', emailVerified: true });
    expect(text()).toBe('true|guest|user');
    expect(currentRole()).toBe('guest');
    fire({ email: OWNER, emailVerified: true });
    fire(null);
    expect(text()).toBe('true|guest|none');
    expect(currentRole()).toBe('guest');
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = render(<AuthProvider><Probe /></AuthProvider>);
    unmount();
    expect(h.unsub).toHaveBeenCalled();
  });

  it('useAuth outside a provider throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow();
    spy.mockRestore();
  });
});
