// src/pages/ProjectsPage.test.tsx
//
// Coverage-audit gap E: ProjectsPage's page-level composition
// (useCollectionFilter + SearchFilter + EmptyState + ProjectCard, wired
// together against the REAL `projects` data) was previously only covered
// by src/routes.smoke.test.tsx's blanket `not.toThrow()` check. These
// tests render the real page against the real content corpus and assert
// on actual DOM output: a query matching nothing renders EmptyState, a
// real tag-filter click narrows the visible grid, and a `?tag=` URL param
// naming a tag nothing carries degrades to EmptyState instead of crashing
// or silently showing every card.
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectsPage } from './ProjectsPage';
import { projects } from '@/data';

function renderProjectsPage(initialEntries: string[] = ['/projects']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ProjectsPage />
    </MemoryRouter>,
  );
}

function cardTitles(): string[] {
  return screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
}

describe('ProjectsPage', () => {
  it('renders one card per real project on first load, with no filter applied', () => {
    renderProjectsPage();
    expect(cardTitles()).toHaveLength(projects.length);
  });

  it('renders the EmptyState (no cards) for a search query matching nothing', async () => {
    renderProjectsPage();
    const input = screen.getByPlaceholderText('Search projects by name, description, or tag');
    fireEvent.change(input, { target: { value: 'zzz-no-such-project-zzz' } });

    await waitFor(() => {
      expect(screen.getByText(/No projects match/)).toBeInTheDocument();
    });
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
  });

  it('clicking a real tag pill narrows the grid to only projects carrying that tag', async () => {
    renderProjectsPage();
    const expectedSlugs = projects.filter((p) => p.tags.includes('Health Tech')).map((p) => p.title);
    expect(expectedSlugs.length).toBeGreaterThan(0);
    expect(expectedSlugs.length).toBeLessThan(projects.length); // a real narrowing, not a no-op

    fireEvent.click(screen.getByRole('button', { name: 'Health Tech' }));

    await waitFor(() => {
      expect(cardTitles()).toHaveLength(expectedSlugs.length);
    });
    expect(cardTitles().sort()).toEqual(expectedSlugs.sort());
  });

  it('a `?tag=` URL param naming a tag no project carries degrades to EmptyState, not a crash', async () => {
    expect(() => renderProjectsPage(['/projects?tag=NoSuchTagAtAll'])).not.toThrow();

    await waitFor(() => {
      expect(screen.getByText(/No projects are tagged/)).toBeInTheDocument();
    });
    expect(screen.getByText('NoSuchTagAtAll')).toBeInTheDocument();
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
  });
});
