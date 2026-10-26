export function ExternalLinkIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none"
      stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 5h5v5" />
      <path d="M19 5l-9 9" />
      <path d="M9 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" />
    </svg>
  );
}
