import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccess } from '../auth/useAccess';

export interface LoaderState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  /** Re-run the loader (e.g. after a write); keeps current data visible meanwhile. */
  reload: () => void;
}

// One-shot read. Does not run while the current route is not allowed (gate showing).
export function useLoader<T>(fn: () => Promise<T>, deps: unknown[] = []): LoaderState<T> {
  const { allowed } = useAccess();
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(allowed);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    // Starting a fetch is the external-sync point; flag loading here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    fnRef.current().then(
      (d) => {
        if (cancelled) return;
        setData(d);
        setLoading(false);
      },
      (e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error(String(e)));
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, tick, ...deps]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}
