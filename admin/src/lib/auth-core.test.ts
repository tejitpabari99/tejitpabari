import { describe, expect, it, vi } from 'vitest';
import { currentRole, onAuth, roleFor } from './auth-core.js';

const OWNER = 'tejitpabari99@gmail.com';

describe('roleFor', () => {
  it('verified owner -> admin', () => expect(roleFor({ email: OWNER, emailVerified: true })).toBe('admin'));
  it('unverified owner -> guest', () => expect(roleFor({ email: OWNER, emailVerified: false })).toBe('guest'));
  it('other user -> guest', () => expect(roleFor({ email: 'x@y.com', emailVerified: true })).toBe('guest'));
  it('null/undefined/no email -> guest', () => {
    expect(roleFor(null)).toBe('guest');
    expect(roleFor(undefined)).toBe('guest');
    expect(roleFor({ emailVerified: true })).toBe('guest');
  });
  it('email compared case-insensitively', () =>
    expect(roleFor({ email: OWNER.toUpperCase(), emailVerified: true })).toBe('admin'));
});

describe('onAuth + currentRole', () => {
  it('forwards user to callback via injected onChange and tracks currentRole', () => {
    let fire: (u: unknown) => void = () => {};
    const unsub = vi.fn();
    const onChange = vi.fn((_a: unknown, fn: (u: unknown) => void) => {
      fire = fn;
      return unsub;
    });
    const cb = vi.fn();
    const stop = onAuth(cb, {} as never, onChange as never);
    expect(cb).not.toHaveBeenCalled();
    fire({ email: OWNER, emailVerified: true });
    expect(currentRole()).toBe('admin');
    expect(cb).toHaveBeenLastCalledWith({ email: OWNER, emailVerified: true });
    fire(null);
    expect(currentRole()).toBe('guest');
    expect(cb).toHaveBeenLastCalledWith(null);
    stop();
    expect(unsub).toHaveBeenCalled();
  });
});
