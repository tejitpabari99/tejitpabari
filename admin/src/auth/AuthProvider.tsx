import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuth, roleFor } from '../lib/auth-core.js';
import { AuthContext, type AuthState } from './auth-context';

// Subscribes once to auth state. Nothing role-dependent should render until
// authReady is true (first callback received).
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    return onAuth((u: User | null) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  const value = useMemo<AuthState>(() => ({ user, authReady, role: roleFor(user) }), [user, authReady]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
