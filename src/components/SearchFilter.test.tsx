// src/components/SearchFilter.test.tsx
//
// Task 18 per .dev/website-revamp/04-projects-research-pages/TASKS.md —
// covers Task 2's acceptance criteria for the pure-presentational
// SearchFilter component. Fixture props only.
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SearchFilter } from './SearchFilter';

function renderFilter(props: Partial<React.ComponentProps<typeof SearchFilter>> = {}) {
  return render(
    <SearchFilter
      query=""
      onQueryChange={vi.fn()}
      tags={[]}
      activeTag={null}
      onTagChange={vi.fn()}
      resultCount={0}
      placeholder="Search projects by name, description, or tag"
      {...props}
    />,
  );
}

describe('SearchFilter', () => {
  it('renders zero TagPills — the tag-filter group is omitted entirely — when tags is empty', () => {
    renderFilter({ tags: [] });
    expect(screen.queryByRole('group', { name: 'Filter by tag' })).not.toBeInTheDocument();
  });

  it('renders the singular "1 result" copy when resultCount is 1', () => {
    renderFilter({ resultCount: 1 });
    expect(screen.getByText('1 result')).toBeInTheDocument();
  });

  it('renders the plural "N results" copy when resultCount is not 1 (including 0)', () => {
    const { rerender } = renderFilter({ resultCount: 0 });
    expect(screen.getByText('0 results')).toBeInTheDocument();

    rerender(
      <SearchFilter
        query=""
        onQueryChange={vi.fn()}
        tags={[]}
        activeTag={null}
        onTagChange={vi.fn()}
        resultCount={5}
        placeholder="Search projects by name, description, or tag"
      />,
    );
    expect(screen.getByText('5 results')).toBeInTheDocument();
  });

  it('calls onQueryChange with the new value on every keystroke — no debouncing of its own', () => {
    const onQueryChange = vi.fn();
    renderFilter({ onQueryChange, placeholder: 'Search projects' });

    const input = screen.getByPlaceholderText('Search projects');
    fireEvent.change(input, { target: { value: 'j' } });
    fireEvent.change(input, { target: { value: 'ju' } });
    fireEvent.change(input, { target: { value: 'juno' } });

    expect(onQueryChange).toHaveBeenCalledTimes(3);
    expect(onQueryChange).toHaveBeenNthCalledWith(1, 'j');
    expect(onQueryChange).toHaveBeenNthCalledWith(2, 'ju');
    expect(onQueryChange).toHaveBeenNthCalledWith(3, 'juno');
  });

  it('clicking a non-active tag calls onTagChange with that tag', () => {
    const onTagChange = vi.fn();
    renderFilter({ tags: ['Health Tech', 'Developer Tools'], activeTag: null, onTagChange });

    fireEvent.click(screen.getByText('Health Tech'));

    expect(onTagChange).toHaveBeenCalledTimes(1);
    expect(onTagChange).toHaveBeenCalledWith('Health Tech');
  });

  it('clicking the currently-active tag calls onTagChange with null (single-select, click-to-clear)', () => {
    const onTagChange = vi.fn();
    renderFilter({ tags: ['Health Tech'], activeTag: 'Health Tech', onTagChange });

    fireEvent.click(screen.getByText('Health Tech'));

    expect(onTagChange).toHaveBeenCalledTimes(1);
    expect(onTagChange).toHaveBeenCalledWith(null);
  });
});
