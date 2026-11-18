import { useState } from 'react';
import { signInWithGoogle, signOutUser } from '../lib/auth-core.js';
import { useAuth } from './useAuth';

const IGNORED = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];

// Three states: signing in (admin, about to redirect) / signed in but not authorised / sign-in button.
export function SignInGate() {
  const { user, role } = useAuth();
  const [error, setError] = useState('');

  async function signIn() {
    setError('');
    try {
      await signInWithGoogle();
    } catch (e) {
      const err = e as { code?: string; message?: string };
      if (err?.code && IGNORED.includes(err.code)) return;
      setError(err?.message || 'Sign-in failed.');
    }
  }

  const btn = 'w-full rounded-pill bg-teal px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90';
  return (
    <div className="mx-auto mt-16 max-w-sm rounded-card bg-sage p-8">
      <h1 className="mb-1 text-xl font-semibold text-teal">admin.tejitpabari.com</h1>
      {role === 'admin' ? (
        <p className="text-sm text-body">Signing in…</p>
      ) : user ? (
        <>
          <p className="mb-6 text-sm text-body">Signed in as {user.email} (not authorised)</p>
          <button type="button" className={btn} onClick={signOutUser}>
            Sign out
          </button>
        </>
      ) : (
        <>
          <p className="mb-6 text-sm text-body">Sign in to continue</p>
          {error && (
            <p role="alert" className="mb-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button type="button" className={btn} onClick={signIn}>
            Sign in with Google
          </button>
        </>
      )}
    </div>
  );
}
