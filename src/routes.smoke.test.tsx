import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routesBySite } from './routes';
import type { SiteId } from '@/data';

const pathsBySite: Record<SiteId, string[]> = {
  main: [
    '/', '/projects', '/projects/anything', '/projects/anything/live',
    '/work-experience', '/research', '/research/anything', '/research/anything/live', '/privacy', '/terms',
    '/404', '/this-does-not-exist',
  ],
  healthtech: ['/', '/projects/anything', '/404', '/this-does-not-exist'],
  nonprofit: ['/', '/projects', '/projects/anything', '/schedule', '/404', '/this-does-not-exist'],
};

// Main-only pages that must resolve to the 404 page on subsites.
const MAIN_ONLY_PATHS = [
  '/research', '/research/anything', '/research/anything/live',
  '/work-experience', '/privacy', '/terms', '/projects/anything/live',
];

class NoopIntersectionObserver {
  observe() {}

  disconnect() {}
}

describe.each(Object.keys(pathsBySite) as SiteId[])('route tree smoke test (%s)', (site) => {
  const routes = routesBySite[site];
  const paths = pathsBySite[site];

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', NoopIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(paths)('renders %s without throwing', (path) => {
    const router = createMemoryRouter(routes, { initialEntries: [path] });
    expect(() => render(<RouterProvider router={router} />)).not.toThrow();
  });

  // Round 3 (owner: "Remove back from all places ... navbar is good
  // enough"): the "back-only" chrome mode is gone - Nav is now
  // unconditionally rendered on every route.
  it.each(paths)('shows the navbar on %s (Nav is always rendered now)', (path) => {
    const router = createMemoryRouter(routes, { initialEntries: [path] });
    render(<RouterProvider router={router} />);
    const nav = screen.queryByRole('navigation', { name: 'Primary' });
    expect(nav).not.toBeNull();
  });

  if (site !== 'main') {
    it.each(MAIN_ONLY_PATHS)('does not route %s (falls to 404)', (path) => {
      const router = createMemoryRouter(routes, { initialEntries: [path] });
      render(<RouterProvider router={router} />);
      expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    });
  }
});
