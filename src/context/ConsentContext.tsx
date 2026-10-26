// src/context/ConsentContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadGa, disableGa } from '@/lib/analytics';

type ConsentValue = 'unset' | 'granted' | 'denied';
const STORAGE_KEY = 'tejitpabari:consent'; // namespaced — different site/property than juno-landing-page's

type ConsentContextShape = {
  consent: ConsentValue;
  hydrated: boolean;
  grant: () => void;
  decline: () => void;
  clearConsent: () => void;
};

const ConsentContext = createContext<ConsentContextShape | null>(null);

function readStoredConsent(): ConsentValue {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'granted' || raw === 'denied' ? raw : 'unset';
  } catch {
    return 'unset'; // private browsing / storage disabled
  }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  // Must start at the literal 'unset' on both the build-time render and the
  // first client render — a synchronous localStorage read as the useState
  // initializer would bake a consent state into prerendered HTML and mismatch
  // on hydration for returning visitors. Resolved post-mount only, below.
  const [consent, setConsent] = useState<ConsentValue>('unset');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredConsent();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(stored);
    setHydrated(true);
    if (stored === 'granted') loadGa();
  }, []);

  function grant(): void {
    // Synchronous, in the click handler — not from an effect keyed on
    // `consent` — because React doesn't guarantee AnalyticsListener's effect
    // runs after this commit; an effect-based load could race the first
    // page_view it's supposed to enable.
    loadGa();
    try {
      localStorage.setItem(STORAGE_KEY, 'granted');
    } catch {
      /* best-effort; consent still applies for this session */
    }
    setConsent('granted');
  }

  function decline(): void {
    try {
      localStorage.setItem(STORAGE_KEY, 'denied');
    } catch {
      /* best-effort */
    }
    setConsent('denied');
  }

  function clearConsent(): void {
    // Implements the "Clear my choice" affordance on /privacy. Beyond
    // resetting the stored choice and in-memory state (which is all this used
    // to do), this must also stop Google Analytics from sending further hits
    // this session and remove any analytics cookies already on the device —
    // see analytics.ts's disableGa() and PRD 05 (R5) §4.1/§4.2 for why the
    // old version of this function was an incomplete fix, not a broken one.
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* best-effort */
    }
    disableGa();
    setConsent('unset');
  }

  return (
    <ConsentContext.Provider value={{ consent, hydrated, grant, decline, clearConsent }}>
      {children}
    </ConsentContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConsent(): ConsentContextShape {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}
