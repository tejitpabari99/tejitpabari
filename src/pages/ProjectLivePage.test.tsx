// src/pages/ProjectLivePage.test.tsx
//
// Round 3.1 restoration of the /live subsystem, revised in round 3.3 (see
// src/lib/resolveLiveLinks.ts's header comment for the three-rule
// resolution order this dispatches on). ProjectLivePage: a
// `live.type === 'self'` project renders its HOSTED_LIVE_PAGES component
// (rule 1); a `live.type === 'external'` project renders
// LiveRedirectFallback pointed at its href (rule 1); a project with no
// `live` field but a non-empty links[] renders LiveRedirectFallback
// pointed at the primary/first link (rule 2); a project with neither
// renders LiveRedirectFallback pointed at its own detail page (rule 3);
// and an unknown slug renders NotFoundPage. `@/data` and `./live/registry`
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
    {
      slug: 'links-fallback',
      title: 'Links Fallback',
      description: 'd',
      image: '/x.png',
      tags: ['Others'],
      techTags: [],
      links: [
        { label: 'GitHub', href: 'https://github.com/x' },
        { label: 'Website', href: 'https://example.com', primary: true },
      ],
      date: '2024-01-01',
      body: '',
      // No `live` field at all - rule 2 should pick the primary link.
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

  it('renders LiveRedirectFallback pointed at the detail page for a project with no "live" field and no links[] (rule 3)', () => {
    renderLivePage('no-live-field');
    expect(screen.getByText(/Redirecting you to No Live Field/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /click here/i })).toHaveAttribute('href', '/projects/no-live-field');
  });

  it('renders LiveRedirectFallback pointed at the primary links[] entry for a project with no "live" field but links present (rule 2)', () => {
    renderLivePage('links-fallback');
    expect(screen.getByText(/Redirecting you to Links Fallback/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /click here/i })).toHaveAttribute('href', 'https://example.com');
  });

  it('renders NotFoundPage for a slug that matches no project at all', () => {
    renderLivePage('totally-unknown-slug');
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });
});
