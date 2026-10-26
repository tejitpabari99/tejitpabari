// src/hooks/useContactMailto.ts
import { useEffect, useState } from 'react';
import { getContactEmailAddress } from '@/config/contact';

/**
 * Returns a real `mailto:` href, but only once this has mounted in a real
 * browser. Returns `null` on every render before that — including
 * vite-react-ssg's build-time render pass, which never runs effects. Callers
 * render the obfuscated display text as a plain, non-linked span while this
 * is `null`.
 */
export function useContactMailto(): string | null {
  const [href, setHref] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHref(`mailto:${getContactEmailAddress()}`);
  }, []);
  return href;
}
