// src/lib/AnalyticsListener.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useConsent } from '@/context/ConsentContext';
import { isGaLoaded, trackPageView } from '@/lib/analytics';

/** Renders nothing. Sends a GA4 page_view on every route change (including
 *  hash-only anchor navigation), once consent is granted. */
export function AnalyticsListener() {
  const location = useLocation();
  const { consent } = useConsent();

  useEffect(() => {
    if (consent !== 'granted' || !isGaLoaded()) return;
    trackPageView(location.pathname + location.hash);
  }, [location.pathname, location.hash, consent]);

  return null;
}
