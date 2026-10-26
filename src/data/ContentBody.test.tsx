// src/data/ContentBody.test.tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ContentBody } from './ContentBody';

describe('ContentBody', () => {
  it('renders null for an empty body', () => {
    const { container } = render(<ContentBody body="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders null for a whitespace-only body', () => {
    const { container } = render(<ContentBody body={'   \n  '} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the markdown for a non-empty body', () => {
    const { getByText } = render(<ContentBody body="Hello world" />);
    expect(getByText('Hello world')).toBeInTheDocument();
  });

  it('the wrapper carries prose, mt-6, and max-w-none — regression pin for the LinksRow gap fix (PRD §4.4)', () => {
    const { container } = render(<ContentBody body="Hello world" />);
    expect(container.firstElementChild).toHaveClass('prose', 'mt-6', 'max-w-none');
  });

  it('a GFM task list renders exactly two checkboxes with correct checked/disabled state', () => {
    const { container, getAllByRole } = render(<ContentBody body={'- [x] Done\n- [ ] Not done'} />);
    const checkboxes = getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[0]).toBeDisabled();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[1]).toBeDisabled();

    // The real DOM hook the typography-config CSS fix depends on —
    // pins the contract between remark-gfm's actual output and the
    // tailwind.config.ts selectors, so a future react-markdown/
    // remark-gfm upgrade that changes this class name fails this test
    // immediately instead of silently un-fixing the marker bug.
    expect(container.querySelectorAll('li.task-list-item')).toHaveLength(2);
    expect(container.querySelectorAll('ul.contains-task-list')).toHaveLength(1);
  });
});
