// src/components/LiveRedirectFallback.tsx
import { useEffect } from 'react';
import { BackButton } from './BackButton';
import { trackEvent } from '@/lib/analytics';

interface LiveRedirectFallbackProps {
  to: string;
  label: string;
  /** Internal BackButton target — passed through to BackButton's own `to`
   *  prop (R1's BackButton, `src/components/BackButton.tsx`). Omit to
   *  fall back to BackButton's own default ('/'); ProjectLivePage passes
   *  `/projects/<slug>` here so Back returns to the actual project this
   *  redirect came from, matching the hosted-mode branch's own
   *  BackButton target. Resolves R1's own open cross-project item on
   *  this file. */
  backTo?: string;
}

export function LiveRedirectFallback({ to, label, backTo }: LiveRedirectFallbackProps) {
  useEffect(() => {
    // The single point of truth for the live_redirect event, regardless of
    // how the visitor got here (direct URL, a shared link, this fallback
    // firing after the Hosting-level redirect was skipped). GA4's gtag.js
    // sends events via navigator.sendBeacon, which is purpose-built to
    // survive the immediate unload below — no artificial delay needed.
    trackEvent('outbound_click', { url: to, context: 'live_redirect', label });
    window.location.replace(to);
  }, [to, label]);

  return (
    <div className="mx-auto max-w-content px-6 py-24 text-center">
      <BackButton to={backTo} />
      <p className="mt-10 text-body">
        Redirecting you to {label}&hellip; If nothing happens,{' '}
        <a href={to} className="font-semibold text-teal-secondary underline">click here</a>.
      </p>
    </div>
  );
}
