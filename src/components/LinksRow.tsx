// src/components/LinksRow.tsx
import type { Link as ContentLink } from '@/data'; // { label, href, icon?, primary? } - src/data/shared.ts
import { LinkButtons } from './LinkButtons';

interface LinksRowProps {
  links: ContentLink[];
}

export function LinksRow({ links }: LinksRowProps) {
  if (links.length === 0) return null;
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <LinkButtons links={links} size="md" />
    </div>
  );
}
