import { createContext } from 'react';
import type { User } from 'firebase/auth';

export type Role = 'admin' | 'guest';

export interface AuthState {
  user: User | null;
  authReady: boolean;
  role: Role;
}

export const AuthContext = createContext<AuthState | null>(null);
