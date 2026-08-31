// src/components/EmptyState.test.tsx
//
// Task 18 per .dev/website-revamp/04-projects-research-pages/TASKS.md —
// covers Task 3's acceptance criteria for the pure-presentational
// EmptyState component. Fixture props only.
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the query-only copy variant and a "Clear search" button when only query is set', () => {
    const { container } = render(<EmptyState itemLabel="projects" query="xyz" activeTag={null} onClear={vi.fn()} />);

    const paragraph = container.querySelector('p');
    expect(paragraph?.textContent).toBe('No projects match “xyz”.');
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });

  it('renders the tag-only copy variant and a "Clear tag filter" button when only activeTag is set', () => {
    const { container } = render(<EmptyState itemLabel="projects" query="" activeTag="Health" onClear={vi.fn()} />);

    const paragraph = container.querySelector('p');
    expect(paragraph?.textContent).toBe('No projects are tagged Health.');
    expect(screen.getByRole('button', { name: 'Clear tag filter' })).toBeInTheDocument();
  });

  it('renders the tag-only copy variant when query is whitespace-only (treated as unset)', () => {
    const { container } = render(<EmptyState itemLabel="projects" query="   " activeTag="Health" onClear={vi.fn()} />);

    const paragraph = container.querySelector('p');
    expect(paragraph?.textContent).toBe('No projects are tagged Health.');
    expect(screen.getByRole('button', { name: 'Clear tag filter' })).toBeInTheDocument();
  });

  it('renders the combined copy variant and a "Clear filters" button when both query and activeTag are set', () => {
    const { container } = render(
      <EmptyState itemLabel="projects" query="xyz" activeTag="Health" onClear={vi.fn()} />,
    );

    const paragraph = container.querySelector('p');
    expect(paragraph?.textContent).toBe('No projects match “xyz” tagged Health.');
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });

  it('calls onClear exactly once when the clear button is clicked', () => {
    const onClear = vi.fn();
    render(<EmptyState itemLabel="research entries" query="xyz" activeTag={null} onClear={onClear} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
