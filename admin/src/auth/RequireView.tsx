import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { canView } from '../lib/access.js';
import { getSettings } from '../lib/settings.js';
import { AccessContext, type AccessState } from './access-context';
import { SignInGate } from './SignInGate';
import { useAuth } from './useAuth';

// Layout route: waits for auth + settings, then renders the page or the gate in place (URL unchanged).
// Pages are only mounted when allowed, so their loaders never query Firestore for denied routes.
export function RequireView() {
  const { authReady, role } = useAuth();
  const { pathname } = useLocation();
  const [guestVisibility, setGuestVisibility] = useState<Record<string, boolean> | null>(null);
  const [settingsError, setSettingsError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    getSettings().then(
      (s: { guestVisibility?: Record<string, boolean> }) => {
        if (cancelled) return;
        setGuestVisibility(s.guestVisibility || {});
        setSettingsError(null);
      },
      (e: unknown) => {
        if (cancelled) return;
        setGuestVisibility({});
        setSettingsError(e instanceof Error ? e : new Error(String(e)));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [authReady, role, pathname, attempt]);

  const ready = authReady && guestVisibility !== null;
  const value = useMemo<AccessState>(() => {
    const gv = guestVisibility ?? {};
    return { guestVisibility: gv, allowed: ready && canView(pathname, role, gv) };
  }, [ready, guestVisibility, pathname, role]);

  if (!ready) return <p className="mt-16 text-center text-sm text-slate">Loading…</p>;
  if (!value.allowed && settingsError) {
    return (
      <p role="alert" className="mt-16 text-center text-sm text-red-700">
        Could not load settings: {settingsError.message}{' '}
        <button type="button" className="underline" onClick={() => setAttempt((n) => n + 1)}>
          Retry
        </button>
      </p>
    );
  }
  return (
    <AccessContext.Provider value={value}>{value.allowed ? <Outlet /> : <SignInGate />}</AccessContext.Provider>
  );
}
