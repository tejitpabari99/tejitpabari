// src/components/icons/DynamicIcon.test.tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { DynamicIcon } from './DynamicIcon';

describe('DynamicIcon', () => {
  it('renders an svg for a valid kebab-case name', () => {
    const { container } = render(<DynamicIcon name="external-link" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('normalizes a multi-word kebab-case name to the right Lucide component ("book-open" -> BookOpen)', () => {
    const { container } = render(<DynamicIcon name="book-open" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    // lucide-react's createLucideIcon stamps a `lucide-<kebab-name>` class
    // onto every rendered icon — a direct check that we resolved to the
    // BookOpen component specifically, not just "some svg".
    expect(svg).toHaveClass('lucide-book-open');
  });

  it('passes className through to the rendered svg', () => {
    const { container } = render(<DynamicIcon name="globe" className="h-4 w-4" />);
    expect(container.querySelector('svg')).toHaveClass('h-4', 'w-4');
  });

  it('throws a loud, named error for an unknown icon name', () => {
    expect(() => render(<DynamicIcon name="not-a-real-icon" />)).toThrow(/unknown icon name "not-a-real-icon"/);
  });
});
