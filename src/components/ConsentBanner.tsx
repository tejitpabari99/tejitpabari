// src/components/ConsentBanner.tsx
import { Link } from 'react-router-dom';
import { useConsent } from '@/context/ConsentContext';

export function ConsentBanner() {
  const { consent, hydrated, grant, decline } = useConsent();
  // `!hydrated` is required, not defensive: without it the banner renders
  // into every prerendered HTML file and flashes for visitors who already
  // decided.
  if (!hydrated || consent !== 'unset') return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-teal-secondary/15 bg-cream/97 px-4 py-4 shadow-panel backdrop-blur-sm sm:px-6">
      <div className="mx-auto flex max-w-content flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-body">
          I use Google Analytics to see whether people find this site — for example, from a
          LinkedIn post. It only runs, and only sets cookies, if you accept. See the{' '}
          <Link to="/privacy" className="underline hover:text-teal-secondary">Privacy Policy</Link>.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={decline}
            className="rounded-full border border-teal-secondary/20 px-4 py-2 text-sm font-semibold text-teal-secondary hover:bg-teal-secondary/8"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={grant}
            className="rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
