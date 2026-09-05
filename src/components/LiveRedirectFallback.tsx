// src/components/LiveRedirectFallback.tsx
//
// Client-side fallback for a /live route that doesn't render its own
// content (i.e. every case except `live: { type: self, ... }`): either
// `live: { type: external, href }` or the no-`live`-field guarantee that
// quietly redirects to the entry's own detail page. On a real deployed
// hit, vite.config.ts's live-redirects plugin already produces a Firebase
// Hosting 301 for these exact paths, so a cold share-link click never
// reaches this component at all — this is purely the fallback for
// contexts with no Hosting layer in front (`npm run dev`, `vite preview`)
// and for client-side navigation to a /live path after hydration.
import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

interface LiveRedirectFallbackProps {
  to: string;
  label: string;
}

export function LiveRedirectFallback({ to, label }: LiveRedirectFallbackProps) {
  useEffect(() => {
    // Only log an outbound_click for a genuinely external destination
    // (`live: { type: external, href }`) — when `to` is the internal
    // detail-page fallback (no `live` field at all), this is ordinary
    // in-site navigation, not an outbound click, and shouldn't be
    // reported as one. GA4's gtag.js sends events via
    // navigator.sendBeacon, purpose-built to survive the immediate
    // unload below, so no artificial delay is needed either way.
    if (/^https?:\/\//.test(to)) {
      trackEvent('outbound_click', { url: to, context: 'live_redirect', label });
    }
    window.location.replace(to);
  }, [to, label]);

  return (
    <div className="mx-auto max-w-content px-6 py-24 text-center">
      <p className="text-body">
        Redirecting you to {label}&hellip; If nothing happens,{' '}
        <a href={to} className="font-semibold text-teal-secondary underline">click here</a>.
      </p>
    </div>
  );
}
