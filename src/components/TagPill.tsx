import type { ReactNode } from 'react';

interface TagPillProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TagPill({ children, active = false, onClick, className = '' }: TagPillProps) {
  const Tag = onClick ? 'button' : 'span';
  const base = 'border px-2 py-1 text-[0.62rem] font-semibold transition sm:text-[0.66rem]';
  const tone = active
    ? 'border-teal bg-teal text-white'
    : 'border-teal-secondary/15 bg-cream text-teal-secondary';
  return (
    <Tag onClick={onClick} className={`${base} ${tone} ${className}`}>
      {children}
    </Tag>
  );
}
