import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useContactMailto } from './useContactMailto';

describe('useContactMailto', () => {
  it('returns null on the very first render (before any effect flush), and the real mailto after effects settle', () => {
    // `renderHook` wraps the initial render in `act()`, which flushes the
    // mount effect before returning — so `result.current` alone only ever
    // shows the *final*, settled value. To honestly observe the very first
    // render's return value (before `setHref` from the effect has run), we
    // capture every render's return value as the hook body executes.
    const renders: (string | null)[] = [];
    const { result } = renderHook(() => {
      const href = useContactMailto();
      renders.push(href);
      return href;
    });

    // First render — happens before the mount effect has had any chance to
    // run — must be null. This is byte-identical to vite-react-ssg's
    // build-time Node render, which never runs effects at all.
    expect(renders[0]).toBeNull();

    // After the mount effect flushes, the hook settles on the real address.
    expect(result.current).toBe('mailto:tejitpabari99@gmail.com');
  });
});
