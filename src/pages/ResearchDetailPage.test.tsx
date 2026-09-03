// src/pages/ResearchDetailPage.test.tsx
//
// Task 20 per .dev/website-revamp/04-projects-research-pages/TASKS.md —
// same "verified by construction" proof as ProjectDetailPage.test.tsx,
// for the Research collection. Fixture data only, via mocking '@/data' —
// never the real loaded `research` array.
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Research } from '@/data';

// vi.mock is hoisted above top-level const declarations, so the fixture
// itself must be created via vi.hoisted to be visible inside the factory.
const { FIXTURE_RESEARCH } = vi.hoisted(() => ({
  FIXTURE_RESEARCH: {
    slug: 'flood-event-extraction',
    title: 'Flood Event Extraction',
    description: 'Extracting flood events from satellite imagery using ML.',
    image: '/images/flood-event-extraction.png',
    tags: ['Machine Learning'],
    techTags: [],
    links: [{ label: 'Pre-print paper', href: 'https://arxiv.org/abs/x' }],
    date: '2023-11-01',
    body: '', // deliberately empty — this is the case under test
  } satisfies Research,
}));

vi.mock('@/data', async () => {
  const actual = await vi.importActual<typeof import('@/data')>('@/data');
  return { ...actual, research: [FIXTURE_RESEARCH] };
});

import { ResearchDetailPage } from './ResearchDetailPage';

function renderPage(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/research/${slug}`]}>
      <Routes>
        <Route path="/research/:slug" element={<ResearchDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ResearchDetailPage — empty body rendering', () => {
  it('renders the header (title), the description paragraph, and the links row', () => {
    renderPage('flood-event-extraction');
    expect(screen.getByRole('heading', { level: 1, name: 'Flood Event Extraction' })).toBeInTheDocument();
    expect(screen.getByText(FIXTURE_RESEARCH.description)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Pre-print paper/i })).toHaveAttribute('href', 'https://arxiv.org/abs/x');
  });

  it('renders nothing from ContentBody when body is empty — no stray wrapper element', () => {
    const { container } = renderPage('flood-event-extraction');
    // ContentBody's known wrapper is <div class="prose max-w-none">...
    // returning null for empty/whitespace body — must be absent entirely,
    // not present-but-empty.
    expect(container.querySelector('.prose')).toBeNull();
  });

  it('never renders an "Open Live" CTA (the /live subsystem was removed entirely; Research never had one)', () => {
    renderPage('flood-event-extraction');
    expect(screen.queryByRole('link', { name: /Open Live/i })).not.toBeInTheDocument();
  });

  it('renders NotFoundPage for an unknown slug', () => {
    renderPage('does-not-exist');
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });
});
