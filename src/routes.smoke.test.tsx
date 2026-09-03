import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';

const paths = [
  '/', '/projects', '/projects/anything',
  '/work-experience', '/research', '/research/anything', '/privacy', '/terms',
  '/404', '/this-does-not-exist',
];

class NoopIntersectionObserver {
  observe() {}

  disconnect() {}
}

describe('route tree smoke test', () => {
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
});
