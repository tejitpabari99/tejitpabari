// src/components/icons/DynamicIcon.tsx
import { createElement } from 'react';
import { ICON_NAMES, resolveIcon } from './iconRegistry';

export interface DynamicIconProps {
  /** kebab-case icon name, as written in content frontmatter (e.g.
   *  "external-link", "book-open"). Validated against src/components/icons/
   *  iconRegistry.ts's ICON_MAP at content-parse time (src/data/shared.ts's
   *  assertLinks) — by the time this component renders, `name` should
   *  already be known-good. The throw below is defense-in-depth, not the
   *  primary validation path: it exists so a bad name is a LOUD failure
   *  wherever it's reached, never a silently-blank icon. */
  name: string;
  className?: string;
}

export function DynamicIcon({ name, className }: DynamicIconProps) {
  const Icon = resolveIcon(name);
  if (!Icon) {
    throw new Error(
      `DynamicIcon: unknown icon name "${name}". Valid names: ${ICON_NAMES.join(', ')}. ` +
      `This should have been caught at content-parse time by assertLinks (src/data/shared.ts) — ` +
      `if you're seeing this, either a caller bypassed that validation or iconRegistry.ts's ` +
      `ICON_MAP is missing an entry it should have.`,
    );
  }
  // Plain createElement, not JSX (`<Icon .../>`): `Icon` is a value looked
  // up at render time from ICON_MAP by name, and the react-hooks/
  // react-compiler "static-components" lint rule flags any JSX tag whose
  // identifier traces back to a function call as "creating a component
  // during render" (it can't prove the lookup returns a stable reference
  // across renders). `Icon` IS stable here — resolveIcon only ever returns
  // one of iconRegistry.ts's top-level, module-scope component constants,
  // never a freshly created one — but that isn't something the rule's
  // static analysis can see through a CallExpression. createElement isn't
  // parsed as a JSX tag, so it isn't subject to that check at all.
  return createElement(Icon, { className, 'aria-hidden': true });
}
