import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Project } from '@/data';

const trackEvent = vi.hoisted(() => vi.fn());
vi.mock('@/lib/analytics', () => ({ trackEvent }));

import { ProjectListSection } from './ProjectListSection';

function mk(slug: string, title: string, description: string, tags: string[]): Project {
  return {
    slug, title, description, image: `/images/${slug}.png`, tags: tags as Project['tags'],
    techTags: [], status: 'Completed', links: [{ label: 'GitHub', href: `https://github.com/x/${slug}` }],
    date: '2024-01-01', body: '', sites: ['main'],
  } as Project;
}

// Deliberately non-alphabetical, non-date order: input order must be kept.
const ITEMS = [
  mk('zeta', 'Zeta Tracker', 'Quantum widget for pigeons.', ['Health Tech']),
  mk('alpha', 'Alpha Notes', 'Banana ledger for accountants.', ['Developer Tools']),
  mk('mid', 'Mid Thing', 'Another helper app.', ['Health Tech']),
];

const titles = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
const PLACEHOLDER = 'Search projects by name, description, or tag';

function setup() {
  return render(<MemoryRouter><ProjectListSection items={ITEMS} /></MemoryRouter>);
}

afterEach(() => { cleanup(); trackEvent.mockClear(); });

describe('ProjectListSection', () => {
  it('keeps input order with no query', () => {
    setup();
    expect(titles()).toEqual(['Zeta Tracker', 'Alpha Notes', 'Mid Thing']);
  });

  it('search narrows results and updates the count', async () => {
    setup();
    fireEvent.change(screen.getByPlaceholderText(PLACEHOLDER), { target: { value: 'banana' } });
    await waitFor(() => expect(titles()).toEqual(['Alpha Notes']));
    expect(screen.getByText(/^1 /)).toBeInTheDocument();
  });

  it('a tag pill filters', () => {
    setup();
    const group = screen.getByRole('group', { name: 'Filter by tag' });
    fireEvent.click(Array.from(group.querySelectorAll('button')).find((b) => b.textContent === 'Developer Tools')!);
    expect(titles()).toEqual(['Alpha Notes']);
  });

  it('clearing from EmptyState restores the list', async () => {
    setup();
    fireEvent.change(screen.getByPlaceholderText(PLACEHOLDER), { target: { value: 'zzz-nothing-zzz' } });
    await waitFor(() => expect(screen.getByText(/No projects match/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    await waitFor(() => expect(titles()).toEqual(['Zeta Tracker', 'Alpha Notes', 'Mid Thing']));
  });

  it('card click fires project_card_click with slug, collection and title', () => {
    setup();
    fireEvent.click(screen.getByRole('link', { name: /Alpha Notes/ }));
    expect(trackEvent).toHaveBeenCalledWith('project_card_click', {
      slug: 'alpha', collection: 'projects', title: 'Alpha Notes',
    });
  });
});
