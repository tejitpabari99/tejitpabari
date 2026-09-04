// src/sections/FeaturedProjectsSection.test.tsx
//
// Round 3.3 (owner clarification): every featured card's one overlay
// icon-link ALWAYS points at the internal /projects/<slug>/live URL, for
// every featured project, regardless of whether it declares `live` at
// all - rules 2/3 in src/lib/resolveLiveLinks.ts guarantee that URL
// resolves somewhere sensible even with no `live` field. Mocks
// @/config/featured with fixture projects so this only exercises the
// wiring: the overlay's href, and the live_link_click analytics call.
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

  it('ALSO shows the overlay link, pointed at the internal /live href, for a project with no "live" field at all', () => {
    renderSection();
    expect(screen.getByRole('link', { name: /Open No Live live/i })).toHaveAttribute('href', '/projects/no-live/live');
  });

  it("clicking the overlay fires trackEvent('live_link_click') with the project's title as the label, not outbound_click", () => {
    renderSection();
    fireEvent.click(screen.getByRole('link', { name: /Open Has Live live/i }));

    expect(trackEvent).toHaveBeenCalledWith('live_link_click', {
      url: '/projects/has-live/live',
      label: 'Has Live',
    });
  });
});
