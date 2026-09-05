// src/pages/ResearchLivePage.test.tsx
//
// Same dispatch contract as ProjectLivePage.test.tsx (see that file's
// header comment), applied to the research collection.
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Research } from '@/data';

const { FIXTURE_RESEARCH } = vi.hoisted(() => ({
  FIXTURE_RESEARCH: [
    {
      slug: 'sample-research',
      title: 'Sample Research',
      description: 'd',
      image: '/x.png',
      tags: ['Other'],
      techTags: [],
      links: [],
      date: '2024-01-01',
      body: '',
      live: { type: 'self', page: 'sample-research', label: 'Live', icon: 'globe' },
    },
    {
      slug: 'external-research',
      title: 'External Research',
      description: 'd',
      image: '/x.png',
      tags: ['Health'],
      techTags: [],
      links: [],
      date: '2024-01-01',
      body: '',
      live: { type: 'external', href: 'https://example.com/study', label: 'Live', icon: 'globe' },
    },
    {
      slug: 'no-live-field',
      title: 'No Live Field',
      description: 'd',
      image: '/x.png',
      tags: ['Other'],
      techTags: [],
      links: [],
      date: '2024-01-01',
      body: '',
    },
    {
      slug: 'links-fallback',
      title: 'Links Fallback',
      description: 'd',
      image: '/x.png',
      tags: ['Other'],
      techTags: [],
      links: [{ label: 'Preprint', href: 'https://arxiv.org/abs/x' }],
      date: '2024-01-01',
      body: '',
      // No `live` field at all - rule 2 falls back to links[0] since
      // nothing is marked primary.
    },
  ] satisfies Research[],
}));

vi.mock('@/data', async () => {
  const actual = await vi.importActual<typeof import('@/data')>('@/data');
  return { ...actual, research: FIXTURE_RESEARCH };
});

vi.mock('./live/registry', () => ({
  HOSTED_LIVE_PAGES: {
    'sample-research': () => <div data-testid="hosted-sample-research">Hosted sample research content</div>,
  },
}));

import { ResearchLivePage } from './ResearchLivePage';

function renderLivePage(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/research/${slug}/live`]}>
      <Routes>
        <Route path="/research/:slug/live" element={<ResearchLivePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ResearchLivePage dispatch', () => {
  it('renders the hosted component for a live.type: self research entry', () => {
    renderLivePage('sample-research');
    expect(screen.getByTestId('hosted-sample-research')).toBeInTheDocument();
  });

  it('renders LiveRedirectFallback pointed at href for a live.type: external research entry', () => {
    renderLivePage('external-research');
    expect(screen.getByText(/Redirecting you to External Research/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /click here/i })).toHaveAttribute('href', 'https://example.com/study');
  });

  it('still renders RouteMeta (a real <title>) on the redirect branch, not just the hosted-component branch', () => {
    renderLivePage('external-research');
    expect(document.title).toBe('External Research · Tejit Pabari');
  });

  it('renders LiveRedirectFallback pointed at the detail page for a research entry with no "live" field and no links[] (rule 3)', () => {
    renderLivePage('no-live-field');
    expect(screen.getByText(/Redirecting you to No Live Field/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /click here/i })).toHaveAttribute('href', '/research/no-live-field');
  });

  it('renders LiveRedirectFallback pointed at links[0] for a research entry with no "live" field but links present (rule 2)', () => {
    renderLivePage('links-fallback');
    expect(screen.getByText(/Redirecting you to Links Fallback/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /click here/i })).toHaveAttribute('href', 'https://arxiv.org/abs/x');
  });

  it('renders NotFoundPage for a slug that matches no research entry at all', () => {
    renderLivePage('totally-unknown-slug');
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });
});
