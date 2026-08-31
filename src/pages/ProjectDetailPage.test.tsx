// src/pages/ProjectDetailPage.test.tsx
//
// Task 20 per .dev/website-revamp/04-projects-research-pages/TASKS.md —
// direct, mechanical proof of PRD §4.5's "verified by construction" claim:
// given a fixture project with body: '', description set, and a non-empty
// links[], the page renders the header, the description paragraph, and the
// links row, but NOTHING from ContentBody (no stray empty wrapper element
// where the body would have gone). Fixture data only, via mocking '@/data'
// — never the real loaded `projects` array.
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Project } from '@/data';

// vi.mock is hoisted above top-level const declarations, so the fixture
// itself must be created via vi.hoisted to be visible inside the factory.
const { FIXTURE_PROJECT } = vi.hoisted(() => ({
  FIXTURE_PROJECT: {
    slug: 'med-doc-tracker',
    title: 'Med-Doc Tracker',
    description: 'Track and organize medical documents in one place.',
    image: '/images/med-doc-tracker.png',
    tags: ['Health Tech'],
    status: 'Completed',
    links: [{ label: 'GitHub', href: 'https://github.com/x/med-doc-tracker' }],
    date: '2024-06-01',
    body: '', // deliberately empty — this is the case under test
  } satisfies Project,
}));

vi.mock('@/data', async () => {
  const actual = await vi.importActual<typeof import('@/data')>('@/data');
  return { ...actual, projects: [FIXTURE_PROJECT] };
});

import { ProjectDetailPage } from './ProjectDetailPage';

function renderPage(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/projects/${slug}`]}>
      <Routes>
        <Route path="/projects/:slug" element={<ProjectDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProjectDetailPage — empty body rendering', () => {
  it('renders the header (title), the description paragraph, and the links row', () => {
    renderPage('med-doc-tracker');
    expect(screen.getByRole('heading', { level: 1, name: 'Med-Doc Tracker' })).toBeInTheDocument();
    expect(screen.getByText(FIXTURE_PROJECT.description)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /GitHub/i })).toHaveAttribute(
      'href',
      'https://github.com/x/med-doc-tracker',
    );
  });

  it('renders nothing from ContentBody when body is empty — no stray wrapper element', () => {
    const { container } = renderPage('med-doc-tracker');
    // ContentBody's known wrapper is <div class="prose max-w-none">...
    // returning null for empty/whitespace body — must be absent entirely,
    // not present-but-empty.
    expect(container.querySelector('.prose')).toBeNull();
  });

  it('renders NotFoundPage for an unknown slug', () => {
    renderPage('does-not-exist');
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });
});
