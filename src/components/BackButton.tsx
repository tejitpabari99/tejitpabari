import { Link } from 'react-router-dom';
import { ArrowIcon } from './icons/ArrowIcon';

export function BackButton({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-teal-secondary transition hover:text-teal ${className}`}
    >
      <ArrowIcon className="h-4 w-4 rotate-180" />
      Back
    </Link>
  );
}
