// src/pages/ProjectLivePage.test.tsx
//
// Round 3.1 restoration of the /live subsystem. ProjectLivePage is the
// dispatch point: a `live.type === 'self'` project renders its
// HOSTED_LIVE_PAGES component, a `live.type === 'external'` project
// renders LiveRedirectFallback pointed at its href, a project with no
// `live` field at all renders LiveRedirectFallback pointed at its own
// detail page, and an unknown slug renders NotFoundPage. `@/data` and
// `./live/registry` are mocked per-test so each branch is exercised in
// isolation from real content.
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Project } from '@/data';

const { FIXTURE_PROJECTS } = vi.hoisted(() => ({
  FIXTURE_PROJECTS: [
    {
      slug: 'sample-project',
      title: 'Sample Project',
      description: 'd',
      image: '/x.png',
      tags: ['Others'],
      techTags: [],
      links: [],
      date: '2024-01-01',
      body: '',
      live: { type: 'self', page: 'sample-project', label: 'Live', icon: 'globe' },
    },
    {
      slug: 'juno',
      title: 'Juno',
      description: 'd',
      image: '/x.png',
      tags: ['Health Tech'],
      techTags: [],
      links: [],
      date: '2024-01-01',
      body: '',
      live: { type: 'external', href: 'https://app.meetjuno.health', label: 'Live', icon: 'globe' },
    },
    {
      slug: 'no-live-field',
      title: 'No Live Field',
      description: 'd',
      image: '/x.png',
      tags: ['Others'],
      techTags: [],
      links: [],
      date: '2024-01-01',
      body: '',
    },
  ] satisfies Project[],
}));

vi.mock('@/data', async () => {
  const actual = await vi.importActual<typeof import('@/data')>('@/data');
  return { ...actual, projects: FIXTURE_PROJECTS };
});

// A distinguishing hosted component, registered only for 'sample-project'.
vi.mock('./live/registry', () => ({
  HOSTED_LIVE_PAGES: {
    'sample-project': () => <div data-testid="hosted-sample-project">Hosted sample project content</div>,
  },
}));

import { ProjectLivePage } from './ProjectLivePage';

function renderLivePage(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/projects/${slug}/live`]}>
      <Routes>
        <Route path="/projects/:slug/live" element={<ProjectLivePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProjectLivePage dispatch', () => {
  it('renders the hosted component for a live.type: self project', () => {
    renderLivePage('sample-project');
    expect(screen.getByTestId('hosted-sample-project')).toBeInTheDocument();
  });

  it('renders LiveRedirectFallback pointed at href for a live.type: external project', () => {
    renderLivePage('juno');
    // LiveRedirectFallback's own visible copy names the label prop.
    expect(screen.getByText(/Redirecting you to Juno/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /click here/i })).toHaveAttribute('href', 'https://app.meetjuno.health');
    expect(screen.queryByTestId('hosted-sample-project')).not.toBeInTheDocument();
  });

  it('renders LiveRedirectFallback pointed at the detail page for a project with no "live" field at all', () => {
    renderLivePage('no-live-field');
    expect(screen.getByText(/Redirecting you to No Live Field/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /click here/i })).toHaveAttribute('href', '/projects/no-live-field');
  });

  it('renders NotFoundPage for a slug that matches no project at all', () => {
    renderLivePage('totally-unknown-slug');
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });
});
