// src/sections/FeaturedProjectsSection.test.tsx
//
// Round 3.2 (owner: featured cards surface the live link too, as the
// card's one existing overlay icon-link — never branded "Live" since
// that overlay has no visible text at all, just an icon). Mocks
// @/config/featured with fixture projects so this only exercises the
// wiring: does the overlay appear/not appear, does it point at the
// internal /live href, and does clicking it fire live_link_click.
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Project } from '@/data';

const { FIXTURE_FEATURED } = vi.hoisted(() => ({
  FIXTURE_FEATURED: [
    {
      slug: 'has-live',
      title: 'Has Live',
      description: 'd',
      image: '/x.png',
      tags: ['Others'],
      techTags: [],
      links: [{ label: 'GitHub', href: 'https://github.com/x' }],
      date: '2024-01-01',
      body: '',
      live: { type: 'external', href: 'https://app.example.com' },
    },
    {
      slug: 'no-live',
      title: 'No Live',
      description: 'd',
      image: '/x.png',
      tags: ['Others'],
      techTags: [],
      links: [{ label: 'GitHub', href: 'https://github.com/x' }],
      date: '2024-01-01',
      body: '',
    },
  ] satisfies Project[],
}));

vi.mock('@/config/featured', () => ({
  featuredProjects: FIXTURE_FEATURED,
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

import { FeaturedProjectsSection } from './FeaturedProjectsSection';
import { trackEvent } from '@/lib/analytics';

function renderSection() {
  return render(
    <MemoryRouter>
      <FeaturedProjectsSection />
    </MemoryRouter>,
  );
}

describe('FeaturedProjectsSection', () => {
  it('shows the overlay link, pointed at the internal /live href, for a project with a "live" field', () => {
    renderSection();
    expect(screen.getByRole('link', { name: /Open Has Live live/i })).toHaveAttribute('href', '/projects/has-live/live');
  });

  it('shows no overlay link at all for a project with no "live" field', () => {
    renderSection();
    expect(screen.queryByRole('link', { name: /Open No Live live/i })).not.toBeInTheDocument();
  });

  it("clicking the overlay fires trackEvent('live_link_click'), not outbound_click", () => {
    renderSection();
    fireEvent.click(screen.getByRole('link', { name: /Open Has Live live/i }));

    expect(trackEvent).toHaveBeenCalledWith('live_link_click', {
      url: '/projects/has-live/live',
      label: 'GitHub', // inherited from the only (and therefore "first") links[] entry
    });
  });
});
