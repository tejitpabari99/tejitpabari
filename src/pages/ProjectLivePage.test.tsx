// src/pages/ProjectLivePage.test.tsx
//
// Task 22 per .dev/website-revamp/04-projects-research-pages/TASKS.md.
// ProjectLivePage is the dispatch point implementing SP02's liveMode()
// contract: a hosted-registered slug renders its HOSTED_LIVE_PAGES
// component; a liveUrl-only slug renders LiveRedirectFallback; a slug
// matching neither renders NotFoundPage. `@/data` and `./live/registry`
// are mocked per-test so each branch is exercised in isolation from real
// content.
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
      links: [],
      date: '2024-01-01',
      body: '',
    },
    {
      slug: 'juno',
      title: 'Juno',
      description: 'd',
      image: '/x.png',
      tags: ['Health Tech'],
      links: [],
      date: '2024-01-01',
      body: '',
      liveUrl: 'https://app.meetjuno.health',
    },
    {
      slug: 'neither-mode',
      title: 'Neither Mode',
      description: 'd',
      image: '/x.png',
      tags: ['Others'],
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
  it('renders the hosted component for a hosted-registered slug', () => {
    renderLivePage('sample-project');
    expect(screen.getByTestId('hosted-sample-project')).toBeInTheDocument();
  });

  it('renders LiveRedirectFallback for a liveUrl-only slug', () => {
    renderLivePage('juno');
    // LiveRedirectFallback's own visible copy names the label prop.
    expect(screen.getByText(/Redirecting you to Juno/i)).toBeInTheDocument();
    expect(screen.queryByTestId('hosted-sample-project')).not.toBeInTheDocument();
  });

  it('renders NotFoundPage for a slug matching neither mode', () => {
    renderLivePage('neither-mode');
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('renders NotFoundPage for a slug that matches no project at all', () => {
    renderLivePage('totally-unknown-slug');
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });
});
