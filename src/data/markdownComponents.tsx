// src/data/markdownComponents.tsx
import type { Components } from 'react-markdown';

export const markdownComponents: Components = {
  a({ href, children, ...props }) {
    // brief #18: every markdown link opens in a new tab — external and
    // internal alike (PRD §4.6). An internal link now does a full
    // browser page load of that route's prerendered HTML in the new tab
    // rather than a client-side route transition — an explicit, accepted
    // trade (there is currently no internal markdown link in any real
    // content file to notice the difference on).
    return (
      <a href={href} target="_blank" rel="noreferrer" {...props}>
        {children}
      </a>
    );
  },
};
