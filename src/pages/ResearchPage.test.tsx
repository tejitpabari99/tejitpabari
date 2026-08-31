// src/pages/ResearchPage.test.tsx
//
// Coverage-audit gap E: ResearchPage's page-level composition (mirrors
// ProjectsPage.test.tsx's rationale — see that file's header comment) was
// previously only covered by src/routes.smoke.test.tsx's blanket
// `not.toThrow()` check. These tests render the real page against the
// real `research` content corpus and assert on actual DOM output.
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ResearchPage } from './ResearchPage';
import { research } from '@/data';

function renderResearchPage(initialEntries: string[] = ['/research']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ResearchPage />
    </MemoryRouter>,
  );
}

function cardTitles(): string[] {
  return screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
}

describe('ResearchPage', () => {
  it('renders one card per real research entry on first load, with no filter applied', () => {
    renderResearchPage();
    expect(cardTitles()).toHaveLength(research.length);
  });

  it('renders the EmptyState (no cards) for a search query matching nothing', async () => {
    renderResearchPage();
    const input = screen.getByPlaceholderText('Search research by title, topic, or tag');
    fireEvent.change(input, { target: { value: 'zzz-no-such-research-zzz' } });

    await waitFor(() => {
      expect(screen.getByText(/No research entries match/)).toBeInTheDocument();
    });
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
  });

  it('clicking a real tag pill narrows the grid to only research entries carrying that tag', async () => {
    renderResearchPage();
    const expectedTitles = research.filter((r) => r.tags.includes('Machine Learning')).map((r) => r.title);
    expect(expectedTitles.length).toBeGreaterThan(0);
    expect(expectedTitles.length).toBeLessThan(research.length); // a real narrowing, not a no-op

    fireEvent.click(screen.getByRole('button', { name: 'Machine Learning' }));

    await waitFor(() => {
      expect(cardTitles()).toHaveLength(expectedTitles.length);
    });
    expect(cardTitles().sort()).toEqual(expectedTitles.sort());
  });

  it('a `?tag=` URL param naming a tag no research entry carries degrades to EmptyState, not a crash', async () => {
    expect(() => renderResearchPage(['/research?tag=NoSuchTagAtAll'])).not.toThrow();

    await waitFor(() => {
      expect(screen.getByText(/No research entries are tagged/)).toBeInTheDocument();
    });
    expect(screen.getByText('NoSuchTagAtAll')).toBeInTheDocument();
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
  });
});
