// src/data/markdownComponents.tsx
import type { Components } from 'react-markdown';
import { isExternalUrl } from '@/lib/isExternalUrl';

export const markdownComponents: Components = {
  a({ href, children, ...props }) {
    const isExternal = typeof href === 'string' && isExternalUrl(href);
    return isExternal ? (
      <a href={href} target="_blank" rel="noreferrer" {...props}>{children}</a>
    ) : (
      <a href={href} {...props}>{children}</a>
    );
  },
};
