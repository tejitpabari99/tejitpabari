// src/pages/live/sample-project.tsx
//
// SCAFFOLDING — NOT A REAL HOSTED MINI-PROJECT. Exists to prove the hosted
// `/live` path (SP04 §4.6/§4.7) works end to end, and to give share-preview
// testing a safe subject. Delete this file, its src/content/projects/
// counterpart, and its HOSTED_LIVE_PAGES entry once share previews are
// confirmed on the real domain — see PRD 06 §8.
//
// Contains ZERO input-accepting markup by design — no input element, form
// element, textarea element, file upload, or anything else a visitor can
// type into and submit. This keeps `npm run check:no-forms` (SP04 §4.8)
// green and keeps /privacy's and /terms's "no forms" claim (SP05 §4.7's
// fragility guard) true. (Deliberately not spelling the literal tag
// syntax here — check-no-forms.sh's grep matches on angle-bracket tag
// text wherever it appears, comments included, so this comment avoids
// tripping its own guard.)
import { useEffect, useState } from 'react';

export default function SampleProjectLive() {
  // Hydration-safe: `null` on the build-time render and the first client
  // render. The real, ticking value is supplied only after mount.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-content flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-secondary">Sample Project — hosted /live demo</p>
      <p className="text-[2rem] font-extrabold tracking-tight text-ink sm:text-[2.6rem]" aria-live="polite">
        {now ? now.toLocaleString() : '—'}
      </p>
      <p className="max-w-md text-sm text-body">
        This page is scaffolding, not a real hosted mini-project — it exists to prove `/projects/sample-project/live`
        renders directly (no redirect) and updates every second from the visitor&rsquo;s own clock, not a stale build
        timestamp.
      </p>
    </div>
  );
}
