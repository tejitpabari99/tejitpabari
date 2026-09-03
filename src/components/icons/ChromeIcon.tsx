// src/components/icons/ChromeIcon.tsx
//
// Hand-rolled, in the same style as GitHubIcon.tsx / LinkedInIcon.tsx
// (lucide-react ships no brand/logo icons - see iconRegistry.ts's header
// comment). A simplified, monochrome silhouette evoking the Chrome
// browser's three-spoke circular mark, not a reproduction of the exact
// brand artwork: an outer ring, a center dot, and three spokes.
export function ChromeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
      <path d="M12 3v6.3" />
      <path d="M5.4 16.4l5.6-3.2" />
      <path d="M18.6 16.4l-5.6-3.2" />
    </svg>
  );
}
