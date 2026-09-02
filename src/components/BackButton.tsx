import { Link } from 'react-router-dom';
import { ArrowIcon } from './icons/ArrowIcon';

interface BackButtonProps {
  /** Where Back navigates. Defaults to the site root. Pages whose most
   * useful Back target is a specific parent (e.g. /projects/:slug going
   * back to /projects, not /) must pass it explicitly. Always a real
   * <Link>, never `navigate(-1)`: these pages are reachable by direct or
   * shared link, which may have no browser history to go back to. */
  to?: string;
  className?: string;
}

export function BackButton({ to = '/', className = '' }: BackButtonProps) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-teal-secondary transition hover:text-teal ${className}`}
    >
      <ArrowIcon className="h-4 w-4 rotate-180" />
      Back
    </Link>
  );
}
