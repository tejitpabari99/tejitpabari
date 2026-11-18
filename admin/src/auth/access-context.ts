import { createContext } from 'react';

export interface AccessState {
  /** Whether the current role may view the current route (canView). */
  allowed: boolean;
  guestVisibility: Record<string, boolean>;
}

export const AccessContext = createContext<AccessState | null>(null);
