import { useContext } from 'react';
import { AccessContext, type AccessState } from './access-context';

export function useAccess(): AccessState {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error('useAccess must be used inside <RequireView>');
  return ctx;
}
